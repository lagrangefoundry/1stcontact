---
uid: request-84af044b
id: REQ-87
type: request
title: Rename capability-module type → behavior module (disambiguate from XGD capability
  matrix)
created_by: xgd
created_at: '2026-07-21T20:25:16.483623+00:00'
updated_at: '2026-07-22T18:40:52.541058+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: dd936736d5c1b5631315111f6a6c2ddd6862efe0
    reconcile_sha: null
    main_sha: null
  version: 0.0.169
  story_points: 3
---

Part of the framework pivot — see **REQ-79 (request-87b26bca)**. Renames the runtime module-type introduced by **REQ-85 (request-015e42ac)**.

## Motivation
The word "capability" is overloaded: it names both the **XGD capability matrix** (ticketing/reconcile concept — what the *system* can do) and the runtime **framework module type** introduced in REQ-85 (a vetted behavioural core + typed config + named L1 presentation slots). The collision is a persistent source of confusion in tickets, docs, and conversation. Rename the runtime concept to **behavior module** — it names the thing by the part the framework actually owns (the vetted behaviour), and frees "capability" to mean only the matrix.

## Behaviour (mechanical rename — no functional change)
- Identifiers use **American** spelling: `CapabilityMeta` → `BehaviorMeta`, `CapabilitySlotValue` → `BehaviorSlotValue`, `validateCapabilityConfig` → `validateBehaviorConfig`, etc. (~12 types + ~9 functions).
- File `packages/framework/src/modules/capability.ts` → `behavior.ts` (git mv, preserve history).
- **Discriminant literal** `kind: 'capability'` → `kind: 'behavior'` — must change atomically across `modules/`, `packages/site-schema`, `tools/generate/src/conformance`, and all UAT fixtures/snapshots.
- lowercase mentions (vars, comments, JSDoc) updated for consistency.

## Docs (same session)
- CLAUDE.md "a module now means a capability" paragraph → "behavior module"; align British "behavioural" prose to American where it names the type.
- Update REQ-79, REQ-85 bodies, the Capability-Modules spec doc → Behavior-Modules, and DOC-8 / DOC-20 / DOC-21 references.

## Acceptance (UAT — `test_UAT_FC_<this REQ id>_*`)
- `behavior_meta_rename`: the renamed contract (`BehaviorMeta`, `validateBehavior*`) compiles and the existing REQ-85 behaviour is preserved (carousel + contact-form still validate, config drives behaviour, slots mount L1).
- `discriminant_atomic`: `kind: 'behavior'` flows through site-schema + conformance harness; no `'capability'` discriminant remains.
- No back-compat alias for the old names (CLAUDE.md: no legacy modes).

## Verify
- Clean workspace typecheck (`tsc`) across packages — catches any missed discriminant occurrence.


---

## Added scope: sweep two cosmetic comment nits (from REQ-84 / REQ-85 audit)

While the rename already rewrites the comments in these exact files, fold in two stale comment fixes surfaced by the pivot audit (comment-only, no behaviour change — do them in the same pass):

- **`packages/framework/src/modules/styles.ts:17-18`** — stale `.hero` / `.header__inner` selector comment referencing deleted layout modules (REQ-84 residue). Remove/correct it.
- **`packages/framework/src/modules/contact-form/`** — two dead references to the removed `enhance.ts` in doc-comments (`index.astro` header and `meta.ts`); the enhancement migrated to `contact-form/client.js` in REQ-85. Update the comments to name `client.js`.

These are the only known residual nits from the REQ-82–85 audit; both live in files this rename already touches.

## Doc numbers (pin for the rename pass)
The "Capability-Modules spec doc" = **DOC-25** (Capability Modules — Contract & Catalog) → rename to Behavior Modules. Also update **DOC-26** (Capability-Module Authoring & Vetting Process), and the DOC-8 / DOC-20 / DOC-21 references, plus REQ-79 / REQ-85 bodies. Note the discriminant/type rename does NOT touch the XGD **capability matrix** vocabulary — leave all matrix/reconcile "capability" usage untouched; that separation is the whole point.

## Sequencing note
REQ-86 (end-to-end reproduction) already landed **before** this rename, so REQ-86's code + its DOC-19/15/16 updates also carry the old `capability` vocabulary — include REQ-86's touched files in the rename sweep (grep-driven, not from this list).

-