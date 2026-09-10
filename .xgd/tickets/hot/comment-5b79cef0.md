---
uid: comment-5b79cef0
id: COMMENT-2462
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T04:43:43.801598+00:00'
updated_at: '2026-09-10T04:43:43.801598+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-659fc3d0
  kind: note
---

Report created: **REPORT-3663** (`report-659fc3d0`) — **FAIL**, 1 violation / 2 warnings / 0 needs_review. Schema verified against the workflow's exit conditions.

## What I checked

CAP-102 has one story (STORY-119, `upgrade`, 18 ACs). I built the intent ledger from its `intent_uid` (BUNDLE-19 → REQ-144), its `updated_by` (BUNDLE-21 → BUG-36/37/38), and BUNDLE-20 (REQ-145/147/149), which the story's own Reconciliation Decisions name but which isn't in the `updated_by` field. Ten intents count toward cumulative intent; none retires anything the story describes.

## The result

**Behaviour is fully aligned.** Every reconciled ask is expressed, and I verified the story's claims against the tree rather than taking its word: `bin/build` runs the four stated stages in order with exit 6 reserved for the preflight; `bin/deploy` implements the hook contract including all six `DEPLOY_*` variables and abort-before-upload; `tools/generate/bin/smoke.mjs` defines exactly the eleven checks the story claims (nine public + two control-surface); `ACCESS_DEV_OPEN` sits at the top level and *not* under `[env.production.vars]`, which is the one stated exception holding. REQ-154's `BROWSER` and REQ-162's `BLOBS` landed after the story's last update and are absorbed by AC-1341's structural form with no edit needed — the design decision working as intended.

**What fails is factual, not behavioural.** The story's Out-of-scope bullet asserts the control application "has never been deployed and its hostname does not resolve," and derives from that a scope limit: the two control-surface checks are "provable against a supplied origin and against a local deploy, **not against production**." Both premises were already false when the story was last updated on 2026-08-31. BUG-36 (2026-08-23) and BUG-37 (2026-08-24) — both in the story's *own* `updated_by` bundle — record `app.1stcontact.io` returning a 302 to the Access login, the deployed D1 queried `--remote`, and a live Error 1102 in Edit mode. `ACCESS.md` documents running `bin/smoke --control-origin https://app.1stcontact.io` against production. Two warnings cover the same premise restated in Technical Context, and a stale "outstanding" claim that the secret mechanism was never proved against the live account — REQ-149 records `ANTHROPIC_API_KEY already on 1stcontact-control-app`, which by its own decision table requires a positive read of the live store.

All three are one root cause in three passages: the BUNDLE-21 pass added BUG-37's retention criteria without revisiting the deployment narrative BUG-36 had already invalidated.

**No acceptance criterion needs to change**, and I flagged that explicitly in the report — the natural but wrong reaction is to re-point the control checks at production. Every AC here is written about a *supplied* origin or the *parsed* configuration, and both survive the correction intact. That is exactly why the story chose those seams; the drift is only in the prose explaining why.
