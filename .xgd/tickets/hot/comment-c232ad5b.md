---
uid: comment-c232ad5b
id: COMMENT-4867
type: comment
title: Comment on request REQ-376
created_by: xgd
created_at: '2026-10-03T23:23:48.708702+00:00'
updated_at: '2026-10-03T23:38:10.634569+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b0cba795
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "002fad87-e447-4695-ab55-7d4bf6bd4ca2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="aa4b294e-b4fa-488c-a16f-2921a734fbe5-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T23:22:22.268320+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="aa4b294e-b4fa-488c-a16f-2921a734fbe5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T23:38:10.333074+00:00" -->
#### Claude
Reading the ticket and the site-pane toolbar code before I start. The ticket's requirements are clear enough to implement without questions.

Still mapping the code: I've found the toolbar and the URL helper, and now I'm looking for where the consultant's priming/manual lives.

Found the consultant guidance: DOC-50's "Will it work on a phone?" line in the system KB. Next I'm checking how the KB copy is generated from the doc ticket, and where the chat's tool manual lives.

I'm reading the consultant's priming file (`priming.json`) to find where a line about the new control belongs.

Reusing the shared modal shell (`modal.js`) instead of building a new popover. Checking how other builder dialogs get their host element and copy-to-clipboard behaviour.

Writing the encoder now (`builder/qr.js`): byte mode, error-correction level M, smallest version that fits, and mask chosen by the standard penalty rules.

Encoder written. Sanity-checking its Reed–Solomon against the ISO 18004 worked example (version 1-M, "01234567"):

Reed–Solomon matches the ISO reference bytes exactly (`a5 24 d4 … 2c 55`), and the matrix looks right: finders, timing pattern and alignment pattern. Now wiring the toolbar action into `app.js`.

Now the toolbar action, placed right after "Open in new tab":

Wired in. Some existing tests pin the exact toolbar id list, so I'm checking which ones need the new id added.

Only the lifetime suite's `DECLARED` list needs the new id. Updating it, then checking whether the builder suites actually run in this worktree or skip (a known worktree issue).

Builder suites run here, not skipped: the BUG-131 suite passes 5/5 with the new control in place. Next: CSS, then the UAT file with its own QR decoder.

All 6 pass on the first run, which makes me suspicious. Mutation-checking that the decoder actually catches encoder faults:

Confirmed: BUG-70's typography audit catches the new button because no CSS rule sizes its font. Finding how the other toolbar buttons get their type so I can join that rule.

BUG-70 is green with the button added to the shared toolbar type rule. Checking the two remaining non-workers failures (BUG-63 and req115-builder-shell) to see whether they're mine:

The copied `generated/` directory is ignored by git, so it won't be committed. Next: the version bump script.

Updating the ticket body before committing. I'm appending an "As implemented" section and leaving the existing content untouched.

Relative `--body-file` paths resolve against the main project root, not the worktree. Retrying with an absolute path:

Ticket updated. Committing the work on the branch:

Merged state is clean: valid JSON, the new UATs plus BUG-70/BUG-131/toolbar-lifetime all pass (21/21), and the bump commit is on `xgd-working`. Releasing the lock and removing the branch:

REQ-376 is implemented and merged into `xgd-working`. The ticket is at `free_coded` (version 0.2.469, commits `f3aaf115` and `8fbcb133`), and its body now has an "As implemented" section.

**What the client sees:** a **View on your phone** button right after "Open in new tab", in both View and Edit. It opens a dialog with:
- a QR code;
- the sentence "Point your phone's camera at this code to open this page of your draft on your phone. You'll be asked to sign in — use the same email you use here.";
- the full address with a **Copy** button, and a Close button.

If the client changes page with the dialog open, the code redraws for the new page. Switching mode or site closes the dialog, so it can't show a page that's no longer in the pane.

**Design decisions:**
- **One address source.** `app.js` defines a single `draftUrl` function and hands it to both controls, so the phone always gets the draft render of the page on screen and never the edit view. The dialog turns it into a full `https://…` address, since a phone can't resolve the pane's relative path.
- **No new dependency.** I wrote a small QR encoder in-repo (`builder/qr.js`, about 300 lines) rather than vendoring one, so the draft URL never leaves the browser. It ships with the builder files like everything else in that folder.
- **Reuse.** The dialog uses the existing `modal.js` shell, and `toolbar.js` stays import-free: the action takes an opener function, the same way the Colors button does.
- **Consultant priming.** I added the line to `priming.json` in both of the consultant's prompt variants (with and without the knowledge base): when suggesting they check on their phone, tell them to use *View on your phone* beside the preview.

**Testing:** there's one new test file, `test_UAT_FC_REQ-376_view_on_your_phone.test.ts`, with 6 tests that cover the ticket's test plan. The test reads each code back from the SVG on screen with its own decoder, which shares nothing with the encoder. Checks that the tests themselves catch a broken encoder:
- the encoder's error-correction output matches the reference example from the QR standard (ISO 18004) byte for byte;
- with each of the 8 masking patterns forced in turn, every code still decodes;
- a deliberately broken mask makes 4 of the 6 tests fail;
- a throwaway run over address lengths decoded correctly at QR versions 2–20.

Regression (the toolbar, BUG-70 typography, BUG-131 "Open in new tab" and priming suites) is green apart from failures that predate this work or that come from running in a fresh worktree:
- the REQ-295 delegation tests are already red on a clean checkout;
- `req115-builder-shell` can't resolve the web components outside the main checkout.

BUG-70's typography check did catch the new button unstyled, and I fixed that.

**Not done:**
- **Not tried on a real phone.** The sandbox blocks the browser, and on dev the builder is on 127.0.0.1, which a phone can't reach (the ticket marks this out of scope). The first real scan will be after a production deploy.
- **The DOC-50 knowledge base article is unchanged.** Its "Will it work on a phone?" answer doesn't mention the new button, and fixing it needs a `1c kb build` with network access. Say if you want it updated.

<!-- xgd-chat-end -->