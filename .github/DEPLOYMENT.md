# Deployment model

GitHub Actions is the authoritative CI/CD system for this repository.

## Production flow

1. Pull requests run `.github/workflows/validate-change.yml`.
2. GitHub Actions installs locked dependencies, runs the canonical and experience regression suite, builds `dist/`, uploads the built site as a short-lived workflow artifact, installs Chromium, and runs Playwright smoke tests.
3. Merges to `main` run `.github/workflows/canonical-corpus.yml` and `.github/workflows/deploy-netlify.yml`.
4. The production workflow builds the exact Git commit in GitHub Actions, validates canonical completeness/graph/diff reports, and deploys the already-built `dist/` output plus Netlify Functions with the Netlify CLI.
5. Production fingerprint, genealogy integrity, media privacy, and canonical immutability are verified after deployment.

## Netlify configuration

Keep Netlify Git builds **stopped**. Netlify must not rebuild the repository after GitHub pushes.

Recommended project settings:

- Build status: **Stopped**
- Deploy Previews: **None**
- Branch deploys: **None** (or production-only; stopped builds prevent Git-triggered builds either way)
- CLI/API production deployments: **Allowed**
- Repository link: keep connected for project metadata; it is not the build authority

Do not re-enable Netlify continuous builds simply to obtain preview URLs. Pull-request build output is available from the `Validate change` workflow artifact instead.

## Canonical safety

Deployment changes must not mutate or silently promote genealogy evidence states. The canonical corpus audit and production workflow must continue to fail on canonical loss, graph-integrity failure, or evidence promotion.

The unresolved Edward Ellery DeVine/DeVeine ↔ William John Rahe Sr. identity bridge remains governed by the canonical research model; deployment tooling must not alter that state.
