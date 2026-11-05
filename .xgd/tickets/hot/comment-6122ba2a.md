---
uid: comment-6122ba2a
id: COMMENT-7808
type: comment
title: Comment on request REQ-653
created_by: xgd
created_at: '2026-11-05T14:59:17.739607+00:00'
updated_at: '2026-11-05T15:18:16.675367+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-130aae02
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0b1eb820-4453-4699-9d56-108c401a4461",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="121120e9-5025-4e77-b932-7bf86065b4e8-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T14:58:56.177535+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="121120e9-5025-4e77-b932-7bf86065b4e8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T15:18:16.513559+00:00" -->
#### Claude
Reading the plan view's server side to see what it carries about publishing.

Implementation plan is clear. Setting the ticket to `free_coding` and cutting the branch.

Writing the code now: the plan view's `published` flag, the panel hiding only the stage part, and a refresh after publish.

Now the edits. Server side first:

Now the panel and the builder host:

Now the UAT file. Panel-level for the three panel rules, the builder for the in-session publish, and the router for the view's flag.

Writing the two UAT files.

Both UAT suites pass, and the in-session one fails without the post-publish refresh. Now the neighbouring regression scope: other plan-panel/banner suites, typecheck, and REQ-408's CSS guard.

Two failures; checking whether they're pre-existing on clean xgd-working.

Both failures already happen on clean xgd-working, so my change didn't cause them. Next: typecheck and the plan-view workers suites.

Two pre-existing ArrayBuffer type errors, none in my files. Now bumping the version and committing.

Commit the feature first, then update the ticket body before merging.

Now updating the ticket body. I'm keeping the existing text and adding the implementation section.

Now the merge back. Lock, bring xgd-working into the branch, bump the version on the branch, then fast-forward.

REQ-653 is done and merged into xgd-working. Once a site has been published for the first time, the progress banner no longer shows the stages. The ticket is at `free_coded`, ready for you to promote.

**What changed**
- **Server:** the plan view now includes `published`. It reads true once the plan records the site's first publish. That record (`milestones.published_at`, from REQ-638) is set once and never cleared. For sites published before plans recorded this, the server reads the site's past publishes instead, and only while the plan has no record. Every plan route that returns the view includes it.
- **Builder:** once a view says the site is published, the banner hides the stage list and its "Progress" title. The status row stays: the idle line, the status of running work (BUG-244) and turns the consultant started (BUG-348). "How you can help" stays next to it. A later view saying "not published" doesn't bring the stages back, and switching to another site resets it. After a publish, the builder re-reads the plan, so the stages disappear without a reload.
- **REQ-638 had already landed**, so the banner being hidden is its nine-piece one. The trigger is the site's first publish, not the Live piece's state.

**Tests**
- I added two test files, both named `test_UAT_FC_REQ-653_published_site_drops_the_stage_banner`:
  - **Builder (jsdom), 4 tests**, one per point in the ticket's test plan. The publish-without-reload test fails if the re-read after publishing is removed.
  - **Worker, 2 tests:** `published` is false before the first publish and true after, and an older site whose plan has no record still reads as published.
- Both pass. The four related Worker suites pass, and the control-app type check is clean. 100 of 102 tests in the related builder suites pass.
- The other two fail the same way on xgd-working without my change, so they are existing failures: `BUG-244_the_plus_in_the_composer…` and `REQ-398_hover_focus_and_tap…`.
- `tools/generate` has two existing type errors (ArrayBuffer types), neither in a file I changed.

**Commits:** `f5d26b08e2…` (the feature) and `0054ec33d9…` (version 0.2.781), with story points set to 2.

**Open question:** the builder hides the stages but always keeps the banner frame with its status row. When nothing is running, that row just shows the idle line. If you'd rather the whole banner collapse on a published site when idle, that's a small follow-up.

To see it on dev, run `bin/deploy --env dev`, since dev serves a frozen snapshot.

<!-- xgd-chat-end -->