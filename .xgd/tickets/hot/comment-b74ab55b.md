---
uid: comment-b74ab55b
id: COMMENT-2572
type: comment
title: Comment on bug BUG-70
created_by: xgd
created_at: '2026-09-10T17:52:52.839674+00:00'
updated_at: '2026-09-10T18:07:01.064467+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f3c725f3
  kind: chat_transcript
---

<!-- xgd-turn id="584f8dd8-e352-4b3d-9477-48c4059200ab-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T17:52:41.760613+00:00" -->
#### You
I would like you to do an audit of the text on the webapp. I still see several places where text has no styling:
1. The Business selector
2. The filters at the top of the itel list in the library
3. The blank pane text "Pick something on the left or..."

<!-- xgd-turn id="584f8dd8-e352-4b3d-9477-48c4059200ab-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T18:07:00.902431+00:00" -->
#### Claude
I'll start by reading the ticket and then auditing those three surfaces.

Audit complete. Let me record the findings on the ticket before coding.

Ticket recorded. Now cutting a branch and implementing.

Now the UAT suite.

Now the UAT suite.

All 8 pass. Now let me verify the suite actually fails without the fix.

Now the regression scope — adjacent builder suites.

31 files, 247 tests, all green. Now lint and commit.

Now merge back to `xgd-working`.

Fast-forward merge, clean. Now record the commit on the ticket.

Done. The three you reported turned out to be three different failure modes, and the audit found eleven more instances of them.

## What was wrong

`.shell` declares a font **family** and no **size**, and form controls inherit neither by default. That one fact produced three shapes:

**1. `font: inherit` and nothing else → 16px.** The shorthand resets `font-size`; the walk up the tree finds no size declared anywhere in the sheet, so the control lands on the document default while the chrome around it runs at 13px. BUG-53 fixed six of these; **fourteen more were still on screen** — your business selector and all three Library filter controls among them, plus the palette popup's text inputs, five inputs across the Contacts dialogs, the upload sheet's buttons, and "Sign in again".

**2. No `font` rule at all → not IBM Plex at all.** `builder.css` carries exactly one `button` selector, and the toolbar's buttons (Colors, Publish, Mark Points, the mode toggles) matched none of them, so they took the user agent's own button font. The bar's one `<a>` *does* inherit, so it sat at 16px beside them — three typographies in one toolbar. You didn't report this one; it's the same defect wearing a less obvious face.

**3. The blank pane was a bare text node.** `emptyDetail` is documented `HTMLElement` and goes straight to `replaceChildren`; both the Library and Contacts passed a *string*. So there was no box for any rule to reach — and the string displaced the component's own `.list-detail-empty` fallback on the way in.

## What I left alone, deliberately

Controls that paint no text (checkbox, radio, colour, range, file) — a font declaration on them changes nothing. The Marked Points overlay, which lives in the preview's own document with its own sheet and system fonts on purpose, because `@font-face` can't reach inside an isolated document. And `font: inherit` on container `<div>`s, which is a no-op.

## Evidence

`tests/test_UAT_FC_BUG-70_builder_text_is_styled.test.ts` — 8 tests. Rather than a named list (which is what let fourteen controls sit behind a green BUG-53), it resolves each control's size **through the real mounted ancestry**: a control whose winning word is the shorthand hands the question to its parent, and one that reaches `<html>` unanswered is on the browser default. A static sweep covers the surfaces this file doesn't mount. All 8 fail against the unfixed source; a control added later with no size fails there too.

Regression: 31 files / 247 tests green. Lint clean. One pre-existing failure in `BUG-58`'s Playwright suite — it times out waiting for `.shell` identically on the untouched checkout, so it's the sandbox blocking Chromium, not this change.

`0.2.147`, commit `1cc729c`, merged to `xgd-working`, ticket at `free_coded`. I also re-ran `./bin/1c assets` so a restart actually shows it.

<!-- xgd-chat-end -->