---
uid: report-a74f499b
id: REPORT-1289
type: report
title: 'UAT Coverage: reproduction-module-treatments'
created_by: xgd
created_at: '2026-08-05T18:44:33.959072+00:00'
updated_at: '2026-08-05T18:44:33.959072+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-938f26ec
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# UAT Coverage Assessment: reproduction-module-treatments

**Result**: FAIL
**AC verdicts**: 2 pass, 0 fail, 0 deprecated, 0 needs_review (8 legacy ACs already archived — see below)
**Story verdicts**: 0 pass, 0 fail, 1 stale, 0 needs_review
**Capability verdict**: fail

## Scope note — this capability was absorbed; routing is via a stale index

CAP-69 (`capability-938f26ec`) was **absorbed into CAP-70 Framework Substrate: L1
Layout, Values & Behavior Modules** (`capability-ae9d65d6`) by the 2026-08-05
structural rebalance (REPORT-1266 / `report-bdaf6840`). Its body carries the
ABSORBED banner and `fields.merged_into = capability-ae9d65d6`.

By ticket truth it holds **zero stories**: `story-46e3b3c7` (STORY-82) now carries
`fields.capability_uid = capability-ae9d65d6`. The workflow routed STORY-82 here
anyway because the branch worktree's ticket index still resolves to the canonical
main store, which holds the pre-merge `capability_uid` — the same
`stale_index_on_branch` defect REPORT-1266 flagged as the blocker that prevented
deprecating the absorbed capabilities. That defect lives in the xgd system repo,
not this project.

STORY-82 and its ACs were assessed in full regardless, since they are the only
elements routed into this scope. The verdicts below are element-level and apply
equally under CAP-70.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-58 | free_and_reconciled | 2026-07-13 | gigabytealchemy pass-3 reproduction; forced the module-level treatments (`cardVeil`/`cardBorder`, `fieldLabels=placeholder`, `submitInline`, `submitColor`, footer copyright/`textColor`/`linkColor`) — origin of AC-674..681 | YES |
| REQ-59, REQ-61, REQ-62, REQ-63 | free_and_reconciled | 2026-07-13..17 | capture/diff fidelity + coverage audit — peripheral to this capability | YES (peripheral) |
| REQ-79 | free_and_reconciled | 2026-07-19 | Framework pivot: L1 layout substrate + capability modules (safety envelope) | YES |
| REQ-82 | free_and_reconciled | 2026-07-20 | Pivot B1: L1 substrate + safety envelope (schema, renderer) | YES |
| REQ-83 | free_and_reconciled | 2026-07-20 | Pivot B2: capture-to-L1 fold | YES |
| REQ-84 | free_and_reconciled | 2026-07-20 | Pivot C: deleted `services-grid`/`footer` (+ header/hero/text-block/layer) and ~20 dials; card veil/border and footer colour departures re-homed onto L1 leaf axes | YES (**retires** AC-674, 675, 679, 680, 681) |
| REQ-85 | free_and_reconciled | 2026-07-20 | Pivot D: capability-module contract; `contact-form` reframed — `fieldLabels`/`submitInline`/`submitColor` removed, `intro`/`submit` L1 slots added, field `<label>`s fixed as a core a11y obligation | YES (**retires** AC-676, 677, 678) |
| REQ-86 | free_and_reconciled | 2026-07-20 | Pivot E: reproduce a site end-to-end in the new system (3-probe gate) | YES |

**Current cumulative intent**: the reproduction *treatments* remain in-intent, but
only through two surviving surfaces — (a) L1 leaf axes for the card veil/border and
footer copyright/text/link colour departures, and (b) contact-form capability config
plus named `intro`/`submit` L1 slots for the form. Placeholder field-labelling and
inline (single-row) submit were **deliberately retired**, not re-homed: REQ-85 made
a visible programmatic `<label>` a non-negotiable accessibility obligation of the
vetted core rather than a styling option.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-82 | REQ-58, REQ-79, REQ-84, REQ-85 | **stale** | Description section correctly records the supersession, but the story **title** and the user-story "so that" clause still promise "placeholder & inline contact form" — an affordance REQ-85 retired |

## AC Disposition Detail

**Live ACs (both pass).** Both are covered by `tests/reconciliation-reproduction-treatments.test.ts`, executed this session — **2 passed** (`npx vitest run`, 469ms):

