---
uid: report-3ee1144f
id: REPORT-2034
type: report
title: 'Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings,
  Components, Page Metadata & Generated Images (level=ac)'
created_by: xgd
created_at: '2026-08-16T00:56:31.403400+00:00'
updated_at: '2026-08-16T00:56:31.403400+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-2d32662d
  level: ac
  violations: 1
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata & Generated Images
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 1
**Needs review**: 0

Capability CAP-94 (capability-2d32662d) holds exactly one story — STORY-107
(story-b3de4571, `story_kind: feature`, status `completed`) — carrying 15 active
acceptance criteria, AC-1095 … AC-1109. All 15 are `kind: behavior`,
`regression_only: false`.

## Cumulative Intent Considered

STORY-107's `intent_uid` is **BUNDLE-17** (bundle-e59210c5), a bundle of 8 source
requirements. Only item 8 — **REQ-130** — governs this capability; items 6 (REQ-126,
control surface) and 7 (REQ-129, L1 authoring) are named dependencies whose ACs live
under other capabilities (story-93905de4, story-189fc1ac).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-17 (bundle-e59210c5) | free_and_reconciled | created 2026-08-10, merged at `0198704b7e29db3c53cf569070042cec0eb467bc` | Bundles REQ-119/121/122/126/127/128/129/130; carries STORY-107's intent | YES |
| REQ-130 (item 8 of BUNDLE-17) | free_and_reconciled | 2026-08-09 | Structured `set_config` (object-valued, merges at depth), component instantiation (`add_component`/`configure_component`/`remove_component`/`list_behaviors`, contract validation, optional presentation via L2 presets), page `seo` merged on update and rendered, `write_image` for assistant-composed SVG with a closed-by-construction validator, generated filename, `DrawImages` as its own capability group | YES — the governing intent |
| REQ-126 (item 6) | free_and_reconciled | 2026-08-08 | Control surface: declaration, grant, error taxonomy, audit — dependency only | YES (owned elsewhere) |
| REQ-129 (item 7) | free_and_reconciled | 2026-08-09 | `get_l1`/`set_l1`; states explicitly "click-to-edit modal unchanged" — dependency only | YES (owned elsewhere) |
| REQ-134 | abandoned | 2026-08-12 | Proposed an image-generation component (several providers behind one API) | NO — retired |
| REQ-131 | free_coded | 2026-08-11 | Draft change journal; not reconciled, no story under CAP-94 | not yet active here |
| REQ-133 / REQ-137 / REQ-140 | ready_to_reconcile / bundled | 2026-08-12 … 2026-08-15 | Palette popup, L1 palette shading, editor colour — editor/L1 surfaces; none carries a story under CAP-94, none retires a CAP-94 behaviour | no effect on this capability |

No intent in the ledger retires any behaviour STORY-107 describes. The whole of
REQ-130's four capability areas is live.

## Alignment Ledger

Level is `ac`, so STORY-107's body is the working reference; REQ-130 was consulted
where the story body is silent (noted per row). ACs carry no `intent_uid` of their
own — alignment is inherited from STORY-107 (`intent_uid: bundle-e59210c5`).

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1095 group write + depth merge | REQ-130 §1 | aligned — story: "two objects merge, a list or a scalar replaces" |
| AC-1096 group omitted → top level; non-object refused | REQ-130 §1 | aligned — story: "Omitting the group writes at the top level" |
| AC-1097 schema-invalid settings refused whole | REQ-130 §1 | aligned — story: "Nothing new is validated: the site's own schema already described these shapes" |
| AC-1098 catalog listable and closed | REQ-130 §2 | aligned — story: "listed with what each behaviour must be configured with and what its settings accept"; closure matches "a miss names what it holds" |
| AC-1099 add with configuration alone, default look from config | REQ-130 §2 | aligned on the default-look path; gap on the supplied-presentation path (finding 2) |
| AC-1100 contract check ahead of the site validator | REQ-130 §2 | aligned — story: "refused at the field rather than discovered at render" |
| AC-1101 reconfigure merges; remove leaves the seam | REQ-130 §2 | aligned; merge-on-reconfigure is a refinement the story body does not state (finding 3) |
| AC-1102 describe_page reports instances + config | REQ-130 §2 | aligned — story: "a page reports the instances already on it with their configuration" |
| AC-1103 seo written, merged, rendered | REQ-130 §3 | aligned; trailing empty-update refusal clause is a refinement (finding 5) |
| AC-1104 drawing is an ordinary image, ships unaltered | REQ-130 §4 | aligned |
| AC-1105 executable/external/embedding refused whole | REQ-130 security section, story Technical Context | aligned |
| AC-1106 closed by construction; byte and element caps | REQ-130 security section, story Technical Context | aligned — distinct from AC-1105 (fail-closed grammar + caps vs named constructs + atomicity) |
| AC-1107 generated filename, conflict unless replace | REQ-130 security section, "Generated filename" | aligned to intent; story body Description is silent on naming (finding 4) |
| AC-1108 DrawImages is its own grantable group | REQ-130 §4 | aligned — story: "a separate grantable capability from managing files a person supplied" |
| AC-1109 all four reachable from the command line | REQ-130 §1 CLI note, story Technical Context naming note | aligned |
| STORY-107 — modal reach into an instantiated component | REQ-130 "⚠️ The operator's editor must not break" | **gap: intent proves it, no AC expresses it** (finding 1) |

