<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Property Hub | نظام إدارة الأملاك</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&family=Reem+Kufi:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/chart.js/4.4.0/chart.umd.min.js"></script>
<style>
  :root {
    --bg: #0e1116; --bg-elev: #161a22; --bg-card: #1c2230;
    --border: #2a3142; --accent: #d4a574; --accent-2: #e8c9a0;
    --text: #e8eaed; --muted: #8b94a3;
    --success: #5fb878; --danger: #e56b6f; --warning: #f0c674;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Tajawal', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh;
    background-image: radial-gradient(circle at 20% 10%, rgba(212, 165, 116, 0.06) 0%, transparent 40%), radial-gradient(circle at 80% 90%, rgba(212, 165, 116, 0.04) 0%, transparent 40%);
  }
  h1, h2, h3 { font-family: 'Reem Kufi', sans-serif; }

  /* LOGIN */
  .auth-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .auth-box { background: var(--bg-elev); border: 1px solid var(--border); border-radius: 20px; padding: 40px; width: 100%; max-width: 440px; position: relative; overflow: hidden; }
  .auth-box::before { content: ''; position: absolute; top: -50%; right: -30%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(212,165,116,0.12), transparent 70%); pointer-events: none; }
  .auth-logo { width: 60px; height: 60px; background: linear-gradient(135deg, var(--accent), var(--accent-2)); border-radius: 14px; display: grid; place-items: center; font-family: 'Reem Kufi', sans-serif; font-weight: 700; color: #0e1116; font-size: 28px; margin-bottom: 24px; position: relative; }
  .auth-box h2 { font-size: 26px; margin-bottom: 6px; position: relative; }
  .auth-box p.subtitle { color: var(--muted); font-size: 14px; margin-bottom: 28px; position: relative; }
  .auth-tabs { display: flex; gap: 4px; background: var(--bg-card); padding: 4px; border-radius: 10px; margin-bottom: 22px; position: relative; }
  .auth-tab { flex: 1; padding: 9px; text-align: center; border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--muted); transition: all 0.2s; font-weight: 500; }
  .auth-tab.active { background: var(--accent); color: #0e1116; }
  .auth-form { position: relative; }
  .role-select { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; }
  .role-option { padding: 10px; border: 1px solid var(--border); border-radius: 9px; text-align: center; cursor: pointer; font-size: 13px; transition: all 0.2s; background: var(--bg-card); }
  .role-option.active { border-color: var(--accent); background: rgba(212, 165, 116, 0.1); color: var(--accent); }
  .error-msg { background: rgba(229, 107, 111, 0.1); color: var(--danger); padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; display: none; }
  .error-msg.show { display: block; }
  .info-msg { background: rgba(95, 184, 120, 0.1); color: var(--success); padding: 10px 14px; border-radius: 8px; font-size: 13px; margin-bottom: 14px; display: none; }
  .info-msg.show { display: block; }

  /* HEADER */
  header { border-bottom: 1px solid var(--border); background: rgba(14, 17, 22, 0.85); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; }
  .header-inner { max-width: 1280px; margin: 0 auto; padding: 16px 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .logo { width: 42px; height: 42px; background: linear-gradient(135deg, var(--accent), var(--accent-2)); border-radius: 10px; display: grid; place-items: center; font-family: 'Reem Kufi', sans-serif; font-weight: 700; color: #0e1116; font-size: 20px; }
  .brand-name { font-family: 'Reem Kufi', sans-serif; font-size: 19px; font-weight: 600; }
  .brand-sub { font-size: 11px; color: var(--muted); }
  nav ul { display: flex; list-style: none; gap: 4px; flex-wrap: wrap; }
  nav a { padding: 8px 14px; color: var(--muted); text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 500; transition: all 0.2s; cursor: pointer; }
  nav a:hover { color: var(--text); background: var(--bg-elev); }
  nav a.active { color: var(--accent); background: rgba(212, 165, 116, 0.1); }
  .user-chip { display: flex; align-items: center; gap: 10px; padding: 6px 6px 6px 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 30px; font-size: 13px; }
  .user-avatar { width: 28px; height: 28px; background: linear-gradient(135deg, var(--accent), var(--accent-2)); border-radius: 50%; display: grid; place-items: center; color: #0e1116; font-weight: 700; font-size: 12px; }
  .logout-btn { background: transparent; border: none; color: var(--muted); cursor: pointer; padding: 4px 8px; font-size: 12px; border-radius: 6px; }
  .logout-btn:hover { color: var(--danger); }

  /* LAYOUT */
  .container { max-width: 1280px; margin: 0 auto; padding: 28px; }
  .page { display: none; }
  .page.active { display: block; }
  .page-head { margin-bottom: 28px; }
  .page-head h1 { font-size: 32px; font-weight: 600; margin-bottom: 6px; letter-spacing: -0.5px; }
  .page-head p { color: var(--muted); font-size: 14px; }

  /* STATS */
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 32px; }
  .stat { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 18px; position: relative; overflow: hidden; }
  .stat::before { content: ''; position: absolute; top: 0; right: 0; width: 80px; height: 80px; background: radial-gradient(circle, rgba(212,165,116,0.08), transparent 70%); }
  .stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .stat-value { font-family: 'Reem Kufi', sans-serif; font-size: 28px; font-weight: 600; }
  .stat-trend { font-size: 11px; color: var(--success); margin-top: 4px; }
  .section-title { font-size: 20px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
  .section-title::before { content: ''; width: 4px; height: 20px; background: var(--accent); border-radius: 2px; }

  /* TEMPLATES */
  .templates { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 36px; }
  .template-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 22px; cursor: pointer; transition: all 0.25s ease; position: relative; overflow: hidden; }
  .template-card:hover { border-color: var(--accent); transform: translateY(-3px); }
  .template-icon { width: 46px; height: 46px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 14px; font-size: 22px; }
  .icon-owner { background: rgba(95, 184, 120, 0.15); color: var(--success); }
  .icon-tenant { background: rgba(240, 198, 116, 0.15); color: var(--warning); }
  .icon-company { background: rgba(212, 165, 116, 0.15); color: var(--accent); }
  .template-card h3 { font-size: 17px; margin-bottom: 5px; }
  .template-card p { color: var(--muted); font-size: 12.5px; margin-bottom: 14px; line-height: 1.6; }
  .template-meta { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--border); font-size: 11px; color: var(--muted); }
  .badge { background: rgba(212, 165, 116, 0.12); color: var(--accent); padding: 3px 9px; border-radius: 20px; font-size: 10.5px; font-weight: 500; }

  /* MODAL */
  .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 200; align-items: flex-start; justify-content: center; padding: 30px 16px; overflow-y: auto; }
  .modal-overlay.show { display: flex; }
  .modal { background: var(--bg-elev); border: 1px solid var(--border); border-radius: 16px; max-width: 720px; width: 100%; padding: 28px; margin: auto; }
  .modal-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
  .modal-head h2 { font-size: 20px; margin-bottom: 4px; }
  .modal-head p { color: var(--muted); font-size: 12.5px; }
  .close-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); width: 34px; height: 34px; border-radius: 8px; cursor: pointer; font-size: 16px; }
  .close-btn:hover { color: var(--text); border-color: var(--accent); }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-group.full { grid-column: 1 / -1; }
  label { display: block; font-size: 12.5px; color: var(--muted); margin-bottom: 5px; font-weight: 500; }
  input, select, textarea { width: 100%; background: var(--bg-card); border: 1px solid var(--border); color: var(--text); padding: 10px 13px; border-radius: 9px; font-family: 'Tajawal', sans-serif; font-size: 13.5px; transition: border-color 0.2s; }
  input:focus, select:focus, textarea:focus { outline: none; border-color: var(--accent); }
  textarea { resize: vertical; min-height: 70px; }
  .form-actions { display: flex; gap: 10px; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border); flex-wrap: wrap; }
  button.primary, button.secondary, button.danger { padding: 10px 20px; border-radius: 9px; font-family: 'Tajawal', sans-serif; font-size: 13.5px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
  button.primary { background: var(--accent); color: #0e1116; }
  button.primary:hover { background: var(--accent-2); }
  button.secondary { background: transparent; color: var(--text); border: 1px solid var(--border); }
  button.secondary:hover { border-color: var(--accent); }
  button.danger { background: transparent; color: var(--danger); border: 1px solid rgba(229, 107, 111, 0.3); }

  /* RECORDS */
  .records { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
  .records-head { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 12px; }
  .records-head h3 { font-size: 15px; }
  .filter-bar { display: flex; gap: 6px; flex-wrap: wrap; }
  .filter-chip { padding: 5px 12px; background: var(--bg-elev); border: 1px solid var(--border); border-radius: 20px; font-size: 12px; cursor: pointer; color: var(--muted); transition: all 0.2s; }
  .filter-chip.active { background: var(--accent); color: #0e1116; border-color: var(--accent); }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; min-width: 700px; }
  th, td { padding: 12px 20px; text-align: right; font-size: 13px; }
  th { background: var(--bg-elev); color: var(--muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; font-size: 11px; }
  tr { border-bottom: 1px solid var(--border); }
  tr:last-child { border-bottom: none; }
  tr:hover td { background: rgba(212, 165, 116, 0.03); }
  .tag { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
  .tag-owner { background: rgba(95, 184, 120, 0.15); color: var(--success); }
  .tag-tenant { background: rgba(240, 198, 116, 0.15); color: var(--warning); }
  .tag-company { background: rgba(212, 165, 116, 0.15); color: var(--accent); }
  .action-btn { background: transparent; border: 1px solid var(--border); color: var(--text); padding: 5px 10px; border-radius: 6px; font-size: 11.5px; cursor: pointer; margin-left: 4px; font-family: 'Tajawal', sans-serif; }
  .action-btn:hover { border-color: var(--accent); color: var(--accent); }
  .action-btn.del:hover { border-color: var(--danger); color: var(--danger); }
  .empty { padding: 50px 20px; text-align: center; color: var(--muted); }
  .empty-icon { font-size: 40px; margin-bottom: 10px; opacity: 0.4; }

  /* ALERTS */
  .alert-list { display: grid; gap: 10px; margin-bottom: 32px; }
  .alert { background: var(--bg-card); border: 1px solid var(--border); border-right: 3px solid var(--warning); padding: 14px 18px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; }
  .alert.urgent { border-right-color: var(--danger); }
  .alert-content { flex: 1; min-width: 200px; }
  .alert-title { font-weight: 600; font-size: 14px; margin-bottom: 3px; }
  .alert-desc { font-size: 12.5px; color: var(--muted); }
  .alert-days { font-size: 12px; font-weight: 600; }
  .alert-days.warn { color: var(--warning); }
  .alert-days.danger { color: var(--danger); }

  /* REPORTS */
  .reports-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
  .chart-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 22px; }
  .chart-card h3 { font-size: 16px; margin-bottom: 16px; }
  .chart-wrap { position: relative; height: 260px; }
  .summary-row { display: flex; justify-content: space-between; padding: 11px 0; border-bottom: 1px solid var(--border); font-size: 13.5px; }
  .summary-row:last-child { border-bottom: none; }
  .summary-row .lbl { color: var(--muted); }
  .summary-row .val { font-weight: 600; }

  /* SETTINGS */
  .setting-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 22px; margin-bottom: 16px; }
  .setting-card h3 { font-size: 16px; margin-bottom: 8px; }
  .setting-card p { font-size: 13px; color: var(--muted); margin-bottom: 14px; }
  .partners-list { display: grid; gap: 10px; }
  .partner-item { background: var(--bg-elev); padding: 12px 16px; border-radius: 9px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
  .partner-info { font-size: 13.5px; }
  .partner-info strong { display: block; margin-bottom: 2px; }
  .partner-info span { color: var(--muted); font-size: 12px; }
  .role-badge { background: rgba(212, 165, 116, 0.15); color: var(--accent); padding: 3px 10px; border-radius: 20px; font-size: 11px; margin-right: 6px; }

  /* TOAST */
  .toast { position: fixed; bottom: 30px; right: 30px; background: var(--bg-elev); border: 1px solid var(--success); border-right: 4px solid var(--success); padding: 14px 22px; border-radius: 10px; font-size: 13.5px; z-index: 300; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  .toast.show { display: block; }

  /* AUTH MODE SELECTOR (Partner vs Owner login) */
  .auth-mode-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 22px; padding: 4px; background: var(--bg-card); border-radius: 10px; }
  .auth-mode-tab { padding: 11px; text-align: center; border-radius: 8px; cursor: pointer; font-size: 13px; color: var(--muted); transition: all 0.2s; font-weight: 500; }
  .auth-mode-tab.active { background: var(--accent); color: #0e1116; }
  .auth-mode-tab .ico { display: block; font-size: 18px; margin-bottom: 2px; }

  /* OWNER PORTAL */
  .owner-header { border-bottom: 1px solid var(--border); background: rgba(14, 17, 22, 0.85); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; }
  .portal-badge { background: rgba(95, 184, 120, 0.15); color: var(--success); padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }

  .owner-hero { background: linear-gradient(135deg, rgba(212,165,116,0.08), rgba(95,184,120,0.05)); border: 1px solid var(--border); border-radius: 16px; padding: 28px; margin-bottom: 28px; position: relative; overflow: hidden; }
  .owner-hero::before { content: ''; position: absolute; top: -30%; left: -10%; width: 280px; height: 280px; background: radial-gradient(circle, rgba(212,165,116,0.15), transparent 70%); pointer-events: none; }
  .owner-hero h1 { font-size: 28px; margin-bottom: 6px; position: relative; }
  .owner-hero p { color: var(--muted); font-size: 14px; position: relative; }

  .property-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .property-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 22px; transition: all 0.2s; }
  .property-card:hover { border-color: var(--accent); }
  .property-card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .property-icon { width: 44px; height: 44px; border-radius: 10px; background: rgba(212,165,116,0.15); display: grid; place-items: center; font-size: 20px; }
  .property-status { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
  .status-rented { background: rgba(95, 184, 120, 0.15); color: var(--success); }
  .status-vacant { background: rgba(229, 107, 111, 0.15); color: var(--danger); }
  .property-card h3 { font-size: 16px; margin-bottom: 4px; }
  .property-card .addr { color: var(--muted); font-size: 12.5px; margin-bottom: 14px; }
  .property-stat { display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid var(--border); font-size: 13px; }
  .property-stat .lbl { color: var(--muted); }
  .property-stat .val { font-weight: 600; }
  .property-actions { display: flex; gap: 8px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
  .property-actions button { flex: 1; font-size: 12.5px; padding: 8px; }

  .req-list { display: grid; gap: 10px; }
  .req-item { background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap; }
  .req-info { flex: 1; min-width: 200px; }
  .req-title { font-weight: 600; font-size: 14px; margin-bottom: 3px; }
  .req-desc { font-size: 12.5px; color: var(--muted); }
  .req-status { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; }
  .req-pending { background: rgba(240, 198, 116, 0.15); color: var(--warning); }
  .req-done { background: rgba(95, 184, 120, 0.15); color: var(--success); }
  .req-progress { background: rgba(212, 165, 116, 0.15); color: var(--accent); }

  .fab { position: fixed; bottom: 30px; left: 30px; width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: #0e1116; border: none; font-size: 24px; cursor: pointer; box-shadow: 0 8px 20px rgba(212,165,116,0.3); z-index: 50; }
  .fab:hover { background: var(--accent-2); transform: scale(1.05); }

  /* OWNER MGMT TABLE (for partners) */
  .owner-mgmt-actions { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }

  @media (max-width: 768px) {
    .stats { grid-template-columns: repeat(2, 1fr); }
    .templates { grid-template-columns: 1fr; }
    .form-grid { grid-template-columns: 1fr; }
    .reports-grid { grid-template-columns: 1fr; }
    nav ul { gap: 2px; }
    nav a { padding: 6px 10px; font-size: 12px; }
    .container { padding: 20px 16px; }
    .page-head h1 { font-size: 26px; }
  }
</style>
</head>
<body>

<!-- LOGIN -->
<div class="auth-screen" id="authScreen">
  <div class="auth-box">
    <div class="auth-logo">P</div>
    <h2 id="authTitle">تسجيل الدخول</h2>
    <p class="subtitle" id="authSubtitle">اختر نوع الحساب</p>

    <!-- نوع الدخول: شريك أو مالك -->
    <div class="auth-mode-tabs">
      <div class="auth-mode-tab active" data-loginType="partner" onclick="switchLoginType('partner')">
        <span class="ico">🔐</span>
        شريك / موظف
      </div>
      <div class="auth-mode-tab" data-loginType="owner" onclick="switchLoginType('owner')">
        <span class="ico">🏠</span>
        مالك عقار
      </div>
    </div>

    <!-- نموذج الشريك -->
    <div id="partnerLoginForm">
      <div class="auth-tabs">
        <div class="auth-tab active" data-mode="login" onclick="switchAuthMode('login')">دخول</div>
        <div class="auth-tab" data-mode="register" onclick="switchAuthMode('register')">إنشاء حساب</div>
      </div>
      <div class="auth-form">
        <div class="error-msg" id="errorMsg"></div>
        <div class="info-msg" id="infoMsg"></div>
        <div id="registerOnly" style="display:none;">
          <div style="margin-bottom:14px;">
            <label>الاسم الكامل</label>
            <input type="text" id="reg-name" placeholder="اسمك الكامل">
          </div>
          <div style="margin-bottom:14px;">
            <label>الدور</label>
            <div class="role-select">
              <div class="role-option active" data-role="partner" onclick="selectRole('partner')">شريك</div>
              <div class="role-option" data-role="manager" onclick="selectRole('manager')">مدير</div>
            </div>
          </div>
        </div>
        <div style="margin-bottom:14px;">
          <label>اسم المستخدم</label>
          <input type="text" id="auth-username" placeholder="اسم المستخدم">
        </div>
        <div style="margin-bottom:14px;">
          <label>كلمة المرور</label>
          <input type="password" id="auth-password" placeholder="••••••••">
        </div>
        <div id="registerOnly2" style="display:none;">
          <div style="margin-bottom:14px;">
            <label>الرمز السري للشركة</label>
            <input type="password" id="reg-company-code" placeholder="الرمز السري">
            <p style="font-size:11.5px; color:var(--muted); margin-top:5px;">يحصل عليه الشريك من المؤسس فقط</p>
          </div>
        </div>
        <button class="primary" style="width:100%; margin-top:6px;" onclick="handleAuth()" id="authBtn">دخول</button>
      </div>
    </div>

    <!-- نموذج المالك -->
    <div id="ownerLoginForm" style="display:none;">
      <div class="auth-form">
        <div class="error-msg" id="ownerErrorMsg"></div>
        <div class="info-msg" id="ownerInfoMsg"></div>
        <div class="auth-tabs">
          <div class="auth-tab active" data-ownerMode="account" onclick="switchOwnerLoginMode('account')">حساب</div>
          <div class="auth-tab" data-ownerMode="link" onclick="switchOwnerLoginMode('link')">رابط خاص</div>
        </div>

        <!-- دخول بحساب -->
        <div id="ownerAccountMode">
          <div style="margin-bottom:14px;">
            <label>اسم المستخدم أو رقم الجوال</label>
            <input type="text" id="owner-username" placeholder="مثال: 05xxxxxxxx">
          </div>
          <div style="margin-bottom:14px;">
            <label>كلمة المرور</label>
            <input type="password" id="owner-password" placeholder="••••••••">
          </div>
          <button class="primary" style="width:100%;" onclick="handleOwnerLogin()">دخول</button>
          <p style="text-align:center; font-size:11.5px; color:var(--muted); margin-top:14px;">
            ليس لديك حساب؟ تواصل مع الشركة لتفعيله
          </p>
        </div>

        <!-- دخول برابط -->
        <div id="ownerLinkMode" style="display:none;">
          <div style="margin-bottom:14px;">
            <label>الرمز الخاص بك</label>
            <input type="text" id="owner-link-code" placeholder="مثال: OWN-XXXX-XXXX">
            <p style="font-size:11.5px; color:var(--muted); margin-top:5px;">الرمز الذي أرسلته لك الشركة</p>
          </div>
          <button class="primary" style="width:100%;" onclick="handleOwnerLinkLogin()">دخول بالرمز</button>
        </div>
      </div>
    </div>

    <p style="text-align:center; font-size:11.5px; color:var(--muted); margin-top:18px;">
      نظام محمي — لا يمكن الوصول للبيانات إلا بعد تسجيل الدخول
    </p>
  </div>
</div>

<!-- MAIN APP -->
<div id="mainApp" style="display:none;">
<header>
  <div class="header-inner">
    <div class="brand">
      <div class="logo">P</div>
      <div>
        <div class="brand-name">Property Hub</div>
        <div class="brand-sub">نظام إدارة الأملاك</div>
      </div>
    </div>
    <nav>
      <ul>
        <li><a class="active" data-page="dashboard" onclick="switchPage('dashboard')">لوحة التحكم</a></li>
        <li><a data-page="records" onclick="switchPage('records')">السجلات</a></li>
        <li><a data-page="owners-mgmt" onclick="switchPage('owners-mgmt')">بوابة الملاك</a></li>
        <li><a data-page="marketing" onclick="switchPage('marketing')">التسويق والمتابعة <span id="newLeadsCount" style="background:var(--danger);color:#fff;padding:1px 7px;border-radius:10px;font-size:10px;margin-right:4px;display:none;">0</span></a></li>
        <li><a data-page="alerts" onclick="switchPage('alerts')">التنبيهات <span id="alertCount" style="background:var(--danger);color:#fff;padding:1px 7px;border-radius:10px;font-size:10px;margin-right:4px;display:none;">0</span></a></li>
        <li><a data-page="reports" onclick="switchPage('reports')">التقارير</a></li>
        <li><a data-page="settings" onclick="switchPage('settings')">الإعدادات</a></li>
      </ul>
    </nav>
    <div class="user-chip">
      <div class="user-avatar" id="userAvatar">?</div>
      <span id="userName">--</span>
      <button class="logout-btn" onclick="logout()">خروج</button>
    </div>
  </div>
</header>

<div class="container">

<!-- DASHBOARD -->
<div class="page active" id="page-dashboard">
  <div class="page-head">
    <h1>أهلاً بك، <span id="welcomeName">--</span></h1>
    <p>اختر القالب المناسب لتسجيل بيانات جديدة، أو راجع السجلات المحفوظة</p>
  </div>
  <div class="stats">
    <div class="stat"><div class="stat-label">إجمالي الملاك</div><div class="stat-value" id="ownerCount">0</div><div class="stat-trend">عقارات مدارة</div></div>
    <div class="stat"><div class="stat-label">المستأجرين</div><div class="stat-value" id="tenantCount">0</div><div class="stat-trend">عقود نشطة</div></div>
    <div class="stat"><div class="stat-label">عقود الشركاء</div><div class="stat-value" id="companyCount">0</div><div class="stat-trend">اتفاقيات داخلية</div></div>
    <div class="stat"><div class="stat-label">عملاء التسويق</div><div class="stat-value" id="leadsTotalCount">0</div><div class="stat-trend" id="leadsPendingTrend" style="color: var(--danger);">0 بانتظار التواصل</div></div>
  </div>
  <h2 class="section-title">القوالب المتاحة</h2>
  <div class="templates">
    <div class="template-card" onclick="openModal('owner')">
      <div class="template-icon icon-owner">🏠</div>
      <h3>قالب المالك</h3>
      <p>تسجيل بيانات مالك العقار، تفاصيل العقار، شروط الإدارة، والعمولة المتفق عليها</p>
      <div class="template-meta"><span class="badge">12 حقل</span><span>← ابدأ الآن</span></div>
    </div>
    <div class="template-card" onclick="openModal('tenant')">
      <div class="template-icon icon-tenant">🔑</div>
      <h3>قالب المستأجر</h3>
      <p>عقد إيجار شامل مع المستأجر، مدة العقد، قيمة الإيجار، وآلية الدفع</p>
      <div class="template-meta"><span class="badge">12 حقل</span><span>← ابدأ الآن</span></div>
    </div>
    <div class="template-card" onclick="openModal('company')">
      <div class="template-icon icon-company">🤝</div>
      <h3>قالب الشركة والشركاء</h3>
      <p>اتفاقية داخلية، الحصص، الأدوار، توزيع الأرباح، وآليات اتخاذ القرار</p>
      <div class="template-meta"><span class="badge">10 حقل</span><span>← ابدأ الآن</span></div>
    </div>
  </div>
</div>

<!-- RECORDS -->
<div class="page" id="page-records">
  <div class="page-head">
    <h1>السجلات</h1>
    <p>عرض كل السجلات المحفوظة، يمكنك تصدير أي عقد كملف PDF</p>
  </div>
  <div class="records">
    <div class="records-head">
      <h3>كل السجلات</h3>
      <div class="filter-bar">
        <div class="filter-chip active" data-filter="all" onclick="filterRecords('all')">الكل</div>
        <div class="filter-chip" data-filter="owner" onclick="filterRecords('owner')">الملاك</div>
        <div class="filter-chip" data-filter="tenant" onclick="filterRecords('tenant')">المستأجرين</div>
        <div class="filter-chip" data-filter="company" onclick="filterRecords('company')">الشركاء</div>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>النوع</th><th>الاسم</th><th>التفاصيل</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
        <tbody id="recordsBody">
          <tr><td colspan="5" class="empty"><div class="empty-icon">📋</div><div>لا توجد سجلات بعد</div></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- OWNERS MANAGEMENT (للشركاء) -->
<div class="page" id="page-owners-mgmt">
  <div class="page-head">
    <h1>بوابة الملاك</h1>
    <p>إدارة حسابات الملاك، إنشاء بيانات دخول، ومراجعة طلبات الصيانة</p>
  </div>

  <div class="owner-mgmt-actions">
    <button class="primary" onclick="openCreateOwnerAccount()">+ إنشاء حساب لمالك</button>
    <button class="secondary" onclick="switchPage('maintenance-requests')">📋 طلبات الصيانة <span id="pendingReqCount" style="background:var(--danger);color:#fff;padding:1px 7px;border-radius:10px;font-size:10px;margin-right:4px;display:none;">0</span></button>
  </div>

  <div class="records">
    <div class="records-head">
      <h3>حسابات الملاك</h3>
      <span style="color: var(--muted); font-size: 12px;" id="ownersAccountsCount">0 حساب</span>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>الاسم</th><th>طريقة الدخول</th><th>بيانات الدخول</th><th>العقارات</th><th>إجراءات</th></tr></thead>
        <tbody id="ownersMgmtBody">
          <tr><td colspan="5" class="empty"><div class="empty-icon">👥</div><div>لا توجد حسابات ملاك بعد</div></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- MARKETING & FOLLOW-UP (للشركاء/المدير فقط) -->
<div class="page" id="page-marketing">
  <div class="page-head">
    <h1>التسويق والمتابعة</h1>
    <p>إدارة العملاء المحتملين، حالة التواصل، والملاحظات السرية الخاصة بالشركاء</p>
  </div>

  <!-- إحصائيات سريعة -->
  <div class="stats" style="margin-bottom: 24px;">
    <div class="stat"><div class="stat-label">إجمالي العملاء</div><div class="stat-value" id="leadsTotal">0</div><div class="stat-trend">في قاعدة البيانات</div></div>
    <div class="stat"><div class="stat-label">بانتظار التواصل</div><div class="stat-value" id="leadsPending" style="color: var(--danger);">0</div><div class="stat-trend" style="color: var(--danger);">يحتاج متابعة عاجلة</div></div>
    <div class="stat"><div class="stat-label">تم التواصل</div><div class="stat-value" id="leadsContacted" style="color: var(--success);">0</div><div class="stat-trend" style="color: var(--success);">معالج</div></div>
    <div class="stat"><div class="stat-label">قيد المتابعة</div><div class="stat-value" id="leadsFollowing" style="color: var(--warning);">0</div><div class="stat-trend" style="color: var(--warning);">مهتم</div></div>
  </div>

  <!-- نموذج إدخال سريع -->
  <div class="setting-card" style="margin-bottom: 24px;">
    <h3>إضافة عميل جديد</h3>
    <p>أضف عميل محتمل بسرعة مع ملاحظة خاصة بالشركاء</p>
    <div class="form-grid">
      <div><label>اسم العميل</label><input type="text" id="lead-name" placeholder="مثال: فهد السليمان"></div>
      <div><label>رقم الجوال</label><input type="tel" id="lead-phone" placeholder="05xxxxxxxx"></div>
      <div><label>حالة التواصل</label>
        <select id="lead-status">
          <option value="pending">لم يتم التواصل</option>
          <option value="contacted">تم التواصل</option>
          <option value="following">قيد المتابعة</option>
          <option value="closed">مغلق - غير مهتم</option>
          <option value="converted">تحول لعميل</option>
        </select>
      </div>
      <div><label>المصدر</label>
        <select id="lead-source">
          <option>توصية شخصية</option>
          <option>مكالمة مباشرة</option>
          <option>تويتر / X</option>
          <option>انستقرام</option>
          <option>سناب شات</option>
          <option>إعلان ممول</option>
          <option>موقع الويب</option>
          <option>أخرى</option>
        </select>
      </div>
      <div class="full"><label>ملاحظة سرية (للشركاء فقط) 🔒</label><textarea id="lead-notes" placeholder="مثال: يريد إدارة 5 شقق في حي الراكية، مهتم بنظام الأتمتة..." style="min-height: 80px;"></textarea></div>
    </div>
    <button class="primary" style="margin-top: 14px;" onclick="addNewLead()">+ إضافة العميل</button>
  </div>

  <!-- جدول العملاء -->
  <div class="records">
    <div class="records-head">
      <h3>قائمة العملاء</h3>
      <div class="filter-bar">
        <div class="filter-chip active" data-leadfilter="all" onclick="filterLeads('all')">الكل</div>
        <div class="filter-chip" data-leadfilter="pending" onclick="filterLeads('pending')">بانتظار التواصل</div>
        <div class="filter-chip" data-leadfilter="contacted" onclick="filterLeads('contacted')">تم التواصل</div>
        <div class="filter-chip" data-leadfilter="following" onclick="filterLeads('following')">قيد المتابعة</div>
        <div class="filter-chip" data-leadfilter="converted" onclick="filterLeads('converted')">عملاء</div>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>الاسم</th><th>الجوال</th><th>المصدر</th><th>الحالة</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
        <tbody id="leadsTableBody">
          <tr><td colspan="6" class="empty"><div class="empty-icon">📊</div><div>لا يوجد عملاء بعد. ابدأ بإضافة عميل!</div></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Modal: عرض ملاحظة العميل (للشركاء فقط) -->
<div class="modal-overlay" id="noteModal">
  <div class="modal" style="max-width: 520px;">
    <div class="modal-head">
      <div>
        <h2>🔒 ملاحظة سرية</h2>
        <p>هذه الملاحظة مخصصة للشركاء والمدير فقط</p>
      </div>
      <button class="close-btn" onclick="closeNoteModal()">✕</button>
    </div>
    <div id="noteContent" style="background: var(--bg-elev); padding: 18px; border-radius: 10px; border-right: 3px solid var(--accent); font-size: 14px; line-height: 1.8;"></div>
    <div class="form-actions">
      <button class="primary" onclick="editLeadNote()">✏️ تعديل الملاحظة</button>
      <button class="secondary" onclick="closeNoteModal()">إغلاق</button>
    </div>
  </div>
</div>
<div class="page" id="page-maintenance-requests">
  <div class="page-head">
    <h1>طلبات الصيانة والاستفسارات</h1>
    <p>كل الطلبات المقدمة من الملاك</p>
  </div>
  <div class="req-list" id="adminReqList">
    <div class="empty"><div class="empty-icon">✓</div><div>لا توجد طلبات حالياً</div></div>
  </div>
</div>
  <div class="page-head">
    <h1>التنبيهات</h1>
    <p>عقود قاربت على الانتهاء، أو تحتاج متابعة عاجلة</p>
  </div>
  <div class="alert-list" id="alertsList">
    <div class="empty"><div class="empty-icon">✓</div><div>لا توجد تنبيهات حالية</div></div>
  </div>
</div>

<!-- REPORTS -->
<div class="page" id="page-reports">
  <div class="page-head">
    <h1>التقارير والإحصائيات</h1>
    <p>نظرة عامة على أداء الشركة وتوزيع المحفظة</p>
  </div>
  <div class="reports-grid">
    <div class="chart-card"><h3>توزيع السجلات</h3><div class="chart-wrap"><canvas id="distChart"></canvas></div></div>
    <div class="chart-card"><h3>الإيرادات المتوقعة شهرياً (ر.س)</h3><div class="chart-wrap"><canvas id="revChart"></canvas></div></div>
    <div class="chart-card"><h3>ملخص مالي</h3><div id="financialSummary"></div></div>
    <div class="chart-card"><h3>أنواع العقارات</h3><div class="chart-wrap"><canvas id="typeChart"></canvas></div></div>
  </div>
</div>

<!-- SETTINGS -->
<div class="page" id="page-settings">
  <div class="page-head">
    <h1>الإعدادات</h1>
    <p>إدارة الحسابات والشركاء وأمان النظام</p>
  </div>
  <div class="setting-card">
    <h3>الشركاء والمستخدمين</h3>
    <p>جميع الأشخاص الذين لديهم وصول للنظام</p>
    <div class="partners-list" id="partnersList"></div>
  </div>
  <div class="setting-card">
    <h3>الرمز السري للشركة</h3>
    <p>مطلوب لإنشاء حسابات جديدة. شاركه فقط مع الشركاء الموثوقين.</p>
    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
      <input type="text" id="companyCodeDisplay" readonly style="max-width:300px;">
      <button class="secondary" onclick="toggleCodeVisibility()">إظهار / إخفاء</button>
      <button class="primary" onclick="regenerateCode()">تغيير الرمز</button>
    </div>
  </div>
  <div class="setting-card">
    <h3>تغيير كلمة المرور</h3>
    <p>غير كلمة المرور الخاصة بحسابك</p>
    <div class="form-grid" style="max-width:500px;">
      <div class="full"><label>كلمة المرور الحالية</label><input type="password" id="current-pwd"></div>
      <div class="full"><label>كلمة المرور الجديدة</label><input type="password" id="new-pwd"></div>
    </div>
    <button class="primary" style="margin-top:14px;" onclick="changePassword()">تحديث</button>
  </div>

  <div class="setting-card">
    <h3>النسخ الاحتياطي للبيانات</h3>
    <p>صدّر كل البيانات (مستخدمين، سجلات، حسابات الملاك، طلبات) كملف JSON واحفظه على جهازك. تقدر ترجعه في أي وقت.</p>
    <div style="display:flex; gap:10px; flex-wrap:wrap;">
      <button class="primary" onclick="exportAllData()">📥 تصدير (نسخ)</button>
      <button class="secondary" onclick="openImportTextModal()">📤 استيراد بلصق النص</button>
      <button class="secondary" onclick="document.getElementById('importFile').click()">📁 استيراد من ملف</button>
      <input type="file" id="importFile" accept=".json,.txt" style="display:none;" onchange="importAllData(event)">
    </div>
    <p style="font-size:11.5px; color:var(--warning); margin-top:10px;">💡 على الجوال: استخدم "تصدير" والصق النتيجة في ملاحظات الجوال أو واتساب لنفسك. للاسترجاع: استخدم "استيراد بلصق النص"</p>
  </div>
</div>

</div>

<!-- MODALS -->
<div class="modal-overlay" id="modal-owner">
  <div class="modal">
    <div class="modal-head">
      <div><h2>قالب المالك</h2><p>تسجيل بيانات مالك العقار وشروط الإدارة</p></div>
      <button class="close-btn" onclick="closeModal('owner')">✕</button>
    </div>
    <div class="form-grid">
      <div><label>الاسم الكامل</label><input type="text" id="owner-name" placeholder="مثال: محمد عبدالله السالم"></div>
      <div><label>رقم الهوية</label><input type="text" id="owner-id" placeholder="1xxxxxxxxx"></div>
      <div><label>رقم الجوال</label><input type="tel" id="owner-phone" placeholder="05xxxxxxxx"></div>
      <div><label>البريد الإلكتروني</label><input type="email" id="owner-email" placeholder="email@example.com"></div>
      <div class="full"><label>عنوان العقار</label><input type="text" id="owner-property" placeholder="الحي، الشارع، المدينة"></div>
      <div><label>نوع العقار</label>
        <select id="owner-type"><option>شقة</option><option>فيلا</option><option>دور</option><option>عمارة كاملة</option><option>محل تجاري</option></select>
      </div>
      <div><label>رقم الصك</label><input type="text" id="owner-deed"></div>
      <div><label>الإيجار الشهري (ر.س)</label><input type="number" id="owner-rent" placeholder="0"></div>
      <div><label>نسبة العمولة (%)</label><input type="number" id="owner-commission" placeholder="8"></div>
      <div><label>تاريخ بداية الإدارة</label><input type="date" id="owner-start"></div>
      <div><label>مدة العقد (سنة)</label><input type="number" id="owner-duration" placeholder="1"></div>
      <div class="full"><label>شروط خاصة</label><textarea id="owner-notes"></textarea></div>
    </div>
    <div class="form-actions">
      <button class="primary" onclick="saveRecord('owner')">حفظ السجل</button>
      <button class="secondary" onclick="closeModal('owner')">إلغاء</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modal-tenant">
  <div class="modal">
    <div class="modal-head">
      <div><h2>قالب المستأجر</h2><p>عقد إيجار مع المستأجر</p></div>
      <button class="close-btn" onclick="closeModal('tenant')">✕</button>
    </div>
    <div class="form-grid">
      <div><label>الاسم الكامل</label><input type="text" id="tenant-name"></div>
      <div><label>رقم الهوية / الإقامة</label><input type="text" id="tenant-id"></div>
      <div><label>الجنسية</label><input type="text" id="tenant-nationality"></div>
      <div><label>رقم الجوال</label><input type="tel" id="tenant-phone" placeholder="05xxxxxxxx"></div>
      <div class="full"><label>جهة العمل</label><input type="text" id="tenant-work"></div>
      <div class="full"><label>العقار المؤجر</label><input type="text" id="tenant-property"></div>
      <div><label>الإيجار السنوي (ر.س)</label><input type="number" id="tenant-rent" placeholder="0"></div>
      <div><label>طريقة السداد</label>
        <select id="tenant-payment"><option>شهري</option><option>ربع سنوي</option><option>نصف سنوي</option><option>سنوي</option></select>
      </div>
      <div><label>قيمة التأمين (ر.س)</label><input type="number" id="tenant-deposit"></div>
      <div><label>تاريخ بداية العقد</label><input type="date" id="tenant-start"></div>
      <div><label>تاريخ نهاية العقد</label><input type="date" id="tenant-end"></div>
      <div class="full"><label>شروط إضافية</label><textarea id="tenant-notes"></textarea></div>
    </div>
    <div class="form-actions">
      <button class="primary" onclick="saveRecord('tenant')">حفظ العقد</button>
      <button class="secondary" onclick="closeModal('tenant')">إلغاء</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="modal-company">
  <div class="modal">
    <div class="modal-head">
      <div><h2>قالب الشركة والشركاء</h2><p>اتفاقية بين الشركاء</p></div>
      <button class="close-btn" onclick="closeModal('company')">✕</button>
    </div>
    <div class="form-grid">
      <div class="full"><label>اسم الشركة</label><input type="text" id="company-name"></div>
      <div><label>السجل التجاري</label><input type="text" id="company-cr"></div>
      <div><label>تاريخ التأسيس</label><input type="date" id="company-founded"></div>
      <div class="full"><label>اسم الشريك</label><input type="text" id="company-partner"></div>
      <div><label>نسبة الحصة (%)</label><input type="number" id="company-share" placeholder="25"></div>
      <div><label>قيمة المساهمة (ر.س)</label><input type="number" id="company-investment" placeholder="0"></div>
      <div><label>الدور / المنصب</label><input type="text" id="company-role"></div>
      <div><label>صلاحية اتخاذ القرار</label>
        <select id="company-authority"><option>منفرد</option><option>بالأغلبية</option><option>بالإجماع</option></select>
      </div>
      <div class="full"><label>آلية توزيع الأرباح</label><textarea id="company-profits"></textarea></div>
      <div class="full"><label>بنود إضافية</label><textarea id="company-notes"></textarea></div>
    </div>
    <div class="form-actions">
      <button class="primary" onclick="saveRecord('company')">حفظ الاتفاقية</button>
      <button class="secondary" onclick="closeModal('company')">إلغاء</button>
    </div>
  </div>
</div>

</div>

<!-- ============ OWNER PORTAL ============ -->
<div id="ownerPortal" style="display:none;">
  <header class="owner-header">
    <div class="header-inner">
      <div class="brand">
        <div class="logo">P</div>
        <div>
          <div class="brand-name">Property Hub</div>
          <div class="brand-sub">بوابة المالك <span class="portal-badge">Owner Portal</span></div>
        </div>
      </div>
      <div class="user-chip">
        <div class="user-avatar" id="ownerAvatar">?</div>
        <span id="ownerNameDisplay">--</span>
        <button class="logout-btn" onclick="logoutOwner()">خروج</button>
      </div>
    </div>
  </header>

  <div class="container">
    <div class="owner-hero">
      <h1>أهلاً بك، <span id="ownerWelcomeName">--</span></h1>
      <p>نظرة شاملة على عقاراتك، عقودك، وطلباتك في مكان واحد</p>
    </div>

    <div class="stats">
      <div class="stat"><div class="stat-label">عقاراتك</div><div class="stat-value" id="ownerPropsCount">0</div><div class="stat-trend">إجمالي</div></div>
      <div class="stat"><div class="stat-label">مؤجرة</div><div class="stat-value" id="ownerRentedCount">0</div><div class="stat-trend" style="color: var(--success);">نشطة</div></div>
      <div class="stat"><div class="stat-label">شاغرة</div><div class="stat-value" id="ownerVacantCount">0</div><div class="stat-trend" style="color: var(--warning);">متاحة للتأجير</div></div>
      <div class="stat"><div class="stat-label">طلباتك</div><div class="stat-value" id="ownerReqCount">0</div><div class="stat-trend">قيد المعالجة / منجزة</div></div>
    </div>

    <h2 class="section-title">عقاراتك</h2>
    <div class="property-grid" id="ownerPropertiesGrid">
      <div class="empty" style="grid-column: 1 / -1;"><div class="empty-icon">🏠</div><div>لم يتم تسجيل عقارات باسمك بعد</div></div>
    </div>

    <h2 class="section-title">طلباتك وملاحظاتك</h2>
    <div class="req-list" id="ownerReqList">
      <div class="empty"><div class="empty-icon">📋</div><div>لم تقدم أي طلبات بعد. اضغط على زر + لإضافة طلب جديد</div></div>
    </div>
  </div>

  <button class="fab" onclick="openNewRequest()" title="إضافة طلب جديد">+</button>
</div>

<!-- Modal: إنشاء حساب مالك (للشركاء) -->
<div class="modal-overlay" id="modal-create-owner">
  <div class="modal" style="max-width: 560px;">
    <div class="modal-head">
      <div><h2>إنشاء حساب لمالك</h2><p>اختر المالك وحدد طريقة الدخول</p></div>
      <button class="close-btn" onclick="closeModal('create-owner')">✕</button>
    </div>
    <div style="margin-bottom:14px;">
      <label>اختر المالك</label>
      <select id="select-owner-record">
        <option value="">-- اختر من قائمة الملاك المسجلين --</option>
      </select>
      <p style="font-size:11.5px; color:var(--muted); margin-top:5px;">يجب تسجيل بيانات المالك أولاً في قسم "السجلات"</p>
    </div>
    <div style="margin-bottom:14px;">
      <label>طريقة الدخول</label>
      <div class="role-select">
        <div class="role-option active" data-loginMethod="account" onclick="selectLoginMethod('account')">حساب (يوزر + باسوورد)</div>
        <div class="role-option" data-loginMethod="link" onclick="selectLoginMethod('link')">رمز خاص (بدون باسوورد)</div>
      </div>
    </div>

    <div id="account-method-fields">
      <div class="form-grid">
        <div><label>اسم المستخدم</label><input type="text" id="new-owner-username" placeholder="يفضل رقم الجوال"></div>
        <div><label>كلمة المرور المبدئية</label><input type="text" id="new-owner-password" placeholder="مثال: 1234abcd"></div>
      </div>
      <p style="font-size:11.5px; color:var(--muted); margin-top:8px;">💡 سترسل هذه البيانات للمالك عبر واتساب أو SMS</p>
    </div>

    <div id="link-method-fields" style="display:none;">
      <label>الرمز الخاص (يولّد تلقائياً)</label>
      <input type="text" id="new-owner-code" readonly>
      <p style="font-size:11.5px; color:var(--muted); margin-top:8px;">💡 أرسل هذا الرمز للمالك ليدخل به مباشرة بدون كلمة مرور</p>
    </div>

    <div class="form-actions">
      <button class="primary" onclick="createOwnerAccount()">إنشاء الحساب</button>
      <button class="secondary" onclick="closeModal('create-owner')">إلغاء</button>
    </div>
  </div>
</div>

<!-- Modal: طلب جديد من المالك -->
<div class="modal-overlay" id="modal-new-request">
  <div class="modal" style="max-width: 560px;">
    <div class="modal-head">
      <div><h2>طلب جديد</h2><p>أرسل طلب صيانة أو استفسار للشركة</p></div>
      <button class="close-btn" onclick="closeModal('new-request')">✕</button>
    </div>
    <div style="margin-bottom:14px;">
      <label>نوع الطلب</label>
      <select id="req-type">
        <option>طلب صيانة</option>
        <option>استفسار</option>
        <option>شكوى</option>
        <option>طلب تقرير</option>
      </select>
    </div>
    <div style="margin-bottom:14px;">
      <label>العقار المعني</label>
      <select id="req-property">
        <option value="">-- اختر العقار --</option>
      </select>
    </div>
    <div style="margin-bottom:14px;">
      <label>عنوان الطلب</label>
      <input type="text" id="req-title" placeholder="مثال: تسرب في الحمام">
    </div>
    <div style="margin-bottom:14px;">
      <label>التفاصيل</label>
      <textarea id="req-desc" placeholder="اكتب تفاصيل الطلب..." style="min-height:100px;"></textarea>
    </div>
    <div class="form-actions">
      <button class="primary" onclick="submitOwnerRequest()">إرسال الطلب</button>
      <button class="secondary" onclick="closeModal('new-request')">إلغاء</button>
    </div>
  </div>
</div>

<script>
let currentUser = null, users = [], records = [], companyCode = '', selectedRole = 'partner', currentFilter = 'all';
let chartInstances = {};
let ownerAccounts = [], maintenanceRequests = [], currentOwner = null;
let currentLoginType = 'partner', currentOwnerLoginMode = 'account', selectedLoginMethod = 'account';
let marketingLeads = [], currentLeadFilter = 'all', currentNoteLeadId = null;

async function loadAll() {
  // محاولة قراءة من المفتاح الموحد الجديد
  try {
    const all = await window.storage.get('app_data', true);
    if (all) {
      const data = JSON.parse(all.value);
      users = data.users || [];
      records = data.records || [];
      companyCode = data.companyCode || '';
      ownerAccounts = data.ownerAccounts || [];
      maintenanceRequests = data.maintenanceRequests || [];
      marketingLeads = data.marketingLeads || [];
    }
  } catch { /* لا توجد بيانات بعد */ }

  // Fallback: قراءة من المفاتيح القديمة لو ما لقى موحد (للترقية)
  if (users.length === 0) {
    try { const u = await window.storage.get('users', true); if (u) users = JSON.parse(u.value); } catch {}
  }
  if (records.length === 0) {
    try { const r = await window.storage.get('records', true); if (r) records = JSON.parse(r.value); } catch {}
  }
  if (!companyCode) {
    try { const c = await window.storage.get('company_code', true); if (c) companyCode = c.value; } catch {}
  }
  if (ownerAccounts.length === 0) {
    try { const oa = await window.storage.get('owner_accounts', true); if (oa) ownerAccounts = JSON.parse(oa.value); } catch {}
  }
  if (maintenanceRequests.length === 0) {
    try { const mr = await window.storage.get('maintenance_requests', true); if (mr) maintenanceRequests = JSON.parse(mr.value); } catch {}
  }

  if (!companyCode) {
    companyCode = 'PROP-2026-SECRET';
  }
}

// حفظ موحد: كل البيانات في مفتاح واحد لتقليل احتمال الفشل
async function saveAllUnified() {
  const data = { users, records, companyCode, ownerAccounts, maintenanceRequests, marketingLeads };
  const r = await safeStorageSet('app_data', JSON.stringify(data), true);
  if (!r.ok) {
    showToast('تحذير: تعذر الحفظ — استخدم "تصدير البيانات" من الإعدادات للنسخ الاحتياطي', true);
  }
  return r.ok;
}

async function saveUsers() { return await saveAllUnified(); }
async function saveRecords() { return await saveAllUnified(); }
async function saveCode() { return await saveAllUnified(); }
async function saveOwnerAccounts() { return await saveAllUnified(); }
async function saveRequests() { return await saveAllUnified(); }
async function saveLeads() { return await saveAllUnified(); }

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; }
  return 'h_' + Math.abs(h).toString(36);
}

// ============== SAFE STORAGE WITH RETRY ==============
async function safeStorageSet(key, value, shared, retries = 3) {
  let lastError = null;
  for (let i = 0; i < retries; i++) {
    try {
      const result = await window.storage.set(key, value, shared);
      if (result) return { ok: true };
    } catch (e) {
      lastError = e;
      console.warn(`Storage attempt ${i + 1} failed for ${key}:`, e);
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 400 * (i + 1)));
      }
    }
  }
  return { ok: false, error: lastError ? lastError.message : 'unknown' };
}

// ============== AUTH MODE SWITCHING (Partner vs Owner) ==============
function switchLoginType(type) {
  currentLoginType = type;
  document.querySelectorAll('.auth-mode-tab').forEach(t => t.classList.toggle('active', t.dataset.logintype === type));
  document.getElementById('partnerLoginForm').style.display = type === 'partner' ? 'block' : 'none';
  document.getElementById('ownerLoginForm').style.display = type === 'owner' ? 'block' : 'none';
  document.getElementById('authTitle').textContent = type === 'partner' ? 'دخول الشركاء' : 'دخول الملاك';
  document.getElementById('authSubtitle').textContent = type === 'partner' ? 'نظام إدارة الشركة' : 'بوابة مالك العقار';
}

function switchOwnerLoginMode(mode) {
  currentOwnerLoginMode = mode;
  document.querySelectorAll('[data-ownermode]').forEach(t => t.classList.toggle('active', t.dataset.ownermode === mode));
  document.getElementById('ownerAccountMode').style.display = mode === 'account' ? 'block' : 'none';
  document.getElementById('ownerLinkMode').style.display = mode === 'link' ? 'block' : 'none';
}

function switchAuthMode(mode) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
  const isReg = mode === 'register';
  document.getElementById('registerOnly').style.display = isReg ? 'block' : 'none';
  document.getElementById('registerOnly2').style.display = isReg ? 'block' : 'none';
  document.getElementById('authTitle').textContent = isReg ? 'إنشاء حساب جديد' : 'تسجيل الدخول';
  document.getElementById('authSubtitle').textContent = isReg ? 'تحتاج الرمز السري من المؤسس' : 'نظام مغلق — للشركاء فقط';
  document.getElementById('authBtn').textContent = isReg ? 'إنشاء الحساب' : 'دخول';
  hideMessages();
}

function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.role-option').forEach(o => o.classList.toggle('active', o.dataset.role === role));
}

function showError(msg) { const el = document.getElementById('errorMsg'); el.textContent = msg; el.classList.add('show'); document.getElementById('infoMsg').classList.remove('show'); }
function showInfo(msg) { const el = document.getElementById('infoMsg'); el.textContent = msg; el.classList.add('show'); document.getElementById('errorMsg').classList.remove('show'); }
function hideMessages() { document.getElementById('errorMsg').classList.remove('show'); document.getElementById('infoMsg').classList.remove('show'); }

async function handleAuth() {
  const mode = document.querySelector('.auth-tab.active').dataset.mode;
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!username || !password) { showError('الرجاء تعبئة جميع الحقول'); return; }

  if (mode === 'register') {
    const name = document.getElementById('reg-name').value.trim();
    const code = document.getElementById('reg-company-code').value;
    if (!name) { showError('الرجاء إدخال الاسم'); return; }
    if (code !== companyCode) { showError('الرمز السري للشركة غير صحيح'); return; }
    if (users.find(u => u.username === username)) { showError('اسم المستخدم مستخدم بالفعل'); return; }
    if (password.length < 6) { showError('كلمة المرور قصيرة جداً (6 أحرف على الأقل)'); return; }
    users.push({ username, name, role: selectedRole, passwordHash: hash(password), createdAt: new Date().toISOString() });
    await saveUsers();
    showInfo('تم إنشاء الحساب! يمكنك الدخول الآن');
    setTimeout(() => switchAuthMode('login'), 1200);
  } else {
    const user = users.find(u => u.username === username);
    if (!user || user.passwordHash !== hash(password)) { showError('اسم المستخدم أو كلمة المرور غير صحيحة'); return; }
    currentUser = user;
    try { await window.storage.set('current_session', 'partner:' + username, false); } catch {}
    enterApp();
  }
}

