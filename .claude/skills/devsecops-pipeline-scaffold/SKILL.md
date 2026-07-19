---
name: devsecops-pipeline-scaffold
description: Scaffolds a DevSecOps security pipeline (secret scanning, dependency scanning, image scanning, SAST, config scanning) into any project, using GitHub Actions workflows and config files. Trigger this whenever the user asks to add security scanning, a security pipeline, DevSecOps tooling, CI/CD security gates, or mentions any of Gitleaks, Trivy, Semgrep, Checkov, or CDK Nag in the context of setting something up (not just discussing them). Also trigger for requests like "harden my CI pipeline", "add vulnerability scanning to my repo", "set up secret scanning", or "what security checks should this project have" — even if the user doesn't use the words "DevSecOps" or "skill" explicitly. Use this any time the deliverable is actual pipeline files (workflows, configs), not just an explanation of concepts.
---

# DevSecOps Pipeline Scaffold

Scaffolds a working security pipeline into a project: which concepts apply, which tools to use, and the actual GitHub Actions workflow + config files to drop in — all following one consistent gate model (see `references/gate-model.md`).

## Step 1: Detect the project

Look at what's actually in the repo before assuming anything:

- **Language/stack**: check for `package.json` (Node/TS — likely NestJS), `go.mod` (Go), `Cargo.toml` (Rust), etc.
- **Containerized?**: check for a `Dockerfile` or `docker-compose.yml` — this determines whether image scanning applies.
- **AWS CDK present?**: check for `cdk.json` or `aws-cdk-lib` in dependencies — this determines whether to recommend CDK Nag over Checkov for config scanning.
- **Other IaC present?**: check for `.tf` files (Terraform) or CloudFormation templates — Checkov applies here regardless of stack.
- **Existing CI**: check `.github/workflows/` for what's already there — don't duplicate existing scanning, and match the existing workflow style (branch names, trigger patterns) if a workflow already exists.
- **Pre-commit hooks**: check for `.pre-commit-config.yaml` and whether it already contains a gitleaks hook — this determines whether to create the file, append to it, or skip.

If the project isn't uploaded/available to inspect, ask the user directly: language, whether it's containerized, and whether it uses AWS CDK or other IaC.

## Step 2: Decide which concepts apply

Not every project needs every gate. Use this as the default set, and drop anything that doesn't apply:

| Concept | Always include? |
|---|---|
| Secret scanning | Yes — every project, no exceptions |
| Dependency scanning | Yes — every project with a dependency manifest |
| Image scanning | Only if containerized |
| SAST | Yes — every project with source code to scan |
| Config scanning | Only if IaC is present (CDK → CDK Nag; Terraform/CloudFormation → Checkov) |
| DAST | Only if the user has a staging environment to point it at — this isn't templated here (see note below), just mention it as a next step |
| License management | Only if user mentions compliance requirements — niche, don't add by default |
| Report management (DefectDojo etc.) | Only mention once 3+ scanners are in place and findings need centralizing — not a day-one concern |

## Step 3: Assemble the files

Copy the relevant templates from `assets/workflows/` and `assets/configs/` into the project:

- `assets/workflows/secret-scanning.yml` → Gitleaks, plus `assets/configs/.gitleaks.toml`
- `assets/workflows/dependency-scanning.yml` → Trivy (filesystem mode), plus `assets/configs/.trivyignore`
- `assets/workflows/image-scanning.yml` → Trivy (image mode) — only if containerized
- `assets/workflows/sast-semgrep.yml` → Semgrep, plus `assets/configs/.semgrep.yml`
- `assets/workflows/config-scanning-checkov.yml` → Checkov — only if Terraform/CloudFormation present
- For CDK projects, use `references/cdk-nag-setup.md` instead — this is code added to the CDK app, not a separate workflow
- **Pre-commit hook (always include with secret scanning)**:
  - If `.pre-commit-config.yaml` doesn't exist → create it from `assets/configs/.pre-commit-config.yaml`
  - If it exists but has no gitleaks hook → append the gitleaks repo block from that template to the existing file
  - If a gitleaks hook is already present → skip, don't duplicate
  - Always tell the user to run `pip install pre-commit` followed by `pre-commit install` — `pip` works on Windows, macOS, and Linux, so use that over `brew` or any platform-specific package manager. Give the commands as two separate lines, never chained with `&&`: Windows PowerShell 5.1 (the Windows default) does not support `&&` and errors on it. If a single-line PowerShell form is needed, it's `pip install pre-commit; if ($?) { pre-commit install }`.

All workflow templates follow the same two-stage scan-then-enforce pattern (see `references/gate-model.md` for why) and assume:
- A `dev` branch as the PR target — **adjust this to match the project's actual branch naming** if different.
- A `DISCORD_WEBHOOK` repo secret for notifications — if the user doesn't use Discord, strip the `notify` job or adapt it to Slack/email.
- `security-events: write` permission — required for SARIF upload to the Security tab; flag this to the user if their org restricts default permissions.

## Step 4: Customize before handing off

Don't just dump templates verbatim — adjust:
- Branch names to match the project's actual default/protected branches.
- Severity thresholds (`HIGH,CRITICAL` is the default here) if the user wants stricter or looser gating.
- Path filters on config scanning so it doesn't run on every PR if IaC is a small part of the repo.
- Remove the Discord notify job entirely if not applicable, rather than leaving a broken webhook reference.

## Step 5: Explain the gates, don't just hand over files

Always tell the user which stage each file gates and why (pull from `references/gate-model.md`) — the value of this scaffold is as much the mental model as the files themselves. A user should come away knowing *why* secret scanning runs on every PR while config scanning is path-filtered, not just copy-pasting without understanding the sequencing.

## Reference files

- `references/gate-model.md` — the full gate model, trigger pattern rationale, and the two-stage scan-then-enforce pattern used in every workflow
- `references/cdk-nag-setup.md` — CDK Nag setup (not a workflow file — this is CDK application code)
