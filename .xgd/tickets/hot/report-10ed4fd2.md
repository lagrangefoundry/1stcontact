---
uid: report-10ed4fd2
id: REPORT-2040
type: report
title: 'Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings,
  Components, Page Metadata & Generated Images (level=ac)'
created_by: xgd
created_at: '2026-08-16T01:25:01.695306+00:00'
updated_at: '2026-08-16T01:25:01.695306+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-2d32662d
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: Site Authoring Beyond The Element Tree: Settings, Components, Page Metadata & Generated Images
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Attempt 2 (previous_attempt_count = 1). CAP-94 (`capability-2d32662d`) holds exactly one
story — STORY-107 (`story-b3de4571`, `story_kind: feature`, status `completed`) — carrying
15 active acceptance criteria, AC-1095 … AC-1109, all `kind: behavior`,
`regression_only: false`. No AC is deprecated and none was added or removed since
REPORT-2034.

**This cycle reverses one classification made by REPORT-2034** (finding 1, the modal-reach
gap: violation → warning). The reasoning is set out in full under Findings and in Notes for
the Editor, because it is the difference between this level passing and failing.

## Cumulative Intent Considered

STORY-107's `intent_uid` is **BUNDLE-17** (`bundle-e59210c5`), a bundle of 8 source
requirements merged at `0198704b7e29db3c53cf569070042cec0eb467bc`. Only item 8 — **REQ-130**
— governs this capability. Items 6 (REQ-126, control surface) and 7 (REQ-129, L1 authoring)
are named dependencies whose ACs live under other capabilities (story-93905de4,
story-189fc1ac). Ledger re-derived and unchanged from REPORT-2034:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-17 (`bundle-e59210c5`) | free_and_reconciled | created 2026-08-10, merged at `0198704b7e29db3c53cf569070042cec0eb467bc` | Bundles REQ-119/121/122/126/127/128/129/130; carries STORY-107's intent | YES |
| REQ-130 (item 8) | free_and_reconciled | 2026-08-09 | Structured `set_config` (object-valued, merges at depth); component instantiation (`add_component`/`configure_component`/`remove_component`/`list_behaviors`, contract validation ahead of the site validator, optional presentation via L2 presets); page `seo` merged on update and rendered; `write_image` for assistant-composed SVG behind a closed-by-construction validator; generated filename with conflict-unless-replace; `DrawImages` as its own capability group | YES — the governing intent |
| REQ-126 (item 6) | free_and_reconciled | 2026-08-08 | Control surface: declaration, grant, error taxonomy, audit — dependency only | YES (owned elsewhere) |
| REQ-129 (item 7) | free_and_reconciled | 2026-08-09 | `get_l1`/`set_l1`; declares the click-to-edit modal **unchanged** — dependency only | YES (owned elsewhere) |
| REQ-134 | abandoned | 2026-08-12 | Proposed an image-generation component (providers behind one API) | NO — retired |
| REQ-131 | free_coded | 2026-08-11 | Draft change journal; no story under CAP-94 | not yet active here |
| REQ-133 / REQ-137 / REQ-140 | ready_to_reconcile / bundled | 2026-08-12 … 2026-08-15 | Palette popup, L1 palette shading, editor colour — editor/L1 surfaces; none carries a story under CAP-94, none retires a CAP-94 behaviour | no effect at ac level |

No intent in the ledger retires any behaviour STORY-107 describes. All four of REQ-130's
capability areas are live. REQ-137's imminent deletion of palette `steps` touches STORY-107's
*illustrative* wording, not any AC's criterion — recorded at story level (REPORT-2033
finding 1) and correctly not an ac-level item.

## Alignment Ledger

