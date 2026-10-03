---
uid: comment-4808793a
id: COMMENT-4870
type: comment
title: Comment on bug BUG-189
created_by: xgd
created_at: '2026-10-03T23:28:03.255522+00:00'
updated_at: '2026-10-03T23:36:36.704053+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-a04e88a4
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "9759d8c8-a2f8-47df-80dd-004687123c6c",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e7c019fa-0814-4e06-b8c8-455189589a34-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T23:26:39.984419+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e7c019fa-0814-4e06-b8c8-455189589a34-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T23:36:35.265613+00:00" -->
#### Claude
Reading the gate's coverage code (`tools/generate/src/cli/gate-core.ts`) to find where the new "empty section" finding should go.

Mapping how a section's content can be identified: the manifest sections carry boxes but no DOM selector, so I'm checking the real bundle's data to pick the detection rule.

Prototyping the "page text the capture never recorded" proxy against the real bundle before writing it into the gate.

Design is clear now; recording it on the ticket and cutting the branch before I write code.

Now updating the ticket (preserving the filed body) and moving to `free_coding`.

My frontmatter strip ate the original body — restoring it from git now.

No existing helper, so I'll write the small text extractor in the gate. Adding a `readRenderedHtml` bundle reader first.

Now the constant, the two proxies, and the finding inside `referenceCoverage`.

Now the verdict rung. Reading the existing `capture-incomplete` rung to mirror its wording.

Surfacing the two new fields in `1c gate`'s text report and the fidelity JSON.

Writing the UAT file, using the BUG-100 fixture shape plus `rendered.html` and the overhang trick for a failing structural gate.

Known fresh-worktree gap (control-app's gitignored `generated/` dir). Copying it from the main checkout.

All 7 pass. Running the regression scope — every suite that drives `referenceCoverage`, `cmdGate` or `reconcileGates`.

Regression scope green (227 passed). Now checking the proxy against the real stored bundles, including the one this was filed from.

Committing the work on the branch, then finalising the ticket body before the version/merge tail.

Ticket body updated (original filing preserved). Now the lock → merge → bump → fast-forward tail.

BUG-189 is fixed and parked at `free_coded`: two commits on `xgd-working`, version 0.2.466, 3 story points. The new UATs pass, but I couldn't run the live `1c gate … --sandbox` command from the ticket because the sandbox blocks Chromium. The verdict change is proven offline through `cmdGate` instead.

**What the gate does now.** When a capture loses whole sections, the gate now returns `capture-incomplete` instead of `structural-failure`. It needs two signals together:
- **Empty sections:** a reference section at least 200px tall that paints no image and contains no manifest element. The section's own background box doesn't count as content.
- **Unrecorded text:** visible text in `rendered.html` that appears nowhere in `capture.json`.

When both are present, a new `empty-section` finding names each section, its pixel height and share of the page, and quotes some of the missing text. Each signal on its own is only reported as data. Text alone is noisy: on complete captures, hidden menus and skip-links show up there (10 strings on hearingzone510). The ticket suggested matching sections by `<section>` id, but section records only have boxes, not selectors, so the second signal checks the whole page.

**Where it sits in the verdict order.** `empty-section` is checked before every other verdict, and it applies whether or not the screenshots differ. That means it overrides `structural-failure`, and it also blocks a `pass`, because every other check is comparing against a reference that's missing sections. Other coverage findings are routed exactly as before.

**On the stored bundles:**
- **bluelotus:** the new finding names the two lost bands, 560px and 392px. Together that's 952px, 32% of the page, with 16 missing strings such as "Get in Touch", the email addresses and the form labels. The section numbers in the report are 4 and 5, not the ticket's 5 and 6, because the data the gate reads has no 8px strip at the top. The y positions and heights match the ticket's bands.
- **faelan, gigabytealchemy, joyfulculinary, hearingzone510:** no new finding.

**Tests:** 7 UATs in `tests/test_UAT_FC_BUG-189_empty_section_coverage.test.ts` pass, and so do the existing suites that exercise coverage and the gate (22 files, 227 passed).

The ticket body still has the original filing and now describes what was actually built, so it's ready for you to promote to `ready_to_reconcile`.

<!-- xgd-chat-end -->