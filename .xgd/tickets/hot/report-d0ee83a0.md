---
uid: report-d0ee83a0
id: REPORT-3801
type: report
title: 'Fix AI Site Assistant: Per-Site Conversations (uat) — attempt 2'
created_by: xgd
created_at: '2026-09-10T21:29:09.444268+00:00'
updated_at: '2026-09-10T21:29:09.444268+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-7e4714b7
  level: uat
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — AI Site Assistant: Per-Site Conversations (uat)

**Attempt**: 2
**Fixes applied this call**: 6
**Violations remaining**: 0
**Needs more work**: false

The assessor's own "Notes for the Editor" named the shape of this: findings 1, 2
and 3 are one pattern, not three slips — three criteria rewritten on 2026-08-31
to hold *on both hosts*, each paired with a test written against the host that
criterion originally lived on. They were fixed as a class, in one call, so the
matrix does not pass through a state where one of the three is closed and the
other two are not.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1320 (finding 1, **the violation**) | Authored `test_UAT_AC1320_the_deployed_host_offers_its_site_operations_and_reports_nothing_absent` in `tests/reconciliation-assistant-conversation-continuity.workers.test.ts`. Passes. |
| 2 | uat-add | AC-1057 (finding 2, warning) | Authored `test_UAT_AC1057_turns_persist_through_the_deployed_store_and_are_replayed_after_a_restart` in `tests/reconciliation-assistant-conversation-deployed.workers.test.ts`. Passes. |
| 3 | uat-add | AC-1405 (finding 3, warning) | Authored `test_UAT_AC1405_a_transcript_from_the_deployed_host_replays_on_the_local_host` in `tests/reconciliation-assistant-conversation.test.ts`. Passes. |
| 4 | uat-edit | AC-1404 (finding 4, info) | Tightened `expect(cold.error).toBeTruthy()` to `expect(cold.error).toContain('ANTHROPIC_API_KEY')` (`…-deployed.workers.test.ts:292`), as the finding suggested for the next time the file was touched. Passes. |
| 5 | uat-edit | continuity suite header | Recorded AC-1320's deployed half in the file's why-it-runs-here comment, so the suite's stated subject matches what it now proves. |
| 6 | uat-edit | deployed suite header | Recorded AC-1057's deployed half, and *why* it is different in kind from the other four criteria there (a property of the store, not of either host). |

## What each new test actually asserts

**AC-1320, deployed leg** (finding 1 — the only thing blocking this level). Runs
one real turn through `/api/ai/prompt` in workerd against real D1/R2 with the
shared streaming double, then reads `seen[0].tools` and makes the criterion's
three observations:

1. `set_l1` and `describe_page` are offered — the assistant this host had before
   the corpus existed, not a diminished one.
2. No knowledge operation is offered: none of the five names
   `knowledge_surface.json` declares, and nothing matching `/knowledge/i`. The
   declared names are written out rather than imported, because importing the
   declaration would defeat the case — the point is that the deployed artifact
   never pulls that module in — and the regex sweep beside them catches an
   upstream rename.
3. Nothing is reported: a `console.error` spy, held across the open *and* the
   turn, captured no line matching `/knowledge base/i`. This is the assertion the
   criterion exists for, since the built-but-unopenable case names the knowledge
   base on that same output.

Plus one the criterion implies and the Node leg did not make: the priming carries
neither the manual's operation names nor the phrase "knowledge base", so the
assistant is not told to go and read documents it has no operation to open with.
(Asserted against those two artifacts rather than the bare word `knowledge`,
which appears innocently inside "acknowledge" in the caretaker's own prose — that
was a real false positive, caught by running it.)

The assessor predicted this would pass the moment it was written, and it did on
the first run once the priming assertion was narrowed. So it stays `uat-add` and
is **not** re-filed as a `code-issue`.

