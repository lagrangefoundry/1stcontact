---
uid: report-7aeed3cd
id: REPORT-10936
type: report
title: 'Fix reconciliation review: bundle-5052a63c'
created_by: xgd
created_at: '2026-11-04T21:17:44.083564+00:00'
updated_at: '2026-11-04T21:17:44.083564+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-5052a63c
  needs_more_work: false
  progress_made: true
---

## Stories created
None

## Stories modified
- story-c4f329d3 (STORY-117): Reconciliation Decisions record that AC-2235 is narrowed to the build stage (CLI exit code and bin/kb-release are an operator check), and that the AC-2236 seam probe is testable through `knowledgeSeamProbe(load)`.
- story-fde7370b (STORY-121): new decision that business erasure is not built; `siteKeys()` is the enumeration it will use (gap 5).
- story-a55c2f35 (STORY-164): "Erasure redacts name text" reworded; `redactNames` is a helper with no product caller, recorded as a decision (gap 6).
- story-0034d937 (STORY-163): new decision that REQ-193's `COALESCE(family_name, display_name)` name sort is not built; the list orders by `created_at` (gap 7).
- story-83ff6262: corrected the decision text, since AC-2222 was reworded from account to person.
- story-4630e921: AC-2260 now has a UAT; new decision that History sits directly after Businesses.
- story-7d255580: commit citation 1e6ff1897c changed to c967412886.
- story-5b5be809: decision on why REQ-192's "xgd site byte-identical after wipe" clause is an operator recovery check, not a seed AC.
- ACs updated: AC-2235 (narrowed to the claim its UAT proves), AC-2236 (verification), AC-2250 (route-level server half), AC-2242 (erasure in future tense), AC-2269 (route answers 404; route-level verification), AC-2270 (placement clause), AC-2320 (five addresses, not six), AC-2281 (commit SHA), AC-2239 (randomUUID callers pinned), AC-1448 (advisory: keyed by site id).

## Stories deleted
None

## ACs superseded
None

## FC orphans renamed/deleted
None (no fc_orphan_check report exists for this anchor).

## Code changes
- tools/generate/src/cli/shared-store.ts: extracted the default seam probe into exported `knowledgeSeamProbe(load)`. The loader is injectable and defaults to importing the installed knowledge component. Behaviour is unchanged.
- tools/generate/src/cli/index.ts: re-exports `knowledgeSeamProbe` and the `KnowledgeLoader` type.
- tests/reconciliation-system-knowledge-base-read-seam.test.ts (gap 1): the AC-2236 UAT now runs the real detection against component doubles (no indexFor, ignores the map, wrong index, throws). It asserts no fetch and no embedder are used. New UAT `test_UAT_AC2236_missing_component_is_reported_as_missing_and_the_seam_is_never_probed` drives `1c preflight` with knowledge unresolvable through the resolver seam and asserts exit 6, the presence error, no "Index seam:" line, and that the seam was never invoked.
- tests/reconciliation-assistant-two-knowledge-bases.workers.test.ts (gap 3): `chunk_search` is called per KB, asserting each KB's hit uid and its passage text.
- tests/reconciliation-contact-other-addresses.workers.test.ts (new, gap 4): `test_UAT_AC2250_person_detail_route_lists_every_address_primary_first`, through the real router and D1.
- tests/test_reconciliation_opaque_site_keys.workers.test.ts (gap 5): the stranded-object check now snapshots the whole bucket before and after, replacing the no-op Bystander filter.
- tests/reconciliation-contact-history-events.workers.test.ts: AC-2269 adds route-level assertions (200 with history and provenance; 404 across businesses).
- tests/reconciliation-contact-history-pane.test.ts: AC-2270 asserts History directly follows Businesses.
- tests/test_reconciliation_baseline_schema.test.ts: AC-2239 also pins the `crypto.randomUUID` callers (ai.ts, mail.ts, both non-key values).
- Renamed stale UATs: `test_UAT_AC2157_businesses_payload_carries_exactly_person_and_businesses`, and `test_UAT_AC2188_who_they_are_edits_only_the_email_the_name_parts_edit_in_their_name_and_eight_fields_are_locked`.

## Confidence
Moderately high. All 7 FAIL-worthy gaps and every lower-severity item were addressed except the advisory AC-2257 literal-count scan, which was left as is. Tests were not run, per instructions. The new and changed assertions were written against the code paths I read, so the main risks are runtime details I could not execute, such as vi.doMock module-id matching in the preflight test. Still open for the operator: the vitest.node.config.mts code_frozen ruling, and the review's suggestion to add an HTML-escaping AC to renderTemplate before REQ-199.
