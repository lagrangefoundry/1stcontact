---
uid: acceptance_criterion-42cb53a1
id: AC-2330
type: acceptance_criterion
title: Signed out, account-chrome is a working POST form without script, and 'check
  your email' is identical for a known and an unknown address
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-05T21:26:14.034648+00:00'
updated_at: '2026-11-09T22:51:59.945070+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
**With no script, the signed-out chrome is a working sign-in.** The published
page carries a real `<form method="post">` whose action is the site's configured
sign-in endpoint. The form is rendered **open**, so the Sign In control states
`aria-expanded="true"`. It holds a required, labelled `type="email"` field named
`email` and a submit button. Its close control is `type="button"`, so closing
never submits. A visitor without JavaScript can therefore send their address
natively, and every degraded state still lets them do so.

**The overlay holds three parts and shows one.** Inside the form are the
authored `dialog` subtree (with the field, the submit, the close and the clipped
label), the authored `sent` subtree, and the authored `error` subtree. The
`sent` and `error` parts start hidden. No component-painted message element sits
beside the authored card.

**Script only subtracts.** Once the enhancement runs it folds the form away
behind the Sign In control (`aria-expanded="false"`) and turns it into a modal
over the page. Activating Sign In opens the modal (`aria-expanded="true"`, focus
on the address field) and Close folds it again. Submitting sends the address to
the same endpoint with `fetch` instead of navigating.

**"Check your email" cannot tell a known address from an unknown one.** When the
request **completes, whatever its HTTP status**, the dialog part is hidden and
the author's `sent` subtree is shown in its place, so the address field, the
submit and the close are no longer presented. A 202, a 404 and a 500 leave the
page in the same state. The response is never read. Only a request that never
reached the server (a network failure) shows the author's `error` subtree
instead, and it leaves the form standing and usable for a retry.

In the edit channel the form carries no endpoint, so it cannot submit from the
page being edited.

## Observable at
The published HTML of a signed-out page, and the page's DOM after the shipped
client behaviour has run and a submission has completed with each status or
failed to reach the network.
