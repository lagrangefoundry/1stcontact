---
uid: report-a7d07211
id: REPORT-3763
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=story)'
created_by: xgd
created_at: '2026-09-10T17:06:14.606503+00:00'
updated_at: '2026-09-10T17:06:14.606503+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: story
  violations: 1
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 2
**Needs review**: 0

The capability holds exactly one story (STORY-100, `story_kind: upgrade`), so the
story-level surface is one body carrying the whole cumulative ask. Its `intent_uid`
is BUNDLE-16 and its `updated_by` is BUNDLE-19; neither field enumerates the
intents that grew this surface between them, so the ledger below was rebuilt from
the story's own `updated_by` history (`xgd ticket history story-37a3921b`), each
bundle's member list, and the commit history of the surface's definition site
(`packages/site-schema/src/l1/edit.ts`).

**What changed since the last story-level check (REPORT-2080, 2026-08-16, FAIL).**
The four intents that check recorded as *imminent* — REQ-133, REQ-137, REQ-139,
REQ-140 — are all now `free_and_reconciled` and landed in BUNDLE-19
(`main_sha b18b859d`, commits `25362247bf` and `5a0ffb0313`, 2026-08-20). The
story body was rewritten on 2026-08-20 to absorb them. REPORT-2080's finding 1
(the read-only refusal stated as binding presence rather than change) **is
repaired** — the body now reads "and a *change* to a field the region offered
unavailable". Its finding 2 is **not** repaired, and the colour phase has made it
worse: see finding 1 below.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed *on this surface* | Counts? |
|---|---|---|---|---|
| REQ-44 | free_and_reconciled | 2026-07-03 | Tooling hygiene; BUNDLE-16 sibling. No ask here | YES (silent) |
| REQ-115 | free_and_reconciled | 2026-07-31 | Builder shell/chrome (CAP-85). No ask here | YES (silent) |
| REQ-117 | free_and_reconciled | 2026-07-31 | **Created the surface**: strict address + one resolution rule, `copyFieldsOf`/`applyCopyFields`, `1c copy get|set`, one-map-one-diff, the *shared* validator over the whole definition, empty field list, module-slot scoping, no-raw-code, no undo | YES |
| REQ-118 | free_and_reconciled | 2026-07-31 | Image selection as the same surface: `src` + `alt` in that order, closed list of the site's images, current handle always an option, membership refused at the field, nothing baked | YES |
| REQ-119 | free_and_reconciled | 2026-07-31 | Request-time draft/edit renders — moved this story's two origin-facing criteria from stored artifacts to the origin | YES |
| REQ-121 | free_and_reconciled | 2026-08-07 | Modal chrome and the dressed editing box (CAP-84/85). No ask here | YES (silent) |
| REQ-122 / REQ-127 / REQ-130 | free_and_reconciled | 2026-08-08/09 | Control-surface / beyond-L1 authoring (CAP-92/93/94). No ask here | YES (silent) |
| REQ-126 | free_and_reconciled | 2026-08-08 | L1 control-surface API + error taxonomy — the neighbour whose refusal envelope this surface reuses | YES (silent) |
| REQ-128 | free_and_reconciled | 2026-08-08 | A painted panel's `backgroundImageUrl` through the same picker: selection only, no empty option, change-never-add | YES |
| REQ-129 | free_and_reconciled | 2026-08-09 | `1c l1 get/set` in the same module, "click-to-edit modal unchanged". No ask here | YES (silent) |
| REQ-132 | free_and_reconciled | 2026-08-12 | `format: 'image'` on both picker fields — a hint, never a constraint | YES |
| REQ-135 | free_and_reconciled | 2026-08-12 | Phase A typography: size (proportional track write), weight from declared faces ∪ current, italic locked on positive evidence of absence, capitalisation, "a bound binds a change, never the status quo", the escalation row's premise | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Thirteen framing/shape/colour-adjustment controls, **identity removes the axis** (scoped to framing), no empty bags, shape list ∪ current, nothing touches a file | YES |
| REQ-137 | free_and_reconciled | 2026-08-12 | L1 palette: entry = one colour, continuous `shade` on the reference, named steps deleted. Supersedes REQ-135 §3.1 | YES |
| REQ-138 | free_and_reconciled | 2026-08-12 | Live parameter preview in the editing box — client only; "nothing about the write path, the validator or the diff changes" | YES (silent) |
| REQ-133 | free_and_reconciled | 2026-08-12 | Palette popup, pick + manage (CAP-98). Supplies this surface's colour choices; builds no control here | YES (adjacent) |
| REQ-139 | free_and_reconciled | 2026-08-12 | Generalises `locked` to a `{locked, reason}` pair; `GLYPH_GRADIENT_LOCK`; `lockError` joins the refusal chain with the descriptor's own sentence; `1c copy get` prints the reason; a lock refuses a **change**, never the status quo; a scrim/translucent sibling is not occlusion | YES |
| REQ-140 | free_and_reconciled | 2026-08-15 | Colour on this surface: a `'color'` descriptor type, `L1Color` values, `L1SegmentFieldOptions.palette` riding the read call, palette-membership + `shade` bounds refused in `applyCopyFields`, hex refused, empty palette is a legitimate state, the read-only "panel behind this text" row | YES |
| BUG-35 | free_and_reconciled | 2026-08-18 | `builder.css` UA-reset fix so capitalisation/letter-spacing preview (CAP-84/85 client). No ask here | YES (silent) |
| REQ-131 | free_and_reconciled | 2026-08-18 | Draft change journal (CAP-99). Instruments this surface's chokepoint; owns its own capability | YES (adjacent) |
| REQ-141 / REQ-144 / REQ-123 | free_and_reconciled | 2026-08-18 | Workers test project, build/deploy scripts, system KB (CAP-102/100). No ask here | YES (silent) |
| REQ-142 | free_and_reconciled | 2026-08-18 | Async `SiteStore` port behind every edit (CAP-101). Explicitly **no behaviour change**; AC-3 preserves `1c copy set`'s envelope verbatim | YES (adjacent) |
| REQ-134 | abandoned | 2026-08-12 | An image-generation component | NO |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-100 | REQ-117, REQ-118, REQ-119, REQ-128, REQ-132, REQ-135, REQ-136 | aligned — verified again against `edit.ts` at this branch tip: field order (`text` → colour → typography; `src` → `alt` → framing), size withheld where the run declares none (`edit.ts:513-523`), weight withdrawn below two options (`edit.ts:556-565`), the framing set is literally thirteen (`edit.ts:795-800, 833-851` + `borderRadiusPx`), `scaleTrack` moves the ladder in the same write (`edit.ts:1297-1298`) |
| STORY-100 | REQ-137, REQ-139, REQ-140, REQ-133 | **newly reconciled since REPORT-2080, and expressed.** The colour section, the faithfulness rule with its three causes, the `{locked, reason}` pairing, the palette riding the read call (`tools/generate/src/cli/edit.ts:652`), the "panel behind this text" read-only answer (`tools/generate/src/cli/edit.ts:610-626, 656`), canonical pruning of `shade`/`alpha` (`edit.ts:1259-1264`) and the hex-refusal-plus-status-quo reconciliation are all present and match the code. Two defects in *how* two rules are stated: findings 1 and 2 |
| STORY-100 | REQ-115, REQ-121, REQ-122, REQ-126, REQ-127, REQ-129, REQ-130, REQ-138, REQ-144, REQ-141, REQ-123, REQ-44, BUG-35 | aligned by absence — each is a neighbour capability's or a client-only change; correctly not claimed here |
| STORY-100 | REQ-131 (CAP-99), REQ-142 (CAP-101), REQ-133 (CAP-98) | aligned by delegation — each has its own capability; the story's Dependencies and Out-of-scope sections name the palette and the asset store, and REQ-142 is a stated no-behaviour-change port |
| STORY-100 | REQ-134 | aligned — retired intent, nothing in the body references it |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-100 | story-body-edit | In-scope bullet "Leaving no trace when nothing changed" claims "**Every** parameter this surface writes has a value at which it says nothing, and setting a control back to it *removes* the parameter rather than recording it". Four do not. `fontSizePx` and `fontWeight` have no identity and no delete path — `writeTypography` writes or no-ops (`packages/site-schema/src/l1/edit.ts:1289-1300` and `:1301-1320`), while only `fontStyle` (`:1328`) and `textTransform` (`:1335`) delete. `color` and `surfaceFill` are the same: `writeColor` always assigns into the axes bag (`edit.ts:1251-1265`), prunes only `shade`/`alpha` *inside* the reference, and the colour field offers no empty option. **This now contradicts the story's own Out-of-scope list**, which says of the panel fill "it can be set and changed here, and **clearing it back to nothing is the AI's business**" — the same is stated for a panel's background image. No intent asks for the universal: REQ-136 scopes "identity removes the axis" to framing, REQ-135 scopes absent-is-default to italic and capitalisation, and REQ-140 asks only for the *reference* to be written canonically. REPORT-2080 raised this as a warning against size/weight alone; REQ-140 added two more instances and the self-contradiction, which is why it is a violation now | Make the claim conditional, mirroring the phrasing the body already uses correctly two bullets earlier under "Writing a parameter as the rule it is" ("A parameter set back to the value it has when nothing is declared is *removed* rather than written in at its default"). E.g.: "Every parameter that *has* a value at which it says nothing is removed when a control is set back to it, rather than recorded — and if that empties the group the parameter lived in, the group goes too…". Keep the rest of the bullet (the group-pruning, the canonical colour reference, and "an edit that changes nothing is reported as changing nothing and leaves the stored draft byte-for-byte as it found it"), all of which are true of every field |
| 2 | warning | consistency | STORY-100 | story-body-edit | In-scope bullet "Refusing a change and never the status quo" says "**Every one of those field refusals** measures the value against what the region *just reported*". Of the five refusals the preceding bullet lists, three do (`rangeError` `edit.ts:1099`, `colorError` `edit.ts:1167-1173`, `lockError` `edit.ts:1130-1138` — each takes `current`); the two membership/shape refusals do not: `typeError(field, value)` takes no current value at all (`edit.ts:1064`), and an unknown field name is refused before any comparison (`edit.ts:1566`). The *outcome* the bullet claims still holds for them, but by a different mechanism the story states separately and correctly ("Why a region's current value is always among its own options — twice over" — the enum is a union with the held value). REQ-139's own wording is narrower: "the same rule `rangeError` and `colorError` already state" | Name the three, or say "every refusal that measures a value against a range, a palette entry or an unavailability", and let the union rule carry the closed-list case as it already does elsewhere in the body |
| 3 | info | consistency | STORY-100 | — | REPORT-2080's finding 1 is confirmed repaired: "Refusing legibly" now reads "…and a *change* to a field the region offered unavailable, are each refused at the field", which matches `lockError`'s change-not-presence rule (`edit.ts:1135-1138`) and REQ-139's stated design decision | none |
| 4 | info | coverage | STORY-100 | — | REPORT-2080's findings 3 and 4 (deferred pending REQ-140 / REQ-139) are discharged. The out-of-scope bullet naming REQ-133 as the blocker for colour is gone from the body, the field-vocabulary bullet now reads "grown three times", and the lock paragraph is a family with reasons rather than the single italic case | none |
| 5 | info | consistency | STORY-100 | — | Two intent↔implementation divergences remain **recorded rather than absorbed**, which is the correct treatment: REQ-117 AC-1's "clicking a segment with no editable fields opens nothing" versus the shipped dismissible message (owned by CAP-87/CAP-84), and REQ-135 §4's "a run declaring no size seeds its control from the rendered value" versus the shipped withhold-the-control (`edit.ts:513-515`). The body states both and says the second has no observed instance | none |
| 6 | info | — | STORY-100 | — | The body still records a "Known cosmetic defect, deliberately not fixed" (a save rewrites the whole page document with different unicode escaping) as "recorded in the intent as wanting its own ticket". No such ticket exists yet — a search across the ticket store turns up nothing on escaping or the shared write helper. Unchanged since REPORT-2080 | none at this level; file the ticket if the operator still wants it |

