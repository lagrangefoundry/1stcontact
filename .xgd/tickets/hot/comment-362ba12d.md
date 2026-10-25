---
uid: comment-362ba12d
id: COMMENT-2177
type: comment
title: Comment on request REQ-177
created_by: xgd
created_at: '2026-09-02T23:37:00.199869+00:00'
updated_at: '2026-09-02T23:44:08.515102+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-631866be
  kind: chat_transcript
---

<!-- xgd-turn id="5034d19d-4c0a-4d18-9fc4-b19ed1d4008e-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:36:26.818071+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="5034d19d-4c0a-4d18-9fc4-b19ed1d4008e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-02T23:44:08.086806+00:00" -->
#### Claude
Now let me make the edits.

Now the `builder.ts` header line and the `startServe` jsdoc:

Now the README and the two preflight test lists:

Now bump version, commit, merge back.

Now lock, merge back, and record on the ticket.

Now update the ticket body to record what actually landed, then clean up the branch.

Done. REQ-177 is at `free_coded` with commit `246333cbfe` merged into `xgd-working` (version 0.2.48).

**What landed**

- **`1c serve` is gone** — the `case 'serve'` arm, its usage line, the now-unused top-level `startServe` import, the `run()` doc caveat about a command that never returns, the `serve` entry in the help text's ungated-offline-verbs list, and its README row. It now falls through to the unknown-command default: refusal on stderr plus usage, exit 1.
- **`startServe` stays exported and working** — `shot.ts`, `aligned-crops.ts` and `conformance/harness.ts` import it directly; the command went, not the function.
- **Both fixture files now say what they are** — `serve.ts` gained a header stating it is the static-preview capture fixture, that `1c serve` existed and was removed and why, and that the only supported way to serve a site is a Worker. `builder.ts` gained the same conclusion at the top of its existing header.

**Tests** — `tests/req177-discontinue-raw-server.test.ts`, three UATs: the command is unknown; the help advertises no raw server (and does offer `1c builder` / `wrangler dev`); and the fixture still binds a loopback origin, driven over real HTTP so that keeping the export while deleting the implementation cannot pass.

Two judgement calls worth flagging:

1. **I edited two existing preflight UATs.** `req44-install-preflight` and `reconciliation-1c-install-preflight` both enumerate offline verbs and listed `serve`. Their assertions still passed after removal (`assertInstall` is a no-op for anything not in `COMMAND_DEPS`), but the lists would have been asserting something about a verb that no longer exists, so I dropped the entry. No assertion semantics changed; recorded in the ticket body.
2. **I left the ~10 other `1c serve` mentions in comments alone** (`fs-store.ts`, `memory-store.ts`, `req113-serve-extensionless.test.ts`, `apps/public-site/src/routes.ts`, others). They are historical explanations of the static-serving semantics, which the fixture still has, and the ticket scoped item 2 to `serve.ts`/`builder.ts`. Anyone grepping now lands on the new `serve.ts` header, which states plainly that the command was removed. Say the word if you'd rather I swept those too.

Regression scope green: the new file plus `req113-serve-extensionless`, `reconciliation-clean-page-urls`, `req37-launcher`, `reconciliation-1c-aligned-crops-sandbox-routing`, `bug30-relativize-fragment`, both install-preflight suites, and the three usage-text suites. `tools/generate` and `apps/control-app` typecheck with no new errors (the one `session-knowledge.ts` error is pre-existing on the base commit — I verified against a stash).

<!-- xgd-chat-end -->