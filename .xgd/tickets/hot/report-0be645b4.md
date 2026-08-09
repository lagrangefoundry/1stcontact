---
uid: report-0be645b4
id: REPORT-1726
type: report
title: 'Capability-Intent Alignment: Framework Substrate: L1 Layout, Values & Behavior
  Modules (level=ac)'
created_by: xgd
created_at: '2026-08-09T04:07:38.624098+00:00'
updated_at: '2026-08-09T04:07:38.624098+00:00'
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

Anchor report: report-69e94af9 · Capability: capability-ae9d65d6 (CAP-70) · Level: ac · Previous attempts: 5

## Standing on a failed upper layer — read this first

The story-level cycle for this capability ran in **this same regression container**
(**REPORT-1725** `report-d040fcd0`, 2026-08-09T03:17Z) and returned **FAIL with 4
violations**. **No repair has landed since** — the only commit after it is the
workflow-completion marker (`48e8e4105`, HEAD), and `packages/` has had no commit
since 2026-08-07. So the working reference this level is supposed to lean on is
known-drifted in three specific places:

- **STORY-82's whole body** — pre-REQ-87 type name and pre-REQ-96 `intro`/`submit`
  slots (REPORT-1725 findings 2 and 3);
- **STORY-83's inert-placeholder sentence** — actively contradicted by REQ-93's
  `mounts` seam (REPORT-1725 finding 1b);
- **the absence of REQ-93's page-level binding rule from any story body**
  (REPORT-1725 finding 1a).

Everywhere else the ac layer was checked against its story body. In those three
areas I escalated to intent and to code directly, per the level-cascade rule for a
working reference that is itself unreliable. Intent was also consulted wherever an
AC contradicts a **sibling AC inside this same capability** — which is an ac-level
consistency failure regardless of what the story body says (AC-718 vs AC-701/AC-722;
AC-719 vs AC-928/AC-935).

### Surface checked

**96 ACs across 7 stories**, all read.

| Story | UID | kind | ACs | Verdict |
|---|---|---|---|---|
| STORY-83 | `story-d0a8cfad` | upgrade | 38 | aligned (1 warning) |
| STORY-90 | `story-d2b5cb1c` | upgrade | 19 | aligned |
| STORY-85 | `story-179b8c06` | upgrade | 15 | aligned (1 warning) |
| STORY-91 | `story-2e4e2c45` | feature | 10 | aligned |
| STORY-80 | `story-c490f1cf` | upgrade | 6 | aligned (2 warnings) |
| STORY-81 | `story-3569e1a4` | upgrade | 6 | aligned |
| STORY-82 | `story-46e3b3c7` | upgrade | 2 | **both drifted** (2 violations) |

All seven stories are `upgrade`/`feature`, so all are in-matrix and all are expected
to carry ACs. 94 ACs are `active`; the only two `pending` are STORY-82's, which are
also the only two carrying a violation.

*(Count note, not a finding: REPORT-1670 reported 98 ACs. The live count is 96 —
its per-story arithmetic double-counted AC-723 in STORY-83's aligned list and
over-counted STORY-90 by one. No AC has been removed or deprecated since; the nine
superseded module-dial ACs, AC-674…681 and AC-717, remain archived as STORY-82's
body records.)*

## Cumulative Intent Considered

