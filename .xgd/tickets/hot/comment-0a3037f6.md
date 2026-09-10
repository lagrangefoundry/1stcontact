---
uid: comment-0a3037f6
id: COMMENT-2609
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T21:29:29.392297+00:00'
updated_at: '2026-09-10T21:29:29.392297+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d0ee83a0
  kind: note
---

Done. All five findings in report-0c0a10a3 are resolved; completion report filed as **REPORT-3801** (`report-d0ee83a0`).

## What I did

The assessor's editor note was right that findings 1–3 are one pattern, not three: three ACs rewritten on 2026-08-31 to hold *on both hosts*, each paired with a test written against the host the criterion originally lived on. I fixed them as a class.

| Finding | AC | Action |
|---|---|---|
| 1 (**violation**) | AC-1320 | New `test_UAT_AC1320_the_deployed_host_offers_its_site_operations_and_reports_nothing_absent` in the continuity workers suite |
| 2 (warning) | AC-1057 | New `test_UAT_AC1057_turns_persist_through_the_deployed_store_and_are_replayed_after_a_restart` in the deployed workers suite |
| 3 (warning) | AC-1405 | New `test_UAT_AC1405_a_transcript_from_the_deployed_host_replays_on_the_local_host` in the Node suite |
| 4 (info) | AC-1404 | Tightened `cold.error` from `toBeTruthy()` to naming `ANTHROPIC_API_KEY` |
| 5 (info) | AC-1055 | No action needed, as the assessor stated |

Plus two suite-header comments updated so each file's stated subject matches what it now proves.

Two things worth calling out from writing them:

- **AC-1320's priming assertion needed narrowing.** A `/knowledge/i` sweep over the system prompt failed on "ac**knowledge** it to your user" in the caretaker's own prose. It now asserts against the two artifacts AC-1319 proves priming carries *when* there is a corpus — the manual's operation names and the phrase "knowledge base" — which is the sharper claim anyway. The assessor predicted this test would pass on first write against unchanged production code, and it did, so it stayed `uat-add` rather than becoming a `code-issue`.
- **AC-1405's fixture is written out literally, not serialised.** Round-tripping bytes through the writer under test would only prove it reads itself back. The deployed suite already establishes `archive.load(id).toFile() === stored`, so the two together close the deployed→local hop without a cross-project fixture.

## Verification

23 tests pass across all four suites (was 20 — 12/3/5/3). No production code touched.

Two caveats I've recorded in the report rather than papered over: I did **not** run `…-knowledge.test.ts` (untouched by this call, and its AC-1320 case renames the repo's own `corpus/index` aside — a killed run displaces the checkout's KB index, which isn't a risk worth taking for a file I didn't edit), and `tsc --noEmit` was denied under this session's permission mode.

I also deliberately left `uat_coverage` unset on all four ACs — that field belongs to the coverage stage, and setting it here would manufacture a verdict on a suite this prompt didn't execute.
