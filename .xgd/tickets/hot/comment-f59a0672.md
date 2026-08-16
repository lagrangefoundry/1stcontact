---
uid: comment-f59a0672
id: COMMENT-1070
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-16T05:10:33.851232+00:00'
updated_at: '2026-08-16T05:10:33.851232+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6a3ffea2
  kind: note
---

## UAT Coverage: CAP-90 — **FAIL** (1 violation, 2 warnings, 0 needs_review)

**Report**: REPORT-2071 (`report-6a3ffea2`) — schema verified (`result=fail`, `report_kind`, `subject_uid`, integer counts).

**Verdicts written**: 11 ACs (10 `pass`, 1 `fail`), STORY-103 `fail`, capability `fail`.

### The one violation — AC-1053

`builder.ts:326` answers *every* malformed-turn case with the constant `{ error: 'sessionId and text are required' }`. The UAT's per-case check (`tests/reconciliation-assistant-conversation.test.ts:278`, `expect(error).toContain(names)`) therefore **passes unconditionally** — the constant contains both tokens. AC-1053 requires the refusal to identify *which* value is missing; that clause is neither implemented nor discriminated. The fix is two-sided: split the checks in `builder.ts:325-327` to name the specific field, then tighten the assertion. AC-1053's other assertions (400 not a stream, JSON content-type, model never called, draft byte-identical, conversation neither started nor extended) are strong and stay as they are.

### Why the other ten pass

All eleven UATs drive real HTTP against a real `startBuilder`, with one double — the Anthropic client, at the genuine network boundary (`host.ts:85-95`). I verified the seams the tests lean on are production, not scaffolding: `sessionsDir`/`sessionIdFor`/`resetAiHost` are real, and the host builds its tool list from the same `createL1Toolbox(...).schemas()` projection AC-1058 compares against. Assertions read consequences — draft bytes on disk, transcripts under the workspace cwd, status codes, SSE frames.

### Intent check

Story intent is bundle-e59210c5 (`free_and_reconciled`). I read REQ-122 and REQ-127 in the bundle directly: no AC asserts retired behavior — AC-1053 correctly asserts the withdrawn `{slug, text}` shape is *refused*, and AC-1059 asserts the named refusal class rather than the per-call path/hint REQ-126 stopped delivering. No `deprecated` or `needs_review` verdicts warranted.

Two things to flag:

- **I could not run the suite.** `npx vitest` and `npm test` were both denied by the session's permission mode. Every verdict is a judgment of what each UAT observes, read against the code it drives — not a report of a green run. The violation was established by reading the route handler, so it stands regardless; but the ten passes should be confirmed green by a regression run.
- **The prior alignment report (report-8c3c08f8) overstated AC-1053** as "400 + JSON naming the missing value." It names both values, always — worth knowing if that report feeds anything else.
