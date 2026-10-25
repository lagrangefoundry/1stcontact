---
uid: comment-1c3b9d80
id: COMMENT-3782
type: comment
title: Comment on request REQ-308
created_by: xgd
created_at: '2026-09-25T01:38:54.220156+00:00'
updated_at: '2026-09-25T02:06:51.323858+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-472ca7d6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8a50420d-d2bf-4154-a65c-ef3872dd17f2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ef4e3f12-076f-417c-8ea7-b194194c15ec-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T01:37:28.875201+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ef4e3f12-076f-417c-8ea7-b194194c15ec-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-25T02:06:51.241632+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now the values-diff field pass and section pairing:

Now let me look at `projectField` in value-axes.ts:

Now the fold's control emission and the renderer:

Now the renderer side — how L1 control axes become CSS:

I have a clear picture of the code. Let me set up the ticket and branch.

Worktree works. Now let me implement Issue 1 — the capture side.

Now I'll add the typography helper to `extract.ts`:

Now the `RawField` and `Field` type declarations:

Now the bundle projection in `sections.ts`:

Now the axis table — `FIELD_AXES`:

Now the values-diff field pass:

Now the object card for controls:

Now the fold — write the type onto the L1 control axes:

Now bump the capture schema and register the new axis:

Now Issue 2 — the paintless reference band. Let me implement the classification:

Now wire the gate to report the reclassification:

Good. Now the CLI summary line in `gate.ts`:

Now the UATs. Let me check the fixture and test conventions first:

Now let me write the fixture and the first UAT file:

Now I'll write the first UAT file:

Now the second UAT — the paintless reference band:

Now update the ticket body before merging, then land the branch:

Now lock and merge back:

Now the `unmeasured.ts` conflict — combine BUG-139's probe change with the REQ-308 detail:

Now re-run the affected suites after the merge:

Now move the ticket to `free_coded` (letting the command handle the version bump):

Now clean up the branch:

Done. REQ-308 is at `free_coded` with both residuals fixed.

## Issue 1 — a placeholder-only control now carries its own type

The hole ran the length of the pipeline, so the fix does too:

- **`extract.ts`** — `controlTypographyOf` reads the `::placeholder` pseudo-element's computed `font-family`/`font-size`/`font-weight`/`line-height` (falling back to the control's own style, which is what its typed text paints with), onto the control's **existing** text axes. `l1ControlAxesSchema` is already the text axes plus `placeholderColor`, so no new axis exists anywhere. `null` for `normal`; nothing at all for an `<img>`/`<hr>`/backdrop box.
- **`types.ts` / `sections.ts` / `value-axes.ts`** — declared, carried into the bundle, and `FIELD_AXES` reads them instead of returning the `''`/`0` constants (plus a new `lineHeightPx` row).
- **`fold.ts`** — writes them onto `L1ControlAxes`, plus per-width tracks (BUG-18's shape on the route BUG-18 didn't cover). The renderer's existing `emitTextAxes` emits them, already ordered after its `font: inherit` reset.
- **`values-diff.ts`** — the field pass compares all four, guarded on both sides carrying a real size (a pre-REQ-308 bundle and every non-control stay inert). `lineHeightPx` is the exception: on a control whose type *was* read, an absent value is `normal` measured, and `normal` against 24px is the defect itself — skipping it would leave the instrument blind to its own finding.
- **`schema.ts`** — `CAPTURE_SCHEMA` 5 → 6, axis registered, so a stored bundle says out loud it can't express this until re-captured. Expect the delta count on gigabytealchemy to **rise** until then; that's the sharpening.

## Issue 2 — a paintless reference band is not a surface

Took the instrument side (the ticket's stated preference), and within it "classify it as not-a-band" rather than "pair it to the geometric slice" — that slice is §1, the 800px hero, which would be a second category error. An **unpaired** band whose fill was *measured* absent, with no image and no overlay, moves into `nonSurfaceSections` carrying its geometry and reason. The gate counts and names it; the console's `unmeasured` headline says why the number fell rather than quietly shrinking. A band that paints anything is still counted; a pre-schema-3 `undefined` fill stays unpaired; REQ-270's declined anchor on the overlapped band is untouched.

## Verification

22 new UATs across two files plus one existing assertion updated (`req51`'s control param table, exactly as it was when REQ-265 added `placeholderColor`). All green, along with ~90 existing suites touching the diff/gate/fold/capture/render paths.

**One honest gap:** the four browser-gated UATs report SKIPPED — `chromiumAvailable()` is false here (denied Mach bootstrap port, Playwright build pin), not a code problem. I verified the extractor offline instead: the whole `EXTRACT_SCRIPT` parses, and `controlTypographyOf` was driven through all seven shapes those UATs assert, producing exactly the expected values. They'll run on a capable runner.

Also worth knowing: `xgd-working` moved under me mid-session and gained **BUG-139** (`notComparableAxes` — per-band refusals lifted out of `sectionPairing`). I merged it in by hand and kept both; the two changes compose cleanly, and BUG-139 now counts the §1 anchor refusal this ticket explicitly said it does not fix.

<!-- xgd-chat-end -->