---
uid: report-d816f77b
id: REPORT-1637
type: report
title: 'Fix Site Delivery: Deploy & Public Serving (ac) — attempt 1'
created_by: xgd
created_at: '2026-08-07T21:57:41.808374+00:00'
updated_at: '2026-08-07T21:57:41.808374+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a12e557f
  level: ac
  fixes_applied: 5
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-17a279f7
---

# Fix Summary — Site Delivery: Deploy & Public Serving (ac)

**Attempt**: 1
**Fixes applied this call**: 5
**Violations remaining**: 0
**Needs more work**: false

All four findings from report-ba028ef4 (1 violation, 3 warnings) are addressed.
No production code was changed; every repair is a matrix edit.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-906 (acceptance_criterion-fc87f616) | **Resolves the violation.** Scoped the byte-identity claim to *within a channel*. The four not-found cases still share status, plain-text content type and body; full header equality is now asserted pairwise within the published channel and within the preview channel. AC-910's preview no-index directive is named as the single permitted cross-channel difference, with the reason it is not an existence oracle (the channel is chosen by the URL the requester wrote, not revealed by what the store holds, so a probe comparing two slugs stays inside one channel). Verification rewritten to match: byte-compare within channel, assert the no-index directive is the *only* cross-channel header difference. |
| 2 | ac-edit | AC-905 (acceptance_criterion-27815e0f) | Finding 3. Opening paragraph now cross-references AC-927 for the tree gate instead of restating it, and scopes AC-905 to index authority *within* the servable tree. Dropped the fourth verification bullet ("bytes and index both exist only in the non-servable tree…"), which duplicated AC-927's own criterion in AC-927's own shape; replaced with an explicit pointer so the confinement property is proven exactly once. |
| 3 | ac-edit | AC-892 (acceptance_criterion-0854ccc9) | Finding 2. ¶2 reduced to the servable-tree case; the non-servable behaviour now cross-references AC-925 rather than re-asserting "same halves, same content addressing, same preview entry, no URL" (AC-925 states the index/upload equivalence, AC-924 the artifact readback). Verification tail dropped accordingly. |
| 4 | ac-edit | AC-896 (acceptance_criterion-5a097866) | Finding 2, published-channel half. Closing sentence replaced with a cross-reference to AC-925, noting only that it holds on this channel as on the draft one. Verification now names the servable tree explicitly. |
| 5 | story-body-edit | STORY-94 (story-5349d01f) | Finding 4. Added an In-scope bullet giving AC-901 story-body grounding, placed after **Content addressing** (both are "never destroy what came before"): "**Two deploys do not silently overwrite each other.** A deploy whose stored deploy index changed underneath it fails by name and writes no index of its own, leaving the index exactly as the other deploy left it — a concurrent deploy loses loudly rather than clobbering the winner's record." The Technical Context "Known divergence from intent" note was left verbatim as the record of the narrowed mechanism, per the finding. Everything else in the body is unchanged (programmatic insertion, no re-transcription). |

## Verification

`npx vitest run tests/req111-public-site-serving.test.ts` — **10 passed**.

Notably `test_UAT_FC_REQ-111_unknown_slug_and_missing_object_404` already matched
the corrected AC-906 exactly: it byte-compares only the two published-channel
cases (`/site/nobody-here/` vs an unpublished `/site/<slug>/`) and checks the
preview-channel cases on status and body. Before this edit the AC demanded more
than the evidence gave and more than correct code can give; it now records what
the test proves.

## Code Edits

None. Finding 1 was a matrix-internal contradiction, not a defect — confirmed by
re-reading `apps/public-site/src/index.ts:154-159` (`notFound(channel)` routes
through `withDraftPolicy`) and `src/routes.ts:154-172` (`/site/<slug>/draft/<id>/`
resolves to `channel: 'draft'` before any manifest lookup can fail). Current
behaviour is correct and unchanged.

The new STORY-94 bullet was checked against
`tools/generate/src/deploy/manifest.ts:106-118` before wording: `writeManifest`
throws `ManifestConflictError` *before* the `putText`, so "writes no index of its
own, leaving the index exactly as the other deploy left it" is literally true of
the implementation, not an aspiration.

## needs_review Items Forwarded

None. No finding was categorized `needs_review`.

## Carried Forward (not actioned, by the assessor's own instruction)

| Element | Note |
|---|---|
| AC-913 (apex holding response) | REPORT-1635 finding 2 — STORY-95's body supports it only via a parenthetical inside Out-of-scope. Report-ba028ef4 explicitly declines to re-count this at the AC level; it is a story-body repair belonging to the story level's ledger. Untouched here. |
