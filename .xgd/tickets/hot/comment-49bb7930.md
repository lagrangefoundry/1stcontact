---
uid: comment-49bb7930
id: COMMENT-4841
type: comment
title: Comment on bug BUG-178
created_by: xgd
created_at: '2026-10-03T19:27:30.955442+00:00'
updated_at: '2026-10-03T20:05:31.036075+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d4a790a5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "72208ec4-10c8-4b5f-8e78-ef851c0a3783",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d21e50ba-9b66-48f1-ac6a-e718a9fe299c-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T19:21:20.005990+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d21e50ba-9b66-48f1-ac6a-e718a9fe299c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T20:05:24.599813+00:00" -->
#### Claude
Reading the gate and its unmeasured ledger to find where the "unmeasured N — axes, bands, populations, probes" line is composed.

Mapping the coverage register now (text-underline-offset looks like it may have since gained a `recorded` entry), then I'll settle the design.

Checking how existing gate tests drive `cmdGate` (pre-shot artifacts vs fake driver), since adding an audit pass would launch a browser there.

Nearly done mapping. One test passes both pre-shot artifacts and a driver — checking why, since it decides when the gate may launch the audit.

Branch cut. Now reading `reconcileGates` to add the new input/output fields.

Adding the types and the `reconcileGates` plumbing in `gate-core.ts`.

Now `cmdGate` (run the audit) and the CLI text report.

Now the inert-declaration filter in `AUDIT_SCRIPT`.

Now the console's fifth part in `unmeasured.ts`.

Typechecking both packages.

Typecheck clean. Before writing the UAT, checking whether jsdom can evaluate `AUDIT_SCRIPT` faithfully enough (computed `display` from stylesheets).

jsdom resolves stylesheet `display` (no UA default for `span`, so the fixture states it). Now looking at the BUG-103 harness to reuse for the `cmdGate` fake-driver case.

Writing the UAT file.

The worktree is missing control-app's generated files, a known fresh-worktree artifact. Checking the memory note for the fix.

Gitignored, so I'll copy the build artifact into the worktree and rerun.

Six of seven pass; the failure is only line-wrapping in the terminal text. Normalizing whitespace in that assertion.

All 7 pass. Running the regression scope (gate, unmeasured, audit and console suites).

All 23 regression files pass; the 7 skips are the Chromium-gated browser cases. Also running the other suites that import the repro console.

Both scopes are green. Before committing I'm checking the promotion memory, since it has a specific bump order.

Committing on the branch. I'm skipping a manual version bump; the gate command will bump it itself (per the race memory).

Committed `695eabf`. Now lock and merge into xgd-working.

Merged; `695eabf` is now an ancestor of xgd-working. Re-running the UAT on the merged tree before promoting.

BUG-178 is fixed and the ticket is at `free_coded`. Commits are `695eabf` (the fix) and `a92145b` (version bump to 0.2.451). The branch is merged into xgd-working and cleaned up.

**What changed**
- **The gate now runs the capture audit.** When `1c gate` opens a browser (normal repro rounds always do), it runs the audit against the reference bundle. `gate.json` gets a new `unmeasuredProperties` list: each property the page uses that either has no L1 axis or that this bundle doesn't carry, with its values and count.
  - If the audit fails, the field is `null` and the reason is recorded. The headline then reads `unmeasured ≥ N`, not a false number.
  - A gate given both a pre-made screenshot and manifest still opens no browser, so it runs no audit and writes no field.
- **The console's unmeasured headline has a fifth part, `properties`.** The breakdown names each one, e.g. `text-underline-offset (4px; not carried by this bundle)`. Reports that don't have the field keep their old total, so existing headlines don't shift.
- **The pass/fail verdict is unchanged.** On a passing run the next-step text now names these properties, and the terminal report prints them on every run.
- **Inert declarations are no longer counted.** The audit only counts a declared property if it can actually apply to at least one element the rule matches, per the CSS spec. So `vertical-align` on the reset's `display:block` images no longer shows up as a false "lost" row.

**One thing differs from the ticket:** `text-underline-offset` has since gained an L1 axis (REQ-365), so it is no longer "not expressible". On the faelan bundle, which was captured before that change, it now appears as "lost" (not carried by this bundle) instead. The six background/overflow properties still count as not expressible.

**Tests:** the new UAT file `tests/test_UAT_FC_BUG-178_unexpressed_properties_are_unmeasured.test.ts` passes (7/7). It covers the path from audit to `gate.json` to the headline and the round prompt, the gate itself running the audit with a fake browser, and the inert-declaration filter evaluated in jsdom. The existing gate, unmeasured-set, audit and console suites (44 files) also pass. 14 browser cases skipped because Chromium can't launch in this sandbox.

**Not verified:** I couldn't run a real gate against faelan.com here, for the same Chromium reason. To confirm on the real page, run:
```
CHROMIUM_LAUNCH_ARGS=--single-process node tools/generate/bin/1c.mjs gate repro-faelan-com --ref storage/references/faelan.com/index --sandbox
```

The full audit now checks every element a rule matches instead of stopping at the first, so it may run a little slower on large pages.

<!-- xgd-chat-end -->