The full ~29-intent ledger for this capability was rebuilt at story level this same
cycle (REPORT-1725) and is not restated. Every intent cited in a finding below was
re-verified directly against its ticket in this pass.

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-84 | `request-f243b6b9` | free_and_reconciled | 2026-07-20 | **Retired** the semantic layout modules (services-grid, footer, hero…) and their ~20 dials | YES (retires) |
| REQ-85 | `request-015e42ac` | free_and_reconciled | 2026-07-20 | Module contract; reframed carousel & contact-form | YES |
| REQ-87 | `request-84af044b` | free_and_reconciled | 2026-07-21 | **Retired** the `Capability*` runtime type → `Behavior*`; no back-compat alias | YES (retires) |
| REQ-93 | `request-f26cbe32` | free_and_reconciled | 2026-07-25 | **A page binds a behavior-module instance to an L1 `slot`; the renderer mounts the fragment into the seam** | YES — **Finding 3** |
| REQ-96 | `request-3a064234` | free_and_reconciled | 2026-07-26 | `control` leaf; deleted `config.view`; **replaced contact-form's `intro`/`submit` slots with one required `form` slot** | YES (retires) |
| REQ-107 | `request-847b979f` | free_and_reconciled | 2026-07-27 | Envelope validator wired to the authoring path | YES — Finding 7 |
| REQ-114 | `request-3cd338cd` | free_and_reconciled | 2026-07-31 | L1 palette colour model; **retired the closed colour-role vocabulary** | YES (retires) |
| BUG-28 | — | free_and_reconciled | 2026-07-27 | contact-form keeps the native submit on a non-fetchable endpoint | YES — Finding 6 |
| REQ-125/126/127/128 | `request-dbdc904a`, `-d9407f80`, `-22a6521a`, `-de67e1a1` | **draft** | 2026-08-08 | L1 control-surface API; background-image picker | **NO** — not yet active |

REQ-125…128 arrived since the last ac cycle. All four are `draft`, so none creates a
coverage obligation. Their correct absence from the AC tree is not drift.

## Alignment Ledger

Grouped by story; every one of the 96 ACs is accounted for. Rows carrying a finding
are broken out.

