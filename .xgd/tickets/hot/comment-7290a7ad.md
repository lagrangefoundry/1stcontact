---
uid: comment-7290a7ad
id: COMMENT-2510
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T09:59:36.460098+00:00'
updated_at: '2026-09-10T09:59:36.460098+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-dcfe6d0a
  kind: note
---

**Report created: REPORT-3711 (`report-dcfe6d0a`) — FAIL, 1 violation, 2 warnings, 0 needs_review.**

## What I checked

Loaded the CAP-85 body, STORY-99 (39.6k chars, via `--json` — the default `ticket get` truncates), all **36 AC bodies**, the previous check (`report-89cba15c`) and fix attempt 4 (`report-863a9c80`), and reconstructed the intent ledger (REQ-119, BUNDLE-16, BUG-33, REQ-145/146/147, REQ-149, BUNDLE-21 — all `free_and_reconciled`).

**Attempt 4's two repairs verified as landed**, not taken on trust:
- **AC-966** — the pre-REQ-119 premise and the exclusion naming the shipped mechanism ("a re-generation") are gone; narrowed to the display-panel binding, byte-identity deferred to AC-1032, no-artifact-on-disk to AC-1031. AC-1032/AC-1031 were not weakened.
- **AC-1036** — the AC-978 traversal duplication is now an explicit deferral.

Neither is re-raised. Coverage of the STORY-99 body was re-walked bullet by bullet and is complete.

## The new violation — AC-978

Same shape as the AC-966 finding just closed: an AC frozen before the intent that superseded it. AC-978 (last updated 2026-08-16) still enumerates the **pre-REQ-145** served-tree topology — "the rendered channels, the installed components, and the workspace's own browser source … identical across all three trees."

REQ-145 (free_and_reconciled, 2026-08-15) made `/builder/*`, `/webui/*` **and `/framework/*.js`** one build-artifact tree served from Static Assets. I verified against the code, not just the ticket:

- `tools/generate/src/cli/assets.ts:36-38` writes all three into `dist-assets/`
- `tools/generate/src/cli/builder.ts:149,159` confines all three through a **single** `resolveStaticFile` call; `apps/control-app/wrangler.toml:56` serves the same directory deployed
- `/framework/` is a live route class — `tests/reconciliation-builder-workspace-origin.test.ts:416-418` drives `edit-client.js` and its two siblings

So AC-978's list is wrong twice: it omits `/framework/*.js` (the tree carrying the edit client CAP-85's body names as served here — no criterion asserts an escaping request there is refused), and its two remaining "trees" are now one code path, which hollows out the "no tree lacks the confinement" clause. AC-977, revised under REQ-145, already uses the current vocabulary and lists the editing client among its response classes — the matrix contradicts itself on what is served.

The two warnings are one-paragraph deferrals of the kind the AC-1036 repair just demonstrated: AC-964 vs AC-1400 (unadmitted-artifact probe asserted twice) and AC-972 vs AC-1035 (published-channel-served asserted twice, where AC-1035 owns it and STORY-99 puts published serving out of scope).

One thing I found but deliberately did **not** count as an ac-level finding: AC-964's Verification demands an unadmitted probe against a build artifact, and its evidence at `tests/reconciliation-builder-workspace-origin.test.ts:688-748` only probes `/preview/...`. That's a `uat-edit`, flagged in Notes for the Editor.
