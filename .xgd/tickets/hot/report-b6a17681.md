---
uid: report-b6a17681
id: REPORT-5559
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T15:03:20.117721+00:00'
updated_at: '2026-09-29T15:03:20.117721+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `apps/control-app/src/identity.ts` — UU on a code file (STEP 2c). One hunk,
  at the `businesses.length === 0` branch of `admit`. Rule applied: integrate
  both sides; neither is discarded because they are not mutually exclusive.
  - **Ours (HEAD)** — `fix(identity): a refusal that claims nothing ended, and
    says why in the log [FREE-CODED]` (BUG-62) — had refactored that single
    refusal line from a bare `{ ok: false, reason, email }` literal into
    `denyAdmission(env, 'no_membership', normalised)`, the helper that makes
    "decide" and "record in the invocation log" the same statement.
  - **Theirs (incoming, 55b8557bae)** — `feat(identity): signing up provisions
    a business, a site and a landing [FREE-CODED]` (REQ-203) — had wrapped that
    same line in the `signingUp` guard, so a contact who has not accepted terms
    and whose account owns no business is admitted holding nothing.
  - **Resolved** as incoming's guard with HEAD's helper as its refusal
    expression:
    ```ts
    if (businesses.length === 0) {
      const signingUp = user.tos_accepted_at === null && !(await accountOwnsBusiness(env, user.account_id))
      if (!signingUp) return denyAdmission(env, 'no_membership', normalised)
    }
    ```
    Taking incoming verbatim would have left the one surviving raw
    `{ ok: false, ... }` literal in a file where the other three refusal paths
    (`no_email`, `no_user`, `user_inactive`) all route through `denyAdmission`
    — reintroducing exactly the silent refusal BUG-62 was filed from, on the
    path invited contacts hit most. Taking HEAD verbatim would have discarded
    the REQ-203 relaxation entirely.

The enrichment's stated rule ("intent unknown on one or both sides — take the
more recent commit by timestamp and flag for post-merge review") did not have
to be invoked: both commit subjects are legible and the two changes touch
different aspects of the same line, so STEP 2c's "non-overlapping: keep BOTH"
resolves it without a timestamp tiebreak. No post-merge review flag needed.

## Incoming changes preserved

`git diff --cached 55b8557bae -- apps/control-app/src/identity.ts` contains
**only** HEAD-side BUG-62 material, confirming no incoming hunk was dropped:

- the `DENIED_MESSAGE` rewording and its doc comment,
- the `denyAdmission` helper and its doc comment,
- the four call-site conversions (`no_email`, `no_user`, `user_inactive`,
  `no_membership`).

All four of the incoming commit's hunks for this file are present in the
resolved version:

1. `@@ -374,10 +374,13 @@` — the `Admission.businesses` doc rewrite
   ("`businesses` MAY BE EMPTY on an `ok` admission") — present at line 377.
2. `@@ -575,6 +578,34 @@` — the new exported `accountOwnsBusiness` helper and
   its doc comment — present at line 626.
3. `@@ -890,8 +921,49 @@` (comment half) — the REQ-203 commentary block on
   `admit` — present at lines 1001–1035.
4. `@@ -890,8 +921,49 @@` (code half) — the `signingUp` guard — present at
   lines 1040–1045, with the refusal routed through `denyAdmission`.

No BUG-1301 precedence exception was needed; nothing was deleted on either
side. `user.tos_accepted_at` (line 179) and `user.account_id` (line 158) both
exist on `UserRow` in the resolved tree, and `denyAdmission` returns
`Extract<Admission, { ok: false }>`, which is the same type the literal it
replaces produced — so the guard type-checks as written.

Staging verified clean: no UU/AA/DU/UD lines remain; `identity.ts` is staged
`M` alongside the four files the cherry-pick applied without conflict.
