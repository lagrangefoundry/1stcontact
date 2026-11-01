---
uid: report-7473e39a
id: REPORT-7918
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-01T23:59:31.104663+00:00'
updated_at: '2026-11-01T23:59:31.104663+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

Incoming commit: b857e9d00b "Merge xgd-working into free-REQ-185 before promotion" (2026-09-04), parents 2103d2e63b / 92f2a052a0. All seven conflicts resolved to the HEAD side. HEAD is a strict superset in every hunk; staged result has no diff vs HEAD (redundant commit, BUG-1109/BUG-1122 shape).

- `.xgd/tickets/hot/comment-a40ed226.md` (2e, bookkeeping): HEAD superset. Later `updated_at` (2026-09-05T02:19 vs 00:40); HEAD carries three additional chat turns, incoming side of that hunk empty.
- `.xgd/tickets/hot/request-93cc89ff.md` (REQ-185, 2e): HEAD superset. Status `free_and_reconciled` (2026-11-01) vs stale `free_coding` (2026-09-05). HEAD's body adds the `ownsBusiness`/`ownsPlatformBusiness` and exported-seed paragraphs; the REQ-180 guard paragraph is the same text on both sides. Blank-line hunk taken from HEAD.
- `.xgd/tickets/hot/request-95dffc48.md` (REQ-184, 2e): HEAD frontmatter (`free_and_reconciled`, 2026-11-01) supersedes stale `ready_to_reconcile`.
- `.xgd/tickets/hot/request-b813aa4a.md` (REQ-179, 2e): HEAD frontmatter (`free_and_reconciled`, 2026-11-01) supersedes stale `free_coded`. Trailing-whitespace-only body hunk taken from HEAD.
- `apps/control-app/src/builder/app.js` (2c): conflict hunk was HEAD-only addition (BUG-52 session-ended notice, `onSessionEnded`/`createSessionNotice`, import at line 45); incoming side empty. Kept HEAD; nothing incoming dropped.
- `apps/control-app/src/builder/builder.css` (2c): same shape, a HEAD-only addition (BUG-52 `.builder-session-notice` / `.builder-signed-out` styles), incoming side empty. Kept HEAD.
- `package.json` (2c scalar): see arbitration below.

Sparse-cone ticket files were staged with `git add --sparse`.

## Incoming changes preserved

Checked against `git diff 2103d2e63b b857e9d00b` (what the merge brings to the free-REQ-185 line). Every incoming hunk is already in HEAD:
- app.js: `BUSINESS_NONE_SELECTABLE_MESSAGE` import (l.9), "NON-EMPTY WITH NOTHING SELECTABLE" doc (l.71), `noBusiness`/`blockTabs` call (l.249-250), `loadSitesFor` empty-scope guard (l.302), `function blockTabs` (l.917).
- builder.css: `.builder-shell--no-business` (l.1764), `.builder-banner--no-business` (l.1775), `.builder-business[data-none-selectable='true']` rules (l.1887, 1891).
No hunks were dropped under the BUG-1301 exception.

## Arbitration of last resort (BUG-1460)

- `package.json` `version`: incoming bumps 0.2.68 -> 0.2.69; HEAD is 0.2.81. Resolved at tier 1. Later intents already on HEAD (REQ-184/185/179 now `free_and_reconciled`, plus later free-coded commits such as the Contacts/people work) moved the version past 0.2.69, so the incoming bump is superseded. Applying it would regress the version. Dropped the incoming scalar; kept 0.2.81.
