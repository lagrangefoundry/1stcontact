---
uid: report-b8303f2c
id: REPORT-3777
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=ac)'
created_by: xgd
created_at: '2026-09-10T18:40:51.766636+00:00'
updated_at: '2026-09-10T18:40:51.766636+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

The capability holds one story — STORY-100 (`story-37a3921b`, `story_kind: upgrade`,
`intent_uid: bundle-15c1f647`, `updated_by: bundle-77b28def`) — carrying 43 active ACs,
every one `kind: behavior`, none `regression_only`. Per the level cascade STORY-100's body
(53,352 chars, last edited 17:33) is the working reference; its story-level check passed at
17:19 (REPORT-3765). Intent was consulted only for the ledger and for the two claims below
that the story body does not itself enumerate.

**Method this cycle.** All 43 AC bodies were re-read in full from the live tickets (dumped
via `ticket get --json`, not taken from any prior report). Coverage was walked
bullet-by-bullet against STORY-100's twelve **In scope** headings and then again against its
**Technical Context** and **Out of scope** sections. The two claims attempts 7 and 8 added
were verified against the implementation rather than against the fix reports:

- **AC-1117's weight seed** ("seeded from the lowest declared face"). Confirmed at
  `packages/site-schema/src/l1/edit.ts:564` — `values.fontWeight = String(axes.fontWeight ??
  weights[0])` — with `weightChoices` (`:498-503`) returning the union sorted ascending, so
  `weights[0]` *is* the lowest declared face. The AC's further claim that echoing the seed
  back is not a change is confirmed at `:1317` (`if (axes.fontWeight === undefined &&
  String(next) === String(current)) return false`), whose own comment states the rule in the
  same terms the AC does.
- **AC-1130's identity/unit partition.** Confirmed against `FILTER_CONTROLS`
  (`:794-800`): `brightnessPct` / `contrastPct` / `saturatePct` are `identity: 100,
  scale: 100`; `grayscalePct` is `identity: 0, scale: 100`; `hueRotateDeg` and `blurPx` are
  `identity: 0, scale: 1`. Both the Criterion's partitions and the Verification's
  enumeration ("a hundred for brightness, contrast and saturation, zero for black-and-white,
  the hue shift and the blur") now match the code exactly, and the projection claim (four
  percentage controls carry a name and a number distinct from their axis; the hue shift and
  the blur do not) is exactly what `scale: 100` vs `scale: 1` and the `name`/`axis` pairs
  say. **Both attempt-7/8 repairs are confirmed applied and substantively correct.**

One structural claim was also checked because two ACs depend on it not being a field:
**AC-1278's "panel behind this run" answer is not a field.** Confirmed at
`tools/generate/src/cli/edit.ts:653-655` — `panel` is a sibling key of `fields`/`values` on
`editCopyGet`'s payload, derived by `panelBehind` (`:614-625`), not pushed into
`copyFieldsOf`'s descriptor list (`packages/site-schema/src/l1/edit.ts:975-985`). So
AC-1117's field-order assertion ("the words, then the colour, then size, weight, italic and
capitalisation") and AC-991's "every field offered is one of the five shapes" are not
contradicted by AC-1278, and the three are mutually consistent.

**Coverage is complete and exclusivity is clean.** Every one of STORY-100's twelve In-scope
bullets is expressed by at least one AC, and no bullet's behavioural surface is left
unaddressed. The general-criterion / specific-criterion pairs (AC-988 with AC-1121 /
AC-1271 / AC-1276; AC-1045 with AC-1049 / AC-1270) are a deliberate partition with explicit
hand-offs in the AC text, not duplication — see the notes below.

## Cumulative Intent Considered