Level is `ac`: STORY-107's body is the working reference. REQ-130 was consulted only where
the story body is silent (noted per row). ACs carry no `intent_uid`/`updated_by` of their
own — alignment is inherited from STORY-107.

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-1095 group write + merge at every depth; list/scalar replaces | REQ-130 §1 | aligned — story: "two objects merge, a list or a scalar replaces" |
| AC-1096 group omitted → top level; non-object top-level write refused with a hint | REQ-130 §1 | aligned — story: "Omitting the group writes at the top level" |
| AC-1097 schema-invalid settings refused whole, site unchanged | REQ-130 §1 | aligned — story: "Nothing new is validated: the site's own schema already described these shapes" |
| AC-1098 catalog listable and closed; unknown kind → not-found naming what it holds | REQ-130 §2 | aligned — story: "The catalog can be listed with what each behaviour must be configured with"; closure matches the story's "the catalog is closed" out-of-scope clause |
| AC-1099 add with configuration alone (default look derived) **or** with a caller-supplied presentation; no-default-look + no presentation → refusal naming the seams | REQ-130 §2 | **aligned — gap closed since REPORT-2034.** Verified against code: `presetSlots` holds `contact-form` only (`packages/framework/src/l2/presets.ts:23-29`), `carousel` is a registered behavior with no preset (`packages/framework/src/modules/carousel/meta.ts:24`), `editModuleAdd` honours supplied slots and refuses otherwise naming the seams (`tools/generate/src/cli/edit.ts:1030-1038`), and `list_behaviors` publishes `hasDefaultPresentation` (`edit.ts:978`). Every clause the AC now states is real. |
| AC-1100 contract check ahead of the site validator; page unchanged | REQ-130 §2 | aligned — story: "refused at the field rather than discovered at render" |
| AC-1101 reconfigure merges; remove leaves the seam; not-found for either | REQ-130 §2 | aligned; merge-on-reconfigure is a refinement the story body does not state (finding 2) — real in code (`edit.ts:1062-1064`) |
| AC-1102 describe_page reports instances with name, kind, version, seam, config | REQ-130 §2 | aligned — story: "a page reports the instances already on it with their configuration" |
| AC-1103 seo written on create, merged on update, reaching the rendered head | REQ-130 §3 | aligned; the trailing empty-update refusal clause is a refinement (finding 4) |
| AC-1104 drawing becomes an ordinary site image, shipping unaltered | REQ-130 §4 | aligned |
| AC-1105 executable / external / embedding constructs refused whole, no byte written | REQ-130 security section; story Technical Context | aligned |
| AC-1106 closed by construction; unrecognised constructs refused; byte and element caps | REQ-130 security section; story Technical Context | aligned — distinct from AC-1105 (fail-closed grammar + bounds vs named constructs + atomicity), matching REQ-130's own separation of the closure property from the 15-payload sample |
| AC-1107 generated filename; no path accepted; conflict unless explicit replacement | REQ-130 security section, "Generated filename" | aligned to intent; story body Description is silent on naming (finding 3) |
| AC-1108 `DrawImages` is its own grantable group, separate from supplied-file management | REQ-130 §4 | aligned — story: "a separate grantable capability from managing files a person supplied" |
| AC-1109 all four capabilities reachable from the command line | REQ-130 §1 CLI note; story Technical Context naming note | aligned |
| STORY-107 — the operator's modal reaching *inside* an instantiated component | REQ-130 "⚠️ The operator's editor must not break" | gap, held at **warning** (finding 1) — behaviour is in REQ-130 and evidenced, but is not in STORY-107's body, and story level already adjudicated it |

Exclusivity re-checked pairwise across all 15: no two ACs state the same criterion. The
nearest pairs remain AC-1105/AC-1106 (named-forbidden constructs + whole-refusal atomicity
vs fail-closed grammar + caps) and AC-1096/AC-1097 (parameter-shape refusal at the top level
vs merged-result schema refusal); each pair has distinct triggers and distinct assertions.
AC-1099's widening introduced no overlap — no other AC under STORY-107 states the
supplied-presentation path.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | coverage | STORY-107 (no AC) | story-body-edit (downstream: optional ac-add) | REQ-130 states under "⚠️ The operator's editor must not break": "copy inside a component the **assistant** instantiated is addressable and editable in the modal, over the same `/api/copy` transport the browser uses", evidenced by `tests/test_UAT_FC_REQ-130_beyond_l1.test.ts:642`. No AC under STORY-107 expresses it. **Classified warning, not violation** — see Notes for the Editor: (a) the ac-level coverage test is defined against the story's behavioural surface, and STORY-107's body expresses only the forward claim (this capability's writes use the modal's single write path, and instantiation output is refined through the element-tree write path), not the reverse guarantee; (b) the story-level cycle ran first, examined this exact sentence of REQ-130, and held it at **warning** with `story-body-edit` as the primary repair, conditional on an unresolved ownership judgment (REPORT-2033, finding 2) — that level passed; (c) the level-cascade rule licenses escalation to intent at ac level only where the story body is internally inconsistent or ambiguous, and here it is neither, merely silent on a point story level already adjudicated. | Repair at story level first: extend STORY-107's Components paragraph to say that what a component instantiation produces is also reachable by the operator's click-to-edit modal like any other page content. Only if the editor rules the reverse guarantee is CAP-94's to hold should an `ac-add` follow, anchored on the shipped UAT. REPORT-2039 carries fully drafted AC text ready to paste if so. |
| 2 | info | consistency | AC-1101 | — | "A component's configuration is merged on reconfigure" is stated by neither STORY-107's body ("an instance can be added, reconfigured and removed") nor REQ-130 §2 explicitly, but is coherent with the story's settings and seo merge rules and real in code (`tools/generate/src/cli/edit.ts:1062-1064`: "Merged, so naming one setting leaves the rest alone"). Carried forward from REPORT-2034 so a later cycle does not read it as invention. | none |
| 3 | info | consistency | AC-1107 | — | The naming rules (one plain lowercase word, no path accepted, conflict unless explicit replacement) are grounded in REQ-130's security section, not in STORY-107's Description, which is silent on drawing names. Story level is the working reference here and is assumed correct; noted as a place the story body under-describes what the ACs correctly hold. | none (optional story-body tightening at the next story-level cycle) |
| 4 | info | consistency | AC-1103 | — | The trailing clause "An update naming none of title, path or search metadata is refused with a message saying what may be passed" is an argument-shape criterion for `update_page` that neither STORY-107's body nor REQ-130 §3 describes; `path`/`title` are the pre-existing update fields REQ-130 extends with `seo`. Conflicts with nothing, duplicates no AC. | none |
| 5 | info | coverage | AC-1099 | — | **REPORT-2034's finding 2 (warning) is resolved.** REPORT-2039 applied the `ac-edit`: AC-1099 now states that a caller-supplied presentation is what the instance mounts, is contract-checked like any other, reaches the render, and is the only route by which a kind carrying no default look is instantiated — with the carousel case in its Verification. Confirmed against code this cycle (see ledger row). The config-only default-look path and the no-default-look refusal survive verbatim. | none |
| 6 | info | — | AC-1095 … AC-1109 | — | None of the 15 ACs carries an `intent_uid` or `updated_by`; intent alignment is inherited entirely from STORY-107 (`intent_uid: bundle-e59210c5`). All 15 are `status: active`; no deprecated behaviour lingers. REQ-134 (abandoned, image-generation component) correctly has no expression anywhere in the AC set — the drawing ACs cover *writing a document the assistant composed*, not generating images through a provider. | none |

