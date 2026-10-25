---
uid: comment-21a54d2d
id: COMMENT-3007
type: comment
title: Comment on request REQ-249
created_by: xgd
created_at: '2026-09-16T00:11:43.203561+00:00'
updated_at: '2026-09-16T00:31:53.020341+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-692325d3
  kind: chat_transcript
---

<!-- xgd-turn id="92a0b7ef-9bf5-4902-9dbe-5e0409702e6f-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T00:11:26.420210+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="92a0b7ef-9bf5-4902-9dbe-5e0409702e6f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T00:26:21.485206+00:00" -->
#### Claude
The ticket is fully specified. One design point needs deciding before I code, and I'll make the call rather than block on it:

**The check route can't currently tell the pane *which* refusal it is.** `GET /api/hostname/check` answers `{host, available, refusal}` — a sentence, not a class. The ticket demands four distinct lines (`available` / `taken` / `reserved` / `invalid`) and forbids re-deriving the rules in the client. So the classification has to come from the server: I'll add an additive `reason: 'taken' | 'reserved' | 'invalid' | null` to `checkHostname`. The decision stays REQ-238's; only the wording is the pane's.

Let me get started.

Now let me write the server-side addition.

Now the client API calls:

Now wire it into the settings pane:

Now the CSS:

Now the UAT suite:

Now the workers-side UAT for the refusal classification:

Now the browser-side UAT suite:

Now the regression scope — the surrounding suites and a typecheck:

Clean. Now update the ticket body with the consequences I added beyond the written spec:

Now version bump and commit:

Now merge back into `xgd-working`:

Done. REQ-249 is `free_coded` at `76c493c1`, merged into `xgd-working`, branch cleaned.

## What landed

**`builder/hostname.js`** — the section, its own module rather than more of `settings.js`. It draws `Your free web address` (never *domain*), a label box with `.1stc.site` immediately beside it so the whole host is always on screen, and a check fired by the button *and* by Return.

**Four answers, four lines** — available (offering `Lock it in`), taken, reserved (*that word is ours* — deliberately not "taken", so the customer changes the word rather than decorating it), and invalid (the route's own sentence, verbatim).

**The confirm dialog** wears `createModalShell`. It promises the *business* its address, its confirming button reads `Lock in alice.1stc.site` rather than OK, and Cancel takes focus so a Return aimed at the check box can't land on the irreversible act. A 409 after the dialog closes it and puts one sentence beside the field with the candidate still in the box.

**A business that already holds one gets no box** — read from the addresses the pane already asked for, not a second question.

## The one call I made beyond the spec

`GET /api/hostname/check` now carries `reason: 'taken' | 'reserved' | 'invalid'` (null when free). The four lines can't be told apart from a refusal's prose without the client keeping its own copy of the reserved list — your falsifier. `checkHostname` already made that distinction internally; it just wasn't saying so. That required a one-line update to REQ-238's exact-shape assertion (`reason: null` added), and I stubbed `loadAddresses` in REQ-239's fixture since the pane now makes a call it didn't before.

## Evidence

- `test_UAT_FC_REQ-249_free_web_address.test.ts` — 24 cases driving the shipped section in a real document over the real dialog shell; two mount the whole builder so "it's on the Settings pane" is the assembled product. Includes a scan proving the client carries no reserved list, no syntax rule, no length ceiling.
- `test_UAT_FC_REQ-249_check_names_its_refusal.workers.test.ts` — 4 cases against real D1, over every reserved label the product ships.

All adjacent builder suites pass (36 files, 284 tests). Two suites initially failed in the fresh worktree because `dist-assets` wasn't built — they pass after `bin/1c assets`, and are unrelated to this change.

<!-- xgd-turn id="14f19409-062c-4f97-8850-73c1fe4ea0ce-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T00:30:55.099367+00:00" -->
#### You
I restarted the server and refreshed the page - I do not see any of this work on the Settings tab?

<!-- xgd-turn id="14f19409-062c-4f97-8850-73c1fe4ea0ce-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T00:31:52.036097+00:00" -->
#### Claude
Found it — the builder is served from `apps/control-app/dist-assets/`, which is a build artifact. Yours is from Sep 14, so it has no `hostname.js` at all. The source is correct; the assets just need rebuilding.

Nothing was wrong with the code — the build step was missing.

The builder's browser source isn't served from `src/`. `tools/generate/src/cli/builder.ts:184` is explicit that the dev server reads `apps/control-app/dist-assets/` off disk and *"nothing is rebuilt"* there; it's `1c assets` that copies `src/builder/**` into it verbatim. Your `dist-assets/builder/` was dated Sep 14 and had no `hostname.js` in it at all, so restarting the server and refreshing was serving you the pre-REQ-249 builder.

I've run `./bin/1c assets`. Now on disk:

- `dist-assets/builder/hostname.js` — present, 13KB
- `dist-assets/builder/settings.js` — references `createHostnameSection`
- `dist-assets/builder/builder.css` — 12 `builder-hostname` rules

**Refresh the page** (hard-refresh — `Cmd-Shift-R` — since the browser will have the old `settings.js` cached). No server restart needed: the assets fetcher reads the directory per request.

I couldn't confirm it over HTTP myself — your server on :8788 answers 401 to an unauthenticated request, which is the Access gate rather than a missing file.

Worth knowing for next time: `bin/build` runs `1c assets` as part of its sequence, so a full build would have caught this. A source-only change plus a server restart won't.

<!-- xgd-chat-end -->