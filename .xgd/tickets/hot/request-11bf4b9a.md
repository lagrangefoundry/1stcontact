---
uid: request-11bf4b9a
id: REQ-43
type: request
title: Module-contract template + stamp + publish-gate wiring
created_by: xgd
created_at: '2026-07-03T23:18:07.404402+00:00'
updated_at: '2026-08-22T21:57:14.352639+00:00'
completed_at: null
last_field_updated: body
status: abandoned
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-7db961ca
---

## Goal

Author the **module-contract template** (the 4 universal ACs + their thin shim UATs), the **stamp** mechanism that copies it into each module story, and the **publish-gate wiring** (draft-advisory / harden-mandatory). This is what turns the harness ([[REQ-39]]–[[REQ-42]]) into enforced matrix coverage on every module. Architecture: [[DOC-20]].

## Why

The capability matrix is a tree, not a DAG (no shared inheritance node), so each module story must own its leaf UATs. The tree-native substitute for inheritance is **template-and-stamp**: one template, machine-copied into every module ([[DOC-20]] "Template-and-stamp"). Without this, the harness exists but no module is actually held to it.

## Scope / behaviour

- **Template:** the 4 behavioral universal ACs (AC-M1 safety / AC-M2 security / AC-M3 cross-browser / AC-M4 responsive) kept **distinct** (so `proof.md` shows which dimension is unproven), each with its 3-line shim UAT calling `assertModuleConforms(slug, fixtures, { dimension, tier })`.

- **Fixtures:** mostly schema-derived (enumerate Zod variants + boundaries) with room for hand-tuned edge cases per module.

- **Exemption:** a module may opt out of a specific AC by declaring the AC id + a documented reason in its story; the opt-out is matrix-recorded and surfaced in `proof.md`.

- **Stamp:** the module-authoring / reconcile flow detects a module intent and stamps the template (ACs + shim UATs) onto the story, filling slug + fixtures. A change to the universal set is a **module-contract intent** that supersedes the stamped ACs across all module stories (fan-out, intent-owned — `FRAGILE` §3.2).

- **Publish gate:** wire `fast` conformance = advisory on draft/Tier-B, `full` conformance = mandatory at harden→Tier-A ([[REQ-17]] / [[DOC-14]]). This defines the hardening criteria those tickets leave abstract.

- Backfill: stamp the template onto the existing module set.

## Dependencies

[[REQ-39]] (core), [[REQ-40]] (security), [[REQ-41]] (responsive), [[REQ-42]] (cross-browser) — the dimensions must exist to be stamped. [[REQ-17]] / [[DOC-14]] (lifecycle gate).

## UATs (`test_UAT_FC_<TICKET-ID>_*`)

- `_stamp_adds_four_acs_and_shims` — stamping a module story yields 4 distinct ACs + 4 shim UATs bound to the slug.

- `_exemption_recorded_and_surfaced` — a declared AC opt-out is recorded on the story and shown in the evidence projection.

- `_contract_change_supersedes_across_modules` — bumping the universal set re-stamps all module stories as a superseding intent.

- `_publish_gate_blocks_nonconforming` — a module failing full conformance cannot promote to Tier-A; a conforming one can.

- `_existing_modules_backfilled` — the current module set carries the stamped contract.

## Out of scope

The long-term trait-AC / multi-surface (FRAGILE §6 gap #6) XGD primitive — tracked separately as the eventual replacement for prose duplication; this REQ is the tree-native short-term stamp.

## Notes

Framework code + matrix authoring → full free-coding ceremony. The template prose is duplicated per module by design (tree constraint); only the harness implementation is shared.


---

## ABANDONED — premise withdrawn by the framework pivot; backfill landed under REQ-85 (2026-08-22)

This ticket was written when a "module" was a *layout* unit (hero, services-grid, …),
the set was 8+ and growing with every design gap, and 4×M duplicated AC prose was the
dominant cost. The framework pivot (REQ-79 / REQ-84 / REQ-96) withdrew that model:
layout is owned by the L1 substrate ([[DOC-23]]) and a composition gap is closed by
adding a typed L1 primitive, never by a new module. "Module" now means a *behavior*
module — there are exactly two (`carousel`, `contact-form`), and [[DOC-26]] makes
authoring a new one the last resort at the highest bar. At M=2 with rare growth, the
stamp machinery costs more than the duplication it would remove.

Deliverable by deliverable:

- **Template (4 ACs).** Stale as written: [[REQ-85]] added a fifth dimension
  (`isolation`), so the prose would need re-authoring before it could be stamped.
- **Backfill.** Already landed, in code form, under [[REQ-85]]. Both behaviors declare
  the full obligation set — `packages/framework/src/modules/carousel/meta.ts:48` and
  `contact-form/meta.ts:79` (`conformance.obligations`) — which is the code-native
  equivalent of the stamp, and both are exercised across every dimension
  (`tests/req39-conformance.test.ts` … `req42-conformance-x-browser.test.ts`, plus
  `tests/req85-conformance.test.ts` for isolation, with a negative fixture proving the
  harness discriminates).
- **Publish gate (draft-advisory / harden-mandatory).** Survives as *process*, not code:
  [[DOC-26]] §4 defines the vetting obligations — contract, `validateBehavior*`, the
  five universal conformance ACs of [[DOC-20]], vetted `client.js`, security review —
  a behavior must clear before a site goes live on it. Its proposed code home,
  [[REQ-17]], is itself abandoned and closed to changes.
- **Stamp + supersession fan-out.** This is matrix authoring, which reconciliation
  derives from free-coded commits ([[DOC-21]]); it is really the XGD trait-AC /
  multi-surface primitive (`FRAGILE-INTENT-LIFECYCLE.md` §6 gap #6) that this ticket
  already listed as out of scope. Unchanged, still out of scope, still unowned here.

**One genuine remnant, currently unowned:** exemption *surfacing*. The harness accepts
an `except` list (`tools/generate/src/conformance/types.ts:53`) and honours it, but no
opt-out is recorded against a behavior's story or shown in the evidence projection — so
a declared exemption is invisible to `proof.md`. Small, real, and homeless now that
REQ-17 is closed; worth its own ticket if it is wanted.

No code was written against this ticket.