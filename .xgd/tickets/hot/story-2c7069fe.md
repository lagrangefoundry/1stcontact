---
uid: story-2c7069fe
id: STORY-78
type: story
title: 'Responsive-diff: cross-size N-way node analysis with change classifier'
created_by: xgd
created_at: '2026-07-19T02:50:30.568218+00:00'
updated_at: '2026-07-19T02:50:30.568218+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-18a822ac
  story_kind: feature
  story_points: 3
---

## Story
**As a** reproduction author driving a captured site toward per-breakpoint fidelity, **I want** a single command that lines up one captured site's nodes across the viewport ladder into a side-by-side table and labels how each node changes, **so that** I can see at a glance which nodes step, reflow, or appear/disappear between sizes and author the right per-breakpoint override for each.

## Description
Adds the standalone `1c responsive-diff` command. Unlike `values-diff` and pixel `diff`, this is NOT a reproduction-vs-reference comparison — it analyses ONE captured site across sizes. It reads the per-width value manifests that a multi-viewport capture already persisted (the viewport ladder) and lines the nodes up into an **N-way per-node table**: one row per DOM node, one column per size, so each node's value trajectory reads left-to-right.

In scope:
- Build the N-way table across the requested sizes (default mobile, tablet, desktop; selectable and orderable via `--sizes`).
- Align nodes by join key (normalized text, or accessibility role for text-free nodes) in document order, mirroring `values-diff` pairing — including occurrence-by-occurrence alignment of repeated identical text.
- Mark each node as changed vs steady, and flag nodes present in some sizes but not all as presence flips.
- `--classify` labels each changed node by its reproduction move: `presence-flip`, `layout-swap`, or `value-step`, grouped structural-moves-first.
- Human-readable table/classification by default; `--json` for machine consumption; optional `--out <file>` to persist the table.
- Terminal-fail loudly on a stale reference (no persisted ladder) or an un-captured requested width — never silently drop a column.

Out of scope: reproduction fidelity between transitions (this captures the discrete state at each size, not a continuous relationship); authoring the per-breakpoint overrides themselves (that is the framework's per-breakpoint dial capability).

## Technical Context
Reproduces REQ-61 behaviour from the bundle-ab9e0cb6 reconciliation (commits b92a5cbe N-way table Phase 1, cb388975 classifier Phase 2). Belongs to CAP-65 (1c Size-Aware Diffing), whose body already reserves this downstream `responsive-diff` command; it reads the same persisted viewport ladder that CAP-65's `--size` diff work (plan item 3) establishes, hence the dependency. Change detection is deliberately a small discrete-state signal (font size, weight, colour, rounded box geometry, arrangement), not an exhaustive style diff; geometry is rounded so sub-pixel jitter never reads as a change. The command is invoked as `1c responsive-diff --ref <captureBundleDir> [--sizes mobile,tablet,desktop] [--classify] [--out <file>] [--json]`.

Divergence note: the reconciliation plan described a positional slug; the implemented CLI takes the bundle via a required `--ref` flag. The story is grounded in the implemented `--ref` interface.

## Dependencies
Plan item 3 — 1c Size-Aware Diffing (the persisted viewport ladder this command reads).

## Story Points
3
