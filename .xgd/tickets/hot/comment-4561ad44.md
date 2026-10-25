---
uid: comment-4561ad44
id: COMMENT-2282
type: comment
title: Comment on bug BUG-54
created_by: xgd
created_at: '2026-09-05T21:07:24.261190+00:00'
updated_at: '2026-09-05T21:27:05.345450+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-82d884c9
  kind: chat_transcript
---

<!-- xgd-turn id="c658e61b-0ec0-4575-a98b-a06cca183a81-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T21:07:17.016766+00:00" -->
#### You
Users tab, Who they are, all the fields are editable as text fields and none of them save.
Email - editable saved on enter/change field - must be validated as an email address to be saved (one @, followed by a at least one "." separator
State - not editable
Invited - not editable
Last seen - not editable
Created - not editable
Name editable saved on enter/change field 
May sign in  - not editable
First seen / Terms  - not editable

<!-- xgd-turn id="c658e61b-0ec0-4575-a98b-a06cca183a81-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T21:27:04.237414+00:00" -->
#### Claude
Now the server route for `/api/people/status`.

Now let me scope the ticket.

Now cut the branch.

Now the panel edits.

Now the API client.

Now the server: `setPersonRecord` in `people.ts`.

Now the router.

Now the workers-side UAT. Let me look at the existing origin suite for setup shape.

Now run the two suites.

Done — merged to `xgd-working`, ticket at `free_coded`.

**What was wrong.** Two independent faults in the one `mountFields` call in `apps/control-app/src/builder/people.js`:

1. The panel passed `onSave`; the component reads `onCommit`. The key was never read, so every confirmed edit was applied to the widget's own copy of the values and went nowhere. It failed silently by construction — the rollback path only runs when the commit callback *rejects*, and a callback that is never called never rejects.
2. `editable: true` at the mount is the viewer-wide override. The `{ editable: true }` written on the `status` descriptor to mean "only this one" is not a key the component reads (the descriptor axis is `locked`/`defaultEditable`), so it was inert and every field was editable.

**What it does now**, per your list: Email and Name are editable and save; State, May sign in, Invited, First seen, Last seen, Terms accepted and Created carry `locked: true` — the schema's hard ceiling, which no viewer override can lift — and clicking them opens nothing.

Email must have exactly one `@` and, after it, at least one `.` separator; `required`, so clearing it is refused rather than saved as null. The rule has one definition (`builder/email-shape.js`, no imports, the `people-state.js` pattern) read by the panel for the inline refusal and by `people.ts` for the authoritative one — `allowJs` on for the control-app typecheck, `checkJs` still off.

The write goes to a new `POST /api/people/record`, gated on `ownsBusiness` like the invite (not `ownsPlatformBusiness`, which would foreclose level 2). It is a patch, not a record; the address is casefolded because `(tenant_id, email)` is byte-exact and `admit` normalises; a duplicate in one business is caught off the index and returned as a sentence at 400; an unknown id is 404.

**One thing to flag:** with `status` read-only there is now no control anywhere in the UI that suspends a login. `/api/people/status` and `setPersonStatus` survive untouched as the server-side capability (still covered by REQ-170's suite) — only the unused client function went. Say the word if you want that surfaced somewhere else.

**Evidence.** 16 browser cases + 19 workerd cases, all passing; the seven adjacent people suites (59 cases) unchanged. The full run's other failures are this environment's missing knowledge index and reproduce identically on the unmodified checkout.

<!-- xgd-chat-end -->