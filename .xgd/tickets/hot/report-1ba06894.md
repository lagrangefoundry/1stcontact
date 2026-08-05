---
uid: report-1ba06894
id: REPORT-1299
type: report
title: 'Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene (level=story)'
created_by: xgd
created_at: '2026-08-05T19:22:34.462022+00:00'
updated_at: '2026-08-05T19:22:34.462022+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ac7ca849
  level: story
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

## Summary

`capability-ac7ca849` (CAP-66) was **absorbed into `capability-aa030c83`** (CAP-63,
"1c Capture & Diff Fidelity") by the 2026-08-05 structural rebalance
(`report-bdaf6840` / REPORT-1266). Its cumulative intent is fully and faithfully
expressed by `story-e15a19ef` (STORY-79) under the survivor capability — there is
**no intent drift**.

The failure is structural, not semantic: the capability is stuck at
`status: active` with `uat_coverage: pass` and zero owned stories, and a stale
branch-worktree index still reports STORY-79 under it. The matrix therefore
double-counts STORY-79 across two capabilities.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (`bundle-ab9e0cb6`)<br>REQ-58 + REQ-59 + REQ-62 + REQ-61 | free_and_reconciled | created 2026-07-17, completed 2026-07-19, main `7a42e182` | Originating intent (REQ-58 pass-3, plan item 5). Boolean `--multi-viewport` flag parsing (commit `4f681c73`); `--json` stdout hygiene, render diagnostics to stderr, stdout restored on failure (commit `a4323720`) | YES |
| BUNDLE-8 (`bundle-cceaba25`)<br>BUG-7 + REQ-91 + REQ-89 + REQ-90 + REQ-92 + 5 more | free_and_reconciled | 2026-07-29 | Extended output hygiene: "Missing pages directory" warning suppressed at source on every command; Astro-free render path unless a page carries behavior modules (REQ-89, commit `5dc46d0f`). REQ-89's proposed lazy-registry fix explicitly **not** implemented | YES |
| BUNDLE-7 (`bundle-31e474b9`)<br>REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more | free_and_reconciled | 2026-07-22 | Store-selecting flags propagate into driven sub-commands (`aligned-crops --sandbox`, plan item 9, commit `09fa7cf5`). Reaches this tree via STORY-79 only | YES |

No intent in the ledger is `abandoned`/`deprecated`/`wont_fix`, and none retires a
behavior described by this capability's body. Every documented behavior is live
intent.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| `capability-ac7ca849` (CAP-66) — body | BUNDLE-6 | **Consistent with intent, but no longer owner.** Body's two bullets (boolean flag parsing; `--json` output hygiene) are exactly BUNDLE-6 / REQ-58 pass-3 plan item 5. Body carries an explicit ABSORBED banner + `merged_into: capability-aa030c83`, so ownership is unambiguous in prose |
| `capability-ac7ca849` — owned stories | — | **Zero.** No story ticket carries `capability_uid=capability-ac7ca849`. Verified against the ticket record, not the index |
| `story-e15a19ef` (STORY-79) | BUNDLE-6, BUNDLE-7, BUNDLE-8 | **Aligned — and owned by `capability-aa030c83`.** Ticket field `capability_uid: capability-aa030c83`. Appears under ac7ca849 **only** via a stale index entry (`UPDATE:2026-07-29` stale vs `UPDATE:2026-08-05` current) |

