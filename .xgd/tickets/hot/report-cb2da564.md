---
uid: report-cb2da564
id: REPORT-3699
type: report
title: 'Capability-Intent Alignment: Draft Change Journal: What Changed On The Draft,
  And Who Changed It (level=ac)'
created_by: xgd
created_at: '2026-09-10T08:26:47.078611+00:00'
updated_at: '2026-09-10T08:26:47.078611+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-702b7c02
  level: ac
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Draft Change Journal: What Changed On The Draft, And Who Changed It
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

Anchor report: report-e37a6b4a. Capability: capability-702b7c02 (CAP-99). Level: `ac`.
Previous attempts: 0.

## Cumulative Intent Considered

CAP-99 carries exactly one story, STORY-115 (`story-6cd17452`, `story_kind: feature`,
status `completed`), whose `intent_uid` is `bundle-77b28def` (BUNDLE-19). Neither the
capability nor the story carries an `updated_by` chain, so the ledger below was built by
scanning every intent-shaped ticket in the store that mentions the journal / change count.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-131 (in BUNDLE-19, `bundle-77b28def`) | free_and_reconciled (merged at `b18b859d74`) | created 2026-08-18, completed 2026-08-20 | **Originating intent.** Monotone per-site counter returned by every mutating write; self-describing journal records (counter, actor, timestamp, operation, target, label, before/after copy); bounded window with `truncated`; new `list_changes` read op in `ReadSite` marked `provenance: untrusted`; counter added to `change`/`publish_result` shapes; **an overview paragraph and a `sequences` entry**; the `absences`-on-undo note revisited; the per-turn push signal in `caretakerReminder()`. Nine numbered ACs. Pins four open decisions in its "As built" half (gitignored `.journal.json` beside the site, 500 records / 300 chars, actor attribution shipped, per-site grain) and records one unanticipated widening: **every** write hands the count back, including `add_asset` / `write_image`. | YES |
| REQ-142 (same bundle, `bundle-77b28def`) | free_and_reconciled | 2026-08-20 | Async `SiteStore` port; the journal is one of the surfaces behind that port. No behavioural ask against this capability. | YES |
| BUNDLE-20 (`bundle-b3b7c399`, REQ-147 + REQ-143 + REQ-145 + REQ-146 + REQ-148 + 5 more) | free_and_reconciled | 2026-08-24 | Re-homed the journal onto the ported store: `store.counter(slug)` (async) replaces the sync `draftCounter(ctxOf(opts), slug)` at the `host.ts` baseline; in the cloud store the journal is **rows, not a JSON blob**, with `journal-model`'s window arithmetic restated as the DELETE it implies. Storage-mechanism change only — no change to what the journal answers. | YES |
| BUG-39 (in BUNDLE-22, `bundle-8eef3846`, with REQ-154) | free_and_reconciled (BUG-39 itself `bundled`) | 2026-08-31 | Repaired the Node chat-host test doubles, including the `test_UAT_FC_REQ-131_change_journal` suite and the third copy of the double in `reconciliation-draft-change-journal`. Test-infrastructure only; no AC-level ask. | YES (no behaviour) |

No retired, abandoned or deprecated intent touches this capability, so nothing in the
cumulative picture had to be subtracted. The current cumulative intent for CAP-99 is
REQ-131 as amended by its own "As built" half, on the storage substrate BUNDLE-20 moved
it to.

