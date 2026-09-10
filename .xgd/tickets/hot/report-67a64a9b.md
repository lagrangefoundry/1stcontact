---
uid: report-67a64a9b
id: REPORT-3704
type: report
title: 'Capability-Intent Alignment: Draft Change Journal: What Changed On The Draft,
  And Who Changed It (level=uat)'
created_by: xgd
created_at: '2026-09-10T09:06:31.558591+00:00'
updated_at: '2026-09-10T09:06:31.558591+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-702b7c02
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: Draft Change Journal: What Changed On The Draft, And Who Changed It
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

Attempt 2 of this level (`previous_attempt_count = 1`).

The single violation the previous cycle raised (REPORT-3702, `report-db91345c`) is **resolved
at the source**, and the warning it raised alongside it was taken as well. Re-measured on a
clean tree at `12c967de95`, not inferred from the fix report:

```
git status --porcelain          → (empty)
npm test -- tests/reconciliation-draft-change-journal.test.ts
                                → Test Files 1 passed (1) / Tests 17 passed (17)
```

Previously this same command reported 16 passed / 1 failed, with AC-1266's UAT throwing
`TypeError: Cannot add property reminder, object is not extensible` on its first act. The
repair is in production code (`tools/generate/src/cli/ai/host-core.ts`, committed in
`12c967de95`), not in the assertions: the test's positive assertions on the signal — its
wording, the change count it names, and the baseline it carries — are intact and now
actually execute.

## Cumulative Intent Considered

Per the level cascade, the AC bodies are the working reference at `uat`. The `ac` level ran
and passed immediately before this one (REPORT-3701, `report-3180c22d`), and the `story`
level before that. The ledger below is re-derived from the ticket graph and confirms the
previous cycle's; nothing in it forced me back to intent history, because no AC read as
suspicious against its story body.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-131 (`request-5d3bf630`, bundled in BUNDLE-19 `bundle-77b28def`) | free_and_reconciled | 2026-08-18 → merged `b18b859d7414` 2026-08-20 | The whole capability: the monotone per-site count every write returns; the bounded window of self-describing records; the `ReadSite` read operation marked untrusted; `1c changes` for the operator in both forms; the per-turn push signal; the manual's overview rule, sequence and undo-absence note | YES |
| REQ-146 (`request-0cdfdc5b`) | free_and_reconciled | 2026-08-15 | "The AI host moves into workerd" — moved the baseline read to `store.counter(slug)` and carried `streamPrompt` into `host-core.ts`. No AC delta | YES (no AC delta) |
| REQ-142 (`request-0dd62a5d`) | free_and_reconciled | 2026-08-18 | The async `SiteStore` port REQ-146's counter read goes through. No AC delta | YES (no AC delta) |
| REQ-149 (`request-554ac441`) | free_and_reconciled | — | "Publish in the cloud" — made an unchanged publish a **no-op**, which invalidated the two-publish byte-comparison AC-1263's *Verification* used to prescribe | YES (method-level; AC-1263 was rewritten to match — see info 2) |

Nothing in the ledger is `abandoned`, `deprecated` or `wont_fix`, and no AC names a ticket as
a delivery vehicle for a behaviour — **Step 2.5 is not triggered anywhere at this level.**

The `Role`-freeze / `reminder` → `reminders` change that caused the previous violation is
**upstream package drift in `@lagrangefoundry/ai`, arriving out-of-band**. It is not an
intent in this ledger and no in-repo commit introduced it, which is why it does not appear as
a row above.

## Alignment Ledger

STORY-115 (`story-6cd17452`, `story_kind: feature`) is the capability's only story. Every one
of its 17 ACs has exactly one UAT, all in
`tests/reconciliation-draft-change-journal.test.ts`. The only double in that file is the
scripted Anthropic client — the network, and the boundary the thin-mock rule names. `edit.ts`,
the store, the journal, the Toolbox, the session manager, the reminder channel and the `1c`
entry point (`run(argv)`) are all real, so these are substantive UATs under the
evidence-validity rule, not structural or AST checks.

