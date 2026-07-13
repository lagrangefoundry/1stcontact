---
uid: comment-9b30f4cd
id: COMMENT-94
type: comment
title: Comment on bug BUG-3
created_by: xgd
created_at: '2026-07-12T20:02:25.487887+00:00'
updated_at: '2026-07-12T20:05:19.813685+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-e922244a
  kind: chat_transcript
---

<!-- xgd-turn id="1a5e7634-aadc-44cd-b970-24b80cc452f0-user" -->

<!-- xgd-chat role="user" ts="2026-07-12T20:02:22.201164+00:00" -->
#### You
I think this ticket has been implemented even though it is sitting in draft status. Please can you update it if it has been.

<!-- xgd-turn id="1a5e7634-aadc-44cd-b970-24b80cc452f0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-12T20:05:19.786155+00:00" -->
#### Claude
I'll investigate whether BUG-3 has actually been implemented. Let me look at the ticket and the relevant `1c shot` code.

Let me examine the shot implementation and its shared capture/browser code to see if lazy-loading handling exists.

Now let me look at the Playwright driver, which is where lazy-load triggering would actually happen (scroll / network-idle / eager images).

The fix clearly exists — `settlePage()` in the Playwright driver does exactly what BUG-3 asks (scroll full height, promote lazy→eager, await image decode + network idle). Let me check git history and whether tests exist, to understand provenance before updating the ticket.

The fix landed in commit `fdd1a239` (2026-07-09) as part of **REQ-36**, with UATs named `test_UAT_FC_REQ-36_capture_*` — not under BUG-3. Let me confirm which ticket owns that SHA, since that determines what I can legitimately do with BUG-3's status.

Commit `fdd1a239` appears only in a resync report (as a remapped orphan commit), not owned in any ticket's `fields.commits`. Let me check REQ-36's actual commit list to see if it claims this work.

REQ-36 is itself still `draft`, and the fix commit `fdd1a239` is **not** in its `fields.commits` — it's currently an unowned orphan (remapped by resync). Let me confirm the UAT tests exist and their naming, so I can report precisely.

I now have the full picture. Let me record the finding on the ticket as a comment (safe, auto-committed), then report to you.

Yes — BUG-3 is implemented, but I want to be careful about *how* I "update" it, because the honest answer changes the recommended action.

## What I found

The fix exists and is tested. `PlaywrightDriver.settlePage()` (`tools/generate/src/cli/capture/playwright-driver.ts:131-179`, called from `navigate()` at line 104) does exactly what BUG-3's "Expected" section asks:
- scrolls the full page height in viewport steps to trip lazy-load / IntersectionObserver triggers
- promotes residual `loading="lazy"` images to eager (and swaps `data-src`)
- awaits image decode + `networkidle` before the screenshot

It even reveals Elementor `.elementor-invisible` / `fadeIn` blocks — the exact joyfulculinary symptom in the ticket. It's covered by four real-Chromium UATs in `tests/req36-capture-settle.test.ts`.

## The catch — it belongs to REQ-36, not BUG-3

The fix landed in commit **`fdd1a239`** (2026-07-09) as part of **REQ-36** (the joyfulculinary reproduction, where this bug was surfaced). Three reasons this is *not* a clean free-code of BUG-3:

1. **Shared commit** — `fdd1a239` also adds the hero-portrait feature (`hero/index.astro`, `hero/meta.ts`). Claiming it on BUG-3 would double-own REQ-36 code.
2. **Evidence already attributed** — the UATs are named `test_UAT_FC_REQ-36_*`.
3. It's currently an **unowned orphan** (resync-remapped from `cc66acbe`; not in REQ-36's `fields.commits` either, which is still `draft`).

So BUG-3 is effectively a **duplicate of a slice of REQ-36** that got fixed in the same pass.

## What I did / didn't do

- **Did**: recorded all of the above as a note on the ticket (`COMMENT-95`) so the provenance is durable.
- **Didn't**: move it to `free_coded`. That would fork ownership of a commit and UATs that belong to REQ-36 — the wrong kind of "update," and it would confuse reconciliation.

## Recommendation

Close BUG-3 as a **duplicate of / resolved-under REQ-36**. That's an operator-owned status transition (I only own `draft`/`in_progress`/`free_coded`), so I've left the status at `draft` for you to close. No new code or commit is needed — the behaviour ships and is tested.

Want me to do anything else here — e.g. leave it and let REQ-36 carry it, or investigate why `fdd1a239` isn't in REQ-36's `fields.commits`?

<!-- xgd-chat-end -->