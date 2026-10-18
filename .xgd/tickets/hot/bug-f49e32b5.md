---
uid: bug-f49e32b5
id: BUG-226
type: bug
title: choose_look copies a look's drifted content onto the real page without checking
  it against the source page
created_by: xgd
created_at: '2026-10-18T19:22:53.080967+00:00'
updated_at: '2026-10-18T22:12:26.170952+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: high
  epic_parent: epic-95bc3b15
  severity: high
  chat_comment: comment-2d692a23
---

## What happened
1. `make_alternatives` was called (by a builder worker) on page `home` to create three looks. The same worker then started restyling the look pages, ran out of context mid-run, and was aborted. Before stopping, it had altered **content** on the look pages, not just styling:
   - image `src` values in a team section were swapped to unrelated images;
   - several text elements were reworded, and one paragraph was truncated.
2. Later delegations restyled each look; their briefs said "do not change any words". Each worker inherited the already-drifted content as its baseline.
3. The client chose one look. `choose_look` copied it onto `home` faithfully, including the drifted content. The real page lost correct portraits and the client's exact wording, which had been verified on `home` before the looks were made.

## Expected
Looks are meant to differ in style, not content. At least one of:
- `choose_look` (or the "Choose this one" button) diffs the look's text and image `src`/`alt` against the page it was made from (or its "before" snapshot), and warns, or refuses without confirmation, when content differs;
- `make_alternatives` records each look's content baseline, and the host flags any later content change on a look page, the way it flags attention items;
- a delegation that leaves a look half-edited (aborted or exhausted) marks that look as incomplete in `list_pages`, so it is not offered for choosing.

## Reproduce
1. On a page with verified content, call `make_alternatives` to make two or more looks.
2. On one look, change an image `src` and a text element (as a worker that is cut off mid-run would).
3. Choose that look with `choose_look`.
4. The real page now carries the changed `src` and text, with no warning. Only the `<page>-before` copy still has the correct content.

## Impact
The client saw their team's portraits replaced by wrong images and their words changed immediately after choosing a look. Recovery needed two more delegations: restore the content from the before-copy, then restore the styling that the content restore had reverted.



## Notes (EPIC-19, 2026-10-18)

Confirmed: `choose_look` (`plan-core.ts:1802`) copies the look onto the page after recording the client's words, and nothing compares the look's content with the page it was made from. Note the "Choose this one" button no longer exists (BUG-205); choosing is `choose_look` only.

**Why scopes don't catch this:** a builder restyling a look is legitimately scoped to that look's file, so the lease allows any change on it, words and pictures included. Scope separates files, not content from style.

**Recommended fix, in this order:**
1. **Record the content baseline at `make_alternatives`:** for each look, the text, image `src` and `alt` it started with, keyed by element id (the look starts as a copy of the page, so the page's content is the baseline).
2. **`choose_look` compares the look's content with that baseline** and, if anything differs, refuses with the list of differences (*"the look changed 2 pictures and 3 pieces of text: …"*) unless called again with an explicit confirmation that the client has seen them. The consultant then either restores the content or tells the client. Pure styling differences never trigger it.
3. **A look whose builder ended without finishing** (aborted, exhausted, or no report) is marked incomplete, and `choose_look` refuses it until it is finished or re-made.
4. **Builder priming for looks:** a look changes how the page looks, never what it says; the words and pictures come from the page. (The briefs said this; making it standing guidance for any brief on a look page is cheap.)

The aborted builder at the root of this is BUG-212's case (context budget, no report).


## Fix (free-coded)

**What the user sees.** Choosing a look no longer silently changes what the page says. `choose_look` compares the look's words and pictures with the page it would replace. If they differ, it refuses with `CONTENT_CHANGED` and lists the differences, for example: *"Choosing 'Workwear' would change what page 'home' says: 1 picture and 2 pieces of text. On the page now, gone after choosing: …; In the look instead: …"*. The consultant then either has the look's content restored, or tells the client and calls `choose_look` again with `content_changes_seen: true`, which goes ahead. Pure styling differences never trigger the refusal. The same rule applies to every look, including a "Before …" look: if the page was changed after choosing, putting it back reports those changes too.

**What counts as content.** Every text element's words (runs joined, whitespace collapsed) and every picture's `src` and `alt`. These are compared as collections, not by position or element id, so restyling that re-nests, wraps or reorders elements is never reported. A changed `src` or `alt` counts as one changed picture, and so does a picture that was removed or added. Component configuration is not compared.

**Design decisions.**
- **The page is the baseline.** The ticket's notes suggested recording a baseline at `make_alternatives`. The comparison uses the page's current content at choose time instead. A look starts as a copy of the page, so the two are the same unless the page changed afterwards. If the page did change (the client's wording was edited after the looks were made), choosing the look would overwrite that edit too, and that is exactly the loss being guarded against. No new stored state is needed.
- **Refuse, then confirm.** Refusing until the consultant passes `content_changes_seen: true` keeps the client in the loop without blocking a look whose different content the client really wants (for example an existing page adopted as a look).
- **Not done here:** marking a look "incomplete" when its builder was aborted (the third option under Expected). The content check covers the harm this bug caused. A half-styled look remains visible to the client in the carousel.
- **Builder guidance:** the builder's note on alternatives now says a look changes how the page looks, never what it says, and that words and pictures come from the page.

## Test plan
`tests/test_UAT_FC_BUG-226_choose_look_content_guard.test.ts`, run through the plan toolbox's `choose_look` against a real site store with looks made by `make_alternatives`:
- a look that only changed styling is chosen with no refusal;
- a look with a swapped picture `src` and reworded text is refused with `CONTENT_CHANGED`, names the picture and the text, and leaves the page unchanged;
- the same look with `content_changes_seen: true` is chosen and its content lands on the page.
Regression scope: the REQ-391 alternative-looks suites.