**AC-1057, deployed leg** (finding 2). Speak a turn, discard every cached manager
and host, re-open: ready, both turns replayed with original text and attribution.
Then the half AC-1404 and AC-1456 do *not* carry, which is why this is a new test
rather than re-pointing at theirs — delete `chat/<tenant>/<sessionId>.md` from R2,
restart again, and the same open yields an empty conversation. That deletion is
what makes the replay a statement about *where* the turns live; without it a
replay is equally consistent with a second copy cached elsewhere. The criterion's
whole point is that the replay is a property of the store rather than of either
host, so this is the assessor's preferred resolution (a workers-side leg under
AC-1057's own name) rather than the alternative of narrowing the AC.

**AC-1405, deployed→local direction** (finding 3). A transcript in the stored form
— `xgd-session` JSON header, `xgd-chat`-marked turns, end marker — is written into
`sessionsDir({ cwd })` under `sessionIdFor(OTHER)`, and the local host replays it:
same turns, same text, same attribution, under the derived id it never issued. It
is then *continued* — the next turn hands the model the deployed host's exchange
as its history — and the file this host writes back is checked to be the same form
with no storage-particular key in its header, so the hop is not one-way.

The bytes are written out literally rather than produced by calling this host's
own serialiser: a fixture round-tripped through the writer under test would prove
only that it can read itself back, which is the one thing the criterion is not
about. Its companion in the deployed suite establishes the other end of the pair
— that what the Worker writes into R2 *is* these bytes, `archive.load(id).toFile()
=== stored` — so the two together close the direction without a cross-project
fixture, exactly as the finding proposed.

## Exclusivity (two UATs per AC, three times over)

AC-1320, AC-1057 and AC-1405 now each have two AC-named UATs across two suites.
This is the same situation finding 5 records for AC-1055 and is correct for the
same reason: each of these three criteria states its property over *two hosts* or
*two directions* in its own text, and the two tests assert it on different
runtimes against different stores. Neither is a duplicate of the other, and
neither could be folded into the other's project.

## Code Edits (if any)

None this call. Every mutation is a test-side one; no production file was touched.

## Verification

| Suite | Result |
|---|---|
| `reconciliation-assistant-conversation.test.ts` | 12 passed (11 before, +AC-1405) |
| `reconciliation-assistant-conversation-continuity.workers.test.ts` | 3 passed (2 before, +AC-1320) |
| `reconciliation-assistant-conversation-deployed.workers.test.ts` | 5 passed (4 before, +AC-1057) |
| `reconciliation-assistant-conversation-artifact.test.ts` | 3 passed (untouched, no regression) |
| **All four together** | **23 passed** |

Two honest caveats:

- `reconciliation-assistant-conversation-knowledge.test.ts` was **not run**. It is
  untouched by this call and imports nothing I changed, but it is also the suite
  whose AC-1320 case renames the repository's own `corpus/index` aside and
  restores it in a `finally` — the hygiene hazard the assessor flagged. Running it
  under a kill would displace the checkout's KB index, so I left it alone rather
  than take that risk for a file I did not edit. Its AC-1320 case is unchanged and
  remains the local-host half of the pair.
- `tsc --noEmit` could not be run (denied under this session's permission mode).
  The suites transpile and pass under vitest; the type surface I touched is one
  local interface field (`ModelRequest.system` retyped from `string` to `unknown`,
  since the SDK's structured cache-marked form is what the double actually
  receives — the old annotation was wrong and only went unnoticed because nothing
  read the field).

## Not done, and deliberately

- **`uat_coverage` was not set** on AC-1320, AC-1057, AC-1405 or AC-1404. That
  field is owned by `check_uat_coverage` / `fix_uat_coverage`, and setting it here
  would be this prompt manufacturing a coverage verdict it did not run. AC-1320
  and AC-1405 currently carry no `uat_coverage` value at all; that is for the
  coverage stage to decide, on a suite it has actually executed.
- **The `corpusDir()` hygiene note** (assessor's third editor note) is left for
  whoever next touches `…-knowledge.test.ts`. Moving that case onto a temporary
  corpus root is a real improvement but it is not a finding, and rewriting a
  180-second KB fixture I had no other reason to open would have put the one
  passing local-host leg of AC-1320 at risk to fix a crash-only failure mode.

## needs_review Items Forwarded

None. Every finding in report-0c0a10a3 was categorized, and all five are now
either resolved (1, 2, 3, 4) or confirmed as requiring no action (5).
