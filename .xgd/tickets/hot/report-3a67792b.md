---
uid: report-3a67792b
id: REPORT-7225
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-01T02:51:19.125430+00:00'
updated_at: '2026-11-01T02:51:19.125430+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: STORY-103
  parent_report_uid: report-81630d74
  batch_index: '0'
---

I fixed one of the two failures. The other is a real bug in the frozen production code, so I made no edits for it and am reporting it as blocked.

## AC1057 (losing the host mid-turn): fixed, test and AC were wrong

The test and AC-1057 said that losing the host mid-turn loses that turn. That was true when the local host kept the in-flight turn in memory. The current code stores it in a file under the workspace's sessions directory instead (`lib.fileJunctions(path.join(dir, 'live'))` in `tools/generate/src/cli/ai/host.ts:216`, changed under REQ-452). So the turn as spoken so far survives losing the host.

- **Test:** I rewrote it in `tests/reconciliation-assistant-conversation.test.ts`. Mid-turn, it asserts that the archive has the completed exchange but not the answer being spoken, and that the junction file on disk does have that answer. After `resetAiHost()` it asserts that reopening:
  - reports ready;
  - replays the first exchange with its original text and roles;
  - then shows the second message and the partial answer as one assistant turn, with `live: true`.

  If the junction went back to memory, this test would fail. I also added `live` to the test's `OpenedSession` type.
- **AC-1057:** I updated its body through `xgd ticket update` to describe this per-host behaviour. STORY-103 doesn't make the claim, so it needed no change.
- **Result:** all 13 tests in that file pass. The project has no ESLint configured, so there was no lint step to run.

## AC2088 (opening mid-turn, then after the turn ends): blocked by the code freeze

The mid-turn half of the test passes. The failing check is that once the turn has finished, reopening reports `live: false`. I added temporary logging to the test, then reverted it:

- After the turn completes and settles, `/api/ai/session` returns the whole reply exactly once but `live: true`.
- A reattach from cursor 0 returns the full turn ending in `done` with `status: complete`, so the turn really is over.
- A reattach from the cursor that open reported returns no frames at all. A client that believes `live: true` and reattaches would wait forever.

So the AC is right, and changing the test to expect `live: true` would lock in that hang. The flag comes from `storedTranscript` in `tools/generate/src/cli/ai/host-core.ts:788`, which compares the junction's closed prefix (`closedPrefix(records)`) against the full record list. I couldn't read the AI library's source in this mode, so I haven't confirmed which trailing record keeps the prefix short. A host that has never served the conversation does correctly report `live: false`.

```yaml
## Assessment
blocked_by:
  rule: code_frozen
  evidence: "Instrumented test_UAT_AC2088 (reverted): after the turn drained and ctx.waitUntil work settled, POST /api/ai/session returned turns [user, 'Working on the heading. Done with the heading.'] with live:true, cursor 147001; /api/ai/reattach from cursor 0 streamed both text parts then done{status:complete}; /api/ai/reattach from the reported cursor 147001 produced no frames (hangs). live is computed at tools/generate/src/cli/ai/host-core.ts:788 as closedPrefix(records).length !== records.length on manager.logFor(sessionId).readFrom(0). AC-2088 explicitly requires live false once the turn ends, and a client acting on live:true hangs, so changing the test to expect true would lock in a defect."
  proposed_change: "tools/generate/src/cli/ai/host-core.ts storedTranscript: compute `live` from whether the junction log has an open turn (a turn_start with no matching turn_end/done after it), not from closedPrefix length, which also cuts at trailing non-turn records written after the turn's end. Equivalently, use the library's narrower open-turn predicate referenced in @lagrangefoundry/ai src/control.js:738 if it is exported. No test changes needed: test_UAT_AC2088 as written then passes."
```
