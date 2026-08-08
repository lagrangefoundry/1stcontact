---
uid: report-90d1930c
id: REPORT-1670
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=ac)'
created_by: xgd
created_at: '2026-08-08T00:17:13.256805+00:00'
updated_at: '2026-08-08T00:17:13.256805+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-ae9d65d6
  level: ac
  violations: 3
  warnings: 4
  needs_review_count: 0
---

# Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior Modules
# Level: ac

**Result**: FAIL
**Violations**: 3
**Warnings**: 4
**Needs review**: 0

Anchor report: report-17a279f7 · Capability: capability-ae9d65d6 (CAP-70) · Level: ac · Previous attempts: 4

## Standing on a failed upper layer — read this first

The story-level cycle for this capability ran immediately before this one
(**REPORT-1668** `report-3a0d1cad`, 2026-08-08T00:05Z) and returned **FAIL with 5
violations**, and **no repair has landed since** — the only commits after it are
the report itself, its comment, and the workflow-completion marker. So the working
reference this level is supposed to lean on is known-drifted in two places:
STORY-82's body (pre-REQ-87 / pre-REQ-96 snapshot) and the absence of REQ-93 from
any story body.

Consequently I used the story body as the working reference **except** for those
two areas, where I escalated to intent and to code directly. Everywhere else the
ac layer was checked against its story body, and intent was consulted only where an
AC contradicts a **sibling AC inside this same capability** (AC-718 vs AC-722/AC-701;
AC-719 vs AC-935/AC-928).

### Scale of the surface checked

98 ACs across 7 stories — up from the 24 that REPORT-1315 (the last ac cycle,
2026-08-05) saw. The matrix rebuild of 2026-08-06 added STORY-90 and STORY-91 whole
and grew STORY-83 from 15 ACs to 39. **74 of the 98 have never been through an
ac-level cycle in this container.** All 74 were read in full for this pass.

| Story | kind | ACs | Verdict |
|---|---|---|---|
| STORY-83 `story-d0a8cfad` | upgrade | 39 | aligned (1 warning) |
| STORY-90 `story-d2b5cb1c` | upgrade | 20 | aligned |
| STORY-85 `story-179b8c06` | upgrade | 15 | aligned (1 warning) |
| STORY-91 `story-2e4e2c45` | feature | 10 | aligned |
| STORY-81 `story-3569e1a4` | upgrade | 6 | aligned |
| STORY-80 `story-c490f1cf` | upgrade | 6 | aligned (2 warnings) |
| STORY-82 `story-46e3b3c7` | upgrade | 2 | **both drifted** (2 violations) |

## Cumulative Intent Considered

Verified directly by `xgd ticket get` for every intent cited in a finding; the full
~40-intent ledger (bundles BUNDLE-6/7/11/13/14/16 plus the directly-named intents)
is in REPORT-1668 (story level, this same cycle) and is not restated here.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-79 `request-87b26bca` | free_and_reconciled | 2026-07-19 | Framework pivot: L1 substrate + module contract | YES |
| REQ-82 `request-11efc10f` | free_and_reconciled | 2026-07-20 | L1 schema + envelope validator + sole safe renderer | YES |
| REQ-84 `request-f243b6b9` | free_and_reconciled | 2026-07-20 | **Retired** the semantic layout modules and their ~20 dials | YES (retires) |
| REQ-85 `request-015e42ac` | free_and_reconciled | 2026-07-20 | Module contract; reframed carousel & contact-form | YES |
| REQ-87 `request-84af044b` | free_and_reconciled | 2026-07-21 | **Retired** the `Capability*` runtime type → `Behavior*`; no back-compat alias; scope covers the prose naming the type | YES (retires) |
| REQ-93 `request-f26cbe32` | free_and_reconciled | 2026-07-25 | **A page binds behavior-module instances to L1 slots; renderer mounts the fragment into the seam** | YES — **Finding 3** |
| REQ-96 `request-3a064234` | free_and_reconciled | 2026-07-26 | `control` leaf; deleted `config.view`; **replaced contact-form's `intro`/`submit` slots with one required `form` slot** | YES (retires) |
| REQ-97 `request-6c2b1cf4` / REQ-105 `request-6a8efe0f` | free_and_reconciled | 2026-07-26/27 | Text measure; sizable slot | YES |
| REQ-107 `request-847b979f` | free_and_reconciled | 2026-07-27 | Envelope validator wired to the authoring path | YES — see Finding 7 |
| REQ-114 `request-3cd338cd` | free_and_reconciled | 2026-07-31 | L1 palette colour model; **retired the closed colour-role vocabulary** | YES (retires) |

