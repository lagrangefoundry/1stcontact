---
uid: comment-1ea384c7
id: COMMENT-7948
type: comment
title: Comment on request REQ-667
created_by: xgd
created_at: '2026-11-07T22:26:08.470671+00:00'
updated_at: '2026-11-07T22:33:40.647061+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-17a53732
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "ed63fe00-19eb-4ac9-bdc4-0dd590141d97",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a1909b7f-94f8-44a5-b766-f5d477abd46e-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T22:23:50.531348+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="a1909b7f-94f8-44a5-b766-f5d477abd46e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T22:33:40.177750+00:00" -->
#### Claude
Ticket is fully specified (not a dupe); reading the existing secret-hook tests next, then I'll cut a branch.

Now the helper in `secret.sh`.

Now `--no-keychain` in `bin/deploy`.

Now the README section and the harness's fake `security`.

Now the UAT file.

My suite and REQ-641 pass. Checking the other failures are worktree artifacts, not my change:

Missing `generated/` (known fresh-worktree gap). Copying it from the main checkout and rerunning everything that uses the harness or `bin/deploy`:

zsh doesn't word-split `$F`; using an array:

Baseline those two on the clean main checkout:

Both pre-existing on clean working. REQ-393's single failure comes from `ACCESS_*` vars in this sandbox shell, not my change. Next: the version bump and commit.

Commit the code on the branch first, then append an implementation section to the ticket.

Now lock, bring working into the branch, bump the version, and fast-forward.

REQ-667 is done and merged into `xgd-working`: `bin/deploy --env production` now takes the two live Stripe secrets from your keychain when you haven't exported them. The ticket is at `free_coded` (commits `4fab73b0d4` and `174a3dd038`, version 0.2.819, 3 story points). It isn't a duplicate; it builds on REQ-641/642 and TODO-20.

**How it works:**
- **Lookup:** a new `secret_from_keychain NAME SERVICE` helper in `bin/deploy.d/lib/secret.sh` reads `security find-generic-password -a 1stcontact -s SERVICE -w`. The keychain is read only when all of these hold: the value isn't already exported (an export always wins), the env is production, `--no-keychain` wasn't given, and `security` exists.
- **Where the value goes:** it is exported inside the hook's own process only, because the probe reads it from the environment. It never enters `bin/deploy`'s environment, a file, a log line or a command argument.
- **Hooks:** `70-stripe-secret-key-live` reads service `stripe-live-platform`; `75-stripe-webhook-secret-live` reads `stripe-live-webhook-platform`. A keychain value is probed and pushed exactly like an exported one, and the output says "(taken from the keychain)".
- **Failures:** a missing entry or a failed read leaves production's secret as it is, as before, and never fails the deploy. The secrets-file refusal is unchanged.
- **`--no-keychain`:** added to `bin/deploy`. It reaches the hooks as `DEPLOY_NO_KEYCHAIN=1`.
- **Docs:** the hooks' header comments and `bin/deploy.d/secrets/README.md` describe all of this.

To store the webhook secret the same way:

    security add-generic-password -a 1stcontact -s stripe-live-webhook-platform -w

**Tests:** the new file is `tests/test_UAT_FC_REQ-667_live_stripe_keychain.test.ts`, and it covers every case listed in the ticket plus a refused keychain value and `--dry-run`. All the suites that run the secret hooks and `bin/deploy` pass with `--no-file-parallelism`, apart from two failures that aren't from this change:
- `reconciliation-cloudflare-site-store` (AC1397/AC1398) fails the same way on a clean `xgd-working`.
- One REQ-393 case fails because this sandbox shell has `ACCESS_*` variables set.

The test helper used by every secret-hook test now always puts a fake `security` first on `PATH`. No test can reach your real keychain, including the existing REQ-641/642 tests. Without the fake, their "leave" cases would have started reading it once the hooks began calling `security`.

One case in the ticket has no test: "`security` absent". The real `/usr/bin/security` is always on `PATH` in the tests, so its absence can't be simulated there; only the `command -v security` check covers it.

<!-- xgd-chat-end -->