| Element (AC → UAT) | Runs? | Outcome |
|---|---|---|
| AC-1253 → `test_UAT_AC1253_accepted_write_raises_the_count_and_a_refusal_advances_nothing` (:158) | pass | aligned — accepted write is `before+1` and yields exactly one record; the refusal is *thrown* (the strongest reading of "answers with no count"), the draft bytes are unchanged, the count is unmoved, the slice is empty |
| AC-1254 → `..._a_write_that_changes_nothing_returns_the_current_count_and_records_nothing` (:181) | pass | aligned — both halves the AC names: the identical-value copy save, and the gap-fix run invoked with `apply: false` |
| AC-1255 → `..._every_write_shape_hands_its_count_back_including_the_ones_answering_with_an_asset` (:199) | pass | aligned — all six write shapes the AC enumerates including the two that answer with an asset, plus the declaration half (`now` carrying "change count" on `change`, `palette_change`, `image`, `asset`, `publish_result`) and the manual projected from it |
| AC-1256 → `..._asking_since_the_current_count_is_the_cheap_nothing_happened_answer` (:398) | pass | aligned — same count, empty list, `truncated: false`; and the no-baseline case returning the retained window oldest-first |
| AC-1257 → `..._a_record_names_the_count_time_actor_operation_page_label_and_both_texts` (:279) | pass | aligned — every field the AC lists, `ts` proven to be a real ISO instant, all three actors distinguished, the unattributed caller recorded as `cli`, and the palette case proving `page` absent rather than fabricated |
| AC-1258 → `..._a_caller_advancing_its_baseline_never_sees_its_own_edits` (:242) | pass | aligned — three self-writes absorbed into the baseline, then exactly one foreign write reported and no others |
| AC-1259 → `..._a_baseline_older_than_the_window_is_answered_truncated_with_what_remains` (:420) | pass | aligned — drives `JOURNAL_WINDOW + 3` writes against the real `JOURNAL_WINDOW = 500`; truncated, current count reported, `JOURNAL_WINDOW` records still returned; plus the in-window and never-written cases |
| AC-1260 → `..._a_record_stays_readable_after_a_structural_change_invalidates_its_address` (:324) | pass | aligned — an `l1.set` inserts a level so `0.0` no longer reaches the recorded element; label and before/after survive and stay attributed to the right page |
| AC-1261 → `..._the_text_a_record_carries_is_bounded_and_visibly_cut` (:366) | pass | aligned — the cut case and the uncut case, against the real `JOURNAL_TEXT_LIMIT = 300`, including that the cut text still begins with the real text |
| AC-1262 → `..._a_missing_or_unreadable_history_reads_as_nothing_and_never_fails_an_edit` (:462) | pass | aligned — absent store, then a genuinely corrupt one; the edit after each still lands on disk and still answers with a count |
| AC-1263 → `..._the_journal_is_not_a_revision_is_never_published_and_does_not_perturb_bytes` (:487) | pass | aligned on Criterion **and now on Verification** — the previous cycle's warning is closed (info 2) |
| AC-1264 → `..._the_operation_is_in_the_manual_of_a_session_granted_the_reading_group` (:550) | pass | aligned — granted and ungranted manuals, the optional `since` parameter, the `ReadSite` placement, and the refusal on invoke from an ungranted session |
| AC-1265 → `..._the_change_log_comes_back_marked_untrusted` (:591) | pass | aligned — the declared `provenance: 'untrusted'` *and* the real `<<<untrusted>>>` envelope round the client's own typed words |
| AC-1266 → `..._the_reminder_carries_the_change_signal_only_when_somebody_else_moved_the_site` (:717) | **pass** (was FAIL) | aligned — five turns on one real session: two quiet turns with no signal, the client's edit producing a signal that names "1 change" and a baseline which is then used to fetch exactly that record, and the assistant's own write absorbed so the following turn carries no signal |
| AC-1267 → `..._the_operator_gets_a_readable_listing_from_the_command_line` (:809) | pass | aligned — drives the real `run(argv)` entry point: the listing line with count/actor/op/page/label, the before→after words, the nothing-changed line, the truncation notice, and the non-zero not-found exit naming the slug |
| AC-1268 → `..._the_same_command_in_machine_readable_form_returns_the_whole_slice` (:852) | pass | aligned — baseline, current count, truncation flag, oldest-first ordering, every record field, the absent `page` on a non-page write, and the empty-at-current case |
| AC-1621 (`pending`) → `test_UAT_AC1621_the_manual_carries_the_rule_the_sequence_and_the_undo_note` (:617) | pass | aligned — see info 1 |

**Consistency**: holds for all 17. Each test exercises the criterion it names, at the caller
the criterion names, with no internal component stubbed.

**Coverage**: complete. Every active AC has a substantive, passing UAT; so does the one
`pending` AC. No AC is evidenced only by a structural check, and none is now unevidenced *by
the runtime* — which was the whole of the previous cycle's failure.

**Exclusivity**: holds. The close pairs were checked individually and are distinct:

- AC-1256 and AC-1268 both assert "asking since the current count" — AC-1256 of the library
  slice, AC-1268 of the `--json` CLI envelope. Different caller, different shape, and "one
  implementation, two callers" is the story's own stated design.
