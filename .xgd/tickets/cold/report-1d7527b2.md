---
uid: report-1d7527b2
id: REPORT-1300
type: report
title: 'Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene (level=ac)'
created_by: xgd
created_at: '2026-08-05T19:28:18.718364+00:00'
updated_at: '2026-08-05T19:28:18.718364+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ac7ca849
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Summary

`capability-ac7ca849` (CAP-66) owns **zero stories** and therefore **zero acceptance
criteria**. This was verified against ticket records, not the index: all 12 unique
story tickets in the project were fetched individually and none carries
`capability_uid=capability-ac7ca849`; all 50 indexed AC tickets were fetched and none
references this capability or resolves to a story under it.

The ac level is therefore **vacuously aligned** — with no owned ACs there is nothing
that can be inconsistent with a story body, nothing left uncovered, and nothing
duplicated. Cumulative intent for this capability is expressed by 7 active ACs under
`story-e15a19ef` (STORY-79), which the 2026-08-05 structural rebalance reassigned to
the survivor `capability-aa030c83` (CAP-63). That mapping was verified 1:1 and is
recorded in the ledger below.

The one open defect — the stale branch-worktree index double-attributing STORY-79
(and hence its 7 ACs) to both capabilities — is an xgd-system index defect already
diagnosed in `report-bdaf6840` and already raised as a **violation at the story
level** in `report-1ba06894` with resolution category `code-issue`. It is not ac-level
matrix drift, it is not repairable by an ac-level matrix editor, and re-raising it
here would be the eighth duplicate of a single upstream fix. It is recorded below as a
warning for traceability.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability (statuses re-verified
this run from the bundle tickets, not inherited from the prior report):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (`bundle-ab9e0cb6`)<br>REQ-58 + REQ-59 + REQ-62 + REQ-61 | free_and_reconciled | created 2026-07-17, completed 2026-07-19, main `7a42e182` | Originating intent (REQ-58 pass-3, plan item 5). Boolean `--multi-viewport` flag parsing; `--json` stdout hygiene, render diagnostics to stderr, stdout restored on failure | YES |
| BUNDLE-7 (`bundle-31e474b9`)<br>REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more | free_and_reconciled | created 2026-07-22, completed 2026-07-22 | Store-selecting flags propagate into driven sub-commands (`aligned-crops --sandbox`) | YES |
| BUNDLE-8 (`bundle-cceaba25`)<br>BUG-7 + REQ-91 + REQ-89 + REQ-90 + REQ-92 + 5 more | free_and_reconciled | created 2026-07-29, completed 2026-07-29 | Extended output hygiene: "Missing pages directory" warning suppressed at source on every command; Astro container constructed only for pages carrying behavior modules (REQ-89) | YES |

No intent in the ledger is `abandoned` / `deprecated` / `wont_fix`; none retires a
behavior described by this capability's body. Every documented behavior is live
intent, and all of it is expressed — see the ledger.

## Alignment Ledger

### This capability's ac-level surface

| Element | Intents aligned to | Outcome |
|---|---|---|
| `capability-ac7ca849` — owned stories | — | **Zero.** All 12 unique story tickets fetched by uid; actual `capability_uid` values are `capability-ae9d65d6` (×6), `capability-aa030c83` (×5), `capability-2049c9ec` (×2). None is `capability-ac7ca849` |
| `capability-ac7ca849` — owned ACs | — | **Zero.** Follows from zero owned stories. Independently confirmed: all 50 indexed ACs fetched by uid — zero orphaned `story_uid`, zero references to `ac7ca849` in fields or body |
| ac-level consistency / coverage / exclusivity | — | **Vacuously satisfied.** Empty AC set admits no drift at this level |

### Where this capability's cumulative intent now lives (coverage conservation)

All 7 ACs below are `status: active`, carry `story_uid=story-e15a19ef`, and
`story-e15a19ef` carries `capability_uid=capability-aa030c83` — verified per-ticket.

