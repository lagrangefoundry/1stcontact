---
uid: comment-76256ec4
id: COMMENT-2183
type: comment
title: Comment on request REQ-169
created_by: xgd
created_at: '2026-09-03T19:54:42.282108+00:00'
updated_at: '2026-09-03T21:59:43.689804+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-da60b61b
  kind: chat_transcript
---

<!-- xgd-turn id="28823253-a583-43f6-90c5-402ad82aaba3-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T19:53:43.854650+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="c74fcdf0-5605-492c-ad01-f4832a96d774-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T20:17:22.893993+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="961305b2-c176-4871-9343-dd67f5b904fd-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T20:20:59.331319+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b7ea9d58-1823-46b9-b426-eacb2d0dc4b7-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T20:30:58.469475+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d2227875-b18c-46dc-a2e5-a98a7ee8a033-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T21:38:12.252823+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d2227875-b18c-46dc-a2e5-a98a7ee8a033-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T21:59:43.494826+00:00" -->
#### Claude
Now wire it into `index.ts`:

Now add a UAT covering the navigation signal, then re-run:

Now update the ticket body, then merge back:

REQ-169 is landed on `xgd-working` at `free_coded`.

## What was built

**`apps/control-app/src/terms.ts`** — the version constant, the text constant, the interstitial, and the gate. Called from `index.ts` between `admit` and `resolveScope`: the fourth identity check, in the same place and for the same reason as the other three — before a store handle exists and before a path is examined.

Decisions I made that the ticket left open:

- **The interstitial is served at the URL that was requested**, and acceptance completes by reloading it. "Continues to where they were going" then needs no return-path bookkeeping and no redirect chain to get wrong.
- **Navigations get the page; everything else gets 403.** A navigation is `Sec-Fetch-Dest: document`, falling back to an `Accept` naming `text/html`. A wildcard `Accept` is deliberately not enough — that's what a module script sends, and answering one with HTML breaks the page worse than refusing it. Unrecognised → refused.
- **The page references nothing** — no stylesheet link, no module script, no import map. It can't: the session it's served to is being refused every asset.
- **`POST /api/terms/accept` requires `application/json`** (415 otherwise). A cross-site form can't set that content type; acceptance of a legal agreement shouldn't be forgeable.
- **`GET /terms` stays readable after acceptance**, showing the date accepted in place of the button.
- `ACCESS_DEV_OPEN` is unaffected — the check sits inside the same block, gated on the same predicate, not a second one that agrees today.

**14 UATs** in `tests/test_UAT_FC_REQ-169_terms.workers.test.ts`, driving the Worker's own `fetch` in workerd against real D1 and real RS256 tokens, with the assets binding returning a recognisable body so a fall-through would be visible rather than inferred.

## Two existing suites needed repair

Admission is no longer the last check, so anything that mints a token and expects 200 was asserting something no longer true:

- `seedIdentity` (`tests/support/local-d1.ts`) now seeds an **accepted** identity, importing `TERMS_VERSION` rather than restating it.
- REQ-167's "reaches the builder" case, and REQ-179's `/api/businesses` suite (which landed mid-cycle), accept first.

## Verification

Full `node` + `workers` projects. Remaining failures are the pre-existing missing-KB-index set (REQ-123/158/159/160/161/163/165, `bug32`, `reconciliation-system-knowledge-base`) — confirmed identical on an unmodified checkout — plus one order-dependent flake in `req115-builder-shell` that also fails on the baseline and passes in isolation.

Commits `f205968b19`, `fe95f12f06`; version `0.2.62`. The ticket sits at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->