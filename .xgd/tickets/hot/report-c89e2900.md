---
uid: report-c89e2900
id: REPORT-6834
type: report
title: 'Report: mode_override for story-a58a0974'
created_by: xgd
created_at: '2026-10-28T20:39:51.667115+00:00'
updated_at: '2026-10-28T20:48:06.257971+00:00'
completed_at: null
last_field_updated: conformance_verdict
fields:
  report_kind: mode_override
  subject_uid: story-a58a0974
  anchor_ticket: bundle-5607a08d
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-9df9a171
  quality_mode: reconcile
  justification: REQ-174 (in window) requires the rename to leave nothing behind,
    with a guard that allows the old word in exactly one file, and requires a legacy-stored
    session to reopen and take an editing turn; AC-2054..2057 demand the same. No
    Node session can open while host.ts passes the rejected logDir, and system-knowledge.ts
    carries a straggler in a comment. The tip already has both changes (host.ts junctions
    line under REQ-452; no 'caretaker' outside roles.ts), so this ports tip behaviour
    and invents nothing.
  files:
  - tools/generate/src/cli/ai/host.ts
  - apps/control-app/src/system-knowledge.ts
  - tests/reconciliation-assistant-arrival-notice-budget.test.ts
  - tests/reconciliation-assistant-conversation-continuity.workers.test.ts
  - tests/reconciliation-assistant-conversation.test.ts
  tip_evidence:
  - file: tools/generate/src/cli/ai/host.ts
    lines: 233-237
  - file: apps/control-app/src/system-knowledge.ts
    lines: 198-222
  external_cause: null
  planner_trust_boundary: false
  granted_head: 3ec3c11a394cf3443f2a1b6dc62e176b6761bea1
  files_touched:
  - apps/control-app/src/system-knowledge.ts
  - tests/reconciliation-assistant-arrival-notice-budget.test.ts
  - tests/reconciliation-assistant-consultant-role.test.ts
  - tests/reconciliation-assistant-conversation-continuity.workers.test.ts
  - tests/reconciliation-assistant-conversation.test.ts
  - tools/generate/src/cli/ai/host.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
  conformance_verdict: pass
  conformance_findings: []
---

# Mode override granted: code_frozen

REQ-174 (in window) requires the rename to leave nothing behind, with a guard that allows the old word in exactly one file, and requires a legacy-stored session to reopen and take an editing turn; AC-2054..2057 demand the same. No Node session can open while host.ts passes the rejected logDir, and system-knowledge.ts carries a straggler in a comment. The tip already has both changes (host.ts junctions line under REQ-452; no 'caretaker' outside roles.ts), so this ports tip behaviour and invents nothing.

Planner instructions for the batch:

