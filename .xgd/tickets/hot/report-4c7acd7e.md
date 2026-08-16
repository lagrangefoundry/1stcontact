---
uid: report-4c7acd7e
id: REPORT-2080
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=story)'
created_by: xgd
created_at: '2026-08-16T06:28:44.603497+00:00'
updated_at: '2026-08-16T06:28:44.603497+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: story
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

The capability holds exactly one story (STORY-100, `story_kind: upgrade`), so the
story-level surface is one body carrying the whole cumulative ask. Its `intent_uid`
is BUNDLE-16 and its `updated_by` is REQ-136; neither field records the eight other
intents that have grown this surface, so the ledger below was rebuilt from the
commit history of the surface's own definition site
(`packages/site-schema/src/l1/edit.ts`) plus each intent's body.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed *on this surface* | Counts? |
|---|---|---|---|---|
| REQ-44 | free_and_reconciled | 2026-07-03 | Tooling hygiene; bundled into BUNDLE-16 with REQ-117. No ask here | YES (silent) |
| REQ-115 | free_and_reconciled | 2026-07-31 | Builder shell/chrome (CAP-85). Bundled sibling; no ask here | YES (silent) |
| REQ-117 | free_and_reconciled | 2026-07-31 | **Created the surface**: strict address + one resolution rule, `copyFieldsOf`/`applyCopyFields`, `1c copy get|set`, one-map-one-diff, the *shared* validator over the whole definition, empty field list, module-slot scoping, no-raw-code | YES |
| REQ-118 | free_and_reconciled | 2026-07-31 | Image selection as the same surface: `src` + `alt`, closed list of the site's images, current handle always an option, membership refused at the field, nothing baked | YES |
| REQ-119 | free_and_reconciled | 2026-07-31 | Request-time draft/edit renders — moved this story's two origin-facing criteria from stored artifacts to the origin (the only intent whose body names `story-37a3921b`) | YES |
| REQ-121 | free_and_reconciled | 2026-08-07 | Modal chrome and the dressed editing box (CAP-84/85). No ask here | YES (silent) |
| REQ-126 | free_and_reconciled | 2026-08-08 | L1 control-surface API + error taxonomy — the neighbour whose refusal envelope this surface reuses | YES (silent) |
| REQ-128 | free_and_reconciled | 2026-08-08 | A painted panel's `backgroundImageUrl` through the same picker: selection only, no empty option, change-never-add | YES |
| REQ-129 | free_and_reconciled | 2026-08-09 | `1c l1 get/set` in the same module, explicitly "click-to-edit modal unchanged". No ask here | YES (silent) |
| REQ-132 | free_and_reconciled | 2026-08-12 | `format: 'image'` on both picker fields — a hint, never a constraint | YES |
| REQ-135 | free_and_reconciled | 2026-08-12 | Phase A typography: size (proportional track write), weight from declared faces ∪ current, italic locked on positive evidence of absence, capitalisation, "a bound binds a change, never the status quo". Phase B (colour) explicitly deferred | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Thirteen framing/shape/colour-adjustment controls, identity removes the axis, no empty bags, shape list ∪ current, nothing touches a file | YES |
| REQ-138 | free_and_reconciled | 2026-08-12 | Live parameter preview in the modal's editing box — client only; "nothing about the write path, the validator or the diff changes". No ask here | YES (silent) |
| REQ-133 | ready_to_reconcile | 2026-08-12 | Palette popup (pick mode) — the blocker this story names by number for colour | imminent |
| REQ-137 | bundled | 2026-08-12 | L1 palette `shade` on the reference; supersedes REQ-135 §3.1's named steps. No direct ask here | imminent (silent) |
| REQ-139 | ready_to_reconcile | 2026-08-12 | Generalises `locked` to a `{locked, reason}` pair, adds `GLYPH_GRADIENT_LOCK`, adds `lockError` to the refusal chain, prints the reason from `1c copy get` | imminent |
| REQ-140 | ready_to_reconcile | 2026-08-15 | Colour on this surface: a `'color'` descriptor type, `L1Color` values, `L1SegmentFieldOptions.palette`, palette-membership refusal in `applyCopyFields` | imminent |
| REQ-134 | abandoned | 2026-08-12 | An image-generation component | NO |

