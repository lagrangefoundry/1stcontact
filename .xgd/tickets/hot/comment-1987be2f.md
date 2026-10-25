---
uid: comment-1987be2f
id: COMMENT-2285
type: comment
title: Comment on bug BUG-56
created_by: xgd
created_at: '2026-09-05T22:27:35.828684+00:00'
updated_at: '2026-09-05T22:30:23.875390+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-75b93fa2
  kind: chat_transcript
---

<!-- xgd-turn id="6b33fa08-c312-4991-8d9b-94d802b43d8e-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T22:27:24.808827+00:00" -->
#### You
The item list on the Users tab is labeled "People" - can you change it to Contacts and can you also change the tab to Contacts please

<!-- xgd-turn id="6b33fa08-c312-4991-8d9b-94d802b43d8e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T22:30:23.829379+00:00" -->
#### Claude
Now the two edits.

Now bump version and commit.

Done. Both surfaces now read **Contacts**:

- `apps/control-app/src/builder/config.js:81` — `PEOPLE_TAB.label`: `Users` → `Contacts`
- `apps/control-app/src/builder/people.js:677` — `listTitle`: `People` → `Contacts`

The tab **id stays `people`** deliberately — it namespaces the tab's persistence keys (`STORAGE_KEYS.people`) and is what `getPanel` mounts against, so renaming it would orphan every operator's saved split position and selection for nothing visible. I updated the doc comment above `PEOPLE_TAB` (which argued explicitly for the string "Users") so it defends the string that's actually there; its real point — the tab must not be named for the privileged half, since it shows whichever business is open — survives unchanged, as "Contacts" is business-relative in the same way. Two stale comment references in `app.js` and `builder.css` were updated too.

New UAT `tests/test_UAT_FC_BUG-56_contacts_label.test.ts` pins both strings independently (they're set in different files by different mechanisms, so a half-done rename is exactly what this ticket found) and pins the id/label split so a future "tidy-up" fails rather than silently orphaning storage. 2 tests pass; regression scope (REQ-189, REQ-170, REQ-161 — 30 tests) green.

Committed as `9c0d7b0` `[FREE-CODED]`, version bumped 0.2.79 → 0.2.80, ticket BUG-56 at `free_coded` with the body describing the change. Ready for you to promote to `ready_to_reconcile` when you're happy with it.

<!-- xgd-chat-end -->