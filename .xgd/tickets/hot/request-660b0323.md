---
uid: request-660b0323
id: REQ-481
type: request
title: 'Opening message: follow the screen and name things as they are labelled'
created_by: EPIC-19
created_at: '2026-10-28T01:06:06.095207+00:00'
updated_at: '2026-10-28T02:06:50.684059+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c74229fe
  commits:
  - working_sha: bac0e38792a0148e891aed8622a858a585d6daa3
    reconcile_sha: null
    main_sha: null
  - working_sha: 7cf6f8bde2b6482d89da263d878859930f653a63
    reconcile_sha: null
    main_sha: null
  version: 0.2.691
  story_points: 2
---

## Why

The consultant's opening message (`opening` in `tools/generate/src/cli/ai/plan-seed.json`, sent as `OPENING_MESSAGE`) is every new client's first view of how the builder works. The operator's review (2026-10-27):
- "How we'll work together" jumps around the screen and doesn't name things consistently: "the progress bar", "the preview", "the story board", "Input… beside View and Edit".
- "I'll build a first draft early" reads as rushing.

The new text follows the screen in order and uses exact on-screen labels: View, Edit, Input, Questions, Stories, Comparison sites, Progress, How you can help and View on your phone.

## What

**1. Replace the opening with this text, agreed with the operator, verbatim:**

```
Hello — I'm here to design and build your website with you. I'll give you my honest opinion as we go, but it's your site, so you always have the final say.

**How we'll get there.** We'll go through a few steps: getting to know your business, looking at other sites, a first draft, refining, colours and fonts, finishing touches, and then ready to publish. I'll build a first draft as soon as I have enough to start, so you have something real to react to, and we'll carry on getting to know your business while it's built. We can move between steps freely — just tell me what you'd like to look at.

**View · Edit · Input** (top left)
- **View** shows your site as it's created. **View on your phone** shows it the way most of your customers will see it.
- **Edit** lets you make simple changes yourself whenever I'm not working on the site.
- **Input** is where I collect what I need from you: **Questions** (simple facts, like your phone number), **Stories** (what you tell me about your business, in your own words — heart the ones that are most you) and **Comparison sites** to react to.

**Progress · How you can help** (directly above this message)
- **Progress** shows which step we're on.
- **How you can help** lists what's waiting on you — click an item to open the right part of Input.

**While we work**
- Before a long piece of work, I'll tell you roughly how long it will take. While I build, keep talking to me — what you tell me goes into the next pass.
- When I show you several looks side by side, tell me which you prefer.
- Upload anything you have — photos, your logo, flyers. It all helps.

So, to start: tell me about your business. What do you do, and who are your customers?
```

**2. The labels in it must match the screen.**
- The text names View, Edit, Input, View on your phone, Questions, Stories, Comparison sites, Progress and How you can help. Each must be the label the client sees: `PANE_LABELS`, `INPUT_SECTIONS` titles, `PLAN_STAGES_TITLE`, `HELP_HEADING` and the View on your phone button.
- If a label differs, fix the text, not the label, and record it here.

**3. Check the click behaviour.** If clicking an item in How you can help does not yet open the matching part of Input, make it do so, since the message promises it. Record which applied.

**4. Keep the consultant's view of it in step.** Any priming or stage-guide text that paraphrases the opening, for example DOC-75's opening guide, or text that refers to "the progress bar" or "the preview" when telling the consultant what the client sees, uses the same names.

## Test plan

- `test_UAT_FC_REQ-481_opening_is_the_agreed_text`: `OPENING_MESSAGE` equals the text above.
- `test_UAT_FC_REQ-481_opening_names_match_the_screen`: every label the opening names in bold is the label the builder actually renders for that control or section, read from the builder's own constants.
- `test_UAT_FC_REQ-481_help_item_opens_its_input_section`: in the builder, clicking a How you can help item opens Input at the matching section.
- Retarget `test_UAT_FC_BUG-235_two_stages_in_progress` (it pins "I'll build a first draft early") and the REQ-403 first-entry tests to the new text.


## Implementation record (2026-10-27)

**1. Text.** `opening` in `plan-seed.json` is the agreed text verbatim.

**2. Labels.** Every name matched the screen, so no wording change was needed: `PANE_LABELS` gives View, Edit and Input; `INPUT_SECTIONS` gives Questions, Stories and Comparison sites; `PLAN_STAGES_TITLE` gives Progress; `HELP_HEADING` gives How you can help; the toolbar's phone button (shown in View) reads View on your phone.

**3. Clicks.** This already worked (REQ-433's `openInput`): every How you can help item with an Input section switches the pane to Input and expands that section, even when it was folded. One exception: "Your first draft is ready" opens View, not Input, because the draft is what it points to. That is left as is, and the opening's "open the right part of Input" covers every other item.

**4. The consultant's text.** "The progress bar" became Progress in the plan surface overview ("The stages are the client's Progress… directly above the chat"), in `show_client`'s description, in both copies of priming's "Bring the right view to the client", and in `show-core.ts`'s header. The overview no longer calls the story board "a third view of the preview", because since REQ-431/433 it sits under Stories in Input. DOC-75's opening guide does not paraphrase the opening message, so it is unchanged. Its "Open in new tab beside the preview" describes where the button is, not the name of a pane, and REQ-376 pins it.

**Tests.** `tests/test_UAT_FC_REQ-481_opening_follows_the_screen.test.ts`:
- `opening_is_the_agreed_text`
- `opening_names_match_the_screen`: mounts the builder and reads each label as rendered (the mode toggle, the Input section headers, the Progress title, the How you can help heading and the phone button). Every bold name in the opening must be one of them, and the opening must name all nine.
- `help_item_opens_its_input_section`: for every `HELP_KINDS` entry that has a section, it folds the section, goes to View, clicks the item, and expects Input with that section expanded.

`test_UAT_FC_BUG-235_the_opening_message_says_a_first_draft_comes_early` now pins "as soon as I have enough to start". The REQ-403 first-entry tests compare against `OPENING_MESSAGE` itself, so they needed no change.