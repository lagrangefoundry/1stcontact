---
uid: report-4f85bf31
id: REPORT-5543
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T11:47:38.039875+00:00'
updated_at: '2026-09-29T11:47:38.039875+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- **package.json** — config file, scalar `version` conflict (rule **2g**).
  OURS `0.2.76` (`3b825c4c12`, REQ-189 "style the User tab", 2026-09-05
  13:32:59) vs THEIRS `0.2.75` (`902b5b63d9`, BUG-52, 13:33:33).
  Resolved to **`0.2.76`**.

  **Deviation from the literal rule, flagged for review.** 2g ("scalar:
  incoming wins") and the auto-enrichment ("take the more recent commit by
  timestamp") both select THEIRS `0.2.75` — THEIRS is 34s newer. I took
  `0.2.76` instead, on direct evidence that `0.2.75` is already spoken for
  on this branch. The enrichment issues that rule because it reports intent
  as UNKNOWN on one or both sides; the source branch records the intent
  explicitly, in two commit subjects:

  - `1cd00146f3` "chore: bump version for BUG-52 (0.2.75 was already
    claimed by REQ-188) [FREE-CODED]" — BUG-52's OWN follow-up, moving it
    off `0.2.75` onto `0.2.76`.
  - `b8c699fdea` "chore: bump version for REQ-189 (0.2.76 was already
    claimed by BUG-52) [FREE-CODED]" — corroborates that `0.2.76` is
    BUG-52's, and moves REQ-189 to `0.2.77`.

  Settled assignment on `xgd-working`: `0.2.75`=REQ-188, `0.2.76`=**BUG-52**,
  `0.2.77`=REQ-189. REQ-188 is ALREADY on this resync branch as
  `193ace3245`, holding `0.2.75`. Taking the incoming scalar would
  therefore have re-created, on this branch, the exact duplicate-version
  collision `1cd00146f3` exists to resolve — and would have regressed the
  branch version 0.2.76 -> 0.2.75, the older-version overwrite CLAUDE.md
  (Free-Coded Commit Convention) flags as CRITICAL.

  Replay consequence, checked: both follow-ups are still ahead in the
  queue. `1cd00146f3` (0.2.75 -> 0.2.76) will now be an EMPTY commit — it
  is a pure version bump with no other hunk, so an empty/skip there is
  correct, not a dropped change. `b8c699fdea` then lands `0.2.77`. Final
  branch version `0.2.77`, matching the source branch. The alternative
  (`0.2.75`) converges on the same endpoint but passes through the known
  duplicate on the way.

  Resolution is byte-identical to HEAD, so package.json no longer appears
  in `git status` — expected and correct. The commit is NOT empty overall
  (8 other files carry real changes), so finalize will commit normally.

The other 8 paths in this cherry-pick applied cleanly with no three-way
merge and therefore no conflict: `session.js` (new, 199 lines), `api.js`,
`app.js`, `builder.css`, `main.js`, `tests/support/access.ts`, and the two
new BUG-52 UATs. No hunk was dropped under the BUG-1301 precedence
exception; it did not apply to this cherry-pick. No test function was
deleted on either side.

## Incoming changes preserved

- **package.json** — incoming's literal scalar (`0.2.75`) is deliberately
  NOT present, per the flagged 2g deviation above. This is a version-number
  collision correction backed by BUG-52's own follow-up commit, not a
  discarded developer change: no incoming code was lost.
- **tests/support/access.ts** — verified against `git show 902b5b63d9 --`:
  incoming's `TOKEN_LIFETIME_SECONDS` (7d) export and the `exp: now +
  TOKEN_LIFETIME_SECONDS` substitution are both present in the staged blob;
  no `3600` literal remains.
- **apps/control-app/src/builder/session.js** — staged with all 9 incoming
  exports (`SESSION_EXPIRED`, `SESSION_UNREACHABLE`, `sessionEndedMessage`,
  `SessionEndedError`, `isSessionEnded`, `onSessionEnded`,
  `announceSessionEnded`, `createSessionNotice`, `loadOrSignOut`).
- **api.js / app.js / main.js** — staged; every symbol each imports from
  `./session.js` is exported by the staged `session.js`. Import wiring
  checked by hand.

## Verification

- `tests/test_UAT_FC_BUG-52_expired_session.test.ts` — 12/12 pass.
- `npx tsc --noEmit -p apps/control-app/tsconfig.json` — clean.
- `tests/test_UAT_FC_BUG-52_harness_token_lifetime.test.ts` — COULD NOT RUN.
  `startAccessTeam` binds 127.0.0.1 and the session sandbox blocks `listen`
  (`Server.setupListenHandle` -> `listenInCluster`, then a 120s timeout).
  Same environmental limit recorded in the previous resolve report on this
  branch. Not affected by this resolution regardless — the resolution
  touches only the `version` scalar.
- Blast radius of the shared `access.ts` change (token lifetime 1h -> 7d)
  checked statically: only 3 other files import it
  (`reconciliation-workspace-build-artifacts`,
  `reconciliation-builder-workspace-origin`, `req115-builder-shell`) and
  none reference `exp`, `expir`, or `token(`, so none can depend on the
  1-hour expiry. All 3 are themselves socket-binding and unrunnable here.
- `git status --porcelain` shows no UU/AA/DU/UD lines; CHERRY_PICK_HEAD
  still present at `902b5b63d9`. No cherry-pick --continue/--skip/--quit/
  --abort was invoked.
