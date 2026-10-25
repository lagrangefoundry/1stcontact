---
uid: comment-ecf1a4b0
id: COMMENT-5463
type: comment
title: Comment on bug BUG-214
created_by: xgd
created_at: '2026-10-17T22:47:27.553272+00:00'
updated_at: '2026-10-18T00:18:00.615534+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-172d9a04
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a6bf6a01-d8aa-4a3f-a3c1-e9d0fab1602a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f08c90c1-d973-474f-9068-35f799b1e80c-user" -->

<!-- xgd-chat role="user" ts="2026-10-17T22:45:29.223367+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="f08c90c1-d973-474f-9068-35f799b1e80c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-17T22:53:09.286836+00:00" -->
#### Claude
The ticket already has a diagnosis; I'm checking it against the bundled upstream library (`generated/ai-workers.js`).

Diagnosis checks out so far. Next: why the existing REQ-207 tests didn't catch it, and whether `failed` material can be re-described.

The REQ-207 UATs assert an image block reaches the client, so either they fail now or the upstream gate arrived later. Running them:

All 8 existing REQ-207 UATs fail on the current tree. That means upstream added the gate after REQ-207 landed. Checking when:

The diagnosis already in the ticket is right, and I've confirmed it against the code and by running the existing tests. I haven't changed any code. I did add a short "Confirmation" note to the end of the ticket.

## Root cause
- `describerSession` (`apps/control-app/src/ai.ts:285`) calls `lib.registerBackend(name, () => backend)` without a capabilities argument. It's the only `registerBackend` call in this repo.
- When a name is registered without capabilities, the upstream library records it as having none.
- The session manager decides whether a backend can take an image by looking up that registered record, not by asking the backend object. The Claude backend itself declares `vision: true`, but the manager never sees that.
- Text passes because it contains no image. Every image is refused, and so is every `capture_site` screenshot, since captures use the same describer (`describe.ts:512`).

## Why it went unnoticed
- **The upstream library changed under us.** The manager started checking registered capabilities around 2026-10-04 (lagrange-framework `b19ea3c5a1`). That was after the image describer shipped in REQ-207 (`597939256b`, 2026-09-08). The shared library isn't pinned, so the change reached this repo without anyone seeing it.
- **The existing tests already catch it.** All 8 tests in `tests/test_UAT_FC_REQ-207_image_describer_session.test.ts` fail now with this exact error, while the 5 text-describer tests from REQ-173 pass. Those image tests were enough evidence; nothing ran them after the upstream change.

## Proposed fix
1. **Code (one line):** `lib.registerBackend(name, () => backend, lib.ClaudeAPIBackend.capabilities)`. This covers both describers. I'd use the class's capabilities rather than the instance's, which matches how the upstream library registers its own backends.
2. **Tests:** the 8 failing REQ-207 tests are the regression evidence and should go green. I'd add one `test_UAT_FC_BUG-214_*` test: an image upload through the real describer, with only the Anthropic client faked, ends `described` and the fake received an image block. That's essentially what the existing tests already check, so a new one is optional.

## Needs your decision
**Re-describing images already stuck at `failed`.** The ticket's fix line asks for this, but there's no re-describe pass in the code. It's only mentioned in comments as something planned. Options:
- **(a)** Ship only the code fix in BUG-214. Clients re-upload, or we repair the existing rows by hand.
- **(b)** Add a minimal re-describe for images with status `failed` (and possibly `no_describer`) to this ticket. It wouldn't touch descriptions a client has written, since those are marked `ok`. This is real new scope.

I'd go with (a) and track (b) separately or under the epic. Rows left at `failed` still show and can still be placed; they just have no description.

**Separately:** the unpinned shared library let this upstream change land without notice. That's a broader risk worth considering, but outside this ticket.

<!-- xgd-turn id="b39eff0d-9581-44ea-9340-f1706d071126-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T00:12:48.353763+00:00" -->
#### You
Lets just do image descriptions manually there can't be that many

<!-- xgd-turn id="b39eff0d-9581-44ea-9340-f1706d071126-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T00:17:56.580745+00:00" -->
#### Claude
I'll go with option (a): the one-line registration fix in this ticket, and you redescribe the existing `failed` images by hand. First, reading the ticket.

The fix and a new test are in. The worktree is missing the control-app's generated library files (a known fresh-worktree gap), so I'm reading the note on how to provide them before running the tests.

All 36 tests pass. Next I'm checking that the new test fails without the fix, so it actually proves something.

Without the fix it fails with `expected 'failed' to be 'ok'`, so the test catches the bug. Now committing; version bump convention here is package.json.

The gate bumps the version itself, so I'll commit without a bump, merge, and move the ticket to free_coded.

I've fixed the image describer: newly uploaded images and `capture_site` captures now get described instead of ending at `failed`. Images already stuck at `failed` are still yours to redescribe by hand, as agreed.

**The fix:** `describerSession` in `apps/control-app/src/ai.ts` now registers its backend with `lib.ClaudeAPIBackend.capabilities` as the third argument. Before, it registered the backend without stating it can read images, so the shared library refused every one. The change covers both the image and text describers.

**Tests:**
- I added one new test, `tests/test_UAT_FC_BUG-214_image_describer_vision_capability.test.ts`. It sends a PNG through the real describer with only the Anthropic client faked, and checks the result is `ok` and that the model was sent an image block.
- With the fix removed, the new test fails with `expected 'failed' to be 'ok'`, so it does catch this bug.
- The 8 REQ-207 image describer tests that were failing now pass, and the REQ-173 text describer tests still pass: 36/36 across those 6 files.
- I ran these in the branch worktree using a copy of `apps/control-app/src/generated/` from the main checkout. A freshly cut worktree doesn't have those files, and the folder is gitignored, so the copy wasn't committed.

**Ticket:** BUG-214 is at `free_coded` with commit `2cc1f4eb`, merged into xgd-working and the branch cleaned up. The ticket body records the decision that redescribing images is manual and adds no redescribe pass. The gate added its own version-bump commit, which is why it reported 2 commits. Promoting to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->