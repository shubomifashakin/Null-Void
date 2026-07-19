# CDK Nag Setup

CDK Nag isn't a GitHub Actions workflow — it runs at synth time, inside the CDK app itself. This is the config-scanning tool for AWS CDK projects specifically, and it's close to a one-line addition.

## Install

```bash
npm install cdk-nag --save-dev
```

## Add to the CDK app entry point (e.g. `bin/app.ts`)

```typescript
import { Aspects } from 'aws-cdk-lib';
import { AwsSolutionsChecks } from 'cdk-nag';

// Apply to the whole app, or scope it to a specific stack if you want
// to roll it out incrementally.
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));
```

## Available rule packs

Pick based on what the project actually needs — don't apply all of them by default:

- `AwsSolutionsChecks` — general AWS best practices, good default for most projects
- `HIPAASecurityChecks` — for healthcare/compliance-scoped workloads
- `NIST80053R5Checks` — for gov/federal-adjacent compliance
- `PCIDSS321Checks` — for anything touching payment card data

## Suppressing findings

Findings are enforced at `cdk synth` / `cdk deploy` time. For accepted-risk exceptions, suppress explicitly rather than ignoring the failure:

```typescript
import { NagSuppressions } from 'cdk-nag';

NagSuppressions.addResourceSuppressions(myResource, [
  {
    id: 'AwsSolutions-XXX',
    reason: 'Explain why this is an accepted risk here.',
  },
]);
```

## Recommendation

Because setup is near zero-friction and it's scoped specifically to CDK, add this on day one of any new CDK project — not as a retrofit.
