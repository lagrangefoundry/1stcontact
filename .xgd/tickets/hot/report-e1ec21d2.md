---
uid: report-e1ec21d2
id: REPORT-953
type: report
title: 'Reconciliation Plan: REQ-87 capability-module -> behavior-module rename'
created_by: xgd
created_at: '2026-07-24T22:36:55.262567+00:00'
updated_at: '2026-07-24T22:42:58.359055+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: request-84af044b
  anchor_uid: request-84af044b
  items:
  - index: 1
    component: Behavior-Module Contract & Catalog (packages/framework/src/modules)
    item_type: upgrade
    story_points: 2
    dependencies: []
    target_story_ids:
    - story-179b8c06
    intent_delta_summary: 'STORY-85 documents the runtime module-type under its pre-rename
      name (''capability module''). REQ-87 renames the type in place with no functional
      change: the exported contract is now the Behavior* family (BehaviorMeta, BehaviorConfigSpec,
      BehaviorConfigType, BehaviorSlotSpec, BehaviorSlotValue, BehaviorInstance, BehaviorDefinition,
      BehaviorConformance, BehaviorValidationError, AssertBehaviorMeta), the three
      validators are validateBehaviorConfig / validateBehaviorSlots / validateBehaviorInstance,
      the core file is modules/behavior.ts, and every catalog meta declares kind:
      ''behavior''. Retitle the story and its owning capability bucket CAP-72 (''Capability
      Module Contract & Catalog'' -> ''Behavior Module Contract & Catalog''), restate
      the story body in the new vocabulary, reword the ACs whose titles or bodies
      name the old type, and add one AC that pins the renamed contract surface and
      the atomic discriminant. Every behavioural obligation STORY-85 already asserts
      is preserved verbatim — config drives behaviour, slots mount validated L1, five-dimension
      conformance including isolation.'
    description: 'Restate STORY-85 in the renamed vocabulary and pin the new public
      contract. Code evidence: packages/framework/src/modules/capability.ts was git-mv''d
      to behavior.ts (260 lines, history preserved); packages/framework/src/index.ts
      and modules/index.ts re-export 8 renamed types + ConformanceObligation + BehaviorValidationError
      + AssertBehaviorMeta and the 3 renamed validators; registry.ts types the catalog
      as BehaviorDefinition[]; carousel/meta.ts and contact-form/meta.ts both changed
      kind: ''capability'' -> kind: ''behavior'' and now satisfy BehaviorMeta; tools/generate/src/render/render.ts
      imports BehaviorDefinition for its ModuleResolver type; the conformance harness/types/payloads
      restate the isolation dimension in behavior terms. No back-compat alias was
      added (CLAUDE.md no-legacy-modes rule). Deliberately preserved and NOT to be
      ''corrected'' downstream: the emitted asset filename capabilities.js (styles.ts:75,
      render.ts:118/166/170), the driver capability-negotiation wording in cli/capture/types.ts:103,
      and the English-word ''schema-only capability'' in site-schema/schema.ts:672.
      Two comment-only nits from the REQ-84/85 audit were folded into the same pass
      (styles.ts stale .hero/.header__inner selector note; contact-form enhance.ts
      -> client.js doc references) — comment-only, no AC of their own.'
    justification: 'No new capability bucket: this is the same behaviour surface STORY-85
      already owns (CAP-72), renamed. The runtime type, its validators, its discriminant,
      and its catalog are exactly the things STORY-85 documents, so the matrix must
      be corrected in place rather than forked into a parallel story — a new story
      would leave the matrix asserting a Capability* API that no longer exists. Binding
      FC evidence: tests/req87-behavior-rename.test.ts carries test_UAT_FC_REQ-87_behavior_meta_rename_validators_drive_the_contract
      and test_UAT_FC_REQ-87_discriminant_atomic_kind_is_behavior, neither of which
      has an AC yet; both land on this item''s added AC.'
    acceptance_criteria_changes:
      add:
      - 'The behavior-module contract is exported under the Behavior* names and every
        catalog module declares kind: ''behavior'' — BehaviorMeta plus validateBehaviorConfig
        / validateBehaviorSlots / validateBehaviorInstance resolve from the package
        root, the registry''s every meta carries the renamed discriminant, and no
        Capability* alias or ''capability'' discriminant survives anywhere in the
        contract. (Absorbs FC tests test_UAT_FC_REQ-87_behavior_meta_rename_validators_drive_the_contract
        and test_UAT_FC_REQ-87_discriminant_atomic_kind_is_behavior.)'
      modify:
      - 'AC-702 (acceptance_criterion-a2c7925e) — retitle ''Capability client behaviour
        ships as one page-referenced asset'' to ''Behavior client behaviour ships
        as one page-referenced asset''. IMPORTANT: the emitted artefact is still named
        capabilities.js and the page still references ./capabilities.js; the AC body
        must state that the asset filename is deliberately unchanged so a later reader
        does not treat it as missed rename residue.'
      - AC-704 (acceptance_criterion-ccefcbab) — retitle 'Survivor capabilities declare
        the full five-dimension conformance obligation set' to name behavior modules;
        obligation set (safety, security, x-browser, responsive, isolation) is unchanged.
      - AC-697 (acceptance_criterion-145872b3) — 'validated against the capability's
        typed contract' -> 'validated against the behavior's typed contract'; validator
        name in the body becomes validateBehaviorConfig.
      - 'AC-698 (acceptance_criterion-7761b6dd) — body prose only: the slot security
        line is owned by a behavior module; validator name becomes validateBehaviorSlots.
        Title unchanged.'
      - 'AC-703 (acceptance_criterion-9a05baf2) — body prose only: ''a misbehaving
        capability'' -> ''a misbehaving behavior''; the isolation dimension itself
        is unchanged.'
      remove: []
    story_uid: story-179b8c06
  - index: 2
    component: L1 slot seam (packages/site-schema/src/l1 + framework/src/l1/render.ts)
    item_type: upgrade
    story_points: 1
    dependencies: []
    target_story_ids:
    - story-d0a8cfad
    intent_delta_summary: STORY-83 documents the L1 substrate including the slot leaf,
      whose optional field recording the target module id was named 'capability'.
      REQ-87 renames that field to 'behavior' on the strict l1SlotSchema, and the
      single safe renderer now emits data-l1-behavior instead of data-l1-capability
      on the slot placeholder. Because l1SlotSchema is .strict(), the legacy key is
      no longer merely deprecated — it is an unknown key and the envelope rejects
      the document. Update AC-682 to name the renamed field and repair its stale fixture,
      extend AC-686 to record that the legacy key is now rejected as freeform, and
      add one AC for the rendered attribute, which no test currently asserts. The
      substrate's typed-tree, safety-envelope, and round-trip obligations are otherwise
      untouched.
    description: 'Document the renamed L1 slot seam. Code evidence: packages/site-schema/src/l1/schema.ts
      changes l1SlotSchema''s optional ''capability: z.string()'' to ''behavior: z.string()''
      (schema remains .strict()); packages/framework/src/l1/render.ts:213 emits data-l1-behavior="..."
      on the inert slot placeholder instead of data-l1-capability. VERIFIED REGRESSION
      (ran the suite this session): the rename missed one UAT fixture — tests/reconciliation-l1-substrate.test.ts:129
      still authors { kind: ''slot'', name: ''gallery'', capability: ''carousel''
      } and asserts validateL1(doc).ok === true, so test_UAT_AC682_valid_document_and_optional_primitives_accepted
      FAILS on this branch (1 failed | 9 passed across that file plus tests/req87-behavior-rename.test.ts).
      The free-code commit''s ''all tests pass'' claim predates that fixture: the
      commit is dated Jul 21 and the reconciliation UAT file belongs to STORY-83''s
      Jul 24 matrix work, so the grep-driven sweep could not have seen it. Repairing
      that fixture to the ''behavior'' key is part of this item''s UAT work.'
    justification: 'No new capability bucket: the slot leaf, the strict envelope,
      and the single safe emitter are already STORY-83''s subject matter under CAP-70,
      so this is a correction to what that story asserts, not a new capability. It
      cannot be folded into item 1 because it lives in a different capability bucket
      with different ACs — CAP-70 (L1 Layout Substrate + Safety Envelope) rather than
      CAP-72. Binding FC evidence: tests/req87-behavior-rename.test.ts carries test_UAT_FC_REQ-87_discriminant_atomic_l1_slot_seam_renamed_in_site_schema,
      which asserts both acceptance of the ''behavior'' key and rejection of the legacy
      ''capability'' key; it has no AC yet and lands on the AC-682/AC-686 modifications
      below.'
    acceptance_criteria_changes:
      add:
      - 'A slot leaf renders as an inert labelled placeholder carrying its target
        behavior module id — the emitter writes data-l1-slot for the slot name and
        data-l1-behavior for the module id, both HTML-escaped, and omits the behavior
        attribute when the field is absent. Currently unproven: no test asserts either
        attribute.'
      modify:
      - 'AC-682 (acceptance_criterion-62adf959) — name the slot leaf''s renamed optional
        field explicitly: a well-formed slot carries ''behavior'', not ''capability''.
        Its UAT fixture (tests/reconciliation-l1-substrate.test.ts:129) must be repaired
        to the renamed key; it currently fails.'
      - AC-686 (acceptance_criterion-33ecc306) — record that the legacy 'capability'
        slot key is now caught by the freeform/unknown-key rejection rule, so the
        rename is atomic rather than a tolerated alias. (Absorbs FC test test_UAT_FC_REQ-87_discriminant_atomic_l1_slot_seam_renamed_in_site_schema.)
      remove: []
    story_uid: null
