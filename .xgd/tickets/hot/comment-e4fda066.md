---
uid: comment-e4fda066
id: COMMENT-4011
type: comment
title: Comment on bug BUG-152
created_by: xgd
created_at: '2026-09-26T22:56:01.166821+00:00'
updated_at: '2026-09-26T23:47:09.023787+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-164c2464
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "926c5b80-0e46-4bde-a110-2eca58c9744a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="1398117e-c662-4085-b96f-a176b6a01f0d-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T22:54:59.699338+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="1398117e-c662-4085-b96f-a176b6a01f0d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T22:57:08.336981+00:00" -->
#### Claude
⚠️ Chat generation failed: Claude Code CLI error (exit code 1)
Error: You've hit your monthly spend limit · raise it at claude.ai/settings/usage?from=cc_cli_limit_message

<!-- xgd-turn id="c7550d0e-7707-4cde-b0ca-6df63d8a0f13-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T23:09:28.695215+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="0394a77c-85b2-48cb-a143-2b0cf3dc1e37-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T23:30:21.443375+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above): Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="0394a77c-85b2-48cb-a143-2b0cf3dc1e37-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T23:47:08.819718+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now the Access side:

Both probe suites pass in this environment. Setting up the ticket and taking the session lock.

Now the fix for defect 1 — collapse the two call sites to one definition:

Now defect 2 — the Access message:

Now the defect-2 UAT, driving the real simulator across a restart:

Now commit, staging only my paths:

Now update the ticket body to describe what landed, preserving the operator's diagnosis:

Done. BUG-152 is at `free_coded` with commit `63c66bc` on `xgd-working`, version `0.2.384`, story points 3.

**What landed**

*1. `1c ps` misreporting managed services* — the `ps` verb was composing its own managed-pid set from `readDevPidfiles(root).map((r) => r.pid)` while `devTable` used `.flatMap(devPidfilePids)`. It now reaches the table through `devTable({ repoRoot: repoRoot() })`, so that expression is written exactly once in `dev.ts`. `devProcessTable`'s `managedPids` stays caller-supplied (`ps.ts` still has no business knowing where `bin/dev` writes pidfiles) — what changed is that only one caller supplies it, per the ticket's "the two call sites should not be able to disagree".

*2. Stale Access cookie* — `verifyAccessJwt`'s kid-not-found refusal splits. When the presented `kid` takes `local-dev-<pid>` shape **and** the just-refreshed JWKS publishes one too, the reason names the expired local sign-in and the simulator's `/login`. Every other case keeps the original wording verbatim. The second condition is what makes the deployed path structurally unable to reach the reassuring sentence — Cloudflare's kids are hex digests. Still a 401. Two exports carry it: `isAccessSimKid`, `accessSimSignInUrl`.

**Evidence** — 5 UATs across two files, both verified RED against the pre-fix code (`managed` was `false`; the new sentence was absent):

- `test_UAT_FC_BUG-152_ps_names_the_starter.test.ts` runs against the **real checkout and the real `1c ps` subprocess** — deliberately, because BUG-147's suite asserted against `devTable` and passed throughout, which is how this survived, and `repoRoot()` is source-anchored so a temp root cannot reach the verb. Real wrapper, real grandchild, real `lsof`, real pidfile written by the production writer, on ports 8780–8798 (disjoint from the sibling suites). Plus a leg pinning that the verb composes no managed set of its own.
- `test_UAT_FC_BUG-152_stale_local_sign_in.test.ts` **performs the restart**: real sim spawned, signed into over loopback, SIGKILLed, second real sim on the same port. Also asserts a fresh cookie still verifies, and pins the shape gate from both sides. `fetch` is stubbed in exactly one leg (a Cloudflare team that doesn't exist).

**Verification** — regression scope 11 files / 111 tests passing (the two new suites plus BUG-147, REQ-319, REQ-147, REQ-192, REQ-204, BUG-59, BUG-150, BUG-146, REQ-322); `tsc --noEmit` clean on both tsconfigs.

Two notes:

- Three files were already modified in the tree when I started (`apps/control-app/ACCESS.md`, `apps/control-app/wrangler.toml`, `tools/generate/src/cli/ai/platform-fonts.json`) — not mine, left unstaged. `ACCESS.md` would be the natural place to document the new message, but it's mid-edit by another session so I didn't touch it; say the word and I'll add it as a doc-only commit.
- `xgd branch session end BUG-152` refused: the xgd-working merge lock now reads `held by ticket='REQ-333'`. My lock was reclaimed mid-session (the `$PPID` anchor going stale across tool calls, as expected in this harness). The commit landed before that, so nothing is at risk — I left REQ-333's lock alone.

<!-- xgd-chat-end -->