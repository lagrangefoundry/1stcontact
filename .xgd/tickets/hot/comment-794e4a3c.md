---
uid: comment-794e4a3c
id: COMMENT-2172
type: comment
title: Comment on request REQ-176
created_by: xgd
created_at: '2026-09-02T22:28:07.635216+00:00'
updated_at: '2026-09-02T22:37:26.328536+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-bfd833d0
  kind: chat_transcript
---

<!-- xgd-turn id="1c58e183-d1fc-4784-8e00-4feb3cca0add-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T22:27:39.011785+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="1c58e183-d1fc-4784-8e00-4feb3cca0add-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T22:37:26.113588+00:00" -->
#### Claude
Ticket read. BUG-47 has already landed (`free_coded`), so its ordering constraint is satisfied — the badge now reads `placed_on`, not `site_slug`. Let me start the free-coding cycle.

Now the CSS:

Now the wording in `config.js`:

Now the fallout: the AI's surface manual quotes the old label by name.

Now update the two existing tests whose literals name the old label:

Now the UAT suite for this ticket:

Now update the ticket body with what actually landed (preserving the existing content):

Now commit:

Merge landed cleanly. Now record it on the ticket and clean up:

Done — REQ-176 is at `free_coded`, commit `e1ceeb6`, version 0.2.45, merged into `xgd-working`.

## What landed

**1. Type icon.** `KIND_ICON` maps the three kinds a client uploads (`document`, `image`, `font`) to distinct glyphs; `KIND_ICON_FALLBACK` catches `capture` and anything DOC-38 §9 adds later, so no row can ever render iconless. The `kind` pill is gone.

One thing the ticket didn't specify and I decided: **the icon is labelled, not `aria-hidden`.** The pill was the only place the row said its type in words, so the glyph carries `role="img"` + `aria-label="<kind>"` — the fact moved, it didn't leave. (The overlay's area icons *are* correctly `aria-hidden`, because a visible label sits beside them.)

**2. One-line row.** Row axis, title at `flex: 1 1 auto; min-width: 0` with `font-size: 13px` to match `.list-detail-row-title`; icon and pills `flex: none`, meta strip no longer wraps. Truncation lands on the title only. `webui-list-detail` untouched.

**3. Three wording changes.** `Purpose`, `Site asset`, `Background information`. Wire values `site`/`reference` and both hints unchanged; `ROLE_LABEL` carried the rename to the Library's pill and filter from the one constant.

**Not in the ticket, and load-bearing:** the L1 surface declaration's "cannot fetch a file" note tells the client to *choose the drop area by name*. Renaming the area without it would have left the assistant sending clients to a button that isn't on screen. So `l1-surface.json` was renamed too, the two suites asserting the old literal (`BUG-44`, `REQ-130`) were updated, and this ticket's UAT asserts the note **against the constant** — so those two can't drift again. Stale comments in `router.ts`/`tickets.ts` quoting the old labels were fixed for the same reason. All of this is recorded in the ticket body.

BUG-47's ordering constraint was already discharged — it's `free_coded` and landed, and the badge reads `placed_on`.

Nine UATs in `tests/test_UAT_FC_REQ-176_library_row_and_wording.test.ts`, all green, plus the Library/upload/surface/workers/builder-origin regression scope.

## The question I need answered

I did **not** implement the fourth string. `Live on the site` would be false — `placeOnSite` writes to `draft/assets`, and publishing is a separate act, so a client who reads it and doesn't publish has been told their logo is on their website when it isn't.

Also worth flagging: BUG-47 moved the strings that section describes. What's actually on screen now is:

| Surface | Reads |
|---|---|
| row pill | `On this site` |
| rights field on `placed_on` | `Used on` |
| list filter checkbox | `Used on this site` |

My recommendation is `Added to the site` for the pill and `Added to` for the field label, with the filter following — true of the draft, and it says a real thing happened. But tell me which you want:

1. **`Added to the site`** (my recommendation), or another draft-true wording you prefer;
2. **leave all three as they are** — they're already accurate;
3. **`Live on the site` as requested**, which only becomes true if promotion should be publish-visible — that's a different and much larger ticket, not a wording change.

Either way it's a small follow-up commit onto this same ticket.

<!-- xgd-chat-end -->