---

# Reconciliation Plan — REQ-87 capability-module -> behavior-module rename

**Mode**: commits
**Anchor**: request-84af044b (REQ-87, a `request` — so it is itself the intent epic)
**Commit analysed**: `6cb7e8c4` on xgd-working, cherry-picked onto this branch as `7c55ef86`
**Target stories**: STORY-85 (story-179b8c06, CAP-72), STORY-83 (story-d0a8cfad, CAP-70)

## Step 0 — Intent

The operator declared a **mechanical rename with no functional change**. The word `capability` names two unrelated things: the XGD capability matrix (ticketing/reconcile) and the runtime framework module-type introduced by REQ-85. The runtime concept is renamed to **behavior module**, freeing `capability` to mean only the matrix.

Declared scope, from the body and its two amendments:
- ~12 types + ~9 functions renamed to American-spelled `Behavior*`; `modules/capability.ts` -> `behavior.ts` via git mv.
- Discriminant `kind: 'capability'` -> `kind: 'behavior'`, atomic across `modules/`, `site-schema`, `tools/generate/src/conformance`, and every UAT fixture.
- **No back-compat alias** (CLAUDE.md no-legacy-modes rule).
- Doc tickets DOC-25 / DOC-26 renamed; DOC-8 / DOC-20 / DOC-21 and the REQ-79 / REQ-85 bodies updated.
- Explicitly **out of scope**: the XGD capability-matrix vocabulary, which is left untouched — that separation is the entire point of the ticket.
- Folded in: two comment-only nits from the REQ-84/85 audit (`styles.ts` stale `.hero` / `.header__inner` selector note; `contact-form` dead `enhance.ts` references).
- Sequencing note: REQ-86 landed before this rename, so its files were swept grep-driven rather than from a list.

