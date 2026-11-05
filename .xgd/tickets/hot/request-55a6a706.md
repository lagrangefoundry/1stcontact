---
uid: request-55a6a706
id: REQ-435
type: request
title: 'Preview: a semi-transparent ''Updating'' spinner over the site while a build
  is changing it'
created_by: EPIC-19
created_at: '2026-10-23T02:15:42.384221+00:00'
updated_at: '2026-10-23T16:58:27.646474+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 3
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-84d9b034
  commits:
  - working_sha: 785b2000790b3f0ec53056c3437c936136de2d4b
    reconcile_sha: null
    main_sha: null
  - working_sha: 1001a371889030a159ac385abfae9df65343df95
    reconcile_sha: null
    main_sha: null
  version: 0.2.595
---

## Why

During a build the preview refreshes after each page write (BUG-248), so the
client sees every in-between state. On Ariel's site the hero image disappeared
for a while as the top of the home page was rebuilt. The operator: "it felt like
things could be going in the wrong direction for a moment". Nothing on the
preview said that the page was being worked on.

The operator chose the simplest indicator: "a semi-transparent spinner and text
saying 'Updating' in the centre of the image". This is instead of holding back
refreshes or highlighting changes, both of which were proposed and set aside as
too complicated.

## What changes

- **While a page on screen is being built, the preview shows a centred,
  semi-transparent overlay**: a spinner and the word **"Updating"**. The page
  stays visible underneath, and refreshes keep arriving as they do now (BUG-248).
- **When it shows:** from the moment a build that writes the site's pages
  starts (a builder the consultant has delegated to, or any turn writing the
  draft), until that build has finished and the preview has taken its last
  refresh. It is tied to the build, not to the consultant talking: a reply with
  no build shows no overlay.
- **When it goes:** as soon as the build finishes, and also if the turn ends or is
  stopped, or the session goes idle after a restart. It must never be left on
  screen with nothing running.
- **It does not block the client:** they can still scroll and look at the page
  underneath (`pointer-events: none`), and they can switch modes. It shows on the
  preview's View and Edit modes, wherever the site itself is displayed. It does
  not show on Input or Looks.
- **Accessible:** a `role="status"` live region announces "Updating" once when it
  appears, not on every refresh. The spinner respects `prefers-reduced-motion`
  (it stays still and only the word shows).
- The word lives in `config.js`, next to the other preview labels.

## Test plan

`tests/test_UAT_FC_REQ-435_preview_updating_overlay.*`, using jsdom on the builder
with the real draft and progress frames:

- When a build starts, the overlay appears on the preview with the spinner and
  "Updating", and the page underneath still refreshes on each draft write.
- When the build finishes, the overlay goes. It also goes on turn end, on stop, and
  on rejoin to an idle session.
- A consultant reply with no build shows no overlay.
- The overlay passes pointer events through, does not show on Input or Looks, and
  the status region announces once.
- With reduced motion, the spinner does not animate.
- Re-run the BUG-248 preview-refresh UATs.