# The Gate Model

Each security concept protects a specific stage of the pipeline. Wire tools to the stage they actually gate — not just "run everything on every push."

| Concept            | Gates                          | Trigger pattern used in these templates                  |
|---------------------|---------------------------------|------------------------------------------------------------|
| Secret scanning     | The build                       | PR → `dev`, daily cron, manual dispatch                    |
| Dependency scanning | The build / early feedback      | PR → `dev`, daily cron, manual dispatch                    |
| Image scanning      | The registry push               | Push to `dev` (or whichever branch triggers image build)   |
| SAST                | The pull request                | PR → `dev`, daily cron, manual dispatch                    |
| Config scanning     | Infra changes                   | PR → `dev`, path-filtered to infra/IaC files                |
| DAST                | Staging → production promotion  | Not templated here — runs against a live staging environment, typically on deploy to staging rather than on PR |

## Sequencing logic

- **Fast checks run first, on every PR**: secret scanning, dependency scanning, SAST. These are cheap and catch the majority of issues before merge.
- **Image scanning runs after build, before push**: no point scanning an image that doesn't exist yet, and no point pushing one that hasn't been scanned.
- **Config scanning is path-filtered**: no reason to run Checkov/CDK Nag on every PR if the PR doesn't touch infrastructure code — filter to `.tf`, CDK source, or CloudFormation paths, or it becomes noise.
- **DAST runs latest, against a running system**: it's the last gate before staging becomes production, because it needs something actually deployed to probe.

## Two-stage pattern (scan-then-enforce)

Every templated workflow follows the same two-step pattern:

1. **Report step** (`exit-code: 0` / `soft_fail: true`): always runs, uploads SARIF to the Security tab regardless of outcome, so findings are visible even when the job doesn't fail.
2. **Enforce step** (`exit-code: 1` / `soft_fail: false`): actually fails the job if issues meet the severity threshold, so the gate has teeth.

This gives you both a permanent audit trail (Security tab) and an actual blocking gate, instead of picking one.