- **AC-719** — `test_UAT_AC719_card_and_footer_treatments_authored_as_l1_leaf_axes`.
  Substantive: asserts against the live module `registry` and `getModule` (not source
  text) that no `services-grid`/`footer`/`header`/`hero`/`text-block`/`layer` survives
  and the survivors expose no dials; then authors a real L1 document, runs it through
  the real `validateL1` and `renderL1Document`, and asserts the emitted CSS/HTML carries
  the frosted alpha surface literal, no border declaration, the verbatim copyright line,
  and the two departing colour literals; then asserts the envelope rejects a non-hex
  colour and an unknown (freeform-CSS) key. Real entry points, no mocking.
- **AC-718** — `test_UAT_AC718_contact_form_presentation_via_config_and_l1_slots`.
  Substantive: asserts `contactFormMeta.config` is exactly `action`/`fields`/`successMessage`
  and `slots` is exactly `intro`/`submit`; then SSR-renders the real `ContactForm.astro`
  through a real `AstroContainer` twice — with an L1 subtree in the `submit` slot (asserting
  the namespaced fragment, its content, and its `#e11d48` surface literal reach the output)
  and with the slot absent (asserting a plain `Send` button and no authored colour) — and
  asserts the programmatic `<label for=...>` binding renders in **both** paths. Real render
  boundary, no internal mocking.

**Legacy ACs (AC-674..681) — already correctly retired, no action.** All eight describe
the deleted module dials and are **archived** (retrievable only with `--archived`, absent
from `.xgd/uat_index.json`). Archiving is a stronger disposition than `lifecycle:
deprecated`, and the story Description already records them as "archived as superseded,
not deleted". No `uat_coverage` verdict was written to them — they are out of the live
matrix, and REQ-84/REQ-85 support their retirement.

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | story | STORY-82 (`story-46e3b3c7`) | story-body-edit | Title ("Reproduction treatments: card veil/border, **placeholder & inline contact form**, and footer copyright/colour overrides") and the user-story clause ("**so that** I can faithfully render ... compact **placeholder-labelled or single-row** contact forms") both promise affordances REQ-85 retired. Verified in code: `packages/framework/src/modules/contact-form/index.astro` always emits a visible `<label>` per field and never a `placeholder` attribute, and its scoped CSS pins `.contact-form__form` and `.contact-form__field` to `flex-direction: column`, so no single-row layout is authorable; `meta.ts` `config` carries no `fieldLabels`/`submitInline`. The story's own Description section already states these dials "is gone" — the body contradicts itself | Retitle to name the surviving surfaces (e.g. "Reproduction treatments: card veil/border, contact-form slots, and footer copyright/colour overrides") and rewrite the "so that" clause to promise the L1-slot-authored submit look + intro framing instead of placeholder/inline forms. Do **not** add ACs or UATs for placeholder/inline — REQ-85 retired the behavior deliberately |
| 2 | warning | capability | CAP-69 (`capability-938f26ec`) | (xgd system defect — no project edit) | Capability is absorbed (`merged_into: capability-ae9d65d6`, ABSORBED banner) but still `status: active`, and the branch index still routes STORY-82 to it. Already diagnosed as `stale_index_on_branch` in REPORT-1266 | None in this project. Flip to `status: deprecated` once the index defect is fixed in the xgd system repo |
| 3 | warning | uat | AC-718, AC-719 | (index staleness — no project edit) | `.xgd/uat_index.json` records both tests as `status: "missing"` with `last_run: null`, yet both exist and pass. The index tracks test *names* correctly but has no run result attached | None required for coverage purposes — verdicts here are based on an actual test run, not the index. Note that the prompt's suggested lookup snippet uses `.upper()` while the index keys are lowercase (`ac718`), so the snippet silently returns `{}` for every AC |

## Notes for the Editor

**Only one edit is actually needed: fix STORY-82's title and user-story clause.** The
coverage substance is sound — both live ACs have real, passing, non-mocked UATs at real
entry points, and the eight superseded ACs were already archived cleanly.

The drift here is the classic post-pivot pattern: the Description section was updated
during the REQ-79 pivot reconciliation but the **title and the user-story preamble were
not**. Worth checking the sibling stories now under CAP-70 (STORY-80, STORY-81, STORY-83,
STORY-85) for the same title/preamble-vs-Description mismatch in one batch.

Also note the routing: this verdict was written to CAP-69, but STORY-82 now hangs off
**CAP-70 (`capability-ae9d65d6`)**. CAP-70's own aggregate should pick up the same
`stale` story verdict — the fix belongs there, and fixing it once resolves both.

**Do not** treat the placeholder/inline affordance as a coverage gap to close with new
UATs. REQ-85 retired it as an accessibility decision; the correct resolution is to stop
promising it in the story text.