| Element | Intents aligned to | Outcome |
|---|---|---|
| **STORY-83** — AC-682, 683, 684, 685, 687, 688, 725, 726, 727, 728, 801, 802, 803, 804, 805, 806, 807, 829, 830, 831, 832, 849, 850, 851, 888, 889, 890, 891, 933, 934, 935, 936, 1009, 1010, 1011, 1012 (36 of 38) | REQ-82, 87, 90, 91, 96, 97, 98, 103, 105, 107, 109, 114, 117, BUG-30 | aligned — each verifies against the story body, and the retired-vocabulary sweep below clears every one |
| AC-686 `acceptance_criterion-33ecc306` | REQ-82, 87, 107 | aligned on the rule list and the atomic-rename key rejection; ¶2 restates AC-849 — **Finding 7** |
| AC-723 `acceptance_criterion-8db8ef76` | REQ-82, 87 | **aligned to its story body** and to `renderL1Document` standing alone; reads as the whole truth about a slot, which REQ-93 made it no longer. Not scored as a separate violation — STORY-83's body asserts the same unqualified statement, so the repair is sequenced at story level (REPORT-1725 finding 1b) — see **Finding 3** |
| **STORY-90** — AC-819…828, AC-879…887 (all 19) | REQ-99, REQ-100, REQ-108 | aligned — interaction/entrance/pointer axes, the three fail-visible obligations, the focus-indicator floor and both typed-only envelope ACs all follow from the story body |
| **STORY-85** — AC-697, 698, 699, 700, 701, 702, 704, 722, 808, 809, 810, 811, 878 (13 of 15) | REQ-85, 87, 96, 116, BUG-28 | aligned and current — AC-701 carries the REQ-96 `form`-slot/control-leaf shape, AC-722 the atomic rename, AC-699 the deleted `config.view`, AC-808/809 both declared carve-outs |
| AC-703 `acceptance_criterion-9a05baf2` + AC-877 `acceptance_criterion-f25094f4` | REQ-85, BUG-28 | both aligned; AC-703's client-side half restates AC-877 whole — **Finding 6** |
| **STORY-91** — AC-839…848 (all 10) | REQ-106 | aligned — link role, new-context isolation, allowlist, focus indicator, DOM ids, refusals and the additive baseline all follow from the story body |
| **STORY-81** — AC-833…838 (all 6) | REQ-104 | aligned — layout track, wrapping row, shared cascade, ascending serialization, visibility-wins and envelope coherence |
| **STORY-80** — AC-928, 929, 930, 931 | REQ-114 | aligned — palette shape, dangling-reference failure, alpha-on-reference, load-boundary resolution |
| AC-716 `acceptance_criterion-1eaa93b8` | REQ-79 §2, REQ-84, REQ-114 | aligned in substance; its colour bullet and closing paragraph now restate AC-928 and AC-931 — **Finding 4** |
| AC-932 `acceptance_criterion-9f1e7baf` | REQ-114 | asserts a retrofit-conversion property STORY-80's body explicitly scopes out, and which STORY-97 (CAP-71-adjacent, `capability-b4ac88fc`) already owns — **Finding 5** |
| **STORY-82** — AC-718 `acceptance_criterion-f3328e22` | REQ-85, 87, 93, 96 | **drifted on four counts** — **Finding 1** |
| **STORY-82** — AC-719 `acceptance_criterion-da7c62ec` | REQ-84, REQ-114 | **drifted** — grants an L1 leaf colour "a named overlay role" — **Finding 2** |
| *(coverage, capability-wide)* | REQ-93 | **gap** — no AC in CAP-70 expresses the page-level binding rule or the render-time mount — **Finding 3** |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | AC-718 `acceptance_criterion-f3328e22` (STORY-82) | ac-edit | **Four distinct drifts in one AC**, each against a `free_and_reconciled` intent, all re-verified against code in this pass. **(a) Retired runtime type name.** The title and five body clauses name the type `capability` — "The contact-form **capability** exposes no aesthetic dials", "the **capability's** named `submit` slot", "the **capability** `config.fields` schema", "The **capability's** typed `config`", and Verification: "Inspect the contact-form **capability meta**". REQ-87 renamed it with no alias; `packages/framework/src/modules/contact-form/meta.ts:1,28` is `BehaviorMeta` / `kind: 'behavior'`, so the Verification step names a symbol family that does not exist. Sibling **AC-722** asserts the negative as a criterion. **(b) Retired slots.** "`submit`/`intro` are declared L1 slots" and "mounted into the capability's named `submit` slot". REQ-96 deleted both: `meta.ts:57-61` declares `slots: { form: { required: true } }`, and `meta.ts:63-68` makes `submit` a **control** (`element: 'button'`), not a slot. Sibling **AC-701** already carries the correct shape. **(c) Stale config set.** "typed `config` carries only behavioural/functional params (`action`, `fields`, `successMessage`)" — `meta.ts:55` adds `submitLabel`, `meta.ts:47` adds `fields[].labelMode`. **(d) Flat negative now false.** "exposes no aesthetic dials for its former treatments (`fieldLabels=placeholder`…)" while REQ-93 re-introduced `labelMode: 'placeholder'` (`meta.ts:41-47`) — deliberately, as a captured a11y fact rather than a dial, a distinction the AC does not make | Retitle to "…authored via behavior config + L1 slots, not module dials". Replace every runtime-type "capability" with "behavior module" / "behavior config" / "behavior meta". Repoint the presentation clause to the single required `form` slot, with `submit` as a `control` leaf. Restate the config set as `action`, `fields` (incl. `labelMode`), `successMessage`, `submitLabel`. Reframe (d) as "no config field resolves to a CSS value" rather than "no placeholder mode exists" |
| 2 | violation | consistency | AC-719 `acceptance_criterion-da7c62ec` (STORY-82) | ac-edit | The criterion grants an L1 leaf's colour "a literal **(or a named overlay role)**". REQ-114 (free_and_reconciled, 2026-07-31) **deleted the closed colour-role vocabulary outright**; the overlay is now a free-form kebab-case **palette reference**. Code agrees: `packages/site-schema/src/l1/palette.ts:55-60` defines the entry name as free-form kebab-case ("`primary`, `brand-teal`, `500`"), and `grep -n role packages/site-schema/src/l1/schema.ts` returns only REQ-106 *navigation*-role hits — no colour role survives. Two siblings in this same capability assert the opposite **as criteria**: **AC-935** (STORY-83) — "No closed colour-role vocabulary survives in the schema, in a definition, or on a layer"; **AC-928** (STORY-80) — the overlay is "an arbitrary-size map of free-form kebab-case entry names". This is the **third consecutive** ac cycle to raise this clause (REPORT-1315 Finding 2 on 2026-08-05 on the pre-REQ-114 grounds; REPORT-1670 Finding 2 on 2026-08-08) | Replace "(or a named overlay role)" with "(or a palette reference)". The identical clause appears twice in STORY-82's body — move both together with the story-body edit |
| 3 | violation | coverage | *(no AC anywhere in CAP-70)* + AC-723 `acceptance_criterion-8db8ef76` | ac-add (+ ac-edit on AC-723) | **REQ-93 is a whole `free_and_reconciled` intent with live code and no criterion anywhere in this capability.** The page-level binding rule is implemented at `packages/site-schema/src/schema.ts:469-599`: `moduleInstanceSchema.slot` (`:488`) names the seam, and `pageSchema.superRefine` rejects each of — a `slot` on a page with no L1 body (`:550-554`), a duplicated (ambiguous) seam (`:565`), an unbound module (`:571-576`), a seam the tree does not contain (`:581-586`), and a double-bound seam (`:591-595`) — each with a machine-readable path. The render-time mount is at `packages/framework/src/l1/render.ts:1714-1715` (`mounts` map) and `:2011-2014` (mounted HTML emitted inside the slot). A term sweep across all 96 ACs finds **zero** hits for `moduleInstance`, `pageSchema`, `ambiguous`, `double-bound` or an equivalent phrasing. The nearest ACs are not substitutes: **AC-698** covers *per-instance* slot validation (`validateBehaviorSlots`/`validateBehaviorInstance`), not the page↔tree binding; **AC-723** covers only the *unmounted* placeholder. AC-723 is not itself scored as a violation — it faithfully reflects STORY-83's body, which asserts the same unqualified statement — but it now reads as the whole truth about a slot, which it is not | **Sequenced after REPORT-1725 findings 1a and 1b** — the story bodies must first admit the behaviour. Then: under STORY-85, author an AC for the page-level binding rule (bound-by-name, plus each of the five rejection classes with its path); under STORY-83, author or extend for the render-time mount, and add a clause to AC-723 that the inert placeholder is what a seam renders when **no** module is bound to it |
| 4 | warning | exclusivity | AC-716 `acceptance_criterion-1eaa93b8` vs AC-928 `acceptance_criterion-1663c20c` + AC-931 `acceptance_criterion-5ab42ca8` (all STORY-80) | ac-edit | Within one story, three ACs state the same criterion. AC-716's colour bullet — "A colour axis on an L1 leaf accepts a hex literal… **or** a reference into the site palette which resolves to a hex before anything paints" — is AC-928's whole criterion ("Every colour axis… accepts **either** a hex literal **or** a reference to a palette entry"). AC-716's closing paragraph — "A document that uses only literals needs no palette and is unaffected by the widening" — is AC-931's second bullet almost verbatim ("A literal-only document is entirely unaffected by the widening: it needs no palette, validates and renders exactly as before"). AC-716's genuinely distinct content is the **length / geometry / radius literal-only base**, which no other AC carries. AC-716 was widened onto the overlay by REQ-114 without the pre-existing overlay ACs being trimmed | Narrow AC-716 to the absolute base — the hex literal always valid, and length/geometry/radius literal-only with their envelope bounds (font-size 1–400, geometry ±100k) — and cross-reference AC-928 / AC-931 for the overlay half rather than restating it |
| 5 | warning | consistency | AC-932 `acceptance_criterion-9f1e7baf` (STORY-80) | ac-deprecate | The criterion is a property of the **retrofit conversion** ("Converting an existing site's colour literals to palette references yields a palette rather than a colour list… colours forming a ramp become steps of one entry… The conversion is colour-lossless"), and its Verification drives a retrofitted site. STORY-80's body explicitly scopes that out: "The colour census and retrofit tooling that makes the model adoptable on existing sites is **its own capability**." It is — **STORY-97** `story-5e7eb0c5` (`capability-b4ac88fc`, status `completed`) carries AC-941 (writes the palette, rewrites literals as references), AC-942 (one colour at several opacities → one entry), AC-943 (a lightness ramp → one entry with steps) and AC-944 (moves no pixel) — which is AC-932's content, distributed and owned in the capability that declares it. The evidence AC-932 cites (6 entries from 16 RGB; 8 from 30) is legitimately recorded in STORY-80's own body as *evidence of the value model*, but that is a note, not a criterion of this story | Deprecate AC-932 in favour of STORY-97's AC-941…944. If any part is kept here, reduce it to the value-model claim (the entry is the unit of colour change) with no reference to a conversion pass. Note AC-930's Verification borrows the same conversion — retarget it at the reference/alpha round-trip it actually owns |
| 6 | warning | exclusivity | AC-703 `acceptance_criterion-9a05baf2` vs AC-877 `acceptance_criterion-f25094f4` (both STORY-85) | ac-edit | AC-703's second paragraph ("the enhancement decides whether it can complete the submission **before** it suppresses that native submit") and its closing Verification sentence ("for an endpoint the enhancement cannot complete, the submit event is left unsuppressed so the user agent performs the baseline submit, and no error state is shown") restate AC-877 in full. AC-877 is the dedicated BUG-28 criterion for exactly that behaviour, and carries the detail AC-703 lacks — the scheme allowlist rather than a `mailto:`/`tel:` denylist, the unreadable-endpoint case that must not throw, and the schemeless-still-enhanced case. AC-703's distinct content is the **render-level** isolation dimension: degenerate-but-schema-valid input degrades inertly, a throwing core is flagged, no browser needed | Reduce AC-703's client-side paragraph to a one-line statement that the isolation obligation extends to the client enhancement, cross-referencing AC-877 / AC-878, and drop the duplicated Verification sentence |
| 7 | warning | exclusivity | AC-686 `acceptance_criterion-33ecc306` ¶2 vs AC-849 `acceptance_criterion-1f9fd518` (both STORY-83) | ac-edit | Both assert the REQ-107 criterion in full. AC-686 ¶2: "The rejection is guaranteed for an authored document, not only for one produced by the fold… it runs wherever a site definition is validated… on the same path that renders, publishes, edits and imports a site." AC-849: "The guarantee is unconditional on how the page's L1 body was produced… Because a single site-definition validation stands behind every consuming operation, the guarantee holds for each of them alike: rendering a draft, publishing a revision, applying an authored edit, and importing a reproduced site." AC-849 is the REQ-107 owner; AC-686's own subject is the envelope *rule list* and the atomic-rename key rejection. AC-686 already deconflicts itself from AC-726/AC-728 in prose — the same treatment is missing here | Trim AC-686 ¶2 to a cross-reference to AC-849 ("these bounds apply wherever a site definition is validated — see the authored-envelope criterion"), leaving AC-686 to own the rule list and the atomic-rename key rejection |

