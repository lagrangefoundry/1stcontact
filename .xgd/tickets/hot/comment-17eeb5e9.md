---
uid: comment-17eeb5e9
id: COMMENT-2317
type: comment
title: Comment on request REQ-207
created_by: xgd
created_at: '2026-09-08T22:37:17.564147+00:00'
updated_at: '2026-09-08T22:47:02.537136+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3731fe6b
  kind: chat_transcript
---

<!-- xgd-turn id="90dd4d29-d975-4237-9127-4bc9029c52dc-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T22:36:51.518143+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="90dd4d29-d975-4237-9127-4bc9029c52dc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T22:47:01.977749+00:00" -->
#### Claude
Now let me look at `ai.ts`'s `sessionTextDescriber` — the shape the image branch should mirror.

Good — `imageBlock` is reachable. Now let me find the `1c assets` generator that writes the `.d.ts`.

Now let me look at the existing tests for `sessionTextDescriber` — that's the shape I should mirror for the image UATs.

Now let me set up the free-coding branch.

Now `describe.ts` — remove the SDK path, export the image prompt.

Now replace `VISION_MODEL` + `anthropicImageDescriber` + `base64` with an exported prompt constant.

Now `ai.ts` — factor the shared session machinery and add `sessionImageDescriber`.

Now the router wiring.

Now generate assets and typecheck.

Typecheck clean. Now the UATs.

The port's manager redacts before the backend normalises, so `data` must already be base64. I'll use the port's own encoder rather than reintroducing a local one.

All 8 pass. Now the regression scope — the suites that touch the describer seam and any static guards.

Clean. Now run the wider regression scope.

Now bump the version and commit.

Now update the ticket body to record what actually landed, before committing.

Now commit on the branch.

Merged cleanly. Now record the SHA and move to `free_coded`.

Landed and merged. **REQ-207 is at `free_coded`**, commit `597939256b`, version `0.2.139`.

## What I built — and what I deliberately did not

The ticket's own Sequencing section splits this into three steps. **Step 1 (the describer) is done. Steps 2 and 3 (search) are still blocked, and I confirmed the block rather than assuming it**: the installed `@lagrangefoundry/ai` still has `export const CALL_TYPES = new Set(['inproc'])` — no provider call type, no `http` one either. There is nothing to configure a search onto, so writing one would have meant building the mechanism the ticket explicitly says belongs upstream.

**The describer half:** `describe.ts` no longer reaches the Messages API. `anthropicImageDescriber`, `VISION_MODEL`, `import Anthropic` and the chunked `base64` helper that existed only to feed it are deleted; the vision prompt survives as an exported `IMAGE_DIGEST_SYSTEM` beside its document peer. `ai.ts` gains `sessionImageDescriber` — the peer REQ-173 built for text.

Three decisions I made that go slightly past the letter of the ticket, all recorded in the body:

- **Both describers are now one function.** Their difference is a system prompt and one turn's content; the session lifecycle, null archive, empty toolbox and memory junction were the same decision made twice. Consolidating the image path onto the text path while leaving two copies of the path would have missed the point. `DESCRIBER_ROLE`/`DESCRIBER_BACKEND` collapse into one `TEXT_DESCRIBER` — always the same string.
- **Each describer registers under its own backend name.** `registerBackend` is a process-wide overwrite and the router builds both per request, so a shared name meant the second silently owning the first's backend — a document answered through the image describer's instruction, undetectable downstream. There's a UAT on it.
- **The image is base64-encoded before `imageBlock`.** The session manager writes the durable `turn_start` record — and measures the image for it — *before* the backend normalises content, so raw bytes that far up the path crash on `data.endsWith`. I used the port's own `bytesToBase64` rather than reinstating a local encoder.

I also dropped `@anthropic-ai/sdk` from `apps/control-app`'s dependencies — nothing imports it now; it stays reachable transitively through the AI component, which is the only thing that should reach it. `pnpm install` verified clean.

`DescribeImage`'s shape didn't change, so `material.ts`, `capture-material.ts` and every existing UAT are untouched.

**Evidence:** 8 new UATs asserting the turn the host assembles (a test that only checked "a description comes back" would pass against the SDK call this removes). Regression scope — 9 suites / 85 tests around the describer and ingestion, plus 4 build/boundary suites / 34 tests, plus `tsc --noEmit`: all green.

## One question

Step 2 needs a **lagrange-framework ticket** — a provider call type, a per-adapter capability declaration for backend-executed tools, and the passthrough in the tool-list projection. I haven't filed it, since that's a new ticket in another repo. Want me to?

<!-- xgd-chat-end -->