Both imminent intents that touch this surface (REQ-139, REQ-140) carry a
`working_sha` with `main_sha: null`, and the branch under check confirms it: the
descriptor type union is still `'string' | 'enum' | 'integer' | 'boolean'`
(`packages/site-schema/src/l1/edit.ts:179`), `format` is still `'image'` only
(`:202`), and no `reason` field exists. The story body therefore describes `main`
accurately today; it will be contradicted by both when they reconcile.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-100 | REQ-117, REQ-118, REQ-119, REQ-128, REQ-132, REQ-135, REQ-136 | aligned on scope and coverage — every reconciled ask above is expressed, and every deferral the story lists (colour, family, geometry, alignment, upload, zoom-crop, tint, panel framing, drag handles, stylising, per-run restyling, undo) is one an intent actually made. Two defects in *how* two rules are stated: findings 1 and 2 |
| STORY-100 | REQ-115, REQ-121, REQ-126, REQ-129, REQ-138, REQ-44 | aligned by absence — each is a neighbour capability's or a client-only change; correctly not claimed here (REQ-138 states it outright: "Nothing about the write path, the validator or the diff changes") |
| STORY-100 | REQ-133, REQ-137, REQ-139, REQ-140 (imminent) | aligned for `main`, with note — see findings 3 and 4; do NOT repair ahead of reconciliation |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-100 | story-body-edit | Under "Refusing legibly" the body says "**any value at all** for a field the region offered read-only" is refused at the field. The shipped and intended rule is the opposite for the echoed value: `applyCopyFields` refuses a locked field **on change, never on presence** — `packages/site-schema/src/l1/edit.ts:1159` (`field.locked && value !== derived.values[name]`), with the reasoning at `:1134-1142`. This is not an implementation slip the story could be describing over: REQ-135 §9.2 introduced the lock and REQ-139 restates the rule as load-bearing ("A lock refuses a CHANGE, never the status quo… Refusing it outright therefore refused the whole change map"). The modal posts every staged field, so under the body as written no save of a run whose family declares faces but no italic one could ever succeed — including one that only edited the words | Restate as: a value that *differs* from the one the region just reported for a read-only field is refused; a value that merely echoes it passes, on the same rule the body already states for bounds. The body's own "a bound binds a change and not the status quo" bullet is the model — extend its last sentence ("The rule holds of every bounded control alike") to cover a locked field |
| 2 | warning | consistency | STORY-100 | story-body-edit | Under "Leaving no trace when nothing changed" the body claims "**Every** parameter this surface writes has a value at which it says nothing, and setting a control back to it *removes* the parameter". Two do not: `fontSizePx` and `fontWeight` have no such value and are never deleted (`edit.ts:876-907` — size writes or no-ops, weight writes or no-ops on the seeded value; neither has a `delete` path, and the weight enum offers no empty option). No intent asks for one: REQ-136's "identity removes the axis" is scoped to framing, REQ-135's absent-is-default to italic and capitalisation. The body's own Technical Context bullet ("Why absent is the default…") correctly enumerates only italic, capitalisation, picture position and saturation | Narrow the claim to the parameters that have an identity — e.g. "Every parameter that has a value at which it says nothing is *removed* when set back to it" — and keep the second half (a no-op edit is reported as changing nothing and the draft is left byte-identical), which is true of all four typography fields |
| 3 | info | coverage | STORY-100 | — | REQ-140 (ready_to_reconcile, 2026-08-15) puts colour fields on exactly this surface — a `'color'` descriptor type, `L1Color` values, `L1SegmentFieldOptions.palette`, and palette-membership refusal in `applyCopyFields`. The story's out-of-scope bullet "**Choosing a colour** … neither the palette control nor the colour-valued field shape exists yet (REQ-133)" is accurate for `main` and will be false the moment REQ-140 reconciles | none now. On reconcile: retire that out-of-scope bullet, extend the field-vocabulary bullet (the story already predicts this — "the colour-from-the-palette control the next phase needs is the same move again"), and add ACs for REQ-140 AC-1/2/3/4 |
| 4 | info | coverage | STORY-100 | — | REQ-139 (ready_to_reconcile, 2026-08-12) generalises the lock this surface already carries: `{locked, reason}` as a pair, `GLYPH_GRADIENT_LOCK` on a `text` run carrying `gradientFill`, `lockError` joining the refusal chain, and the reason printed by `1c copy get`. Today the story's only lock is italic, which matches `main` (`edit.ts:432-438`, the sole `locked` emitter) | none now. On reconcile: the read-only paragraph becomes a family of locks with a reason, which is the same sentence finding 1 repairs — sequence finding 1 first so REQ-139's edit lands on a correct statement |
| 5 | info | consistency | STORY-100 | — | Two intent↔implementation divergences are **recorded rather than absorbed**, which is the correct treatment and worth preserving: REQ-117 AC-1's "clicking a segment with no editable fields opens nothing" versus the shipped dismissible message (owned by the gesture capability), and REQ-135 §4's "a run that declares no size seeds its control from the rendered value" versus the shipped withhold-the-control. REQ-135 §9.1 confirms the second has no observed instance (every measured run declares a size), and the story says so | none |
| 6 | info | — | STORY-100 | — | The body records a "Known cosmetic defect, deliberately not fixed" (a save rewrites the whole page document with different unicode escaping) as "recorded in the intent as wanting its own ticket". No such ticket exists — the 34 bug tickets contain nothing on escaping or the shared write helper | none at this level; file the ticket if the operator still wants it |

