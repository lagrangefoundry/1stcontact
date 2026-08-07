---
uid: comment-9ef83312
id: COMMENT-822
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-07T22:33:10.859271+00:00'
updated_at: '2026-08-07T22:33:10.859271+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-0c9021b3
  kind: note
---

Re-assessment complete. **REPORT-1642** — result **PASS** (0 violations, 1 warning, 0 needs_review).

A fix workflow ran between invocations (REPORT-1641, 5 fixes), so this was a re-assessment rather than a repeat. It touched two test files and no production source (`9b7663ada`); the other 34 ACs' tests are byte-identical to last round.

## Verdicts

36 ACs `pass` · STORY-94/95/96 `pass` · CAP-82 `pass`

## Verifying the AC-914 fix

The fix took the **ac-edit** route — one of the two resolutions REPORT-1640 offered and left to the operator. I checked it rather than accepting it, because "edit the AC until the test passes" is exactly the failure mode that category invites. It holds up:

- The vacuous store-unchanged assertion is gone.
- A real canary replaced it: a genuine `deploy()` of a nested slug (`draft/index`) is attempted, refused by the render by name, store asserted unchanged. A deploy really is attempted now, so "nothing shipped" can fail.
- **Mutation-confirmed the canary fires** — disabling the render flatness guard at `render.ts:259` fails the test. The failure was doubly informative: the received error is `Snapshot contains a top-level 'draft' entry (out/draft/index.html)`, meaning the deploy-level gate at `deploy.ts:136` genuinely engages the moment nesting becomes possible. The wiring is real; only its trigger is foreclosed.
- I independently confirmed the uat-edit alternative is blocked without a production backdoor: `renderSite` empties `outDir` then throws on any slug containing a separator, assets land under `out/assets/`, and the gate inspects only `out/`-prefixed entries.

Net evidence went **up**, not down — an assertion that could never fail was traded for one that's mutation-proven.

AC-900's size column is now required on both upload lines. AC-908/AC-918 had Verification text relaxed to match method; behavioural claims unchanged and still fully exercised.

## The one warning

`deploy.ts:136` remains mutation-unpinned — I re-confirmed it against the revised suite, and all 36 still pass with the gate commented out. AC-914's Criterion retains a descriptive wiring clause no test pins. I recorded it as a warning rather than a violation because the AC now *discloses* this in its own text instead of implying coverage it lacks. Standing options for you: authorise a file-list seam in `DeployOptions`, or leave it until nesting arrives and the canary forces the promotion.

One judgment worth flagging: REPORT-1641 forwarded a `needs_review` asking you to confirm the route. I did **not** classify it as `needs_review` here — that category is for elements the intent ledger is silent about, and REQ-111 unambiguously supports this gate. Classifying it there would have forced a FAIL and re-looped the workflow over an already-answered question. It's finding 1 instead, so it stays visible without blocking.

STORY-95's body was never edited (`last_field_updated: uat_coverage`) and needed no edit — its Technical Context already described the gate as a standing invariant verified at its own entry point, which is what the revised AC now says.

Working tree clean; both mutations reverted.
