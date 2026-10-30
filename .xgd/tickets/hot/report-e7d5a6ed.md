---
uid: report-e7d5a6ed
id: REPORT-5555
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T14:14:26.531466+00:00'
updated_at: '2026-09-29T14:14:26.531466+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- **apps/control-app/src/people.ts** — UU, code file (§2c, incoming authoritative).
  Six hunks, all integrated rather than chosen between:
  - `Person`: kept HEAD's `name: PersonName | null` + `formerNames: string[]`
    ([[REQ-193]]) and **added** incoming's `accountId: string` with its comment.
  - `USER_COLUMNS`: added incoming's `u.account_id AS account_id`.
  - `toPerson`: added incoming's `accountId: row.account_id` beside HEAD's
    `name`/`formerNames`.
  - `personDetail`: took incoming's account-keyed `grantsFor(env, row.account_id,
    businessIds)` **and** its comment, keeping HEAD's `formerNamesOf` /
    `eventsOf` / `provenanceOf` reads ([[REQ-195]]).
  - `invitePerson` batch comment: composed — incoming's "THE PERSON, THEIR
    ACCOUNT AND THEIR FIRST ADDRESS" paragraph (a superset of HEAD's REQ-191
    one) and both REQ-194 account paragraphs, then HEAD's two REQ-195 event
    paragraphs.
  - `INSERT INTO users`: added incoming's `account_id` column and `accountId`
    bind.
- **apps/control-app/src/router.ts** — UU, code file (§2c).
  `businessesPayload`'s admitted branch: took incoming's field rename
  `account:` → `person:` ([[REQ-194]]), keeping HEAD's name source
  `accountName` (resolved by the route from `currentNameOf`, [[REQ-193]]).
  The rest of incoming's rename — the `BusinessesPayload.person` declaration,
  the `person: null` fallback and the `accountId:` provisioning argument —
  merged cleanly and is present.
- **tests/test_UAT_FC_REQ-190_baseline.test.ts** — UU, UAT test (§2f).
  Both sides' prose kept: HEAD's `user_names`/`contact_events` paragraphs plus
  incoming's `accounts` sentence. The assertion is the merge of the two counts
  rather than either side's: the resolved baseline declares eleven
  single-column TEXT primary keys (ten `id` + one `uid`), where HEAD asserted
  ten and incoming nine. No test function was deleted. The adjacent table list
  and its "TEN, NOT NINE" count sit just outside the markers and were updated
  to name `accounts` and read "ELEVEN, NOT TEN" — without that the comment
  would contradict the assertion it explains.

## Incoming changes preserved

Every hunk of `git show d1b3fa897b` for these three files appears in the
resolved tree except the `users.display_name` references, which are dropped
under the BUG-1301 precedence exception:

- `people.ts` — incoming's `displayName: string | null` field,
  `u.display_name AS display_name` column, `displayName: row.display_name`
  mapping, and the `display_name` INSERT column/bind all target a column that
  no longer exists. [[REQ-193]] (`feat(identity): user_names`, already
  integrated into HEAD) moved the name off `users` into its own `user_names`
  table; `db/migrations/0001_baseline.sql:354` documents the removal in prose
  ("was `display_name TEXT` — one nullable free-text field…") and the only
  surviving `display_name` column is `user_names.display_name` at line 528.
  `UserRecord` itself merged cleanly to carry `account_id` and no
  `display_name`, so keeping those hunks would not compile. This is a
  documented, ticketed refactor already in HEAD, not a resolution shortcut.
- `router.ts` — incoming's `admission.user.display_name` for the payload's
  name, same cause: `identity.ts` carries no `display_name` on the admitted
  user any more, and the route already resolves the current name via
  `currentNameOf`/`displayNameFrom` and passes it in. The incoming *rename*
  (the decision the commit is about) is preserved; only its stale value
  expression is not.

## Verification

- `npx tsc --noEmit -p apps/control-app/tsconfig.json` — clean.
- `vitest run --config vitest.node.config.mts` per file:
  `test_UAT_FC_REQ-190_baseline.test.ts` (6 passed),
  `test_UAT_FC_REQ-194_accounts.test.ts` (5 passed),
  `test_UAT_FC_REQ-179_business_scope_chrome.test.ts` (14 passed).
- The workers suites were NOT executed: workerd/miniflare cannot bind a socket
  in this session role (`listen EPERM`), so they are unrunnable here rather
  than failing.

## Flagged for post-merge review

`tests/test_UAT_FC_REQ-193_names.workers.test.ts` (on HEAD, not touched by this
commit and not part of this conflict) still asserts `payload.account.name` and
`payload.account.email` at lines 524-526 and 539-540. Incoming's authoritative
rename makes that field `person`, so those two assertions will fail once this
commit lands. It is the only remaining reader of the old name in authored
source — the only other hit is the build artifact
`apps/control-app/dist-assets/builder/business.js`. Fixing it would mean
authoring test content, which this step may not do.
