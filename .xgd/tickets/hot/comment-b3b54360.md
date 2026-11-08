---
uid: comment-b3b54360
id: COMMENT-7811
type: comment
title: Comment on request REQ-655
created_by: xgd
created_at: '2026-11-05T15:49:06.906585+00:00'
updated_at: '2026-11-05T20:30:41.472557+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7c539f69
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e3506054-c63e-4f91-951c-a370bb611881",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="77428a67-331b-4fe7-a7fa-3fcf977e9d6a-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T15:48:38.172399+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="77428a67-331b-4fe7-a7fa-3fcf977e9d6a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T15:56:13.663984+00:00" -->
#### Claude
Reading the ticket and the existing layout floor checks (REQ-648's `layout-check.ts`) before planning the change.

Still mapping the code: the existing checks already cover wrapped labels and ragged stacks, so I'm now reading how the renderer draws button components to see where the defaults need to change.

Finished surveying. Before writing code I have one question that changes the scope, and a few decisions I'd like you to confirm.

I haven't changed anything yet: no code, no branch, and the ticket is still at `draft`. There's one thing I need you to decide, and three choices I'll go ahead with unless you object.

## What's already there

- **The floor check is mostly built.** `button_wraps` (REQ-457) already reports a label that wraps. `ragged_buttons` (REQ-622) already reports a stack of buttons with unequal widths, though it allows 2 px and this ticket says 1 px. The only missing rule is **equal heights for buttons in a row**. Part 2 of the ticket becomes: add that rule, tighten the stack rule to 1 px, and word the failures like your example.
- **The renderer has a related rule.** REQ-622 lets a wrapping row of buttons spread each button across its own line once the row wraps. Nothing stops a label from wrapping, nothing evens out heights in a row, and nothing gives a set equal widths.

## The question: how should overrides be recorded?

There's already one way to say "this is on purpose", and it covers every layout check: the `layout_kept` decision (BUG-313). The consultant records it in the client's words, it goes in the decision ledger, and the check skips that finding until it changes or moves. Only the consultant can write it, so the builder can't use it to make a failure go away.

It doesn't match your spec, though. It isn't a typed field on the node. It's keyed to the finding's exact line at one width, and the consultant can only record it after a check has reported the problem, not as a design choice made in advance.

Your two instructions point different ways here: "a typed exemption on the node" and "if those checks already have an exemption mechanism, use it". Which do you want?

- **(a) Reuse `layout_kept` as it is.** The least new work, and it already meets "never silent" and "the builder can't add one". But it's reactive and has to be recorded once per width.
- **(b) Add a typed exemption on the node and replace `layout_kept` with it,** for all taste checks including REQ-648's grid rules. It would be a field naming the rule it exempts from, with a reason. It matches your spec and keeps a single mechanism, but it's more work. We'd need to migrate the existing `layout_kept` decisions, and the builder's write path would have to refuse the field so only the consultant can set it.

I'd lean towards **(b)** because it's what the ticket describes, but it roughly doubles the size of the ticket.

## What I'll do unless you object

1. **Deciding when a group stacks.** CSS can't tell whether a row of buttons fits on one line. I'll estimate each label's width from its character count in the button's own font (allowing for uppercase and letter spacing) and switch the whole group between one row and a full stack, so it never splits two-and-one. This uses no fixed breakpoints and no script. The estimate errs wide, so a set will be equal-width at the estimated widest label, a little wider than an exact fit. The check remains the safety net if the estimate is ever wrong. The exact alternative would be a small script on the published page, which I'd rather avoid.
2. **What counts as "the same kind".** The renderer drops the component name once the design is applied, so I'll treat buttons as the same kind when they're painted identically (same fill, border, text colour, type role and padding).
3. **One REQ-622 test changes as a result.** It expects two identically styled hero buttons to have different widths on one line. Under your rule they're a same-kind set and get equal widths, so I'll update that assertion and note in this ticket that it supersedes it.

Once you answer, I'll cut the branch and build the whole thing.

<!-- xgd-turn id="27270eda-e5c8-4a18-a3f7-bd148e49d351-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T19:36:43.234202+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="27270eda-e5c8-4a18-a3f7-bd148e49d351-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T20:30:40.794016+00:00" -->
#### Claude
Re-reading the ticket and the `layout_kept` code to confirm the plan holds. No code yet.

Still surveying: checking how rendered nodes can be named so a `layout_kept` keep can point at a group before any check runs.

Still surveying the renderer. My plan for the default is shaping up: a pure-CSS row-or-stack switch for each button group (no breakpoints, no script). Checking how button text and fonts are emitted.

Branch is cut. I'm setting up the worktree so tests can run, then taking a baseline.

Baseline is green (13 tests). Reading the check runner's `add()` and the REQ-648 grid checks next.

Survey done. Starting the code with the font-advance table: for each font family offered, the measured per-character width the label estimate needs. Checking how `1c fonts` subcommands are wired.

Writing the generator (`1c fonts advances`). It measures every family in `fonts/platform.json` in Chromium and writes the table into the framework package.

Now writing the generator module.

Working on the renderer's button-group rule. Checking a few helper signatures first.

Now the renderer: one-line labels and the group rule, replacing REQ-622's wrapping-row rule.

Framework typechecks. Running the REQ-622 suite to see the new rule's effect.

That's the expected supersession: the two same-kind hero buttons now take equal widths. Updating that assertion.

Now the floor check: findings carry the node ids they sit inside, a new equal-heights rule, and the new wrap wording. Checking which tests pin the old wording first.

Moving the keep parser into its own small module so the plan (which records the keep) and the check (which honours it) share it.

Now the plan side: `set_decision` on `layout_kept` accepts `rules`.

The only errors are in two control-app files I haven't touched, so they're pre-existing. Wiring `1c fonts advances` into the CLI and running it over the mirror.

Writing the REQ-655 UAT file.

The other six pass. Reworking the table to per-class maxima.

The sign class is dominated by `@`, `%` and the em dash, so a parenthesis would be charged a full em. Splitting signs into narrow and wide.

The estimate now holds for every one of the 1,931 families. Updating the two REQ-457 tests that pinned the old wrap wording.

Now a wider regression over every suite that renders L1 or runs the layout check.

290 suites. Running them in chunks of about 50 with a JSON reporter.

Ten failures in chunk 1. I'll collect failures from every chunk, then run all of them once against the base to separate pre-existing ones.

Chunk 5 hit my shorter timeout. Rerunning it with the full budget.

Before baselining, I'm saving the work as a WIP commit on the branch.

Only three failures are new to the branch. Running them alone on the branch.

Those four suites pass. Next, part 3: one line in the builder's notes. Finding where the existing button guidance lives.

The rule goes in the builder priming beside the REQ-622 line, in both copies. Inserting it by text so the file's escapes are left alone.

Adding a priming UAT to the REQ-655 file in the BUG-267 style.

Running the priming suites (budget and pinned phrases), then the earlier failing list again, since the renderer changed.

REQ-358 and REQ-473 pass alone. REQ-472 looks like a knowledge-base fixture problem rather than my change; confirming against the base.

REQ-472 also fails on the base, so it isn't mine. Dropping my temporary stash entry.

Re-running the suites that build buttons (a `link` with a fill or border), since the group rule changed after the first sweep.

This census difference has nothing to do with buttons, and the suite passed in the first sweep. Checking it against the base.

Also fails on the base. Now the workers-project suites that touch layout keeps and checks.

Pre-existing as well. Typechecking both packages and looking for a lint step.

Typechecks clean (apart from the two pre-existing control-app errors) and there's no lint script. Reading my notes on the `free_coded` promotion steps for this repo.

Before merging back I'll fold the two WIP commits into one `[FREE-CODED]` commit. I'll use a scripted rebase, which is ledger-safe, never `reset`.

Updating the ticket body to match the final implementation. Reading the current body first in case it changed while I worked.

Ticket updated. Now the merge-back: lock, merge `xgd-working` into the branch, bump the version, then a fast-forward onto `xgd-working`.

`xgd-working` moved while I worked, and git auto-merged other changes into `layout-check` and `priming`. Checking what came in, then re-running my suites on the merged result.

All 58 pass on the merged result, including the incoming BUG-355 suite and the every-font estimate. Bumping the version and fast-forwarding `xgd-working`.

Now tearing down the branch and worktree. Removing the untracked `fonts/mirror` symlink first, so nothing untracked is left in the worktree.

REQ-655 is built, merged into `xgd-working`, and parked at `free_coded` (commits `12c7f7ee…` and `a2040baa…`, version 0.2.785). The ticket body describes what was built, and I haven't promoted it to `ready_to_reconcile`.

**What it does now**
- **Labels stay on one line.** Every button's label renders on a single line, centred top to bottom in its box.
- **Button groups line up the way they stack.** A container holding only buttons is either one row or a full stack, never two-and-one. It switches in CSS with no breakpoints and no script.
  - In a row, all the buttons are the same height. A set of the same kind is also the same width.
  - In a stack, all the buttons are the same width.
  - No button is wider than the widest one needs. That keeps the existing "a button sizes to its label" check (BUG-293) passing.
- **Where the width estimate comes from.** I added a measured table for all 1,931 font families, written by a new `1c fonts advances` command.
  - The test that compares the estimate against what Chromium draws failed on my first version (one average width per character). The current version uses the widest character in each class of characters, and it passes for every family.
  - That test only runs where the font files are staged (`fonts/mirror`, which lives in the main checkout only).
- **The floor check.** There's a new equal-heights rule for buttons in a row, at 2 px. The wrap failure is now worded like: `has the button "Handmade Originals" wrapping to 2 lines at 1280px: keep a button on one line; give its set equal widths or stack it, or shorten the label`.
- **Advance overrides.** The consultant can record a `layout_kept` keep before any check runs, as `home #collections: button_wraps`. That skips only the named rule, inside that element, on that page, at every width.
  - It only accepts the taste rules: the three button rules and REQ-648's grid rules. Anything else is refused.
  - Existing keeps work as before.
- **Guidance.** Both builder primings now carry one line stating the rule.

**Two things that work differently from what you might expect**
- **Elements are named by their node `id`.** An advance keep can only point at a group the builder has given an `id`, so the consultant has to tell the builder which id to use.
- **Groups whose layout changes across widths are left alone.** If the document says row on desktop and stack on phone, the renderer keeps that, and only the check applies.

**Tests**
- All 8 new UATs pass, as do the related suites after merging in the latest `xgd-working`.
- Two existing tests changed on purpose:
  - REQ-622's identical hero buttons now take equal widths. That supersedes its "each keeps its own width" assertion.
  - REQ-457 asserts the new wrap wording.
- Across about 340 suites that render pages, run the layout check, or touch the plan or priming, every remaining failure also fails on the base (for example REQ-418, REQ-452, REQ-472, and REQ-219's workers test).

I didn't check the result on a real site. Sizing is estimated before the page is drawn, so I'd look at a dev site's button rows before promoting.

<!-- xgd-chat-end -->