#!/usr/bin/env python3
"""
Qlivn OS — Raspberry Pi Controller
Runs on-device as a systemd service. Handles:
  - PIR motion sensor (GPIO 17) → reports to Supabase
  - Door/window magnetic sensor (GPIO 27)
  - Relay for AC/lighting eco mode (GPIO 22)
  - Flask HTTP API for edge function commands
  - Heartbeat to Supabase sensors_data every 60s
"""

import os
import time
import threading
import requests
import RPi.GPIO as GPIO
from flask import Flask, request, jsonify
from datetime import datetime, timezone

# ── Config (set via environment or .env file) ───────────────────
SUPABASE_URL      = os.environ['SUPABASE_URL']
SUPABASE_KEY      = os.environ['SUPABASE_SERVICE_ROLE_KEY']
UNIT_ID           = os.environ['UNIT_ID']        # UUID of this physical unit
SILENT_EXIT_URL   = os.environ.get('SILENT_EXIT_EDGE_URL', '')
ECO_MODE_URL      = os.environ.get('ECO_MODE_EDGE_URL', '')
PI_PORT           = int(os.environ.get('PI_PORT', 8000))

# ── GPIO Pin Mapping ─────────────────────────────────────────────
PIN_PIR    = 17   # PIR motion sensor (HC-SR501)
PIN_DOOR   = 27   # Magnetic door sensor (NO = door closed)
PIN_RELAY  = 22   # Relay: AC + lighting kill (LOW = off)

# ── State ────────────────────────────────────────────────────────
state = {
    'motion':       False,
    'door_open':    False,
    'eco_mode':     False,
    'last_motion':  None,   # datetime
}

# ── GPIO Setup ───────────────────────────────────────────────────
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(PIN_PIR,   GPIO.IN)
GPIO.setup(PIN_DOOR,  GPIO.IN, pull_up_down=GPIO.PUD_UP)
GPIO.setup(PIN_RELAY, GPIO.OUT, initial=GPIO.HIGH)   # HIGH = relay off


# ── Supabase helpers ─────────────────────────────────────────────
def supabase_headers() -> dict:
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
    }

def push_sensor_state():
    payload = {
        'unit_id':         UNIT_ID,
        'motion_detected': state['motion'],
        'door_opened':     state['door_open'],
        'last_heartbeat':  datetime.now(timezone.utc).isoformat(),
    }
    try:
        requests.post(
            f'{SUPABASE_URL}/rest/v1/sensors_data',
            json=payload,
            headers=supabase_headers(),
            timeout=5,
        )
    except Exception as e:
        print(f'[sensor push error] {e}')

def log_event(event_type: str, details: dict):
    try:
        requests.post(
            f'{SUPABASE_URL}/rest/v1/activity_logs',
            json={'unit_id': UNIT_ID, 'event_type': event_type, 'details': details},
            headers=supabase_headers(),
            timeout=5,
        )
    except Exception as e:
        print(f'[log event error] {e}')


# ── Sensor callbacks ─────────────────────────────────────────────
MOTION_COOLDOWN_S = 30   # seconds between motion events pushed to DB

_last_motion_push = 0.0

def on_motion(channel):
    global _last_motion_push
    now = time.time()
    detected = GPIO.input(PIN_PIR) == GPIO.HIGH
    state['motion'] = detected
    if detected:
        state['last_motion'] = datetime.now(timezone.utc)
        if state['eco_mode']:
            eco_off()
        # Throttle DB pushes
        if now - _last_motion_push > MOTION_COOLDOWN_S:
            _last_motion_push = now
            log_event('GUEST_ENTERED', {'source': 'pir'})
            push_sensor_state()
    else:
        push_sensor_state()
        check_silent_exit()

def on_door(channel):
    opened = GPIO.input(PIN_DOOR) == GPIO.LOW   # LOW when door opens (NC circuit breaks)
    state['door_open'] = opened
    event = 'DOOR_OPENED' if opened else 'DOOR_CLOSED'
    log_event(event, {'pin': PIN_DOOR})
    push_sensor_state()

GPIO.add_event_detect(PIN_PIR,  GPIO.BOTH,    callback=on_motion, bouncetime=500)
GPIO.add_event_detect(PIN_DOOR, GPIO.BOTH,    callback=on_door,   bouncetime=200)


# ── Silent exit detection ─────────────────────────────────────────
SILENT_THRESHOLD_MIN = 45   # minutes with no motion → possible silent exit

def check_silent_exit():
    if not state['last_motion']:
        return
    silent_min = (datetime.now(timezone.utc) - state['last_motion']).total_seconds() / 60
    if silent_min >= SILENT_THRESHOLD_MIN and SILENT_EXIT_URL:
        try:
            requests.post(SILENT_EXIT_URL, json={
                'unit_id': UNIT_ID,
                'silent_since': state['last_motion'].isoformat(),
            }, timeout=8)
        except Exception as e:
            print(f'[silent-exit call error] {e}')


# ── Eco mode ─────────────────────────────────────────────────────
def eco_on():
    GPIO.output(PIN_RELAY, GPIO.LOW)    # Cut power to AC/lighting
    state['eco_mode'] = True
    log_event('ECO_MODE_ON', {'relay': PIN_RELAY})
    print('[eco] ECO MODE ON — relay cut')

def eco_off():
    GPIO.output(PIN_RELAY, GPIO.HIGH)   # Restore power
    state['eco_mode'] = False
    log_event('ECO_MODE_OFF', {'relay': PIN_RELAY})
    print('[eco] ECO MODE OFF — relay restored')


# ── Flask HTTP API (called by edge functions) ─────────────────────
app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'ok': True,
        'unit_id': UNIT_ID,
        'state': {
            **state,
            'last_motion': state['last_motion'].isoformat() if state['last_motion'] else None,
        },
    })

@app.route('/eco', methods=['POST'])
def eco_endpoint():
    data   = request.get_json(force=True, silent=True) or {}
    action = data.get('action', 'eco_on')
    if action == 'eco_on':
        eco_on()
    elif action == 'eco_off':
        eco_off()
    return jsonify({'ok': True, 'eco': state['eco_mode']})

@app.route('/relay', methods=['POST'])
def relay_endpoint():
    data = request.get_json(force=True, silent=True) or {}
    on   = data.get('on', True)
    if on:
        GPIO.output(PIN_RELAY, GPIO.HIGH)
    else:
        GPIO.output(PIN_RELAY, GPIO.LOW)
    return jsonify({'ok': True, 'relay': 'on' if on else 'off'})

@app.route('/status', methods=['GET'])
def status_endpoint():
    push_sensor_state()
    return jsonify({'ok': True})


# ── Heartbeat thread ─────────────────────────────────────────────
def heartbeat_loop():
    while True:
        push_sensor_state()
        time.sleep(60)


# ── Entrypoint ───────────────────────────────────────────────────
if __name__ == '__main__':
    print(f'[qlivn] Starting controller for unit {UNIT_ID}')

    hb = threading.Thread(target=heartbeat_loop, daemon=True)
    hb.start()

    try:
        app.run(host='0.0.0.0', port=PI_PORT, debug=False)
    except KeyboardInterrupt:
        pass
    finally:
        GPIO.cleanup()
        print('[qlivn] GPIO cleaned up. Bye.')