## Alignment Ledger

Grouped by story; every AC in the capability is accounted for. Rows carrying a
finding are broken out individually.

| Element | Intents aligned to | Outcome |
|---|---|---|
| **STORY-83** — AC-682, 683, 684, 685, 687, 688, 723, 725, 727, 728, 801, 802, 803, 804, 805, 806, 807, 829, 830, 831, 832, 849, 850, 851, 888, 889, 890, 891, 933, 934, 935, 936, 1009, 1010, 1011, 1012 (36 of 39) | REQ-82, 87, 90, 91, 96, 97, 98, 103, 105, 107, 109, BUG-30, 114, 117 | aligned — each verifies against the story body and, where checked, against code |
| AC-686 `acceptance_criterion-33ecc306` | REQ-82, 87, 107 | aligned on the envelope rules and the atomic-rename rejection; ¶2 restates AC-849 — **Finding 7** |
| AC-723 `acceptance_criterion-8db8ef76` | REQ-82, 87 | aligned to its story body and to `renderL1Document` standing alone; reads as the whole truth about a slot, which REQ-93 made it no longer — **Finding 3** |
| AC-726 `acceptance_criterion-f4433020` | REQ-91, 98 | aligned — explicitly deconflicted from AC-686 in its own prose |
| **STORY-90** — AC-819…828, AC-879…887 (all 20) | REQ-99, REQ-100, REQ-108 | aligned — interaction/entrance/pointer axes, the three fail-visible obligations and both typed-only envelope ACs all follow from the story body |
| **STORY-85** — AC-697, 698, 699, 700, 701, 702, 704, 722, 808, 809, 810, 811, 878 (13 of 15) | REQ-85, 87, 96, 116, BUG-28 | aligned and current — AC-701 already carries the REQ-96 `form`-slot/control-leaf shape, AC-722 the atomic rename, AC-809 both declared carve-outs |
| AC-703 `acceptance_criterion-9a05baf2` + AC-877 `acceptance_criterion-f25094f4` | REQ-85, BUG-28 | both aligned; AC-703's client-side half restates AC-877 whole — **Finding 6** |
| **STORY-91** — AC-839…848 (all 10) | REQ-106 | aligned — link role, new-context isolation, allowlist, focus indicator, ids, refusals and the additive baseline all follow from the story body |
| **STORY-81** — AC-833…838 (all 6) | REQ-104 | aligned — layout track, wrapping row, shared cascade, ascending serialization, visibility-wins and envelope coherence |
| **STORY-80** — AC-928, 929, 930, 931 | REQ-114 | aligned — palette shape, dangling-reference failure, alpha-on-reference, load-boundary resolution |
| AC-716 `acceptance_criterion-1eaa93b8` | REQ-79 §2, REQ-84, REQ-114 | aligned in substance; its colour bullet and closing paragraph now restate AC-928 and AC-931 — **Finding 4** |
| AC-932 `acceptance_criterion-9f1e7baf` | REQ-114 | asserts a retrofit-conversion property STORY-80's body scopes out — **Finding 5** |
| **STORY-82** — AC-718 `acceptance_criterion-f3328e22` | REQ-85, REQ-87, REQ-96, REQ-93 | **drifted** on four counts — **Finding 1** |
| **STORY-82** — AC-719 `acceptance_criterion-da7c62ec` | REQ-84, REQ-114 | **drifted** — grants an L1 leaf "a named overlay role" — **Finding 2** |
| *(coverage, capability-wide)* | REQ-93 | **gap** — no AC in CAP-70 expresses the page-level binding rule or the render-time mount — **Finding 3** |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-718 `acceptance_criterion-f3328e22` (STORY-82) | ac-edit | **Four distinct drifts in one AC**, all against free_and_reconciled intents. (a) **Retired type name** — the title and five body clauses name the runtime type `capability` ("The contact-form **capability** exposes no aesthetic dials", "the **capability's** named `submit` slot", "the **capability** `config.fields` schema", "The **capability's** typed `config`", Verification: "Inspect the contact-form **capability meta**"). REQ-87 renamed it with no alias; sibling **AC-722** asserts the negative as a criterion ("no `'capability'` discriminant survives anywhere"); `packages/framework/src/modules/contact-form/meta.ts:1,27` is `BehaviorMeta` / `kind: 'behavior'`, so the Verification step names a symbol family that does not exist. (b) **Retired slots** — "`submit`/`intro` are declared L1 slots" and "mounted into the capability's named `submit` slot". REQ-96 deleted both; `meta.ts:57-60` declares `slots: { form: { required: true } }` and `meta.ts:62-77` makes `submit` a **control**, not a slot. Sibling **AC-701** already carries the correct shape ("The earlier `intro` and `submit` presentation slots are gone"). (c) **Stale config set** — "typed `config` carries only behavioural/functional params (`action`, `fields`, `successMessage`)". `meta.ts:55` adds `submitLabel`; `meta.ts:47` adds `fields[].labelMode`. (d) **Flat negative now false** — "exposes no aesthetic dials for its former treatments (`fieldLabels=placeholder`…)" while REQ-93 re-introduced `labelMode: 'placeholder'` — deliberately, as a captured a11y fact rather than a dial (`meta.ts:41-47`), which is a distinction the AC does not make | Retitle to "…authored via behavior config + L1 slots, not module dials". Replace every runtime-type "capability" with "behavior module" / "behavior config" / "behavior meta". Repoint the presentation clause to the single required `form` slot with `submit` as a `control` leaf. Restate the config set as `action`, `fields` (incl. `labelMode`), `successMessage`, `submitLabel`, and reframe (d) as "no field resolves to a CSS value" rather than "no placeholder mode exists" |
| 2 | violation | consistency | AC-719 `acceptance_criterion-da7c62ec` (STORY-82) | ac-edit | The criterion grants an L1 leaf's colour "a literal **(or a named overlay role)**". REQ-114 (free_and_reconciled, 2026-07-31) **deleted the closed colour-role vocabulary outright**; the overlay is now a free-form kebab-case **palette reference**. Two siblings in this same capability assert the opposite as criteria: **AC-935** (STORY-83) — "No closed colour-role vocabulary survives in the schema, in a definition, or on a layer… no alias, no grandfathered spelling"; **AC-928** (STORY-80) — the overlay is "an arbitrary-size map of free-form kebab-case entry names". Code agrees: `packages/site-schema/src/l1/palette.ts:56` defines the name as free-form kebab-case and its header states "DOC-23 §5.4's role vocabulary is a starting *vocabulary*, not a schema"; `grep -n "role" packages/site-schema/src/l1/schema.ts` returns only REQ-106 *navigation*-role hits. Note this is the second consecutive ac cycle to raise this clause — REPORT-1315 Finding 2 raised it on the pre-REQ-114 grounds ("no role indirection in L1 at all"); the clause survived that cycle unrepaired and is now wrong on the *newer* grounds as well | Replace "(or a named overlay role)" with "(or a palette reference)". The identical clause appears twice in STORY-82's body — REPORT-1668 Finding 8 — and both must move together |
| 3 | violation | coverage | AC-723 `acceptance_criterion-8db8ef76` + (no AC anywhere in CAP-70) | ac-add (+ ac-edit on AC-723) | **REQ-93 is a whole reconciled intent with live code and no criterion anywhere in this capability.** The page-level binding rule is implemented at `packages/site-schema/src/schema.ts:483-599` — `moduleInstance.slot` is required on a page carrying `l1` and forbidden on one that does not, and `pageSchema.superRefine` rejects an unbound module, a `slot` naming a seam the tree does not contain, a duplicated (ambiguous) seam, and a double-bound seam, each with a machine-readable path. The render-time mount is at `packages/framework/src/l1/render.ts:1998-2014` (`state.mounts?.[node.name]` replaces the placeholder's children) and `render.ts:2234-2272`. No AC under STORY-83, STORY-85 or any sibling covers either half. **AC-723 is not wrong** — it describes `renderL1Document` standing alone, and its own story body says the same — but it now reads as the whole truth about a slot, which it is not. This is the ac half of REPORT-1668 Finding 3 and is **sequenced after it**: the story bodies must first admit the behaviour | Under STORY-85: author an AC for the page-level binding rule (bound-by-name, and each of the five rejection classes with its path) and one for the render-time mount replacing the seam's contents. Under STORY-83: extend AC-723 with a sentence that the inert placeholder is what a seam renders when **no** module is bound to it |
| 4 | warning | exclusivity | AC-716 `acceptance_criterion-1eaa93b8` vs AC-928 + AC-931 (all STORY-80) | ac-edit | Within one story, three ACs state the same criterion. AC-716's colour bullet — "A colour axis on an L1 leaf accepts a hex literal… **or** a reference into the site palette which resolves to a hex before anything paints" — is AC-928's whole criterion ("Every colour axis… accepts **either** a hex literal **or** a reference to a palette entry"). AC-716's closing paragraph — "A document that uses only literals needs no palette and is unaffected by the widening" — is AC-931's second bullet almost verbatim ("A literal-only document is entirely unaffected by the widening: it needs no palette, validates and renders exactly as before"). AC-716's genuinely distinct content is the **length / geometry / radius literal-only base**, which no other AC carries. AC-716 was widened onto the overlay by REQ-114 without the pre-existing overlay ACs being trimmed | Narrow AC-716 to the absolute base — the hex literal always valid, and length/geometry/radius literal-only with their envelope bounds — and cross-reference AC-928 / AC-931 for the overlay half rather than restating it |
| 5 | warning | consistency | AC-932 `acceptance_criterion-9f1e7baf` (STORY-80) | ac-deprecate | The criterion is a property of the **retrofit conversion** ("Converting an existing site's colour literals to palette references yields a palette rather than a colour list… colours forming a ramp become steps of one entry… The conversion is colour-lossless"), and its Verification drives a retrofitted site. STORY-80's body explicitly scopes that out: "The colour census and retrofit tooling that makes the model adoptable on existing sites is **its own capability**." It is: **STORY-97** `story-5e7eb0c5` (capability-b4ac88fc) already carries AC-941 (writes the palette, reports before/after counts), AC-942 (one colour at several opacities → one entry), AC-943 (a lightness ramp → one entry with steps) and AC-944 (moves no pixel) — which is AC-932's content, distributed and owned. The evidence AC-932 cites (6 entries from 16 RGB; 8 from 30) is legitimately recorded in STORY-80's Technical Notes as *evidence of the value model*, but that is a note, not a criterion of this story | Deprecate AC-932 in favour of STORY-97's AC-941…944; if any part is kept here, reduce it to the value-model claim (the entry is the unit of colour change) with no reference to a conversion pass. Also note AC-930's Verification borrows the same conversion — retarget it at the reference/alpha round-trip it actually owns |
| 6 | warning | exclusivity | AC-703 `acceptance_criterion-9a05baf2` vs AC-877 `acceptance_criterion-f25094f4` (both STORY-85) | ac-edit | AC-703's third paragraph ("the enhancement decides whether it can complete the submission **before** it suppresses that native submit") and its closing Verification sentence ("for an endpoint the enhancement cannot complete, the submit event is left unsuppressed so the user agent performs the baseline submit, and no error state is shown") restate AC-877 in full. AC-877 is the dedicated criterion for exactly that behaviour (BUG-28), with the scheme allowlist, the non-throwing unparseable case and the schemeless-still-enhanced case. AC-703's distinct content is the **render-level** isolation dimension: degenerate-but-schema-valid input degrades inertly, a throwing core is flagged, no browser needed | Reduce AC-703's client-side paragraph to a one-line statement that the isolation obligation extends to the client enhancement, cross-referencing AC-877 / AC-878, and drop the duplicated Verification sentence |
| 7 | warning | exclusivity | AC-686 `acceptance_criterion-33ecc306` ¶2 vs AC-849 `acceptance_criterion-1f9fd518` (both STORY-83) | ac-edit | Both assert the REQ-107 criterion in full. AC-686 ¶2: "The rejection is guaranteed for an authored document, not only for one produced by the fold… it runs wherever a site definition is validated… on the same path that renders, publishes, edits and imports a site." AC-849: "The guarantee is unconditional on how the page's L1 body was produced… Because a single site-definition validation stands behind every consuming operation, the guarantee holds for each of them alike: rendering a draft, publishing a revision, applying an authored edit, and importing a reproduced site." AC-849 is the REQ-107 owner; AC-686's own subject is the envelope *rules*. Worth noting AC-686 already deconflicts itself from AC-726/AC-728 in prose — the same treatment is missing here | Trim AC-686 ¶2 to a cross-reference to AC-849 ("these bounds apply wherever a site definition is validated — see the authored-envelope criterion"), leaving AC-686 to own the rule list and the atomic-rename key rejection |

## Notes for the Editor

- **Nothing new is wrong in the 74 ACs added since the last ac cycle.** STORY-90's
  20, STORY-91's 10, STORY-81's 6 and STORY-83's 24 additions all verify against
  their story bodies. Both violations sit in the same two ACs REPORT-1315 flagged on
  2026-08-05 and that were never repaired — AC-718 and AC-719, still the only two
  `pending` ACs in the capability, under the only story with
  `fields.uat_coverage: stale`. **Two consecutive ac cycles have now named them.**

- **Sequencing matters this cycle.** Finding 3 is an `ac-add` that cannot be
  authored correctly until REPORT-1668's story-level Finding 3 lands (STORY-85's
  in-scope must first admit the page-level binding). Findings 1 and 2 are the ac
  half of REPORT-1668 Findings 1/2/5/8 and should be applied in the same pass as
  the STORY-82 body edit — applying the body edit alone leaves the drift live in
  exactly the place the UATs read it.

