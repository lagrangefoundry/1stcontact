---
uid: report-fe6a4018
id: REPORT-6741
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-26T00:12:54.634225+00:00'
updated_at: '2026-10-26T00:12:54.634225+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

Cherry-pick of 2470b440 (Merge branch 'free-REQ-174': caretaker -> consultant role rename). Only paths within 2470b440's own diff are staged; apps/control-app/src/system-knowledge.ts, tests/reconciliation-assistant-arrival-notice-budget.test.ts and tests/reconciliation-assistant-conversation-continuity.workers.test.ts are untouched and match HEAD.

- tools/generate/src/cli/ai/host-core.ts — code (2c), integrated both intents: kept HEAD's REQ-157-era structure (Role built from priming/reminders Entry lists, per-turn reminder via `reminderFor` provider, purpose declared in ./roles and re-exported) and applied REQ-174's rename on top (CONSULTANT_ROLE/SYSTEM/PURPOSE, consultantReminder, LEGACY_ROLE_NAMES aliasing in the SessionManager role map). Internal entry/provider labels renamed caretaker-* -> consultant-* for consistency (no test references them).
- tools/generate/src/cli/ai/roles.ts — auto-merged, but HEAD's relocated CARETAKER_PURPOSE renamed to CONSULTANT_PURPOSE with REQ-174's new "You advise a client…" text (in 2470b440's diff, via host-core where it previously lived).
- tools/generate/src/cli/ai/host.ts — code (2c): dropped the incoming duplicate `nodeDeps` (HEAD moved/rewrote it); import renamed to CONSULTANT_PURPOSE.
- apps/control-app/src/ai.ts — code (2c): HEAD kept; nets to no diff vs HEAD (see precedence below).
- tests/reconciliation-assistant-conversation-knowledge.test.ts — test (2c): HEAD's version (imports purpose from roles, no local PURPOSE literal) with the identifier renamed to CONSULTANT_PURPOSE.
- tests/reconciliation-page-composition-surface.test.ts — test (2c): HEAD's test name (…_the_field_and_a_recovery_strategy, newer behaviour) with incoming `consultant()` helper.

## Incoming changes preserved

- host-core.ts: role rename, legacy-name aliasing, new purpose text, consultantReminder all present. The incoming `system:` / `source:` / `reminder:` Role fields and the `role.reminder = …` mutation in streamPrompt were dropped under BUG-1301 precedence: HEAD (free-REQ-157 merge) replaced that Role API with Entry tiers and a reminder provider (`Role` is frozen upstream), a documented refactor; the incoming hunks only renamed identifiers inside that now-removed code, and the rename is re-applied in HEAD's equivalents.
- ai.ts: incoming hunk only renamed the purpose argument to `sessionPriming(knowledge, PURPOSE)`; HEAD removed that parameter (host-core now owns the purpose's position in the entry list) — BUG-1301 precedence, rename carried by roles.ts/host-core instead.
- host.ts: incoming hunk renamed `rolePurpose:` inside the old nodeDeps; HEAD's nodeDeps no longer passes a purpose to KM (KM renders landscape/mechanism providers only) — BUG-1301 precedence; import rename preserved.
- Tests: REQ-174 helper/identifier renames present.

Verification: `tsc --noEmit` clean for tools/generate and apps/control-app. Spot-run of the 4 affected test files: 12 pass; failures are sandbox `listen EPERM` (cannot bind ports) and AC1319/AC1320 failing on the known pre-existing `SessionManager: unknown option logDir` upstream rename (line identical on both sides, not introduced here). Flag for post-merge review per enrichment rule. Stale doc comment mentioning `caretakerReminder` remains in tests/reconciliation-assistant-arrival-notice-budget.test.ts:18 (outside this commit's diff, deliberately untouched).
