---
uid: report-db91345c
id: REPORT-3702
type: report
title: 'Capability-Intent Alignment: Draft Change Journal: What Changed On The Draft,
  And Who Changed It (level=uat)'
created_by: xgd
created_at: '2026-09-10T08:43:33.581152+00:00'
updated_at: '2026-09-10T08:43:33.581152+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-702b7c02
  level: uat
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Draft Change Journal: What Changed On The Draft, And Who Changed It
# Level: uat

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

Attempt 1 of this level (`previous_attempt_count = 0`).

The AC tree is fully covered by substantive UATs and every test exercises the criterion it
names — this level is **not** failing on matrix drift. It fails on one thing: **AC-1266's
UAT cannot execute at all on this branch**, so the one criterion the whole capability
exists to serve (the push signal) currently has *zero* evidence behind it. That is a
production regression against an upstream API change, not an AC-tree or test defect.

Measured, not inferred: `npm test -- tests/reconciliation-draft-change-journal.test.ts`
on a clean working tree (`git status` empty) reports **16 passed, 1 failed (17)**.

## Cumulative Intent Considered

Per the level cascade, the AC bodies are the working reference here; the `ac` level ran
immediately before this one (REPORT-3701, `report-3180c22d`, PASS / 0 violations) and
established the ledger below. I re-derived the ledger rather than trusting it, and confirm
it, with one attribution correction noted under Findings.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-131 (`request-5d3bf630`, in BUNDLE-19 `bundle-77b28def`) | free_and_reconciled | 2026-08-18 → merged 2026-08-20 (`b18b859d7414`) | The whole capability: monotone per-site counter returned by every write; windowed self-describing records; the `ReadSite` read op marked untrusted; `1c changes` for the operator; the per-turn push signal; the manual's overview rule, sequence and undo-absence note | YES |
| REQ-146 (`request-0cdfdc5b`) | free_and_reconciled | 2026-08-15 | "The AI host moves into workerd". Moved the baseline read to `store.counter(slug)` and carried `streamPrompt` into `host-core.ts`. No AC delta | YES (no AC delta) |
| REQ-142 (`request-0dd62a5d`) | free_and_reconciled | 2026-08-18 | The async `SiteStore` port REQ-146's counter read goes through. No AC delta | YES (no AC delta) |
| REQ-149 (`request-554ac441`) | free_and_reconciled | — | "Publish in the cloud". Made an **unchanged publish a no-op**, which invalidated the two-publish comparison AC-1263's *Verification* paragraph prescribes | YES (method-level consequence — warning 1) |

Nothing in the ledger is `abandoned`, `deprecated` or `wont_fix`, and no AC names a ticket
as a delivery vehicle — **Step 2.5 is not triggered anywhere at this level.**

## Alignment Ledger

Every AC under STORY-115 (`story-6cd17452`, `story_kind: feature`) has exactly one UAT, all
in `tests/reconciliation-draft-change-journal.test.ts`. The only double in that file is the
scripted Anthropic client — the network. `edit.ts`, the store, the journal, the Toolbox, the
session manager, the reminder channel and the `1c` entry point are all real, so these are
substantive UATs by the evidence-validity rule, not structural checks.

