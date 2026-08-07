---
uid: comment-c03c9b31
id: COMMENT-817
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-07T21:57:59.097594+00:00'
updated_at: '2026-08-07T21:57:59.097594+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d816f77b
  kind: note
---

All four findings from report-ba028ef4 are resolved in one pass. Completion report: **REPORT-1637** (`report-d816f77b`).

**Finding 1 (the violation) — AC-906 vs AC-910.** The contradiction was real and I confirmed it in code before editing: `notFound(channel)` runs through `withDraftPolicy` (`apps/public-site/src/index.ts:154-159`), and `/site/<slug>/draft/<id>/` resolves to `channel: 'draft'` before the manifest lookup fails (`routes.ts:154-172`) — so a preview-channel 404 necessarily carries `x-robots-tag: noindex` while a published-channel 404 necessarily does not. AC-906 now keeps status, plain-text type and body identical across all four cases, requires full header equality only *within* a channel, and names AC-910's directive as the one permitted cross-channel difference — with the reason it isn't an existence oracle: the channel comes from the URL the requester wrote, not from what the store contains, so any two-slug probe stays inside one channel.

**Findings 2 and 3 (duplication from BUG-31's double-weaving).** AC-905 now cross-references AC-927 for the tree gate and covers only index authority within the servable tree; its duplicated fourth verification bullet is gone, so confinement is proven once. AC-892 ¶2 and AC-896's closing sentence now point at AC-925 instead of re-asserting it.

**Finding 4.** Added the missing In-scope bullet to STORY-94 giving AC-901 story-body grounding, inserted programmatically after **Content addressing** so the rest of the body is byte-identical. The Technical Context divergence note stays as the record of the narrowed mechanism. I checked `manifest.ts:106-118` first — `writeManifest` throws before the `putText`, so "writes no index of its own" describes the implementation literally.

**Verification:** `npx vitest run tests/req111-public-site-serving.test.ts` — 10 passed. Worth noting that `test_UAT_FC_REQ-111_unknown_slug_and_missing_object_404` already byte-compared only the published-channel pair; AC-906 was demanding more than correct code can deliver, and now records what the test actually proves.

No code changes. AC-913 (apex) is left alone deliberately — the assessor scoped it to the story level's ledger.
