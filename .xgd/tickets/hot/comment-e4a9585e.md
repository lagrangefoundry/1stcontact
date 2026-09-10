---
uid: comment-e4a9585e
id: COMMENT-2492
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T07:53:01.593010+00:00'
updated_at: '2026-09-10T07:53:01.593010+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b34ea686
  kind: note
---

**Attempt 2 complete — all violations and warnings closed. Declared `needs_more_work: false`.**

One correction to the framing in the prompt: this was attempt 2, not attempt 1. Attempt 1's work (the four violations) is already committed as `47fe3cc820` with report `report-ec97a368`.

This call closed the two remaining warnings plus the `info` finding:

**Finding 6 (AC-1296)** — the AC requires excluded documents be named *and* that the report say **why**. The reason text and the line's conditional emission both live in the command layer (`cli/index.ts:749-750`), which no test drove — the UAT asserted only the array of ids the export returns. Both halves now run through `cli(['kb','export'])` for real.

That needed new machinery: `kb export` resolves its own repo-anchored root by design, so a test can't point it at a scratch tree. `withRepoCorpus` moves the repository's built corpus aside and back, so asserting the command's output can't cost a developer their corpus. I verified the `kb/` tree is untouched after each run.

**Finding 9** — with that helper in hand, AC-1292's test no longer *mirrors* `1c kb export`'s body; it drives the command with all five credentials stripped. The assessor recorded this as a risk with "suggested edit: none"; it's now covered rather than just noted. AC-1292's ticket needed no edit — it already said "Run the corpus-only form"; the test was what didn't match.

**Finding 8** — retired `test_UAT_FC_REQ-123_system_kb.test.ts`. I re-verified the overlap before deleting rather than trusting last call's audit: all fifteen scenarios map onto AC-traceable tests, including the two I was least confident about (`the_map_is_a_ticket_the_report_lookup_finds` → AC-1304's `findAwarenessReport` assertions; `an_unchanged_document_keeps_its_file_stamp` → AC-1299's backdate-and-compare). No dangling references outside `.xgd/`.

The evidence file is **16 passed, 0 skipped**.

**Two things I did not do, deliberately:**

Finding 5 remains forwarded — whether membership is `fields.system_kb` (REQ-123, governing) or `doc_kind` (REQ-164, `draft` and blocked) is the operator's call. The KB still builds an empty corpus on this branch; that's unchanged and unresolvable without that decision. My edits across both attempts are neutral on it by construction.

The 6 failures in the two adjacent suites are pre-existing upstream drift in a *different* capability (AC-1317…AC-1320): the grant's tool set gained `KnowledgeChanges`/`KnowledgeOutline`, and `KnowledgeDocs` is no longer exported. Same count as after attempt 1 — not fallout from this work. AC-1318's may need an `ac-edit` rather than a test fix, which is that capability's assessor's call. Flagged in the report so it isn't misattributed.

Committed as `671a09196f`; report `report-b34ea686`.
