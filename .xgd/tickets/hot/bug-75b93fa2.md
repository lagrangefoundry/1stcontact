---
uid: bug-75b93fa2
id: BUG-56
type: bug
title: 'Users tab: rename tab and list heading to Contacts'
created_by: xgd
created_at: '2026-09-05T22:26:37.166690+00:00'
updated_at: '2026-09-05T22:30:11.742076+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-1987be2f
  severity: low
  commits:
  - working_sha: 9c0d7b0d1d7ac6470abff9080b6611a2419a4ebb
    reconcile_sha: null
    main_sha: null
  version: 0.2.80
---

## Symptom

The builder's tab strip labels the people surface **"Users"**, and the
list-detail inside it carries the heading **"People"**. Two different words for
one population, and neither is the word the product uses for it.

## Fix

Both visible strings become **"Contacts"**:

- `PEOPLE_TAB.label` in `apps/control-app/src/builder/config.js` — `Users` → `Contacts`
- the `listTitle` passed to `mountListDetail` in `apps/control-app/src/builder/people.js` — `People` → `Contacts`

Nothing else changes. In particular the **tab id stays `people`**, because it is
the namespace for this tab's persistence keys (`STORAGE_KEYS.people`) and the
key `shell.getPanel()` mounts against — renaming it would silently orphan every
operator's saved split position and selection for no visible gain. The label and
the id are deliberately allowed to differ.

The doc comment above `PEOPLE_TAB` argues at length for the label being "Users"
(it is the population of *whichever* business is open, so naming it for the
privileged half would encode a platform-only reading). That argument is about
what the tab must NOT be called — "Admin" — and survives the rename intact:
"Contacts" is equally business-relative. The comment is updated so it defends
the string that is actually there rather than one that is not.

## Why free-coded

Two string literals and their surrounding comments. No design work.

## Test plan

`tests/test_UAT_FC_BUG-56_contacts_label.test.ts` — asserts both surfaces read
"Contacts":

1. `PEOPLE_TAB.label === 'Contacts'`, and its id is still `people` (the
   id/label split above is the part a future rename could break silently).
2. A mounted people panel renders "Contacts" as its list heading.

Regression scope: `tests/test_UAT_FC_REQ-189_users_tab_presentation.test.ts`
and `tests/test_UAT_FC_REQ-170_people.workers.test.ts` — the two suites that
mount this panel.