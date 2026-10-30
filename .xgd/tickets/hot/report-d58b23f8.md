---
uid: report-d58b23f8
id: REPORT-6920
type: report
title: 'Report: mode_override for report-00553335'
created_by: xgd
created_at: '2026-10-30T20:59:44.548506+00:00'
updated_at: '2026-10-30T21:15:00.226580+00:00'
completed_at: null
last_field_updated: conformance_verdict
fields:
  report_kind: mode_override
  subject_uid: report-00553335
  anchor_ticket: bundle-5607a08d
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-32f5ff75
  quality_mode: reconcile
  justification: REQ-157 (in scope) requires untrusted capture content never read
    as an instruction; AC-2067 requires recovered screenshot blocks keep the untrusted
    frame, and contentBlocksFrom is the sole point where the frame is dropped.
  files:
  - tools/generate/src/cli/ai/fidelity-core.ts
  rung: 1
  tip_evidence:
  - file: tools/generate/src/cli/ai/fidelity-core.ts
    lines: 185-198
  external_cause: null
  planner_trust_boundary: true
  granted_head: 4d32559c0b43fd711a14cf6dc33196f984bb4305
  files_touched:
  - tools/generate/src/cli/ai/fidelity-core.ts
  unnamed_files_touched: []
  trust_boundary_touched: true
  trust_boundary_matches:
  - 'tools/generate/src/cli/ai/fidelity-core.ts: + * the untrusted-content markers,
    for an `untrusted` operation — is carried onto'
  trust_boundary_notes: []
  trust_boundary_mismatch: false
  conformance_verdict: pass
  conformance_findings: []
---

# Mode override granted: code_frozen

REQ-157 (in scope) requires untrusted capture content never read as an instruction; AC-2067 requires recovered screenshot blocks keep the untrusted frame, and contentBlocksFrom is the sole point where the frame is dropped.

Planner instructions for the batch:

The code_frozen block reported in report-1449ee72 is granted for tools/generate/src/cli/ai/fidelity-core.ts only. The AC-2067 tests are right and must not be changed back to assert the frame is absent. Change contentBlocksFrom so that, when the rendered payload has text before the JSON array and/or after it (the untrusted frame), that text is carried onto the recovered blocks, exactly as the second UAT specifies. Leading text is prepended to the first block when that block is text; otherwise it becomes its own leading text block. Trailing text is appended to the last block when that block is text; otherwise it becomes its own trailing text block. An unframed rendering comes back unchanged, a refusal still returns null, and the scan stays bracket-based rather than keyed to the marker spelling. Update the function doc comment, which currently says the frame is given up. host-core.ts:525 needs no change.

## Diff

```diff
diff --git a/tools/generate/src/cli/ai/fidelity-core.ts b/tools/generate/src/cli/ai/fidelity-core.ts
index 4be477f34b..2672d556df 100644
--- a/tools/generate/src/cli/ai/fidelity-core.ts
+++ b/tools/generate/src/cli/ai/fidelity-core.ts
@@ -138,6 +138,14 @@ export function isContentBlocks(value: unknown): value is ContentBlock[] {
  * be blocks carrying an image; anything else (including every refusal) is
  * handed back as `null`. The scan is bracket-based, not keyed to the provenance
  * markers' spelling, which are the component's to change.
+ *
+ * The frame is kept. Whatever the rendering put before the array and after it —
+ * the untrusted-content markers, for an `untrusted` operation — is carried onto
+ * the recovered blocks: the leading text joins the front of the first block when
+ * that block is text and becomes its own block otherwise, and the trailing text
+ * likewise joins the end of the last. A picture of a third party's page is third
+ * party content, and recovering it as blocks must not be the step that stops
+ * saying so. An unframed rendering comes back exactly as the blocks it holds.
  */
 export function contentBlocksFrom(payload: unknown): ContentBlock[] | null {
   if (typeof payload !== 'string') return null
@@ -151,7 +159,23 @@ export function contentBlocksFrom(payload: unknown): ContentBlock[] | null {
     return null
   }
   if (!isContentBlocks(parsed)) return null
-  return parsed.some((block) => block.type === 'image') ? parsed : null
+  if (!parsed.some((block) => block.type === 'image')) return null
+
+  const leading = payload.slice(0, open)
+  const trailing = payload.slice(close + 1)
+  const blocks: ContentBlock[] = [...parsed]
+  if (leading) {
+    const first = blocks[0]
+    if (first.type === 'text') blocks[0] = { type: 'text', text: leading + first.text }
+    else blocks.unshift({ type: 'text', text: leading })
+  }
+  if (trailing) {
+    const at = blocks.length - 1
+    const last = blocks[at]
+    if (last.type === 'text') blocks[at] = { type: 'text', text: last.text + trailing }
+    else blocks.push({ type: 'text', text: trailing })
+  }
+  return blocks
 }
 
 /**

```