async function logout() {
  try { await window.storage.delete('current_session', false); } catch {}
  currentUser = null;
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';
}

async function checkSession() {
  try {
    const s = await window.storage.get('current_session', false);
    if (s) {
      const sessionData = s.value.split(':');
      const sessionType = sessionData[0];
      const sessionId = sessionData.slice(1).join(':');

      if (sessionType === 'partner') {
        const user = users.find(u => u.username === sessionId);
        if (user) { currentUser = user; enterApp(); return true; }
      } else if (sessionType === 'owner') {
        const owner = ownerAccounts.find(o => o.id === sessionId);
        if (owner) { currentOwner = owner; enterOwnerPortal(); return true; }
      }
    }
  } catch {}
  return false;
}

function enterApp() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'block';
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userAvatar').textContent = currentUser.name.charAt(0);
  document.getElementById('welcomeName').textContent = currentUser.name;
  document.getElementById('companyCodeDisplay').value = '••••••••••••';
  document.getElementById('companyCodeDisplay').dataset.value = companyCode;
  renderAll();
}

function switchPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const navItem = document.querySelector(`nav a[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  if (page === 'reports') renderCharts();
  if (page === 'settings') renderPartners();
  if (page === 'owners-mgmt') renderOwnersMgmt();
  if (page === 'maintenance-requests') renderAdminRequests();
}

function openModal(type) { document.getElementById('modal-' + type).classList.add('show'); }
function closeModal(type) { document.getElementById('modal-' + type).classList.remove('show'); }
function getVal(id) { const el = document.getElementById(id); return el ? el.value : ''; }

async function saveRecord(type) {
  const record = { id: 'rec_' + Date.now(), type, date: new Date().toLocaleDateString('ar-SA'), createdAt: new Date().toISOString(), createdBy: currentUser.name };

  if (type === 'owner') {
    const name = getVal('owner-name');
    if (!name) { showToast('الرجاء إدخال اسم المالك', true); return; }
    record.name = name;
    record.details = `${getVal('owner-type')} - ${getVal('owner-property') || 'غير محدد'}`;
    record.data = { name, id: getVal('owner-id'), phone: getVal('owner-phone'), email: getVal('owner-email'), property: getVal('owner-property'), propertyType: getVal('owner-type'), deed: getVal('owner-deed'), rent: getVal('owner-rent'), commission: getVal('owner-commission'), startDate: getVal('owner-start'), duration: getVal('owner-duration'), notes: getVal('owner-notes') };
  } else if (type === 'tenant') {
    const name = getVal('tenant-name');
    if (!name) { showToast('الرجاء إدخال اسم المستأجر', true); return; }
    record.name = name;
    record.details = `${getVal('tenant-rent') || '0'} ر.س - ${getVal('tenant-payment')}`;
    record.endDate = getVal('tenant-end');
    record.data = { name, id: getVal('tenant-id'), nationality: getVal('tenant-nationality'), phone: getVal('tenant-phone'), work: getVal('tenant-work'), property: getVal('tenant-property'), rent: getVal('tenant-rent'), payment: getVal('tenant-payment'), deposit: getVal('tenant-deposit'), startDate: getVal('tenant-start'), endDate: getVal('tenant-end'), notes: getVal('tenant-notes') };
  } else {
    const name = getVal('company-partner');
    if (!name) { showToast('الرجاء إدخال اسم الشريك', true); return; }
    record.name = name;
    record.details = `${getVal('company-share') || '0'}% - ${getVal('company-role')}`;
    record.data = { company: getVal('company-name'), cr: getVal('company-cr'), founded: getVal('company-founded'), partner: name, share: getVal('company-share'), investment: getVal('company-investment'), role: getVal('company-role'), authority: getVal('company-authority'), profits: getVal('company-profits'), notes: getVal('company-notes') };
  }

  records.unshift(record);
  await saveRecords(); // يحاول الحفظ ويظهر تحذير لو فشل، لكن يكمل
  closeModal(type);
  clearForm(type);
  renderAll();
  showToast('تم الحفظ بنجاح');
}

function clearForm(type) { document.getElementById('modal-' + type).querySelectorAll('input, textarea').forEach(el => el.value = ''); }

async function deleteRecord(id) {
  if (!confirm('متأكد من حذف هذا السجل؟')) return;
  records = records.filter(r => r.id !== id);
  await saveRecords();
  renderAll();
  showToast('تم الحذف');
}

function filterRecords(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.toggle('active', c.dataset.filter === filter));
  renderRecords();
}

function renderRecords() {
  const body = document.getElementById('recordsBody');
  const filtered = currentFilter === 'all' ? records : records.filter(r => r.type === currentFilter);
  if (filtered.length === 0) { body.innerHTML = `<tr><td colspan="5" class="empty"><div class="empty-icon">📋</div><div>لا توجد سجلات</div></td></tr>`; return; }
  const labels = { owner: ['مالك', 'tag-owner'], tenant: ['مستأجر', 'tag-tenant'], company: ['شريك', 'tag-company'] };
  body.innerHTML = filtered.map(r => {
    const [label, cls] = labels[r.type];
    return `<tr><td><span class="tag ${cls}">${label}</span></td><td style="font-weight:500;">${r.name}</td><td style="color:var(--muted);">${r.details}</td><td style="color:var(--muted);">${r.date}</td><td><button class="action-btn" onclick="exportPDF('${r.id}')">PDF</button><button class="action-btn del" onclick="deleteRecord('${r.id}')">حذف</button></td></tr>`;
  }).join('');
}

function computeAlerts() {
  const today = new Date();
  const alerts = [];
  records.filter(r => r.type === 'tenant' && r.endDate).forEach(r => {
    const end = new Date(r.endDate);
    const days = Math.floor((end - today) / 86400000);
    if (days < 0) alerts.push({ urgent: true, title: `عقد ${r.name} منتهي`, desc: `العقار: ${r.data.property || 'غير محدد'}`, days, label: 'منتهي', record: r });
    else if (days <= 30) alerts.push({ urgent: true, title: `عقد ${r.name} ينتهي قريباً`, desc: `العقار: ${r.data.property || 'غير محدد'}`, days, label: `${days} يوم متبقي`, record: r });
    else if (days <= 60) alerts.push({ urgent: false, title: `عقد ${r.name} يحتاج متابعة`, desc: `العقار: ${r.data.property || 'غير محدد'}`, days, label: `${days} يوم متبقي`, record: r });
  });
  return alerts.sort((a, b) => a.days - b.days);
}

function renderAlerts() {
  const alerts = computeAlerts();
  const list = document.getElementById('alertsList');
  const count = document.getElementById('alertCount');
  if (alerts.length === 0) { list.innerHTML = `<div class="empty"><div class="empty-icon">✓</div><div>لا توجد تنبيهات حالية</div></div>`; count.style.display = 'none'; return; }
  count.textContent = alerts.length;
  count.style.display = 'inline-block';
  list.innerHTML = alerts.map(a => `<div class="alert ${a.urgent ? 'urgent' : ''}"><div class="alert-content"><div class="alert-title">${a.title}</div><div class="alert-desc">${a.desc}</div></div><div class="alert-days ${a.urgent ? 'danger' : 'warn'}">${a.label}</div><button class="action-btn" onclick="exportPDF('${a.record.id}')">عرض العقد</button></div>`).join('');
}

function renderStats() {
  document.getElementById('ownerCount').textContent = records.filter(r => r.type === 'owner').length;
  document.getElementById('tenantCount').textContent = records.filter(r => r.type === 'tenant').length;
  document.getElementById('companyCount').textContent = records.filter(r => r.type === 'company').length;
  document.getElementById('totalCount').textContent = records.length;
}

function destroyCharts() { Object.values(chartInstances).forEach(c => { if (c) c.destroy(); }); chartInstances = {}; }

function renderCharts() {
  destroyCharts();
  const owners = records.filter(r => r.type === 'owner').length;
  const tenants = records.filter(r => r.type === 'tenant').length;
  const partners = records.filter(r => r.type === 'company').length;
  const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#e8eaed', font: { family: 'Tajawal' } } } } };

  const distCtx = document.getElementById('distChart');
  if (distCtx) chartInstances.dist = new Chart(distCtx, { type: 'doughnut', data: { labels: ['ملاك', 'مستأجرين', 'شركاء'], datasets: [{ data: [owners, tenants, partners], backgroundColor: ['#5fb878', '#f0c674', '#d4a574'], borderColor: '#1c2230', borderWidth: 2 }] }, options: opts });

  const totalAnnual = records.filter(r => r.type === 'tenant').reduce((s, r) => s + (parseFloat(r.data.rent) || 0), 0);
  const monthly = Math.round(totalAnnual / 12);
  const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو'];
  const revCtx = document.getElementById('revChart');
  if (revCtx) chartInstances.rev = new Chart(revCtx, { type: 'bar', data: { labels: months, datasets: [{ label: 'الإيرادات', data: months.map(() => monthly), backgroundColor: '#d4a574', borderRadius: 6 }] }, options: { ...opts, scales: { y: { ticks: { color: '#8b94a3' }, grid: { color: '#2a3142' } }, x: { ticks: { color: '#8b94a3' }, grid: { display: false } } } } });

  const typeCount = {};
  records.filter(r => r.type === 'owner').forEach(r => { const t = r.data.propertyType || 'غير محدد'; typeCount[t] = (typeCount[t] || 0) + 1; });
  const typeCtx = document.getElementById('typeChart');
  if (typeCtx) chartInstances.type = new Chart(typeCtx, { type: 'bar', data: { labels: Object.keys(typeCount).length ? Object.keys(typeCount) : ['لا توجد بيانات'], datasets: [{ data: Object.values(typeCount).length ? Object.values(typeCount) : [0], backgroundColor: '#5fb878', borderRadius: 6 }] }, options: { ...opts, plugins: { legend: { display: false } }, scales: { y: { ticks: { color: '#8b94a3', stepSize: 1 }, grid: { color: '#2a3142' } }, x: { ticks: { color: '#8b94a3' }, grid: { display: false } } } } });

  const totalCom = records.filter(r => r.type === 'owner').reduce((s, r) => { const rent = parseFloat(r.data.rent) || 0; const com = parseFloat(r.data.commission) || 0; return s + (rent * 12 * com / 100); }, 0);
  const totalInv = records.filter(r => r.type === 'company').reduce((s, r) => s + (parseFloat(r.data.investment) || 0), 0);

  document.getElementById('financialSummary').innerHTML = `
    <div class="summary-row"><span class="lbl">إجمالي الإيجارات السنوية</span><span class="val">${totalAnnual.toLocaleString('ar-SA')} ر.س</span></div>
    <div class="summary-row"><span class="lbl">عمولات الشركة السنوية</span><span class="val">${Math.round(totalCom).toLocaleString('ar-SA')} ر.س</span></div>
    <div class="summary-row"><span class="lbl">إجمالي رأس المال</span><span class="val">${totalInv.toLocaleString('ar-SA')} ر.س</span></div>
    <div class="summary-row"><span class="lbl">العقارات المدارة</span><span class="val">${owners}</span></div>
    <div class="summary-row"><span class="lbl">عقود نشطة</span><span class="val">${tenants}</span></div>`;
}

function exportPDF(id) {
  const r = records.find(x => x.id === id);
  if (!r) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const titles = { owner: 'Property Owner Contract', tenant: 'Tenant Lease Agreement', company: 'Partnership Agreement' };

  doc.setFontSize(20);
  doc.setTextColor(212, 165, 116);
  doc.text('Property Hub', 105, 20, { align: 'center' });
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text(titles[r.type], 105, 30, { align: 'center' });
  doc.setDrawColor(212, 165, 116);
  doc.line(20, 35, 190, 35);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Date: ${r.date}`, 20, 45);
  doc.text(`Created by: ${r.createdBy}`, 20, 51);
  doc.text(`Record ID: ${r.id}`, 20, 57);

  let y = 70;
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text('Contract Details:', 20, y);
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  const labels = {
    owner: { name: 'Owner Name', id: 'ID Number', phone: 'Phone', email: 'Email', property: 'Property Address', propertyType: 'Property Type', deed: 'Deed Number', rent: 'Monthly Rent (SAR)', commission: 'Commission (%)', startDate: 'Start Date', duration: 'Duration (years)', notes: 'Notes' },
    tenant: { name: 'Tenant Name', id: 'ID Number', nationality: 'Nationality', phone: 'Phone', work: 'Employer', property: 'Property', rent: 'Annual Rent (SAR)', payment: 'Payment Method', deposit: 'Deposit (SAR)', startDate: 'Start Date', endDate: 'End Date', notes: 'Notes' },
    company: { company: 'Company Name', cr: 'CR Number', founded: 'Founded', partner: 'Partner Name', share: 'Share (%)', investment: 'Investment (SAR)', role: 'Role', authority: 'Authority', profits: 'Profit Distribution', notes: 'Notes' }
  };
  const recLabels = labels[r.type];
  for (const [key, value] of Object.entries(r.data)) {
    if (!value) continue;
    const label = recLabels[key] || key;
    const lines = doc.splitTextToSize(`${label}: ${value}`, 170);
    lines.forEach(line => { if (y > 270) { doc.addPage(); y = 20; } doc.text(line, 20, y); y += 6; });
  }
  y += 10;
  if (y > 240) { doc.addPage(); y = 30; }
  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, 90, y);
  doc.line(120, y, 190, y);
  doc.setFontSize(9);
  doc.text('Signature - First Party', 30, y + 6);
  doc.text('Signature - Second Party', 130, y + 6);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated by Property Hub System', 105, 285, { align: 'center' });
  doc.save(`${r.type}_${r.name}_${r.id}.pdf`);
  showToast('تم تصدير العقد بصيغة PDF');
}

