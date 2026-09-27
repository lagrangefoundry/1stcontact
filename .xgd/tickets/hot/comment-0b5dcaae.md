---
uid: comment-0b5dcaae
id: COMMENT-4026
type: comment
title: Comment on request REQ-334
created_by: xgd
created_at: '2026-09-27T00:10:44.175601+00:00'
updated_at: '2026-09-27T00:34:26.373819+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2631c0ba
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d50174c7-20bf-4b63-8458-2dc7bd31a15a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d84b826a-949a-47d2-b7fd-5b218f27b8c6-user" -->

<!-- xgd-chat role="user" ts="2026-09-27T00:09:18.463504+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d84b826a-949a-47d2-b7fd-5b218f27b8c6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-27T00:34:25.201486+00:00" -->
#### Claude
Now the band-assembly rewrite:

Now update the ticket body (appending the implementation record, preserving the existing content):

Now commit the work on the branch:

Landed. REQ-334 is at `free_coded`, merged into `xgd-working`, branch cleaned.

**Issue 1 — `fontFacesByFamilyOf` (`pipeline.ts`)**
Repeated `@font-face` blocks naming the same mirrored `src` for the same family *and style* now widen the kept face's weight to the `[min, max]` of every weight declared, instead of first-wins discarding them. Oswald's six Google-Fonts blocks become one face at `[200, 700]`; the renderer already emits `font-weight: 200 700` from that. First-wins still settles a redeclaration under a *different* style, an absent `font-style` compares equal to `normal`, and a block declaring no weight contributes no bound (CSS's default 400 isn't something the sheet said). Lato — one file per weight — is unchanged.

**Issue 2 — the band gate (`extract.ts`)**
The geometric fallback is now asked per band root rather than once per document: a root qualifies at full layout width and ≥60% of the document height (`PAGE_ROOT_HEIGHT_RATIO`). `bandSlices()` became `bandSlicesIn(rootEl, rootBox)`, bounded by that root in both senses — only its own subtree is a candidate (this is the header guard, applied at selection rather than re-assembly, so an absolutely-positioned `<header>` sibling can't be swallowed into the wrapper's slices), and the slices tile the root's box, with unpainted gaps attributed to the root rather than `document.body`. The two emit paths are one loop now, so the Elementor shape slices the wrapper while `<header>`/`<footer>` stay as the top-level scan found them.

**Evidence** — `tests/test_UAT_FC_REQ-334_variable_face_range_and_page_wrapper_bands.test.ts`, 9 UATs. Face tests drive the real `runCapturePipeline` with only the browser stubbed, through to `renderL1Document`; band tests drive the real `EXTRACT_SCRIPT` under jsdom plus real `buildSections`. Six fail on the pre-change tree; three are controls (static family, conventional page, single-band wrapper) that pass either way by design.

Two things worth flagging:

- **A re-capture is required** before any gate figure moves — both fixes change `capture.json` and `1c refold` can't pick either up, as the ticket says.
- **The full node suite has 20 pre-existing failures** in KB / conversation / filing-service / vocabulary suites. I verified they're unrelated: the same 11 files give an identical 20-failed/71-passed with and without the change. All capture/band/font/fold suites pass.

The ticket body now carries an "Implementation — what landed" section covering the 0.6 threshold, the subtree scoping, the style/weight edge rules and the gap attribution, so reconciliation has language for every UAT.

<!-- xgd-chat-end -->