STORY-100 carries two bundle UIDs; the ACs carry none of their own, so the ledger is the
union of the two bundles' source intents plus the earlier reconciled intents STORY-100's
body cites by ID.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUG-13 | free_and_reconciled | 2026-07-23 | Section/CSS background images as foldable nodes; panel background pinned to one fitting (the "framing a panel's background is out of scope" ground) | YES |
| BUG-22 | free_and_reconciled | 2026-07-24 | Split text+box control attribution — the "panel that actually paints behind this run" notion AC-1278 escalates to | YES |
| REQ-98 | (referenced by story body) | — | `surfaceFill` / `backgroundImageUrl` reachable on text and image nodes too — the ground for "offered on the panel, not on everything that can carry one" | YES |
| REQ-114 | (referenced by story body) | — | L1 palette colour model | YES |
| BUNDLE-16 (`bundle-15c1f647`) — REQ-117 + REQ-115 + REQ-44 | free_and_reconciled | merged @ `1741ee5` | REQ-117: copy editing end-to-end — click segment → fields modal → validated diff → re-render. **Originating intent for STORY-100.** | YES |
| REQ-128 | free_and_reconciled | 2026-08-08 | Background image selection on the container segment — selection only, no empty option | YES |
| REQ-129 | free_and_reconciled | 2026-08-09 | L1 authoring on the control surface (verbatim get_l1/set_l1); invariant 2 — no control on an unreachable node | YES |
| REQ-131 | free_and_reconciled | 2026-08-11 | Draft change journal | YES |
| REQ-133 | free_and_reconciled | 2026-08-12 | Palette popup — the surface a colour field opens into | YES |
| REQ-135 | free_and_reconciled | 2026-08-12 | Page editor: text properties — colour, size, weight, italic over the whole run | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Image editor: non-destructive framing and colour adjustment (the thirteen controls) | YES |
| REQ-137 | free_and_reconciled | 2026-08-12 | L1 palette: `shade` on the reference replaces named steps | YES |
| REQ-139 | free_and_reconciled | 2026-08-12 | Lock controls that cannot express what the element holds — the faithfulness rule (inert / lossy / unsupported) | YES |
| REQ-140 | free_and_reconciled | 2026-08-15 | Page editor: colour — text colour and panel fill from the palette (REQ-135 Phase B) | YES |
| REQ-142 | free_and_reconciled | 2026-08-15 | Async SiteStore port | YES |
| BUG-35 | free_and_reconciled | 2026-08-13 | Capitalisation never previews (UA reset blocks `text-transform`) | YES |
| BUNDLE-19 (`bundle-77b28def`) — REQ-133 + BUG-35 + REQ-131 + REQ-140 + REQ-139 + REQ-123 + REQ-141 + REQ-144 + REQ-142 | free_and_reconciled | merged @ `b18b859` | **`updated_by` for STORY-100.** Colour, the faithfulness rule and the palette popup are the phase this AC set most recently absorbed. | YES |

No intent in the ledger is `abandoned`, `deprecated` or `wont_fix`, and no AC body names a
ticket as a delivery vehicle for a behaviour — so **Step 2.5's stale-citation check has no
trigger this cycle**, and nothing here is escalable on ticket-graph evidence.

## Alignment Ledger

Grouped by the STORY-100 **In scope** bullet each AC answers to. Every AC below was read in
full this cycle.

