---
uid: epic-95bc3b15
id: EPIC-19
type: epic
title: Web Builder Experience
created_by: martin-github@westhead.me
created_at: '2026-09-18T18:58:18.644541+00:00'
updated_at: '2026-09-18T20:38:20.242027+00:00'
completed_at: null
last_field_updated: body
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

### Adoption constraints (what makes it more than a config flip)

The configuration half is small — a `claude_worker` entry in `backends.json` and
a `delegation` entry in `instances.json`. The code half is real, because
`WorkerConfig` requires `{backend, build}`: the host must supply a function that
builds the adapter around the *worker's own* toolbox. That is a second
`createL1Toolbox` call with a narrower grant and a second registered backend
name — not a reuse of the consultant's.

The worker also needs priming of its own. `priming_without_corpus` (role,
product-system, `site.manual`, cache boundary) is the nearest existing shape: a
worker needs the page vocabulary and its tool manual, and does not need the
consultation method.

Two consequences to decide before adopting, not after:

- **A session record per delegation.** The worker is a whole session, and this
  host's archive is `TicketSessionArchive` ([[REQ-160]]), so every delegation
  creates a `chat` ticket in the tenant's store. `kb/knowledge_bases.json` filters
  the project corpus on `type: [chat, material, reference, brief]` — so worker
  transcripts would join the client's own knowledge base, and their growth would
  ride the `corpus.delta` reminder back into the consultant's turn. Either the
  corpus filter excludes worker sessions, or the client's knowledge base fills
  with machine chatter.
- **The live re-render survives, and that is not an accident.** `SITE_CHANGED` is
  derived from `store.counter(slug)` polled after each `TOOL_ACTIVITY` event on
  the caller's stream. A `Delegate` call is tool activity, so the worker's writes
  are absorbed into the counter jump and the client's pane re-renders with them.
  No extra wiring needed for the site conversation.

### How a worker is prompted (and what this costs us)

Two channels, and only one of them comes from the parent.

**The system channel is the host's.** `_openWorker` calls
`manager.createSession(role, ...)`, so the worker's system prompt is its ROLE's
priming, assembled by the normal path. The parent contributes nothing to it and
cannot: that is what makes "the brief carries intent, the role carries
authority" true rather than aspirational.

**The user channel is the parent's, and it is exactly one turn.** `_runWorker`
calls `manager.promptStream(workerSid, brief(goal, checks))`, where `brief()` is
the parent's `goal` prose verbatim, then the `accept` checks quoted one per line
under an instruction to report each as passed or failed, then one sentence
telling the worker that what it reports is the whole of what the caller
receives. That is the entire crossing. Not the parent's transcript, not the
parent's priming, not the client's words.

**One turn, not a conversation.** The turn contains the worker's whole tool loop,
so it can make many calls — but it never gets a second user message. The parent
cannot iterate with a worker; an underspecified brief comes back thin and the
parent re-delegates.

The consequence for us: **a worker knows only what its role's priming teaches it,
what its surfaces let it read, and what the parent wrote in the goal.** It does
not know what the client said, what was decided earlier, or why. Three things
follow, and each is a decision this adoption has to make:

1. The worker's site binding is host configuration — `config.surfaces` are built
   per delegation, so the L1 surface arrives already bound to the slug. That part
   is free.
2. Whether a worker can search the project corpus is a grant decision. Without
   it, everything the worker needs about the client's brand has to be in the goal
   prose; with it, a Haiku session is reading the client's knowledge base.
3. **The consultant does not currently know how to brief a worker.** Nothing in
   `priming.json` teaches it what a good goal or a good `accept` check looks
   like, and the whole value of the split rests on that skill — the surface's own
   overview warns that re-inspecting everything the worker did moves the tokens
   to the expensive side rather than saving them. Adopting delegation therefore
   includes authoring new priming, not just wiring.

Worker spend is rolled into the caller's ledger, attributed to the delegation, on
every exit path including failure and stop.

### Decision (2026-09-18): parked, and what we decided while parking it

**Not adopting yet.** Build with the consultant first and watch where it writes
long mechanical sequences; those observations should shape the worker's grant and
its brief-writing priming, rather than the shape being guessed now.