function renderPartners() {
  const list = document.getElementById('partnersList');
  if (users.length === 0) { list.innerHTML = '<p style="color:var(--muted); font-size:13px;">لا يوجد مستخدمين</p>'; return; }
  list.innerHTML = users.map(u => `<div class="partner-item"><div class="partner-info"><strong>${u.name}</strong><span>@${u.username} · انضم في ${new Date(u.createdAt).toLocaleDateString('ar-SA')}</span></div><div><span class="role-badge">${u.role === 'partner' ? 'شريك' : 'مدير'}</span>${u.username === currentUser.username ? '<span style="color:var(--success); font-size:11.5px;">(أنت)</span>' : ''}</div></div>`).join('');
}

function toggleCodeVisibility() {
  const inp = document.getElementById('companyCodeDisplay');
  inp.value = inp.value === '••••••••••••' ? inp.dataset.value : '••••••••••••';
}

async function regenerateCode() {
  if (!confirm('سيتم تغيير الرمز السري. كل من سيسجل بحساب جديد سيحتاج الرمز الجديد. متأكد؟')) return;
  companyCode = 'PROP-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  await saveCode();
  const inp = document.getElementById('companyCodeDisplay');
  inp.dataset.value = companyCode;
  inp.value = companyCode;
  showToast('تم تحديث الرمز السري');
}

