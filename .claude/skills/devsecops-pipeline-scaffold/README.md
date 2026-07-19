# DevSecOps Pipeline Scaffold

A set of ready-to-use GitHub Actions workflows and config templates for the core DevSecOps checks every pipeline should have: secret scanning, dependency scanning, image scanning, SAST, and config scanning — plus the reasoning for why each one gates a specific stage of your pipeline, not just "run everything on every push."

This started as a write-up of what I've actually tested and used across my own projects ([full post here](https://blog.545plea.xyz/you-need-a-devsecops-pipeline)). This repo turns that into copy-pasteable templates.

## Installing this into a project

If you're copying this skill into another project's repo (e.g. `.claude/skills/devsecops-pipeline-scaffold`), don't just `git clone` it in place — that leaves a nested `.git` folder inside your project, which Git will treat as an embedded repo rather than plain files (you'll see a warning like `adding embedded git repository` when you try to commit).

Instead, strip the `.git` folder as part of getting the files in:

```bash
git clone https://github.com/shubomifashakin/devsecops-pipeline-scaffold .claude/skills/devsecops-pipeline-scaffold
rm -rf .claude/skills/devsecops-pipeline-scaffold/.git
```

Or, if you already hit the warning and committed anyway:

```bash
rm -rf .claude/skills/devsecops-pipeline-scaffold/.git
git add -A
```

If you actually want the skill to stay linked to this repo (so you can pull updates later), use a submodule instead:

```bash
git submodule add https://github.com/shubomifashakin/devsecops-pipeline-scaffold .claude/skills/devsecops-pipeline-scaffold
```

## What's included

| Concept | Tool | File |
|---|---|---|
| Secret scanning | Gitleaks | `assets/workflows/secret-scanning.yml` + `assets/configs/.gitleaks.toml` + `assets/configs/.pre-commit-config.yaml` |
| Dependency scanning | Trivy (filesystem mode) | `assets/workflows/dependency-scanning.yml` + `assets/configs/.trivyignore` |
| Image scanning | Trivy (image mode) | `assets/workflows/image-scanning.yml` |
| SAST | Semgrep | `assets/workflows/sast-semgrep.yml` + `assets/configs/.semgrep.yml` |
| Config scanning (Terraform/CloudFormation) | Checkov | `assets/workflows/config-scanning-checkov.yml` |
| Config scanning (AWS CDK) | CDK Nag | `references/cdk-nag-setup.md` (app code, not a workflow) |

Read `references/gate-model.md` for the reasoning behind which stage each concept gates and why every workflow follows a two-stage scan-then-enforce pattern (report findings to the Security tab regardless of outcome, then a second step that actually fails the job past a severity threshold).

## Using this as plain templates

You don't need any AI tooling to use this. Copy the relevant `.yml` files into `.github/workflows/` in your repo, copy the matching config file (`.gitleaks.toml`, `.trivyignore`, `.semgrep.yml`) into your repo root, and adjust:

- The `dev` branch reference to match your actual default/protected branch
- The `DISCORD_WEBHOOK` secret reference — remove the `notify` job or swap it for Slack/email if you don't use Discord
- Severity thresholds if you want stricter/looser gating
- Path filters on the config-scanning workflow so it doesn't fire on every PR if IaC is a small part of your repo
- The image-scanning workflow — replace `your-image` with your actual image name, set `DOCKERHUB_USERNAME` as a repo variable and `DOCKERHUB_TOKEN` as a secret, then uncomment the push step once you're ready to push after a clean scan

- The pre-commit hook — copy `.pre-commit-config.yaml` to your repo root (or merge the gitleaks block into your existing one), then install and activate it:
  ```bash
  pip install pre-commit   # Windows / macOS / Linux
  pre-commit install
  ```
  CI catches secrets after they're pushed; the pre-commit hook catches them before they ever leave your machine.

These are starting points, not drop-in finals. Review each file before committing it — branch names, secrets, severity thresholds, and paths will almost certainly need adjusting for your project.

## Using this as a Claude Skill

This repo is also structured as a [Claude Code skill](https://docs.anthropic.com/en/docs/claude-code/skills) — `SKILL.md` at the root, with `assets/` and `references/` as supporting files. When installed, Claude will detect your project's stack, decide which concepts actually apply, and assemble the right files for you rather than you picking manually.

**Install:**

```bash
git clone https://github.com/shubomifashakin/devsecops-pipeline-scaffold .claude/skills/devsecops-pipeline-scaffold
```

**Use** (from inside your project in Claude Code):

```
/devsecops-pipeline-scaffold
```

Claude will inspect your repo, pick the relevant workflows and configs, and drop them in with the right adjustments for your stack.

## Why these tools specifically

I picked tools I've actually run, not just heard of — details and caveats (like CodeQL's private-repo licensing limitation, or why Trivy image scanning can partially substitute for dependency scanning) are covered in the [blog post](https://blog.545plea.xyz/you-need-a-devsecops-pipeline).

## Contributing

Found a false positive pattern worth adding to a default allowlist, or want to add a template for a tool not covered here (DAST, license scanning, report management)? PRs welcome.

## License

MIT — use these however you'd like.
