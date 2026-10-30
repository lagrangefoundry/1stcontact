---
uid: bug-d9778adf
id: BUG-316
type: bug
title: 'Fidelity surface: screenshot reaches the model without the untrusted-content
  frame'
created_by: workflow:fix_reconciliation_review/builder
created_at: '2026-10-30T20:30:09.108108+00:00'
updated_at: '2026-10-30T20:30:09.108108+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: high
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Summary
REQ-157 (request-3f8737f2) requires that "a captured page's text must never be able to read as an instruction". Every operation on the looking surface (`fidelity-surface.json`) is declared `provenance: untrusted`, and the Toolbox renders each result as text wrapped in `<<<untrusted>>>` … `<<</untrusted>>>`.

On the picture path, though, `contentBlocksFrom` (`tools/generate/src/cli/ai/fidelity-core.ts`) recovers the JSON block array from that rendering and returns it **bare**. `host-core.ts` (`contentBlocksFrom(payload) ?? payload`) then hands those blocks to the model as the `tool_result` content. A screenshot of a third-party page, and its descriptive text block, therefore reach the model with no untrusted marking.

## Provenance
- The frame was dropped by the code_frozen grant report-be7d1be4 (commit 13aa65737c), which carved the image-block array out of the Toolbox's rendered text.
- During BUNDLE-32 reconciliation, a review fixer (0a0f97f216) added a `framed()` step that carried the surrounding frame text onto the first and last blocks.
- That edit had no mode_override grant and was not in the reference state, so reconciliation review report-84f2f9bc (F1) required it reverted.
- This bug carries the intent forward.

## Fix
Carry the text that surrounds the recovered array onto the blocks:
- The text before the array either prefixes the first text block or becomes a new leading text block.
- The text after the array either suffixes the last text block or becomes a new trailing text block.

The reverted 0a0f97f216 hunk is a ready reference implementation. AC-2067 (acceptance_criterion-827e8986) currently pins the unframed behaviour as a known gap and must be rewritten alongside the fix.

## Test plan
- Drive a consultant turn through the real Node host with `screenshot` scripted. Assert the backend's `tool_result` content opens with `<<<untrusted>>>` before the image and closes with `<<</untrusted>>>` after it.
- Assert `contentBlocksFrom` keeps the frame for an image-first payload.
