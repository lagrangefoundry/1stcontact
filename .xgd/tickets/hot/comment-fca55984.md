---
uid: comment-fca55984
id: COMMENT-4635
type: comment
title: Comment on request REQ-355
created_by: xgd
created_at: '2026-09-30T21:10:00.394667+00:00'
updated_at: '2026-09-30T21:10:00.394667+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-73d853f0
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "68c28acd-1dc1-4df3-b460-6e82dff1c8d9",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b37ed6b9-3f0f-424f-8cc2-aec66aedaa83-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-30T20:56:56.361208+00:00" -->
#### Claude
Ticket scope is complete and no work has started. Proceeding: set `free_coding`, cut the branch, then implement.

Branch `free-REQ-355` is cut and the ticket is at `free_coding`. I'm reading how the consultant gets its knowledge surface so the builder can be wired the same way.

Still reading upstream: checking whether the KM bridge can register its landscape/mechanism providers under builder-specific names.

Grants travel with extra surfaces, so the worker wiring is a one-line addition. Now finding the existing builder-composition tests to model the UATs on.

The REQ-295 workers suite drives the real route with a scripted model and inspects what the worker is sent, which is the right evidence shape. Checking how the router injects a system KB for tests.

I have both harnesses now (REQ-158 plants a system KB; REQ-295 scripts a delegation and captures the worker's requests). Reading REQ-295's helpers so the new UAT can combine them.

Implementing. First `roles.ts`: builder-specific KM provider names, the with-corpus config choice, and a shared `builderKnowledge` helper both hosts use.

Now `builderRole`'s signature and the shared helper beside `registerCorpusProviders`.

Now the `priming.json` order. I'll text-insert so the file's hand formatting survives.

Priming order in place, and the two role-text copies are identical. Now `host-core.ts`: the `HostDeps` seam, the worker's composition, the revised exclusion comment, and the role's `withCorpus`.

Uses `type` inline imports in that block — I'll add it there instead.

Now `sessionWorkerKnowledge` in `session-knowledge.ts`, beside `sessionPriming`.

Now the Node host (`host.ts`), where the corpus is already the system KB alone.

Typechecking before writing the UAT.

No type errors in the changed code; the only errors are the gitignored `generated/` modules, which a fresh worktree doesn't have. Checking how to produce them for the test run.

Typecheck is clean. Now the UAT. Getting the ledger/catalogue tool names so the "nothing wider" assertion checks them by name.

Writing the workers UAT: it plants a system KB, delegates, and checks the worker's own requests (tools, priming, a real search round-trip, a refused out-of-scope search), plus the no-KB case.

All 5 pass on the first run, so I'll confirm they actually fail without the change (turning the worker wiring off temporarily) and see what the out-of-scope refusal says.

A real scope refusal ("limited to: system. Refused: project."). I'll tighten the assertion to that instead of a loose `/project/` match.

New config UAT and the adjacent Node suites pass (41/41). Now the adjacent workers suites (delegation, system KB, per-business delegation, delegated spend) plus mine.

Two REQ-295 failures. Checking whether they're caused by my change or already fail on the base.

The throwaway worktree didn't pick up tests (likely the symlinked `node_modules`). Instead I'll set my changed source files aside, restore them to HEAD in place, run, then put them back.

zsh didn't split the file list, so tar failed and the chain stopped before any checkout; nothing changed. Retrying with explicit word-splitting.

All 29 pass (263 tests). One more sweep: every workers suite touching knowledge or delegation.

Repo convention is a patch bump of the root `package.json` (now 0.2.419 → 0.2.420). Updating the ticket body first, keeping the existing text and adding what iteration settled.

Ticket body updated. Now bump, commit on the branch.

Committed on the branch. Now lock, merge into `xgd-working`, then mark `free_coded`.

Merged cleanly. Recording the commit on the ticket.

REQ-355 is finished and merged into `xgd-working` as `ee7ebbde84` (version 0.2.420). The ticket is at `free_coded` with the commit and 3 story points recorded. Promoting it to `ready_to_reconcile` is your call.

**What changed:** when a deployment has a system KB, a delegated builder can now search the platform reference, read-only. Its grant covers only the system KB. A search that names the client's `project` KB is refused ("limited to: system").

- **Priming:** the builder gets the reference map and a new rule: before reporting that something can't be done, look it up, and say where the limit was found. The map uses the builder's own provider names (`builder.km.*`). The consultant's map on the Worker also covers the client's corpus, so sharing it would have shown the builder the client's material.
- **No system KB:** the builder is built exactly as before, from the unchanged `builder_priming` order. The version with the reference is a second order beside it, `builder_priming_with_corpus`, the same two-order pattern the consultant uses.
- **Hosts:** both the Worker and the `1c` CLI use one shared helper, `builderKnowledge` in `roles.ts`. The Worker passes only the system KB, never the combined corpus that includes the client's.
- **`host-core.ts`:** the old "no knowledge corpus" comment now states the new rule. Nothing changes for the consultant.

**Tests:**
- **Workers suite (5 UATs):** runs the real route with a planted system KB and checks what the worker is actually sent:
  - it gains only knowledge tools;
  - its own search finds the planted `responsiveLayout` fact;
  - a `project`-KB search is refused;
  - its prompt has the map and the rule but not the document bodies;
  - with no KB, nothing about it changes;
  - it still has no ledger, catalogue or `Delegate` tool.
- **Config suite (4 UATs):** checks the priming configuration directly, including that the role text is the same in both builder orders and that neither consultant order changed.
- I checked that the three positive UATs fail when the wiring is switched off.
- The Node suites that read the priming config (29 files) all pass, as do the workers suites that touch knowledge or delegation, apart from the three failures below.

**Three failures you should know about.** They fail the same way on the unchanged base, so this change didn't cause them:
- Two REQ-295 cases: the framework now adds a `by` field to each check verdict.
- One REQ-296 case: the worker's and the consultant's context limits come out equal from the current backend config.

I saved a note to memory that a fresh `free-*` worktree lacks the gitignored `apps/control-app/src/generated/` modules; they have to be copied from the main checkout before typechecking or running workers tests.

<!-- xgd-chat-end -->