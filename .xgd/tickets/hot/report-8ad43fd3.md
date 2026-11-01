---
uid: report-8ad43fd3
id: REPORT-7248
type: report
title: 'Report: mode_override for STORY-141'
created_by: xgd
created_at: '2026-11-01T03:33:15.332881+00:00'
updated_at: '2026-11-01T03:42:28.300800+00:00'
completed_at: null
last_field_updated: files_touched
fields:
  report_kind: mode_override
  subject_uid: STORY-141
  anchor_ticket: bundle-fd009b93
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-fddeb967
  quality_mode: reconcile
  justification: AC-2097 requires DOCUMENT_DIGEST_SYSTEM to be the only system content.
    The reference state delivers it as the single priming Entry, while the frozen
    working-tree code passes `system`/`source` keys that the AI library's Role constructor
    drops, so production sends an empty system prompt. The test is right and the code
    is wrong.
  files:
  - apps/control-app/src/ai.ts
  rung: 2
  tip_evidence:
  - file: apps/control-app/src/ai.ts
    lines: 297-304
  external_cause: null
  planner_trust_boundary: false
  granted_head: 6b9fcfbd16adba2fd8d20a6425fdba3d81246086
  files_touched:
  - apps/control-app/src/ai.ts
  - tests/test_UAT_FC_REQ-173_describer_session.test.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
---

# Mode override granted: code_frozen

AC-2097 requires DOCUMENT_DIGEST_SYSTEM to be the only system content. The reference state delivers it as the single priming Entry, while the frozen working-tree code passes `system`/`source` keys that the AI library's Role constructor drops, so production sends an empty system prompt. The test is right and the code is wrong.

Planner instructions for the batch:

AC1688/AC1689/AC1699 are already resolved: the iteration-1 builder deleted their stale pre-REQ-173 copies from tests/reconciliation-material-description.workers.test.ts, and the digest-era versions pass. Keep that edit, and keep those tests green. The remaining failure, AC2097, is a production defect in apps/control-app/src/ai.ts sessionTextDescriber. The Role is constructed with `system: DOCUMENT_DIGEST_SYSTEM` and `source: {...}`, which Role ignores. Replace them with a single priming entry, `priming: [new lib.Entry({ name: 'digest-system', text: DOCUMENT_DIGEST_SYSTEM })]`, matching the reference state (reconcile-src-BUNDLE-34 ai.ts:297-304, BUG-63). Then the assembled system content equals DOCUMENT_DIGEST_SYSTEM exactly. Also fix the doc comment at ai.ts:123 ('No corpus and no priming') so it says the one instruction is the only priming. Do NOT port the later describerSession/image-describer consolidation (REQ-207) or change backend registration. That work is outside this story. Do not touch the AC2097 test: it is correct as written.

## Diff

