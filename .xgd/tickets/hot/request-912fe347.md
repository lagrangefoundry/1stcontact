---
uid: request-912fe347
id: REQ-632
type: request
title: 'Discovery and the story board: broad to narrow, material first, and one whole
  story per note'
created_by: EPIC-19
created_at: '2026-11-02T19:20:49.004991+00:00'
updated_at: '2026-11-02T20:56:50.789625+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-365111ad
  commits:
  - working_sha: 01aa5971a05cf3b49cb5e40cba071c53d33b515a
    reconcile_sha: null
    main_sha: null
  - working_sha: 3599c3a884743cfdc787683c8fdeb72c188ed6a5
    reconcile_sha: null
    main_sha: null
  version: 0.2.734
  story_points: 5
---

## Why

Operator, production, 2026-11-02, a new Ariel's Arc Welding build (`site_3ecec6941e888397a2adf9c53e307285`, plan `plan-28bff6a4`): "it works great when I cut and paste huge chunks of rich story text in. But answering in bits and pieces is a mess — every 3 lines I type generates 5 stories — the board is getting filled with mediocre lines." "Discovery should start broader and narrow in to specifics." "Early on we should encourage uploading of content to give the consultant things to ask about." "I have a story item that is 'Old Scratch', that's it… Notes can be longer."

What the board shows (14 notes after 16 turns):
- **The operator's brief became notes.** Their opening summary of the business ("Arial has a small shop where she does professional metal working", "Her passion is her art work…") was pinned as five notes (n1–n5). The consultant itself later called them "just repeat your summary back to you".
- **A heading became a note.** The pasted story's bold heading `**Old Scratch**` was pinned on its own (n6, text and quote "Old Scratch").
- **A story was cut into sentences.** The four-sentence Old Scratch story became four notes (n7–n10); the staircase story became several more (n11–…).
- **The tool asks for it.** `pin_notes` (`plan-surface.json`) asks for "the sentence it came from (`quote`)" and models the reply as "I've put four of your sayings on the story board". Nothing limits how many notes one message produces.
- **Discovery went straight to detail,** with no broad conversation first, and photos arrived only because the operator offered them, though they were the best prompts of the session.

## What

1. **Discovery runs broad to narrow.** The opening starts with an open conversation: what the business is, who its customers are, what's changing, and what the site needs to do. That understanding goes into the brief and the positioning, **not onto the story board**. Only then does the consultant ask for specific stories (a job they're proud of, how it started, a customer they remember), one question at a time (REQ-621).
2. **Material first.** The first question invites what exists: an existing site, social pages, flyers, price lists and, above all, photos of the work. The consultant uses uploads as prompts for stories ("Tell me about this staircase").
3. **The story board holds site-worthy material in the client's voice.** A description of the business, a summary or a plan isn't a note; it goes into the brief. **One story is one note,** kept whole as a short passage (as long as it needs to be). **A heading or title is never a note on its own**; it can name the note's theme. The consultant pins only the best one or two things from a message and leaves the rest in the conversation.
4. **`pin_notes` says so.** Its description asks for "the passage it came from" (not "the sentence"), its example pins one whole story, and it says a summary of the business belongs in the brief.
5. **The host caps pinning:** at most two new notes per client message, refused past that with "pin the best one or two; leave the rest in the conversation". A long pasted document (over about 1,500 characters) with several distinct stories is allowed up to five. A note whose text is under about 25 characters and has no verb (a bare heading such as "Old Scratch") is refused with "a heading isn't a note; pin the story under it".
6. **Merging notes.** A `merge_notes` operation combines several notes into one, keeping the client's words whole and in order. Notes the client has already reacted to (hearted, thumbs, edited) can be merged only after the client agrees in their message; the merged note keeps the strongest reaction.

## Story wording to apply (operator-approved, 2026-11-02)

Apply these exactly, then run the priming and template UATs, retargeting any that pin the old sentences (never deleting them):

- **Client introduction** (`plan-seed.json`, `opening[0]`), replace the first paragraph with:
  > Hello — I'm here to design and build your website with you. What makes a small business's website stand out isn't the layout or the effects (though we'll do those well). It's your story: who you are, how you got here, and why you do things the way you do. So I'll ask about that, and we'll build the site around it. If you'd rather the site be about your product or service, just say so. I'll give you my honest opinion as we go, but it's your site, so you always have the final say.
- **Consultant priming, "Who you are"** (`priming.json`), replace the paragraph starting "They engaged you for your judgement…" with:
  > They engaged you for your judgement as well as your hands. What makes a small business's site unique isn't its layout or its effects, though you can do both well. It's the story of why the right customer picks them. Most often that's the owner: how they got here, why they do it their way, the people and the place. People choose a small business because of who's behind it, so this whole process is built to draw that story out (the questions, the story board, the copy) and put it at the heart of the site. Looking professional is the floor, not the aim. Some owners would rather the site be about the product or the service, not about them. That's their call: respect it, record it as a decision, and find the story in what they make or do.
- **Builder priming,** add one line:
  > The site is built around its story: why the right customer picks this business. Layout and effects serve it, and the brief says which story to lead with.