## Notes for the Editor

**Scope of the repair.** Finding 1 is one sentence in one bullet and is the only
thing standing between this level and a pass. Do not widen it — the rest of that
bullet, and the "Writing a parameter as the rule it is" bullet it should borrow
its shape from, are both correct and verified against the code.

**The AC layer is not implicated by finding 1.** No AC under STORY-100 restates
the universal. AC-1122 ("A parameter edit writes into the parameters the region
already carries and disturbs no other") and AC-1132 (a picture carrying no
framing parameters answers with browser defaults) are both correctly scoped, and
AC-1129's typed-pair removal is a framing claim. Expect a `story-body-edit` only.

**Pattern, restated because it recurred.** REPORT-2080 named it: a rule that is
correct for one axis stated as if it held for all of them. Both findings here are
that shape again, and both arrived with the colour phase widening a set the
sentence was written over. Where this surface's rules are per-field, the body is
most accurate when it names the fields — which it already does well for the
weight-list union, the shape-list union, the current-handle union and the
absent-is-default enumeration in Technical Context.

**One ordering asymmetry worth knowing at the `ac` level, not a finding here.**
The body is explicit about field order for a run ("its words **first**") and for
an image ("in that order, because a client that opens straight into the picker
depends on which field comes first"), and deliberately non-committal for a
painted panel ("what colour it is filled with … and, **when it carries one**,
which image sits behind it"). The derivation emits the panel's fields in the
opposite order to that sentence's enumeration — `backgroundImageUrl` first, then
`surfaceFill` (`edit.ts:1022-1046`). Since the body makes no ordering claim there,
this is not drift; it is only worth checking that no AC or UAT asserts an order
the surface does not promise.

**Checked and confirmed aligned, not findings:** the emitted field set matches the
body exactly (`text`/`color`/`fontSizePx`/`fontWeight`/`italic`/`textTransform`;
`src`/`alt` then thirteen framing and adjustment controls; `backgroundImageUrl`
when present plus `surfaceFill` always, on a painted `box`/`container` only); an
absent colour axis reports no value rather than the inherited one
(`edit.ts:637-643`); the colour field is derived whether or not the site has a
palette (`edit.ts:332-342`); `panelBehind` walks inward-out and stops at the first
painted ancestor using the renderer's own `l1PaintsSurface`
(`tools/generate/src/cli/edit.ts:610-626`); the palette travels back with the
descriptors in one response (`tools/generate/src/cli/edit.ts:652`); a locked field
is listed with its reason at the CLI (`tools/generate/src/cli/edit.ts:666`);
the field refusals all run before the shared validator (`edit.ts:1569-1574`); and
no field the out-of-scope list retires (alignment, family, geometry, upload, crop,
tint, stylisation, panel framing, free hex, pattern/overlay/gradient) is emitted
by the derivation.