The anchor carries no chat comments; the body plus its two appended amendment sections are the whole intent record. Verified: DOC-25 (doc-20979492) and DOC-26 (doc-61ec479a) already read `Behavior Modules` / `Behavior-Module Authoring`, so the doc half of the intent is done.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commit 6cb7e8c4 — refactor(framework): rename capability-module type -> behavior module"
  entry_files:
    - packages/framework/src/modules/behavior.ts        # git mv from capability.ts, 260 lines
    - packages/framework/src/modules/index.ts
    - packages/framework/src/index.ts
    - packages/framework/src/modules/registry.ts
    - packages/framework/src/modules/carousel/meta.ts
    - packages/framework/src/modules/contact-form/meta.ts
    - packages/site-schema/src/l1/schema.ts
    - packages/site-schema/src/schema.ts
    - packages/framework/src/l1/render.ts
    - tools/generate/src/conformance/{types,harness,payloads}.ts
    - tools/generate/src/render/render.ts
    - tools/generate/src/cli/scaffold.ts
  features:
    - name: Behavior-module contract (public framework API)
      description: >
        The vetted-core contract REQ-85 introduced, renamed in place. Eight contract
        types plus BehaviorValidationError and AssertBehaviorMeta are re-exported from
        the package root; three validators are renamed. Shapes, fields, and semantics
        are byte-for-byte the REQ-85 contract — only the identifiers moved.
      behaviors:
        - "CapabilityMeta / ConfigSpec / ConfigType / SlotSpec / SlotValue / Instance / Definition / Conformance -> Behavior*"
        - "CapabilityValidationError -> BehaviorValidationError; AssertCapabilityMeta -> AssertBehaviorMeta"
        - "validateCapabilityConfig|Slots|Instance -> validateBehaviorConfig|Slots|Instance"
        - "registry catalog typed BehaviorDefinition[]; getModule returns BehaviorDefinition"
        - "tools/generate ModuleResolver returns BehaviorDefinition"
        - "no back-compat alias for any old name"
      entry_point: packages/framework/src/index.ts
    - name: kind discriminant on every catalog meta
      description: The literal discriminant every module meta declares, changed atomically.
      behaviors:
        - "carousel@2 and contact-form@3 both declare kind: 'behavior'"
        - "every registry entry carries the renamed discriminant"
        - "conformance payloads/fixtures updated in the same commit"
      entry_point: packages/framework/src/modules/{carousel,contact-form}/meta.ts
    - name: L1 slot seam — schema field and render attribute
      description: >
        The Phase-D seam where a behavior module mounts inside an L1 tree. The slot
        leaf's optional module-id field is renamed, and the single safe emitter's
        output attribute follows it. l1SlotSchema is .strict(), so the old key is not
        deprecated — it is rejected as an unknown key.
      behaviors:
        - "l1SlotSchema: optional 'capability' -> optional 'behavior' (schema stays .strict())"
        - "renderer emits data-l1-behavior instead of data-l1-capability, HTML-escaped, omitted when absent"
        - "a slot authored with the legacy 'capability' key now fails envelope validation"
      entry_point: packages/site-schema/src/l1/schema.ts, packages/framework/src/l1/render.ts:213
    - name: Deliberately preserved 'capability' vocabulary
      description: Non-changes the commit message pins explicitly; downstream must not 'fix' these.
      behaviors:
        - "emitted asset filename capabilities.js and the ./capabilities.js page reference"
        - "driver capability negotiation (cli/capture/types.ts:103) — English word"
        - "'not a schema-only capability' (site-schema/schema.ts:672) — English word"
        - "the whole XGD capability-matrix vocabulary"
      entry_point: n/a
    - name: Comment-only nits folded in
      description: Zero runtime effect; no AC of their own, recorded here for traceability.
      behaviors:
        - "styles.ts:17-18 stale .hero / .header__inner selector note -> .carousel__track / .contact-form__field"
        - "contact-form index.astro + meta.ts: dead enhance.ts references -> client.js"
      entry_point: n/a
