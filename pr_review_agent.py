#!/usr/bin/env python3
"""PR Review Agent using Claude and the Anthropic SDK."""

import os
import sys
import argparse
import requests
import anthropic


def get_pr_data(repo: str, pr_number: int, github_token: str) -> dict:
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    base_url = f"https://api.github.com/repos/{repo}/pulls/{pr_number}"

    pr_resp = requests.get(base_url, headers=headers)
    pr_resp.raise_for_status()
    pr = pr_resp.json()

    diff_resp = requests.get(
        base_url, headers={**headers, "Accept": "application/vnd.github.v3.diff"}
    )
    diff_resp.raise_for_status()

    files_resp = requests.get(f"{base_url}/files", headers=headers)
    files_resp.raise_for_status()

    return {
        "title": pr["title"],
        "description": pr.get("body") or "",
        "author": pr["user"]["login"],
        "base_branch": pr["base"]["ref"],
        "head_branch": pr["head"]["ref"],
        "diff": diff_resp.text,
        "files": [
            {
                "filename": f["filename"],
                "status": f["status"],
                "additions": f["additions"],
                "deletions": f["deletions"],
                "patch": f.get("patch", ""),
            }
            for f in files_resp.json()
        ],
    }


def review_pr(pr_data: dict) -> str:
    client = anthropic.Anthropic()

    diff = pr_data["diff"]
    if len(diff) > 100_000:
        diff = diff[:100_000] + "\n\n[...diff truncated at 100,000 characters...]"

    files_summary = "\n".join(
        f"  - {f['filename']} ({f['status']}, +{f['additions']}/-{f['deletions']})"
        for f in pr_data["files"]
    )

    prompt = f"""You are an expert code reviewer. Please review the following pull request thoroughly.

## PR Details
- **Title**: {pr_data['title']}
- **Author**: {pr_data['author']}
- **Branch**: `{pr_data['head_branch']}` → `{pr_data['base_branch']}`
- **Description**: {pr_data['description'] or '(none provided)'}

## Changed Files
{files_summary}

## Diff
```diff
{diff}
```

Please provide a structured code review covering:
1. **Summary** — what this PR does
2. **Strengths** — what's done well
3. **Issues** — bugs, security concerns, or correctness problems (label severity: critical/major/minor)
4. **Suggestions** — style, readability, or performance improvements
5. **Overall verdict** — Approve / Request Changes / Comment, with a brief justification

Be specific and reference file names and line numbers where relevant."""

    with client.messages.stream(
        model="claude-opus-4-7",
        max_tokens=4096,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        review = "".join(stream.text_stream)

    return review


def post_review(repo: str, pr_number: int, review: str, github_token: str) -> None:
    url = f"https://api.github.com/repos/{repo}/issues/{pr_number}/comments"
    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    body = f"## 🤖 Claude AI Code Review\n\n{review}"
    resp = requests.post(url, json={"body": body}, headers=headers)
    resp.raise_for_status()
    print(f"Review posted: {resp.json()['html_url']}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Review a GitHub PR using Claude.")
    parser.add_argument("repo", help="GitHub repository in owner/repo format")
    parser.add_argument("pr_number", type=int, help="Pull request number")
    parser.add_argument(
        "--post", action="store_true", help="Post the review as a GitHub comment"
    )
    parser.add_argument("--output", help="Save the review to a file")
    args = parser.parse_args()

    github_token = os.environ.get("GITHUB_TOKEN")
    if not github_token:
        print("Error: GITHUB_TOKEN environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if not anthropic_key:
        print(
            "Error: ANTHROPIC_API_KEY environment variable is not set.", file=sys.stderr
        )
        sys.exit(1)

    print(f"Fetching PR #{args.pr_number} from {args.repo}...")
    pr_data = get_pr_data(args.repo, args.pr_number, github_token)
    print(f"PR: {pr_data['title']} by {pr_data['author']}")
    print(f"Files changed: {len(pr_data['files'])}")
    print("\nGenerating review with Claude (streaming)...\n")

    review = review_pr(pr_data)

    print(review)

    if args.output:
        with open(args.output, "w") as f:
            f.write(review)
        print(f"\nReview saved to {args.output}")

    if args.post:
        print("\nPosting review to GitHub...")
        post_review(args.repo, args.pr_number, review, github_token)


if __name__ == "__main__":
    main()
