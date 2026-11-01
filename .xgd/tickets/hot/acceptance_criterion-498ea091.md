---
uid: acceptance_criterion-498ea091
id: AC-2230
type: acceptance_criterion
title: An expired session at load is reported in place of the builder, and mid-session
  as a strip above a shell that stays live; neither renders an empty account and a
  refused listing clears no pane
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:49:56.060939+00:00'
updated_at: '2026-11-01T20:49:56.060939+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

An ended session is reported as an ended session. It is never drawn as a working
builder with no account, no businesses and no sites, because that is
indistinguishable from a deleted account.

**How the client recognises one.** Every request the builder makes goes through
one transport, so no request can miss this. A request is treated as a sign that
the session has ended in two cases:

- **The origin answers 401.** The reason is *expired*, and the wording is
  *"Your session has ended. Sign in again to carry on."*
- **The request does not complete at all.** The fetch rejects, with no status.
  Behind the identity provider this is what a lapsed cookie looks like: a
  cross-origin redirect a background request cannot follow. The reason is
  *unreachable*, and the wording is hedged: *"The builder could not reach the
  server — your session may have ended. Sign in again to carry on."* The original
  error is kept as the failure's cause.

The three calls made on load (the account and its businesses, the assistant
status, and the business's site listing) **refuse** on a 401. They do not return
an empty account, a healthy assistant or an empty list.

**At load.** If the opening calls are refused, the reason is drawn **as the only
content of the mount point**, where the builder would have been. No builder is
mounted. Filling the mount point also stands down the in-page start-up guard
(AC-1403), so the page never says the session ended and then, seconds later, that
the builder did not start. A load failure that is not a refused session is still
thrown, so it is not reported as "sign in again".

**Mid-session.** A refused call puts a strip above the shell, as a sibling of the
shell rather than inside it, so its text can be selected and copied. It is shown
**once**, however many calls are refused. The shell stays live: it is not made
inert, it is not dimmed, and the operator's unsaved work (an open dialog, typed
text) stays where it is and remains editable.

**A refused site listing changes nothing.** When the listing for the selected
business is refused, the displayed site, the Library and the Contacts tab are
left as they were. They are not rewritten from a store this session can no
longer read.

**Recovery is the operator's choice.** Both forms carry an alert role and a
*Sign in again* button. Pressing it performs a top-level reload, which is the one
navigation the identity provider answers with its login page. Nothing navigates
on its own.

## Verification

Mount the builder against an origin that answers 401 to every call. Assert that
the mount point's only child is the notice with the *expired* wording and a
*Sign in again* button, that no shell is mounted, and that pressing the button
invokes the injected top-level navigation exactly once. Repeat with a fetch that
rejects. Assert the *unreachable* wording, and that the refused error carries
the original as its cause. Assert that a load which fails for some other reason
still throws.

Mount the builder against a working origin, open a dialog and type into it, then
make every later call answer 401 and trigger several calls. Assert that exactly
one strip appears above the shell, that the shell and the dialog are not inert
and carry no dimming class, and that the typed text is unchanged. Trigger a
business switch whose site listing answers 401, and assert the displayed site,
the Library rows and the Contacts rows are unchanged.
