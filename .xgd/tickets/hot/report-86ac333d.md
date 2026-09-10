---
uid: report-86ac333d
id: REPORT-3765
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=story)'
created_by: xgd
created_at: '2026-09-10T17:19:03.506732+00:00'
updated_at: '2026-09-10T17:19:03.506732+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: story
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

The capability holds exactly one story (STORY-100 / `story-37a3921b`,
`story_kind: upgrade`), so the story-level surface is one body carrying the whole
cumulative ask. `intent_uid` is BUNDLE-16, `updated_by` is BUNDLE-19.

**What changed since REPORT-3763 (attempt 4's check, 2026-09-10 17:06, FAIL).**
That check raised one violation and one warning, both instances of the same
shape — a rule true of one axis stated as if it held for all of them. The fix
call (REPORT-3764) mutated the story body three times, and this check confirms
all three landed and are accurate against the code:

1. **Finding 1 (violation) — repaired.** "Leaving no trace when nothing changed"
   no longer claims the universal. It now enumerates the parameters that *do*
   have an identity ("each framing and shape axis at its identity, italic when it
   is off, capitalisation when it is none") and states the exclusion explicitly
   ("a size, a weight and a colour have no setting that means 'nothing
   declared'"). Verified independently against `packages/site-schema/src/l1/edit.ts`:
   the only `delete` sites in the write path are `axes.fontStyle` (`:1328`),
   `axes.textTransform` (`:1335`), `axes.objectFit` (`:1460`),
   `axes.objectPosition` (`:1479`), `target.mask` (`:1488`), `axes.borderRadiusPx`
   (`:1500`) and the `setNested` identity path used by `rotateDeg`/`scalePct`
   (`:1509`) and every filter control (`:1519-1524`) — plus the container prunes
   at `:1377` and `:1433`. `fontSizePx` (`:1289-1299`) and `fontWeight`
   (`:1301-1319`) write or no-op with no delete branch; `writeColor` (`:1251-1265`)
   always assigns into the axes bag and prunes only `shade`/`alpha` *inside* the
   reference. The corrected sentence is exactly true.
2. **Finding 2 (warning) — repaired.** "Refusing a change and never the status
   quo" now names the three refusals that take a `current`
   (`applyCopyFields` at `edit.ts:1569-1573` passes `derived.values[name]` to
   `lockError`, `rangeError` and `colorError`) and routes the other two to the
   mechanism the body states separately — `typeError(field, value)` (`:1064`,
   `:1571`) takes no current value, and an unknown field name is refused at
   `:1566-1568` before any comparison.
3. **Third mutation, self-initiated by the fixer** — Technical Context's "Every
   one of these controls has a value at which it says nothing" scoped to "Every
   one of these **framing and adjustment** controls". Verified: the enumeration
   that follows (fill mode, position, turn, blur, scale, saturation, and a colour
   reference's shade/opacity) is the framing family plus the colour reference's
   internal identities, and is now consistent with the corrected in-scope bullet.

## Cumulative Intent Considered

Chronological. Statuses re-read at this check. The tail (REQ-143 onward) extends
REPORT-3763's ledger, which stopped at REQ-142 — those intents landed after the
story body's last substantive rewrite and were checked here for the first time.

| Intent ID | Status | When | Asked / changed *on this surface* | Counts? |
|---|---|---|---|---|
| REQ-44 | free_and_reconciled | 2026-07-03 | Tooling hygiene; BUNDLE-16 sibling. No ask here | YES (silent) |
| REQ-115 | free_and_reconciled | 2026-07-31 | Builder shell/chrome (CAP-85). No ask here | YES (silent) |
| REQ-117 | free_and_reconciled | 2026-07-31 | **Created the surface**: strict address + one resolution rule, `copyFieldsOf`/`applyCopyFields`, `1c copy get\|set`, one-map-one-diff, the shared validator over the whole definition, empty field list, module-slot scoping, no-raw-code, no undo. Also records the unicode-escaping diff as "worth its own ticket" | YES |
| REQ-118 | free_and_reconciled | 2026-07-31 | Image selection as the same surface: `src` + `alt` in that order, closed list, current handle always an option, membership refused at the field, nothing baked | YES |
| REQ-119 | free_and_reconciled | 2026-07-31 | Request-time draft/edit renders — moved the two origin-facing criteria from stored artifacts to the origin | YES |
| REQ-121 | free_and_reconciled | 2026-08-07 | Modal chrome and the dressed editing box (CAP-87/85). No ask here | YES (silent) |
| REQ-122 / REQ-127 / REQ-130 | free_and_reconciled | 2026-08-08/09 | Control-surface / beyond-L1 authoring (CAP-92/93/94). No ask here | YES (silent) |
| REQ-126 | free_and_reconciled | 2026-08-08 | L1 control-surface API + error taxonomy — the neighbour whose refusal envelope this surface reuses | YES (silent) |
| REQ-128 | free_and_reconciled | 2026-08-08 | A painted panel's `backgroundImageUrl` through the same picker: selection only, no empty option, change-never-add | YES |
| REQ-129 | free_and_reconciled | 2026-08-09 | `1c l1 get/set` in the same module, "click-to-edit modal unchanged". No ask here | YES (silent) |
| REQ-131 | free_and_reconciled | 2026-08-11 | Draft change journal (CAP-99). Instruments this surface's chokepoint (`editCopySet`'s `note(...)`, `tools/generate/src/cli/edit.ts:735-744`); owns its own capability | YES (adjacent) |
| REQ-132 | free_and_reconciled | 2026-08-12 | `format: 'image'` on both picker fields — a hint, never a constraint (`edit.ts:996`, `:1032`) | YES |
| REQ-133 | free_and_reconciled | 2026-08-12 | Palette popup, pick + manage (CAP-98). Supplies this surface's colour choices; builds no control here | YES (adjacent) |
| REQ-134 | abandoned | 2026-08-12 | An image-generation component | NO |
| REQ-135 | free_and_reconciled | 2026-08-12 | Phase A typography: size (proportional track write), weight from declared faces ∪ current, italic locked on positive evidence of absence, capitalisation, "a bound binds a change, never the status quo", the escalation row's premise. **Decides alignment out of V1** | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Thirteen framing/shape/colour-adjustment controls, identity removes the axis (scoped to framing), no empty bags, shape list ∪ current, nothing touches a file | YES |
| REQ-137 | free_and_reconciled | 2026-08-12 | L1 palette: entry = one colour, continuous `shade` on the reference, named steps deleted | YES |
| REQ-138 | free_and_reconciled | 2026-08-12 | Live parameter preview in the editing box — client only; "nothing about the write path, the validator or the diff changes" | YES (silent) |
| REQ-139 | free_and_reconciled | 2026-08-12 | `{locked, reason}` as a pair; `GLYPH_GRADIENT_LOCK`; `lockError` joins the refusal chain with the descriptor's own sentence; `1c copy get` prints the reason; a lock refuses a change, never the status quo | YES |
| REQ-140 | free_and_reconciled | 2026-08-15 | Colour on this surface: a `'color'` descriptor type, `L1Color` values, `L1SegmentFieldOptions.palette` riding the read call, palette-membership + `shade` bounds refused in `applyCopyFields`, hex refused, empty palette legitimate, the read-only "panel behind this text" row | YES |
| REQ-141 / REQ-144 / REQ-123 | free_and_reconciled | 2026-08-15 | Workers test project, build/deploy scripts, system KB (CAP-102/100). No ask here | YES (silent) |
| REQ-142 | free_and_reconciled | 2026-08-15 | Async `SiteStore` port behind every edit (CAP-101). Explicitly no behaviour change; preserves `1c copy set`'s envelope verbatim | YES (adjacent) |
| REQ-143 | free_and_reconciled | 2026-08-15 | The Cloudflare SiteStore (D1 + R2) behind the same port. No ask here | YES (silent) |
| REQ-145 | free_and_reconciled | 2026-08-15 | control-app becomes the origin and renders both channels in workerd. **AC-2 bears on this surface**: "editing copy and palette through the Worker produces the same store state as the CLI does" — expressed, and verified below | YES |
| REQ-146 / REQ-147 / REQ-148 / REQ-150 | free_and_reconciled | 2026-08-15/18 | AI host in workerd, Access gate, precompiled modules, Vite SSR boot. No ask here | YES (silent) |
| REQ-149 | free_and_reconciled | 2026-08-17 | Publish/revisions in the cloud. Its only touch on `tools/generate/src/cli/edit.ts` is `editStatus`'s `pendingChanges` import (commit `30abfebebd`) — the draft journal's surface, not this one | YES (silent) |
| REQ-151 / REQ-152 / REQ-153 | free_and_reconciled | 2026-08-20 | Locale identity, money/time representation, reserved locale-shaped slugs. Swept for `copy get\|set`, `copyFields`, `segment`, `editable`, `modal`: no hit bearing on this surface (REQ-153's "segment" is a URL path segment) | YES (silent) |
| REQ-162 | free_and_reconciled | 2026-08-31 | Product ticket store in D1. No ask here | YES (silent) |
| REQ-154 | bundled | 2026-08-20 | Browser Rendering driver. No ask here | imminent (silent) |
| REQ-155–161, 163–166 | draft | 2026-08-20/31 | Capture in workerd, image layer, fidelity surface, KB/library work | NO (not yet active) |
| BUG-34 | free_and_reconciled | 2026-08-12 | Gradient-filled text previews as invisible (client). Its *finding* became REQ-139's inert case, which is expressed | YES (silent) |
| BUG-35 | free_and_reconciled | 2026-08-13 | `builder.css` UA-reset fix so capitalisation previews (CAP-84/85 client). No ask here | YES (silent) |
| BUG-36 / BUG-37 / BUG-38 | free_and_reconciled | 2026-08-23/24 | control-app deploy 503, edit-mode 1102, chat conversation. No ask on this surface | YES (silent) |

**Definition-site stability.** `packages/site-schema/src/l1/edit.ts` — the surface's
definition site — has had no commit since `9faf0ec189` (2026-08-16). The two later
touches to `tools/generate/src/cli/edit.ts` are an import move (`d49a41c6b9`,
REQ-145) and `editStatus`'s `pendingChanges` (`30abfebebd`, REQ-149). So the
cumulative intent this body must express has not moved since the body was
rewritten, and no post-REQ-142 intent introduced an unexpressed behaviour here.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-100 | REQ-117, REQ-118, REQ-119, REQ-128, REQ-132 | aligned — re-verified at this tip: field order `text` → colour → typography (`edit.ts:979-984`) and `src` → `alt` → framing (`edit.ts:991-1003`); `format: 'image'` on both picker fields and on neither alt (`:996`, `:1032`); `required: true` on the background picker with the no-empty-option rationale stated in code (`:1034-1041`); the empty field list is a *success* (`tools/generate/src/cli/edit.ts:646-647`, and the CLI's `(no editable copy on this <kind> segment)` human line at `:669`) |
| STORY-100 | REQ-135, REQ-136, REQ-137, REQ-139, REQ-140, REQ-133 | aligned — the corrected identity claim, the corrected refusal claim and the scoped Technical Context bullet all match the code (see the three verifications above); the palette rides the read call (`tools/generate/src/cli/edit.ts:652`); `panelBehind` walks inward-out through the renderer's own `l1PaintsSurface` and is emitted only for a text node (`:610-626`, `:656`); a locked field prints with its reason (`:666`); the descriptor type union is exactly the five the body claims — `'string' \| 'enum' \| 'integer' \| 'boolean' \| 'color'` (`edit.ts:187`) |
| STORY-100 | REQ-145 (new to this ledger) | aligned — REQ-145 AC-2's "same store state through the Worker as through the CLI" is what the body's "the builder workspace exposes this same surface over its origin as a thin transport — the same operations, not a parallel implementation" claims, and `apps/control-app/src/router.ts:516-572` is literally that: `/api/copy` GET/POST call `editCopyGet`/`editCopySet` and do no work of their own. The body's asymmetry claim also holds — the CLI re-renders both channels and reports each path (`tools/generate/src/cli/index.ts:1336-1354`), while the origin writes and replies with no re-render (`router.ts:559-571`) |
| STORY-100 | REQ-115, REQ-121, REQ-122, REQ-126, REQ-127, REQ-129, REQ-130, REQ-138, REQ-141, REQ-144, REQ-123, REQ-146, REQ-147, REQ-148, REQ-149, REQ-150, REQ-151, REQ-152, REQ-153, REQ-162, REQ-44, BUG-34, BUG-35, BUG-36, BUG-37, BUG-38 | aligned by absence — each is a neighbour capability's, a platform-infrastructure or a client-only change; correctly not claimed here |
| STORY-100 | REQ-131 (CAP-99), REQ-142 (CAP-101), REQ-143, REQ-133 (CAP-98) | aligned by delegation — each has its own capability; the Dependencies section names the asset store, the palette and the renderer's paint test as the three things this surface reads rather than owns |
| STORY-100 | REQ-134 | aligned — retired intent, nothing in the body references it |
| STORY-100 | — | two warnings, both cross-reference accuracy rather than behavioural drift: findings 1 and 2 below |

Exclusivity is trivially satisfied at this level: the capability holds one story,
so no two elements can cover overlapping intent.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-100 | story-body-edit | Technical Context, "Relationship to neighbouring capabilities": "the edit render channel (**CAP-84** / STORY-98)". CAP-84 (`capability-25f7e486`) has `status: superseded` and `fields.superseded_by_uid: capability-12fee326` — it was consolidated into **CAP-87** "In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture" on 2026-08-07, and STORY-98 (`story-af36c2cb`) now carries `capability_uid: capability-12fee326`. The *behaviour* the sentence describes is unchanged and correct — the edit render channel still writes the addresses this surface resolves — so only the label is stale. It has been stale since before the body's 2026-08-20 rewrite and survived four checks | Replace `CAP-84 / STORY-98` with `CAP-87 / STORY-98`. Note that the same sentence's second citation, `CAP-85 / STORY-99`, is correct and verified (`story-e674c60a` carries `capability_uid: capability-a994b8f3` = CAP-85) |
| 2 | warning | consistency | STORY-100 | story-body-edit | Out-of-scope, "**Text alignment.** *Nothing implements it*, and it is inert on the glyph-tight box a folded run renders into". Read as a claim about the substrate this is false: `textAlign` is a declared L1 axis (`packages/site-schema/src/l1/schema.ts:958`, a closed enum of left/center/right/justify) and the renderer emits it (`packages/framework/src/l1/render.ts:2022`). The body is quoting REQ-135 §6 verbatim ("alignment — nothing is implemented today, and `textAlign` is inert on a glyph-tight folded run"), where in context it means *no control* is implemented; the operative reason — inertness on a glyph-tight run — is accurate and is what actually decides the exclusion. Not a violation: the story faithfully reflects its intent and the exclusion itself is correct | Narrow the first clause to what is true and to what the intent means: "No control offers it, and the axis is inert on the glyph-tight box a folded run renders into…". Leave the rest of the bullet alone |
| 3 | info | consistency | STORY-100 | — | REPORT-3763's finding 1 (violation) is confirmed repaired and independently verified against every `delete` site in `edit.ts`'s write path. The corrected sentence's positive half (framing/shape identities, italic, capitalisation) and its negative half (size, weight, colour have no clear path) are both exactly true, and the sentence no longer contradicts the Out-of-scope bullet "clearing it back to nothing is the AI's business" | none |
| 4 | info | consistency | STORY-100 | — | REPORT-3763's finding 2 (warning) is confirmed repaired. The three-versus-two split is verified at `edit.ts:1569-1573` (`lockError`/`rangeError`/`colorError` each receive `derived.values[name]`) against `:1571` (`typeError(field, value)`) and `:1566-1568` (unknown field, refused before any comparison) | none |
| 5 | info | coverage | STORY-100 | — | The unicode-escaping "known cosmetic defect" the body records is confirmed accurate as written: REQ-117's body, under "Known, not fixed here", says a copy edit "rewrites the whole page JSON with different unicode escaping … Pre-existing in `writeJson`, cosmetic, and worth its own ticket". The body claims the intent *wants* a ticket, not that one exists, so the absence of such a ticket does not make the body wrong. REPORT-3764 forwarded this to the operator as a decision; it is not a needs_review at this level | none at this level; file the ticket if the operator still wants it |
| 6 | info | consistency | STORY-100 | — | Two intent↔implementation divergences remain recorded rather than absorbed, which stays the correct treatment: REQ-117 AC-1's "clicking a segment with no editable fields opens nothing" versus the shipped dismissible message (owned by CAP-87), and REQ-135 §4's "a run declaring no size seeds its control from the rendered value" versus the shipped withhold-the-control (`edit.ts:513-523`). The body states both and says the second has no observed instance | none |
| 7 | info | coverage | STORY-100 | — | Coverage sweep for unexpressed intent found none. `packages/site-schema/src/l1/edit.ts` has no commit after 2026-08-16; the six post-REQ-142 reconciled intents were each swept for this surface's vocabulary and none asks anything of it; and every surface-related test file in `tests/` names an intent already in the ledger (REQ-117/118/121/128/132/135/136/139/140), so no intent is exercising this surface from outside the ledger | none |

## Notes for the Editor

**Nothing blocks this level.** Both findings are warnings and both are
cross-reference accuracy inside single sentences — a superseded capability ID and
a clause the body inherited verbatim from REQ-135. Neither changes a behavioural
claim, and neither has an AC or a UAT downstream of it. If the fix loop runs
again, these are two one-line edits; if it does not, the level still passes.

**The pattern REPORT-2080 and REPORT-3763 both named has stopped recurring.** Both
prior findings were "a rule true of one axis stated as if it held for all of
them", and both are now repaired in the direction those reports recommended —
by *naming the fields*. The body's remaining universals were re-checked against
the code at this tip and each is genuinely universal: the five descriptor types
(`edit.ts:187`), the whole-or-nothing two-pass apply (`:1564-1577`), every field
refusal running before the shared validator (`:1569-1574`, with
`validateOrThrow` at `tools/generate/src/cli/edit.ts:717`), and "every framing
control reports whole numbers" (`edit.ts:833-856` — every numeric framing
descriptor is `type: 'integer'`). Note that finding 2's warning is the *other*
direction of the same pattern: a claim narrower than the truth rather than wider.

**Panel field ordering, still not a finding.** The derivation emits
`backgroundImageUrl` before `surfaceFill` (`edit.ts:1027-1045`), which is the
opposite of the order the body's prose enumerates them in — but the body makes an
explicit ordering promise only for a run ("its words **first**") and for an image
("in that order"), and is deliberately non-committal for a panel ("and, **when it
carries one**…"). REPORT-3764 checked the ACs and UATs for an order claim the
surface does not promise and found none; that check was re-read here and its
citations are sound.

**For the `ac` level.** Forty-three ACs hang off this story, ten of them from the
colour phase (AC-1269…AC-1278). Nothing at this level implicates any of them: the
two warnings here live in Technical Context and Out-of-scope prose that no AC
restates. Separately and out of scope here, the capability reads
`uat_coverage: fail` while the ten colour-phase ACs carry no `uat_coverage` value
at all — that field belongs to check/fix_uat_coverage, not to this check.
