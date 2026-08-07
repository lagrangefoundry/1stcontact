---
uid: report-7e6aba4d
id: REPORT-1585
type: report
title: 'Capability-Intent Alignment: site_colour_census_and_retrofit (level=story)'
created_by: xgd
created_at: '2026-08-07T16:30:50.043161+00:00'
updated_at: '2026-08-07T16:30:50.043161+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-e382c142
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: site_colour_census_and_retrofit
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Cumulative Intent Considered

The capability ticket itself carries no `intent_uid`. The tree's sole story
(STORY-97 / story-5e7eb0c5) carries `intent_uid: bundle-0385746c` and no
`updated_by`, so the ledger is one live intent deep.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-14 (bundle-0385746c) — **REQ-114** | free_and_reconciled | 2026-08-06, merged at `cd8f98c8` | REQ-114 §3 retrofit of the four stored sites (alpha collapse first, then ramp grouping, unclustered keeps its own entry, name from DOC-23 §5.4 vocabulary) and §5 tooling (a repeatable census command; assignment is a separate re-runnable pass, the fold stays literal-only). ACs 3, 5, 6, 7 land in this capability. | **YES** |
| BUNDLE-14 — BUG-31, REQ-116 | free_and_reconciled | 2026-08-06 | Sandbox R2 keyspace namespacing; the edit render. Neither touches colour. | YES, but not this capability |
| BUNDLE-15 (bundle-7985e0d1) | **abandoned** | 2026-08-06 | Superseded duplicate of BUNDLE-14 carrying the same REQ-114 text | **NO** |
| BUNDLE-16 (bundle-15c1f647) | free_and_reconciled | 2026-08-07 | REQ-117 / REQ-115 / REQ-44 — copy editing, builder shell, tooling hygiene. Zero palette/census asks; updated STORY-83 for edit-render reasons only. Retires nothing here. | YES, but not this capability |
| BUG-24 (bundle-4ff83a8b) | free_and_reconciled | 2026-07-24 | Made colour alpha representable in the captured value set. Adjacent — it is why "alpha families" is a measurable thing — but touched no story in this tree. | YES, but not this capability |