## Notes for the Editor

### Why finding 1 is a warning at this level, not a violation

This is a deliberate reversal of REPORT-2034, stated plainly so it can be overridden:

- **The ac-level coverage test is defined against the story body** — "do their ACs
  collectively cover the story's behavioural surface? Is there behaviour in the story body
  no AC addresses?" STORY-107's body claims that this capability's operations *go through*
  the same write path as the modal, and that instantiation output is refined through the
  element-tree write path. It does not claim the reverse — that the modal reaches into an
  instance by name and seam. Against the story's stated surface, the 15 ACs are complete.
- **Story level already ruled on this exact sentence.** REPORT-2033 (level=story, PASS)
  finding 2 quotes the same line of REQ-130, records the same absence, and holds it at
  **warning** with `story-body-edit` as the primary repair — explicitly conditioning any
  `ac-add` on an unresolved ownership question, since the modal guarantee is a regression
  proof over the click-to-edit capability (REQ-117/REQ-118) that another capability owns.
  The level cascade says ac level assumes story bodies are aligned and escalates to intent
  only where the story body is inconsistent or ambiguous. Promoting an upstream warning into
  a downstream blocking violation inverts that cascade.
- **The ownership question is genuinely open, and adjacent criteria already exist elsewhere.**
  AC-1093 / AC-1094 (STORY-106, `story-189fc1ac`) hold the modal-on-assistant-composed-content
  criteria. What REQ-130 adds is instance-name-plus-seam addressing — a refinement of an
  existing criterion family under a different story, not an unrepresented behaviour family.
  Deciding where it belongs is an editorial call, and this check must not make it by fiat.
- **Order of repair.** If the editor wants this in the matrix — a defensible position, since
  the addressing is what REQ-130 built — the sequence is story-body-edit at story level,
  then `ac-add` here. REPORT-2039 drafted the AC text verbatim and it is sound; the only
  thing it lacked was the `xgd ticket create` permission.

The permission blocker recorded in REPORT-2039 is *not* the reason for this classification,
and would not be a valid one. It is noted only because it means the finding cannot be
repaired by re-running the ac-level fix loop even if the editor overrides this call.

### Forwarded, unverified, and material to the next level

REPORT-2039 reports the suite red branch-wide — **74 failed / 1420 passed across 12 files**,
identically before and after its edits — with `Toolbox.run` returning a non-string where the
tests expect the answer string (`TypeError: answer.replace is not a function`), and names it
drift in the shared external `ai` package rather than this repo's code. **This cycle did not
run the suite** — test health is not an ac-level property — so the failure count is reported
as forwarded, not verified. The code pointer does check out: `aiCore()` imports the Toolbox
through `sharedModuleUrl('ai', './core')` (`tools/generate/src/cli/ai/toolbox.ts:96-99`),
i.e. from outside this worktree, so an external-drift explanation is at least mechanically
plausible.

Consequence for sequencing: if that report is accurate, ten of STORY-107's fifteen UATs are
red for a reason unrelated to the matrix, **including the very test that would be finding 1's
evidence**. A `uat`-level cycle run against this branch before that is resolved would report
evidence failures that are environmental, not drift. Worth resolving before the uat level is
allowed to mean anything.

### Nothing else moved

No AC was added, removed or deprecated since REPORT-2034. The only matrix mutation between
the two cycles is AC-1099's widening, which this cycle re-checked against `presets.ts`,
`carousel/meta.ts` and `edit.ts` and found accurate in every clause.
