---
uid: comment-648c92c0
id: COMMENT-7937
type: comment
title: Comment on bug BUG-376
created_by: xgd
created_at: '2026-11-07T21:04:45.644504+00:00'
updated_at: '2026-11-07T21:22:59.631477+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-e2624f57
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f4dbd86d-da56-4658-a69a-1a51675e8ff7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0337f71b-651b-4e2a-b8d7-aba6090ef20b-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T21:04:06.944657+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="0337f71b-651b-4e2a-b8d7-aba6090ef20b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T21:22:53.803329+00:00" -->
#### Claude
Ticket isn't a duplicate; branch cut. Now reading the resolver in `copy.ts`.

Not a duplicate. I've read the resolver and the directory schema; next I'm checking business id format and the existing copy-site tests.

Fixing a stray template-literal split I introduced on line 630.

Now the directory field.

Now the CLI output and usage text in `index.ts`.

Now the `bin/` scripts' help headers.

Now type-checking and finding which existing tests pin the old form.

Fresh worktree lacks `apps/control-app/src/generated` (known); copying it from the main checkout, then re-checking only my files.

My files type-check clean. Now moving the existing copy UATs to the `email:name` form; checking the REQ-392 test's stub too.

Running the affected suites to see what breaks.

As expected, every existing copy UAT used a bare name. Migrating them file by file, starting with REQ-289.

REQ-289 green. Now BUG-134 and BUG-159.

Two things: `.xgd/tmp` is missing in this fresh worktree (environment, not code), and my refusal said "refused" for a network failure. Rewording it to "could not be read".

Now REQ-392 (copy-repro-to-dev).

Now the REQ-654 handoff workers suite.

All migrated suites green. Now writing the new BUG-376 UATs; first checking how the REQ-298 directory test seeds accounts, for the `ownerEmails` case.

Writing the two new UAT files.

Five new CLI UATs pass. Now the directory `ownerEmails` workers UAT.

Running the full set of affected suites together, plus the other tests that reference the directory or copy commands.

Two more suites use bare names: REQ-294 chats command and REQ-393 secrets file. Looking at them.

REQ-393's `deployed_vars_unchanged` failure is from this shell's environment (`kept from your environment`), not my change. The other two need the new form; migrating them.

Confirming the remaining REQ-393 failure exists on clean `xgd-working` too.

Pre-existing on clean `xgd-working` (this shell exports those three vars). Checking docs for old-form examples.

Help renders correctly, types clean. Checking the free_coded version gate memory before committing.

Code and tests are done. Updating the ticket body (keeping the existing text) so every UAT, including the directory one and the migrated suites, traces to it.

Committing on the branch.

Committed. Now locking and merging back into `xgd-working`.

Ticket is at `free_coded` (the gate added its own version-bump commit). Setting story points, then cleaning the branch as its own call.

BUG-376 is fixed, merged into `xgd-working`, and the ticket is at `free_coded` (3 story points). It isn't a duplicate: no other ticket covers this.

**What changes for the operator**

- Each end of a copy is now `<env>:<email>:<business name>`, for example `dev:operator@example.com:"Client Shop Test 1"`. The email picks the account through the platform directory, and the name is matched only among that account's businesses. Your own memberships no longer play any part, so your own business of the same name can't win silently any more.
- A bare name is refused before any request is made. A `biz_…` id still works on its own.
- Each refusal says what went wrong: no account for that email; the email is on more than one account and the name matches in more than one (the accounts are listed); or the account has no business by that name (the refusal lists what it does have).
- The output names each end's owner, as `'Client Shop' (biz_…) — owner client@example.com, account Client Ltd`. That covers the real run, both dry runs, `--handoff` and `--backup`. The plain `--dry-run` now looks up the destination too, so it can show both owners.
- `copy-to-cloud`, `copy-from-cloud` and `copy-repro-to-dev` use the same single resolver, so they also need the new form. Any runbook or shell history that uses a bare name will now be refused.
- `/api/admin/sites` gains `ownerEmails`: the active people on the owning account, read in one query rather than one per site.
- The `--help` text, the `1c` usage and the examples in `ACCESS.md` show the new form.

**Tests**

- Five new UATs drive the real `bin/1c copy-site` against two stub builders. Each builder has two accounts with a business called "Client Shop", and the caller's memberships offer the wrong one. The import lands on the client's business only.
- One new workers UAT checks that each directory row carries its own account's emails.
- I moved seven existing copy suites (REQ-289, REQ-294, REQ-392, REQ-393, REQ-654, BUG-134, BUG-159) to the new form. Names are already unique within an account, so REQ-289's ambiguity case is now "one email on two accounts that both have the name".
- All of these pass, apart from one test. `test_UAT_FC_REQ-393_loading_the_file_leaves_deployed_vars_unchanged` fails in this shell, and fails the same way on `xgd-working` without my change, because the shell already exports `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` and `SERVICE_TOKEN_IDENTITIES`.

**Not yet checked**

- The fix isn't deployed, and I haven't run it against the real builders.
- Naming a business by email on the local end relies on `bin/access-sim` acting as the platform admin, which is what its code says. I didn't run that live. If that end can't read the directory, the command refuses and tells you to use the `biz_…` id instead.

<!-- xgd-chat-end -->