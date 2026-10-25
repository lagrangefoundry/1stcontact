---
uid: comment-0faf11b8
id: COMMENT-2259
type: comment
title: Comment on request REQ-181
created_by: xgd
created_at: '2026-09-04T01:40:27.959966+00:00'
updated_at: '2026-09-04T01:54:30.176868+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-81c9ad89
  kind: chat_transcript
---

<!-- xgd-turn id="21a3b3c6-af0f-4094-8460-82bb1c2aa264-user" -->

<!-- xgd-chat role="user" ts="2026-09-04T01:40:04.864012+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="21a3b3c6-af0f-4094-8460-82bb1c2aa264-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-04T01:54:30.073437+00:00" -->
#### Claude
The ticket is thorough enough to implement without blocking questions. One thing I want to verify before cutting the branch — whether REQ-179 has already landed the business-switch reload that §4 asks for.

Confirmed — REQ-179 already landed the business-switch reload. Cutting the branch.

Now the source edits. Starting with `library.js`.

Now `app.js`.

Now `builder.css` and `material.ts`.

Now the tests. First updating the existing suites whose behaviour changed.

Now the BUG-47 suite — its subject survives, but two of its three readers are gone.

Now REQ-176's row-meta assertion, and the remaining suites that pass `getSite`.

Now the new REQ-181 UAT suite.

Now run the affected suites.

Now the wider builder/app suites that mount the whole builder.

Now typecheck and the full suite.

Now lock, merge back, and record.

Done. REQ-181 is at `free_coded`, commit `f505002` merged into `xgd-working`, version `0.2.65`, branch cleaned.

## What changed

**The inversion.** The `On this site` pill is gone from `renderRow`. In its place, a warning fires when — and only when — `role === 'site'` and `placed_on` is empty: a decorative `⚠` marked `aria-hidden`, the words **Not on the site**, and the full sentence on `title`. It takes `--shell-danger`, not `--shell-accent`, and the words carry it — so it survives a screen reader and a monochrome display. The predicate is deliberately two facts, not one: background information's `placed_on` is empty and always will be, so keying on placement alone would fire on every reference document.

**The filter.** `hereOnly`, its checkbox, its label, its state and its branch in `visible()` are removed, along with the CSS rule and the comment defending "used on this site" as a view rather than a scope. Text, role and kind are untouched.

**The correctness check.** `library.js` now reads no site anywhere — `getSite`, `placedHere`, `hereOnly` and `siteChanged` are all gone, asserted structurally.

**Two departures from the ticket, both recorded in the body:**

1. §4 says `siteChanged` must not simply be deleted. REQ-179 has landed since and already made a business switch a genuine `library.refresh()`, so the correctness fix §4 asks for is present and the hook was a redundant re-filter. Deleted, with both call sites.

2. `selectBusiness` swallows a listing failure by design. With the re-read as the only defence, a switch whose `/api/material` call failed would leave the *previous* business's material under the new business's name — exactly what §4's invariant forbids, on the one path the host ignores. So the panel gained `clear()`, called immediately before the re-read. It replaces `siteChanged` in the API rather than joining it.

Also rewrote the superseded "a client's second site should not start as cold as their first" rationale in five places — the three §6 named plus `api.js`'s `fetchMaterial` and `router.ts`'s `/api/material`, which carried the same argument.

**Evidence.** New suite `test_UAT_FC_REQ-181_library_badges_the_exception.test.ts` — 7 UATs, with the business-switch case driven through the real builder and the real switcher, including the failed-re-read path. BUG-47's suite reworked (two readers, not three); REQ-161, REQ-176, REQ-166, REQ-172, BUG-42, REQ-179 updated. All 34 pass on the merged branch.

Pre-existing and untouched: 11 knowledge-base suites fail identically on an unmodified checkout (no local KB index), and one `tsc` error in `session-knowledge.ts`.

<!-- xgd-chat-end -->