**When we do come back, the worker does NOT get the broader knowledge base.** In
this context a worker needs its tool information and very specific instructions
from the parent, and nothing else. If brand context is needed for the work, the
PARENT supplies it in the goal prose — the parent is the session that has it, has
already paid for it, and is the one making the judgement about what matters.

Rationale, so it survives: a worker with corpus access puts retrieval judgement
on the cheap model, re-introduces the expensive reading we were trying to move
off the critical path, and blurs the one clean line this design has — intent
comes from the parent, authority from the role. Supplying context in the brief
keeps the parent accountable for the quality of the delegation, which is where
the skill belongs.

This is a statement about THIS delegate, not about delegation in general. A
different kind of worker — research, summarisation, anything whose job IS
reading — could reasonably be granted a corpus. The L1 authoring worker is not
one of those.

Open when we resume: the corpus-pollution question above (a `chat` ticket per
delegation entering the project KB) may resolve itself if workers are cheap and
short, but it still has to be answered before the first delegation ships.

## Finding 2 — a site's conversation is orphaned when its address changes (2026-09-18)

**Observed:** opening the Lagrange Foundry site in the builder shows an empty
chat pane, though the site was built in a long conversation.

**The conversation is not lost.** It is intact in the local D1 store, homed on a
chat ticket the builder no longer looks for.

**Mechanism.** `sessionIdFor(site)` is `site-${site}`, and `TicketSessionArchive`
finds-or-creates a `chat` ticket by `fields.session_id`. So a session is keyed on
the site's ADDRESS. When the address changes, the lookup misses, and a fresh
empty session is created silently — there is no error, because "no ticket with
this session_id" is indistinguishable from "a new site".

Lagrange Foundry's address has changed twice, leaving three chat tickets in
tenant `biz_5b101742d436573a04a2512fb7ecdbb5`:

| chat ticket | session_id | transcript | when |
|---|---|---|---|
| `chat-d73a11e1` | `site-unnamed` | **26,815 bytes** (+ 224,813 of tool transcript) | 2026-09-11 |
| `chat-b98f4eec` | `site-lagrangefoundry` | 269 bytes — header only | 2026-09-13 |
| `chat-50932534` | `site-site_936dd7c92e5e14df694dd9a80433aa4f` | 313 bytes — header only | 2026-09-14 |

The first is the real build conversation ("Please review the background document
that I uploaded. I want to build an initial site for this company."). It was
started while the site was still called `unnamed`; naming it moved the address to
`lagrangefoundry`, and the later move of site addressing from name-slugs to
opaque `site_<hash>` ids moved it again. The builder reads the third.

**It is not one site.** Every site built before the id migration has the same
shape — `1stcontact` (`chat-5c9fd79b`, 3,666 bytes) and `xgd` (`chat-d53aa031`)
are orphaned the same way, and `gigabytealchemy` lost a `site-gigabytealchemy`
session too.

**Two distinct defects, and they want separate fixes.**

1. *The migration miss.* When site addressing changed, the chat tickets keyed on
   the old address were not re-keyed. This is data repair: set `fields.session_id`
   on the surviving chat ticket to the new address, rewrite `id` and `backend` in
   its `xgd-session` header, and remove the empty ticket that would otherwise
   collide on the find-by-session_id lookup.
2. *The design that made it silent.* Keying a conversation on a mutable address
   means any future rename or re-addressing orphans it again, with no error and
   no trace in the UI. The durable identity is the SITE, and the chat ticket
   already knows it. Either the session id is derived from something immutable,
   or the site row carries its chat ticket uid and the lookup goes through that
   — `TicketSessionArchive` already supports addressing a session by ticket
   (`_chatUids`), so the second is close to free.

Defect 2 is the one worth fixing properly; defect 1 is a one-off repair the
operator can approve per site.

## Children

- [[BUG-116]] — Chat sessions orphaned by the site-address migration. Finding 2's
  repair: verify the opaque-key model has no stragglers, re-home the orphaned
  conversations (three cases, only one of which is mechanical), survey and fix
  production, and make an orphan discoverable instead of silent.
