---
uid: report-d4a39a72
id: REPORT-1634
type: report
title: 'Fix Site Delivery: Deploy & Public Serving (story) — attempt 1'
created_by: xgd
created_at: '2026-08-07T21:38:59.514063+00:00'
updated_at: '2026-08-07T21:38:59.514063+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-a12e557f
  level: story
  fixes_applied: 4
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-17a279f7
---

# Fix Summary — Site Delivery: Deploy & Public Serving (story)

**Attempt**: 1
**Fixes applied this call**: 4 (across 2 story bodies)
**Violations remaining**: 0
**Needs more work**: false

All three actionable findings from report-ab9b224d (1 violation, 2 warnings)
were applied in this call. Findings 4, 5 and 6 are `info` with resolution
category `—` / "none at this level" and required no mutation.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-95 (story-d34eccd8), Technical Context, final bullet | **Finding 1 (violation)** — replaced the stale claim that [[DOC-12]] "still describes previews as 'author only (private)'" with a restatement that the amendment has landed: DOC-12's wording is now "link-private, not authenticated" (§2 principle 4, §7 audience row) to match the no-authentication decision (REQ-111), and the divergence is closed. |
| 2 | story-body-edit | STORY-94 (story-5349d01f), "In scope" list | **Finding 2 (warning)** — added a "**Publish mints, deploy ships**" bullet immediately after "Previews are not revisions" (the related content), covering REQ-110's published-requires-revision refusal: a published deploy of a site with empty publish history is refused by name and writes nothing. Supports AC-897. |
| 3 | story-body-edit | STORY-95, "In scope" list | **Finding 3(a)+(b)** — added "**The address grammar rejects before it reads**" (empty / dot-shaped / separator-bearing / malformed components answered not-found with no store read; supports AC-907), placed after the deploy-index-authority bullet so the two reachability gates stay adjacent; and "**Responses are typed from what answered them**" (extension-derived content type, unknown/absent extension → generic binary, not taken from uploader metadata; supports AC-908), placed after the read-only-surface bullet. |
| 4 | story-body-edit | STORY-95, "In scope" list | **Finding 3(c)** — widened the freshness bullet to "**Freshness policy that matches addressing, and a cache that follows it**", adding repeat-request service without a second store read and the deliberate non-retention of not-found responses. Supports AC-911. |

Every other line of both story bodies was preserved verbatim — edits were
applied as exact anchored string replacements with uniqueness assertions, not
by rewriting the bodies from scratch.

## Verification

- **Finding 1 independently confirmed before editing**, rather than taken on
  the assessor's word: a case-insensitive scan of the current DOC-12 body
  returns **zero** occurrences of "author only"; §2 principle 4 reads "Draft
  output is **link-private, not authenticated**: anyone holding the unguessable
  URL can view it (§5.1)" and the §7 audience row reads "author, plus anyone
  holding the link (§5.1)". The intent-mandated documentation action from
  REQ-111's Non-goals is complete, so the matrix was reporting it outstanding
  in error.
- Post-update re-read of both tickets confirms all four insertions present
  exactly once and the stale "author only (private)" string absent.
- The three ACs the warnings were protecting (AC-897, AC-907, AC-908, AC-911)
  were read in full; each new in-scope bullet was worded from the AC's own
  criterion text so an `ac`-level pass reading the story body as its working
  reference will find each of them supported.

## Code Edits

None this call. All findings were `story-body-edit`; no production code, test,
or AC was touched.

## Findings Deliberately Not Acted On

| # | Finding | Why no mutation |
|---|---|---|
| 4 | STORY-96 residual-state claims | `info`; assessor verified both claims still true against the working tree (`tools/generate/src/cli/serve.ts:81-85`; `storage/sites/xgd/draft/pages/whitepapers.json`). Explicitly "no edit needed". |
| 5 | AC-908 / AC-920 near-neighbour typing criteria | `info`, exclusivity — assessor concluded they are distinct criteria from distinct intents (REQ-111 extension→type map vs REQ-113 AC6) in different stories. Not a duplicate. |
| 6 | BUG-31 CLI-help ask has no AC | `info`, "none at this level" — both story bodies already express it ("which the command's own help says"). Whether help text warrants its own criterion is an `ac`-level decision, deliberately left to that pass. |

## needs_review Items Forwarded

None. The report recorded 0 `needs_review` items and none were encountered.

## Note for the Assessor

Per the report's "Notes for the Editor", the four things this capability does
unusually well were left untouched — in particular STORY-95's carried-forward
uncertainty about the un-run `wrangler dev` smoke check and apex provisioning,
which the assessor flagged as honest and not to be "fixed" away. The only
Technical Context bullet altered was the stale DOC-12 one named in finding 1.