```diff
diff --git a/apps/control-app/src/ai.ts b/apps/control-app/src/ai.ts
index 6348ff7c6f..1481405a65 100644
--- a/apps/control-app/src/ai.ts
+++ b/apps/control-app/src/ai.ts
@@ -120,9 +120,10 @@ export const DESCRIBER_BACKEND = 'material_describer'
  *   - **No tools.** The describer is given text and asked for text. A toolbox
  *     would hand a describer the ability to write to the client's site, which is
  *     an authority nothing about this task calls for.
- *   - **No corpus and no priming.** The document is the whole context. Priming
- *     the describer with the landscape would spend a large prompt teaching it
- *     about material it is not being asked about.
+ *   - **No corpus, and the digest instruction is the only priming.** The
+ *     document is the whole context. Priming the describer with the landscape
+ *     would spend a large prompt teaching it about material it is not being
+ *     asked about.
  *   - **A {@link NullArchive}.** THE LOAD-BEARING ONE. `TicketSessionArchive`
  *     homes a session in a `chat` ticket, so an archiving describer would create
  *     one chat ticket per upload — members of the very corpus this ticket is
@@ -158,10 +159,10 @@ export function sessionTextDescriber(
 
   const role = new lib.Role({
     name: DESCRIBER_ROLE,
-    system: DOCUMENT_DIGEST_SYSTEM,
-    // The duck-typed `ContextSource`, empty. See above: the document is the
-    // context, and there is nothing else this role should know.
-    source: { documents: () => [] },
+    // ONE STATIC ENTRY AND NOTHING ELSE (BUG-63). `Role` takes its system content
+    // only as `priming` entries, so the digest instruction must be one — the
+    // document is the context, and there is nothing else this role should know.
+    priming: [new lib.Entry({ name: 'digest-system', text: DOCUMENT_DIGEST_SYSTEM })],
   })
   const manager = new lib.SessionManager({ [DESCRIBER_ROLE]: role }, new lib.NullArchive(), {
     junctions: lib.memoryJunctions(),
diff --git a/tests/test_UAT_FC_REQ-173_describer_session.test.ts b/tests/test_UAT_FC_REQ-173_describer_session.test.ts
index 1586730e13..89d117283f 100644
--- a/tests/test_UAT_FC_REQ-173_describer_session.test.ts
+++ b/tests/test_UAT_FC_REQ-173_describer_session.test.ts
@@ -12,7 +12,8 @@
  * WHAT A "LIGHTWEIGHT" SESSION IS, and each half is asserted below:
  *
  *   - **No tools.** A describer given a toolbox could write to the client's site.
- *   - **No corpus and no priming.** The document is the whole context.
+ *   - **No corpus; the digest instruction is the only priming.** The document
+ *     is the whole context.
  *   - **A `NullArchive`.** The load-bearing one: `TicketSessionArchive` homes a
  *     session in a `chat` ticket, so an archiving describer would create one chat
  *     ticket per upload — members of the very corpus this ticket is cleaning up.
@@ -31,7 +32,27 @@
 import { describe as suite, expect, it } from 'vitest'
 import { sessionTextDescriber } from '../apps/control-app/src/ai'
 import { DOCUMENT_DIGEST_SYSTEM } from '../apps/control-app/src/describe'
-import { says, scriptedClient } from './support/scripted-model-client'
+import { says, scriptedClient, type ModelRequest } from './support/scripted-model-client'
+
+/**
+ * Flatten a request's system content to its text. The host sends priming as
+ * Anthropic content blocks, not a bare string, so `toContain` on the raw value
+ * would test array membership rather than the prompt text.
+ */
+function systemText(req: ModelRequest): string {
+  const system: unknown = req.system
+  if (typeof system === 'string') return system
+  if (!Array.isArray(system)) return ''
+  return system
+    .map((block: unknown) =>
+      typeof block === 'string'
+        ? block
+        : block && typeof block === 'object' && 'text' in block
+          ? String((block as { text: unknown }).text ?? '')
+          : '',
+    )
+    .join('\n')
+}
 
 suite('REQ-173 — the document describer is a session on the AI host', () => {
   it('test_UAT_FC_REQ_173_the_digest_comes_back_from_a_session_prompted_with_the_document', async () => {
@@ -56,12 +77,13 @@ suite('REQ-173 — the document describer is a session on the AI host', () => {
     const client = scriptedClient([says('A note.')])
     await sessionTextDescriber('sk-not-a-real-key', { client })('Some text.')
 
-    const system = client.seen[0].system
-    // THE PROMPT `describe.ts` OWNS. The two prompts this product sends about
-    // material live next to each other, in the file that decides what a
-    // description IS — so the role is built from that constant rather than from a
-    // second copy of it here.
-    expect(system).toContain(DOCUMENT_DIGEST_SYSTEM)
+    const system = systemText(client.seen[0])
+    // THE PROMPT `describe.ts` OWNS, AND ONLY IT. The two prompts this product
+    // sends about material live next to each other, in the file that decides what
+    // a description IS — so the role is built from that constant rather than from
+    // a second copy of it here. Exact equality: the digest instruction is the
+    // single priming entry (BUG-63), so nothing else may reach the system prompt.
+    expect(system.trim()).toBe(DOCUMENT_DIGEST_SYSTEM)
     // NO CORPUS AND NO MANUAL. The consultant session's priming is the landscape
     // plus the toolbox manual; a describer primed with either would spend a large
     // prompt learning about material it is not being asked about.

```
