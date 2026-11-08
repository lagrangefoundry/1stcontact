---
uid: report-fa6344d2
id: REPORT-11257
type: report
title: 'Code Review: bundle-4164b433'
created_by: xgd
created_at: '2026-11-08T03:28:24.879171+00:00'
updated_at: '2026-11-08T03:28:24.879171+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-4164b433
  overrides_audited: 0
  trust_boundary_overrides: 0
  anchor_uid: bundle-4164b433
---

# Code Review

**Result**: PASS

## Summary
The free-coded bundle (BUG-58 invite composer fits its dialog, BUG-59 service token resolved to a person via SERVICE_TOKEN_IDENTITIES plus access-sim acting as the edge, BUG-63 priming shim exports, BUG-64 `live` taken from upstream `transcript` instead of a broken re-derivation, REQ-204 Sign out from the account dialog that also ends the Access session) is small, well-scoped and fully wired. Two non-blocking warnings are recorded below.

0 overrides audited, 0 touched a trust boundary.

## Quality Gates
Lint: success. Build: success. Preflight: pass. Overall: success.

## External Interface Accessibility
New entry points wired in: yes.
- `actingEmail` (identity.ts:1006) is called on the Access branch at index.ts:368.
- `accessLogoutUrl` (access.ts:161) is used by `signOutDestination` (sign-in.ts:~301), which is reached from the existing `POST /sign-out` route.
- `signOutControl` (business.js:~366) is mounted in the `openAccountSurface` footer. `SIGN_OUT_HREF`/`SIGN_OUT_LABEL` are exported from config.js.
- `SERVICE_TOKEN_IDENTITIES` is declared in both the top-level and production `[vars]` in wrangler.toml.
- `bin/access-sim` has a new logout route and forwards requests to the builder; both are exercised by UATs that spawn the real process.
- `Entry` and `registerKmProviders` are consumed through the shim (host-core.ts:650-663, host.ts:185).

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| apps/control-app/wrangler.toml:359 | The production mapping key `1stcontact-publish` is the token's name. ACCESS.md itself says `common_name` is the client id minus `.access`, and Cloudflare's service-token `common_name` is normally its generated Client ID. If so, the production entry never matches and `bin/publish --production` is still refused `no_email`. This fails closed (safe) but leaves the fix inert in production. Confirm against a real minted token. | Warning |
| tools/generate/src/cli/assets.ts:208 | `PrimingProviders` is added to AI_WORKER_EXPORTS but nothing in apps/ or tools/ consumes it, so the shim export is dead. The BUG-63 commit message also describes a `kmPrimingEntries`/roles.ts migration that this commit does not contain; the migration already exists on main in a different shape. | Warning |
| tools/generate/src/cli/ai/host-core.ts:838 | Correct fix: `live` is taken from the upstream fold, removing the `closedPrefix(...).length` divergence. The type is tightened to `live: boolean`. | OK |
| apps/control-app/src/sign-in.ts | The redirect destination is built only from configuration and the request origin, never from caller input, so it is not an open redirect. The session cookie is still cleared when the destination is the edge logout. | OK |
| apps/control-app/src/identity.ts | The mapping is consulted only when the token carries no email. Mapped addresses are casefolded through `normaliseEmail`. An empty var maps nobody. | OK |
| builder.css / business.js / config.js | Consistent with existing modal patterns. No debug code, commented-out blocks or TODO stubs. The duplicated `/sign-out` literal is documented and pinned by a UAT. | OK |

## Checklist Compliance
No architecture, security or design checklist reports exist, so this section was skipped.

## Smoke Test
Entry points: `bin/access-sim` (logout route, service-token exchange) and `POST /sign-out`. I could not invoke the CLI directly because the session's permission mode blocked it. It is exercised by UATs that spawn the real process over HTTP (test_UAT_FC_REQ-204_access_sim_logout, test_UAT_FC_BUG-59_access_sim_service_token). `/sign-out` and the service-token admission are exercised by workers UATs with no internal mocking. All pass in the quality run.

## Issues Found
**Critical (must fix)**:
- None.

**Warnings (should fix)**:
- Verify that the production `SERVICE_TOKEN_IDENTITIES` key matches the `common_name` Cloudflare actually signs for the `bin/publish` token (likely `<client-id>` with or without `.access`, not the token's display name).
- Remove the unused `PrimingProviders` shim export, or use it; the BUG-63 commit message overstates its contents.
