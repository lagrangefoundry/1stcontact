---
uid: comment-3dd62296
id: COMMENT-2297
type: comment
title: Comment on request REQ-199
created_by: xgd
created_at: '2026-09-06T19:45:47.660547+00:00'
updated_at: '2026-09-06T20:57:52.377751+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ee6ed740
  kind: chat_transcript
---

<!-- xgd-turn id="c7b0f3ac-6ae7-4bdc-953d-731769d0becf-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T19:45:06.512519+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c7b0f3ac-6ae7-4bdc-953d-731769d0becf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T20:16:39.013844+00:00" -->
#### Claude
Now let me rework `templates.ts` so the render works on copy, not only on a ticket.

Now I'll replace lines 497–758 of `people.ts` with the two separate acts.

Now the new `invites.ts` — the composition that renders, sends, records and transitions.

Now add a narrow single-person read to `people.ts` and clean up `invites.ts`.

Now the route paths and handlers.

Now the panel's selection state, the `+` control, and the rewritten invite modal.

Now the CSS for the new controls.

Now update the module docstring in `people.js` and fix the remaining stale references.

Now update the test suites that call the old `invitePerson`, plus the fixture.

Now the REQ-186 suite, which pinned the old insert-or-update invite.

Now REQ-199's own UATs. First the workers-side one, driving the real send path.

Now the route-level coverage for `/api/people/add` and the invite draft, driven through the Worker.

Now the wider regression scope.

Now the REQ-188 axes suites.

<!-- xgd-turn id="79c3d0b3-aba5-409f-aa37-7a82bbb77339-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T20:30:58.228242+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="79c3d0b3-aba5-409f-aa37-7a82bbb77339-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T20:57:52.167043+00:00" -->
#### Claude
Now I'll add the explicit UAT for the migration fix.

Now I'll update BUG-53's fixture and the two dialog tests.

Now let me bring the branch up to date with `xgd-working` before committing.

Now back to the branch for the version bump and commit.

Now lock and merge back into `xgd-working`.

REQ-199 is free-coded and landed on `xgd-working`.

## What shipped

**Two acts, two functions, two routes.** `addContact` creates a contact as a **Lead** and sends nothing (`POST /api/people/add`); `invitePeople` moves existing contacts Lead → Invited and mails them (`POST /api/people/invite`, with `GET` returning what the modal opens with). Neither takes a flag selecting the other's behaviour.

**Invite acts on a checked selection**, disabled while nothing is ticked. The modal shows From display-only, prefills Subject/Body from the business's `invite` template, and labels recipients `To-List:` with a hover explaining why — N messages, one recipient each. `OutgoingMessage.to` is a string, so the falsifier (*more than one recipient on one message*) isn't expressible on this path. Edits apply to this send only and are held to the template's declared `{{cta_url}}`.

**`apps/control-app/src/invites.ts`** is the one home for the composition (templates + mail port + message record + pipeline transition), with the mail port passed in and never imported.

## What I did this session, on top of the prior session's work

- **Fixed two regressions the change caused elsewhere.** `tests/support/invite-account.ts` now adds rather than invites, which broke REQ-170's contact-vs-member case (it relied on the fixture stamping `invited_at` as a side effect) — that case now performs the second act explicitly. BUG-53's dialog sweep clicked Invite with nothing selected, so no dialog opened; it now ticks a row and expects the `Send 1` label.
- **Added a UAT** asserting the invite's message record lands with its change-journal row — the invite is the first product path writing a ticket from inside the Worker, so it exercises the deployed migration's transcription of the ticket store schema.
- **Dropped the prior session's `ticket_changes` migration addition** — merging `xgd-working` showed REQ-201 had already added the identical table; the conflict resolved wholly toward upstream.
- **Extended the ticket body** with "What the shape forced", "What this changed elsewhere" and "Further acceptance" so every UAT is motivated by ticket language.

## Test results

Full suite on the merged branch: **368 files passed, 7 failed (18 tests)**. All seven failures reproduce identically on `xgd-working` without my changes — five knowledge/KB suites plus `bug32-webui-scope-rebrand` (shared component store absent) and `reconciliation-builder-workspace-origin` (REQ-201's `/api/material/changes` has no cacheability probe). `pnpm -r build` typechecks clean.

One thing worth flagging: `test_UAT_FC_REQ-162_ticket_store_bindings`'s schema-drift check is `skipIf(!TICKETING_INSTALLED)` and silently skips here, so the guard that exists to catch migration/component forks isn't producing evidence in this environment. I left it alone — it's REQ-162's asset, not this ticket's scope — but it's the reason the missing `ticket_changes` table wasn't caught earlier.

Ticket is parked at `free_coded` (version 0.2.120, story points 5, both SHAs recorded). Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->