## Notes for the Editor

- **Nothing repaired since the last ac cycle; nothing new broken.** All three
  violations and all four warnings below are **byte-identical** to REPORT-1670
  (`report-90d1930c`, 2026-08-08T00:17Z). No matrix element in CAP-70 has been
  edited since, and `packages/` has no commit since 2026-08-07 — so both the drift
  and the code it is measured against are exactly as that report left them. Every
  code claim above was nevertheless re-verified directly in this worktree
  (`contact-form/meta.ts`, `l1/palette.ts`, `l1/schema.ts`, `site-schema/schema.ts`,
  `framework/src/l1/render.ts`) rather than carried over.

- **AC-718 and AC-719 have now been named by three consecutive ac cycles**
  (REPORT-1315 on 2026-08-05, REPORT-1670 on 2026-08-08, and this one). They remain
  the only two `pending` ACs in the capability, under the only story with
  `fields.uat_coverage: stale`. If the fix loop is not landing them, the blocker is
  worth diagnosing before a fourth pass — see the operator note below.

- **A systematic sweep, not just a re-read.** All 96 AC bodies were scanned for the
  retired vocabulary of every retiring intent in the ledger: the `capability`
  runtime type (REQ-87), the `intro`/`submit` slots and `config.view` (REQ-96), the
  named colour role (REQ-114), and the deleted layout modules (REQ-84). **Every hit
  outside AC-718/AC-719 is a correct negative assertion or a benign fixture name** —
  AC-699 asserts `config.view` is *gone*; AC-933/AC-935 assert the colour-role
  vocabulary is *gone*; AC-682/683/688 say "hero **spike**", a test fixture, not the
  deleted `hero` module. The drift in this capability is genuinely confined to
  STORY-82's two ACs.