Two causes, both already settled at the tip (reconcile-src-BUNDLE-32); port them, do not redesign. The iteration-1 plan was never executed (its filing was rejected on a tip_evidence range), so this is the first attempt. (1) Every failing test except AC2057 goes through nodeDeps() in tools/generate/src/cli/ai/host.ts (directly, or via startBuilder), and session construction throws `SessionManager: unknown option logDir — logDir is now junctions`. Replace `logDir: path.join(dir, 'live'),` at host.ts:213 with `junctions: lib.fileJunctions(path.join(dir, 'live')),` exactly as tip host.ts:233-237 does (its explanatory comment may come too). host-core.ts:636 already forwards deps.junctions. Port ONLY that line: do not bring over the tip's other nodeDeps additions (cases, extraSurfaces, workerKnowledge, audit), which belong to other intents. (2) AC2057 (REQ-174: the guard allows the old word in exactly one file) fails because four files besides roles.ts still contain 'caretaker': apps/control-app/src/system-knowledge.ts:192 (doc comment 'what this caretaker is for' -> use the tip's 'the role purpose' phrasing, cf. tip system-knowledge.ts:198-222; comment only, no code change); tests/reconciliation-assistant-arrival-notice-budget.test.ts:18 (comment names the old `caretakerReminder` symbol: use the current symbol name exported from roles.ts); tests/reconciliation-assistant-conversation-continuity.workers.test.ts:338 (comment: say 'consultant'); tests/reconciliation-assistant-conversation.test.ts:648 (the AC1405 deployed-header fixture `role: 'caretaker'` -> CONSULTANT_ROLE / 'consultant'; legacy-name resume is AC2056's job, which builds its legacy header at runtime from LEGACY and stays untouched). The AC2057 walk includes untracked files, so ensure no scratch file in the working tree carries the word. If your sandbox refuses local port binding (EPERM on listen), that is the environment, not the code: report it rather than altering the tests' startBuilder use. Keep the dependency_tests green: the looking-surface suite (AC2022-AC2035) supplies its own junctions, and AC1404-AC1410/AC1456/AC1651-AC1653/AC1792-AC1794 consume the same host and knowledge path.

## Diff

```diff
diff --git a/apps/control-app/src/system-knowledge.ts b/apps/control-app/src/system-knowledge.ts
index 32d408c513..e7479a24c8 100644
--- a/apps/control-app/src/system-knowledge.ts
+++ b/apps/control-app/src/system-knowledge.ts
@@ -189,7 +189,7 @@ export function knowledgeSurfaceFor(runtime: Untyped): {
  * the session opened.
  *
  * THE ORDER IS NO LONGER DECIDED HERE. KM used to own it; `host-core.ts` now states
- * it in the entry list — the map, then what this caretaker is for, then the
+ * it in the entry list — the map, then the role purpose, then the
  * projected manual last, because the last thing the agent reads is the first thing
  * it does. What is decided HERE is what the mechanism says, and it is this
  * session's own projected manual rather than a sentence written by hand about what
diff --git a/tests/reconciliation-assistant-arrival-notice-budget.test.ts b/tests/reconciliation-assistant-arrival-notice-budget.test.ts
index 42a14703e2..405b30585e 100644
--- a/tests/reconciliation-assistant-arrival-notice-budget.test.ts
+++ b/tests/reconciliation-assistant-arrival-notice-budget.test.ts
@@ -15,7 +15,7 @@ import {
  * it. Routing either through workerd would need forty-one real uploads to say
  * something that is not about uploading at all, and the claim would be no more
  * true for the journey. The notice these tests read is the same string the turn
- * carries: `caretakerReminder` appends whatever {@link deltaLine} returns and
+ * carries: `consultantReminder` appends whatever {@link deltaLine} returns and
  * changes not a character of it, and the end-to-end evidence that it reaches a
  * real turn in that form is the sibling workers suite (AC-1798, AC-1807).
  *
diff --git a/tests/reconciliation-assistant-consultant-role.test.ts b/tests/reconciliation-assistant-consultant-role.test.ts
index 87388516c3..90301b85b5 100644
--- a/tests/reconciliation-assistant-consultant-role.test.ts
+++ b/tests/reconciliation-assistant-consultant-role.test.ts
@@ -146,8 +146,12 @@ describe('the assistant is told it is a consultant', () => {
     // The system text of the first REAL model request, assembled by the host —
     // not the constant read back.
     expect(client.seen.length).toBeGreaterThan(0)
-    const system = client.seen[0].system
-    expect(typeof system).toBe('string')
+    // `system` is a string or a list of `{type: 'text', text}` blocks; the
+    // preamble is the joined text either way.
+    const seen = client.seen[0].system
+    const system =
+      typeof seen === 'string' ? seen : seen.map((block) => block.text ?? '').join('\n\n')
+    expect(system.length).toBeGreaterThan(0)
 
     expect(system).toContain('consultant')
     expect(system).not.toMatch(new RegExp(LEGACY, 'i'))
diff --git a/tests/reconciliation-assistant-conversation-continuity.workers.test.ts b/tests/reconciliation-assistant-conversation-continuity.workers.test.ts
index bf56a4f8a9..eb3683e8f8 100644
--- a/tests/reconciliation-assistant-conversation-continuity.workers.test.ts
+++ b/tests/reconciliation-assistant-conversation-continuity.workers.test.ts
@@ -335,7 +335,7 @@ describe('no knowledge base to open is ordinary on the deployed host too', () =>
       // against the two things AC-1319 proves priming carries WHEN there is a
       // corpus — the manual, which names the operations, and the landscape, which
       // is about a knowledge base — rather than against the bare word, which
-      // appears innocently inside "acknowledge" in the caretaker's own prose.
+      // appears innocently inside "acknowledge" in the consultant's own prose.
       const primed = JSON.stringify(model.seen[0].system)
       for (const name of KNOWLEDGE_TOOLS) expect(primed, name).not.toContain(name)
       expect(primed).not.toMatch(/knowledge base/i)
diff --git a/tests/reconciliation-assistant-conversation.test.ts b/tests/reconciliation-assistant-conversation.test.ts
index c017b5591e..85cb3b98fb 100644
--- a/tests/reconciliation-assistant-conversation.test.ts
+++ b/tests/reconciliation-assistant-conversation.test.ts
@@ -645,7 +645,7 @@ describe('a transcript written by the deployed host is read by the local one', (
       JSON.stringify(
         {
           id: sessionId,
-          role: 'caretaker',
+          role: 'consultant',
           backend: `claude+site:${OTHER}`,
           filter_tool_use: false,
           backend_ref: '',
diff --git a/tools/generate/src/cli/ai/host.ts b/tools/generate/src/cli/ai/host.ts
index 85ee3df10c..db8b4f0d5e 100644
--- a/tools/generate/src/cli/ai/host.ts
+++ b/tools/generate/src/cli/ai/host.ts
@@ -210,7 +210,10 @@ export async function nodeDeps(opts: GlobalOptions): Promise<HostDeps> {
     lib,
     store,
     archive: new lib.FileArchive(dir),
-    logDir: path.join(dir, 'live'),
+    // The framework's file junction, under the same workspace directory as the
+    // archive. `logDir` was its old name; since the framework stopped accepting
+    // it, no Node session could open ([[REQ-452]]).
+    junctions: lib.fileJunctions(path.join(dir, 'live')),
     audit: fileAuditSink(opts),
     extraSurfaces: [],
     // REQ-157 — the fidelity surface, when this process knows what it is called

```