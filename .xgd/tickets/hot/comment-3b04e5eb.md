---
uid: comment-3b04e5eb
id: COMMENT-3399
type: comment
title: Comment on request REQ-290
created_by: xgd
created_at: '2026-09-21T00:16:58.079965+00:00'
updated_at: '2026-09-21T01:11:02.815134+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-aab6c72e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2309e74b-63d7-49f4-8bca-fd196b3654e0",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="3ab669ab-363a-4620-9996-9aa09a736dba-user" -->

<!-- xgd-chat role="user" ts="2026-09-21T00:15:59.686438+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="3ab669ab-363a-4620-9996-9aa09a736dba-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-21T00:22:30.077804+00:00" -->
#### Claude
I've read the ticket, REQ-289, DOC-41, and traced every consumer of `storage/sites/`, `bin/publish` and `1c push`. Three things need your call before I cut a branch — the rest I'll decide myself.

**Q1 — REQ-289 is still `draft`, and the ticket says nothing here lands until it exists.** There is no `bin/copy-to-cloud` and no `/api/export` in the tree. But the gate may be softer than it reads: `bin/publish` can only read `storage/sites/<slug>/`, i.e. the three dead trees. It has never been able to move a builder-authored site, which is every real site — your own comment on REQ-289 says exactly that ("§C step 5 doesn't work for this site"). So deleting it removes no capability that currently works for anything real; it removes a command that answers when an agent asks it a question.

My recommendation: **land REQ-290 now**, ahead of REQ-289. The alternative (delete the trees, keep `bin/publish`) leaves a command whose only input no longer exists — the exact failure mode the ticket is written against. Confirm, or tell me to hold.

**Q2 — how far does "the reproduction loop is pinned to the sandbox root" go?** Two readings, ~100 files apart:

- **Narrow**: `1c repro` forces `root: 'sandbox'` (the `--sandbox` flag becomes redundant for it). `Root` keeps both values, so the file store and the ~103 test suites that open it against a temp `cwd` are untouched. Nothing in the repo writes `storage/sites/` any more, because `repro` was the last loop that did.
- **Wide**: `'sites'` leaves the `Root` type entirely, `--sandbox` becomes a no-op, everything writes `storage/sandbox/`. That rewrites path strings in ~103 test files.

I recommend **narrow**. Your own Boundaries section protects the fs-store module and "the transport dozens of test suites open against temp directories" — wide contradicts that, and nothing in the ticket asks for the churn.

**Q3 — `1c push` cannot be deleted as a module, only as a command.** `apps/control-app/src/router.ts` imports `payloadToWrite`/`SitePayload` from `cli/push.ts` to serve `/api/import`, and four suites import `readSitePayload`/`pushSite`. More to the point, `pushSite(store, slug, opts)` takes *any* `SiteStore` — it is not tied to the file tier at all; the CLI verb is what wires an fs-store over `storage/sites` into it. It also carries the BUG-84 mirrored-asset rights gate and the BUG-36 Access service-token handling, both of which REQ-289's `bin/copy-to-cloud` will want.

So I'd delete `bin/publish`, the `push` case in the CLI, and its `1c help` section — and leave `push.ts` in place (header rewritten so it stops describing `storage/sites/` as its source). Deleting the transport now and rebuilding it in REQ-289 is pure waste. Confirm.

**One finding you should know, no question attached:** the ticket says three tests read the repo's own tree. It is **fourteen** — `req107`, `req105`, `req103`, `req55`, `req109`, `req119`, `reconciliation-l1-control-and-texture`, `reconciliation-l1-one-colour-system`, `reconciliation-colour-census-and-retrofit`, `reconciliation-colour-retrofit-shade-model`, `BUG-92`, `BUG-101`, `REQ-153`, `REQ-175`. Two of them (`req109`, `REQ-153`) call `loadSite({cwd: REPO, root: 'sites'}, …)`, so the fixture has to keep repo shape. I'll move the corpus to `tests/fixtures/l1-corpus/storage/sites/<slug>/` — then every reader swaps one constant (`REPO` → `CORPUS_ROOT`) and every assertion stays exactly as it is. That's 7.9 MB / 32 tracked files, a `git mv`. I'll also update `1c reset`'s `preserved` list, `bin/access-token`'s next-step line, `apps/control-app/ACCESS.md`, DOC-41 §1/§2/§3/§5, and delete `bin/author_xgd_sections.py` (a throwaway helper that edits `storage/sites/xgd/draft/pages/home.json` and nothing else).

Answer "yes to all three" and I'll start.

<!-- xgd-turn id="3a239fbb-cc41-44a9-b654-ce1e0329572c-user" -->

<!-- xgd-chat role="user" ts="2026-09-21T00:33:36.288798+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="3a239fbb-cc41-44a9-b654-ce1e0329572c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-21T01:03:38.663175+00:00" -->
#### Claude
Ticket answers all three questions. One measurement contradicts a line in it, which changes where one edit lands — I'll record that in the body as I go. Cutting the branch.

Now repointing the fourteen suites. Let me look at each call site precisely.

Now the three `globSync` suites and the rest of the constant swaps.

Now req119, l1-one-colour-system, colour-census, shade-model, BUG-92, REQ-153, REQ-175.

Now BUG-92 and REQ-153, which read the corpus through `loadSite`/`readHistory` contexts.

Now the `global` construction — the one edit whose placement I need to justify.

Now the deletions: `bin/publish`, the `push` verb, `bin/author_xgd_sections.py`.

REQ-289 has already landed on this branch — `bin/copy-to-cloud`, `bin/copy-from-cloud`, `GET /api/export` and `cli/copy.ts` all exist. My earlier survey was against an older checkout. Re-surveying against the real base.

Now the remaining `bin/publish` / `storage/sites` prose in `index.ts`, `reset.ts` and the store modules.

Now `reset.ts`, `push.ts`, `copy.ts`, `bin/copy-to-cloud` and the store-module comments.

Now rewriting `push.ts`'s prose so it describes a transport rather than a retired command.

Now `builder.ts`, the store modules, and `router.ts`.

Now the `bin/` scripts, `ACCESS.md`, `.gitignore` and `db/dev-seed.sql`.

Now the UAT suite for REQ-290. Let me check the naming conventions used by the repo's own naming test first.

Now I'll repoint BUG-36's script assertions at the live artefact and fix the boot-guard message.

Now the remaining prose references in `wrangler.toml`, source comments and test headers.

Now the UAT suite.

Now the full suite, to catch anything the targeted runs missed.

The failures are the CLI flip reaching in-process `run()` callers. Making library and CLI agree on one root rather than splitting them.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="22d8fa2b-7589-473d-accc-f7811cedeb0e-user" -->

<!-- xgd-chat role="user" ts="2026-09-21T01:08:02.411027+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="22d8fa2b-7589-473d-accc-f7811cedeb0e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-21T01:10:06.675942+00:00" -->
#### Claude
The full-suite run was killed (exit 137 — OOM). Let me re-establish state and run tests in smaller foreground batches.

⚠️ Chat generation failed: Claude Code CLI error (exit code 1)
Error: You've hit your session limit · resets 8:50pm (America/Los_Angeles)

<!-- xgd-turn id="5742df42-1035-4f2e-9a65-5cb049f75233-user" -->

<!-- xgd-chat role="user" ts="2026-09-21T01:10:59.770143+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->