- **Sequencing matters this cycle.** Finding 3 is an `ac-add` that cannot be
  authored correctly until REPORT-1725's story-level findings 1a and 1b land
  (STORY-85's scope must first admit the page-level binding; STORY-83's
  inert-placeholder sentence must first become conditional). Findings 1 and 2 are
  the ac half of REPORT-1725 findings 2 and 3 and should be applied **in the same
  pass** as the STORY-82 body edit — applying the body edit alone leaves the drift
  live in exactly the place the UATs read it.

- **The STORY-82 merge question is still open and still a story-level call.**
  REPORT-1725's own closing note asks for it explicitly ("once corrected, it is
  worth an exclusivity look at the AC level"). Having now read both AC bodies: post
  REQ-96, AC-718's corrected content would restate AC-701 (contact-form's `form`
  slot and control leaves) and AC-719's would restate AC-716/AC-928 (L1 leaf colour
  axes) and AC-725/AC-726 (structured axes and their envelope). Their only distinct
  content is **provenance** — that these specific reproduction treatments are
  re-homed there. I have written Findings 1 and 2 as `ac-edit` rather than
  `ac-deprecate` because deprecating the story's entire AC set is a story-level
  decision this level cannot make. **If the editor holds the story-level authority
  in the same pass, deprecation is the cheaper answer.**

