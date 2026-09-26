---
uid: comment-c50b627e
id: COMMENT-3957
type: comment
title: Comment on request REQ-331
created_by: xgd
created_at: '2026-09-26T19:00:03.239111+00:00'
updated_at: '2026-09-26T20:04:40.646994+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-20156646
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a94ff69c-61cb-40fe-9e41-6d4f92c89168",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="13e16a4b-0c22-44a2-8862-248dadd1ffc7-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T18:59:11.968794+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="13e16a4b-0c22-44a2-8862-248dadd1ffc7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T19:32:14.198899+00:00" -->
#### Claude
Ticket read in full. Let me start the protocol.

Now the renderer's text-run emitter:

Now let me write the schema changes.

Now run-level `textDecoration` and `link`:

Now update `validate.ts` for shadow layers and run-level links:

Now the `stacked` doc comment — the fold can now author it:

Now the renderer: multi-layer shadow + run-level link/decoration.

Now `textRunsHtml` — run-level decoration and link:

Now `foldTextRun` must carry the decoration and the link so the rejoin is lossless:

Now add the stack detection:

Now issues 4 & 5 — alpha-preserving colour and multi-layer shadows:

Now `foldShadow` → all layers, with alpha:

Now make the fold read that single definition site:

Now move `FILTER_FUNCTIONS` out of the fold to its single definition site:

Now the actual comparison — replacing the presence boolean:

Now issue 9 (no-op filter) and issue 7 (glyph-box position):

Good — `diffManifests` is the entry point. Let me write the two UAT files.

Now the instrument UATs:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="a55e0d04-0f8b-4cbf-9ba1-089e719955d0-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T19:46:33.361103+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="a55e0d04-0f8b-4cbf-9ba1-089e719955d0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T20:04:40.326844+00:00" -->
#### Claude
I'll start by reading the ticket and checking the current state of the work from the prior session.

Branch already cut. Let me check its state and read the full ticket body.

Substantial uncommitted work from the prior session. Let me read the full ticket body.

Ticket body is fully updated with the implementation record. The prior session's work is uncommitted in the branch worktree. Let me verify it.

All three packages typecheck clean. Now the UAT tests.

19 UATs pass. Now let me establish the regression scope.

Let me run a substantial regression scope over the L1/fold/values-diff/gate areas.

The filter list is too long for vitest. Let me chunk it.

Two regressions surfaced. Let me see both in full.

Both failures are the intended consequence of issue 4 — the inputs carry alpha (`rgba(10,20,30,0.5)`, `rgba(0,0,0,0.4)`) and the old assertions pin the alpha-dropped form REQ-331 exists to fix. The opaque case at line 59 still passes, confirming the change is narrow. Updating the two superseded assertions:

All 67 pass. Let me widen to the renderer, email-render, and validate surfaces the change also touches.

Two more failures. Let me see them.

Zero deltas — the shadow difference isn't reported under `boxShadow` either. That's a real regression against issue 6's own promise ("presence stays as the degenerate case"). Let me find it.

The guard requires *both* sides to carry the field, so an element that simply paints no shadow (key absent) skips comparison entirely — losing BUG-20's rail. `boxShadow` is not a new axis (it predates this change and the old code read it unguarded), so the vintage concern doesn't apply. Let me check the helper, then fix the guard.

`paintedShadowLayers` already accepts `undefined` and yields `[]`. Fixing the guard so an absent shadow compares as "no layers" — which is what the presence-as-degenerate-case promise requires:

Now BUG-20's assertion filters on `property === 'shape'`, which REQ-331 deliberately renamed. Updating it to the property the shadow moved to, preserving its intent:

Now the second failure, in chunk b-ad.

Explicit intent conflict: REQ-211 pinned "no link inside a run", and REQ-331 deliberately supersedes it — the lossless rejoin of `Artist • <a>Musician</a> • Creator` requires run-level links, or the rejoin trades a brittle layout for a dead link. Let me verify the security half still holds before inverting the assertion.

The allowlist genuinely covers run links. Let me re-run the entire regression scope to confirm green.

All 141 files / 1282 tests green. Let me re-typecheck and run the repo-hygiene/static guardrail suites.

All green. Let me review the two UAT files to confirm they're real evidence against real entry points.

One gap: I changed the `boxShadow` guard, and the degenerate presence case ("presence stays as the degenerate case") has no REQ-331 UAT of its own. Let me add one.

