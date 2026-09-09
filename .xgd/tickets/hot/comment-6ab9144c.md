---
uid: comment-6ab9144c
id: COMMENT-2341
type: comment
title: Comment on request REQ-209
created_by: xgd
created_at: '2026-09-09T22:31:00.782948+00:00'
updated_at: '2026-09-09T23:48:46.265007+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-534a908f
  kind: chat_transcript
---

<!-- xgd-turn id="31176c3d-0213-4434-8ef4-03d6e110b6cd-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T22:30:24.885372+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="31176c3d-0213-4434-8ef4-03d6e110b6cd-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-09T23:01:42.743561+00:00" -->
#### Claude
Let me check the exploration agent's progress and read the picture-resolution plumbing.

Now the anchor vocabulary module.

Now the handlers in `toolbox-core.ts`.

Now wire the operations into `toolbox-core.ts`.

Now `host-core.ts` — build the measurer from the fidelity deps.

<!-- xgd-turn id="64402778-359b-41a8-bf4f-02fb4fb39781-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T23:06:40.769929+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="64402778-359b-41a8-bf4f-02fb4fb39781-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-09T23:36:58.789502+00:00" -->
#### Claude
Now the toolbox helpers and operations.

Now the surface declaration.

Now the operations, group, and `write_image` description.

<!-- xgd-turn id="94254c77-f8dc-495e-b913-8234cc75f166-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T23:37:38.794094+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="94254c77-f8dc-495e-b913-8234cc75f166-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-09T23:48:45.694229+00:00" -->
#### Claude
Fixing the index-misalignment latent bug in the ink-union pass (and the dead `byPath` map):

The browser suite passes vacuously where Chromium cannot launch. Making those skips visible rather than green:

Now the version bump and commit:

Now lock, merge back into `xgd-working`:

REQ-209 is free-coded and landed on `xgd-working` as `1e0e30bd07`, version `0.2.141`.

## What shipped

**Authoring guidance** (no code) — `write_image`'s description now carries the three rules: a run of styled text is one `<text>` with `<tspan>` children, a mark names a real font (not `system-ui`/`sans-serif`), and a node you mean to position precisely gets an `id`.

**The anchor vocabulary** — `packages/site-schema/src/anchors.ts`, in the schema rather than the tool because `measure_page` will import the same names. Four families (box / ink / font / advance), axis inferred from the anchor so `relate(a.top, b.left)` is a refusal, and the arithmetic turning four measured primitives into fifteen named lines.

**The measuring script** — `capture/measure-svg.ts`. The drawing goes into a shadow root inside the site's own draft page, so the fonts are the ones a visitor gets and the page's stylesheets can't restyle it. Ink from canvas text metrics (Chromium's `getBBox()` on text returns the font's box, which is already the box family), font proportions measured rather than parsed, transforms resolved to root space.

**`measure_drawing`, `relate`, `solve`** — a new read-effect group on the L1 surface, taking the same browser the fidelity surface takes rather than asking for one twice. `assert` on `write_image` renders only when present, reports, and never blocks. A deployment with no browser keeps all four and refuses with a sentence naming why.

## Two changes I made to what the prior session left

- **A latent index-misalignment bug in the ink-union pass.** It walked `visited[i]` against `nodes[i]`, which drift apart as soon as one node has no measurable box and is passed over — so a composed run could take another node's children as its own. The node now carries its own `path` (stripped before the model sees it, alongside `attrs`/`scale`/`skewed`), and a dead `byPath` map is gone.
- **The browser suite passed vacuously.** Its ten browser-dependent cases returned early when no browser launched, reporting ten green ticks for measurements nobody took. They now skip visibly with the reason.

## Verification, honestly

- `test_UAT_FC_REQ-209_measure_a_drawing.test.ts` — 24 passed. The vocabulary, the arithmetic and the surface, against DOC-52 §5.3's own wordmark numbers.
- `test_UAT_FC_REQ-209_measure_in_a_browser.test.ts` — **1 passed, 10 skipped.** Chromium cannot launch in this sandbox: `bootstrap_check_in … Permission denied (1100)` on its mach port rendezvous, with `channel: 'chrome'` failing separately on a profile singleton. Installing browsers doesn't fix it. **So the measuring script itself — glyph extents, ink-vs-advance measured, cap-height ratios, transform resolution — is unverified in this session.** It needs a run on a machine that can start a browser.
- Regression scope: surface validation (14), the L1/toolbox/fidelity/workerd suites (193 + 16), capture, site-schema, tree guards. Three failures appear, all identical on `xgd-working` before this change: `AC1266`, `AC1058`, `REQ_131` change-journal wording, and `AC960` scope-rebrand (which lists three files, none of them ours).

The ticket body's "How it landed" and test plan were updated to cover both changes above. The wordmark in the 1st Contact draft still names `system-ui` — that's site data, not code, and is outside this commit.

<!-- xgd-chat-end -->