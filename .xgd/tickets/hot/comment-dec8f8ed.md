---
uid: comment-dec8f8ed
id: COMMENT-4822
type: comment
title: Comment on request REQ-365
created_by: xgd
created_at: '2026-10-03T16:37:53.911748+00:00'
updated_at: '2026-10-03T17:09:50.066267+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-936e10eb
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "bc8c2284-c963-4d5f-bc6e-062b87c054d7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="aea12d4b-afc5-4536-bb6a-dbafc5637b4f-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T16:33:58.089227+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="aea12d4b-afc5-4536-bb6a-dbafc5637b4f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T17:09:48.660046+00:00" -->
#### Claude
Schema & validator read. Now reading renderer, fold and capture sections to wire the new axis through.

Mapping the comparator's property registries (they're exhaustive records) before editing.

Bumping the capture schema to 13 for the new recorded axis is warranted per the file's own rule. Now checking for exhaustive key lists in tests/roundtrip that the new axis must join.

Email target derives its refusals from an allow-list, so the new axis is refused there automatically. Starting edits: schema first.

Schema done. Now the envelope validator (bounds for node, run and state).

Control axes extend text axes, so I'll bound both kinds.

Now the renderer — three emit sites (run, text node, interaction state).

Correcting a comment — `text-underline-offset` is not a longhand of the `text-decoration` shorthand.

Now capture: extractor, RawRun/ContentRun types, sections projection.

The extractor runs as a template-literal script; checking how existing regexes escape backslashes there.

Now bumping `CAPTURE_SCHEMA` to 13 with a dated axis entry.

Fine — all relative. Now coverage register, value-axes row, and comparator.

Now the fold (node + run) and the inline-run signature.

Wiring complete. Typechecking.

Typecheck clean (control-app errors are the known fresh-worktree artifact). Now the UATs — looking at the REQ-331 tests for the established harness.

I'll write the UAT file now: schema/envelope, renderer, fold, comparator, coverage register/schema stamp, plus a Chromium-gated extractor check. Checking a couple of API signatures first.

Writing the fixture and the UAT file.

The worktree is missing the gitignored `apps/control-app/src/generated/` build artifact. If it's ignored, I'll copy it in from the main checkout so the suite can run here.

A one-run run-list is refused by schema (needs ≥2 runs); fixing the test fixture, not the code.

10 pass, 1 skipped (Chromium can't launch in the sandbox). Verifying the extractor change offline: syntax-check the script and drive `underlineOffsetOf` directly.

Extractor verified offline. Running the adjacent regression scope (fold, values-diff, value-axes, coverage register, capture schema, run axes, renderer, email target).

This is a jsdom `hashchange` event assertion unrelated to underline styling. Confirming it fails on clean xgd-working too.

Pre-existing on clean xgd-working, so not mine. Now DOC-27 (vocabulary) — finding where `textDecoration` is documented there.

DOC-27 has no per-axis catalogue, so I'll add a one-line worked example under its "design rule for L1 axes". Checking DOC-19's line that names this failure too.

Docs updated. One more code-comment touch (email target's list of refused type axes), then commit. Reading my notes on the version-bump/merge procedure for this repo first.

Plan: commit on the branch → lock → merge into xgd-working → `move-to-free-coded` without `--version` (lets the gate bump atomically) → clean. First the email comment and the ticket body.

Updating the ticket body: keeping the original analysis intact and appending a "what landed" section that motivates every UAT.

Now committing on the branch.

Another session (REQ-363) holds the merge lock; waiting for it and retrying.

Clean merge. Quick post-merge check of the UATs in the main checkout, then the free_coded gate.

REQ-365 is implemented and at `free_coded`. It covers both issues: L1 can now say where an underline sits, and the comparator flags a mismatch, where before it reported nothing. On this page that comparator half is still untested: faelan.com needs a re-capture first (details at the end).

**What changed**
- **L1:** a new optional `underlineOffsetPx` value, in pixels, alongside `textDecoration`. It works on a single run of text, a whole text or control node, and hover/focus states. It must be a number between -100 and 100; a CSS string is rejected. If it's left out, the browser picks its own position, as before.
- **Renderer:** it writes `text-underline-offset: <n>px` in each of those three places, and writes nothing when the value is absent.
- **Capture:** the extractor now records the offset in pixels. It records `null` when the page uses the browser's default, uses a percentage, or has no underline. The capture schema goes up to version 13, and the capture audit now lists `text-underline-offset` as `recorded` instead of `not-expressible`.
- **Fold:** a node keeps the captured offset. A run keeps it only when it differs from the rest of its sentence, the same rule `textDecoration` follows.
- **Comparator (issue 2):** `underlineOffsetPx` is now compared. A declared offset against the browser default is a delta, and so are two offsets more than 0.5px apart. Bundles captured before this change are skipped rather than compared against a default.
- **Docs:** I added a worked example to DOC-27 and updated the DOC-19 runbook line about link underlines.

**Decisions I made**
- Pixels rather than `em`: pages declare it in px, and an `em` value would change size with responsive font sizes, which the reference page doesn't do.
- I left out thickness, colour and style, since no page we've seen needs them.
- Email pages refuse the new value, the same as other text styling that mail clients don't support.

**Tests**
- 10 new UATs pass. They're in `tests/test_UAT_FC_REQ-365_underline_offset_axis.test.ts` and cover the validator, renderer, fold, comparator, capture audit and schema version check.
- An 11th UAT checks the extractor in a real browser. It was skipped because Chromium can't launch in this sandbox. I checked the extractor's offset logic separately by running it directly against sample values.
- I ran 41 nearby test files. All passed except `reconciliation-l1-navigation` AC845, which fails the same way on clean xgd-working, so it isn't from this change.

**Commits:** `4f5d8f55` (the change) and `66b438e4` (version bump added by the free_coded step). Story points are 5, the branch is merged into xgd-working and cleaned up, and the ticket body now has a "what landed" section.

**Your next step:** faelan.com needs a **re-capture** before the gate result changes. This is a capture-side change, so `1c refold` won't pick it up. After re-capturing, the three "how to know it is fixed" checks in the ticket should all pass.

<!-- xgd-chat-end -->