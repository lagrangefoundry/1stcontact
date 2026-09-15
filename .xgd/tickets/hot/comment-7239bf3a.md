---
uid: comment-7239bf3a
id: COMMENT-3004
type: comment
title: Comment on bug BUG-94
created_by: xgd
created_at: '2026-09-15T21:51:09.544100+00:00'
updated_at: '2026-09-15T22:15:09.717708+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-af661441
  kind: chat_transcript
---

<!-- xgd-turn id="9a4f6a1c-84e2-4bea-9ee7-fa5b28a7f707-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T21:50:27.572124+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="9a4f6a1c-84e2-4bea-9ee7-fa5b28a7f707-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-15T22:15:09.556980+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now let me look at preview.ts and how the builder serves draft/edit channels.

Now let me look at the "never served" test and the publish path.

I have the picture. Let me confirm the key facts before implementing.

Now let me set the ticket to `free_coding` and cut a branch.

Now the render change.

Now the options field:

Now the email page renderer and the page loop:

Now the preview side:

Now let me typecheck and run the existing REQ-247 tests.

Both pass. Now let me write the UAT file.

Now let me look at how to inspect published revision output.

Now let me write the UAT file.

Home has an L1 document. Let me fix both tests.

Now the regression scope — the render, preview, publish and page-control neighbourhoods.

Now let me check the sweep result.

Baseline comparison confirms no regressions. Now version bump and commit.

Now merge back to `xgd-working`.

Merged cleanly. Now record the ticket and clean up.

Done. BUG-94 is at `free_coded` on `xgd-working`.

## What changed

**`renderSiteFiles` grows one option** — `emailPages` — that emits the site's email pages through the email target, in addition to the pages a published revision serves. `servedPages` keeps saying exactly what REQ-247 meant it to say and stops being the only answer to *which pages does this render emit*; a new `renderedPages` answers that.

**The builder's preview is the only caller that sets it.** Publish and `1c render` pass nothing, so a published revision still carries no file for a message — the same "a file that was never written" property REQ-247 chose, not a route that declines to serve. The preview sets it for every channel it serves, `rev-<id>` included: a frozen revision is the builder looking at what the public surface *was*, not the public surface.

**The bytes are `renderL1Email`'s** — the same emitter `lead.ts` puts in the envelope, so what the operator approves is what arrives.

## Three decisions I made rather than asking

- **A message has one rendering; the View/Edit toggle does not change it.** The toggle chooses between a page as a reader meets it and the same page with its regions addressable, and neither half exists for something a mail client paints. The consequence is that **click-to-edit does not operate on a message** — the edit channel's segment stamping belongs to the web emitter. Copy is still changed through `set_l1`, which is how REQ-247 AC-2 already had it; what was missing and is restored is the ability to *look*. Stamping the email target for direct manipulation is separate work and I've said so in the ticket body rather than leaving it to be mistaken for an oversight.
- **`rev-<id>` renders messages too**, for the reason above.
- **An email page with no L1 gets no file**, the same answer the sender already gives it.

Screenshots come free — `shot.ts` shoots through the same `PreviewRenderer`, so the assistant can now look at a message as well as read it.

## Evidence

`tests/test_UAT_FC_BUG-94_email_preview.test.ts` — 10 UATs through real entry points: the toolbox makes and edits the page, the real builder transport serves it, the real `/api/pages` provides the listing, and `previewPageUrl` (the function `pages.open` calls) composes the URL. The preview bytes are asserted as a **byte equality** against `renderL1Email` over the stored document and palette. The published half is asserted directly — exhaustive file-list comparison, no artifact carrying the copy, and every published byte identical to the same site without the message.

Verified RED: with the flag off, exactly the 8 preview-side UATs fail and the 2 published-half ones pass.

Full suite: `4214 passed, 12 failed`. I ran a baseline sweep with the change reverted, which fails `4` in a *different* set of files — the same webui/asset family (`the control-app assets are not built — run 1c assets`) that is flaky in an unbuilt worktree. Running all seven sweep-only failures together with the change in place: **all pass**. Two files (`bug32-webui-scope-rebrand`, `test_UAT_FC_BUG-67_backend_settings`) fail in both runs — pre-existing.

One snag worth knowing: the first `move-to-free-coded` was rejected because a concurrent session had already claimed `0.2.205`, so there's a second commit (`a549615`) carrying the re-bump to `0.2.206`. Both SHAs are on the ticket.

<!-- xgd-chat-end -->