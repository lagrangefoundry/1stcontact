---
uid: comment-99edb1e5
id: COMMENT-4869
type: comment
title: Comment on request REQ-374
created_by: xgd
created_at: '2026-10-03T23:25:54.082834+00:00'
updated_at: '2026-10-03T23:33:12.108126+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-59ac5ff8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "94f33742-efc0-4c2c-9d1d-b5ead2daec32",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="38db0be1-42fd-461a-ab7a-83677cbe0d55-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T23:24:22.687313+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="38db0be1-42fd-461a-ab7a-83677cbe0d55-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T23:33:10.839499+00:00" -->
#### Claude
Still mapping the code. The schema and renderer are clear. Now I'm checking how the AI builder discovers the vocabulary, since the ticket says it "confirmed" no per-side form exists.

Nothing enumerates the axes exhaustively, so the change can stay small. Now updating the ticket: keeping the original report and adding scope, design and test plan.

Branch cut. Editing the schema in the worktree now.

Web renderer and validator done. Now the email emitter and the email allowlist.

Email support is in. Now running a typecheck and looking at the REQ-365 test to copy its conventions.

Writing the UAT file now.

All 7 pass. Next: typecheck plus the regression scope (L1 security/robustness, vocabulary, email, surface-axis suites).

That's the known fresh-worktree artifact: `apps/control-app/src/generated` is missing. Copying it from the main checkout (it's gitignored) and re-running.

All 10 suites pass. `check-ignore` printed nothing, so I'm confirming the copied `generated/` dir won't get committed, and running the typecheck.

Both packages typecheck clean. One stale note: `coverage.ts` says L1 carries only `border` plus `borderLeft`. Fixing that wording so it stays true.

Everything is green. Next: version bump and commit. First checking this project's bump script and my saved notes on promotion.

Committing on the branch, without a manual bump: my notes say to let `move-to-free-coded` do the bump itself, which avoids the tip race.

Merged. Adding the coverage-note line to the ticket body, then promoting to `free_coded` with the automatic version bump.

Promoted to `free_coded` with the automatic bump commit. My body edit missed on a capitalisation mismatch, so the body went up unchanged. Fixing that, setting story points, and cleaning the branch.

REQ-374 is done and parked at `free_coded`. It's merged into xgd-working as `48032818` plus the version bump `a77293dc` (0.2.465), the branch is cleaned up, and story points are set to 2.

**What you can do now:** every painting element, and hover/focus states, can take `borderTop`, `borderRight` and `borderBottom`, alongside the existing `borderLeft`. Each takes the same `{ widthPx, color, style? }` as `border`, with the same strict validation.
- `borderLeft` on its own gives the pull-quote rule, with no box.
- `borderTop` on its own gives a footer divider, which no longer turns into a full box.
- `border` plus a side paints all four sides, with that one side restyled. This is the same override rule as CSS.

**Design call I made:** the ticket suggested making `border` accept either form. I added separate per-side fields instead, because `borderLeft` already existed. A union would have meant two ways to say "left border", and every existing reader of `border` would have had to change. With this approach nothing that already works changes.

**What else changed:**
- **Builder:** it learns the vocabulary straight from the schema, so it sees the new fields with no prompt edits.
- **Email pages:** they now accept all four per-side borders and write them inline. Before this, email pages refused `borderLeft`.

**Tests:** the 7 new tests in `tests/test_UAT_FC_REQ-374_per_side_borders.test.ts` pass. They cover the left rule, each side alone, the override order, bounds and strictness, hover states, email output, and the builder vocabulary. Ten related suites also pass, and both packages typecheck clean.

**Not covered (written into the ticket):** capturing a reference site still records a one-sided border as a uniform border plus `borderLeft`. That only affects reproducing existing sites, not what the builder can author. I can file it as a separate ticket if you want it.

The ticket body is up to date, so you can promote it to `ready_to_reconcile` whenever you're ready.

<!-- xgd-chat-end -->