- **The fold question REPORT-1315 raised is still open, and now points the other
  way.** That report offered Findings 1/2 (repair AC-718/AC-719 in place) and
  Findings 3/4 (deprecate them into AC-701/AC-716/AC-725) as alternatives pending a
  story-level decision on whether STORY-80/STORY-82 survive as repointer stories.
  REPORT-1668 Warning 7 revives it. My reading is that the deprecation is now the
  cheaper answer for STORY-82 specifically: post-REQ-96 both of its ACs restate
  criteria that AC-701, AC-716/AC-928, AC-725 and AC-726 already carry, and
  repairing them in place buys two ACs whose only distinct content is provenance.
  I have nevertheless written Findings 1 and 2 as `ac-edit` because deprecation is
  a story-level call this level cannot make.

- **Four warnings, one shape.** Findings 4, 6 and 7 are all the same pattern: an
  older, broader AC was widened by a later intent without the newer, narrower AC's
  arrival prompting a trim, so the two now overlap. None is load-bearing — the
  behaviour is covered either way — but each costs a duplicate UAT at the next
  level down.

- **No code issues.** Every divergence in this pass is matrix text lagging code that
  already implements the intent, and Finding 3 is a matrix gap in front of code that
  works. Every code claim above was checked directly in this worktree
  (`contact-form/meta.ts`, `l1/palette.ts`, `l1/schema.ts`, `site-schema/schema.ts`,
  `framework/src/l1/render.ts`) rather than carried over from the earlier reports.

- **No needs_review.** Every AC resolved cleanly to its story body, and the two
  places where the story body itself is unreliable (STORY-82; the REQ-93 silence)
  were resolvable against intent and code without guessing.