**Intent-preservation check (the material question):** STORY-79's Technical Context
states "Guarantees 1–2 reconciled from bundle-ab9e0cb6 (REQ-58 pass-3), plan item
5, commits 4f681c73 and a4323720" — a verbatim provenance match to CAP-66's body
citation ("bundle-ab9e0cb6 (REQ-58 pass-3), plan item 5"). CAP-63's Scope section
also carries the corresponding bullet ("CLI argument parsing and output hygiene —
boolean flags parse as boolean and do not swallow following positionals; in
`--json` mode stdout carries only the single JSON document, with render/bootstrap
diagnostics routed to stderr"). **Coverage of this capability's cumulative intent
is conserved in full at the survivor.**

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | exclusivity | `capability-ac7ca849` + `capability-aa030c83` | `code-issue` | Capability remains `status: active` with zero owned stories after absorption, and the branch-worktree ticket index still returns STORY-79 for `--filter fields.capability_uid=capability-ac7ca849`. STORY-79 is therefore counted under **both** capabilities, so `assemble_capability_tree()` double-counts it. Confirmed systemic: `xgd ticket list --type capability` returns **22 entries for 11 capabilities** on this worktree (each capability appears twice, `UPDATE:2026-07-24` and `UPDATE:2026-08-05`). Root cause diagnosed in `report-bdaf6840`: `reject_deprecation_if_capability_has_stories` → `attached_story_ids()` queries the index, which on a branch worktree resolves to the canonical main store holding pre-merge `capability_uid` values; `xgd ticket rebuild-index` refuses on branch worktrees by design | Flip `capability-ac7ca849` to `status: deprecated` once the ticket index is rebuilt on `main`. **Do NOT author stories/ACs/UATs under this capability** — that would duplicate STORY-79. Fix is in the xgd system repo (`/Users/martin/lagrangefoundry/xgd`), not this project |
| 2 | warning | consistency | `capability-ac7ca849` — `fields.uat_coverage` | `story-body-edit` (field clear) | Field asserts `uat_coverage: pass` on a capability with zero owned stories, so there is nothing under it for that assertion to range over. It is a vestige of the pre-rebalance tree and will read as a live green signal to any consumer that does not parse the body banner | Clear or set `uat_coverage: n/a` in the same operation that flips status to `deprecated` |
| 3 | info | coverage | `capability-ac7ca849` → `story-e15a19ef` | — | Cumulative intent fully preserved at the survivor: BUNDLE-6 guarantees 1–2 map 1:1 onto STORY-79 guarantees 1–2 with matching commit provenance; CAP-63's Scope carries the matching bullet. No intent behavior was lost in the merge | none |
| 4 | info | consistency | `capability-ac7ca849` — `fields.intent_uid` | — | Capability ticket carries no `intent_uid` field; its provenance (BUNDLE-6 / REQ-58 pass-3) is recoverable only from body prose. Traceability gap with no remediation value given the capability is being retired | none |

## Notes for the Editor

**This capability is not repairable by matrix editing, and should not be treated as
a story-authoring gap.** The zero-story state is *correct and intended* — it is the
end state of a deliberate merge. Authoring stories here to "close the coverage gap"
would create a genuine exclusivity violation against STORY-79. The only correct
repair is the status flip, which is blocked upstream.

**The blocker is a known xgd-system defect, already diagnosed and flagged, not
re-discovered here.** `report-bdaf6840` records two blockers:

1. `uat_index_absent` — `.xgd/uat_index.json` is gitignored (`.gitignore:27`) and
   not rebuilt by the regression bootstrap; `UATCountIndex._load` returns 0 for
   everything and silently sets `loaded=False`. This made the anchor structural
   report (`report-31234d67`) claim 0 UATs for all 11 capabilities — an artifact,
   not data. Rebuilt during rebalance: 87 UATs across 86 ACs.
2. `stale_index_on_branch` — the deprecation invariant reads the canonical store;
   capability list duplicates 22-for-11.

**Consequence for this regression run:** because of blocker 2, *any* capability
health or tree-assembly check re-run on this branch is unreliable, not just this
one. The seven other absorbed capabilities (`capability-36dd68c5`,
`capability-18a822ac`, `capability-8108afab`, `capability-6e088083`,
`capability-bd0b722e`, `capability-938f26ec`, `capability-ce902be4`) are in the
identical state and will each produce this same finding. Expect this to be a
cross-cutting pattern across the run, and resolve it once at the index level rather
than eight times at the capability level.

**Recommended sequencing:** rebuild the ticket index on `main`, then flip all eight
absorbed capabilities to `deprecated` and clear their `uat_coverage` fields in a
single pass. Re-run this alignment check afterward; on intent grounds alone it
passes today.
