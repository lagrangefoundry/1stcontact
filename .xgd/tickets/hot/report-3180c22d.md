---
uid: report-3180c22d
id: REPORT-3701
type: report
title: 'Capability-Intent Alignment: Draft Change Journal: What Changed On The Draft,
  And Who Changed It (level=ac)'
created_by: xgd
created_at: '2026-09-10T08:36:26.524906+00:00'
updated_at: '2026-09-10T08:36:26.524906+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-702b7c02
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
  anchor_report_uid: report-e37a6b4a
---

# Capability-Intent Alignment: Draft Change Journal: What Changed On The Draft, And Who Changed It
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Attempt 2 of this level (previous_attempt_count = 1). The single violation and single
warning recorded by attempt 1 were the same omission — STORY-115's AC tree covered the
journal's *mechanism* exhaustively and its *manual guidance* not at all — and both are
now closed by **AC-1621** (`acceptance_criterion-aa0adbc3`), authored by the
`fix_ac_validation` pass recorded in REPORT-3700 (`report-b90a2271`). I re-derived the
level from scratch rather than trusting that report; the repair holds.

## Cumulative Intent Considered

CAP-99 carries one story, STORY-115 (`story-6cd17452`, `story_kind: feature`), whose
`intent_uid` is `bundle-77b28def` (BUNDLE-19, `free_and_reconciled`, merged at
`b18b859d7414`). The bundle carries nine source tickets; **REQ-131** is the one that
created this capability. No ticket in the store retires, supersedes or re-scopes it — a
store-wide search on "change journal" and on `list_changes` returns only REQ-131, CAP-99,
its own ACs, and STORY-101 (the client-side editing gesture whose edits are the thing
being detected).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-131 (in BUNDLE-19, `bundle-77b28def`) | free_and_reconciled | 2026-08-18 → merged 2026-08-20 | The whole capability: monotone per-site counter returned by every write; windowed self-describing records; read op in `ReadSite` marked untrusted; `1c changes` for the operator; the per-turn push signal; the manual's overview rule, sequence and undo-absence note. Its "As built" half pins the four open decisions (gitignored `.journal.json`, 500 records / 300 chars, actor attribution shipped, per-site grain) and records one thing the spec did not anticipate — `add_asset` / `write_image` also hand the count back. | YES |
| REQ-146 | free_and_reconciled | 2026-08-15 | "The AI host moves into workerd". Re-plumbs the baseline read from `draftCounter(ctxOf(opts), slug)` (sync, filesystem) to `store.counter(slug)` (async, ported). Behaviour-preserving for this capability — no AC-level consequence — but see warning 1 below, which is collateral from this move. | YES (no AC delta) |
| REQ-142 | free_and_reconciled (same bundle) | 2026-08-18 | The async `SiteStore` port REQ-146's counter read goes through. No AC-level consequence. | YES (no AC delta) |

No intent in the ledger is `abandoned`, `deprecated` or `wont_fix`, and no story or AC
text under this capability names a ticket as a delivery vehicle — so **Step 2.5 is not
triggered** anywhere in this level, exactly as attempt 1 found.

## Alignment Ledger

STORY-115 is a `feature` story and therefore is expected to carry ACs. Seventeen exist —
sixteen `active` from the original reconciliation of REQ-131, one `pending` from the
attempt-1 repair. Each is aligned to REQ-131 as expressed through the story body, which is
the working reference at this level.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1253 accepted write answers higher; refused write answers with none | REQ-131 AC1 | aligned |
| AC-1254 a write that changes nothing returns the current count | REQ-131 "As built" → no-op rule | aligned |
| AC-1255 every write hands the count back, including asset-shaped answers | REQ-131 "One thing the spec did not anticipate" | aligned |
| AC-1256 asking since current is the cheap nothing-happened answer | REQ-131 AC2 | aligned |
| AC-1257 record names count / time / actor / operation / page / label / before+after | REQ-131 AC3 + pinned actor decision | aligned |
| AC-1258 a caller advancing its own baseline never sees its own edits | REQ-131 AC4 | aligned |
| AC-1259 over-old baseline answered truncated | REQ-131 AC5 | aligned |
| AC-1260 record survives a structural change invalidating its address | REQ-131 AC6 | aligned |
| AC-1261 record text bounded and visibly cut | REQ-131 pinned window decision (300 chars) | aligned |
| AC-1262 missing/unreadable history reads as nothing, never fails an edit | REQ-131 "Degradation, never failure" + story's recorded divergence-from-intent note | aligned |
| AC-1263 not a revision, never published, no byte-identity perturbation | REQ-131 "This is not a revision" + gitignored-location decision | aligned |
| AC-1264 read op in the manual for a `ReadSite` grant, absent without it | REQ-131 Part 2 bullet 1 | aligned |
| AC-1265 the slice comes back marked untrusted | REQ-131 Part 2 bullet 2 | aligned |
| AC-1266 a session whose site moved is told so in its reminder | REQ-131 Part 3 / AC9 | aligned as matrix text; **code does not deliver it today** — warning 1 |
| AC-1267 the operator's readable listing from the command line | REQ-131 "As built" → `1c changes <slug> [--since n]` | aligned |
| AC-1268 the same command machine-readable | same | aligned |
| **AC-1621** (`pending`) the manual carries the rule, the sequence and the undo note | REQ-131 Part 2 bullets 4–5 and 7 | aligned — closes attempt 1's violation and warning |