async function changePassword() {
  const cur = document.getElementById('current-pwd').value;
  const newP = document.getElementById('new-pwd').value;
  if (!cur || !newP) { showToast('الرجاء تعبئة الحقول', true); return; }
  if (hash(cur) !== currentUser.passwordHash) { showToast('كلمة المرور الحالية غير صحيحة', true); return; }
  if (newP.length < 6) { showToast('كلمة المرور قصيرة', true); return; }
  currentUser.passwordHash = hash(newP);
  const idx = users.findIndex(u => u.username === currentUser.username);
  if (idx > -1) users[idx] = currentUser;
  await saveUsers();
  document.getElementById('current-pwd').value = '';
  document.getElementById('new-pwd').value = '';
  showToast('تم تحديث كلمة المرور');
}

function showToast(msg, isError) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderColor = isError ? 'var(--danger)' : 'var(--success)';
  t.style.borderRightColor = isError ? 'var(--danger)' : 'var(--success)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ============== EXPORT / IMPORT BACKUP ==============
function exportAllData() {
  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: currentUser ? currentUser.name : 'unknown',
    data: {
      users: users,
      records: records,
      companyCode: companyCode,
      ownerAccounts: ownerAccounts,
      maintenanceRequests: maintenanceRequests
    }
  };

  const jsonText = JSON.stringify(backup, null, 2);

  // محاولة 1: تحميل كملف (يشتغل على المتصفح العادي)
  let downloadWorked = false;
  try {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `property_hub_backup_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    downloadWorked = true;
  } catch (e) { /* فشل التحميل */ }

  // محاولة 2: نسخ للحافظة
  let clipboardWorked = false;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(jsonText).then(() => {
      showToast('✓ تم نسخ البيانات — الصقها في ملاحظات الجوال أو واتساب');
    }).catch(() => {
      showBackupModal(jsonText);
    });
    clipboardWorked = true;
  }

  // محاولة 3: عرض في نافذة للنسخ اليدوي
  if (!downloadWorked && !clipboardWorked) {
    showBackupModal(jsonText);
  }
}

function showBackupModal(text) {
  // إنشاء نافذة عرض البيانات
  let modal = document.getElementById('backupModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'backupModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal-head">
          <div><h2>نسخة احتياطية</h2><p>اضغط مطولاً على النص لتحديده ونسخه</p></div>
          <button class="close-btn" onclick="document.getElementById('backupModal').classList.remove('show')">✕</button>
        </div>
        <textarea id="backupText" readonly style="min-height: 300px; font-family: monospace; font-size: 11px; direction: ltr;"></textarea>
        <div class="form-actions">
          <button class="primary" onclick="copyBackupText()">📋 نسخ الكل</button>
          <button class="secondary" onclick="document.getElementById('backupModal').classList.remove('show')">إغلاق</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  document.getElementById('backupText').value = text;
  modal.classList.add('show');
}

function copyBackupText() {
  const textarea = document.getElementById('backupText');
  textarea.select();
  textarea.setSelectionRange(0, 99999);
  try {
    document.execCommand('copy');
    showToast('✓ تم النسخ');
  } catch {
    showToast('استخدم نسخ يدوي', true);
  }
}

async function importAllData(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!confirm('سيتم استبدال جميع البيانات الحالية ببيانات الملف. متأكد؟')) {
    event.target.value = '';
    return;
  }
  try {
    const text = await file.text();
    await applyImportedData(text);
  } catch (e) {
    showToast('فشل قراءة الملف: ' + e.message, true);
  }
  event.target.value = '';
}

// استيراد بلصق النص (للجوال)
function openImportTextModal() {
  let modal = document.getElementById('importTextModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'importTextModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal-head">
          <div><h2>استيراد بلصق النص</h2><p>الصق النسخة الاحتياطية التي نسختها سابقاً</p></div>
          <button class="close-btn" onclick="document.getElementById('importTextModal').classList.remove('show')">✕</button>
        </div>
        <textarea id="importTextArea" placeholder="الصق هنا..." style="min-height: 250px; font-family: monospace; font-size: 11px; direction: ltr;"></textarea>
        <div class="form-actions">
          <button class="primary" onclick="processImportText()">استيراد</button>
          <button class="secondary" onclick="document.getElementById('importTextModal').classList.remove('show')">إلغاء</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  document.getElementById('importTextArea').value = '';
  modal.classList.add('show');
}

async function processImportText() {
  const text = document.getElementById('importTextArea').value.trim();
  if (!text) { showToast('الرجاء لصق النص', true); return; }
  if (!confirm('سيتم استبدال جميع البيانات الحالية. متأكد؟')) return;
  try {
    await applyImportedData(text);
    document.getElementById('importTextModal').classList.remove('show');
  } catch (e) {
    showToast('نص غير صالح: ' + e.message, true);
  }
}

async function applyImportedData(text) {
  const backup = JSON.parse(text);
  if (!backup.data) throw new Error('ملف غير صالح');

  users = backup.data.users || [];
  records = backup.data.records || [];
  companyCode = backup.data.companyCode || companyCode;
  ownerAccounts = backup.data.ownerAccounts || [];
  maintenanceRequests = backup.data.maintenanceRequests || [];

  await saveAllUnified();

  renderAll();
  renderPartners();
  showToast(`✓ تم استيراد ${records.length} سجل و ${users.length} مستخدم`);
}

function renderAll() { renderStats(); renderRecords(); renderAlerts(); updatePendingReqBadge(); }

// ============================================================
// ============ OWNER PORTAL FUNCTIONS ========================
// ============================================================

// --- إنشاء حساب للمالك (من قبل الشريك) ---
function openCreateOwnerAccount() {
  // فلترة الملاك المسجلين من السجلات
  const ownerRecords = records.filter(r => r.type === 'owner');
  const select = document.getElementById('select-owner-record');
  select.innerHTML = '<option value="">-- اختر من قائمة الملاك المسجلين --</option>';
  ownerRecords.forEach(r => {
    // التحقق إذا كان للمالك حساب مسبق
    const hasAccount = ownerAccounts.find(a => a.recordId === r.id);
    if (!hasAccount) {
      select.innerHTML += `<option value="${r.id}">${r.name} - ${r.data.phone || 'بدون جوال'}</option>`;
    }
  });

  if (ownerRecords.length === 0) {
    showToast('لا يوجد ملاك مسجلين. سجل المالك أولاً من السجلات', true);
    return;
  }

  // توليد رمز افتراضي
  document.getElementById('new-owner-code').value = generateOwnerCode();
  selectedLoginMethod = 'account';
  document.querySelectorAll('[data-loginmethod]').forEach(o => o.classList.toggle('active', o.dataset.loginmethod === 'account'));
  document.getElementById('account-method-fields').style.display = 'block';
  document.getElementById('link-method-fields').style.display = 'none';
  document.getElementById('new-owner-username').value = '';
  document.getElementById('new-owner-password').value = '';

  openModal('create-owner');
}

function selectLoginMethod(method) {
  selectedLoginMethod = method;
  document.querySelectorAll('[data-loginmethod]').forEach(o => o.classList.toggle('active', o.dataset.loginmethod === method));
  document.getElementById('account-method-fields').style.display = method === 'account' ? 'block' : 'none';
  document.getElementById('link-method-fields').style.display = method === 'link' ? 'block' : 'none';

  // إذا اختار رابط، يولد رمز جديد
  if (method === 'link') {
    document.getElementById('new-owner-code').value = generateOwnerCode();
  }

  // تعبئة اسم المستخدم تلقائياً برقم الجوال
  if (method === 'account') {
    const recId = document.getElementById('select-owner-record').value;
    if (recId) {
      const rec = records.find(r => r.id === recId);
      if (rec && rec.data.phone) {
        document.getElementById('new-owner-username').value = rec.data.phone;
      }
    }
  }
}

function generateOwnerCode() {
  const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `OWN-${part1}-${part2}`;
}

async function createOwnerAccount() {
  const recordId = document.getElementById('select-owner-record').value;
  if (!recordId) { showToast('الرجاء اختيار مالك', true); return; }

  const ownerRecord = records.find(r => r.id === recordId);
  if (!ownerRecord) { showToast('المالك غير موجود', true); return; }

  const account = {
    id: 'own_acc_' + Date.now(),
    recordId: recordId,
    name: ownerRecord.name,
    phone: ownerRecord.data.phone || '',
    loginMethod: selectedLoginMethod,
    createdAt: new Date().toISOString(),
    createdBy: currentUser.name
  };

  if (selectedLoginMethod === 'account') {
    const username = document.getElementById('new-owner-username').value.trim();
    const password = document.getElementById('new-owner-password').value;
    if (!username || !password) { showToast('تعبئة اسم المستخدم وكلمة المرور مطلوبة', true); return; }
    if (ownerAccounts.find(a => a.username === username)) { showToast('اسم المستخدم مستخدم بالفعل', true); return; }
    account.username = username;
    account.passwordHash = hash(password);
    account.passwordPlain = password; // محفوظ مؤقتاً لتسليمه للمالك
  } else {
    account.accessCode = document.getElementById('new-owner-code').value;
  }

  ownerAccounts.push(account);
  await saveOwnerAccounts();
  closeModal('create-owner');
  renderOwnersMgmt();

  // عرض بيانات الدخول للنسخ
  if (selectedLoginMethod === 'account') {
    alert(`تم إنشاء الحساب بنجاح!\n\nأرسل البيانات للمالك:\n\nاسم المستخدم: ${account.username}\nكلمة المرور: ${account.passwordPlain}\n\nيمكن للمالك الدخول من شاشة "دخول الملاك" → "حساب"`);
  } else {
    alert(`تم إنشاء الرمز بنجاح!\n\nأرسل هذا الرمز للمالك:\n\n${account.accessCode}\n\nيمكنه الدخول من شاشة "دخول الملاك" → "رابط خاص"`);
  }

  showToast('تم إنشاء حساب المالك');
}

function renderOwnersMgmt() {
  const body = document.getElementById('ownersMgmtBody');
  document.getElementById('ownersAccountsCount').textContent = `${ownerAccounts.length} حساب`;

  if (ownerAccounts.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="empty"><div class="empty-icon">👥</div><div>لا توجد حسابات ملاك بعد. ابدأ بإنشاء واحد!</div></td></tr>`;
    return;
  }

  body.innerHTML = ownerAccounts.map(a => {
    const propsCount = records.filter(r => r.type === 'owner' && r.id === a.recordId).length;
    // عد العقارات المرتبطة بهذا المالك (نفس الاسم)
    const ownedProps = records.filter(r => r.type === 'owner' && r.name === a.name).length;
    const loginInfo = a.loginMethod === 'account'
      ? `<code style="font-size:11px; background:var(--bg-elev); padding:2px 6px; border-radius:4px;">${a.username}</code>`
      : `<code style="font-size:11px; background:var(--bg-elev); padding:2px 6px; border-radius:4px;">${a.accessCode}</code>`;
    return `<tr>
      <td style="font-weight:500;">${a.name}</td>
      <td><span class="tag ${a.loginMethod === 'account' ? 'tag-owner' : 'tag-company'}">${a.loginMethod === 'account' ? 'حساب' : 'رمز'}</span></td>
      <td>${loginInfo}</td>
      <td>${ownedProps} عقار</td>
      <td>
        <button class="action-btn" onclick="copyOwnerCredentials('${a.id}')">نسخ البيانات</button>
        <button class="action-btn del" onclick="deleteOwnerAccount('${a.id}')">حذف</button>
      </td>
    </tr>`;
  }).join('');
}

