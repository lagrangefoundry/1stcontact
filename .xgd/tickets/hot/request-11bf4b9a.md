---
uid: request-11bf4b9a
id: REQ-43
type: request
title: Module-contract template + stamp + publish-gate wiring
created_by: xgd
created_at: '2026-07-03T23:18:07.404402+00:00'
updated_at: '2026-08-20T21:38:39.178064+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
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