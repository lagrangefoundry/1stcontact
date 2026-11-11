---
uid: comment-acabc1df
id: COMMENT-8317
type: comment
title: Comment on bundle BUNDLE-44
created_by: planner
created_at: '2026-11-11T02:35:42.573641+00:00'
updated_at: '2026-11-11T02:35:42.573641+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bundle-374f88d6
  kind: note
---

# Planner decision: G1 (BUG-84) — code_frozen override granted, rung 1, push.ts only

Answers report-c67d242e ("the planner needs to grant the rung-1 code_frozen override")
for gap G1 of report-4f7fbff8. G2 is closed by report-c67d242e and is not reopened.

## Grant

- **Rule**: `code_frozen`, **rung 1**.
- **Subject**: story-aacb7060 (STORY-143).
- **Files**: `tools/generate/src/cli/push.ts` **only**.
- **Trust boundary**: false. The change only alters the advice text the CLI appends
  to a refusal it already reports. It does not change what is pushed, what is refused,
  the gate itself, or any credential handling.
- **Justification (rung 1 decides)**: BUG-84, "What must not change", requires the
  refusal to tell the operator *which* file and *where it came from*, and requires it
  to stay distinguishable from BUG-51's 409. STORY-143 already records the defect
  ("Code issue: the CLI reports the import route's 403 with Cloudflare Access
  advice"). A known contradiction of in-scope intent cannot stay a note.
- **Tip evidence**: `tools/generate/src/cli/push.ts:226` sets
  `refusedByAccess = bounced || res.status === 401 || res.status === 403`.
  Lines 239-242 then append the CF_ACCESS_CLIENT_ID / bin/access-token advice to
  every 403, including the import route's rights refusal.
- **Discriminator (verified in code)**: the import route's rights refusal is
  `json(403, { error, slug, asset, bundle, ... })`
  (`apps/control-app/src/router.ts:1728-1733`, `MirroredAssetError`). A Cloudflare
  Access 403 is not JSON and carries no `asset` field.

## Instructions for the fix batch

1. In `pushSite`, when `res.status === 403` and the body parses as JSON with a string
   `asset` field, treat it as the rights refusal:
   - The message names the asset and its bundle (and member, where the body carries it).
   - It says the bytes were mirrored from a captured page and cannot be published.
   - It says nothing was written.
   - It carries **no** Cloudflare Access advice and **no** `--force` advice, because
     neither can help.
2. Leave these paths byte-for-byte unchanged: 401, any redirect or status 0, a 403
   whose body is not the rights shape (it keeps the Access advice), and 409 (keeps
   the `--force` advice).
3. Parse defensively: a non-JSON or malformed body must fall through to the existing
   Access branch and never throw from the parse.
4. Do not touch `router.ts`, `asset-rights.ts`, the CLI-side gate in `readSitePayload`,
   or anything outside `push.ts`.

## Spec changes (same batch)

- **AC-2589** gains a clause: when the import route refuses capture-mirrored bytes,
  the `1c push` error names the asset and its bundle and carries no Cloudflare Access
  advice, and a 403 without the rights body still gets the Access advice.
- **STORY-143**: replace the "Code issue: ..." reconciliation paragraph with a
  RESOLVED note that cites this decision and the resulting mode_override report.

## UAT

Extend the AC-2589 UAT (or add `test_UAT_AC2589_...` beside it) with two cases. Each
drives the real `pushSite` with a `fetch` double at the HTTP boundary:

- (a) The double returns the route's actual 403 rights body (the shape from
  `router.ts:1729`). Assert the message contains the asset name and the bundle and
  does not contain "Cloudflare Access" or "--force".
- (b) The double returns a plain 403 HTML body. Assert the Access advice is still
  present.

Dependency tests: `test_UAT_AC2588_`, `test_UAT_AC2589_`, and the existing push/import
UATs for BUG-51's 409 and the Access 302/401 paths. All must stay green.
