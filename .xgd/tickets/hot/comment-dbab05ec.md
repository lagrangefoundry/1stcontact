---
uid: comment-dbab05ec
id: COMMENT-5828
type: comment
title: Comment on request REQ-486
created_by: xgd
created_at: '2026-10-29T20:00:42.376768+00:00'
updated_at: '2026-10-29T21:20:37.216482+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3b023783
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3076b0a7-2dd3-4649-8ad3-7291a2e1954b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="286f2e4f-2cfb-456c-9420-790459f85b99-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T19:56:46.298180+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="286f2e4f-2cfb-456c-9420-790459f85b99-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T21:20:33.263254+00:00" -->
#### Claude
Reading the sign-in route to find where the per-IP limiter belongs.

Spec is clear and needs no questions. Cutting the branch, then updating the verifier and the sign-in route.

Now the verifier change.

Verifier done; existing siteverify doubles now report the host. Writing the REQ-486 lead UATs next.

Lead path green (31/31). Now the sign-in per-IP limiter; first checking how sign-in tests build their env, since a fail-closed binding affects them all.

Now editing `issue()` and the env type.

Restructuring that `if (...) try` into a properly braced block.

Now the wrangler bindings for control-app (top level and both named environments).

Binding declared. Next the sign-in UAT; reading the shortest existing sign-in suite for its harness.

Running every sign-in-related suite to see which existing envs now need the binding.

Expected: every suite that issues links now hits the fail-closed 503. Adding a shared open-limiter helper and wiring it into those suites' envs.

Two failures remain; both look unrelated. Checking them against clean xgd-working.

REQ-204's failure is pre-existing on xgd-working. Re-running the deploy-smoke suite alone in the branch to see if it was a flake.

Fails in the branch but passed on working, so checking whether it reads anything I touched.

That suite builds a synthetic tree around `bin/deploy` and reads none of my files; I'll re-run it after merging working in. Now typecheck and lint.

Both apps typecheck clean. Checking for any static wrangler-parity suite that reads the new binding.

Several failures; baselining the failing files on clean xgd-working before reading any of them.

No output at all, which is suspicious; checking the summary line.

Most fail identically on xgd-working. Three remain that could genuinely read my wrangler edit (BUG-294, REQ-318, deploy smoke); running them in both places.

The xgd-working run printed nothing; re-running it with the raw tail to see what happened.

The xgd-working checkout hangs on this run (exit 124), so I'll baseline inside the branch instead: temporarily restore the original wrangler.toml and re-run AC1333.

AC1333 fails without my changes too, so it's pre-existing in a worktree. The patch didn't reapply cleanly because the test edits were still in place; restoring just the three source files.

All changes restored. Appending a "what landed" section to the ticket body (keeping the existing text) so every UAT traces to ticket language.

Final run of the two new suites plus the lead and sign-in suites I touched.

Only the pre-existing REQ-204 failure remains. Committing.

Committed `53423cf`. Now the merge-back: lock, merge xgd-working into the branch, bump the version, fast-forward back.

Fast-forwarded onto xgd-working. Promoting to `free_coded`.

REQ-486 is implemented and merged into xgd-working. The ticket is at `free_coded` with commits `53423cf` (the work) and `a908d3e` (version bump to 0.2.706). The spec was clear, so I didn't need to ask anything first.

**1. Turnstile hostname check** (`apps/public-site/src/lead.ts`)
- `verifyTurnstile` now takes the expected hostname and only returns success when Cloudflare's reported `hostname` matches the host the form was posted to. The comparison ignores case.
- A wrong host, a host that only starts with ours (e.g. `ours.farm.example`), or a missing or non-string hostname all get the same 403 and wording as a bad token.
- The check is inside the verifier, so no caller can skip it. The draft preview still skips Turnstile entirely.

**2. Per-IP limit on sign-in links** (`apps/control-app/src/sign-in.ts`, `wrangler.toml`)
- New binding `SIGNIN_IP_RATE_LIMIT`: 10 requests per 60 seconds, keyed on `cf-connecting-ip`. It's declared at the top level and again under production and dev.
- Over the limit, the caller gets exactly the same acknowledgement as a normal request (form or JSON) and no mail is sent.
- If the binding is missing, or the limiter throws, the route answers 503 and sends nothing. Treating a throwing limiter as a refusal goes slightly beyond the ticket; it follows the same rule as `lead.ts`.
- Redeeming a link, signing out and `/sign-in/access` don't touch the limiter.

**Tests**
- Two new UAT files: `test_UAT_FC_REQ-486_turnstile_hostname` and `test_UAT_FC_REQ-486_sign_in_source_limit`. They cover every case in the ticket's test plan.
- Because the issue route now refuses without the binding, the six existing sign-in suites now use a small shared limiter that allows everything (`tests/support/sign-in-limiter.ts`).
- The three existing siteverify test doubles now report their own site's hostname, as Cloudflare would.
- On the branch, 89 of 90 tests in the lead and sign-in suites passed and both apps typecheck. The one failure, `REQ-204_the_chrome_is_told_nothing_…`, fails the same way on xgd-working: it gets an extra `entered` key from other work.
- Some suites that read config also fail. Most fail the same way on xgd-working. `AC1333` deploy-hooks fails even with my source changes taken out.
- I couldn't re-check `AC1333` on the xgd-working checkout itself: vitest hung there. I also didn't re-run the suites after merging xgd-working into the branch.

I appended a "What landed" section to the ticket body and left your original text unchanged.

**Before you deploy:**
- The new limiter only takes effect once control-app is deployed. I picked `namespace_id = "2486"`; check it doesn't clash with another rate-limit namespace in the Cloudflare account.
- The hostname check rejects Cloudflare's dummy test keys, because they report `example.com` rather than our host. Any environment using test keys will refuse every submission.

<!-- xgd-chat-end -->