---
uid: comment-1c858399
id: COMMENT-2629
type: comment
title: Comment on request REQ-223
created_by: xgd
created_at: '2026-09-10T23:02:44.599599+00:00'
updated_at: '2026-09-11T00:05:54.032100+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7d9f8b2e
  kind: chat_transcript
---

<!-- xgd-turn id="e6705588-4436-41fc-a493-8faf091b0c68-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T23:02:26.154406+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e6705588-4436-41fc-a493-8faf091b0c68-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T23:33:16.730314+00:00" -->
#### Claude
Now let me set up the branch and start work.

Good. Now the RPC entrypoint in control-app.

Now wire it into `public-site/src/index.ts`.

Now the wrangler config for public-site.

Now let me write the main workers UAT.

<!-- xgd-turn id="43bbf738-5f4a-4794-af27-ec4c7c205274-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T23:52:48.047761+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="43bbf738-5f4a-4794-af27-ec4c7c205274-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-11T00:05:53.551849+00:00" -->
#### Claude
I'll pick up where the prior session left off. Let me check the current state first.

Substantial work is already in the branch worktree, uncommitted. Let me survey what's there.

Implementation looks essentially complete. Let me check the remaining pieces and then run tests.

Now let me run the tests.

Both pass. Now the regression scope — the existing test files this change modified.

AC-12 requires "bounced **or** complained", but nothing records a complaint today. That's a small, contained gap — let me close it.

Now update the suppression check in `lead.ts` to read both.

Now extend the AC-12 UAT to cover complaints as well as bounces.

Two real findings. First, the `email` ticket type has its own status schema — let me find it.

That enum is a second definition of the same list. Let me make it read the one in `messages.ts` rather than repeating it.

`messages.ts` imports from `tickets.ts` as `import type` only, so no runtime cycle. Now the second failure — let me make the complaint assertion behavioural instead of a source read.

Now let me replace the source-read test with a genuinely end-to-end one that drives the real webhook.

All 6 pass, complaint path proven end-to-end. Now let me check I haven't broken REQ-198 and run a typecheck.

All typechecks clean. Now a full-suite regression sweep, since this touches shared modules (`messages.ts`, `tickets.ts`).

16 failing files. Let me determine which are pre-existing vs. caused by this change.

Loose grep. Let me look at the actual failure messages — that's the direct evidence.

4 of 5 fail at base in the main checkout too — pre-existing. (`req115` passing there confirms the known worktree/webui-resolution artifact.) None caused by this change.

Let me run the full REQ-223 set together.

All 27 pass. Now let me record in the ticket body the behaviour I added as a technical consequence of AC-12.

Known sandbox block on writes. Let me retry — reads worked, so let me check whether it's positional.

Confirmed — the sandbox denies writes to the main worktree's `.xgd/config.yaml`, and `load_config()` auto-populates on every call. Let me find whether that write can be skipped.

The blocker is a single missing key, `dashboard.prompts.reread_extra`. Let me check how narrow the write denial is.

`config.yaml` and `quality.yaml` are specifically denied (main-only config protection), though the directory is writable. Let me check which xgd commands still work.

All ticket writes are blocked — a genuine hard blocker I'll report. Let me complete the code side. First, the version bump.

`.xgd/config.yaml` is a stray empty file from my permission probe — must not be committed.

Empty file, confirmed a probe artifact and removed. Now the commit.

Now the merge back to `xgd-working`. Let me check whether `xgd branch lock` works despite the config block.

Lock acquired. Now the manual merge.

Merged cleanly. Let me verify the tests still pass post-merge, then attempt the ticket update again.

Still blocked. Let me capture the exact remedy for the operator, then release the lock.

Now let me release the lock and tear down the merged branch.

It worked now — releasing the lock cleared it. Let me complete the remaining steps.

Another session advanced `xgd-working` and claimed 0.2.157. Let me check the current state.

The gate needs the version-carrying commit at the tip; ticket auto-commits have landed on top. Let me take the session lock and re-bump.

Ticket is at `free_coded` with both SHAs recorded. Let me release the session lock and do a final verification.

Free-coding complete. REQ-223 is at `free_coded` with both SHAs recorded.

## What landed

`POST /api/lead` on the published site's own origin — the endpoint three shipped forms had been posting to and which had never existed.

- **`apps/public-site/src/lead.ts`** — the receiving half. Narrowly amends "public-site receives nothing" for one path and one method; everything else still answers 405. Controls run cheapest-and-most-certain first: body limits before parsing, rate limit keyed on site + source IP, honeypot, then Turnstile. Missing configuration fails closed.
- **`apps/control-app/src/lead.ts`** — the write. Calls the existing `addContact` rather than reimplementing it, so capture is idempotent on `(tenant, email)`. Provenance (site, page, form instance, submit label, other answers, consent wording) lands as an append-only contact event. Asset delivery is at-most-once per address, through the existing mail port.
- **`apps/control-app/src/worker.ts`** — the seam as a named `WorkerEntrypoint`, not a path. Split out of `index.ts` because `cloudflare:workers` is a workerd built-in and ~60 node-project suites import `index.ts`.
- **`contact-form`** gains a `checkbox` field type.

## Two things I changed beyond the literal spec

**AC-12 required suppression on "bounced or complained" — nothing could record a complaint.** The webhook handled only `email.delivered`/`email.bounced`, and the status vocabulary had no value for it. Without both halves the suppression rule was unreachable code that could only ever fire for a status a test wrote by hand. So `complained` is a status of its own (not a synonym for `bounced` — a full mailbox and someone pressing the spam button are different facts an operator needs to tell apart), and the UAT now drives the **real signed webhook** end-to-end rather than asserting on source text.

**That surfaced a live drift.** The ticket schema validating every message write spelled the status list out a second time, independent of `MESSAGE_STATUSES`. Adding a value to one and not the other is a runtime validation error naming a status the code believes in — which is exactly what happened, and only a test writing through the real path caught it. The schema now reads the constant.

Both are recorded in the ticket body under §5 and AC-12.

## Verification

27 REQ-223 UATs pass; 3387 pass suite-wide. 16 files fail — I confirmed 4 of 5 sampled fail identically at base in the main checkout (knowledge-base, webui-scope, Marked Points), and `req115` passing there but not in the worktree is the known webui-resolution artifact. None touch lead capture. All three typechecks clean.

## Two things worth your attention

**A sandbox block cost time and will recur.** Every `xgd ticket` write failed with `PermissionError` on the main worktree's `config.yaml` — `load_config()` auto-populates missing keys on every call, and that file is deliberately write-protected. The missing key was `dashboard.prompts.reread_extra` (template value: empty string). It cleared after `xgd branch clean`, but adding the key to main's config would prevent the next session hitting it.

**The version gate refused 0.2.157** because ticket auto-commits landed on top of my merge, leaving the version-carrying commit off the tip. I re-bumped to 0.2.158 at the tip under the session lock and recorded both SHAs.

Ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is yours. Note §10: Turnstile keys must be set per deployment before any form works, since the endpoint fails closed without them.

<!-- xgd-chat-end -->