```

## Coverage Map

```yaml
coverage_map:
  - feature: Behavior-module contract (public framework API)
    status: partial
    existing_stories: [story-179b8c06]   # STORY-85, CAP-72
    existing_acs: [acceptance_criterion-145872b3, acceptance_criterion-7761b6dd, acceptance_criterion-a2c7925e, acceptance_criterion-ccefcbab, acceptance_criterion-9a05baf2]
    gaps:
      - Story title, body, and five AC titles/bodies still say 'capability module'; the matrix asserts an API surface that no longer exists.
      - No AC pins the exported Behavior* names or the absence of a back-compat alias.
      - Owning capability bucket CAP-72 is itself titled 'Capability Module Contract & Catalog'.
    notes:
      - Behavioural obligations (config drives behaviour, slots mount validated L1, five-dimension conformance) are unchanged and must survive the reword verbatim.
  - feature: kind discriminant on every catalog meta
    status: partial
    existing_stories: [story-179b8c06]
    existing_acs: []
    gaps:
      - No AC has ever asserted the discriminant literal; the rename makes it worth pinning so a future drift is caught.
    notes:
      - Covered by the same added AC as the contract rename — one AC, not two.
  - feature: L1 slot seam — schema field and render attribute
    status: partial
    existing_stories: [story-d0a8cfad]   # STORY-83, CAP-70
    existing_acs: [acceptance_criterion-62adf959, acceptance_criterion-33ecc306]
    gaps:
      - AC-682's UAT fixture still authors the legacy 'capability' slot key and FAILS on this branch.
      - AC-686 does not record that the legacy key is now rejected as an unknown key.
      - The rendered data-l1-behavior attribute is asserted by no test at all.
    notes:
      - Different capability bucket from item 1 (CAP-70 vs CAP-72), so it cannot be folded into one item.
  - feature: Deliberately preserved 'capability' vocabulary
    status: covered
    existing_stories: [story-179b8c06]
    existing_acs: [acceptance_criterion-a2c7925e]
    gaps: []
    notes:
      - No plan item. Recorded as an explicit non-change in AC-702's modification so the capabilities.js filename is not later mistaken for missed residue.
  - feature: Comment-only nits folded in
    status: covered
    existing_stories: []
    existing_acs: []
    gaps: []
    notes:
      - Fails the justification test — no user-visible capability. Deliberately NOT a plan item.