Exclusivity was checked pairwise across all 15: no two ACs state the same criterion.
The nearest pairs are AC-1105/AC-1106 (named-forbidden constructs and whole-refusal
atomicity vs fail-closed grammar and caps) and AC-1096/AC-1097 (parameter-shape
refusal at the top level vs merged-result schema refusal) — each pair has distinct
triggers and distinct assertions.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-107 (no AC) | ac-add | REQ-130 (free_and_reconciled) states under "⚠️ The operator's editor must not break": "Additionally proven rather than assumed: copy inside a component the **assistant** instantiated is addressable and editable in the modal, over the same `/api/copy` transport the browser uses." No AC under STORY-107 expresses this. AC-1102 covers only the instance list `describe_page` returns, not that the page's segment map reaches *inside* an instance with module/seam addressing, nor that a save through the operator's transport lands in the instance's seam. It is not covered elsewhere either: AC-1093/AC-1094 (STORY-106, story-189fc1ac) are scoped to assistant-composed L1 elements, and their intent REQ-129 declares the modal "unchanged". Evidence for the behaviour already ships — `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:642` `test_UAT_FC_REQ_130_copy_inside_the_component_is_addressable_and_editable` — with no matrix element to bind to. | Author an AC under STORY-107, e.g. "Content inside a component the assistant instantiated is addressable in the page's map by seam, and editable through the operator's click-to-edit form": `describe_page`'s segments carry the instance name and seam for content inside the instance; reading and saving that address over the operator's own transport succeeds and the change lands in the instance's seam. Bind the existing UAT at `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:642` to it. |
| 2 | warning | coverage | AC-1099 | ac-add | STORY-107 states "Supplying a presentation is optional", and `add_component` accepts an optional `presentation` parameter (`tools/generate/src/cli/ai/toolbox.ts:312`, passed through as `slots`). AC-1099 asserts only the two paths where presentation is *absent*: the default-look success path, and the refusal when a kind carries no default look. No AC asserts that a caller-supplied presentation is accepted and honoured — which is the only route AC-1099's own refusal clause leaves for a kind that carries no default look. | Extend AC-1099 (or add a sibling AC) with the supplied-presentation path: adding a component with an explicit presentation binds that presentation into the page and the instance renders, including for a kind carrying no default look. |
| 3 | info | consistency | AC-1101 | — | "A component's configuration is merged on reconfigure" is a semantic neither STORY-107's body ("an instance can be added, reconfigured and removed") nor REQ-130 §2 states explicitly. It is coherent with the story's settings and seo merge rules and is exercised by `test_UAT_AC1101`; recorded so a future check does not read it as later invention. | none |
| 4 | info | consistency | AC-1107 | — | The naming rules (one plain lowercase word, no path accepted, conflict unless explicit replacement) are grounded in REQ-130's security section ("Generated filename: one lowercase word → `<stem>.svg` … Conflict unless `replace`"), not in STORY-107's Description, which is silent on drawing names. Story level is assumed correct at this level; noted as a place the story body under-describes what the ACs correctly hold. | none (optional story-body tightening at the next story-level cycle) |
| 5 | info | consistency | AC-1103 | — | The trailing clause "An update naming none of title, path or search metadata is refused with a message saying what may be passed" is an argument-shape criterion for `update_page` that neither STORY-107's body nor REQ-130 §3 describes; `path`/`title` are the pre-existing update fields REQ-130 extends with `seo`. It conflicts with nothing and duplicates no AC in the sibling story (story-189fc1ac holds no page create/update AC). | none |
| 6 | info | — | AC-1095 … AC-1109 | — | None of the 15 ACs carries an `intent_uid` or `updated_by` field; intent alignment is inherited entirely from STORY-107 (`intent_uid: bundle-e59210c5`). Every AC is `status: active`; none is deprecated, and no deprecated behaviour was found lingering. | none |

## Notes for the Editor

- **One repair is required to pass this level**: finding 1, an `ac-add` under
  STORY-107. The evidence for it already exists and is green — this is a matrix gap,
  not a code or test gap, so the new AC can be written against the shipped UAT rather
  than needing new test work.

- **Ownership note for finding 1.** The modal invariant appears in two intents with
  different scopes: REQ-129 (STORY-106) holds it for assistant-composed L1 elements
  and explicitly declares the modal unchanged; REQ-130 (STORY-107) adds reach *inside*
  a module instance, addressed by instance name and seam. The new AC belongs under
  STORY-107 — the instance addressing is what REQ-130 built — not as a widening of
  AC-1093.

- **Cross-cutting pattern (findings 3–5).** Three ACs state refinements that are
  correct against REQ-130 or the built behaviour but are not visible in STORY-107's
  body: reconfigure-merges, drawing filename/conflict rules, and the empty-update
  refusal. None is drift today. If a story-level cycle runs again on this capability,
  the story body's Description is the thing to widen, not the ACs.

- **No exclusivity problems and no retired behaviour.** REQ-134 (image generation
  component) is `abandoned` and, correctly, has no expression anywhere in this
  capability's AC set — the drawing ACs (AC-1104 … AC-1108) cover *writing a document
  the assistant composed*, not generating images through a provider, so there is no
  abandoned-intent residue to remove.