- AC-1259 (library truncation) and AC-1267 (the CLI truncation *notice*) are the same split.
- AC-1257 (record fields on the library slice) and AC-1268 (record fields on the CLI
  envelope) likewise.
- AC-1264 and AC-1621 both build a `ReadSite` toolbox and read `manual()` — but AC-1264 is
  about the *operation's* presence under a grant and AC-1621 about the *guidance* projected
  alongside it. Neither would catch the other's regression.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | AC-1621 (`acceptance_criterion-aa0adbc3`) | — | Still `status: pending` (authored 2026-09-10 by `fix_ac_validation`, REPORT-3700), and still carries a passing substantive UAT at test line 617. The test lifts the overview paragraph and the sequence **out of `L1_DECLARATION` by wording**, asserts each is exactly one, and only then requires it in `manual()` verbatim — so the rule provably arrives through the projection and cannot be satisfied by a preamble written beside the manual, which is what the AC's Verification asks for. Verified against the declaration: `l1-surface.json` carries the overview paragraph ("Your user can change the site themselves, while you are working on it… you are told, at the start of a turn… look at what changed before you act"), the sequence `Pick up after your user has been editing` with `steps[0] === 'list_changes'` and a note saying "not with a re-read of the page… never write over a change you have not read", and the undo absence citing `list_changes`. Not a coverage gap; the `pending` status is a lifecycle matter outside this check's three properties | none |
| 2 | info | consistency | AC-1263 (`acceptance_criterion-8e517739`) | — | The previous cycle's warning is **closed**. The AC's Verification was rewritten (ticket `updated_at` 2026-09-10T08:52, commit `bfdfa37c44`) from the two-publish byte comparison REQ-149 made unexecutable to the no-op instrument: publish, delete the change history, publish again, assert `published === false`, the same revision id, an empty `added/modified/removed` diff and an unchanged revision directory. The test at lines 513–526 already proved exactly that; AC text and test now agree, and the Criterion's "byte for byte" claim was correctly left alone | none |
| 3 | info | consistency | AC-1266 (`acceptance_criterion-7e6ce01d`) / `tests/support/scripted-model-client.ts` | — | The test edit that accompanied the code fix moved four reads from `client.seen[N].system` to a new `modelSaw(req)` helper that flattens `system` *and* every message's content. Checked for assertion-weakening, because three of those four reads are **negative** ("no signal") and a reader that always returns empty would satisfy them for the wrong reason: the *positive* assertion at `client.seen[2]` uses the same helper and matches `/changed this site since your last turn — 1 change\b/`, which proves the helper does surface the reminder when it is there. The negatives are therefore load-bearing. The change is placement-agnostic by design — upstream moved the reminder off `system` onto the turn's tail — and the property asserted is still "the model was told" | none |

## Notes for the Editor

Nothing at this level needs an editor. There is no action to route.

**On the previous cycle's blast-radius note.** The fix was made at the seam rather than
patched at the throw: `host-core.ts` now registers a reminder *provider* on the manager's
registry and builds the `Role` from `priming` entries, instead of mutating a frozen instance
and passing `system`/`source` keys upstream had stopped reading. That second half matters and
was not in the previous finding — a session on this branch was priming with nothing at all
(no preamble, no projected manual), which failed loudly nowhere because the throw came first.
Both halves are covered by AC-1266's case now running end to end.

**One environment artifact, recorded so it is not mistaken for evidence later.** The
free-coded sibling suite `tests/test_UAT_FC_REQ-131_change_journal.test.ts` reports 12 passed
/ 1 skipped in this sandbox, with a file-level `Error: listen EPERM … 0.0.0.0`. The skipped
case is the last one, which calls `startBuilder()` and drives the signal over HTTP against a
real builder origin; binding a listening socket is blocked in this sandbox, not by anything in
the code. It costs this level nothing: that behaviour is AC-1266, and AC-1266's matrix UAT
drives `streamPrompt` in-process with no socket and passes. A reviewer in an environment that
permits `listen` should see 13/13 there.

**On the FC suite's overlap with the matrix suite.** `test_UAT_FC_REQ-131_change_journal.test.ts`
covers much of the same ground as the AC UATs (the counter, the untrusted marking, the
window, the record fields). That is the intended dual track — the FC suite is the evidence
REQ-131 was delivered, the `test_UAT_AC*` suite is the evidence the matrix is true — and it is
not an exclusivity violation within the matrix, whose UATs are the `test_UAT_AC*` set. Noted
only so a future cycle does not read the overlap as duplication and delete intent-level
regression cover.

**`uat_coverage` is unset on every AC under STORY-115.** Left alone deliberately: that field
is owned by the UAT-coverage check, and this check is read-only.