function copyOwnerCredentials(accId) {
  const a = ownerAccounts.find(x => x.id === accId);
  if (!a) return;
  let text;
  if (a.loginMethod === 'account') {
    text = `بيانات دخول بوابة المالك:\n\nالموقع: (رابط النظام)\nاسم المستخدم: ${a.username}\nكلمة المرور: ${a.passwordPlain || '(تم تغييرها)'}\n\nادخل من شاشة "دخول الملاك"`;
  } else {
    text = `رمز دخول بوابة المالك:\n\nالموقع: (رابط النظام)\nالرمز: ${a.accessCode}\n\nادخل من شاشة "دخول الملاك" → "رابط خاص"`;
  }
  navigator.clipboard.writeText(text).then(() => {
    showToast('تم نسخ البيانات، الصقها في رسالة للمالك');
  }).catch(() => {
    alert(text);
  });
}

async function deleteOwnerAccount(accId) {
  if (!confirm('متأكد من حذف حساب المالك؟ لن يستطيع الدخول بعد ذلك.')) return;
  ownerAccounts = ownerAccounts.filter(a => a.id !== accId);
  await saveOwnerAccounts();
  renderOwnersMgmt();
  showToast('تم الحذف');
}

// --- تسجيل دخول المالك ---
async function handleOwnerLogin() {
  const username = document.getElementById('owner-username').value.trim();
  const password = document.getElementById('owner-password').value;
  if (!username || !password) { showOwnerError('الرجاء تعبئة جميع الحقول'); return; }

  const account = ownerAccounts.find(a => a.loginMethod === 'account' && a.username === username && a.passwordHash === hash(password));
  if (!account) { showOwnerError('اسم المستخدم أو كلمة المرور غير صحيحة'); return; }

  currentOwner = account;
  try { await window.storage.set('current_session', 'owner:' + account.id, false); } catch {}
  enterOwnerPortal();
}

