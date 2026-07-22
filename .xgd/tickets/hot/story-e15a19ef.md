---
uid: story-e15a19ef
id: STORY-79
type: story
title: '1c CLI: flags parse correctly, propagate into sub-commands, and --json emits
  a clean scriptable document'
created_by: xgd
created_at: '2026-07-19T03:01:20.536179+00:00'
updated_at: '2026-07-22T20:52:23.123270+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-ac7ca849
  story_kind: upgrade
  story_points: 1
  updated_by:
  - bundle-31e474b9
---

## Story
**As a** user scripting the `1c` CLI, **I want** flags to be parsed correctly, to
propagate into the commands a sub-command drives, and `--json` output to be a single
clean JSON document, **so that** I can invoke `1c` commands in any flag order, trust
that a store-selecting flag reaches the render/serve it triggers, and pipe
machine-readable output straight into other tools without it breaking.

## Description
Three CLI-correctness guarantees for the `1c` command line:

1. **Boolean flag parsing.** The `--multi-viewport` flag is a boolean toggle, not
   a value-taking option. Invoking `values-diff --multi-viewport <slug>` (or
   `values-diff <slug> --multi-viewport`) preserves `<slug>` as a positional in
   either order, instead of the flag consuming `<slug>` as its value and failing
   with a missing-slug error.

2. **`--json` output hygiene.** A `values-diff` command run with `--json` prints
   exactly one well-formed JSON document to stdout. The in-process Astro/Vite
   render emits diagnostics — dependency re-optimization notices, deprecation
   warnings, and a one-time "Missing pages directory" bootstrap warning — that
   previously landed on stdout and corrupted the JSON. Those diagnostics are now
   routed to stderr for both human and JSON modes, so stdout carries only the
   command's own output. Stdout is restored after the command runs, including
   when the command's computation fails, so it is never left permanently
   diverted.

3. **Store-selecting flags propagate into sub-commands.** A command that itself
   drives a render and a serve must forward the store-selection flags it received
   to those sub-commands. `aligned-crops --sandbox` renders and serves the
   sandbox reproduction (from the sandbox store) and emits its crop pairs from it,
   instead of silently rendering/serving from the `sites/` tree — which, for a
   sandbox reproduction, would diff an absent or stale site against the reference
   and produce no valid crops. The source selection (`draft`/`published`, default
   `draft`) and the working directory are forwarded alongside `--sandbox`; with no
   `--sandbox` flag the command falls through to the `sites/` tree.

In scope: argument-parsing correctness for boolean flags, propagation of
store-selecting flags into the render/serve a sub-command triggers, and
stdout/stderr separation for scriptable output. Out of scope: the content/shape
of the diff or crop artifacts themselves (covered by the values-diff, size-aware
diff, and aligned-crops capabilities).

## Technical Context
- Guarantees 1–2 reconciled from bundle-ab9e0cb6 (REQ-58 pass-3), plan item 5,
  commits 4f681c73 (boolean flag) and a4323720 (--json stdout hygiene).
- Guarantee 3 reconciled from bundle-31e474b9 (BUNDLE-7), plan item 9, commit
  09fa7cf5. `aligned-crops` previously rendered and served from `sites/` even
  under `--sandbox`; the store tree (`sandbox` + `cwd`) plus `source` is now
  forwarded to both the render and the serve it triggers, so a sandbox
  reproduction is rendered/served from `sandbox/` and the perceptual crops run
  on it. Verified: `1c aligned-crops joyfulculinary --sandbox` emits 7 crop pairs.
- Diagnostic diversion happens in two places: render-time chatter during a
  command, and a one-time bootstrap warning Astro routes to stdout during
  server setup. Both are reconciled here as one output-hygiene guarantee.
- Related capabilities: CAP-63 (1c Values-Diff Fidelity), CAP-65 (1c
  Size-Aware Diffing) — the commands whose output this hygiene protects; the
  aligned-crops perceptual pipeline whose store routing guarantee 3 protects.

## Dependencies
None.

## Story Points
1