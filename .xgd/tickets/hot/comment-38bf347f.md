---
uid: comment-38bf347f
id: COMMENT-5558
type: comment
title: Comment on request REQ-429
created_by: xgd
created_at: '2026-10-22T21:08:49.962970+00:00'
updated_at: '2026-10-22T21:34:32.882438+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-5f4befa0
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7f577bee-69f2-4167-afd6-cb6b10331c13",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="7d392c2f-f7c1-45b9-b117-c2535e20be39-user" -->

<!-- xgd-chat role="user" ts="2026-10-22T21:07:30.990110+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="7d392c2f-f7c1-45b9-b117-c2535e20be39-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-22T21:34:31.186425+00:00" -->
#### Claude
I've read REQ-429 and the current layout check (`layout-check.ts`, about 470 lines). Next I'll look at the existing UATs and who uses the widths, then cut the branch and start the refactor.

The branch is cut. The browser UATs skip here because Chromium won't launch, so I'm finding out why before I write code.

Chromium runs with the single-process flag. Next I'm taking a baseline of the existing layout-check UATs.

Baseline is green (47/47). Now I'm checking the existing misaligned-rows assertions before I rewrite the table logic.

The new runner and registry type-check. Now I'm running the existing layout UATs against them.

Three of the failures are just the new tablet width showing up in expected lists. REQ-418 (stack mode) and REQ-420 need a closer look.

Existing UATs are green. Next I'm writing the REQ-429 UATs as hand-written HTML fixtures served to real Chromium. Raw HTML can express `<nav>`, form fields, `<table>` and CSS grids exactly.

All 14 new UATs pass. Before regressions, I want to see how noisy the new checks are on real rendered site pages.

The noise is gone. One finding is left to verify: on the hearing-zone page an image is reported drawn over two paragraphs. Checking whether it really covers the text:

Workers suites pass. Running the type-check and lint on the changed files:

No lint or format tooling exists in this repo, and `tsc` is clean. Next I'm recording the design decisions in the ticket, then committing.

The ticket now records what was built. Committing the work on the branch:

Committed. Now taking the merge lock and bringing `xgd-working` into the branch to check for conflicts:

Only ticket files came in from `xgd-working`, so there's no code overlap. Bumping the version on the branch:

REQ-429 is at `free_coded`. Removing the branch and worktree:

I've implemented REQ-429 and merged it into `xgd-working`. The ticket is at `free_coded` with both commits recorded (`542e8f4a`, plus the 0.2.582 version bump `74fd057f`). All 14 new UATs pass, and so does every existing layout-check UAT you listed, after the expected edits below.

**What changed**
- **The framework:** `layout-check.ts` is now a runner plus a registry (`LAYOUT_CHECKS`). Each check is one entry: an id, the finding kinds it reports, and its in-page body. Its thresholds sit under that id in `layout-check.json`; the existing `brand` and `heading` keys stayed where they were.
- **A check that throws** comes back as a `check_failed` line naming the check, and the other checks still run. The host shows the line but doesn't hold the page as "not done" for it, because it's a fault in the check, not the page.
- **Widths** are now configuration: desktop 1280, tablet 900, phone 375. A threshold given only for phone also applies at tablet. The host report now says "at any width".
- **New and widened checks:**
  - heading spacing measured on the letters themselves, and compared with the spacing between the paragraphs below;
  - `stranded_word`, `nav_wraps`, `small_nav` and `tall_menu`;
  - table alignment for tables, grids and column lists (`misaligned_rows`, `ragged_column`);
  - controls and images drawn over text (`overlap`);
  - controls too close together (`crowded`).

**Decisions I made**
- **Heading-to-paragraph threshold is 0.9, not 0.8.** REQ-420's rhythm layout measures 0.84 and that test pins it as correct. It's a config value if you want it stricter.
- **An image or control over text** is only reported when the browser shows it drawn on top. Text laid over a picture is not a fault.
- **`crowded` measures plain links by their words**, not their padding. Two plain links stacked in a list aren't compared, so stacked menus and footer link lists don't trip it.
- **Column-built lists are still only judged when they hold numbers.** Without that, the xgd site's "You own / XGD owns" comparison was reported as a table out of line.

I ran the new checks on real rendered pages in `storage/dist` and removed the noise I found. What's left looks genuine: an absolutely positioned image covering the end of a paragraph on the hearing-zone page, stranded words, and headings spaced the same as their paragraphs.

**Existing UATs I had to change**
- BUG-238 and REQ-422 now expect a tablet finding too.
- REQ-420's pinned "24px … 24px" became any number, because spacing is now measured on the letters.
- BUG-235's wording is now "at any width".
- REQ-418's narrow-mode test now checks desktop and phone only. At 900px it found a real framework gap: a stacking table only stacks below 600px, so a wide table overflows at tablet width. That's outside this ticket, which covers host checks only; it probably wants its own ticket — say if you'd like me to file one.

To run the browser UATs inside the sandbox, set `CHROMIUM_LAUNCH_ARGS=--single-process`.

<!-- xgd-chat-end -->