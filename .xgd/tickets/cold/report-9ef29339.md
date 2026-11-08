---
uid: report-9ef29339
id: REPORT-1286
type: report
title: 'Capability-Intent Alignment: reproduction-module-treatments (level=story)'
created_by: xgd
created_at: '2026-08-05T18:29:20.992490+00:00'
updated_at: '2026-08-05T18:29:20.992490+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-938f26ec
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: reproduction-module-treatments
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Headline

CAP-69 (`capability-938f26ec`) was **absorbed into CAP-72 / Framework Substrate:
L1 Layout, Values & Behavior Modules (`capability-ae9d65d6`)** during the
2026-08-05 structural rebalance (REPORT-1266 / `report-bdaf6840`). It now holds
**zero stories** and is retained as a historical pointer only.

Verified authoritatively: every one of the 12 stories in the project was read
directly via `xgd ticket get <uid> --json`; **none** carries
`fields.capability_uid = capability-938f26ec`. Its former sole story STORY-82
(`story-46e3b3c7`) now reads `capability_uid: capability-ae9d65d6`
(`last_field_updated: capability_uid`, 2026-08-05T17:24Z) — only the pointer
changed; the story body was not modified.

With an empty tree, the story-level alignment question reduces to: does the
capability's own body still tell the truth about cumulative intent, and was any
intent orphaned by the move? Both answers are yes/no respectively — hence PASS.

## Cumulative Intent Considered

| Intent ID | Status | Constituent asks relevant here | Counts? |
|---|---|---|---|
| BUNDLE-6 (`bundle-ab9e0cb6`) — originating `intent_uid` | free_and_reconciled (merged @ `7a42e18`) | REQ-58 (gigabytealchemy pass-3 reproduction — the pass that forced the card veil/border, placeholder/inline contact form, and footer colour-departure treatments onto the framework), REQ-59, REQ-61, REQ-62 | YES |
| BUNDLE-7 (`bundle-31e474b9`) — `updated_by` | free_and_reconciled (merged @ `edeb1c2`) | REQ-79 (framework pivot: L1 substrate + capability modules), REQ-82 (L1 schema/renderer/validator), REQ-83 (capture→L1 fold), **REQ-84 (delete hero/text-block/services-grid/footer/header/layer + ~20 dials)**, **REQ-85 (capability-module contract; reframe contact-form)**, REQ-86 (3-probe gate), REQ-63 | YES |

Chronology: BUNDLE-6 introduced the treatments as per-module dials; BUNDLE-7
(REQ-84 + REQ-85) **retired the delivery mechanism while preserving the
treatments**, re-homing the card/footer look onto L1 leaf axes and the form onto
contact-form capability config + named L1 slots. Both bundles are
`free_and_reconciled`, so the *post-pivot* formulation is the current cumulative
intent. No intent in the ledger is `abandoned`/`deprecated`/`draft`; none is
merely imminent.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-69 body (post-pivot narrative) | BUNDLE-6, BUNDLE-7 (REQ-84, REQ-85) | **aligned** — body describes the treatments as delivered via L1 leaf axes + contact-form config/slots, and explicitly records the module deletion. Cross-checked against BUNDLE-7's own REQ-84/REQ-85 sections: the claims match. No reference to a surviving `services-grid`/`footer`/`header`/`hero`/`text-block`/`layer` module or to retired dials (`submitColor`, `submitInline`, `fieldLabels=placeholder`) as live surfaces. |
| CAP-69 ABSORBED banner | rebalance (REPORT-1266) | **aligned** — banner claims "zero stories"; independently verified true against all 12 story tickets. |
| CAP-69 story tree | — | **empty by design** — zero stories. Not a coverage gap: the intent surface moved intact to `capability-ae9d65d6`, it was not dropped. |
| STORY-82 (`story-46e3b3c7`) | BUNDLE-6, BUNDLE-7 | **out of scope for this capability** — now under `capability-ae9d65d6`; its story-level alignment is that capability's to assess. Recorded here only to evidence that no intent was orphaned by the move. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | CAP-69 story tree | — | Zero stories. Every behavior BUNDLE-6/BUNDLE-7 asked of this capability is carried by STORY-82 under `capability-ae9d65d6` (body unmodified by the move). No intent orphaned. | none |
| 2 | info | consistency | CAP-69 body | — | Body accurately states the REQ-84 module deletion and REQ-85 contact-form reframe; no retired dial or deleted module is described as a live authoring surface. | none |
| 3 | warning | consistency | CAP-69 frontmatter (`status: active`, `fields.uat_coverage: pass`) | — (blocked upstream) | A zero-story, absorbed capability still reads `status: active` with a stale `uat_coverage: pass` verdict. **Not repairable by a matrix editor**: `reject_deprecation_if_capability_has_stories` calls `attached_story_ids()`, which on a branch worktree resolves to the canonical main store holding the pre-merge `capability_uid`, so it reports phantom attached stories and refuses the flip. Documented in REPORT-1266 (`report-bdaf6840`); `fields.merged_into: capability-ae9d65d6` + the body banner were applied as the compensating record. | No matrix edit. Flip `status` to `deprecated` once the index defect is fixed in the xgd system repo. |
| 4 | info | — | ticket index (this worktree) | — | The index is stale/duplicating here: `xgd ticket list --type story --filter fields.capability_uid=capability-938f26ec` **still returns STORY-82**, contradicting the authoritative ticket read; `xgd ticket list --type story` returns 21 rows for 12 unique stories (and per REPORT-1266, `--type capability` returns 22 for 11). | none — but see Notes |

**PASS**: 0 violations, 0 needs_review.

## Notes for the Editor

- **Do not act on `xgd ticket list --filter` output on this branch.** It reported
  STORY-82 as still belonging to CAP-69; the authoritative
  `xgd ticket get story-46e3b3c7 --json` says `capability-ae9d65d6`. Every
  story-assignment claim in this report was established by direct per-ticket
  reads, not by the filter. Any downstream check on this worktree that derives
  capability membership from the index will draw the opposite (wrong)
  conclusion and may try to "repair" a move that is already correct — that
  would be a regression, not a fix.
- **No fix loop should be opened against this capability.** Its only outstanding
  item (finding 3) has a root cause in the xgd system repo
  (`/Users/martin/lagrangefoundry/xgd`), not in this project's matrix. Editing
  the story tree, ACs, or body here cannot resolve it and risks re-introducing
  content the rebalance deliberately consolidated.
- **Where the treatments live now**, for anyone tracing the intent: card
  veil/tint, card border toggle, and footer copyright/text/link-colour
  departures → L1 leaf axes (validated colour/border/opacity literals or a named
  overlay role) on box/text/image nodes; compact / placeholder-labelled / inline
  contact form → contact-form capability config plus the named `submit` and
  `intro` L1 presentation slots, with field labelling retained inside the vetted
  core as an accessibility obligation rather than a styling dial. The eight
  original module-dial ACs (AC-674..681) are archived as superseded, not deleted.
