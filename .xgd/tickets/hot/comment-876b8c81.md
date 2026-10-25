---
uid: comment-876b8c81
id: COMMENT-5357
type: comment
title: Comment on epic EPIC-24
created_by: xgd
created_at: '2026-10-10T18:20:55.517692+00:00'
updated_at: '2026-10-18T00:44:56.305655+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-f43a7c98
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c9388adb-93b0-4093-9ef4-89dcef0bd456",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d1edca6e-6063-489b-9581-f8af6dedc045-user" -->

<!-- xgd-chat role="user" ts="2026-10-10T18:20:34.781370+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4bc8fc7d-a9c5-4ea6-a100-0834cda4878c-user" -->

<!-- xgd-chat role="user" ts="2026-10-10T18:22:35.004691+00:00" -->
#### You
Wiat this was created as an Epic - please lay out the implementation tickets - DO NOT WRITE CODE

<!-- xgd-turn id="4bc8fc7d-a9c5-4ea6-a100-0834cda4878c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-10T18:28:20.548194+00:00" -->
#### Claude
Filed lagrange-framework REQ-207, the framework child. Next I'm writing the two 1stcontact children: page decomposition, and draft-file locks with the consultant teaching.

I've filed three implementation tickets for EPIC-24, all at `draft`, and written no code. They follow your simplified plan from 2026-10-03, and the epic body now lists them in a **Children** section.

| Ticket | What it is | Can start? |
|---|---|---|
| **REQ-396**: Draft pages: a frame plus separately stored sections, assembled at render | Piece 1 of your plan. A page is stored as a frame plus one row per section, keyed by the section's id. It is reassembled into today's single document before render and validation, so neither changes. The page-editing tools gain an optional `section` argument, and addresses inside a section stop depending on what happens elsewhere on the page. A write that breaks the section rules (layout or duplicate ids, for example) is refused. Pages are split on demand; pages that aren't split keep working as today. | Yes, it depends on nothing else |
| **REQ-397**: Builder sessions: leased locks on draft files, and the consultant taught to plan by file | Pieces 2 and 3. A new D1 table holds leased locks on the site file, page frames, sections and whole pages. Every draft write checks the caller holds the file. The client's own edits in the builder get a 409 that names the builder holding the file. Also covered: showing who holds what, and the consultant's manual and priming. | Partly. The lock table, write checks, client-edit refusals and safe writes can start now. Declaring files when a builder session is opened waits on REQ-207, and section locks wait on REQ-396. |
| **lagrange-framework REQ-207**: components/ai: concurrent tool calls, and a scope claim on Delegate | Tools can be declared safe to overlap, and several calls to them in one response then run at once, up to a cap. `Delegate` gains an optional `scope` (the files the builder will write). A host check claims them before the builder session opens and releases them however the session ends. If a file is already held, the request is refused before any spend. | Yes. It lives in the framework repo and cross-references the 1stcontact tickets. |

The checks turned up two things that shaped the tickets:
- **There is already a working protection against overwrites that nobody uses.** The draft store can refuse a write made from an out-of-date copy (`sites.version` with `SiteWrite.expect`), but neither the builder's `set_l1` tool nor the client's hand edits pass the expected version. REQ-397 switches it on rather than building a new guard.
- **The consultant's priming already says "Builders run one at a time".** REQ-397 keeps that wording until REQ-207's concurrency is actually installed.

**Why three tickets, not one:** the page work and the lock work are each over the 20-point free-coding cap, and the framework work is in another repository. I've noted on the epic that folding back is preferred if any of them turns out small.

**Decisions I made while filing** (also recorded on the epic; say if you want any changed):
- The consultant names the files when it opens a builder session, and they are locked before the builder starts. The builder doesn't take them partway through.
- A lock is renewed whenever its builder does something, and expires after about 5 minutes idle. That way a builder session that dies or aborts silently (BUG-191) can't hold a file forever.
- At most 3 builder sessions run at once by default; the limit is configurable.
- Header and footer stay as per-page sections for now, not shared site-wide ones.
- Existing pages aren't migrated in bulk; they're split when the consultant decides to.

Everything is left at `draft` for the child sessions to pick up.

<!-- xgd-turn id="98f8aed7-d97f-494e-a794-4dd6b15e31e5-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T00:40:56.051498+00:00" -->
#### You
Please read BUG-219 and its transcript there is an expectation that your scope should cover Gap 2 can you create a ticket for that if it is not covered already

<!-- xgd-turn id="98f8aed7-d97f-494e-a794-4dd6b15e31e5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T00:44:54.753684+00:00" -->
#### Claude
Gap 2 isn't covered yet: REQ-397 still lets a builder scoped to a whole page change its style. I'm filing a ticket for it now.

Now I'm adding REQ-406 to the epic's Children list, and fixing the placeholder test filename in the ticket.

Gap 2 wasn't covered, so I've filed **REQ-406: Builder scopes: page style is claimed only when named, so a page-scoped builder can't repaint the page**. It's at `draft`, under EPIC-24, and listed in the epic's Children section. No code has been written.

**Why the existing tickets don't cover it:** in BUG-219, the builder's scope was the whole home page, `home.json`. Under REQ-397, naming a page in the scope gives the builder that page, all its sections and its page-wide settings (its frame). So the builder holds the file the page style lives in, and the same "repaint the whole page to get one section right" change would still be allowed. Only a builder scoped to individual sections of a split page is refused today. REQ-396 and REQ-397 are both at `ready_to_reconcile`, so their bodies can no longer be changed, which is why this is a new ticket.

**What REQ-406 sets out:**
- **A separate scope unit for page style.** The page style (background, text colour, widths, fonts, column) becomes its own unit, provisionally `home.json#style`, on both split and unsplit pages. Naming the page doesn't include it; the consultant has to name it on purpose.
- **Refusal before writing.** Without that unit, `set_page_style`, `use_font` and any `set_l1` that would change a page-style setting are refused before anything is written. The message tells the builder to fill its section's own box instead.
- **Locking.** The style unit is locked like any other file. The consultant's own edits and the client's hand edits take it automatically.
- **Consultant guidance.** The consultant's manual and priming tell it to ask for the style unit only when the brief changes the whole page.
- **When it takes effect.** Like REQ-397's scope checks, it only applies once lagrange-framework REQ-207 is installed. Until then, BUG-219's fixes protect against this: page-style changes now show up in the host's record and fail containment checks, and builders are told to fill a section's own box.
- **Tests.** The plan covers the refusal, the allowed section fill, the allowed path when the style unit is named, a second builder being refused a held style unit, and a client edit getting a 409.

I left out the "page style is unchanged" check wording, as agreed on BUG-219.

<!-- xgd-chat-end -->