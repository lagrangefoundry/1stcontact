---
uid: comment-19b40c10
id: COMMENT-5535
type: comment
title: Comment on bug BUG-238
created_by: xgd
created_at: '2026-10-20T23:33:42.217189+00:00'
updated_at: '2026-10-20T23:48:14.281012+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-c0f53ca7
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "00d115dd-d0e4-4867-ab45-95c6b7e8c562",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="058981a3-5e7e-4b1c-806d-928e3c146aaf-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T23:32:51.128377+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="058981a3-5e7e-4b1c-806d-928e3c146aaf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-20T23:48:12.680314+00:00" -->
#### Claude
I'm reading the existing REQ-415 layout check and its tests to see where the new brand-size and heading-attachment checks plug in.

Now I'll set the ticket to `free_coding` and cut the branch.

Before changing anything, I'm running the existing layout-check tests in the worktree as a baseline.

The baseline passes with a real browser. Next I'm checking how L1 expresses links, images and headings so the fixtures use real markup.

I have what I need. Now I'm writing the config file and the new checks in the layout script.

Now the doc comment, types and config load.

Now the in-page checks themselves.

Now the UAT file.

Detection works; the one failure is the fixture (a single-section page gets descended through). I'll add a second section.

All 23 layout tests pass. Now the workers suites that drive the host look, plus a typecheck.

Typecheck is clean. As a false-positive sanity check, I'm running the new checks against the real stored pages in the sandbox through a throwaway test, which I'll delete afterwards.

Tests pass. Now the builder guidance in `priming.json`, spliced as text rather than round-tripped through JSON (a JSON round-trip of that file churns its escapes).

The surrounding text uses `\u2014` escapes, so I'll match that. Then I'll add a UAT for the builder guidance and run the priming suites.

One failure, in a REQ-341 case. My memory notes say the delegation suites already fail on a clean tree; I'll confirm that's what this is.

That's a role-grant list mismatch, unrelated to this change and already noted as failing before it. Now the commit; first I'm re-reading my notes on this project's `free_coded` gate.

I'll commit only my four files on the branch.

Now updating the ticket body to match what was built, keeping the existing content.

Ticket updated. Now the merge-back: take the lock, then merge into xgd-working.

Merged cleanly. Next the ticket-overlay check, then the `free_coded` gate (without `--version`, so the gate does the version bump itself).

Nothing to rematerialize (0 candidates). Moving the ticket to `free_coded`.

BUG-238 is implemented and merged into xgd-working. The ticket is at `free_coded` with two commits (the change, plus a version bump to 0.2.561) and its body describes what was built. Promoting it to `ready_to_reconcile` is your call.

**What it does.** The REQ-415 layout check now reports three new faults at desktop and phone width. They show up in the `Delegate` result and in `describe_page` warnings, and a page with any of them is reported as "not done":
- **Logo too small:** the header's tallest image is shorter than 48px on desktop or 36px on phone. The header is taken to be the page's first section, if it contains a link.
- **Business name too small:** the name is less than 1.25× the size of the navigation links. Text that isn't a link counts as the name, and so does a link to the home page unless it just says "Home". A header made only of links is skipped if it has a logo, since the name may be in the logo; with no logo it is reported.
- **Floating heading:** the space below a heading is at least 0.75× the space above it.

The thresholds are in a new file, `tools/generate/src/cli/ai/layout-check.json`, not in the code. The builder's guidance now says to start the logo at about 56px on desktop and 40px on phone, to make the name the header's largest text, and to put less space below a heading than above it.

**Decisions I made:**
- **The name is found from the page structure, not looked up.** The site file has the business name, but passing it to every caller of the check didn't seem worth it.
- **Spacing too tight to judge is ignored.** I ran the new checks on the 10 stored sandbox pages. At first, headings with only 8–12px above them were flagged, which is tight spacing, not floating. So the check now ignores headings with less than 16px above. The real cases stay flagged, such as 84px above and 86px below. The run also found one header with nav links and no business name at all, which is correctly reported.

**Tests:** the new tests in `tests/test_UAT_FC_BUG-238_brand_and_heading_layout.test.ts` cover each case in the ticket's test plan, run in a real browser, and all pass. So do the existing layout-check, table, hidden-text and host-look suites. One case in `REQ-295_delegation_config` fails because the list of what a worker may manage now includes text styles. That has nothing to do with this change and was already failing before it.

<!-- xgd-chat-end -->