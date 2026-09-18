---
uid: epic-95bc3b15
id: EPIC-19
type: epic
title: Web Builder Experience
created_by: martin-github@westhead.me
created_at: '2026-09-18T18:58:18.644541+00:00'
updated_at: '2026-09-18T19:14:41.396252+00:00'
completed_at: null
last_field_updated: status
status: ongoing
fields:
  priority: medium
  chat_comment: comment-d8169cbf
---

## What this epic is for

The UX and AX (AI experience) of the web builder, worked from the inside out:
first the operator building his own sites with the consultant, then example
sites built end to end through the assist-customer playbook ([[DOC-33]]).

Work arrives as observed friction — a bug, a wrong-feeling reply, a tool that
refuses where it should act, priming that misfires. Each fix is scoped as its
own child ticket and free-coded there; this epic holds the thread, the findings
and the ordering.

## The surfaces in scope

- **The consultant conversation** — priming (`tools/generate/src/cli/ai/priming.json`,
  six entries: role, product-system, km-landscape, purpose, km-mechanism,
  cache boundary; six per-turn reminders), the role's method corpus
  (`kb/system/`, DOC-33/35/46–51 + REF-l1/surface/behaviors), and the tool
  grant in `instances.json` (l1: ReadSite, AuthorPages, ManagePages,
  ManageComponents, WriteConfig, ManagePalette, MeasureDrawings, DrawImages;
  fidelity: SeeSite).
- **The settings assistant** ([[REQ-239]]) — the business's own settings, and
  the domain surface where a deployment manages one ([[REQ-260]]).
- **The builder chrome** — the chat pane, the live re-render after every turn,
  the change signal, uploads and the material describers.
- **Model and cost routing** — which model does the judgement, which does the
  mechanical work. See the audit below.

## Finding 1 — model routing (2026-09-18)

**Opus 5 on the conversation: in place.**
`tools/generate/src/cli/ai/backends.json` declares `claude: {model:
claude-opus-5, max_tokens: 64000}`; `configureProjectBackends` installs it ahead
of every `registerBackend` call in both hosts (`host-core.ts`, the site
consultant and the settings assistant). Every `ClaudeAPIBackend` in this
repository is constructed without a `name` option, so each reads its settings
under the adapter's default name `claude` — the per-site registry name does not
change the model.

**Haiku workers for L1: NOT in place here.** The framework capability exists and
is installed — lagrange-framework REQ-148 shipped the `delegation` surface on
2026-09-11 and the shared store carries it (`DelegationToolbox`,
`delegationInstanceConfig`, `WorkerConfig`, and a `backend_config` that accepts
any backend name, so `claude_worker` is configurable). This repository consumes
none of it:

- `backends.json` declares one backend (`claude`). No `claude_worker`.
- `instances.json` grants `l1` and `fidelity` only. No `delegation`, so the
  `Delegate` tool is never projected into the consultant's tool list.
- `createL1Toolbox` composes L1Toolbox + extra surfaces + ManualToolbox; nothing
  constructs a `DelegationToolbox` or a `DelegationRuntime`.
- `roles.ts` declares two roles (consultant, settings) plus the two describer
  roles in `apps/control-app/src/ai.ts`. There is no delegable worker role with
  its own narrower grant.

Consequence: everything runs on Opus 5 at a 64k ceiling — including the document
and image describers (`describerSession`), whose mechanical digest work reads the
`claude` settings for the same reason the consultant does.

Closing the gap is a child ticket, not this one. Shape: a second registered
backend constructed with `name: 'claude_worker'`; a `claude_worker` entry in
`backends.json` naming Haiku; a worker role in `roles.ts` with its own priming
and its own (narrower) L1 grant; `DelegationToolbox` composed into the
consultant's toolbox over a `DelegationRuntime` whose `workers` map names that
role's backend and `build`; `delegationInstanceConfig([workerRole])` merged into
the consultant's grant, and `ReportDelegatedWork` on the worker's.

## Children

(child tickets listed here as they are filed)