---
uid: report-a55057d3
id: REPORT-5566
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T15:31:25.079095+00:00'
updated_at: '2026-09-29T15:31:25.079095+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `apps/control-app/src/index.ts` — UU on a code file (2c). INCOMING
  authoritative, both sides kept. The two sides are disjoint in substance:
  HEAD restructured the identity block so a live session is a second
  producer of the verified email (`signedIn.email` else the Access gate),
  and incoming substituted `actingEmail(env, gate)` for `gate.email` so a
  service token resolves to the person whose automation it is (BUG-59).

  Incoming wrote its substitution at the `admit` call, where its parent had
  `gate` in scope at that line. Under HEAD's structure `gate` is scoped to
  the else branch, so incoming's expression — and its comment verbatim —
  was placed at the one line where the gate's email is produced:
  `email = actingEmail(env, gate)`. `admit(env, email)` then admits the same
  value incoming intended for the token path, and the session path is
  unchanged (a service token carries no session cookie, and `actingEmail`
  returns a human's own address unchanged, so behaviour on both branches is
  what each side specified). The import of `actingEmail` merged cleanly.

## Incoming changes preserved

- `actingEmail` import: present (`src/index.ts:8`).
- `actingEmail(env, gate)` governing the admitted email on the Access-gate
  path: present (`src/index.ts:367`), with incoming's BUG-59 comment intact.
- Incoming's line `if (!admission.ok) return denied(admission)` was NOT
  taken, and this is not a dropped incoming change: that line is unchanged
  context from incoming's parent. HEAD's `denied()` takes no argument after
  BUG-62 moved the refusal log line into `admit`, a refactor already
  integrated into HEAD (`src/index.ts:142` and its docstring). Taking
  incoming's context line would be a compile error against HEAD's
  signature; HEAD's call form is kept and incoming loses nothing it authored.
- Incoming's other seven files merged without conflict and remain staged.
- `npx tsc --noEmit -p apps/control-app/tsconfig.json` reports no error in
  `index.ts`, `identity.ts` or `access.ts`. It reports two pre-existing
  `templateUid`/`OutgoingMessage` errors in `src/invites.ts` and
  `src/sessions.ts`, untouched by this conflict and not treated as
  regressions. The workers suites are not runnable in this role.