Because this cycle runs at `ac` level, STORY-115's body is the working reference. It was
read in full and is internally consistent with REQ-131 (it restates the four pinned
decisions and the every-write-returns-the-count widening as settled fact, and records the
one deliberate divergence from the intent — recording happens *after* the write, not
transactionally with it — under "Divergence from the intent, recorded not absorbed").
Intent history was consulted only to attribute findings and to confirm nothing was retired.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-115 (`story-6cd17452`) | REQ-131, REQ-142, BUNDLE-20, BUG-39 | aligned as a body; **gap in its AC tree** — in-scope item 6 (the manual guidance) is unrepresented (finding 1) |
| AC-1253 `acceptance_criterion-4f4c08ee` | REQ-131 AC 1 | aligned |
| AC-1254 `acceptance_criterion-47bb5d8b` | REQ-131 "As built" (*"A no-op advances nothing"*) → story body Technical Context | aligned |
| AC-1255 `acceptance_criterion-7d84d8cb` | REQ-131 "One thing the spec did not anticipate" (asset-shaped answers; `image`/`asset`/`palette_change` shapes widened to declare the count) | aligned |
| AC-1256 `acceptance_criterion-235fa559` | REQ-131 AC 2 | aligned |
| AC-1257 `acceptance_criterion-2fb6d5dd` | REQ-131 AC 3 + actor-attribution pin (unattributed caller ⇒ operator's own tools) | aligned |
| AC-1258 `acceptance_criterion-5c343248` | REQ-131 AC 4 | aligned |
| AC-1259 `acceptance_criterion-6cab19ed` | REQ-131 AC 5 + window pin (500 records) | aligned |
| AC-1260 `acceptance_criterion-164fa361` | REQ-131 AC 6 | aligned |
| AC-1261 `acceptance_criterion-64dc9374` | REQ-131 window pin (300 characters per text value) | aligned |
| AC-1262 `acceptance_criterion-ffe1f8e9` | REQ-131 "Where the journal lives" pin (*"a malformed file reads as empty rather than throwing"*) | aligned — verified against `tools/generate/src/store/journal.ts:60`-`74` |
| AC-1263 `acceptance_criterion-8e517739` | REQ-131 "This is not a revision" + out-of-scope "any change to the revisions model" + the gitignored-and-outside-`draft/` pin | aligned |
| AC-1264 `acceptance_criterion-a14cb18c` | REQ-131 AC 7 / Part 2 (`ReadSite`) | aligned |
| AC-1265 `acceptance_criterion-98674475` | REQ-131 AC 8 / Part 2 (`returns.provenance: "untrusted"`) | aligned |
| AC-1266 `acceptance_criterion-7e6ce01d` | REQ-131 AC 9 / Part 3 + the baseline-recorded-after-the-turn pin | aligned |
| AC-1267 `acceptance_criterion-3d3e3a8b` | REQ-131 "As built" (`1c changes <slug> [--since n]`) → story body in-scope item 4 | aligned |
| AC-1268 `acceptance_criterion-cc79d168` | same, machine-readable half | aligned |
| — (missing) | REQ-131 Part 2, bullets 4–5 and 7; story body in-scope item 6 | **gap**: the overview paragraph, the named sequence, and the revisited undo `absences` note are asked for, are implemented, and no AC claims them (findings 1 and 2) |

All 16 ACs are `status: active`, all carry `kind: behavior` and `regression_only: false`,
and all 16 are matched by a `test_UAT_AC12xx_*` test in
`tests/reconciliation-draft-change-journal.test.ts` — so the gap below is an AC-tree gap,
not merely an untested AC.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-115 (`story-6cd17452`) | ac-add | STORY-115's in-scope item 6 is a whole deliverable — *"The manual guidance that tells the assistant what to do when the signal fires… The assistant's manual gains it in two places: its **overview** carries the cross-cutting rule… and a named **sequence** walks the response end to end, signal → read the changes → act"* — reinforced by its own Technical Context paragraph *"The cross-cutting guidance lives in the manual's overview, not on the operation"*, and asked for verbatim by REQ-131 Part 2 (*"The `overview` gains one paragraph"*, *"A `sequences` entry — signal → read the changes → act"*). **No AC in AC-1253…AC-1268 covers it.** AC-1264 asserts only that the *operation* is projected/absent by grant, AC-1265 only its untrusted marking, AC-1266 only the reminder line. The behaviour is implemented — `tools/generate/src/cli/ai/l1-surface.json:7` carries the overview paragraph (*"**Your user can change the site themselves, while you are working on it.**… you are told, at the start of a turn, when something has changed… When you are told, look at what changed before you act"*) and the `sequences` array carries `"Pick up after your user has been editing"` with steps `list_changes → describe_page → get_l1` and the note *"start here — not with a re-read of the page… never write over a change you have not read"* — and no test anywhere asserts either (`grep -rln "Pick up after your user"` and `grep -rln "change the site themselves"` over `tests/` and `tools/` hit only `l1-surface.json` itself). CAP-92's AC-1080 (`acceptance_criterion-73371752`) and AC-670113cb project the *addressing* rule, the absences section and sequence well-formedness generically; neither claims this content. | Author one AC under STORY-115: the projected manual carries the cross-cutting rule that the user edits the same page the assistant is working on and that the assistant is told at the start of a turn when something moved and must read the changes before writing; and a named sequence exists whose first step is the change read rather than a page re-read. Verify by building the manual for a `ReadSite`-granted session and asserting both, plus that the sequence's steps are declared operations in order. |
| 2 | warning | coverage | STORY-115 (`story-6cd17452`) | ac-add | REQ-131 Part 2 asks for the undo `absences` note to be revisited: *"it currently instructs the AI to 'tell the user what the previous value was whenever you change something', which the journal makes unnecessary to carry in the conversation. Adjust the note; do **not** add undo."* STORY-115's body carries this as a consequence in its out-of-scope undo bullet (*"the assistant no longer has to narrate old values into the conversation to keep them recoverable — but there is no undo operation"*). It is implemented — `l1-surface.json`'s `"Undoing a change"` absence now reads *"what a thing said before is on record — `list_changes` carries the words before and after — so you do not have to narrate the old value into the conversation"*. No AC claims it. Lower severity than finding 1 because the story body states it as a consequence rather than as a deliverable. | Fold into finding 1's new AC: also assert the undo absence cites the change log as the record of prior values and still declares no undo operation. |
| 3 | info | exclusivity | AC-1256 + AC-1259 + AC-1262 | — | The three overlap incidentally in the quiet-site case: AC-1256 asserts truncation false on an empty answer, AC-1259 asserts *"on an untouched site since zero… truncation is false with an empty list"*, AC-1262 asserts an absent store answers empty with count zero. Applying the exclusivity judgment rule: three genuinely distinct criteria (the cheap nothing-happened reply, window degradation, store-absence degradation) that share one assertion, not duplicates. | none |
| 4 | info | consistency | AC-1262 (`acceptance_criterion-ffe1f8e9`) | — | AC-1262's specific numeric claims were checked against the implementation rather than taken on trust: `readJournal` returns `emptyJournal()` both when the file is absent and when parsing throws, and `draftCounter` reads `.counter` off it, so "empty list, count zero, never raises" holds and the next write answers `1` (`tools/generate/src/store/journal.ts:60`-`74`). | none |
| 5 | info | consistency | AC-1253…AC-1268 (all) | — | BUNDLE-20 moved the journal from a gitignored JSON blob to rows behind an async store. Every AC is phrased mechanism-neutrally ("change record store", "the retained window", "not part of the draft's version-controlled content"), so the port required no AC edit and none has gone stale against it. Worth recording since the next storage move will land the same way. | none |
| 6 | info | consistency | STORY-115 body | — | The story body's *"Divergence from the intent, recorded not absorbed"* paragraph deliberately contradicts REQ-131's *"transactionally with the write it describes"*, recording that journalling happens after the write and that an unwritable store leaves the count stale rather than failing the edit. This is an intentional, documented divergence in the safe direction (over-reporting), not drift, and it is why AC-1253's "a refused write records nothing" is provable without a transaction. No AC asserts the write-side failure path; the story frames it as recorded-for-regression rather than as a demand. | none |

## Notes for the Editor

- **One coherent repair.** Findings 1 and 2 are the same omission seen twice: STORY-115's
  AC tree covers the journal's *mechanism* exhaustively (16 ACs, all 16 with UATs) and its
  *guidance* not at all. Both surface elements already exist in
  `tools/generate/src/cli/ai/l1-surface.json`; one new AC can claim both, and the UAT that
  follows it is a manual-projection assertion of the same shape as AC-1264's.
- **Do not resolve this as `code-issue`.** The implementation is present and matches the
  story body word for word; only the claim is missing.
- **Step 2.5 was not triggered.** No story or AC text under this capability names a
  ticket as a delivery vehicle, and no intent in the ledger is abandoned, deprecated or
  wont_fix — so there was no stale-citation case to adjudicate and nothing was escalated
  to `needs_review`.
- **Ledger provenance is thin.** Neither CAP-99 nor STORY-115 carries an `updated_by`
  field, and the ACs carry no `intent_uid` at all, so the intent attributions in the
  ledger above were reconstructed from ticket bodies rather than read off the graph. A
  future cycle re-deriving this will have to do the same scan.
