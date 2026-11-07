---
uid: comment-5172539d
id: COMMENT-7917
type: comment
title: Claude response for reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-07T07:31:37.441047+00:00'
updated_at: '2026-11-07T07:31:37.441047+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-9b2c552c
  kind: note
---

I added 14 reconciliation UATs in two new files for story-7b1025b8, plan item 4 of 7. 13 pass and one fails. The failure is the selection-clearing bug the story already records as a CODE-ISSUE, not a wrong test.

I wrote tests only for the 11 ACs this bundle added or restated: AC-2336, 2337, 2338, 2339, 2169, 2172, 1743, 1744, 2248, 2171, 2253. AC-2175 is superseded, so it gets no test. The story's other ACs were left unchanged by this bundle and already have UATs.

**Workers suite** (`tests/test_reconciliation_contacts_add_invite.workers.test.ts`): 11 tests, all pass. They run against real D1 with a real signed Access token.
- The permission and 404/400 cases go through the deployed `worker.fetch`. They check that no mail was sent by watching the log line the local mailer prints.
- The cases that need to count messages or make the provider fail call `route()` directly, using the router's `sendEmail` slot for a test mailer and the admission `admit` really returns. Through `worker.fetch` the mailer can't be told to fail.

**Contacts tab suite** (`tests/test_reconciliation_contacts_add_invite_tab.test.ts`): 3 tests in jsdom, 2 pass. These cover the on-screen part of AC-2336, AC-2337 and AC-2339. A workers test can't render the tab, so those three ACs each have one test per file, with distinct names.

The failing test is `test_UAT_AC2339_..._the_selection_survives_a_send_in_which_nothing_was_sent`. When every result is `refused`, the Contacts panel still clears the selection. `apps/control-app/src/builder/people.js:1005` calls `selected.clear()` after every answered send, so Invite goes back to disabled. AC-2339 says the selection should survive, and I left the assertion as written. The fix belongs to the downstream `fix_uat_coverage` loop: clear the selection only when at least one result is `sent`.

One test needed a self-correction: jsdom doesn't support `isContentEditable`, so the read-only From check now looks at the `contenteditable` attribute instead.

I couldn't lint the new files: there's no ESLint config in the repo and the sandbox blocked fetching it. The tests aren't covered by any tsconfig either, so the only compile check was vitest running them. The older invite-based tests for some of these ACs are stale under REQ-199, and I left them alone as instructed.

```
⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - test_UAT_AC2339_the_modal_reports_every_contact_and_the_selection_survives_a_send_in_which_nothing_was_sent: the panel clears the selection after an all-refused send (people.js:1005)

Tests written: 14
Tests passed: 13
Tests failed: 1

test_files_created:
  - "tests/test_reconciliation_contacts_add_invite.workers.test.ts"
  - "tests/test_reconciliation_contacts_add_invite_tab.test.ts"
```