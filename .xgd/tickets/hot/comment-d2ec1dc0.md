---
uid: comment-d2ec1dc0
id: COMMENT-2906
type: comment
title: Comment on request REQ-236
created_by: xgd
created_at: '2026-09-13T22:14:19.809018+00:00'
updated_at: '2026-09-14T00:55:50.813232+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-03519106
  kind: chat_transcript
---

<!-- xgd-turn id="1348c6b8-57b8-45ca-b452-8e8ac92c5d7f-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T22:13:50.036269+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="1348c6b8-57b8-45ca-b452-8e8ac92c5d7f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T22:44:43.220807+00:00" -->
#### Claude
Now let me update the ticket with my implementation decisions and start work.

Now annotate the baseline:

Now the interface and prose in the header of `d1r2-store.ts`:

Now the import route:

Now the preview route and the portal:

Now `app.js`:

Now `lead.ts`, `builder.ts` local transport, and `host-core.ts` prose:

Now let's run the full workers suite to see the damage:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="42260b89-cecb-47d8-8dec-76b5149dfb9e-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T22:45:10.047016+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="42260b89-cecb-47d8-8dec-76b5149dfb9e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T23:15:30.638343+00:00" -->
#### Claude
I'll pick up where the prior session left off. Let me first get the ticket and check the current state.

Branch `free-REQ-236` exists. Let me check its state.

Substantial uncommitted work exists in the branch worktree. Let me read the full ticket body and assess the diff.

Ticket body is well-populated. Now let me assess the existing work — check for leftover slug references and run typecheck.

Most remaining references are historical prose. Let me check `shot.ts` (still has `slug` params) and run typecheck.

Let me run the typecheck to get a precise picture of what's incomplete.

That's baseline config noise, not our diff. The real gate is the test suite — let me run it.

`/tmp` isn't writable in this sandbox — using `$TMPDIR`.

Tests are running. Meanwhile let me review the work that's already been done.

Solid work. Note the `kind` column is a design decision not yet in the ticket body — I'll need to add it. Let me review the store.

Significant failures — work is incomplete. Let me see the actual error while the run finishes.

Still running. Let me review the main store implementation meanwhile.

The design work is careful and thorough. Let me check the test results now.

Let me use the wait productively — examining a failing path.

120 failures. Let me find the root cause — checking provisioning.

The source is updated but many test files likely still use the old API. Let me find stale references.

Source is essentially complete; ~18 test files still use the old API. Let me check run status.

28 files, 120 tests. Let me examine the failure patterns in detail.

One real code bug (`no such column: slug`). Let me see it.

The bulk is updating 28 test files. Let me work through them systematically, starting with the most central.

The form field was renamed `slug` → `site`. Let me verify the client was updated, then fix the tests.

Let me fix the test files. Starting with BUG-47.

Let me look at the shared schema applier — REQ-222's failure suggests a re-run problem.

Found it: `applySchema` run twice — baseline's `CREATE UNIQUE INDEX ... slug` re-fires after 0004 dropped the column.

Storage persists across describes within a file, so the now-non-idempotent 0004 breaks re-application. Let me make `applySchema` state-aware — correct under either isolation regime.

Setup fixed. Now the test's own slug usage. Let me fix it.

REQ-222 green. The `applySchema` fix may have unblocked others — let me re-run the full suite.

Let me work through the remaining files. BUG-90 first — it references the removed `businessSiteName`.

BUG-90's premise ("the site is named after the business") is directly superseded by REQ-236. Let me read the whole suite and rewrite it.

BUG-90's naming premise is superseded. Let me rewrite the suite to assert the current truth, preserving the claims that survive.

Let me find all remaining old-API usages across the test suite at once.

Let me batch the simple stub renames first.

Now the portal tests. Let me look at how the portal is addressed now.

Memory store correctly keeps names. Now the workers portal test.

Storage persists across tests, so authoring twice now mints two portals. The helper must reuse — the same guard production uses.

Now BUG-51, whose subject (`createDraft` idempotence) REQ-236 changes.

BUG-51 needs restructuring: the import route now resolves *the business's one site*, so each case needs its own business. Let me rewrite it.

Now the test bodies:

Good. Now the remaining batch. Let me look at REQ-167, REQ-180, REQ-178, REQ-168, REQ-203 (all provisioning-shaped).

Let me re-run the full suite to see remaining state.

Down to 83. Let me check the builder/AI suites — they likely share a pattern.

Journalled edits now couple the cases. Each needs its own business — same as BUG-51.

Let me check the AI-host suites, which likely share a setup helper.

REQ-146 threads its tenant into R2 prefixes too. Let me parameterise it fully.

The audit assertion was passing on leakage from earlier tests — isolation exposed it. Let me see how the audit test scripts a real write.

16 files left. Let me check the material/AI cluster which likely shares a helper.

Same `slug`→`site` form-field rename as BUG-47. Let me find them all.

Revisions accumulate on the shared business's single site. Per-test business needed.

A per-case `beforeEach` tenant keeps every call site unchanged and restores isolation.

Let me check the node-project suite status, since it hasn't been run yet.

`lead-site.ts` now returns `siteKey` only. Let me update BUG-78.

Let me check the node suite while I tackle REQ-190.

REQ-190 needs careful work — its key claims survive but the slug half dies. Let me read it fully.

Now let me rewrite REQ-190's slug-dependent parts.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="9dbfdfc6-6f4f-464b-aa37-cb848581996e-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T23:36:31.198371+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="9dbfdfc6-6f4f-464b-aa37-cb848581996e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T00:07:10.756793+00:00" -->
#### Claude
Now let me rewrite the stale REQ-190 suite while the run finishes.

Node project is green apart from two pre-existing failures. Now the workers project.

Now the version bump and commit.

Now lock, merge back into `xgd-working`, then mark the ticket.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="20bb8bb2-1a7b-4323-9ec1-d24f1e27f03e-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T00:55:50.370419+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->