```

## Plan Items

| # | Component | Type | Points | Deps | Target story | Description |
|---|-----------|------|--------|------|--------------|-------------|
| 1 | Behavior-Module Contract & Catalog | upgrade | 2 | - | story-179b8c06 (STORY-85, CAP-72) | Restate the story + bucket in the renamed vocabulary; reword 5 ACs; add 1 AC pinning the Behavior* surface and the `kind: 'behavior'` discriminant |
| 2 | L1 slot seam | upgrade | 1 | - | story-d0a8cfad (STORY-83, CAP-70) | Rename the slot field in AC-682 and repair its failing fixture; extend AC-686 to the rejected legacy key; add 1 AC for the `data-l1-behavior` render attribute |

Total: 3 points, 2 items (feature: 0, upgrade: 2) — matching the anchor's declared `story_points: 3`.

## Step 3b — Intent scope vs implementation footprint

**Case 2 (explicit supersession) — the whole of this change.** REQ-87 knowingly renames what REQ-85 established. STORY-85 and STORY-83 are the prior intents being superseded, and both get upgrade items. No behaviour is added or removed; every REQ-85 obligation must survive the reword.

**Case 3 (undeclared footprint) — none found.** The commit touches six test files owned by other stories (`framework-content-modules`, `framework-tokens`, `generate`, `req39/40/41-conformance`, `req85-*`), but every edit is a discriminant literal in a fixture or a prose comment — exactly the 'all UAT fixtures/snapshots' the intent declares. No story outside CAP-70 / CAP-72 changes behaviour, so no plan item absorbs foreign behaviour into this intent.

**One case-3-adjacent finding**, recorded rather than absorbed: `tests/reconciliation-l1-substrate.test.ts` is STORY-83's own reconciliation UAT file, authored on main **after** the free-code commit was written, so the grep-driven sweep never saw it. It belongs to STORY-83, and item 2 corrects it there — not by inventing a new story under REQ-87.

## Observations

- **A test currently fails on this branch.** Ran `npx vitest run tests/reconciliation-l1-substrate.test.ts tests/req87-behavior-rename.test.ts` (after `pnpm --filter @1stcontact/site-schema build`, which a fresh worktree needs): **1 failed | 9 passed**. `test_UAT_AC682_valid_document_and_optional_primitives_accepted` fails because line 129 authors `{ kind: 'slot', name: 'gallery', capability: 'carousel' }` and asserts the document validates — but `l1SlotSchema` is `.strict()`, so the legacy key is now an unknown key. The commit message's '531 tests pass' was true when written (Jul 21); the fixture is Jul 24 matrix work. Item 2 owns the repair. All three REQ-87 FC tests pass.
- **FC tests are TypeScript, so the injected `fc_tests` list was empty.** The discovery glob looks for `test_UAT_FC_<TICKET>_*.py`; this project's FC tests live in `tests/req87-behavior-rename.test.ts` with three `test_UAT_FC_REQ-87_*` cases. They are treated as binding evidence here: tests 1 and 2 land on item 1's added AC, test 3 on item 2's AC-682/AC-686 modifications. Every FC test is covered, so `check_fc_orphans` should find none orphaned — but the empty list is a latent gap in FC discovery for non-Python projects.
- **Two items, not eight.** The rename touches 32 files across three packages, which invites one-item-per-package inflation. It is one intent with two observable seams sitting in two different capability buckets, so it decomposes to exactly two upgrades. Type renames inside a single bucket are AC rewordings, not stories.
- **Zero feature items.** Nothing new exists after this commit that did not exist before it — that is the definition of a mechanical rename, and the matrix should record it as a correction rather than growth.
- **`capabilities.js` is a deliberate non-change and the likeliest future false positive.** The emitted asset keeps its old name while everything around it renamed. AC-702's modification is written to say so explicitly, so a later reader does not 'complete' the rename and break the page reference.
- **Cosmetic prose residue remains in test files** — `tests/req85-capability-contract.test.ts` keeps its filename, and several `describe` strings and comments in `req85-*`, `framework-content-modules`, `generate`, and `chat9-edit-hooks` still say 'capability module'. The intent's acceptance wording is that no `'capability'` **discriminant** remains, which holds. Comment-and-filename residue carries no behaviour, so it is not a plan item; noted here in case the operator wants a follow-up sweep ticket.