- **Four warnings, one shape.** Findings 4, 6 and 7 are the same pattern: an older,
  broader AC was widened by a later intent without the newer, narrower AC's arrival
  prompting a trim, so the two now overlap. None is load-bearing — the behaviour is
  covered either way — but each costs a duplicate UAT at the next level down.

- **No code issues.** Every divergence in this pass is matrix text lagging code that
  already implements the intent, and Finding 3 is a matrix gap in front of code that
  works.

- **No needs_review.** Every AC resolved cleanly, and the three places where the
  story body is unreliable (STORY-82's whole body; STORY-83's placeholder sentence;
  the REQ-93 silence) were resolvable against intent and code without guessing.

- **Operator note — tooling, not matrix.** This container reports
  `previous_attempts: 5`, yet **no capability_validation report for CAP-70 at any
  level exists between REPORT-1674 (2026-08-08T00:32Z) and REPORT-1725
  (2026-08-09T03:17Z)**, and no matrix edit landed in that window. This pass was
  itself blocked for roughly 25 minutes: `xgd ticket list --filter` fails with
  `index_fcntl_lock: timed out after 30000ms waiting for exclusive lock on
  .xgd/_locks/__cold_index__.flock`, held by a long-running dashboard process
  (PID 28114) amid nine concurrent dispatcher runners and two `xgd regression run`
  processes. `xgd ticket get` is unaffected. I completed the pass by building a
  read-only in-memory view through the ticketing module's own parser, which takes no
  lock. If earlier attempts died on that same contention it would explain five
  attempts leaving no artifact and no repair, and the fix belongs in the tooling,
  not in this matrix.