async function handleOwnerLinkLogin() {
  const code = document.getElementById('owner-link-code').value.trim().toUpperCase();
  if (!code) { showOwnerError('الرجاء إدخال الرمز'); return; }

  const account = ownerAccounts.find(a => a.loginMethod === 'link' && a.accessCode === code);
  if (!account) { showOwnerError('الرمز غير صحيح'); return; }

  currentOwner = account;
  try { await window.storage.set('current_session', 'owner:' + account.id, false); } catch {}
  enterOwnerPortal();
}

function showOwnerError(msg) {
  const el = document.getElementById('ownerErrorMsg');
  el.textContent = msg;
  el.classList.add('show');
  document.getElementById('ownerInfoMsg').classList.remove('show');
}

async function logoutOwner() {
  try { await window.storage.delete('current_session', false); } catch {}
  currentOwner = null;
  document.getElementById('ownerPortal').style.display = 'none';
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('owner-username').value = '';
  document.getElementById('owner-password').value = '';
  document.getElementById('owner-link-code').value = '';
  switchLoginType('partner');
}

function enterOwnerPortal() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('ownerPortal').style.display = 'block';
  document.getElementById('ownerNameDisplay').textContent = currentOwner.name;
  document.getElementById('ownerWelcomeName').textContent = currentOwner.name;
  document.getElementById('ownerAvatar').textContent = currentOwner.name.charAt(0);
  renderOwnerPortal();
}

