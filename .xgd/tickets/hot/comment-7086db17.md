---
uid: comment-7086db17
id: COMMENT-1004
type: comment
title: Comment on bug BUG-35
created_by: xgd
created_at: '2026-08-13T21:17:00.498173+00:00'
updated_at: '2026-08-13T21:25:36.402802+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-1bde3bf9
  kind: chat_transcript
---

<!-- xgd-turn id="632fea77-0ae7-4265-b85e-fa47c822919a-user" -->

<!-- xgd-chat role="user" ts="2026-08-13T21:16:56.136040+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="632fea77-0ae7-4265-b85e-fa47c822919a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-13T21:25:36.200976+00:00" -->
#### Claude
I'll start by reading the ticket.

The ticket body is fully specified — root cause, fix, and test plan. Let me verify the code matches before implementing.

The fix appears already present in `builder.css`. Let me check whether it's committed and whether tests exist.

The proposed fix already landed via REQ-138's reconcile. Let me check what test coverage came with it.

Capitalisation is fixed and covered. Let me check the letter-spacing half.

Letter-spacing is asserted only at the box property level (line 626), never at the words. Let me read the browser harness before deciding scope.

I have what I need. Key finding before I write anything:

**The fix this ticket proposes is already in the tree.** Commit `2d46ee15d` (REQ-138's reconcile, `xgd-intent: request-1ff09fab`) landed exactly the rule at `apps/control-app/src/builder/builder.css:281-283`, both properties, and rewrote AC-1138 to measure capitalisation on the words in a real browser.

But it only proved *half* of BUG-35. `letter-spacing` reaching the glyphs has no browser assertion anywhere — `tests/reconciliation-copy-edit-live-preview.test.ts:626` checks only that `--preview-letter-spacing` is written on the box, which is precisely the wrapper-level measurement the ticket identifies as the thing that let the defect survive a green suite. Delete `letter-spacing: inherit` today and every test still passes.

So the remaining deliverable is the evidence half. Proceeding with that.

Now the UAT. Writing it in the branch worktree.

3.7s is too fast for two browser sessions — I need to confirm it actually ran rather than reporting unverified.

Real browser, both tests executed. Now the essential check — does it actually catch the defect? Temporarily reverting the fix:

The UAT has teeth — without the rule the control computes `normal`, exactly the reported defect. Restoring:

Running the regression scope named in the ticket:

All green. Now lint and version bump:

Prettier reformatted to double quotes/semicolons, which contradicts the repo style. Let me check the actual config.

No prettier config and no lint script — prettier isn't part of this repo's toolchain, and its defaults fight the house style. Reverting that formatting:

Now version bump and commit:

Now lock, merge back into `xgd-working`:

Version bump landed. Now the gate command and cleanup:

I invented that SHA rather than reading it. Getting the real one:

REQ-133 already claimed 0.1.43. Bumping again on the branch and re-merging:

Now updating the ticket body to reflect what actually shipped, then cleaning up:

Done. BUG-35 is at `free_coded` with both commits recorded and the tree clean.

**The headline finding: no production change was needed — the fix was already in the tree.** Commit `2d46ee15d` (REQ-138's reconcile) had already landed the exact rule this ticket proposes at `builder.css:281`, both properties. I verified that before writing anything and made no production edit.

What that reconcile *didn't* do was prove the letter-spacing half. It rewrote AC-1138 to drive the Capitalisation control and assert on the words, pinning `text-transform`. Nothing asserted tracking arrives — and that gap is structural rather than an oversight: tracking isn't an editable parameter, so it sits outside what a criterion about the parameter sheet can claim. I confirmed the exposure empirically by deleting `letter-spacing: inherit` and running the full builder suite — 159 tests, all green, with the control computing `normal`. The exact pre-fix defect, completely unguarded.

So the deliverable became the evidence half: `tests/test_UAT_FC_BUG-35_tracking_reaches_the_words.test.ts`, browser-driven against the shipped CSS through a real builder origin. It asserts a tracked run previews on the words (and separately on the box, so a regression is attributable to one side or the other), that an untracked run is given nothing — which is what distinguishes a correct fix from one that forces tracking everywhere — and that the parameter sheet's own controls stay chrome, pinning the fix's deliberate scoping. Reverting the rule fails it on `expected 'normal' not to be 'normal'`.

Two things worth flagging:

- I deliberately did **not** duplicate the ticket's two `text-transform` test bullets. AC-1138 now measures both on the words in a browser; a second assertion would be redundant coverage.
- I ran `prettier --write` on the new file mid-flight and it reformatted to double quotes and semicolons. There's no prettier config or lint script in this repo, so those were library defaults fighting the established house style — I reverted it to match the surrounding suites.

The version needed two bumps: 0.1.43 was already claimed by REQ-133, so the gate rejected it and the work landed on 0.1.44 across two commits.

The upstream `webui-fields` gap — `.fields-control` claiming `font: inherit` while dropping two neighbouring inherited properties — remains open and unaddressed, as the ticket scoped it.

<!-- xgd-chat-end -->