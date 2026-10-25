---
uid: comment-6bc952d2
id: COMMENT-2608
type: comment
title: Comment on request REQ-216
created_by: xgd
created_at: '2026-09-10T21:25:03.226703+00:00'
updated_at: '2026-09-10T21:41:50.292541+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-a2f3c272
  kind: chat_transcript
---

<!-- xgd-turn id="41484c04-4e78-41cf-82bd-80af35519bb3-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T21:24:37.237146+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="41484c04-4e78-41cf-82bd-80af35519bb3-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T21:41:50.017063+00:00" -->
#### Claude
Now I'll write the implementation. Starting with the interaction module:

Now `picture.ts` — the `after` field, the draft-only rule, and the channel caption:

Now the surface declaration:

Now the UAT test file:

Done. REQ-216 is at `free_coded`, commit `09f9faf92f`, merged into `xgd-working`, version `0.2.155`.

## What shipped

**`after` on a picture** — an ordered list of short phrases saying what to do to the page before the shutter opens:

```
{ kind: 'draft', after: ['click "Sign in"'] }
{ kind: 'draft', after: ['fill "Email" with "a@b.test"', 'click "Send"'] }
```

Two forms and no third — the same argument REQ-212 made about its own two disclosure verbs: a general *do X to Y* vocabulary ends as a scripting language, and two forms bound it absolutely. Controls are named the way an operator names them and matched against the page's own accessible names (label, `aria-label`, visible words, placeholder). No selector is reachable from the surface, and the declaration's absences say so.

**The picture stays evidence.** Six distinct refusals, each naming what failed and producing *no picture at all*: no such control (lists what is there), several such controls (says how many), a control that's there but not visible yet, a click that changed nothing, a field that didn't take the value, a page that never settled. "Nothing happened" is a before/after fingerprint of markup, scroll and focus — taken *after* focusing the element, since focusing is how a click arrives rather than something it did.

**Draft only**, each other kind refusing for its own stated reason — and refused before a browser is leased.

**The cheaper half** also shipped: an `edit` picture now carries a caption saying that channel ships no behaviour, on the text block the model reads *and* on a `compare` result's numbers, since a measurement against an inert channel is where a wrong conclusion gets drawn confidently.

## Decisions I made

- **Phrases, not objects.** The declaration format can only project `array of object` as opaque, so the model would get no key schema. A string mini-grammar matches the existing `relation`/`anchor_ref` precedent and validates honestly.
- **`revision` and `url` refuse too**, though the ticket only named `edit`. A click on the published site or a stranger's page really submits a form and really sends a request; "show me what this looks like" shouldn't be able to cause that.
- **Two technical consequences** I added and wrote into the ticket body: a driven shot loads at the width it's driven at (a mobile-only hamburger can't be clicked on a 1280 layout), and `check_fidelity`'s value gates are driven the same way, so the manifest and the picture are of one state.
- **A menu is set by the words a person reads on it**, falling back to the markup value.

## Testing

`tests/test_UAT_FC_REQ-216_drive_the_page.test.ts` — 34 UATs. The page is the sign-in shape the ticket describes, through the shipped L1 renderer with the vetted modal script; the interaction script is the shipped one, run in page scope. Only the browser is doubled, with jsdom. The load-bearing observation is which panels stood open *at the moment `screenshot()` was called* — a picture of the closed page reported as a success is exactly the failure this prevents, and no assertion about a return value would catch it.

Regression: 93 passing across REQ-216/157/212, plus capture, fidelity primitives, ladder screenshots, page scripts, shot, the L1 surface, and the workerd-side fidelity suites. One pre-existing failure in `reconciliation-assistant-conversation.test.ts` (`test_UAT_AC1058`) — confirmed failing on the base before my changes, untouched.

<!-- xgd-chat-end -->