**Cumulative picture**: REQ-114 is the only intent that has ever asked anything
of this capability, and nothing since has modified or retired any part of it.
The current cumulative intent is exactly REQ-114 §3 + §5, plus its ACs 3, 5, 6
and 7. REQ-114's other asks are deliberately housed elsewhere: §1/§2 (schema,
renderer, dangling-reference rejection, load-boundary resolution) on STORY-80
under the framework substrate capability, and §4 (legacy 15-slot palette
retirement, `--color-*` removal, `theme.palette` dropped from the four drafts,
dark-mode override cut) on STORY-83 under the same capability.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-83 (capability-e382c142) | REQ-114 (via BUNDLE-14) | **merged** into CAP-89 (capability-b4ac88fc) as its "Site colour census & palette retrofit" section; retained as a redirect shell. Scope statement faithful except one omission — see finding 1. |
| STORY-97 (story-5e7eb0c5), `feature`, 2 pts, status `completed` | REQ-114 (BUNDLE-14) | **aligned.** Already re-parented to capability-b4ac88fc; reachable from the CAP-83 filter because the ticket index resolves `merged_into`. |
| — its In-scope bullets | REQ-114 §5, §3, ACs 3/5/6/7 | aligned: census → §5 + AC7; `--assign` two-pass derivation → §3 + AC5; lossless-or-nothing → AC3; naming → §3; re-runnable → §5. |
| — its Out-of-scope bullets | REQ-114 §1/§2 + Non-goals | aligned: model deferred to STORY-80, no picker/editor UI (an explicit REQ-114 non-goal), fold unchanged (explicit in §5). |
| — its two Intent/observation notes | REQ-114 AC6, AC7 | aligned, with divergence recorded rather than hidden — see finding 2. |
| Boundary vs STORY-80 / STORY-83 (capability-ae9d65d6) | REQ-114 | **no overlap.** Each of the three names the other two's territory explicitly; a sweep of every story body for census/retrofit/`1c colors`/alpha-collapse/ramp-grouping returns only these three, and STORY-80's and STORY-83's hits are disclaimers, not claims. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | CAP-89 (capability-b4ac88fc) body, "Site colour census & palette retrofit" section | story-body-edit (capability body) | The absorbed scope paragraph carries census, derivation, role-vocabulary renaming and the lossless-or-refuse write, but drops the **re-runnability** bullet that CAP-83's own scope listed and that REQ-114 §5 mandates ("Palette assignment is a separate, re-runnable pass over a folded site"). The behaviour itself is *not* lost — STORY-97's body has a "Re-runnable" bullet and AC-947 asserts it — so this is a lossy merge abstract, not a coverage gap. Left as-is, a future reader of CAP-89 alone would not know re-runnability is in scope. | Append to CAP-89's colour section: "…and re-runnability: an already-retrofitted site censuses and re-assigns as it did the first time, so adding a page or renaming a family is one command rather than a manual un-assignment." |
| 2 | info | consistency | STORY-97 Technical Context | — | The two "Intent/observation note" paragraphs record deliberate, reasoned divergence from REQ-114's literal AC text: AC7 asks the census to "reproduce the DOC-23 §5.3 table" (17 distinct / 15 RGB) but the site has since gained a document-level text colour, so it reports 18/16 — the durable property being the method and the collapse, not frozen numbers; and AC6 asks for all four sites retrofitted, but `1stcontact` and `harbor-cafe` census at zero colour literals and so are vacuously retrofitted. Both verified true on disk. This is the drift-prevention artifact working as designed — no action. | none |
| 3 | info | consistency | STORY-97 body, CLI surface + retrofit outcome claims | — | Verified against the delivered system rather than taken on trust: `tools/generate/src/cli/index.ts:298` documents `1c colors <slug> --assign [--names <derived>=<chosen>,…] [--json] [--sandbox]`, matching the body's claimed surface flag-for-flag; `storage/sites/xgd/draft/site.json` carries 6 palette entries and `gigabytealchemy` 8, matching the body's "18 literals → 6 entries" and "→ 8 entries"; `1stcontact` and `harbor-cafe` carry none, matching the vacuous-retrofit note; and no draft retains `theme.palette` (STORY-83's slice, confirmed complete). | none |
| 4 | info | — | AC-939 … AC-947 | — | None of the nine ACs carries an `intent_uid` or `updated_by`, so the AC layer cannot be traced to REQ-114 from the tickets alone — the chain currently runs intent → story only. Not a story-level defect, but it will make a future `ac`-level ledger harder to reconstruct. | none (flagged for the ac-level cycle) |

## Notes for the Editor

- **The three-way REQ-114 split is the notable structural fact here, and it is
  clean.** REQ-114 is a wide intent whose asks were deliberately distributed
  across two capabilities and three stories: STORY-80 owns the colour value
  model, STORY-83 owns the page-level document colour fields and the negative
  guarantee that no second colour system survives, STORY-97 owns the census and
  retrofit tooling. Each of the three states the other two's boundary in its own
  body, in agreement. No behaviour REQ-114 asked for is unowned, and none is
  claimed twice. If a later cycle validates capability-ae9d65d6, the same
  boundary text should be found intact from that side.

- **CAP-83 is a merge shell, not a live capability.** `fields.merged_into =
  capability-b4ac88fc`, and STORY-97's `capability_uid` already points at the
  merge target; the CAP-83-filtered story query resolves through `merged_into`,
  which is why the tree is still reachable from the scope path. Finding 1 is the
  only residue of that merge worth repairing, and it is a body edit on CAP-89,
  not on CAP-83 — do not "fix" CAP-83's body, which is correct as a historical
  record of what was merged.

- **For the downstream uat-level cycle**: STORY-97 carries no `uat_coverage`
  field, where its two sibling stories under capability-ae9d65d6 (STORY-80,
  STORY-83) both carry `uat_coverage: pass`. That is a UAT-layer question, out
  of scope for this level, but it is the one field asymmetry in the tree and
  worth resolving before the uat cycle draws conclusions from it.

- **No `needs_review` was raised.** The intent ledger is unusually unambiguous
  for this capability — one live intent, no retirements, no silent behaviours in
  the story body. Every in-scope bullet in STORY-97 traces to a named REQ-114
  section, and the two places where the delivered behaviour departs from
  REQ-114's literal AC wording are already documented in the story body with
  their reasoning.