20 REQ-331 UATs green. Now I need to record in the ticket the supersessions and the guard behaviour, so reconciliation isn't left to discover them.

Full scope was re-run green after all fixes. Now version bump and commit.

`.xgd/tmp` is ignored, and the tree is exactly my 18 files. Committing with explicit paths:

Now the merge lock and merge-back into `xgd-working`.

Merged clean. Now the `free_coded` gate.

Status `free_coded`, both SHAs recorded (the fix plus the auto-bump to 0.2.378). Let me set story points and clean up the branch.

Final verification on the merged `xgd-working` tree:

Good — that ran against the merged main checkout, and there's a genuine failure. Let me see it.

That test uses a real bundle present only in the main checkout (`storage/` is untracked). Let me baseline it against the pre-merge state to see if my change caused it.

Pre-existing — it fails identically on the pre-merge tree. Restoring the merged sources:

Tree is back to its exact session-start state. The `working-merge.lock` belongs to REQ-329 (another session), not mine — leaving it. Let me record two things that cost me cycles.

The hook flags MEMORY.md needs compacting. Let me handle that.

Most long hooks have a `; <second clause>` structure. Trimming to the first clause keeps the recall signal and the detail already lives in the topic files.

16231 bytes — under the 17.1KB target with all 112 entries kept. Let me read it and write it into place.

REQ-331 is complete and at `free_coded`.

## What landed

All nine issues from the faelan.com reproduction round, in the dependency order the ticket specified. The prior session had written the code; this session verified it, found and fixed a real defect in it, resolved four regressions, and landed it.

**Engine (issues 1–5)** — the rejoin predicate widened from four axes to nine so a sentence whose only variation is a link rejoins; L1 grew run-level `textDecoration` and `link` so that rejoin is lossless; run height comes from the `inlineBox`; the fold emits `stacked: true` on overlapping media; `foldMask` reads gradient mask edges; shadow colour keeps its alpha and `boxShadow` widened to a 2–4 layer list.

**Instrument (issues 6–9)** — a shared `treatments` module both the fold and the comparator read, so the painted-effect rule has one definition site; shadow compared as a value, glyph-box position compared, `arrangement` only where the element's own geometry agrees, and a filter judged on whether it paints.

## One defect found and fixed during verification

The new `boxShadow` comparison was guarded on *both* sides carrying the field, copied by analogy from `border`. But an element that paints no shadow omits the key — so the comparison went silent exactly where a shadow was **lost entirely**, which is the loudest case the axis has and the one thing the old presence boolean got right. BUG-20's rail caught it. An absent shadow now reads as no layers, and the comparison fires when either side carries it. A transparent layer still normalises away first, so the wider guard adds no false positive.

## Four supersessions, all recorded on the ticket

Two REQ-92 assertions pinned the alpha-dropped shadow colour that issue 4 exists to fix — updated. BUG-20's shadow rail moved from `shape` to `boxShadow`; same behaviour, and it now also asserts `shape` is silent on that pair. REQ-211's "a link inside a run is invalid" was **inverted deliberately** — that's the loud one, since it reverses a prior decision rather than refining a value. Its security half is intact and now pinned by a new assertion: a `javascript:` href on a run is still rejected.

I also made explicit something the ticket left implicit — alpha preservation reaches `textShadow` too, since `foldShadow` serves both. Only issue 5's layer list is box-only.

## Verification

Typecheck clean on all three changed packages. 20 REQ-331 UATs pass. Regression scope of 147 files (1300+ tests) green.

**One caveat, stated plainly**: the end-to-end numbers the ticket predicts — "the ranked total falls from 141276.96 to at most a few hundred" — are **not measured**. `1c gate` drives Chromium, which this sandbox denies at Mach port registration, and the reference bundles are gitignored. Every mechanism those numbers depend on is pinned by a UAT on a synthetic fixture cut to the same captured values, but the arithmetic itself remains the round's prediction. That's noted in the ticket's verification section.

Separately: `test_UAT_FC_BUG-20_real_gigabytealchemy_badges_fold_as_pills` fails on the merged tree — I baselined it against the pre-merge sources and it fails identically there. Pre-existing, unrelated, left alone.

Ticket is at `free_coded` with both SHAs (fix + auto-bump to 0.2.378), 13 story points, branch cleaned. Promotion to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->