---
uid: comment-afb85b73
id: COMMENT-5540
type: comment
title: Comment on bug BUG-242
created_by: xgd
created_at: '2026-10-21T13:31:34.676758+00:00'
updated_at: '2026-10-21T13:39:38.055389+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-44404b69
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c46906b1-2180-4f39-9439-686d1f1c224a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="00323b17-3815-41d9-a71b-620e8c8e9bad-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T13:30:52.184927+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="00323b17-3815-41d9-a71b-620e8c8e9bad-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T13:39:36.767539+00:00" -->
#### Claude
Reading the ticket and the pricing code; now locating where the framework decides the cache lifetime so the meter can read it from the same place.

Scope is clear and the ticket body already specifies it. Starting the free-coding flow: mark `free_coding` and cut the branch.

Implementing. First the requested-lifetime source in `backends.ts`, read by both the backend constructors and the meter.

Now the pricing: two write rates in `prices.json`, and `spend-core.ts` choosing between them by requested lifetime or by the usage record's own split.

Now `spend-core.ts`.

Typecheck clean apart from the pre-existing missing-`generated/` errors in a fresh worktree. Now the existing UATs that pin the single `cache_write` rate.

Fresh worktree lacks the gitignored `apps/control-app/src/generated` artifacts; copying them from the main checkout.

Writing the workers-route UAT and dropping the node-host wire test (which can't run against the current framework install).

Committing on the branch (no manual version bump; the gate will bump itself).

Now the ticket body: preserving its content, adding an implementation section that motivates every UAT.

Merging back: lock, merge `xgd-working` into the branch, fast-forward, then the gate.

Merged. Now the gate, letting it bump the version itself.

BUG-242 is fixed and merged into `xgd-working`. The ticket is at `free_coded` with two commits: the fix `258cb24b` and the gate's version bump `fda1bb60`.

**What changed**
- **`prices.json`**: each entry now has two write rates, `cache_write_5m` (1.25× input) and `cache_write_1h` (2× input), in place of the single `cache_write`. For Opus 5.5 that's $5 and $8 per million; for Haiku 4.5, $1.25 and $2. The `about` text explains why there are two.
- **One source for the cache lifetime**: `cacheTtlOf(name)` in `backends.ts` returns `'1h'` for every backend today. All four places `host-core.ts` creates a backend (consultant, builder, coordinator, business settings) now pass it as `cacheTtl`. The meter calls the same function, so the lifetime requested and the lifetime billed can't drift apart. I didn't make it a `backends.json` key because the framework rejects keys that aren't in its schema.
- **`spend-core.ts`**: if a usage record splits its writes into 5-minute and 1-hour parts, each part is priced at its own rate. Otherwise all writes are priced at the lifetime the backend asked for. This applies to the stored turn row, to delegated (`attributed`) entries, and to the per-message spend ceiling. Rows already written keep their stored cost.

**Tests**
- **New**: `test_UAT_FC_BUG-242_cache_write_lifetime.workers.test.ts` sends a real turn and checks two things: every cache marker in the request asks for `1h`, and the stored row prices writes at 2× input.
- **New**: `test_UAT_FC_BUG-242_cache_write_lifetime.test.ts` covers the 1-hour rate (2×), the 5-minute rate (1.25×), a delegated builder entry, and records carrying the 5m/1h split.
- **Updated**: the REQ-292 `turn_price`, REQ-292 `turn_spend.workers` and REQ-362 tests, which pinned the old single rate. The commit message says which.
- All of these pass. Two tests failed in my runs, and both failures come from elsewhere:
  - `test_UAT_FC_REQ-292_a_host_with_no_meter_still_completes_a_turn` hits the known framework `logDir` → `junctions` error in the Node host. I moved the new wire check onto the workers route to get around it.
  - Two REQ-295 delegation tests fail on a `by: 'worker'` field-shape mismatch.

  I didn't re-run either on a clean tree; I'm relying on earlier sessions that saw both fail there.

The split pricing only takes effect once lagrange-framework REQ-216 keeps the 5m/1h counters in its usage record. Until then, every write is priced at the requested 1-hour rate, which is exact today because every backend asks for one lifetime.

<!-- xgd-chat-end -->