| Element (AC → UAT) | Runs? | Outcome |
|---|---|---|
| AC-1253 → `test_UAT_AC1253_accepted_write_raises_the_count_and_a_refusal_advances_nothing` (:158) | pass | aligned — accepted write is `before+1` and yields exactly one record; the refusal is *thrown* (so carries no count at all, the strongest reading of "answers with none"), the draft bytes are unchanged, the count is unmoved and the slice is empty |
| AC-1254 → `..._a_write_that_changes_nothing_returns_the_current_count_and_records_nothing` (:181) | pass | aligned — both halves the AC names: the identical-value copy save *and* the `--no-apply` gap-fix run |
| AC-1255 → `..._every_write_shape_hands_its_count_back_including_the_ones_answering_with_an_asset` (:199) | pass | aligned — all six shapes the AC enumerates, plus the declaration/manual half (`now` declared on `change`, `palette_change`, `image`, `asset`, `publish_result`) |
| AC-1256 → `..._asking_since_the_current_count_is_the_cheap_nothing_happened_answer` (:398) | pass | aligned — empty slice + `truncated: false` + same count, and the no-baseline case returns the retained window oldest-first |
| AC-1257 → `..._a_record_names_the_count_time_actor_operation_page_label_and_both_texts` (:279) | pass | aligned — every field the AC lists, all three actors distinguished, the unattributed caller recorded as `cli`, and the palette case proving `page` absent rather than fabricated |
| AC-1258 → `..._a_caller_advancing_its_baseline_never_sees_its_own_edits` (:242) | pass | aligned — three self-writes absorbed, then exactly one foreign write reported |
| AC-1259 → `..._a_baseline_older_than_the_window_is_answered_truncated_with_what_remains` (:420) | pass | aligned — drives `JOURNAL_WINDOW + 3` writes; truncated with `JOURNAL_WINDOW` records retained, plus the in-window and never-written cases |
| AC-1260 → `..._a_record_stays_readable_after_a_structural_change_invalidates_its_address` (:324) | pass | aligned — an `l1.set` inserts a level so `0.0` no longer reaches the recorded element; label and before/after survive |
| AC-1261 → `..._the_text_a_record_carries_is_bounded_and_visibly_cut` (:366) | pass | aligned — both the cut and the uncut case, against the real `JOURNAL_TEXT_LIMIT` |
| AC-1262 → `..._a_missing_or_unreadable_history_reads_as_nothing_and_never_fails_an_edit` (:462) | pass | aligned — absent store, then a genuinely corrupt one; the edit after each still lands |
| AC-1263 → `..._the_journal_is_not_a_revision_is_never_published_and_does_not_perturb_bytes` (:487) | pass | aligned on the **Criterion**; the **Verification** paragraph is stale — see warning 1 |
| AC-1264 → `..._the_operation_is_in_the_manual_of_a_session_granted_the_reading_group` (:550) | pass | aligned — granted/ungranted manuals, the optional `since` param, the `ReadSite` placement, and the refusal on invoke |
| AC-1265 → `..._the_change_log_comes_back_marked_untrusted` (:591) | pass | aligned — the declared `provenance: 'untrusted'` *and* the real `<<<untrusted>>>` envelope round the client's own words |
| AC-1266 → `..._the_reminder_carries_the_change_signal_only_when_somebody_else_moved_the_site` (:717) | **FAILS** | **no evidence exists** — the case throws on its first turn, before any assertion. Violation 1 |
| AC-1267 → `..._the_operator_gets_a_readable_listing_from_the_command_line` (:809) | pass | aligned — drives the real `run(argv)` entry point; listing line, nothing-changed line, truncation notice and the non-zero not-found exit |
| AC-1268 → `..._the_same_command_in_machine_readable_form_returns_the_whole_slice` (:852) | pass | aligned — baseline, count, truncation, ordering oldest-first, every record field, and the empty-at-current case |
| AC-1621 (`pending`) → `test_UAT_AC1621_the_manual_carries_the_rule_the_sequence_and_the_undo_note` (:617) | pass | aligned — see info 1 |

**Coverage**: complete. All 17 ACs, including the `pending` AC-1621 authored by this
session's `fix_ac_validation` pass, have a UAT. No active AC is unevidenced *by the matrix*;
AC-1266 is unevidenced *by the runtime*.

