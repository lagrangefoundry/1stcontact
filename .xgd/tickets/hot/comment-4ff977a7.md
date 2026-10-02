---
uid: comment-4ff977a7
id: COMMENT-4651
type: comment
title: Comment on request REQ-359
created_by: xgd
created_at: '2026-10-02T05:30:51.804705+00:00'
updated_at: '2026-10-02T05:48:28.713867+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-6efc8a37
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6de08955-387a-43b7-b1a9-dfec8fa775be",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="8e35b63c-5b47-43c3-9db3-3530f7176daa-user" -->

<!-- xgd-chat role="user" ts="2026-10-02T05:28:03.679318+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="8e35b63c-5b47-43c3-9db3-3530f7176daa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T05:48:27.437118+00:00" -->
#### Claude
Let me find the href validator and all the places schemes are checked.

No other href validators — the framework's module-level `assertSafeUrl` already admits `tel:`/`mailto:`; only the L1 path is narrow. Scope is clear, so I'll record it on the ticket and start.

Branch cut. Now the validator change.

Now the export, renderer, email renderer, fold, and schema doc comments.

Now the UAT. Checking the email renderer's entry point first.

Test fixture used a non-existent layout (`column` → `stack`).

All 4 pass. Now the regression scope plus typecheck.

That's the known fresh-worktree artifact (gitignored `control-app/src/generated` missing). Checking my memory note for the remedy.

It's untracked and gitignored, so I'll copy it in from the main checkout to get real evidence.

While that runs, typecheck.

That one passes in isolation (10/10) — a load flake in the parallel run, not this change. Typechecking the three touched packages:

Clean. Checking whether the builder's manual/prompt text describes the old allowlist, since that's what the AI author reads.

Nothing author-facing to update. Now the commit — checking my memory on this project's version-bump flow.

Committing explicitly-named files on the branch (the copied `generated/` is gitignored and won't be staged).

Merged cleanly. Now the gate, letting it do the version bump itself (avoids the known tip race).

REQ-359 is done: links can now point to `tel:` and `mailto:` addresses, so a phone number can be tapped to call. The change is merged into `xgd-working` and the ticket is at `free_coded`. It has 2 story points and records the commit and the version bump to 0.2.437.

**What changed**
- I added a link-only check, `isSafeHref`, in `packages/site-schema/src/l1/validate.ts`. It accepts everything links accepted before (`http`/`https`, relative paths, `#anchor`), plus `tel:` and `mailto:`.
- A `tel:` or `mailto:` address must have something after the colon. It can't contain spaces, quotes, backslashes or angle brackets, so it can't break out of the HTML attribute. Parentheses are allowed, so `tel:+1-(555)-555-0123` works.
- `javascript:`, `data:`, `vbscript:`, `file:` and every other scheme are still refused.
- It's used everywhere a link is checked or written out: the validator (for both whole-element links and links on a few words inside a sentence), the page renderer, the email renderer, and the step that converts captured sites into page data. The validator's error message now lists mailto and tel.
- Image, background, zoom and font addresses still use the old, narrower check (`isSafeUrl`), because a phone number makes no sense there.

**Tests**
- The new test file, `tests/test_UAT_FC_REQ-359_tel_and_mailto_links.test.ts`, has 4 tests and all pass. It covers:
  - a tappable call button and a phone number mid-sentence becoming live links;
  - an email body carrying a live link;
  - harmful or malformed addresses being refused by the validator and stripped by both renderers;
  - images still rejecting `tel:` and `mailto:`.
- I ran 31 related test files: 281 tests passed and 1 failed. The failure, `test_UAT_AC845` in `reconciliation-l1-navigation`, passed 10/10 when I reran that file alone, so it looks like a timing problem when many tests run at once.
- Type checks for the three packages I touched are clean.
- To run the related tests in the branch's working copy, I copied the gitignored `apps/control-app/src/generated/` folder in from the main checkout. That copy went away when the branch was cleaned up.

**Not included (written down on the ticket):** when the system captures an existing website to rebuild it, it still records only `http`/`https` link targets. So a rebuilt trades site's phone links still come out as plain text. Fixing that is a one-line change in the capture script, but it could change the results of the existing rebuild comparisons on reference sites, so I left it out. Say if you want it added to this ticket.

<!-- xgd-chat-end -->