**Coverage is now complete.** Walking the story body's In-scope list against the tree:
the counter and its return contract → AC-1253/1254/1255; self-describing bounded records
→ AC-1257/1260/1261; the bounded, gracefully-degrading window → AC-1259/1262; the read for
both callers → AC-1256/1264/1265 (assistant) and AC-1267/1268 (operator); the push signal
→ AC-1266; the manual guidance → AC-1621. From the Out-of-scope list, "not a revision" →
AC-1263 and the undo absence → AC-1621 part 3. Nothing in the story body is now
unaddressed.

**Exclusivity holds.** The closest pairs were checked and are distinct criteria:
AC-1253's refusal clause is a *refused* write while AC-1254 is a *successful no-op*;
AC-1256 is the query's nothing-happened semantics while AC-1258 is the baseline arithmetic
that makes a caller's own writes invisible to it; AC-1264 (presence and grant), AC-1265
(untrusted marking) and AC-1621 (guidance) are three different facets of the projection.
AC-1259's third case (untouched site, truncation false) grazes AC-1256/AC-1262 but its
assertion under test is the truncation flag — not a duplicate.

**AC-1621's repair was verified, not taken on trust.** All three surface elements it
describes exist in `tools/generate/src/cli/ai/l1-surface.json` and match the story body:
the `overview` paragraph beginning *"**Your user can change the site themselves, while you
are working on it.**"* (told at the start of a turn, look before you act, never overwrite
an unread change); the `sequences` entry *"Pick up after your user has been editing"* with
steps `list_changes → describe_page → get_l1` and the note *"start here — not with a
re-read of the page"*; and the `absences` entry *"Undoing a change"*, which now cites
`list_changes` as where a prior value is found while still stating there is no undo. Its
UAT (`tests/reconciliation-draft-change-journal.test.ts:617`) is substantive — it selects
the paragraph and the sequence out of `L1_DECLARATION` by wording, asserts each is exactly
one, and only then requires them in `box.manual()` verbatim, so the rule cannot be
satisfied by a preamble written beside the manual. I ran it: passes.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-1266 (`acceptance_criterion-7e6ce01d`) | code-issue | Story body, AC-1266 and its UAT all agree that a session whose site moved between turns is told so in its reminder. Production code cannot deliver it: `tools/generate/src/cli/ai/host-core.ts:596` assigns `role.reminder = …` onto a `new lib.Role({…})` instance that is no longer extensible, so `streamPrompt` throws `TypeError: Cannot add property reminder, object is not extensible` on the first turn of any session. Confirmed by running `test_UAT_AC1266_the_reminder_carries_the_change_signal_only_when_somebody_else_moved_the_site` on this branch — it fails at that line. The matrix is correct; the code is not. Almost certainly collateral from REQ-146's move of the host into workerd (`free_and_reconciled`), which is the commit that changed how the role is constructed. | Set the reminder through whatever `lib.Role` now exposes for it (or reconstruct/re-register the role) rather than mutating a sealed instance. **Not an AC-tree repair** — see Notes. | 
| 2 | info | — | AC-1621 (`acceptance_criterion-aa0adbc3`) | — | Attempt 1's `ac-add` is correct on all three parts and its UAT is substantive and passing. The violation and the warning it was raised against are closed. | none |
| 3 | info | — | AC-1621 status `pending` | — | AC-1621 is `pending` while its sixteen siblings are `active`. This is the ordinary state for a newly authored AC in this store — 21 of 652 ACs are `pending`, some since 2026-07-22 — not drift. Recorded so a later cycle does not re-derive it. | none |
| 4 | info | — | CAP-99 / STORY-115 / all 17 ACs | — | Ledger provenance is still thin: neither CAP-99 nor STORY-115 carries `updated_by`, and no AC carries `intent_uid`. The ledger above was rebuilt by a store-wide search plus reading BUNDLE-19's body. Unchanged from attempt 1; noted again so the cost is visible. | none |

## Notes for the Editor

**Finding 1 is deliberately a warning, not a violation, and it is not yours to fix.**
It is a genuine, reproduced production defect — the push signal, which is the half of this
capability that costs nothing in the common case, is dead on this branch — but it is not
drift between the matrix and intent. AC-1266 says the right thing, its UAT tests the right
thing, and the story body describes the right thing; only the code disagrees, and the
cause is an upstream constructor change from REQ-146 rather than anything about this
capability's AC tree. A level=`ac` fix pass making an unevidenced production edit is the
wrong shape of repair, and attempt 1's fixer was right to decline it. It needs a bug ticket
and a code cycle. I am read-only at this level, so I have recorded it here rather than
filing one.

Reproduction, for whoever picks it up:

```
npm test -- tests/reconciliation-draft-change-journal.test.ts -t "AC1266"
→ TypeError: Cannot add property reminder, object is not extensible
    at streamPrompt tools/generate/src/cli/ai/host-core.ts:596:10
```

The surrounding comment at `host-core.ts:583` still asserts the old contract — *"the
reminder is refreshed rather than re-registered because the manager reads `role.reminder`
afresh on every turn"* — so whoever fixes it should check that `SessionManager` still
reads the reminder that way before choosing between mutating through a setter and
re-registering the role.

**Nothing else at this level needs an editor.** Consistency, coverage and exclusivity all
hold across the seventeen ACs, so the level passes with the one warning carried forward.
