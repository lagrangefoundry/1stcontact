---
uid: story-e15a19ef
id: STORY-79
type: story
title: '1c CLI: boolean flags keep their positionals and --json emits a clean scriptable
  document'
created_by: xgd
created_at: '2026-07-19T03:01:20.536179+00:00'
updated_at: '2026-07-19T03:01:20.536179+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-ac7ca849
  story_kind: feature
  story_points: 1
---

## Story
**As a** user scripting the `1c` CLI, **I want** boolean flags to not swallow a
following positional argument and `--json` output to be a single clean JSON
document, **so that** I can invoke `1c` commands in any flag order and pipe their
machine-readable output straight into other tools without it breaking.

## Description
Two CLI-correctness guarantees for the `1c` command line:

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

In scope: argument-parsing correctness for boolean flags, and stdout/stderr
separation for scriptable output. Out of scope: the content/shape of the diff
document itself (covered by the values-diff and size-aware diff capabilities).

## Technical Context
- Reconciled from bundle-ab9e0cb6 (REQ-58 pass-3), plan item 5, commits
  4f681c73 (boolean flag) and a4323720 (--json stdout hygiene).
- Diagnostic diversion happens in two places: render-time chatter during a
  command, and a one-time bootstrap warning Astro routes to stdout during
  server setup. Both are reconciled here as one output-hygiene guarantee.
- Related capabilities: CAP-63 (1c Values-Diff Fidelity), CAP-65 (1c
  Size-Aware Diffing) — the commands whose output this hygiene protects.

## Dependencies
None.

## Story Points
1
