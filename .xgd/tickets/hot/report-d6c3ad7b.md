---
uid: report-d6c3ad7b
id: REPORT-3705
type: report
title: 'UAT Coverage: Draft Change Journal: What Changed On The Draft, And Who Changed
  It'
created_by: xgd
created_at: '2026-09-10T09:15:34.750135+00:00'
updated_at: '2026-09-10T09:15:34.750135+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-702b7c02
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# UAT Coverage Assessment: Draft Change Journal: What Changed On The Draft, And Who Changed It

**Result**: PASS
**AC verdicts**: 17 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

One intent has ever touched this capability. Nothing later retires any part of it.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-131 (`request-5d3bf630`, via BUNDLE-19 `bundle-77b28def`) | `free_and_reconciled` | created 2026-08-11, reconciled 2026-08-20, `merged_at_commit b18b859d` | Added the whole capability: a monotone per-site change count returned by every write; bounded window of self-describing records (actor, time, op, page, label, before/after); a read op declared in `ReadSite` marked `untrusted`; the per-turn push signal; manual overview rule + sequence + revised undo absence. Its 9 numbered ACs are the spine of AC-1253…AC-1268 | YES |

**On the intent's two halves.** REQ-131 carries a planning half and an appended `## As built`
half, and the second is where four of the matrix's ACs get their authority — they are
grounded, not unreviewed:

- **AC-1254** (a no-op advances nothing) — `As built → Notable implementation points`.
- **AC-1255** (every write hands the count back, including the asset-shaped answers) —
  `As built → One thing the spec did not anticipate`, which explicitly overrides the
  planning half's narrower "the `change` and `publish_result` shapes gain the counter".
- **AC-1262** (a malformed store reads as empty, never fails an edit) — `As built → Where
  the journal lives`.
- **AC-1267 / AC-1268** (`1c changes <slug> [--since n]`, human and `--json`) —
  `As built → Notable implementation points`.

**One apparent contradiction, already resolved inside the intent — not drift.** The
planning half says a record is appended *"transactionally with the write it describes"*;
as built there is no transaction, and the story's Technical Context records the divergence
openly ("Divergence from the intent, recorded not absorbed"). The intent's own as-built
half endorses the shipped design in the same words — *"records at the return of a mutating
command, never before the write… which is what makes 'a refused write appends nothing'
true without a transaction"*. So AC-1253 states what intent currently says, and no `ac-edit`
or `code-issue` follows. Recorded here so a later round does not re-open it.

**AC-1263's publish-no-op assertion** leans on REQ-149 (unchanged publish is a no-op), a
later intent that did not touch this capability's behaviour — it only changed the sharpest
available way to observe the byte-identity property. Also not drift.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-115 (`story-6cd17452`) | REQ-131 (both halves) | aligned | Every in-scope bullet, every out-of-scope bullet and every pinned decision in the story body maps onto REQ-131 — the per-site grain, the 500-record / 300-character window, actor attribution defaulting to `cli`, the gitignored location beside the site rather than inside `draft/`, and the guidance living in the manual's overview rather than on the operation. No behaviour in the body is unsupported; no behaviour REQ-131 asked for is missing from it. |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | uat | STORY-115 | uat-edit (optional) | `tests/test_UAT_FC_REQ-131_change_journal.test.ts` (13 cases) is now a near-subset of `tests/reconciliation-draft-change-journal.test.ts` (17 cases, one per AC). Every behaviour the older file proves is proven again in the AC-named file **except one**: the older file's `..._a_write_hands_its_resulting_count_back_to_the_caller` observes the count coming back through `Toolbox.run('set_l1', …)`, i.e. at the tool seam, whereas AC-1255's case observes it at the `edit*` seam only. Two files covering one capability is the duplicate-definition pattern the coding standards call out. | If consolidating: fold the toolbox-seam count-back assertion into `test_UAT_AC1255_…` first, then delete the older file. Do **not** delete it as-is — that loses the one distinct observation. |

No violations. No `needs_review`. No `needs_review-default`.

## Evidence Actually Run

Read-only judgement was backed by execution, not just by reading the cases:

- `npm test -- tests/reconciliation-draft-change-journal.test.ts` → **17 passed / 17**, 1.39s.
  One case per AC, named `test_UAT_AC<n>_…`.
- `npm test -- tests/test_UAT_FC_REQ-131_change_journal.test.ts` → 12 passed, 1 skipped,
  file marked failed. **The failure is environmental, not a product defect**: the
  signal suite's `beforeAll` calls `startBuilder`, which dies on
  `listen EPERM: operation not permitted 0.0.0.0` — the sandbox refuses to bind a socket.
  The same acceptance criterion (AC-1266) is proven by the reconciliation file's
  `test_UAT_AC1266_…`, which drives `streamPrompt` against a real session manager, real
  tool loop and real on-disk journal without needing a listening socket, and passes.
  Nothing here should be read as this capability's code being broken.

## Evidence Validity

The AC-named suite meets the thin-mock rule with room to spare. Nothing stubs `edit.ts`,
the store, the journal or the Toolbox:

- The counter, record and degradation cases drive the real `edit*` functions against a real
  site created by `cmdNew` in a real temp directory.
- AC-1264 / AC-1265 / AC-1621 read the real `L1_DECLARATION` **and** the projected manual,
  and AC-1621 pulls the overview paragraph out of the declaration and requires it in the
  manual *verbatim* — so the rule cannot be sourced from a preamble that could drift from
  the declaration. That is a substantive check, not a name-appears-in-a-string check.
- AC-1267 / AC-1268 invoke the real `1c` entry point (`run(argv)`), capturing stdout and the
  process exit code, rather than calling the command function directly.
- AC-1266 runs five turns on one real session through the real reminder channel; the only
  double in the file is the Anthropic client, which is the network boundary.

## Notes for the Editor

- **Nothing to fix for this capability.** All 17 ACs are active per cumulative intent, all
  are covered by a passing case that could distinguish a correct implementation from a wrong
  one, and the story body is aligned. The single finding is a warning and does not gate.
- **The UAT index is not the place to look here.** `.xgd/uat_index.json` reports zero tests
  for every AC in this capability (`acs` is an empty map, stamped 2026-09-09T22:50:28Z) while
  17 AC-named cases exist and pass. That is the known indexer/vitest-naming mismatch, not
  missing coverage — any downstream stage that reads the index for this capability will read
  a false zero.
- **AC-1621 is `status: pending`** while the other sixteen are `active`. It was created
  2026-09-10 and its behaviour is fully supported by REQ-131 Part 2 and fully covered by a
  passing case, so `uat_coverage` is `pass` regardless; whoever owns AC lifecycle may want to
  promote it to `active` for consistency.
