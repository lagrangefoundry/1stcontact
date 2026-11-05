---
uid: comment-682f6dac
id: COMMENT-7803
type: comment
title: Comment on bug BUG-352
created_by: xgd
created_at: '2026-11-05T00:46:01.914953+00:00'
updated_at: '2026-11-05T00:55:38.237260+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-ca01d2d1
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "9279f5be-1823-4164-baff-b086c95676d4",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="81bce303-7233-4471-8cf8-c7a809dbf937-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T00:45:19.086931+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="81bce303-7233-4471-8cf8-c7a809dbf937-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T00:55:36.557471+00:00" -->
#### Claude
Ticket is fully scoped; no questions. Starting the free-coding flow: marking it in progress and cutting a branch.

Fix applied. Now writing the UAT, modelled on REQ-393's stub harness.

Passes. Confirming it fails without the fix, then running the neighbouring build suites.

That `git checkout` also discarded the uncommitted fix, so I'm putting it back.

Three suites fail. Checking whether they also fail on clean xgd-working (the main checkout, which doesn't have my change).

Those failures are already there on clean xgd-working. In the worktree, two suites fail before any test runs, so I'm checking why.

The worktree is missing generated files, which is a known setup step. Copying them in from the main checkout and re-running.

One new failure compared with the baseline: AC1331. Checking what it asserts.

AC1331 pins the exact old invocation, which this ticket deliberately changes. I'm updating the pin and will record that in the ticket.

AC1331 passes now. Next: commit, merge back, then move the ticket to free_coded. Checking my notes on the version-bump step first.

Committed. Updating the ticket body before merge-back, keeping the existing text and adding what landed.

Now the merge-back loop: take the lock, merge xgd-working in, bump the version, fast-forward, then move to free_coded.

BUG-352 is fixed and merged into xgd-working. The ticket is at `free_coded`, version 0.2.773, 1 story point. I didn't run `bin/deploy --env dev` end to end, so the real deploy is still unchecked.

**The fix:** `bin/build`'s bundle step now runs `wrangler deploy --env production --dry-run --containers-rollout=none --outdir dist`. That's the same flag `bin/deploy`'s own dry runs already pass. The build step now only checks the Worker bundle. The real `wrangler deploy` still builds the container image, after the hook has bundled the server.

**Tests:**
- **New test** `test_UAT_FC_BUG-352_build_dry_run_passes_containers_rollout_none`: runs the real `bin/build` with `npx`, `pnpm` and `node` replaced by stand-ins, on a checkout with no `container/dist/`. It checks that the build succeeds and that every dry run passes the flag. It fails without the fix and passes with it.
- **Updated test:** `test_UAT_AC1331_…` in `tests/reconciliation-platform-build-deploy-smoke.test.ts` checked for the exact old command string, so it now expects the flag. What it tests is unchanged: every Worker found is bundled against production. I noted this change in the ticket so reconcile picks it up.
- **Already failing:** AC1332, AC1333, AC1425, AC1427 and REQ-393's `loading_the_file_leaves_deployed_vars_unchanged` fail in the nearby build/deploy suites. They fail the same way on clean xgd-working, so this change didn't cause them.

**Commits:** `fd09ef94` (fix and tests) and `374f8bd4` (version bump).

Promoting the ticket to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->