function renderOwnerPortal() {
  // عقارات المالك (كل السجلات من نوع owner ولها نفس الاسم)
  const myProperties = records.filter(r => r.type === 'owner' && r.name === currentOwner.name);

  // العقارات المؤجرة (نشوف لو في عقد مستأجر يطابق العقار)
  let rentedCount = 0;
  myProperties.forEach(prop => {
    const tenant = records.find(r => r.type === 'tenant' && r.data.property && prop.data.property && r.data.property.includes(prop.data.property.substring(0, 10)));
    if (tenant) rentedCount++;
  });
  const vacantCount = myProperties.length - rentedCount;

  // الطلبات الخاصة بالمالك
  const myRequests = maintenanceRequests.filter(r => r.ownerId === currentOwner.id);

  document.getElementById('ownerPropsCount').textContent = myProperties.length;
  document.getElementById('ownerRentedCount').textContent = rentedCount;
  document.getElementById('ownerVacantCount').textContent = vacantCount;
  document.getElementById('ownerReqCount').textContent = myRequests.length;

  // عرض العقارات
  const grid = document.getElementById('ownerPropertiesGrid');
  if (myProperties.length === 0) {
    grid.innerHTML = `<div class="empty" style="grid-column: 1 / -1;"><div class="empty-icon">🏠</div><div>لم يتم تسجيل عقارات باسمك بعد. تواصل مع الشركة</div></div>`;
  } else {
    grid.innerHTML = myProperties.map(prop => {
      const tenant = records.find(r => r.type === 'tenant' && r.data.property && prop.data.property && r.data.property.includes(prop.data.property.substring(0, 10)));
      const isRented = !!tenant;
      const rent = parseFloat(prop.data.rent) || 0;
      const commission = parseFloat(prop.data.commission) || 0;
      const netIncome = rent - (rent * commission / 100);

      return `<div class="property-card">
        <div class="property-card-head">
          <div class="property-icon">🏠</div>
          <span class="property-status ${isRented ? 'status-rented' : 'status-vacant'}">${isRented ? 'مؤجر' : 'شاغر'}</span>
        </div>
        <h3>${prop.data.propertyType || 'عقار'}</h3>
        <div class="addr">${prop.data.property || 'غير محدد'}</div>
        <div class="property-stat"><span class="lbl">الإيجار الشهري</span><span class="val">${rent.toLocaleString('ar-SA')} ر.س</span></div>
        <div class="property-stat"><span class="lbl">العمولة</span><span class="val">${commission}%</span></div>
        <div class="property-stat"><span class="lbl">صافي شهري</span><span class="val" style="color: var(--success);">${netIncome.toLocaleString('ar-SA')} ر.س</span></div>
        ${tenant ? `<div class="property-stat"><span class="lbl">المستأجر</span><span class="val">${tenant.name}</span></div>` : ''}
        <div class="property-actions">
          <button class="action-btn" onclick="exportPDF('${prop.id}')">📄 العقد PDF</button>
          ${tenant ? `<button class="action-btn" onclick="exportPDF('${tenant.id}')">📄 عقد المستأجر</button>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  // عرض الطلبات
  const reqList = document.getElementById('ownerReqList');
  if (myRequests.length === 0) {
    reqList.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><div>لم تقدم أي طلبات بعد. اضغط زر + لإضافة طلب جديد</div></div>`;
  } else {
    reqList.innerHTML = myRequests.map(r => {
      const statusClass = r.status === 'completed' ? 'req-done' : r.status === 'in-progress' ? 'req-progress' : 'req-pending';
      const statusText = r.status === 'completed' ? 'منجز' : r.status === 'in-progress' ? 'قيد المعالجة' : 'قيد المراجعة';
      return `<div class="req-item">
        <div class="req-info">
          <div class="req-title">${r.title}</div>
          <div class="req-desc">${r.type} · ${r.property || 'غير محدد'} · ${new Date(r.createdAt).toLocaleDateString('ar-SA')}</div>
          ${r.description ? `<div class="req-desc" style="margin-top:6px; color:var(--text);">${r.description}</div>` : ''}
          ${r.reply ? `<div class="req-desc" style="margin-top:6px; padding:8px; background:var(--bg-elev); border-radius:6px; color:var(--text);"><strong>رد الشركة:</strong> ${r.reply}</div>` : ''}
        </div>
        <span class="req-status ${statusClass}">${statusText}</span>
      </div>`;
    }).join('');
  }
}

// --- طلب جديد من المالك ---
function openNewRequest() {
  // عبي قائمة العقارات
  const myProperties = records.filter(r => r.type === 'owner' && r.name === currentOwner.name);
  const select = document.getElementById('req-property');
  select.innerHTML = '<option value="">-- اختر العقار --</option>';
  myProperties.forEach(p => {
    select.innerHTML += `<option value="${p.data.property}">${p.data.propertyType} - ${p.data.property}</option>`;
  });
  document.getElementById('req-title').value = '';
  document.getElementById('req-desc').value = '';
  openModal('new-request');
}

async function submitOwnerRequest() {
  const type = document.getElementById('req-type').value;
  const property = document.getElementById('req-property').value;
  const title = document.getElementById('req-title').value.trim();
  const description = document.getElementById('req-desc').value.trim();

  if (!title) { showToast('الرجاء إدخال عنوان الطلب', true); return; }

  const request = {
    id: 'req_' + Date.now(),
    ownerId: currentOwner.id,
    ownerName: currentOwner.name,
    type, property, title, description,
    status: 'pending',
    createdAt: new Date().toISOString(),
    reply: ''
  };

  maintenanceRequests.unshift(request);
  await saveRequests();
  closeModal('new-request');
  renderOwnerPortal();
  showToast('تم إرسال الطلب بنجاح');
}

// --- عرض الطلبات للشريك ---
function renderAdminRequests() {
  const list = document.getElementById('adminReqList');
  if (maintenanceRequests.length === 0) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">✓</div><div>لا توجد طلبات حالياً</div></div>`;
    return;
  }

  list.innerHTML = maintenanceRequests.map(r => {
    const statusClass = r.status === 'completed' ? 'req-done' : r.status === 'in-progress' ? 'req-progress' : 'req-pending';
    const statusText = r.status === 'completed' ? 'منجز' : r.status === 'in-progress' ? 'قيد المعالجة' : 'قيد المراجعة';
    return `<div class="req-item">
      <div class="req-info">
        <div class="req-title">${r.title} <span style="color:var(--muted); font-size:12px; font-weight:normal;">— ${r.ownerName}</span></div>
        <div class="req-desc">${r.type} · ${r.property || 'غير محدد'} · ${new Date(r.createdAt).toLocaleDateString('ar-SA')}</div>
        ${r.description ? `<div class="req-desc" style="margin-top:6px; color:var(--text);">${r.description}</div>` : ''}
        ${r.reply ? `<div class="req-desc" style="margin-top:6px; padding:8px; background:var(--bg-elev); border-radius:6px;"><strong>الرد:</strong> ${r.reply}</div>` : ''}
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
        <span class="req-status ${statusClass}">${statusText}</span>
        <div>
          <select onchange="updateRequestStatus('${r.id}', this.value)" style="padding:4px 8px; font-size:11px;">
            <option value="pending" ${r.status === 'pending' ? 'selected' : ''}>قيد المراجعة</option>
            <option value="in-progress" ${r.status === 'in-progress' ? 'selected' : ''}>قيد المعالجة</option>
            <option value="completed" ${r.status === 'completed' ? 'selected' : ''}>منجز</option>
          </select>
          <button class="action-btn" onclick="addReplyToRequest('${r.id}')">💬 رد</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

async function updateRequestStatus(reqId, status) {
  const req = maintenanceRequests.find(r => r.id === reqId);
  if (!req) return;
  req.status = status;
  await saveRequests();
  renderAdminRequests();
  updatePendingReqBadge();
  showToast('تم تحديث الحالة');
}

async function addReplyToRequest(reqId) {
  const req = maintenanceRequests.find(r => r.id === reqId);
  if (!req) return;
  const reply = prompt('اكتب ردك على المالك:', req.reply || '');
  if (reply === null) return;
  req.reply = reply;
  await saveRequests();
  renderAdminRequests();
  showToast('تم حفظ الرد');
}

function updatePendingReqBadge() {
  const pending = maintenanceRequests.filter(r => r.status === 'pending').length;
  const badge = document.getElementById('pendingReqCount');
  if (badge) {
    if (pending > 0) { badge.textContent = pending; badge.style.display = 'inline-block'; }
    else { badge.style.display = 'none'; }
  }
}

// ============================================================

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('show'); });
});

(async function init() {
  await loadAll();
  const hasSession = await checkSession();
  if (!hasSession && users.length === 0) {
    showInfo('مرحباً! أنشئ أول حساب باستخدام الرمز السري: PROP-2026-SECRET');
    switchAuthMode('register');
  }
})();
</script>
</body>
</html>
