---
uid: comment-d1f8ff54
id: COMMENT-468
type: comment
title: Comment on bug BUG-20
created_by: xgd
created_at: '2026-07-24T18:22:48.134887+00:00'
updated_at: '2026-07-24T18:59:55.112611+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-1404344e
  kind: chat_transcript
---

<!-- xgd-turn id="83985097-3627-411e-9857-1a0b1f67ae4f-user" -->

<!-- xgd-chat role="user" ts="2026-07-24T18:22:45.204873+00:00" -->
#### You
Please free code this ticket

<!-- xgd-turn id="83985097-3627-411e-9857-1a0b1f67ae4f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-24T18:27:37.844783+00:00" -->
#### Claude
I'll start by reading the current ticket state and investigating the relevant code.

Now let me investigate the fold code and the L1 schema for the box axes.

The `buildCards` path already carries `borderLeft`, `border`, `boxShadow`, `borderRadiusPx`, `gradient`. So the bug is subtler than "not carried at all." Let me investigate the capture side and how these are attributed to runs, plus the L1 schema bounds.

Let me look at how the reference capture attributes these treatments to runs, which determines what the re-render must reproduce.

The badge case is revealing: a badge is a text run whose OWN element paints radius+shadow, but the text-leaf path (`textAxes`) drops box treatments — they only reach a separate sibling card box. Let me confirm how the gate produces the "actual" side (re-render+re-capture vs. direct fold comparison).

The 3-probe gate is geometry-only. The 27 defects come from the browser-backed values-diff. Let me see how the "actual" side is produced (re-render+re-capture) and how box axes get attributed.

Both `surfaceFillOf`/`surfaceGradientOf`/`accentBarOf` walk DOM ancestors, while `borderRadiusOf`/`boxShadowOf`/`boxBorderOf` read the run's own style. This hinges on the rendered DOM structure. Let me check the L1 renderer.

Now let me see how the `1c repro` pipeline produces the "actual" side and counts the 27 defects — this determines whether the fix is on the fold projection or the re-render.

Let me verify empirically rather than theorize. Let me find the gigabytealchemy capture bundle and check git history on `buildCards`.

I have the bundle. Let me write a quick investigation script to fold it and inspect what the reference captures for the badge/border-left/gradient elements vs. what the fold produces.

Concrete reference data confirmed. Now let me see what the fold currently produces for these same elements. Let me check how to run the TS fold.

<!-- xgd-turn id="0cc68505-4748-4f61-8732-dfe4d26e689b-user" -->

<!-- xgd-chat role="user" ts="2026-07-24T18:45:17.762843+00:00" -->
#### You
PLease complete the free coding process for this ticket

<!-- xgd-turn id="0cc68505-4748-4f61-8732-dfe4d26e689b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-24T18:59:55.083228+00:00" -->
#### Claude
I'll pick up where the investigation left off. Let me re-establish state and check what's on disk.

Working tree is clean — no prior work landed. Let me re-establish the code context.

Let me examine the capture-side attribution — this determines whether the fix is fold-side or render-side.

Fold carries the axes onto card boxes already — the ticket's root-cause diagnosis is off. Let me confirm the actual mechanism against the reference.

Root cause confirmed empirically — and it differs from the ticket's diagnosis. Let me check the renderer before choosing the fix.

Root cause is confirmed and differs from the ticket's diagnosis. Let me gather the last pieces before implementing.

I have the full picture. Let me read the validator's axes checks, then implement.

Now implementing. **Part A** — L1 text leaves gain their own surface axes (the pill/chip capability gap):

Now the envelope validator must bound the new lengths:

Now the renderer must emit the chip surface on a text leaf:

Now the fold — detect a self-painting chip, carry its own treatments to the text leaf:

Now wire it into the fold's text branch:

**Part B** — the diff's `shape` axis compares a saturating sentinel radius as a raw number:

Let me verify Part A+B before tackling Part C.

Stale compiled `dist` — need to rebuild site-schema first:

All three typecheck clean. Now let me verify the fix empirically against the real capture:

Let me write the UATs directly — vitest handles the `.astro` resolution:

All 7 pass including the real-capture cross-check. Now a UAT for Part B (the diff's pill saturation):

Now the Part B UATs:

All 11 pass. Now the regression scope:

Let me establish which of these are pre-existing versus caused by my change:

Baseline established: 2 test failures pre-existing. My change introduced exactly one regression in the BUG-14 test — let me fix it:

The BUG-14 fixture exposes a real flaw: my chip test was too broad. A single-run *card* (12px radius + shadow) isn't a chip. The correct discriminator is pill saturation:

Both pass. Let me pin that discriminator with a UAT — it's the regression I just caught:

Now a clean full rebuild + full suite, per the clean-rebuild rule:

Full suite matches the pre-existing baseline exactly — no regressions, +12 UATs. Let me check what's staged:

Clean diff — only source + the new test. Bumping version:

Now updating the ticket body — preserving the original and recording the measured findings:

Free-coding process complete. BUG-20 is at `free_coded` with commit `fec71a6f` recorded.

## What I found

The ticket's stated root cause didn't survive investigation. Measured against the retained gigabytealchemy capture, `foldToL1` **already** carries `borderLeft`/`surfaceGradient`/radius onto card boxes — the folded `l1.json` has 7 boxes with `borderLeft`, 1 with a gradient. `buildCards` has done this since BUG-14.

The real cause hinges on a split in how the capture reads these axes:
- `borderRadiusPx`/`boxShadow`/`border` — the element's **own** computed style
- `surfaceFill`/`surfaceGradient`/`borderLeft` — an **ancestor walk**

In the reference, all 25 `borderLeft` and all 3 `surfaceGradient` elements are text runs, not boxes.

## What I fixed (shape ×4)

A badge is one element that is simultaneously a styled run and a painted pill. L1 forced those into disjoint `text`/`box` leaves, so a badge folded to a bare text leaf and lost its pill (`radius 33554400px` → `0px`). That's an L1 capability gap, closed in L1:

- text axes gain `surfaceFill`/`borderRadiusPx`/`boxShadow`/`border`, envelope-bounded like the box axes
- the fold folds a chip run's own surface onto its text leaf and drops its card row, so the pill isn't duplicated behind it
- the values-diff stops comparing a saturated pill radius as a magnitude (`rounded-full` = 33554400px vs our clamped 100000px paint identical pixels)

One thing worth flagging: my first chip test was "has a radius", which deleted a single-run card's box and accent bar. `bug14-fold-surface-hierarchy` caught it. The correct discriminator is **pill saturation** — radius ≥ half the painted height. I pinned that with its own UAT.

## What I did not fix (borderLeft ×20, surfaceGradient ×3)

These are an attribution artifact, not a paint gap. The L1 tree is flat — 75 siblings, 0 with children. The card box paints the bar correctly, but as a *sibling* of the runs, so re-capture's ancestor walk finds nothing while the reference (runs nested in the card div) reports it on every run. **No pixel differs** — same class as REQ-64's derived-position shadow.

I left it because the honest fix (nesting runs under their card box) forces a matching change to `evaluateLayout`, since a pinned parent is a CSS containing block — get it wrong and the analytic gate silently diverges from the renderer. That's the 3-probe gate, and I wasn't willing to destabilise it without verification room. Both candidate fixes (fold-side nesting vs. geometric enclosure at diff time) are written up in the ticket body with their costs.

Verification: 12 UATs pass, including a cross-check against the real capture. Full suite 687 passed / 2 failed — both pre-existing, confirmed by stash-baselining the same files on a clean tree.

<!-- xgd-chat-end -->