**Exclusivity**: holds. The two closest pairs were checked and are distinct scenarios, not
duplicates. AC-1256 and AC-1268 both assert "asking since the current count" — but AC-1256
asks it of the library slice and AC-1268 of the `--json` CLI envelope, which is a different
shape and a different caller (the whole point of "one implementation, two callers").
AC-1264 and AC-1621 both build a `ReadSite` toolbox and read `manual()` — but AC-1264 is
about the *operation's* presence under a grant and AC-1621 about the *guidance* projected
alongside it; neither would catch the other's regression.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-1266 (`acceptance_criterion-7e6ce01d`) / `test_UAT_AC1266_…` | code-issue | The UAT throws `TypeError: Cannot add property reminder, object is not extensible` at `tools/generate/src/cli/ai/host-core.ts:596`, on the *first* `streamPrompt` call (test line 750), before any assertion runs. The installed `@lagrangefoundry/ai` `Role` calls `Object.freeze(this)` in its constructor (`src/roles.js:404`) and no longer carries a singular `reminder` — it carries `reminders` (plural), assembled per turn by `assembleReminders(role, ctx, …)` (`src/priming.js:454`). The per-turn refresh at :596 mutates an instance that is now sealed, so the change signal AC-1266 describes is never delivered — and, because the throw is on the turn path itself, **no** turn can complete in this checkout | Stop mutating the frozen instance. Supply the signal through the supported seam — a `reminders` entry whose provider resolves the current baseline/delta at turn time — or re-construct and re-register the role for the turn. Then re-run the *whole* case, not just the first turn |
| 2 | warning | consistency | AC-1263 (`acceptance_criterion-8e517739`) | ac-edit | The AC's **Verification** paragraph prescribes "a snapshot published from the same draft content when no change history exists" and a byte-for-byte comparison of two revision directories. REQ-149 (`request-554ac441`, free_and_reconciled) made an unchanged publish a **no-op**, so there is no second directory to compare and that method is no longer executable. The test adapted correctly and documents why (test lines 513–526), proving the same property with a sharper instrument — publish diffs the draft against the live revision, so a journal inside the definition would show up as a change and mint `r2`. The AC text did not adapt | Rewrite AC-1263's Verification to the no-op instrument: publish, delete the change history, publish again, assert `published === false`, the same revision id, an empty `changes` diff and an unchanged revision directory. The Criterion's "byte for byte" claim is correct and stays |
| 3 | info | coverage | AC-1621 (`acceptance_criterion-aa0adbc3`) | — | AC-1621 is `status: pending` (authored today by `fix_ac_validation`, REPORT-3700 / `report-b90a2271`) and already carries a passing, substantive UAT at test line 617. It is not a coverage gap. The test selects the overview paragraph and the sequence **out of `L1_DECLARATION` by wording**, asserts each is exactly one, and only then requires it in `manual()` — so the rule provably arrives through the projection and cannot be satisfied by a preamble written beside the manual, which is exactly what the AC's Verification asks for | none |

## Notes for the Editor

**On finding 1 — attribution, and what it means for the fix loop.**

The `ac`-level report (`report-3180c22d`) recorded this as "almost certainly collateral from
REQ-146's move of the host into workerd". That attribution is wrong and worth correcting
before anyone goes looking in REQ-146's diff. `git log -S "role.reminder" --
tools/generate/src/cli/ai/` returns two commits: `c745a1184d` (REQ-131 itself, which
introduced the line) and `207a41eee7` (REQ-146, which only carried it into `host-core.ts`).
The line shipped working under REQ-131. What changed is the **upstream package** — the
`@lagrangefoundry/ai` in the shared artifact store now freezes `Role` and has renamed the
field to `reminders` with a provider-resolved assembly path. This is upstream API drift
arriving out-of-band, not a regression in any in-repo commit, which is why no in-repo
bisect will find it.

**The test has never run past its first line of act.** Every assertion in AC-1266's case —
the two quiet turns, the signal's wording and baseline, the slice that baseline returns, the
assistant's own write being absorbed — is downstream of the throw. Do not treat "fix line
596 and the test goes green" as the expected outcome; treat the whole case as unverified and
budget for the assertions after the throw failing too.

**Blast radius is wider than this capability.** The throw is in `streamPrompt` before
`manager.promptStream`, so it is not specific to the change signal: no session on this
branch can take a turn at all. This capability's UAT is simply the case that happens to
measure it. Whoever fixes it should check whether other AI-host suites are failing for the
same reason rather than fixing it narrowly for AC-1266.

**Nothing else at this level needs an editor.** Sixteen of seventeen ACs are covered by
passing, substantive UATs with no internal mocking, no duplicates and no drift between test
and criterion. If finding 1 is routed to the builder as a code repair and finding 2 is taken
opportunistically, this level should pass on the next cycle without any test authoring.