| AC | uid | Intent | CAP-66 body bullet it satisfies |
|---|---|---|---|
| AC-656 `--multi-viewport` keeps the site slug as a positional in either flag order | `acceptance_criterion-3e4b0eab` | BUNDLE-6 | Bullet 1 — flag parsing |
| AC-720 `aligned-crops --sandbox` renders, serves, and crops the sandbox reproduction | `acceptance_criterion-72db61ca` | BUNDLE-7 | Bullet 1 — flag parsing (propagation extension) |
| AC-657 `values-diff --json` prints exactly one parseable JSON document to stdout | `acceptance_criterion-9c235ff1` | BUNDLE-6 | Bullet 2 — output hygiene |
| AC-658 Render and bootstrap diagnostics are emitted on stderr, not stdout | `acceptance_criterion-7f078026` | BUNDLE-6 | Bullet 2 — output hygiene |
| AC-659 stdout is restored after the command runs, including when its computation fails | `acceptance_criterion-76a08c5b` | BUNDLE-6 | Bullet 2 — output hygiene |
| AC-738 Every `1c` command boots quietly — no 'Missing pages directory' warning on either stream | `acceptance_criterion-c7e51d45` | BUNDLE-8 | Bullet 2 — output hygiene (suppress-at-source extension) |
| AC-739 An Astro container is constructed only for pages that carry behavior modules | `acceptance_criterion-fcf814b5` | BUNDLE-8 (REQ-89) | Bullet 2 — output hygiene (quiet-boot mechanism) |

CAP-63's own Scope section carries the matching bullet verbatim in spirit — "CLI
argument parsing and output hygiene — boolean flags parse as boolean and do not
swallow following positionals; in `--json` mode stdout carries only the single JSON
document, with render/bootstrap diagnostics routed to stderr" — and its History
section names CAP-66 as one of the four consolidated sources. **Both of CAP-66's body
bullets map onto active ACs at the survivor with no residue.**

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | exclusivity | `capability-ac7ca849` + `capability-aa030c83` (ac-level manifestation) | `code-issue` | The stale branch-worktree index still returns STORY-79 for `--filter fields.capability_uid=capability-ac7ca849`, so a tree assembly would attribute AC-656/657/658/659/720/738/739 to **both** capabilities. Re-confirmed unchanged this run: `xgd ticket list --type capability` returns **22 entries for 11 capabilities**, and the story index returns 21 entries for 12 unique stories. Root cause already diagnosed in `report-bdaf6840`; already raised as a story-level **violation** in `report-1ba06894`. Fix is upstream in the xgd system repo (`rebuild-index` refuses on branch worktrees by design), not in this project's matrix | Rebuild the ticket index on `main`, then flip `capability-ac7ca849` to `status: deprecated` and clear `uat_coverage`. Do **not** repair at the ac level |
| 2 | info | coverage | `capability-ac7ca849` → `story-e15a19ef` ACs | — | Cumulative intent is fully conserved at the survivor: both CAP-66 body bullets plus the BUNDLE-7 and BUNDLE-8 extensions map onto 7 active ACs, verified per-ticket. No intent behavior was lost in the merge | none |
| 3 | info | consistency | `capability-ac7ca849` — empty AC set | — | Zero owned ACs is the **correct and intended end state** of a deliberate capability merge, not an authoring gap | none — authoring ACs here would create a real exclusivity violation against STORY-79's 7 ACs |

## Notes for the Editor

**Do not author ACs under this capability.** The empty AC set is the intended end
state of the 2026-08-05 structural rebalance, not a coverage hole. Any AC written here
would duplicate one of the 7 ACs already active under `story-e15a19ef` /
`capability-aa030c83` and would convert a clean merge into genuine matrix drift.

**Why this level passes while the story level failed.** The story-level failure
(`report-1ba06894`, violation #1) is a structural/tooling defect — capability stuck at
`status: active` with a stale index — whose resolution category is `code-issue` in the
xgd system repo. That finding is filed, diagnosed, and blocked upstream. It has no
ac-level repair, and this level's three properties (consistency, coverage,
exclusivity) are all vacuously satisfied over an empty AC set with intent fully
conserved at the survivor. Failing here would add a fourth unactionable loop iteration
(this is attempt 4) against a defect already recorded once.

**Cross-cutting.** Seven other absorbed capabilities (`capability-36dd68c5`,
`capability-18a822ac`, `capability-8108afab`, `capability-6e088083`,
`capability-bd0b722e`, `capability-938f26ec`, `capability-ce902be4`) are in the
identical zero-story state and will produce the same warning at their ac level. Resolve
once at the index level on `main`, not eight times per capability.

**Verification method used (for future re-checks).** The index on this branch worktree
is unreliable — it duplicates entries and serves pre-rebalance `capability_uid` values.
Every ownership claim in this report was established by fetching the ticket record by
uid (`xgd ticket get <uid> --json`) and reading `fields.capability_uid` /
`fields.story_uid` directly. Do not trust `--filter fields.capability_uid=...` on this
worktree.
