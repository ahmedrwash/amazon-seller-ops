# Deployment Workflow

## Source of truth

- GitHub repository: `ahmedrwash/amazon-seller-ops`
- Canonical local checkout: `C:\AR\App\horizons-export`
- Do not edit production files in Hostinger or maintain a second independent copy.
- A deployed version is identified by its Git commit, not by a folder name or port.

## Environments

| Environment | Branch | URL | Purpose |
| --- | --- | --- | --- |
| Staging | `staging` | `https://amz-staging.1nlt.com` | Acceptance testing before release |
| Production | `main` | `https://amz.1nlt.com` | Customer-facing Amazon Seller Ops release |

Hostinger auto-deployment must be enabled for each environment and connected only to its assigned branch.

The root domain `1nlt.com` is reserved for the 1NLT platform/portfolio site. It must not be pointed at this repository.

## Multiple SaaS products

Use one repository and one production subdomain per SaaS product. This keeps deployments, rollbacks, environment variables, and access controls independent.

| Product | Repository | Production URL |
| --- | --- | --- |
| Amazon Seller Ops | `amazon-seller-ops` | `amz.1nlt.com` |
| Future product | Separate repository | `<product>.1nlt.com` |

Do not place unrelated SaaS applications in this repository. Shared UI packages can be extracted later if two products genuinely need the same maintained code.

## Change flow

1. Update local `main`: `git switch main && git pull --ff-only origin main`.
2. Create a feature branch: `git switch -c codex/<short-change-name>`.
3. Make the change and run `npm run lint` and `npm run build`.
4. Push the feature branch and open a pull request into `staging`.
5. Verify the deployed staging site, including authentication and the changed workflow.
6. Promote the exact tested commit with a pull request from `staging` into `main`.
7. Verify production and compare `/build-info.json` with the GitHub commit.

Never copy files manually between local folders, upload ZIP files for routine releases, or make the same change twice.

## Verification

Every build publishes deployment metadata at:

- `https://amz.1nlt.com/build-info.json`
- `https://amz-staging.1nlt.com/build-info.json`

The `commit` value must match the intended GitHub commit. A successful page load alone is not proof that the correct version is live.

## Rollback

1. Find the last known-good commit in GitHub or Hostinger deployment history.
2. Revert the faulty commit on the affected branch; do not force-push shared branches.
3. Push the revert and let Hostinger auto-deploy it.
4. Confirm the rollback using `/build-info.json` and a focused smoke test.

## Hostinger cleanup

Keep the existing `@1nlt.com` email plan and mailbox intact. Domain and website cleanup must never remove or reset that email plan. Delete obsolete Hostinger sites only after confirming they are not serving `1nlt.com`, `amz.1nlt.com`, or another active product subdomain.
