---
uid: comment-dfecee22
id: COMMENT-3145
type: comment
title: Comment on request REQ-275
created_by: xgd
created_at: '2026-09-18T22:38:58.064168+00:00'
updated_at: '2026-09-18T23:39:20.969080+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2a60571e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2d62049d-a1e2-432e-895b-16016b082d1a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b3e8fa6e-f158-44b2-987e-b2b39a19df55-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T22:38:07.889645+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b3e8fa6e-f158-44b2-987e-b2b39a19df55-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:10:16.340789+00:00" -->
#### Claude
Chromium works in this sandbox with `--single-process` (REQ-262's escape hatch), so I can run the probe over all three references rather than just shipping it. Starting the protocol.

Now the prototype probe, to see what real reference pages actually surface.

Design settled. Writing the probe module.

Now the triage core and the runner.

Now factor the loopback server out of `reextract.ts` so both callers share it.

Now the CLI subcommand.

Clean. Now run the audit for real across all three references.

Now landing the four axes the audit surfaced.

Now the raw→capture projection in `sections.ts`.

Now register the four axes in `CAPTURE_SCHEMA_AXES`, bump the schema once, and record them in the coverage register.

Now the fixture and UATs.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="ded44f65-c2c0-4c61-8972-1e65057ad76d-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T23:23:50.081305+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="ded44f65-c2c0-4c61-8972-1e65057ad76d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:39:20.057797+00:00" -->
#### Claude
I'll start by getting oriented — the ticket, the branch state, and what the prior session actually landed.

The branch and worktree exist. Let me read the rest of the ticket body and the worktree state.

Prior session left the work uncommitted in the worktree. Let me survey what exists.

Now the modifications to the extractor and schema.

Now let me run the UAT suite in the foreground.

5 pass, 3 browser legs skipped. The prior session claimed Chromium works here with `--single-process`. Let me check.

All 8 pass with the browser legs live. Now the real audit over the three stored references — that's acceptance clause 2.

The audit ran clean over all three. Let me read the result.

Untriaged is empty across all three — the register now covers the corpus. Let me sanity-check a few `not-expressible` calls, since background-size/position look like they might be L1-expressible.

The `pattern` path derives its own sizing triple rather than consuming a captured one, so the verdict stands. Now the regression scope — typecheck, lint, and adjacent capture suites.

Typecheck clean. Now the adjacent capture suites.

Those 4 failures only appear when a browser is available. Let me confirm they're pre-existing and not from my refactor.

Let me prove the one failure that touches my refactored code is pre-existing, by reverting just that file.

Confirmed pre-existing — identical failures with my change reverted. Now lint and a wider sweep.

Blast radius is essentially the whole fold surface. Let me run the full suite in the foreground.

Five are pre-existing on the baseline checkout. `req22-storage` failed only in my worktree — let me check that one.

All six failures are pre-existing or environmental (`storage/references` is a symlink here, which breaks `git check-ignore`). Now I'll generate the triaged corpus list for the ticket body.

Untriaged is empty across the corpus. Now let me record the triage in the ticket body.

Two of my lists name register rows the corpus didn't actually exercise. Let me make the claim exact.

Ticket body recorded. Now the commit sequence — version bump, commit, merge back.

xgd-working moved ahead and another session touched `cli/index.ts`. I'll commit my work first, then merge.

Merge was clean. Let me re-verify after the merge before bumping.

Clean after merge — 8/8 with the browser legs live. Now the version bump and merge-back.

Now lock and merge back into xgd-working.

Fast-forwarded cleanly. Now claim `free_coded`.

REQ-275 is landed at `free_coded`, merged into `xgd-working`, branch cleaned up.

## What shipped

**`1c capture audit <bundle> | --all [--json]`** — turns "which axis are we missing?" from a question each ~$7 reproduction round answers once into a single mechanical pass.

It audits a **stored bundle served offline**, not the live site: `rendered.html` is the DOM its `capture.json` was extracted from, so both sides are the same page by construction. `serveBundle` was factored out of `reextract.ts` rather than duplicated. What counts as "the page uses this" is derived from the page — a longhand is in use when a rule declaring it matches a *visible* element; shorthands are expanded by the engine itself; `:hover` is stripped so treatments attach to the element they decorate; CSS-wide keywords and custom properties aren't use.

`coverage.ts` is the register — `recorded` / `declined` / `not-expressible`, each with its reason beside the decision. Nothing reads it to decide what to look for, so a re-run on a new class of site surfaces only what is genuinely new.

## The audit result (run live over all three references)

`faelan.com` 22 elements/77 properties, `gigabytealchemy.ai` 108/85, `joyfulculinarycreations.com` 424/175. **Untriaged: zero** — every property the corpus uses now has a recorded decision. 113 distinct properties triaged: 4 landed, 71 declined, 29 not-expressible (capability items for the epic's other half), 9 recorded-but-absent from a given bundle.

The four landed were all DOM facts — `target`→`newTab`, `name`→`controlName`, `method`→`formMethod`, `required`. That the CSS half came back empty is a result, not luck: REQ-47/48/63/265/269 swept the paint surface repeatedly, so what remained was the half no pixel gate can see. `CAPTURE_SCHEMA` bumps 3→4 **once for all four**.

## Verification

8 UATs, all passing — 5 browser-free, 3 driving real headless Chromium via `CHROMIUM_LAUNCH_ARGS=--single-process` through the whole command path. Typecheck clean.

Full suite: **573 files / 4955 tests pass, 5 files fail**. I verified every one of those is pre-existing, not mine:
- Four (`BUG-67`, `BUG-112`×2, `REQ-101`, `BUG-32`) fail identically on the untouched main checkout.
- `req22-storage` fails only in the worktree because `storage/references` is a symlink there, which makes `git check-ignore` refuse the path.
- Separately, running the adjacent capture suites *with a browser available* exposes 4 more pre-existing failures (`capture.test.ts`×2, `req83`, `REQ-211`) — tests that don't supply the injected `driverFactory` seam, plus a stale `inlineGroup` assertion. I confirmed by reverting my `reextract.ts` and reproducing them unchanged. These are normally invisible because `chromiumAvailable()` is false in this sandbox by default; they're worth their own ticket if you want them fixed.

<!-- xgd-chat-end -->