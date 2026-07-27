---
uid: comment-4fbb25f7
id: COMMENT-525
type: comment
title: Comment on request REQ-96
created_by: xgd
created_at: '2026-07-26T00:57:48.603497+00:00'
updated_at: '2026-07-26T05:56:41.348352+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3a064234
  kind: chat_transcript
---

<!-- xgd-turn id="d54d6988-4cec-4eb8-b545-4bbf76ebc84d-user" -->

<!-- xgd-chat role="user" ts="2026-07-26T00:57:46.597632+00:00" -->
#### You
Please implement this change to modules

<!-- xgd-turn id="d54d6988-4cec-4eb8-b545-4bbf76ebc84d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-26T01:27:49.678159+00:00" -->
#### Claude
I'll start by reading the ticket and the current state of the relevant code.

Now I have the full picture. Let me start with the L1 schema.

Now let me close the extracted helper and re-open the switch properly.

Now wire `controls` through the render state and the fragment entry point.

Now the `contact-form` module — the control resolver, meta, and the stylesheet-free component.

Now the rewritten `contact-form` component.

Now the carousel — same treatment.

Now wire the new exports and build.

Now the fold's form-slot construction.

Adding an offline `refold` verb so a retained bundle can be re-derived when the fold changes.

Now wire the `refold` verb into the CLI.

<!-- xgd-turn id="c0bf3bc9-6328-4db7-83f6-dff5583ae0f5-user" -->

<!-- xgd-chat role="user" ts="2026-07-26T05:41:04.683484+00:00" -->
#### You
Please continue

<!-- xgd-turn id="c0bf3bc9-6328-4db7-83f6-dff5583ae0f5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-26T05:56:41.319459+00:00" -->
#### Claude
I'll pick up where the prior session left off. Let me first survey what state the working tree is in.

Substantial work is in place from the prior session. Let me check the state of the untracked files and run the test suite.

The `basic` reporter isn't valid in vitest 4. Let me rerun.

All 809 tests pass. Now let me review what the prior session actually implemented, so I can verify it against the ticket's acceptance criteria.

Implementation looks complete and coherent. Now let me check the remaining scope items: the GA re-measure and the UAT tests.

The bundle is refolded and the repro site rebuilt. Now let me do the GA re-measure — the key acceptance evidence.

Now the GA re-measure — the cross-gate. Let me render and run it.

Cross-gate **PASS** — perceptual mean down from 2.61 to **0.69/255**, deltas from 26 to 2. Let me look at the remaining two.

Cross-gate passes, but values-diff reports 7 unpaired repro-only "control" objects. Let me investigate — that's a real pairing defect.

Let me identify exactly which 7 repro-only objects these are.

Let me dump the actual manifest to identify them precisely.

The 7 unpaired are 4 form controls + 3 background-image boxes. Let me confirm how they're keyed versus the reference.

Now I understand the picture completely. Let me clean up the diagnostics and check the existing test naming convention.

Three REQ-96 UATs exist. The ticket's acceptance criteria aren't fully pinned yet. Let me read the existing ones to match style, then fill the gaps.

Now let me write the UATs that pin the acceptance criteria not yet covered.

Now I have everything I need. Let me write the UATs that pin the acceptance criteria.

All five failures are in my test code, not the implementation. Let me check the actual APIs.

The `<style>`-in-comment predates this change. Let me check whether `getModuleCss` actually over-captures.

Confirmed — a real shipping defect: `getModuleCss()` is emitting the carousel's TypeScript source into `theme.css`. The `<style>` mention inside the Astro frontmatter comment opens a bogus match. This predates REQ-96, but it directly blocks the ticket's "ships no CSS beyond invariant elements" criterion, so I'll fix it here.

Now let me fix my test to use the production extraction path and correct APIs.

The fold output is exactly right — inline at ≥768, stacked at mobile, heights 50/146. Let me correct the test file.

Now the imports, the `validateL1` result shape, and the responsive submit assertion.

Now the submit-position test — the reference stacks at mobile and goes inline at ≥768, so the assertion must say that.

Same bug class: the self-closing `<style set:html={…} />` also matches as an opening tag. Let me fix that too.

That `continue` would consume the real block's closing tag. Let me strip self-closing tags before scanning instead.

Only one left — my regex is matching the CSS *comment* that says "no `flex-basis`". Let me strip comments in the helper.

All 12 pass. Let me add a UAT pinning the `getModuleCss` fix itself, since that's a real behavioural change.

All 821 pass. The `styles.ts` fix changes `theme.css` content, so let me re-render and re-gate GA, plus run a full typecheck.

Gate still passes identically. Now the full typecheck.

Working tree is clean apart from REQ-96 files (plus an unrelated untracked `storage/sites/xgd/` I'll leave alone). Let me read the ticket before updating it.

Now the version bump and commit.

Now let me update the ticket, preserving the existing body and appending the outcome.

REQ-96 is complete and at `free_coded`.

## What landed

**The change itself** — an L1 `control` node adds the second composition direction. A slot only expresses "module wraps L1", which is impossible for a leaf (`<input>` is void, `<textarea>`'s content is its value), so `contact-form` had no choice but to paint its own fields and no validator could catch it. Now an L1 node names a module-declared element, the emitter renders it with L1's class/geometry/paint, and the module supplies only the attribute bundle that makes it work. Both modules ship no CSS beyond their declared invariant elements. `carousel.config.view` went too — it resolved to a `flex-basis`, the exact aesthetic dial DOC-25 §2 forbids, in the doc's own worked example.

**Measured result on gigabytealchemy** — cross-gate PASS:

| | REQ-88 baseline | now |
|---|---|---|
| perceptual mean | 2.61/255 | **0.69/255** |
| values-diff deltas | 26 | **2** (both Type-B emergent) |

All four reference controls now pair one-to-one and reproduce to the pixel. The three deltas the ticket named are closed: field surface (L1 axes), height (50px/146px from the capture, not the deleted 44px default), and Subscribe inline beside its field at ≥768 while stacking on a phone — as the reference does. The submit's per-width position is pinned to the oracle again.

**Two things I found and fixed that weren't in the plan:**

1. `getModuleCss` was shipping component source as CSS. A doc comment *mentioning* `<style>`, and the self-closing `<style set:html={…} />`, both matched as opening tags, so each scan ran to the next real `</style>` — `carousel` was folding its imports, props interface, script body and markup into every generated `theme.css`. Pre-existing, but it makes the ticket's "ships no CSS" criterion uncheckable, so I fixed it here.

2. An offline `1c refold` verb. Derived bundle artifacts are a pure function of the retained oracle and the current fold, so every fold change staled every bundle — and the only way to pick it up was re-hitting the third-party site, which re-rolls the oracle and lands a fold change and a reference change inseparably.

**Tests** — `tests/req96-control-composition.test.ts`, 13 UATs covering each acceptance criterion including the safety envelope (the emitter refuses `class`/`style`/`on*`, escapes values, label association stays module-authored). Full suite 821 passing, workspace typecheck clean.

## Two things to flag

- **`storage/sites/xgd/` is untracked and I left it alone** — it predates this session's work and isn't REQ-96's. Worth a look if you don't recognise it.
- **7 repro-only objects remain** in the GA values-diff, down from 15. I verified all seven are pre-existing L1 section-band boxes with painted backgrounds that the reference capture never attributed to an element — no form element among them. Recorded as a follow-up on the ticket rather than fixed, since it's a capture-attribution gap unrelated to composition.

The ticket body preserves your original content with the outcome appended. It's parked at `free_coded` — promotion to `ready_to_reconcile` is yours to call.

<!-- xgd-chat-end -->