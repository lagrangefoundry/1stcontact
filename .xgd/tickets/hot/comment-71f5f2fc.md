---
uid: comment-71f5f2fc
id: COMMENT-2802
type: comment
title: Comment on bug BUG-83
created_by: xgd
created_at: '2026-09-11T22:30:56.976033+00:00'
updated_at: '2026-09-11T22:55:30.991742+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-ee6c6c39
  kind: chat_transcript
---

<!-- xgd-turn id="ecd5bc24-1108-4f77-81d3-f80cf022aef0-user" -->

<!-- xgd-chat role="user" ts="2026-09-11T22:30:41.326713+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ecd5bc24-1108-4f77-81d3-f80cf022aef0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T22:55:30.629321+00:00" -->
#### Claude
Now let me look at the three offending files.

I have a clear diagnosis. Let me record it on the ticket before coding.

Now implementing. Starting with the origin probes (cause 2):

Now cause 3 — the shared `rulesOf` with a normalised selector:

Good — cwd persisted. Now updating the three suites to use it:

Now cause 5 — `points.js`:

Now cause 4 — the scope restatements:

Let me verify the markdown suite still passes (module-identity check):

Now cause 1 — the shared model double:

Now BUG-63's priming configuration suite:

Now the two change-journal suites:

Now REQ-160 (workers) and REQ-182 — the one whose subject is genuinely *where* the reminder sits:

Now REQ-182 — the suite whose subject is genuinely the cache boundary:

Now the remaining suites — origin probes, CSS, scope guard, gesture:

All seventeen targeted. Running the full suite to confirm nothing else moved:

Full suite green — 3698 tests, zero failures. Committing:

Landed on `xgd-working`. Recording the commits:

Done. BUG-83 is at `free_coded`, commits `7cfb2426` and `06a726f5` on `xgd-working`, version 0.2.170.

## What the investigation found

The baseline turned up **17** failures, not 16 — and cause 1's eleven turned out to be **one** root cause, neither of the two the ticket proposed.

**Cause 1 (11 failures) — upstream moved a channel, not a provider.** Every one is the *reminder tier* missing. It looked like three different missing sentences because the tier has three provider entries (`site.line`, `site.changes`, `corpus.delta`) and each failing assertion happened to name a different one. REQ-160's document titles are `corpus.delta`'s output, so the offline sandbox didn't explain them either.

`@lagrangefoundry/ai`'s `ClaudeAPIBackend` used to fold `reminder` into the `system` field; it now passes it through `turnTail`, which appends it to the **last user message** (their REQ-144, for cache-prefix stability). The reminder still reaches the model — nothing in this repo is broken. The defect was in the evidence: `tests/support/scripted-model-client.ts` documented `system` as *"the assembled priming, reminder included"*, and eleven assertions read it there. `turnTailText` and `sentText` now sit beside `systemText` in that one double.

Worth flagging: several **negative** assertions next to the failures (*"a quiet turn carries no signal"*) had been passing for the wrong reason — reading a field the line could no longer be in. Those moved too.

**Cause 5 — I judged it drift.** AC-1006's subject is address *resolution*, and a stylesheet isn't that — but the overlay restating the renderer's region stamp in its own CSS is a real second reader of the markup contract, silent on rename. `.l1-edit-hot` already selects that exact set, so the stamp only bought specificity; `!important` buys that back explicitly. The guard is untouched.

**Cause 6 — the masking caught happening again.** `test_UAT_FC_REQ-223_internal_seam` forbids `captureLead`/`LeadIntake`/`/api/lead` in `router.ts`; BUG-78 deliberately added `POST /preview/<slug>/draft/api/lead`. The AC's claim — no *unauthenticated* URL reaches the contact write — still holds (same `openStore()` scope as every builder route, site key from the slug through that store, draft-only). I narrowed the guard to that claim rather than to a mention a later intent introduced.

Causes 2, 3 and 4 went as the ticket predicted. The `rulesOf` that read CSS as text existed in three copies; it's now one, in `tests/support/css-rules.ts`, with selector layout normalised away.

## One thing I did not fix

Three suites are order-dependent under the parallel pool — `reconciliation-l1-navigation` (jsdom `hashchange`), `req115-builder-shell` (`wrangler d1 migrations apply` racing on the local DB file), `test_UAT_FC_REQ-150_plain_vite_bootstrap` (`1c assets --json` racing on `dist-assets`). Each failed once across four full runs and passed in isolation every time. All three predate this ticket and share a process-global rather than an assertion. It's the same family of problem and I've recorded it on the ticket, but it's a different defect and I'd rather it got its own ticket than be quietly bundled here — say the word if you'd like me to file it.

<!-- xgd-chat-end -->