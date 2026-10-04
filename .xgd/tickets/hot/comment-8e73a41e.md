---
uid: comment-8e73a41e
id: COMMENT-4877
type: comment
title: Comment on request REQ-378
created_by: xgd
created_at: '2026-10-04T00:31:20.225391+00:00'
updated_at: '2026-10-04T00:37:41.755767+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b3f68517
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8ed326d7-e44d-48df-864c-95911ce43404",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b80b128b-8cdf-41da-9e33-b1798d049682-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T00:30:17.885980+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b80b128b-8cdf-41da-9e33-b1798d049682-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T00:37:41.397574+00:00" -->
#### Claude
I haven't changed anything yet. One thing blocks the build, and I need your call on it before I start.

## The blocker: REQ-206 hasn't started

Your ticket requires the consultant to have web search, and says it must not ship without it. That depends on lagrange-framework REQ-206, which is still at `draft`. It has no branch, and `web_search` doesn't appear anywhere in the framework's code yet. Production deploys from xgd-working, so merging this work there means shipping it. REQ-206 is framework code, so I can't do it from this session.

Your options:

1. **Build now and hold the merge (my recommendation).** I build everything on `free-REQ-378`: the board, the viewer, the consultant's tools, the priming and DOC-64 changes, and the UATs. I don't merge until REQ-206 lands. Then I add the `web_search` grant, which is a config change, plus its UAT, and merge. The work gets done without breaking the ticket's rule. The cost is that a large branch stays open and may need conflicts resolved at merge time.
2. **Build and merge now, without search.** I'd make the priming honest about the missing tool. This goes against requirement 1 as written.
3. **Wait** until REQ-206 lands.

## How I'd build it

None of this needs your input unless you see something wrong:

- **Where the list lives:** a `comps` list on the plan ticket, holding the reference ticket, who added it (consultant or client) and when. `panelView` returns it with each entry's title and thumbnail. Clients add a URL through a new plan route that reuses the existing capture-and-adopt path (`adoptCapture`).
- **Likes and dislikes:** stored as `likes` and `dislikes` lists on the reference ticket. The client edits them inline on the plan panel. The consultant records them with a new tool. Changes the client makes reach the consultant's next turn through the mechanism that already sends it the client's plan answers.
- **Conventions:** the consultant records them as the `visual_concept` decision's value, linking to the comps that shaped them.
- **The comp viewer:** a new preview-pane mode that draws its own content instead of loading the draft. It shows only its own controls: the "Viewing: <site>" banner, Back to your draft, previous/next, Visit the live site, and the line about motion. Edit, pages, colours and Publish don't appear in it. Images come from the existing route that serves capture files, so nothing is iframed and no captured HTML is served from our origin.
- **Desktop/phone toggle:** the preview pane doesn't actually have one today. The only "phone" control is the QR-code dialog. So the viewer gets its own toggle, showing the capture's 1280px and 375px screenshots.
- **Hero thumbnail:** a CSS crop of the top viewport of the screenshot we already store, with no image processing. If the full-page screenshots turn out to be too heavy to load as thumbnails, I'll crop once at capture time instead.
- **Motion line:** written from what the capture already records about animation (`multistate.json`) where that exists.

Tell me which option you want and I'll start. If it's option 1, I'll set the ticket to `free_coding` and cut the branch.

<!-- xgd-chat-end -->