| Element | Story bullet / intent it aligns to | Outcome |
|---|---|---|
| AC-987 (`33074e91`) | Naming a region — malformed refused outright, never coerced | aligned |
| AC-989 (`ec2bf84f`) | Naming a region — one resolution rule, module instance + slot scoping | aligned |
| AC-980 (`e817ae96`) | Asking what a region exposes — words **first**, multi-line ask | aligned |
| AC-990 (`f984033f`) | Asking what a region exposes — words come back whole | aligned |
| AC-1269 (`28031659`) | Asking what a region exposes — run's colour, reports literal / writes reference, offered with or without a palette | aligned (REQ-140) |
| AC-1117 (`0c85504b`) | Asking what a region exposes — size / weight / italic / capitalisation, faces from the document | aligned; weight-seed claim confirmed against `edit.ts:564` + `:1317` |
| AC-1119 (`74446275`) | Asking what a region exposes — weight list = declared faces ∪ own, matched on the first family of the stack | aligned (REQ-135) |
| AC-1024 (`8b6792de`) | Asking what a region exposes — image leads, then alt, then the thirteen framing controls | aligned; the thirteen enumerate exactly as the story body does |
| AC-1025 (`b9c7e872`) | Asking what a region exposes — current image always among its options | aligned |
| AC-1131 (`3648a0a0`) | Asking what a region exposes — shape list ∪ the shape already carried; a shape is written bare | aligned |
| AC-1132 (`f8ea23cf`) | Asking what a region exposes — a picture with no framing answers with browser-painted values | aligned (see info #3) |
| AC-1111 (`285dd8d6`) | Asking what a region exposes — the images declaration, by kind of field, hint never constraint | aligned |
| AC-1045 (`8a3c8c3e`) | Asking what a region exposes — panel form = fill + (when carried) background, nothing else of its paint | aligned; explicitly defers "which panels get a fill" to AC-1270 |
| AC-1049 (`6ee8863b`) | Asking what a region exposes — panel with no background exposes fill only; never added, never cleared | aligned |
| AC-1047 (`145e768e`) | Asking what a region exposes — panel's current background handle always among its options | aligned |
| AC-1270 (`c6af20ad`) | Asking what a region exposes — **every** painted panel exposes a fill; not on a run or image region | aligned on behaviour; **warning #1** on one rationale clause |
| AC-1278 (`4a753cde`) | Asking what a region exposes — the nearest painted panel behind a run, read-only | aligned; confirmed a sibling of the field list, not a field |
| AC-981 (`95afd919`) | Asking what a region exposes — a region exposing nothing answers with an empty list and succeeds | aligned |
| AC-1273 (`95697465`) | Offering a control only when it is faithful — unavailable **iff** a reason, on the field, store-wide | aligned (REQ-139) |
| AC-1120 (`3235871e`) | Offering a control only when it is faithful — *unsupported*: italic, positive evidence of absence only | aligned |
| AC-1274 (`bdfc47f9`) | Offering a control only when it is faithful — *inert* and *lossy*: a run's colour under a glyph gradient | aligned |
| AC-1275 (`073d2b90`) | Offering a control only when it is faithful — the negative half: a sibling parameter is not occlusion | aligned |
| AC-1277 (`6e64a161`) | Offering a control only when it is faithful — the CLI listing marks the unavailable field with its reason | aligned |
| AC-983 (`7791f71b`) | Applying one change as one change — whole or not at all, never half-written | aligned |
| AC-1026 (`d4bc1184`) | Applying one change as one change — image + alt land in one diff | aligned (see info #4) |
| AC-1118 (`1eb99338`) | Writing a parameter as the rule it is — every keyframe scaled by the same ratio, widths unmoved | aligned |
| AC-1122 (`66f57a24`) | Writing a parameter as the rule it is / leaving no trace — writes *into* the parameters, identity removes, no empty container, no-op reports no-op | aligned |
| AC-986 (`289bbf76`) | Validating the whole result — same validator, same code/message/path as another structured-edit command | aligned |
| AC-985 (`bcc448ea`) | Refusing legibly — code, path, hint, failing exit status, standard envelope | aligned |
| AC-984 (`4bf1f692`) | Refusing legibly — draft and rendered page byte-for-byte unchanged | aligned |
| AC-988 (`97f5dee6`) | Refusing legibly — the five kinds of refused entry, checked before any is applied | aligned |
| AC-1048 (`3c28fccd`) | Refusing legibly — a background handle the site does not offer, refused at the field before the validator | aligned |
| AC-1271 (`04f1776e`) | Refusing legibly — colour: unknown entry, free value, unrecognised part, part out of range | aligned |
| AC-1121 (`db9faa7b`) | Refusing a change and never the status quo — bounds bind a change; refused, never clamped | aligned |
| AC-1272 (`97dc16b1`) | Refusing a change and never the status quo — an unchanged colour is not a change, not converted; canonical form | aligned |
| AC-1276 (`828c2981`) | Refusing a change and never the status quo — unavailable colour: change refused with its own sentence, re-post saves the rest | aligned |
| AC-982 (`99f7c64d`) | Making the change visible — both renderings from the command line, each path reported | aligned |
| AC-992 (`9561711e`) | Making the change visible — the builder origin is the same surface; both views current at the origin | aligned |
| AC-991 (`08c7ebe8`) | Being incapable of raw code — exactly five control shapes, each narrower than a free string | aligned; the five match the story body's five exactly |
| AC-1027 (`0bc092af`) | Changing nothing but structured fields — no file touched by choosing *or* adjusting; handle unchanged | aligned |
| AC-1046 (`3cf8a118`) | Changing nothing but structured fields — background write disturbs no other parameter and no asset byte | aligned |
| AC-1129 (`d6db5412`) | Leaving no trace when nothing changed — pan writes both components or neither; centre removes the pair | aligned |
| AC-1130 (`0e2f38fa`) | Leaving no trace when nothing changed — colour adjustment as a projection; identity removes, container and all | aligned; both partitions confirmed against `FILTER_CONTROLS` |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-1270 (`acceptance_criterion-c6af20ad`) | ac-edit | The Criterion's closing clause reads "a box or container with no paint, and a behavior module's seam, are never offered a fill, because **neither is addressable** and a control on an unreachable node is a control nobody can use." The seam *is* addressable. STORY-100 says so ("For anything that exposes nothing — a behavior module's mounted seam … the answer is an **empty list**, and an empty list is a legitimate answer rather than an error"), AC-981 asserts it as its whole subject ("**succeeds** … with an empty field list"), the implementation does it (`editCopyGet` returns `fields: derived?.fields ?? []` at `tools/generate/src/cli/edit.ts:646`, exit zero, for a node `copyFieldsOf` answers `null` for), and **AC-1270's own Verification contradicts its Criterion**: "the seam answers with an empty field list, and the unpainted container is not addressable at all." Only the unpainted container is un-addressable. | In AC-1270's Criterion, replace "because neither is addressable and a control on an unreachable node is a control nobody can use" with a clause that separates the two, e.g. "— the container because it is not addressable at all and a control on an unreachable node is a control nobody can use, the seam because it paints nothing and answers with an empty field list." Change nothing else in the AC; the behavioural claim and the Verification are already correct. |
| 2 | info | — | AC-988 + AC-1121 / AC-1271 / AC-1276 | — | AC-988 enumerates five kinds of refused entry and its Verification exercises the colour and unavailability cases that AC-1271 and AC-1276 own in detail. Judged **not** an exclusivity breach: AC-988's load-bearing claim is that *every entry is checked before any is applied* and that all five bind a change and never the status quo, while AC-1271 owns the message content ("names the entry asked for and the entries available"; the no-palette variant) and AC-1276 owns the re-post-saves-the-rest half. Different claims over a shared scenario. | none |
| 3 | info | — | AC-1132 (`acceptance_criterion-f8ea23cf`) | — | The Criterion enumerates the browser-painted values as "the initial fill mode, dead centre in both directions, unrounded, unturned, at full size, and every colour adjustment at its own identity" — the *shape* axis is absent from that list, though the Verification does require it ("assert that every framing, **shape** and colour field is present in the answer"). The Criterion's governing sentence ("answers with the values a browser would actually paint it at … rather than with blanks or absent fields") already covers it, so no UAT written from this AC can go wrong. Recorded so a future cycle does not re-derive it as a finding. | none |
| 4 | info | — | AC-1026 (`acceptance_criterion-d4bc1184`) | — | AC-1026 says an image save "re-renders the page … and reports … where the re-rendered output was written" — singular — where AC-982 asserts the two-rendering claim in full ("**both** the editable rendering and the plain draft rendering … reports … **where each of the two renderings was written**"). AC-1026 does not claim only one rendering is produced; it simply asserts less. STORY-100's "Making the change visible" bullet is stated over *a successful edit* generally and is discharged by AC-982, with AC-992 covering the origin. No contradiction, no gap. | none |
| 5 | info | — | AC-1045 (`acceptance_criterion-8a3c8c3e`) + AC-1049 (`acceptance_criterion-6ee8863b`) | — | Both address a painted panel carrying no background image. Judged **not** duplicative: AC-1045 owns the read-shape of the panel form (both fields together, the palette riding the answer, no other paint parameter offered) and explicitly hands off — "Which panels are offered a fill at all, and what may be written into it, are a separate criterion's business" — while AC-1049 owns the selection-only asymmetry (the field must hold a value, the picker offers no empty choice, a fill can be set and changed but not cleared). | none |

## Notes for the Editor

**This level is passing.** One warning, zero violations, zero needs-review. The warning is a
single rationale clause inside an AC whose behavioural claim and Verification are both
already correct — repair it opportunistically, but nothing downstream is blocked on it and
nothing about it should move any other AC.

**Why the previous eight attempts oscillated, and why this cycle stops.** Attempts 4–8 each
closed exactly one defect and surfaced exactly one more, all of them in the same narrow
band: a Criterion repaired at one paragraph leaving its Verification (or a neighbouring
enumeration) stating the older, narrower fact. The attempt-7/8 pair — AC-1130's identity
enumeration and AC-1117's absent-weight seed — were the last two instances, and both are now
confirmed closed **against the implementation**, not against the fix report that claimed
them. The remaining finding is deliberately *not* of that shape: it is not a stale
enumeration, and the fix does not touch a value, a bound or a list, so it cannot falsify a
neighbouring paragraph the way this loop's earlier repairs did.

**Guard against re-deriving the three info entries as findings.** Items 2, 3 and 5 above are
each a shape a fresh reader is likely to flag — a general criterion whose verification
overlaps a specific one, an enumeration missing one member its verification supplies, and
two ACs meeting on the same seeded region. All three were examined this cycle and are
correct as they stand. They are recorded here so the next cycle can confirm rather than
re-litigate them.

**One observation outside this level's remit, for whoever owns the story.** STORY-100's body
was last edited at 17:33, *after* its story-level check passed at 17:19 (REPORT-3765). This
cycle read the 17:33 body and found the AC set consistent with it, so nothing here is
affected — but the story-level ledger on record predates the body it certifies.
