---
uid: comment-6aeb43d5
id: COMMENT-4638
type: comment
title: Comment on request REQ-349
created_by: xgd
created_at: '2026-09-30T21:12:04.805918+00:00'
updated_at: '2026-09-30T23:09:27.555768+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-8b4eb74e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6174f101-f9f9-4fcf-b501-5be46494a70e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="8920a9d7-efd2-4d56-966b-ee160b074474-user" -->

<!-- xgd-chat role="user" ts="2026-09-30T21:10:38.565546+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="8920a9d7-efd2-4d56-966b-ee160b074474-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-30T23:09:25.795912+00:00" -->
#### Claude
Reading the ticket (done — it's a detailed spec for a style-gap audit on `describe_page`) and now surveying how `describe_page` and the L1 schema work before implementing.

Still mapping the L1 schema (controls, text axes, geometry, palette) so the audit reads real stored shapes.

I have the design. Now checking what tests pin the `describe_page` output and surface declaration, so the new fields don't silently break a parity check.

Now looking at a real contact-form instance so the test fixture uses the stored shape rather than a guess.

I have enough to scope it. Recording the implementation scope on the ticket first (existing body kept intact, a new section appended), then cutting the branch.

Branch is ready and the ticket is at `free_coding`. Writing the audit module now.

Now wiring it into `describe_page` and the declaration.

Using the whole-config read (one `site.json` read, no page census) instead of the palette census.

Typecheck is clean. Now the declaration: `describe_page` prose, the `page_map` shape, and the surface version.

Now the UAT. Checking the starter page shape so the fixtures are real stored pages.

The extra finding is real: a fixed 424px box is also wider than a 320px phone. I'll scope that fixture to desktop widths so it isolates the ticket's case.

All 8 pass. Before trusting it, I'm running the audit over the real corpus sites to check it doesn't cry wolf.

10/10 pass. Now the neighbouring suites that pin `describe_page` and the surface declaration.

Many failures, most look environmental (ports, sandbox, network). Getting the failing file list to compare against the base without my change.

Checking the failures that could plausibly touch my files (reference projection, surface prose, vocabulary) for their actual messages.

None mention the audit, `describe_page` or the surface. To be certain, I'm rerunning the same 18 files on the base with my changes set aside.

Three files fail only with my change applied (or are flaky): `builder-workspace-mounted`, `BUG-94_email_preview`, `REQ-165_projected_reference`. Looking at their errors.

Those two pass in isolation (load flakes in the full run). Now REQ-165, the slow one.

No linter; the gate is typecheck. The toolbox also runs inside the control-app Worker, so I'm typechecking that too.

Both typechecks are clean. Trying the one Worker suite that drives `describe_page` (REQ-296 context budget); it may be sandbox-blocked.

The Worker suite runs here. One failure, so I'm checking whether it's mine (the map got larger) or pre-existing.

That REQ-296 failure is pre-existing (it fails the same way on the base). One last read of the finished audit module before committing.

Code is final. Bumping the project version, then committing.

Committed. Syncing the ticket body with the two refinements made during testing (relative control-font rule, layered backdrops/`backedBy`), before merging.

Another session (BUG-164) holds the merge lock. Checking whether it's live before deciding to wait.

Waiting for BUG-164's merge to release the lock. Meanwhile, I'm checking whether my branch will merge cleanly into the current xgd-working.

Only `package.json`'s version counter conflicts: xgd-working moved to 0.2.423 while I bumped to 0.2.422. I'll bump my branch past it (0.2.424) so the version gate holds after merging.

Branch is ready to merge; still waiting on BUG-164's lock.

BUG-164 released and then took the lock again (new pid, 21:58), so it's actively working through its merge. Waiting another round.

Merged cleanly (xgd-working had coincidentally also reached 0.2.424). Verifying the result, then running the free-coded gate detached, since it can take 20+ minutes.

Still running (it rebuilds main's ticket index). Waiting another round.

BUG-164 also claimed 0.2.424 (that's why the versions matched). I still hold the lock, so I'll bump to the next free version on my branch, merge that, and rerun the gate.

The lock was released while the gate ran, so I'll re-acquire it after bumping.

REQ-349 is at `free_coded`. Setting story points and cleaning up the branch.

Adding one lesson to the existing memory note: two sessions can bump to the same version.

REQ-349 is implemented, merged into `xgd-working`, and parked at **`free_coded`**. It has 3 commits and 5 story points, and the branch is cleaned up. I haven't promoted it to reconcile; that's your call.

## What changed

`describe_page` now flags style gaps on the map itself, as the ticket asked, rather than in a separate audit tool:

- **Page-level count:** `attention: { broken, inconsistent, worth_a_look }`. It is always present and all zeros on a clean page.
- **Per element:** each flagged entry gets `attention: { tier, says: [...] }`, for example `unstyled: font, size, padding, placeholder` or `children cannot fit side by side at 320px (need 285px, have 272px)`. Entries with no finding are unchanged.
- **Report only:** nothing is ever refused at write time.

What each tier catches:

| Tier | What it catches |
|---|---|
| **broken** | A form field or button missing its font, padding, or placeholder and text colour. A row whose children can't fit side by side at one of the page's declared widths. A child wider than its parent or grid column. Text below 2:1 contrast. |
| **inconsistent** | Hand-typed colours on a page that otherwise uses its palette (proportional: a site with no palette isn't flagged). A form control with no font size while other controls in the same component have one. Text with no font on a page that names one, or a font used by a single element. |
| **worth_a_look** | A field with a text colour but no placeholder colour. Contrast below WCAG AA. |

- **What the checks read:** everything comes from values already on the page, the site palette, and the component's own declaration of which element each control is. A width that can't be worked out from those numbers never produces a finding.
- **Where the code is:** `tools/generate/src/cli/style-audit.ts`, wired in at `toolbox-core.ts`. The assistant-facing description in `l1-surface.json` now tells the assistant to read the counts after every change. I bumped its version to 15.

## Tested against real sites

I ran the audit over the sample sites under `tests/fixtures/l1-corpus`:

- **The ticket's defect is caught.** On gigabytealchemy, the four contact-form fields that carry only a border and radius are flagged broken, without being set up to find them.
- **Two false alarms were found and fixed:**
  - Text on those sites often sits on a background panel that is a sibling in the tree, not a parent. The first version measured that text against the page background and called a readable hero heading "1.1:1, broken". Now, where the tree doesn't say what's behind a piece of text, it's skipped, unless the text names its panel (`backedBy`).
  - On a page where no text names a font, a control with no font matches the page, so it's no longer flagged.

Both fixes have their own tests, and the ticket body records these decisions.

## Tests

- **New tests:** all 10 in `tests/test_UAT_FC_REQ-349_style_audit.test.ts` pass. The 15 existing test files that cover `describe_page` and the assistant's tool descriptions also pass (175 tests), and both typechecks are clean.
- **Full suite:** it fails in 18 files. I reran those on the code without my change and they fail there too, apart from three that pass when run alone.
- **Worker suite:** `REQ-296_context_budget` has one failure, and it fails identically without my change.

## Worth knowing

- **Font-used-once rule:** on gigabytealchemy it flags the logo's Cinzel face as `inconsistent`. That rule came from the ticket's own tiers, but a one-off logo font is usually deliberate. Say if you'd rather drop the rule or move it to `worth_a_look`.
- **Version collision:** the version gate ran twice. BUG-164, running at the same time, had already claimed version 0.2.424, so I bumped again to 0.2.425. That's why the ticket has a third commit that only changes the version.

<!-- xgd-chat-end -->