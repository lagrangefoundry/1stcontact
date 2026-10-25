---
uid: comment-209f66e9
id: COMMENT-3000
type: comment
title: Comment on request REQ-248
created_by: xgd
created_at: '2026-09-14T22:13:48.479588+00:00'
updated_at: '2026-09-15T00:13:08.308338+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-10200dc8
  kind: chat_transcript
---

<!-- xgd-turn id="bdd42322-6f59-4948-8f94-0dcc33e88499-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T22:13:33.274530+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="bdd42322-6f59-4948-8f94-0dcc33e88499-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T22:44:26.255688+00:00" -->
#### Claude
Now let me set up the ticket and branch before coding.

Now the reachability derivation in `edit.ts`, beside `navEntriesTargeting`:

Now extend `editPageList`:

Now the client API additions:

Now `panel.navigateDocument`:

Now wire it in `app.js`:

Now the CSS:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="ec69400f-f75b-4e1d-977a-c8e4f945c60e-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T00:02:22.485975+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="ec69400f-f75b-4e1d-977a-c8e4f945c60e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-15T00:13:06.921263+00:00" -->
#### Claude
Now the regression scope — the touched suites plus the builder and edit neighbours.

Now lock and merge back into `xgd-working`.

REQ-248 is free-coded and landed on `xgd-working`.

## What I found and finished

The prior session had written essentially the whole feature but the turn died before committing — everything was sitting uncommitted in the `free-REQ-248` worktree. I reviewed it, added the one missing AC, ran the regression, and landed it.

**The change**: a `Page` select in the builder's control bar, listing every page and marking the ones a reader could never arrive at.

- `editPageList` (`tools/generate/src/cli/edit.ts:1271`) now returns `reachable` per row, derived by a walk from the front door — the home page plus anything a reachable page links to, with `nav` entries counted as links from everywhere. Reachability, not an incoming-link count: two pages linking only to each other are still unreachable.
- `GET /api/pages?site=` (`apps/control-app/src/router.ts:3215`) is a thin transport over it, so the builder and the assistant's `list_pages` answer from one derivation.
- `createPageIndex` (`apps/control-app/src/builder/pages.js`) holds the listing above the toolbar; `panel.navigateDocument` moves the frame rather than re-deriving the pane (which would compose the page being left).

**What I added this turn**: AC-15 (the control sits in the same position in View and Edit) had no test — the two mode declarations put `pages` at index 1 in both, but nothing asserted it. Added that to the "offered in view and in edit alike" case.

**Tests** — all in the foreground:
- The three REQ-248 suites: 20 tests, pass.
- Full node suite: 4145 pass, 2 fail — `bug32-webui-scope-rebrand` and `test_UAT_FC_BUG-67_backend_settings`. I confirmed both fail identically on `xgd-working` without my changes; they are pre-existing and unrelated.
- Full workers suite: 941 pass, 0 fail.
- `tsc` on `apps/control-app`: clean.

Commit `2bb86eb94d0` `[FREE-CODED]`, version bumped 0.2.199 → 0.2.200, merged into `xgd-working`, ticket at `free_coded` with `story_points: 3`, branch cleaned. I appended §9 (what landed) and §10 (evidence) to the body rather than rewriting the existing sections.

<!-- xgd-chat-end -->