- **Critic priming,** add to its "is it this business's site" checks:
  > Does a stranger see why they'd pick this business (its owner, or what's distinctive about its product or service), rather than a generic one?
- (The story board stage guide line is already in DOC-75.)

## Test plan

- `test_UAT_FC_REQ-632_pin_cap_per_message`: three `pin_notes` items for a short client message are refused past two; a 2,000-character pasted message with distinct stories accepts up to five.
- `test_UAT_FC_REQ-632_heading_not_a_note`: pinning "Old Scratch" alone is refused with the heading message; pinning the four-sentence story as one note is accepted whole.
- `test_UAT_FC_REQ-632_merge_notes`: two unreacted notes merge into one with their words in order; merging a hearted note without the client's agreement is refused.
- `test_UAT_FC_REQ-632_opening_invites_material`: the opening stage guide/priming asks first for existing material and photos, and the consultant's priming says business descriptions go to the brief, not the board.
- Priming/template UATs updated for the approved wording; the client introduction contains the story paragraph and the product-or-service opt-out.

All four live in `tests/test_UAT_FC_REQ-632_discovery_and_story_board.test.ts`. The opening UAT also checks the builder and critic lines and that `pin_notes` asks for the passage, not the sentence.

## What landed (2026-11-02)

- **Message stamp.** Every client message in a site's conversation (the router's `clientWrote`, both the prompt route and a message into a running turn) stamps `fields.client_message = {at, chars}` on the plan (`clientMessaged(plan, at, pane, chars)`; `client_message` added to the stored plan keys). A plan with no stamp yet (from before this change) has nothing to count against, so it isn't capped.
- **Pin cap** (`pinNotes`, `story-core.ts`): counts the consultant's notes pinned since the latest message plus the new ones. Over two (over five when the message is longer than 1,500 characters), the whole call is refused (`PLAN_INVALID`) with "pin the best one or two; leave the rest in the conversation", plus how many are left.
- **Heading refusal:** a note under 25 characters (markdown stripped) with no verb is refused with "a heading isn't a note; pin the story under it". Since nothing parses grammar, "verb" means a common verb, a word ending in -ed or -ing, or a contraction. "Old Scratch" and "Saying 1" are refused; "I weld gates" is accepted.
- **Longer notes:** a note may be up to 800 characters, so a whole story fits. Positioning-card lines keep their own 200-character limit (`MAX_CARD_LINE_CHARS`).
- **`merge_notes`** (new op in KeepStoryBoard, consultant and talker): takes two or more note ids in the order the words should read. The merged note is their texts joined with a space, nothing reworded. It keeps the first note's id, place, theme and emoji (or the `theme`/`emoji` given), every distinct quote, the earliest `pinned_at`, the strongest reaction (❤️ > 👍 > 👎) and `edited` if any part was edited. It belongs to the client if any part did. If any part has a reaction, was edited or was written by the client, the merge is refused (`CLIENTS_WORDS`) unless `client_said` carries the client's agreement. It is also refused if the merged text would be over 800 characters.
- **`pin_notes` wording** (`plan-surface.json`): it says one story per note, no headings, that a business summary goes in the brief and positioning, the best one or two per message, and "the passage it came from". Its example is now one whole story.
- **Wording:** the approved client introduction, consultant "Who you are" (both priming variants), builder line (both variants) and critic Messaging question are applied verbatim. The opening's closing question (all three variants: default, unnamed and named business) now adds: "And if you have anything already (a website, social pages, flyers, price lists and, above all, photos of your work), upload it or send me the link: it gives me plenty to ask you about." The consultant's material track gains two bullets: discovery runs broad to narrow, and the story board holds one whole story per note. The empty-board reminder now says "stories" instead of "sayings".
- **DOC-75** (stage guides): the opening asks first for what exists (photos above all), starts broad, and keeps that understanding off the story board. The story-board step asks for specific stories one at a time, one whole story per note, and merges a story pinned in pieces with `merge_notes`.

## Tests retargeted (none deleted)

Updated for the approved wording: REQ-481 (agreed opening text) and REQ-408 (empty-board reminder wording; `merge_notes` added to the KeepStoryBoard group). Fixtures that pinned bare headings now pin short sentences: BUG-269 ("We feed the whole rally every summer"), BUG-302 ("We are a real 1950s diner"), BUG-264 ("We still have the jukebox"), REQ-424 and REQ-431 ("Saying N matters").

## Known overrun (for review, not trimmed here)

REQ-466 `each_role_s_authored_prompt_is_measured_and_inside_its_target` fails: the critic's authored prompt is now 8,653 characters against its 8,600 budget, because of the approved critic question (about 150 characters). As the operator prefers, this goes to a deliberate prompt review instead of being trimmed by this session.

Pre-existing failures, unchanged and baselined by reverting this diff: REQ-416 (3), REQ-424 (2, the JSON-spacing regexes), REQ-431 (2), REQ-436 (1), REQ-295, REQ-342, REQ-378 (`capture_site`) and REQ-472 (2; DOC-74's length, and its search rank, which fails with the old DOC-75 too).