## Notes for the Editor

**Sequence.** Finding 1 is the only one that must be repaired for this level to
pass, and it is one sentence. Repair it before REQ-139 reconciles, or REQ-139's
own edit will be layered onto a statement that is already wrong.

**The AC layer inherits finding 1 verbatim.** AC-1120's title ("…and a value
posted for a read-only field is refused") and its criterion body ("A value posted
for a read-only field is **refused** — not applied, not silently dropped") carry
the identical over-claim. Its *Verification* section is unaffected: it posts
italic for a run whose derived value is `false`, so the posted value genuinely
differs and the refusal it asserts is real. The `ac`-level cycle should expect an
`ac-edit` on AC-1120 for the phrasing only, not a `uat-edit`.

**Pattern worth noticing.** Both defects are the same shape: a rule that is
correct for one axis stated as if it held for all of them. The body states the
status-quo exemption three separate times for bounds (in scope, in "Refusing
legibly", and in the "why a bound binds a change" bullet) and never for locks;
it states identity-removal for framing and typography's two toggles and then
generalises it to "every parameter". Where this surface's rules are per-field,
the story is most accurate when it names the fields — which it already does well
for the weight-list union, the shape-list union and the current-handle union.

**Not findings, checked and confirmed aligned:** the field set the derivation
emits matches the body exactly (`text`/`fontSizePx`/`fontWeight`/`italic`/
`textTransform`; `src`/`alt` first and in that order, then thirteen framing and
adjustment controls; `backgroundImageUrl` alone on a painted panel) — the body's
"thirteen more answers" is literally thirteen; `copyFieldsOf` returning `null`
surfaces as an empty field list and a success at the CLI boundary
(`tools/generate/src/cli/edit.ts:506-513`), matching "an empty list is a
legitimate answer"; `copy set` re-renders both channels and reports where each
was written; and no field the out-of-scope list retires (alignment, family,
geometry, colour, upload, crop, tint, stylisation, panel framing) is emitted by
the derivation.
