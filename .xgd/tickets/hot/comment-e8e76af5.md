---
uid: comment-e8e76af5
id: COMMENT-2557
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T16:15:26.522286+00:00'
updated_at: '2026-09-10T16:15:26.522286+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-7877bc03
  kind: note
---

Done — attempt 6 complete. REPORT-3758 (`report-7877bc03`).

## What I found

All four actionable findings were one cluster, not four repairs: CAP-82's body is the single element BUNDLE-20's 2026-08-31 reconciliation never reached, so it still described REQ-110's retired design while the three stories underneath it had all been rewritten to the post-REQ-149 world. Applied as one coherent body rewrite.

## The edits

| Finding | Was | Now |
|---|---|---|
| 1 (violation) | Scope bullet 2: "a shareable, immutable preview that costs the site nothing" | The split that survives — builder-rendered mutable draft vs. immutable numbered revisions; retirement recorded citing REQ-149 D7 |
| 2 (violation) | Bullet 1: "naming it by its contents" | "naming it by the revision number it was minted as"; digest is an audit value, not an address (D6) |
| 3 (violation) | "site definitions stay canonical on the operator's machine" | Exclusion kept, reason fixed: canonical in whichever store holds the site (REQ-143, AC-1) |
| 4 (warning) | "off the operator's machine" / "bytes on disk" / "operator's laptop" | "out of the store it was authored in"; local-origin premise removed |
| 7 (info) | Bullet 5 anchored to `--dry-run`/`--prune` | Re-anchored to STORY-94's forward-only guarantee, since the bullet was being touched anyway |

Retirements are recorded in a named section rather than silently deleted, matching the house style the three story bodies already use.

## Verification

Term sweep of the new body for retired-premise vocabulary returns zero hits on `naming it by its contents`, `operator's machine`, `bytes exist locally`, `on disk`, `dry-run`, `--prune`, `manifest`. `shareable` has exactly one hit — inside the explicit "dropped, not ported" record, which is the shape the check accepts.

## What I deliberately did not do

No ACs touched and no `uat_coverage` written — the report is explicit that this finding has no AC-level echo, and manufacturing field updates would be false progress. No code changes and no test run: nothing behavioral was touched, and the report's own tier-3 check confirmed the code already matches the corrected text. The capability text was the thing that was wrong.

One item forwarded to you rather than fixed: the stale comment at `tools/generate/src/cli/serve.ts:72-74` (still citing the false "Cloudflare Pages auto-serves `.html`" premise) has now survived two alignment cycles. It's explicitly not a finding and sits outside this scope path, so I left it — but it's a one-line comment edit that would retire the drift note from STORY-96's body.

`needs_more_work: false` — handing back to the assessor to verify.
