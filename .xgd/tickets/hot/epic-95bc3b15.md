---
uid: epic-95bc3b15
id: EPIC-19
type: epic
title: Web Builder Experience
created_by: martin-github@westhead.me
created_at: '2026-09-18T18:58:18.644541+00:00'
updated_at: '2026-09-30T20:32:55.956886+00:00'
completed_at: null
last_field_updated: body
status: ongoing
fields:
  priority: medium
  chat_comment: comment-d8169cbf
  epic_children:
  - request-ba1e2212
  - bug-3d91a05e
  - request-e1a43d83
  - bug-3625c6ff
  - doc-bfc310fc
  - request-9ae1dee9
  - ticket://lagrangefoundry/lagrange-framework/request-c773ad35
  - ticket://lagrangefoundry/lagrange-framework/request-8d422274
  - ticket://lagrangefoundry/lagrange-framework/request-80bd1bd8
  - ticket://lagrangefoundry/lagrange-framework/request-b73b52da
  - request-95b2b06a
  - request-c4ab7564
  - doc-777c6f44
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

## Finding 3 — the repro console's 22 findings, and what they have in common (2026-09-18)

Three logged AI rounds against `gigabytealchemy.ai` (plus one earlier) have filed
[[REQ-265]], [[REQ-269]], [[REQ-270]], [[REQ-271]] and [[BUG-106]]–[[BUG-111]],
and appended evidence to [[BUG-100]] and [[BUG-24]]. $22.28 and 246 turns on
`claude-opus-5[1m]` for the three logged rounds. The tickets themselves are good
— dependency-ordered, every claim quoted from a file or a command the round ran.

**22 distinct defects, classified by where in the pipeline they sit:**

| where | n | what |
|---|---|---|
| the instrument reports pass/clean when it measured nothing or measured wrong | 5 | BUG-106, BUG-100, BUG-109, BUG-110, BUG-111 |
| the two sides are measured by different procedures | 4 | REQ-269 #5, REQ-270 #2/#3/#4 |
| the capture loses information the page had | 5 | padding, line-height fraction, href, transparent band fill, alpha (BUG-24) |
| the comparator has no axis for it | 2 | role/a11yRole (BUG-107), band surface fill (REQ-271 #2) |
| the fold is wrong | 2 | half-leading (REQ-265 #1), scrim as band base (REQ-271 #3) |
| **L1 genuinely cannot express it** | **2** | placeholder colour (REQ-265 #2), heading role (REQ-269 #4) |
| process / harness | 2 | stale bundle (REQ-270 #1), self-contradicting prompt (BUG-108) |

**The headline: 2 of 22 are L1 capability gaps.** Eleven are defects in the
instrument that measures fidelity. The loop is working exactly as designed and
what it is telling us is that the ruler is not yet trustworthy — so it keeps
finding ruler bugs instead of L1 bugs. Fixing them one at a time means paying an
Opus round to rediscover the next one.

### The four patterns

1. **A false pass is the norm.** REQ-269 opens "a pass verdict at mean 0.31 hides
   five residuals"; REQ-271 "a pass at mean 0.31 with 14 deltas". BUG-106 reports
   `0 deltas, 0 unmatched` having measured nothing; BUG-107's missing comparison
   made 11 lost headings read as zero deltas; BUG-110's verdict ladder ignores
   the value gate's severity entirely; BUG-111's unpaired section is "reported
   nowhere the gate reads". One design choice generates all of them: **when the
   instrument cannot see something it answers pass rather than unknown.**

2. **The reference side and the reproduction side are read by different code.**
   REQ-270 #3 states it outright — "the two sides are read by two different
   procedures". Different populations (#4), a band's paint read from the fill box
   on one side only (#2), bands on one side and none on the other (REQ-269 #5).
   Every one of these is unauthorable if a single extractor runs over both sides
   and the comparison is field-for-field over one schema.

3. **The capture is a lossy bottleneck and everything downstream inherits it.**
   Padding, the line-height fraction, `href`, alpha, transparent-vs-white are one
   defect shape: the extractor stores a rounded or defaulted value instead of the
   true one. No fold fix and no L1 axis can recover what the capture discarded.

4. **A frozen bundle makes landed fixes invisible, so rounds re-diagnose them.**
   REQ-271 confirms the ranked region score is "again 1051.13, region for region"
   and that 13 of its 14 deltas are REQ-269's already-ticketed residuals seen
   through a newly-sharpened instrument. Round 3 spent $4.91 and 56 turns largely
   re-confirming frozen items.

### Getting ahead of it — in this order

1. **Unfreeze the loop (REQ-270 #1).** A bundle that records which extractor took
   it, and a console that re-captures when the extractor has moved. Until this
   lands every capture-side fix is silently inert and every round pays to
   rediscover it. This is the rate limiter, and it is not a fidelity defect at
   all.
2. **Make `unmeasured` a verdict rather than a pass.** A gate carrying an explicit
   unmeasured set, which cannot return pass while that set is non-empty, converts
   six of the 22 from silent to loud and prevents the next six.
3. **Make the two sides symmetric by construction.** One extractor over both
   sides, one schema, field-for-field. Retires pattern 2 as a category rather
   than as four tickets.
4. **Audit the capture's completeness once.** Mechanically enumerate, per
   reference bundle, the CSS properties the page uses against the properties
   `capture.json` records. One pass over two or three references converts five
   rounds of discovery into one list.
5. **Split the queues.** Instrument repair restores trust in the ruler; L1 axis
   work raises the product's ceiling. Only the two class-2 items do the latter,
   and they are the ones that make client sites better. They should not queue
   behind ruler repair.

**Stop using delta count as the progress metric.** Landing BUG-107 took the
reported deltas from 1 to 14. That is the instrument getting sharper, not the
reproduction getting worse. The metric that means something is the unmeasured set
shrinking.

## Finding 4 — an in-flight turn does not survive the client leaving (2026-09-18)

Operator navigated away from the Lagrange Foundry business mid-turn and lost the
exchange. Checked: the site's transcript (`chat-50932534` /
`comment-40c95649`, 57,348 bytes) holds 36 turns ending on a COMPLETE user/
assistant pair. There is no orphaned user turn and no partial reply. **The
in-flight turn left no trace — including the operator's own message.**

### What is already durable, and what is not

[[BUG-46]] solved half of this and the router says so at `router.ts:5326`:

> A reload aborts the SSE, the next `controller.enqueue` throws on the cancelled
> stream, that runs the generator's `finally` — where the library appends
> `turn_end` and awaits `sync()` […] Registering the stream's completion means
> the drain and this audit flush both outlive the client that walked away, which
> is what makes a COMPLETED turn durable under a reload race.

And it names precisely what is left:

> It does not make an in-flight turn durable — that is the junction's business,
> and in this Worker the junction is RAM (`ai.ts`), so an isolate evicted
> mid-turn still loses it. Rendering from the junction is what narrows the
> window; **only a Durable Object would close it.**

Confirmed against the code: `ai.ts:202` and `:598` pass `lib.memoryJunctions()`,
and `apps/control-app/wrangler.toml` declares no durable objects and no
workflows — `main = "src/worker.ts"` and nothing else. So the turn is driven by
the fetch request and the live record lives in the isolate. Both end when the
client goes.

**But "terminated, not completed" understates it, and the operator was right to
push back** (2026-09-18: *"terminated would be one thing, my prompt and the
partial response I saw were lost too — much more serious"*). The store shows why.

The turn ran from 22:18:34 to 22:24:12 — nearly six minutes — and at 22:24:46
BOTH artifacts were written. The `tool_transcript` grew to 350,925 bytes, ending
on a `record_decision` that committed a substantive decision to the engagement
ledger. The `chat_transcript` went from version 20 to 21 and **gained nothing**.

So an interrupted turn does not merely stop: **it commits its work and discards
its conversation.** The ledger records a decision the transcript has no memory of
anyone making. That is the transcript and the world disagreeing, which is a
different and worse thing than a turn that stopped early. Filed as [[BUG-121]].

### The operator's position (2026-09-18)

> *"I think the user will expect an open turn to run to completion even if the
> page is refreshed or navigated away from even if the browser is closed."*

Agreed, and the losing of text is the least of it. Three reasons this matters
more here than in an ordinary chat product:

1. **Turns have side effects.** A consultant turn writes pages, palettes and
   pictures. A turn killed after three of seven edits leaves the site
   half-changed — and the change signal fires, so the pane re-renders and the
   client SEES their site move with no reply explaining why. Nothing records that
   the turn was interrupted.
2. **Turns cost money.** A killed turn has already paid for its thinking and any
   picture it generated. Same family as [[BUG-119]]: spend for an artifact nobody
   receives.
3. **Turns are long.** This is a tool loop against a browser and a store, not a
   two-second reply. The window in which leaving costs you something is most of
   the turn.

### What closing it takes

The reattach half is ALREADY BUILT and was written for exactly this. `tailSession`
(`host-core.ts`) is a cursor-based subscriber over the junction, explicitly *"safe
to do on any page load"* and *"never a second producer"*. What is missing is
underneath it:

- **A driver that outlives the request.** A Durable Object per session is the
  natural shape: a session already has one identity (`site-site_<id>`), turns must
  be serialised per session anyway — the transcript comment's compare-and-set
  proves it — and the junction wants to live beside its driver. `ctx.waitUntil` is
  not enough and BUG-46 already spent it on the drain.
- **A durable junction**, so a second isolate can read the live turn. DO storage
  if the DO is the driver.
- **A resume contract on load**: does this session have a turn in flight, and from
  what cursor. `tailSession` answers it once there is a durable producer.

### The asymmetry is the defect, and it is separable

The two halves of a turn have different durability because they are written by
different mechanisms: `_applyTools` uses `append_body` and lands as it happens,
while the prose transcript is a read-modify-write folded from a RAM junction. So
losing the junction does not lose the turn — it loses only the half without
consequences. BUG-46's note anticipated the hole but not that it would be
one-sided.

That integrity defect does not stop being one if turns later run to completion: a
turn can still fail, and its two halves must still agree. So [[BUG-121]] items
1–3 should land ahead of the Durable Object work rather than behind it.

### Cheaper intermediate, worth doing either way

**Fold the user's message before the turn starts.** Today an interrupted turn
costs the operator their own words as well as the reply. Persisting the user turn
up front means a lost turn costs only the answer — the question survives, is
visible on reload, and can be re-sent with one click. That is a small change, it
is independent of the Durable Object work, and it removes the most irritating
half of the loss.

**And say that a turn was interrupted.** A turn that ends without `turn_end` is
knowable; the transcript should show it rather than leaving a gap the client reads
as the assistant ignoring them.

## Finding 5 — images accumulate in flight because the bound they had was removed (2026-09-19)

The consultant reported this itself, accurately, in the Lagrange Foundry
transcript. Its claims check out against the code, with one correction.

### Yes, the images really are resent

The Messages API is stateless: there is no server-side conversation, so every
request carries the whole `messages` array. `claude_api.js:313` appends
(`state.messages.push(...)`) and `toAnthropicContent` renders an image block as a
real Anthropic image block. There is no cap, no slice and no pruning anywhere in
that file. **So every screenshot taken in a session goes over the wire again on
every subsequent turn of that session.**

### The bound the design assumed no longer exists

`content.js:232` states the intended behaviour:

> an image is visible to the model for the remainder of the segment that sent it
> and not beyond it.

That was true when sessions recycled. [[REQ-126]] removed recycling —
`session.js:13`:

> Context is constant now […] so nothing recycles, and a session that never
> recycles has exactly one conversation.

One conversation per session means "the remainder of the segment" is **the rest of
the session**. The sentence in `content.js` describes a bound that was deleted
elsewhere, and nothing replaced it.

### What IS bounded, and why that makes the behaviour confusing

The DURABLE record is fine. `redactContent` writes
`[image: image/png, 48231 bytes, fp:1a2b3c4d]` instead of bytes, so the transcript
and the ticket never carry base64. And `seedDialogue(state, window, ...)` bounds
what is carried when a conversation is REBUILT.

So the window applies at seed time and never again:

- **Long-lived isolate** — every image accumulates and is resent every turn.
- **Evicted isolate** — the conversation is rebuilt from the durable record, where
  every image is already a text placeholder, so they all vanish at once.

Context cost therefore depends on isolate lifetime, which nothing in the product
models or reports.

### This is what makes the recovery loop structural

The `interrupted-turn` reminder is verbatim (`priming.json:80`):

> Your previous turn in this conversation did not finish […] **Look at the site
> before you answer**, and pick up from what you find rather than from what the
> conversation says.

After a truncation the conversation is rebuilt, so the images are genuinely gone —
the model *cannot* see the site, and is then told to go and look. It screenshots;
the new images accumulate in flight; the next turn truncates sooner. **The loop is
not merely a badly-worded prompt: the redaction removes the evidence and the
reminder mandates re-acquiring it.**

### The architecture, stated exactly (2026-09-19)

One API request carries four things: the assembled **priming** as `system`
(bounded by `maxPrimingChars`, 140,000 — *"roughly 70% of a 200k window"*, while
this project runs Opus 5 at 1M, so priming is not the pressure); the **messages**;
the projected **tools**; and the **reminder**, appended to the last user message
by `turnTail` (REQ-144, for cache-prefix stability).

`messages` is populated by two different paths, and only one of them is bounded:

- **Cold start** — `seedDialogue(state, window, BASE_MESSAGES)`. The window is
  `DEFAULT_WINDOW_TURNS = 40` user/assistant PAIRS, each capped at
  `turnMaxBytes`, computed by `window()` in `transcript.js` from `session.turns`
  — i.e. from the durable record, **where images are already `[image: …]`
  placeholders**.
- **Warm** — `state.messages.push(...)` and send the lot. No window, no cap, no
  compaction.

**Compaction does not exist on this path.** `compaction: true` is declared only by
`claude_code.js` and `claude_code_interactive.js`; `ClaudeAPIBackend` declares
`streaming, interrupt, vision, promptCache` and contains no occurrence of
`compact` or `occupancy`. The manager's *"the one mechanism left is compaction, and
it is the backend's rather than ours"* is therefore true of the CLI backends and
vacuous for the API one.

**So "context is constant, not grown-then-cut" (REQ-126) is a property of the
SEED, not of the live conversation.** On the API path a warm conversation is
precisely grown-and-never-cut. The window bounds what a conversation STARTS with;
nothing bounds what it becomes.

That is the existential half, and it is not specific to images — images are just
the heaviest thing flowing through an unbounded channel. Tool results do it too.

### Upstream audit (2026-09-19) — the installed copy IS the latest

Checked properly rather than assumed. A recursive hash comparison of
`node_modules/@lagrangefoundry/ai/src` against
`lagrange-framework/components/ai/js/src` reports **zero files unique to either
side and zero differing files** — byte-identical. The framework tree is on
`xgd-working`, 162 ahead of origin, so it is the newest work that exists.

**And the framework HAS done the context work.** It is a coherent design and all
of it is installed:

| | |
|---|---|
| REQ-124 | session summary store — standing frame + append-only log |
| REQ-125 | transcript turn addressing, so a turn can be fetched by id |
| REQ-126 | turn-bounded history window; summary / pointer / window providers |
| REQ-128 | priming moves to the system channel |
| REQ-129 | compaction integration — observe `compact_boundary`, steer with `/compact` |
| REQ-143 | cache the message history; **make token spend observable** |
| REQ-144 | deliver per-turn tiers past the message history |

**The hole is precise, and it is upstream.** REQ-126's window and REQ-129's
compaction are the two mechanisms that bound a conversation, and **neither binds a
warm API conversation**:

- the window is applied at SEED only;
- `compaction: true` is declared by `claude_code.js` and
  `claude_code_interactive.js` and by nothing else. It was designed for "a backend
  that keeps its own conversation" — and `ClaudeAPIBackend` keeps its conversation
  too, in `_state`, but never got an implementation.

So the API path has neither mechanism. That is a **lagrange-framework ticket**, not
a 1c one: the gap is in the component, and every adopter of the API backend has
it.

### The fuel gauge already exists and we simply do not show it

REQ-143 landed per-request token accounting: `ClaudeAPIBackend.usage(ref)` returns
one record per request, and `usage.js` exposes `usageRecord`, `turnUsage`,
`turnSpend` and `sessionUsage`. **The host already knows what every turn cost in
input tokens** — which is the context size. The consultant's *"I am driving with no
fuel gauge"* is therefore a SURFACING gap in this repository, not missing framework
capability, and is much cheaper than it sounded.

### Correction: we are NOT stuffing, and I quoted a ceiling as a cost

`maxPrimingChars = 140,000` is a CEILING, not consumption, and citing it as though
it were the seed's size was wrong. Measured:

| part | chars |
|---|---|
| static priming entries (role, product-system, purpose) | 5,870 |
| reminders (static parts) | 293 |
| `km.landscape` source — `kb/system/awareness.md` | 5,621 |
| projected tool manual — granted groups, one line per tool | ~18,900 |

≈31k characters, ≈8k tokens, fixed and fully cached (the `cache_boundary` entry is
last, so everything above it is in the cached prefix).

**That is the KB-shaped priming, not the old document-stuffing.** The priming's own
words are *"Your method is written down […] Read it before you start rather than
improvise from these few lines"*, with `km.landscape` and `km.mechanism` supplying
the map and the retrieval instructions. No design document is inlined.

The largest single block is the **tool manual at ~19k**, and that is already the
frugal form — one line per tool, full entries fetched on demand. It is a surface
projection rather than stuffed prose, but it is the thing to look at if the seed
ever needs to shrink.

### The intended design is BUILT UPSTREAM, in both halves — and unadopted here

The operator described the intent (2026-09-19): *"rather than a stop-the-world
compacting moment — (1) an ongoing summary consisting of a fixed-length
conversation summary updated as appropriate and an unbounded log of conversation
decisions; (2) give the session tools to read chunks of these and its old history
on demand."*

**Both halves exist in the installed framework, and match that description almost
word for word.**

**(1) Storage — `summary.js`, REQ-124.** *"Two zones, because the polarity
differs."*

- **Standing frame** — the `framing` FIELD on the comment, rewritten in place,
  `DEFAULT_FRAME_MAX_BYTES = 4000`, always delivered in full. Its cap is an error
  and never a truncation, because *"a frame silently losing its last sentence
  loses the rejections first, which are the whole reason the zone exists."*
- **Log** — the comment BODY, append-only, `ENTRY_MARKER`-delimited, written
  through `append_body` so a frame rewrite and a log append cannot clobber each
  other.

Stored as a `chat_summary` comment on the ticket that homes the session. The
module states the stake plainly: *"if the summary is good the rest is plumbing,
and if it is thin nothing downstream recovers."*

**(2) The tools — the `agent` surface, three groups:**

| group | operations |
|---|---|
| `InspectContext` | `priming`, `reminder`, `context`, `history`, `summary` |
| `OperateContext` | + `history_full`, `role_priming` |
| `MaintainSummary` | `summary_frame`, `summary_log` |

`history` reads turns *"by position or by turn id"*; `summary` reads the frame and
the log; `summary_frame` replaces the frame and `summary_log` appends one entry —
so the session maintains its own summary rather than a batch job doing it. The
surface's own overview says what it is for: *"the summary is the part of this that
survives when the verbatim conversation does not."*

**1stcontact composes none of it.** `createL1Toolbox` pushes the L1 surface, the
extra surfaces the router supplies, and `ManualToolbox`. There is no
`AgentToolbox`, no `agent` entry in `instances.json`, and no occurrence of
`InspectContext` or `MaintainSummary` anywhere in this repository.

**This is the third upstream capability built and never adopted here**, beside
delegation ([[REQ-148]] → EPIC-19 Finding 1) and the development surface
([[REQ-147]] → [[REQ-273]]). The pattern is worth naming on its own: the framework
is ahead of its adopter, and the gap is consumption rather than capability.

### Four questions answered against the code (2026-09-19)

**1. Has BUG-45 landed? YES, in the code 1c runs.** Its status is
`ready_to_reconcile` — free-coded on `xgd-working`, not yet reconciled to main —
but the installed store is byte-identical to that tree, so the fix is live here.
`PrimingAssembly.offsets` now filters volatile sections before computing:

```js
get offsets() {
  const volatile = new Set(this.volatileNames)
  return this.boundaries.map((k) => this.sections.slice(0, k)
    .filter(({ name }) => !volatile.has(name)) …)
}
```

**So `priming.json`'s note — *"`session.summary` waits on lagrange-framework
BUG-45"* — is STALE.** The blocker cleared and nothing here noticed.

**2. Is summary generation implemented but unwired? YES — and it is
model-driven with a per-turn nudge**, which is what "updated as appropriate"
requires:

- storage — `SummaryStore`: frame in the `framing` field (4,000-byte cap), log in
  the body (append-only);
- writing — `agent` surface, `MaintainSummary`: `summary_frame`, `summary_log`;
- delivery — the shipped product tier's `session-summary` entry, placed AFTER the
  cache boundary so rewriting it cannot invalidate the cached prefix;
- the nudge — `summary_trigger` prose: *"Keep your summary current as you work […]
  The frame is what survives when the recent exchanges do not, so anything you
  would need after losing them belongs in it."*

1c wires none of the four.

**3. Are search and chunk-level access available? YES, over three stores** — and
one of them 1c already has:

- **the corpus** — knowledge surface `ReadKnowledge`: `search`, `chunk_search`
  (*"Search at section granularity, so a hit names where in a document the answer
  is"*), `outline` (*"List a document's sections, with the offsets to read each
  one"*), `get` (*"whole or one span of it"*), `changes`. **1c grants this
  today**, and because the project KB corpus filter includes `type: chat`, past
  conversations are already searchable at chunk granularity;
- **this session's own history** — `agent.history` by position or turn id, plus
  `history_full`, framed by the `transcript_pointer` prose. **Not granted;**
- **the work log** — tool calls recorded separately, described by
  `tool_transcript_note`, with truncation markers that act as pointers to the
  full record. **Not granted.**

So the gap is SELF-inspection, not retrieval. The consultant can search the
client's corpus but cannot read its own past turns or its own work log.

**4. Does LF need to implement truncation? NO.** Positional truncation already
exists — `window()` over `recentTurnPairs` + `truncateTurns`, 40 pairs with a
per-turn byte cap. The only framework gap is that **it is applied at seeding and
never again**, so a warm API conversation is unbounded. That is one narrow change
(apply the existing window and `redactContent` to `state.messages` in flight), not
a new mechanism.

### THE ANSWER TO "can we jump straight to truncation?" — NO (today)

Asked by the operator, 2026-09-19. We accumulate **no summary context at all**:

- **No `SummaryStore` is constructed anywhere in this repository.** `SessionManager`
  takes `opts.summary`; nothing in `host-core.ts` or `ai.ts` passes one.
- **Zero `chat_summary` comments exist in the whole store.** The only comment kinds
  present are `chat_transcript` (8), `material_text` (9), `tool_transcript` (4).
- **The priming deliberately omits the summary tier**, and says why:
  *"`session.summary` waits on lagrange-framework BUG-45."*

**And we do not have the other escape hatch either.** REQ-126 says what falls
outside the window is *"reachable two ways: the summary the session maintains, and
the transcript it can address by turn id."* `priming.json` records that this host
grants no operation that reads a turn by id — so **1c has neither of the two
recovery paths the window design assumes.**

The window is therefore not a window onto a larger recoverable context. **It is a
cliff.** Truncating today would silently and permanently drop everything past it.

**Ordering consequence:** a recovery path has to exist before truncation can be
turned on. For a conversation that lives as long as the website — rather than as
long as a feature — the summary is the right one, because the transcript-by-id
path only helps a model that knows which turn to ask for.

**[[BUG-45]] (lagrange-framework) is the blocker**, and it is narrower than it
sounds: cache offsets are computed over the full assembly while the backend is
handed only the stable priming, so a breakpoint lands mid-section once anything is
volatile. Status `ready_to_reconcile` — fixed on working, not yet released.

### Priming ("stuffing") is still the current upstream design

DOC-22 — *Session Priming Configuration: three tiers, static text and providers* —
is current, and nothing supersedes it. REQ-128 (system channel) and REQ-144 (tiers
past the message history) REFINE it; they do not replace it. So the assembly in
`priming.json` is not legacy, and moving off it would be new framework design.

**It is also not this problem.** The priming is ~21KB of prose against a
140,000-character ceiling and a 1M-token model window, it is stable, and it sits
in the cached prefix by construction (the `cache_boundary` entry is last). It is a
fixed, cached cost dwarfed by one screenshot. Worth its own ticket if we want to
move to retrieval-shaped priming; it will not move this needle.

### The seams needed for a fix already exist

`window()` bounds a turn list and `redactContent()` replaces image bytes with a
fingerprinted placeholder. Both are written, tested and in use — on the cold-start
path. Applying them to `state.messages` in flight is reuse, not new machinery.

### The consultant's own recommendations, which are sound

1. **Backpressure.** *"I do not experience the cutoff […] I am driving with no fuel
   gauge."* Nothing reports remaining budget on a tool result.
2. **Name the cheap instrument in the recovery text.** Replace "look at the site"
   with `list_changes`, which answers "did it land?" for almost nothing.
3. **Make images expire, or price them.**
4. **Let something else hold the state** — a compact authoritative page summary
   arriving with the turn, removing the re-read ritual.

### The one I would add, and would do first

**Redact in flight the way the durable record already does.** Keep the last N
image blocks live and rewrite older ones to the same `[image: …, fp:…]` placeholder
inside `state.messages`. It makes in-flight behaviour match the rebuild behaviour
the design already chose, it bounds session cost independently of isolate
lifetime, and the fingerprint means the model can still tell that it looked and at
what — which is the part that would otherwise drive it to look again.

**Correction to the consultant's account:** it said images "never leave". True in
flight; on a rebuild they leave all at once. That asymmetry is the defect, not the
accumulation alone.

## Children

- [[REQ-283]] — The consultant keeps and consults its own memory: wire the
  `SummaryStore`, compose the `agent` surface (`InspectContext` +
  `MaintainSummary`), adopt the product tier, and delete the stale "waits on
  BUG-45" note. **The precondition for any bounding being safe.**
- [[REQ-284]] — The consultant can see its own context pressure (surface the spend
  REQ-143 already reports) and the `interrupted-turn` reminder stops naming the
  most expensive instrument. Small, independent, landable on its own.
- [[REQ-285]] — The page arrives with the turn: a bounded, authoritative state
  digest, so the consultant never has to look to orient. The consultant's fourth
  recommendation, and the only one that removes the NEED to re-read rather than
  reducing its cost.
- [[REQ-286]] — Drop the browser quota. It counts page loads, and what is scarce
  is context: a capture costs ~0 tokens and is charged eight, while a picture is
  free at the meter and rides in every turn after. Removal, not a smaller number —
  it comes back as a rate limit only if evidence ever asks for one. Supersedes
  [[REQ-206]]'s rate-limiting decision and its two budget UATs.
- [[BUG-129]] — The builder refused to open: `MAX_PRIMING_CHARS` was 60,000, sized
  when the projected manual was ~11,000, and the deployment's grant now assembles
  to 65,925. Raised to the framework's own 200,000 — the seed is in the cached
  prefix and paid once, so the ceiling was throttling something neither per-turn
  nor scarce. The half that matters: the existing cap assertion runs against the
  CLI grant and stayed green through the outage, so the new UAT is in the workers
  suite where the real grant exists. Free-coded 2026-09-20, `f39a431275`.
- lagrange-framework **REQ-168** — bound a warm API conversation: apply `window()`
  in flight, age images out to pointers after **2** turns, give the pointer a
  host-supplied way back (the REQ-149 `display` pattern), **and ship the occupancy
  gauge** as a `session.budget`-shaped volatile provider. Filed upstream; no code
  here.

### The consultant's four recommendations, and where each landed

| its words | where |
|---|---|
| "Give me backpressure […] I am driving with no fuel gauge" | LF REQ-168 §4 — framework, because only the adapter has the numbers |
| "Rewrite the recovery instruction" — name `list_changes` | [[REQ-284]] §2 |
| "Make screenshots visibly costly, **or** make them expire" | both halves: expiry in LF REQ-168 §2, cost-at-point-of-call in [[REQ-284]] §1 |
| "Let something else hold the state" | [[REQ-285]] |

All four are covered, and [[REQ-283]] underwrites them by making what falls out of
the window recoverable.
- [[REQ-281]] — Delete a Library item from its detail pane. `archive` is already
  the declared erasure path; placement COPIES the bytes, so deleting a placed item
  does not take it off the site — which is the one thing the wording has to get
  right.
- [[REQ-282]] — "Not on the site" is a state, not an error. The warning predicate
  detects a placement failure that [[BUG-47]] made impossible: nothing is attempted
  at upload, so the badge fires on every site-role photo from the moment it lands.
  Accent pill when placed, grey when not — keeping REQ-181's rule that colour is
  never the only carrier.
- [[REQ-280]] — A shared name for a Library item (`IMAGE-5`, `DOC-7`). Today the
  consultant's handle is the uid and the Library shows the title, so the two share
  only the ambiguous pair — three generated variants in the operator's own
  catalogue carry identical titles. Kind-derived prefix over the existing
  `human_id` number, landed in the catalogue item, the Library row AND as an
  accepted input, or it is not shared.
- [[BUG-121]] — An interrupted turn commits its work and discards its
  conversation. The integrity half of Finding 4, with the store evidence; items
  1–3 (equal durability, fold the prompt first, mark an interrupted turn) are
  separable from and should precede the durable-turn work.
- [[REQ-217]] — *Chat: an image a turn produced appears in the conversation.* Already
  built and free-coded (2026-09-11, `215187d64c`, 0.2.169) — the display handle,
  the URL factory and both UATs are in. Revisited 2026-09-18 because the operator
  still has to open the Library to see a generated picture: diagnose whether the
  model is not pasting the line, the running build predates the commit, or the
  call had no `materialUrl`. Its body is frozen at `ready_to_reconcile`, so the
  finding is COMMENT-3142 and any priming change needs a new ticket.
- [[REQ-273]] — The assistant can report a defect: adopt the upstream
  `development` surface (`report_bug` / `request_capability` /
  `add_ticket_detail`), which files into the PRODUCT's project rather than the
  client's store. Today the consultant has `ReadTickets` and nothing else, so
  three defects reached us as prose in a chat pane.
- [[BUG-117]] — `corpus_unreadable` is a catch-all: a transient failure is
  reported as a permanent deployment fault, with the message explicitly telling
  the caller not to retry.
- [[BUG-118]] — a generated picture's result never says where it went, so the
  assistant looked in the site's assets, found nothing, and told the client it
  was blind. Everything needed to avoid it is written in the library surface's
  overview, which is not in the default one-line projection.
- [[BUG-119]] — a store failure after image generation discards the bytes with no
  write-ahead and no recovery path: it burns the generation cost and hands back
  nothing. Same session as BUG-117, so check for one shared cause.
- [[BUG-116]] — Chat sessions orphaned by the site-address migration. Finding 2's
  repair: verify the opaque-key model has no stragglers, re-home the orphaned
  conversations (three cases, only one of which is mechanical), survey and fix
  production, and make an orphan discoverable instead of silent.


### Finding 6 — the consultant cannot file a defect, because filing is a property of how the dev server was launched (2026-09-20)

[[REQ-273]] landed and is wired correctly end to end. The consultant still holds
only the client's five read operations, and said so when asked to file a bug
directly.

There is one real constraint here and the rest is an accident. The Worker runs in
workerd, which has no `child_process`, so it cannot run `xgd` itself and some
Node process must do it on its behalf. That is all that is genuinely hard —
`xgd ticket create` needs no identity, no credential and no session.

What we built on top of it is the defect: the Node process was hung off
`1c builder`, given a random port and a bearer minted per run, and those values
handed to wrangler as `--var` at launch. So filing is a property of HOW THE DEV
SERVER WAS STARTED rather than of the deployment, and any launch that is not
`1c builder` silently turns it off. `filing.ts` defends the per-run values by
saying a committed one would be stale — which is circular, since a value is only
stale because it was randomised, and the "developer running wrangler by hand gets
no filing surface" it names as the safe outcome is the defect itself.

`bin/access-sim` is what made that bite: getting a real identity locally means
launching wrangler by hand with a third `--env-file`, and `devEnvLayering` has
only two slots. Access is not the cause, only the thing that forced a hand
launch; anything else that did would break filing identically.

The absence is silent. The Worker composing no surface where it has no project is
correct, and the model never hearing about an ungranted capability is correct —
but together they leave an operator unable to tell a missing capability from a
mis-launched dev server.

[[BUG-124]] carries the fix: make the address a SETTING rather than a launch
artefact — fixed port, token in `.dev.vars`, service startable on its own — so no
launch path can turn filing off and `1c builder` stops being load-bearing.
- [[BUG-124]] — Filing is a property of how the dev server was launched, so the
  consultant silently has no filing tools. Fixed loopback port and a token in
  `.dev.vars` in place of a random port handed over as `--var`, a filing service
  that can run independently of `1c builder`, and an absent filing surface made
  legible somewhere other than a banner printed by the command that was not run.


### Finding 7 — the bugs the consultant wrote up but could not file (2026-09-20)

Taken verbatim from the Lagrange Foundry session, now that [[BUG-124]] has
established why none of them reached the tracker on their own. Each was traced to
the line before filing.

- [[BUG-126]] — `edit_image` has never worked in this deployment and cannot have.
  `generatedMaterialStore` returns `Pick<TicketStore, 'create' | 'attach'>` and
  upstream's edit path calls `get`, `attachments` and `read_attachment`. The
  narrowing is correct and the `Untyped` plugin boundary is where a two-method
  object meets a five-method expectation in silence. The derived grant makes it
  worse: the surface declares the operation, so it is granted, so a capability we
  can never fulfil is offered every turn. Five attempts spent proving it.
  `list_image_edits` refusing site files is the second half of the same client
  request — change a picture that already exists — and fixing the crash alone
  leaves that wall standing.
- [[BUG-127]] — capture is unusable against real sites. `egressGuard` counts
  DISTINCT ORIGINS in a set named `documents`, against a cap named
  `MAX_REDIRECTS = 5`, on every request including subresources — despite the
  comment above it stating the opposite rule. Any site with a CDN and a font host
  is over the cap, and once `tripped` is set nothing is allowed for the rest of
  the capture, so later navigation passes have their MAIN DOCUMENT fulfilled with
  `403 refused by egress policy` and screenshot as a black rectangle. Separately:
  a refused capture returns the success shape with a `refusals` list rather than a
  verdict, so the budget is spent before the truth arrives. The SSRF control
  (`classifyUrl`) is untouched by any of this and must stay so.
- [[BUG-128]] — the per-turn state digest lags the session's own writes. This is
  [[REQ-285]]'s promise inverted: the digest exists because the session was
  confabulating state, and a stale digest is that same failure carrying the
  system's authority. One cause verified — `digest-core.ts` caches on
  `SiteStore.version` and asserts it "cannot be stale by construction", but
  `d1r2-store.ts:753` moves `counter` without touching `version`. One cause open —
  the engagement ledger lagged by exactly one too, and it does not share that key.
  The consultant named the consequence itself: this is the mechanism meant to say
  *"your client edited something, go and look before you write."*
- **lagrange-framework BUG-65** — image generation: `transparency: true` is
  accepted, sent on the wire as `background: "transparent"`, and comes back as a
  drawing of white paper with a drop shadow. Three generations burned. Filed
  upstream because the backend is upstream's; no code here. Folded in with it: no
  portrait aspect ratio in the declared set, and a content refusal that reaches
  the client with no reason attached. One shape — what the backend produced and
  what the caller was told come apart, and the caller pays for the difference.

### Finding 8 — the capture budget meters the wrong currency (2026-09-20)

The exhaustion the consultant hit was real; the instrument that produced it is
wrong in a way raising the number would not fix. Checked against what each
operation actually returns:

| | browser acquisitions | tokens into the conversation |
|---|---|---|
| `capture_site` | **8** | ~0 — a bundle name, a url and counts |
| `screenshot` of an already-captured page | **0** | a whole image, **re-sent every turn after** |
| `compare` | 0 | numbers only |

So the most token-expensive operation in the system is exempt by design —
`browserBudget`'s doc says so as a feature — and the cheapest one, going to a
webpage, is charged eight. Three further problems compound it: [[REQ-126]] removed
session recycling, so a per-session quota on a site's permanent builder
conversation is a *lifetime* quota; the count is in-memory per isolate, which its
own doc admits makes it a burst bound that resets on an unobservable event, so
nothing about it is learnable; and the cost the header names — metering,
concurrency cap, acquisition rate limit — is a rate, while the guard is a
quantity. In the observed session sixteen of the forty went into [[BUG-127]]'s
black rectangles.

The decision is to remove it rather than redesign it: *drop the browser quota
until it becomes a problem — we should focus on tokens, that is our scarce
resource to manage.* If runaway browser spend ever appears, it returns as a rate
limit with evidence attached. [[REQ-286]] carries the removal; the metering that
matters is already in flight in [[REQ-284]], LF REQ-168, LF REQ-169 and [[REQ-283]].


### Finding 6 addendum — the fix landed; this clone was never provisioned (2026-09-20)

[[BUG-124]] is committed (`d5ace65da7`, 0.2.289, `free_coded`) and the code is
correct end to end: `developmentFor` composes the surface on
`DEVELOPMENT_TICKETS_URL` alone, `provisionFilingVars` mints the bearer into
`apps/control-app/.dev.vars` once per clone, `1c filing` runs the listener
independently of the dev server, and `--var` is gone from every launch path.

The consultant is still read-only because **nothing has provisioned this clone
since the fix shipped**:

- `apps/control-app/.dev.vars` carries no `DEVELOPMENT_TICKETS_URL` and no
  `DEVELOPMENT_TICKETS_TOKEN` (mtime 2026-09-10; the commit landed 12:22 today).
- Nothing answers on `127.0.0.1:8790` — the listener has never been started.
- The dev server on 8788 and `bin/access-sim` on 8799 are both up and both
  predate the commit, so the Worker read no address at boot regardless.

The Worker therefore reads no address, composes no surface, and the derived
grant offers no filing operation — which is exactly the correct behaviour for a
deployment with no project, and indistinguishable from it.

Recovery is two steps, in order: `./bin/1c filing` (writes the two lines, starts
the listener, waits), then restart the dev server so wrangler re-reads
`.dev.vars`. `bin/access-sim` is unaffected and can stay up.

**The residue worth watching.** Provisioning is a side effect of running one of
two commands, and the operator's working launch path is neither of them —
`bin/access-sim`'s recipe launches wrangler by hand. So a clone can sit
unprovisioned indefinitely with nothing saying so, which is Finding 6's silence
one remove: the fix removed the coupling between filing and *how* the dev server
was launched, but left provisioning coupled to *which command* was typed. If this
recurs, the fix is for `filingStatus` to be read somewhere an operator sees
regardless of launch path, or for the two lines to be provisioned by something
every path runs.

### Finding 9 — builder UX items raised while working the sites (2026-09-20)

- [[REQ-287]] — the upload confirmation names the stored filename rather than the
  catalogue label. `materialEnvelope` does not carry `label`, so the client
  cannot print one; the neighbouring `POST /api/material/role` route returns the
  same material through `readMaterial`, which does project it. An omission that
  predates [[REQ-280]] and was never revisited when labels arrived. Null labels
  keep the filename; the gate on "is it on the site" stays; the filename stays on
  the first line, since recognising the file and referring to it afterwards are
  different questions.
- [[BUG-131]] — "Open in a new tab" in edit mode opens the EDIT channel, so the
  new tab shows the outline markers. DOC-28 §10 already specifies the draft
  render URL for both modes, and the rationale is why it has to be: the control
  exists to see the page without the builder's distortions. `openInNewTabAction`
  takes the href off `panel.getSrc()`, whose stated invariant is that the tab and
  the iframe can never disagree — an invariant that was safe with one channel and
  became wrong when [[REQ-116]] added the second. In edit mode they MUST disagree.
- [[REQ-288]] — `transform` should accept a static translate in percent of the
  node's own size (`translateXPct` / `translateYPct`), applied at paint time with
  layout unaffected. A pixel offset is a different number at every width whenever
  the node is responsive, so it needs per-width keyframes and drifts between
  them; a percentage of the node's own box resolves at every width with one
  value. Raised by Lagrange Foundry's caption plaques, which should hang half off
  the picture's bottom edge and cannot, because there is currently no way to
  overlap two elements except by pinning coordinates — and pinned keyframes
  cannot track a reading column that WRAPS rather than slides. Also settles paint
  order for overlapping siblings and that a node translated outside its parent's
  box still paints.

### Finding 10 — the dev server is served from the branch other sessions merge into (2026-09-22, re-diagnosed 2026-09-25)

`wrangler dev` watches the working tree. `packages/site-schema`, `tools/generate`
and `apps/control-app/src` are all in the Worker's import graph, so any write to
them rebuilds and REPLACES the Worker. A replaced Worker does not drain: an
in-flight turn's isolate simply stops existing, so no `finally` runs, no
`turn_end` is appended, no spend row is written and nothing folds.

Turns now run 2–9 minutes because they delegate to `claude_builder` workers, and
code lands on `xgd-working` every few minutes. That is the "every other turn"
cadence the operator reported. It is not a framework fault and it is not the
filing surface: it is one checkout serving both roles.

Short term the amplifier is removed by serving the builder from a checkout
nobody merges into. [[REQ-318]] is the proper fix — "deployed to, not edited
into".

### Finding 11 — where the hours actually go (2026-09-23)

All 85 user turns of the Lagrange Foundry conversation, classified:

| | turns | share |
|---|---|---|
| building the site — creative, editorial, structural | ~35 | 41% |
| product defects hit and reported | ~28 | 33% |
| re-sends caused by lost turns | ~6 | 7% |
| correction loops — the consultant did something other than what was meant | ~14 | 16% |

Metered: **$1.27 and 4.5 minutes per turn** (delegating turns 8.9 min / $1.83;
non-delegating 1.6 min / $0.89). Context is ~93% cached — 1.5M cache-read against
116K fresh input on the large turns — so the marginal cost of a turn is output
and cache-creation, not context length. **Making the consultant do more per turn
is therefore cheap**, which is the economic case for building rather than
describing.

The defects and re-sends go away. The 16% does not, and the transcript names its
causes: a narrow instruction taken as licence for a structural rewrite; a change
described without looking at it first; and three styles offered in prose for the
operator to choose between sight unseen. The durable fixes are therefore
DEFAULTS, not training — show don't ask, look before you claim, edit narrowly,
and make a long turn legible while it runs.

### Finding 12 — the durable junction is inert on a warm isolate, and a lossy junction hides a complete archive (2026-09-25)

A turn was lost mid-session and the panel came back missing the whole of that
day's conversation. Nothing was lost from storage; two defects compose.

**The incident, from the store and the dev-server log.** 22:20:10 the prompt
route opened a turn (`turn_log` row, `pending_turn` written). 22:23:28 the merge
of `free-BUG-145` into `xgd-working` rewrote `host-core.ts` and `spend-core.ts`;
wrangler rebuilt and replaced the Worker (`worker.js` mtime 15:23 PDT,
`ProxyWorker/pause`/`play` at 22:23:29). The isolate died mid-turn — Finding 10
exactly. `turn_log` still reads `ended_at` null, `pending_turn` still reads
`open`, and there is no spend row.

**Defect A — `prepare()` fails on every warm isolate, and every junction write is
then silently dropped.** The dev log carries, once per prompt:

    junction durable:site-site_936dd7c…: could not be prepared — Error: Cannot
    perform I/O on behalf of a different request. … (I/O type: OutgoingFactory)

`durableJunctions(env.SESSION_JUNCTION)` is built once per isolate per business
(`CHATS` in `router.ts`), and each `DurableJunctionStorage` caches the
`DurableObjectStub` it was given on first use. workerd forbids using an I/O
object created in one request's context from another request's, so the stub works
for exactly the request that created it and throws for every later one.
`prepare` catches, sets `adopted = false`, and `queue()` returns early when
`!adopted` — so appends land in the in-isolate mirror and NEVER reach the object.
The class comment calls that "degrades to `memoryJunctions()`", which is true and
is the problem: [[REQ-307]] is inert on every request except the first after a
restart — which is the one moment it has nothing to protect.

Measured: the object's junction holds **89 turns, only 4 of them live**, and ends
at 22:11:14. The archive holds **102**. Thirteen of the day's turns were written
to a mirror that died with its isolate.

**Defect B — a junction that exists wins over a more complete archive.**
Upstream's `manager.transcript()` seeds from the archive only `if (!log.exists())`.
The object's junction does exist, so on reload the panel is painted from the
89-turn junction and the 332,827-byte, 102-turn `chat_transcript` comment is
never read. A lossy junction does not merely fail to protect the conversation —
it HIDES the good copy. That is why "the entire session so far" disappeared while
nothing was actually lost.

**Nothing is lost and the panel is recoverable.** The archive is a strict
superset — all four live junction turns appear in it verbatim — so discarding the
object's junction for that session makes `transcript()` re-seed from the archive
and restores all 102 turns.

**Fix shape.** (A) Keep the mirror across requests — it is pure memory and is the
reason the store is isolate-scoped at all — but obtain the stub per use from the
retained namespace rather than caching it, and drain the write-behind chain
inside the request that appended. (B) A junction must not be preferred over an
archive that is ahead of it: reconcile the two on adopt, or make "exists" mean
"is at least as complete as the archive". (B) is upstream's.

**Two side observations from the same log.** A merge at 22:35 left conflict
markers in `package.json` and the dev server built against them
(`Expected string in JSON but found "<<"`), so a half-finished merge can break
the builder outright rather than only restarting it. And every request is logged
twice, with two `dev-*` build directories both rebuilding — there appear to be
two `wrangler dev` instances against `apps/control-app`.


**Correction to the last observation above.** The doubled request lines are NOT
two `wrangler dev` instances against `apps/control-app`. `bin/dev up` starts four
services (filing, builder, public site, access-sim), and the second wrangler is
the public site on 8787 — a different Worker, with its own bindings and no
`SESSION_JUNCTION`. The duplicate lines carry the SAME `trace_id`, so one request
is being emitted twice by the app logger, not served twice. Worth tidying, but it
is cosmetic and nothing in this finding depends on it. The conflict-markers
observation stands: at 22:35 the dev server built against a root `package.json`
holding `<<<<<<< HEAD` and failed outright (`Expected string in JSON but found
"<<"`), so a half-finished merge in the served checkout can break the builder
rather than only restart it.


**And the premise that made this a surprise: the frozen dev environment exists
and is not what `bin/dev up` serves.** [[REQ-318]] landed (`eea3301a13`, on
`xgd-working`): `bin/deploy --env dev` bundles to `apps/<app>/.dev-snapshot/` and
`1c dev serve` runs `wrangler dev --no-bundle` against it on **8789**, so editing
a source file changes nothing about what is served until the next deploy — the
immune boundary Finding 10 asks for. `bin/dev up` DOES build that snapshot
(`.dev-snapshot/` mtime 21:40:07, from the deploy step), and then starts
`bin/1c builder` — plain `wrangler dev` on 8788, watching the tree — and never
`1c dev serve`. Nothing was listening on 8789 during the incident; 8788 was, and
it restarted four times in thirteen minutes. So the operator was on the watching
builder while believing he was on the frozen one, which is why a merge three
minutes into his turn could reach him at all. Same shape as this epic's other
adoption gaps: the capability is built, and the path everyone actually runs does
not use it.


### Finding 12 — filed (2026-09-25)

- [[BUG-149]] — **Defect A**, here. The Durable Object stub is captured in
  `DurableJunctionStorage`'s constructor and reused across requests, which workerd
  refuses; `prepare` catches, `adopted` goes false, and `queue()` drops every write
  in silence. [[REQ-307]] is live only on the first request a fresh isolate handles.
  Measured: 4 of 17 post-seed turns reached the object. Child of this epic.
- lagrange-framework **BUG-69** — **Defect B**, upstream. `transcript()` reads the
  archive only `if (!log.exists())`, so a junction that is behind hides a complete
  archive — from the panel AND from `seedDialogue`. Filed there; no code here.
- [[BUG-150]] — **the reason a merge could reach a live turn at all**, filed under
  [[EPIC-16]] because it finishes that epic's §L1. `bin/dev up` builds the frozen
  snapshot and then starts the watching builder; every entry point that serves from
  the changing tree goes.

The three are ordered by what they cost. BUG-150 stops the restarts. BUG-149 makes a
restart survivable. BUG-69 makes a junction that is behind harmless rather than
destructive. None of them substitutes for another.


---

### Finding 13 — the playbook and the engagement did not run the same session (2026-09-26)

Measured against the Lagrange Foundry ledger (`chat-50932534`, 47 decisions, 102
turns) and [[DOC-33]] as it stands. Three questions from the operator: does LF's
shape match the stages, is variant comparison in the playbook, and did the
"engagement" thinking ever land. Answers: no, no, and no.

#### 13.1 The order was inverted, not merely shuffled

DOC-33's spine is decide-then-render: brief → positioning → architecture → copy →
assets → system → layout. LF ran render-then-decide.

| DOC-33 stage | LF decisions | first appears at |
|---|---|---|
| 0 Intake & ingestion | — | never recorded |
| 1 Purpose / audience / scope / restraint | D1, D2 | **#1** |
| 2 Positioning & differentiation | — | **never** |
| 3 Content architecture | D17, D20, D43 | **#17** |
| 4 Copy | D24 | **#24** |
| 5 Assets | D6, D7, D8, D10, D19 | #6 |
| 6 Design system | D3, D4, D5, D11, D18, D31, D35–38, D39, D40 | **#3** |
| 7 Layout & composition | D9, D12–16, D19–23, D25, D29, D30, D32, D33, D42 | #9 |
| 8 Signature moment | D16, D41, D46 | #16 |
| 9 Critique | — | **never** |
| 10 Publish & handoff | D44, D45, D47 | #44 |

**The third decision in the engagement was the palette.** The content-architecture
decision arrived at #17, after sixteen visual ones. Copy got one entry out of
forty-seven.

#### 13.2 The two stages that never happened are the two with no artifact

Stage 2 (positioning & differentiation — the stage DOC-31 says all copy descends
from, and whose §6 text is the most emphatic in the document) produced **zero**
decisions. Stage 9 (critique) produced zero.

Every stage that renders something happened. Neither stage that only *decides*
something did. That is the same selection pressure that made the consultant fetch
`REF-l1` thirteen times and [[DOC-33]] never: **what does not move the page does not
happen.** A stage with no artifact is not a stage, it is an intention.

#### 13.3 "Locked" did not survive contact with the page

Stage 6's gate is *"the system is locked and everything downstream draws from it."*
In practice the system was re-opened at least five times:

- **D3 → D4**: the entire palette reversed (near-black + gold → parchment + sanguine),
  after the dark direction was built and judged "Matrix-style".
- **D11**: ground colours shifted again, to close the gap between page and plates.
- **D18**: the spacing rhythm settled — fifteen decisions after the palette.
- **D31**: typefaces chosen (Spectral + Inter). **D39–D40**: changed again (Cormorant
  Garamond for wordmark and hero) at decision *forty of forty-seven*.
- **D35 → D36 → D37 → D38**: one section-rule device, four goes; D38's own text reads
  *"settles a device that took four attempts"*.

22 lines of the ledger carry supersession language. This is not indiscipline. A
design system cannot be locked before there is a page for it to be a system *of* —
DOC-33 places the lock where it does for anti-anchoring reasons, and the anchoring
argument is answered better by plurality ([[DOC-35]] §9.5) than by sequence.

#### 13.4 The plain pass never happened — and had already been retired on paper

[[DOC-33]] §8 still specifies an undesigned monochrome stage between copy and design
system. LF opened in full colour at D3. [[CHAT-21]] Session 2 had already concluded
*"the plain pass dies"* — it existed to solve anchoring-by-deferral, and plurality
solves that better without the failure mode of a novice seeing a grey page and
assuming we broke it.

So LF matched the **revised** thinking and contradicted the **document**.

#### 13.5 Variant pages: discovered in-session, blocked by the product, and absent from every doc

- **D26** — *"Design comparisons for the Lagrange Foundry site cannot be shown as
  separate pages. A newly added page arrives with no interior and no operation can
  create one."*
- **D27/D28** — reversed once REQ-300/REQ-301 landed mid-engagement: home (control),
  `/style-a` Facsimile, `/style-b` Gallery, both full copies restyled.
- **D34** — *"Martin chose Gallery outright"*, the two alternates deleted.

The single largest decision in the engagement — the whole site's treatment — was
settled in **one** turn by pointing, after thirty turns of incremental argument. That
is the mechanism working.

**[[DOC-33]] contains zero occurrences of variant, alternate, side-by-side, or
comparison-as-artifact.** §7.1 says *"offer two or three genuinely distinct
directions"* and never says *build them*. [[DOC-49]] §3 — which the consultant
actually reads — says *"put up two or three options that differ in kind"*, the same
ambiguity. Both are readable as "describe three options in prose", which is what LF
got for its first thirty turns.

The distinction that matters: **the comparison must be the artifact, not a
description of one.** A client evaluating a rendered page needs no vocabulary; a
client evaluating a paragraph about a page needs ours.

D26 also records the cost of this being undesigned: the product had no page-copy
operation because nothing had asked for one.

#### 13.6 The ledger cannot express what actually happened

[[DOC-33]] §3.4 specifies every entry as `### <decision name>   [<section>]` under
eleven named sections (§3.5, first of which is `Session — stage, act, sittings,
scope band`).

LF's ledger is **47 flat entries titled "Decision 1"…"Decision 47"**. Zero section
tags. No stage tracking. No `Supersedes:` link, though 22 lines carry supersession
prose. D27 and D28 are the *same text twice*; D45 and D47 near-duplicate.

This is not non-compliance. `record_decision` has no field for a section, a state,
or a supersedes link — a consultant with DOC-33 memorised could not have complied.
The playbook specifies a structured instrument; what exists is a text box and a
numbered list.

#### 13.7 The engagement thinking is written down, and not where the consultant can reach it

It exists, fully worked, in [[CHAT-21]] Session 2 — six numbered points, with named
mechanics: *anti-anchoring by plurality not deferral*; *hard-to-reverse things earn
conversation, easy ones get shown*; *fun is the extraction mechanism* (**"a bored
client gives short agreeable answers — 'yeah, that's fine' is the sound of a session
failing"**); *every turn moves the page*; *build by resolution not addition*; *the
carousel as a standing comparison surface*; *deliberately-wrong extremes to bracket
the space*; *plausible-but-wrong real English, never Lorem Ipsum, because greeking
extracts no corrections*. Plus Brenda Laurel's *Computers as Theatre* frame:
constraint is what makes it enjoyable; a *procedural* structure is the enemy, not
structure itself.

That session ended: *"DOC-33's own restructure is deferred and scoped in DOC-35 §10."*

[[DOC-35]] §10.2 names four specific changes — §5 re-segmented on diagnosis, stage 1
gaining *"is that the right objective"*, the free consultation becoming diagnostic,
restraint becoming a pointing exercise. **None were made.** DOC-33's last edit is
2026-09-08. A third doc was proposed in-session — *"The Session as Experience —
engagement as an extraction mechanism"* — and never written; no such doc exists
between DOC-35 and DOC-56.

The one piece of engagement reasoning DOC-33 *does* carry is §8's *"it makes the Act
III reveal genuinely dramatic — the before-and-after happens inside the session,
which is a large part of what the client is paying to experience"* — attached to the
plain pass, the exact mechanism CHAT-21 retired. DOC-33's only engagement argument is
banked on the thing that was killed.

#### 13.8 DOC-33 is reachable in principle and unreachable in practice

It is in `kb/system/`, in the manifest, and indexed. Across 102 LF turns: 1,017 tool
calls, 43 knowledge retrievals, **none about method**; `KnowledgeGet` ran 21 times, 13
of them for `REF-l1`; DOC-33 was never fetched.

`kb/system/awareness.md` — the landscape primed into every turn — describes 12
documents in 6 territories. **DOC-33's title appears nowhere in it**, and no validated
search access point names its content. The nearest territory's entry point is
[[DOC-50]] and its access points are *"Designing the site"*, *"running the session"*,
*"what can be changed"*. A consultant asking how a consultation runs lands on
[[DOC-49]].

The landscape is machine-generated from the corpus, so this is not an authoring
oversight to fix by hand — whatever replaces DOC-33 must be written so its territory
description names *acts, stages, what to do first*, or it repeats.

#### 13.9 What this implies

DOC-33 has now been contradicted by three independent passes: [[CHAT-21]] Session 2
(motivation and fit), [[DOC-35]] §10 (the weld between decision-set and order), and
the LF engagement (observed behaviour). All three say restructure, not amend.

What a revision has to carry, beyond DOC-35 §10.2's four:

1. **Separate the decision set from the order.** The decision set is invariant
   (DOC-35 §10.1); the sequence is not, and LF's sequence was a legitimate one.
2. **Variant pages as the primary decision instrument**, up front — with the
   plurality dose from DOC-35 §9.5 (six / three / two by persona) and the
   hard-to-reverse-vs-cheap curve from CHAT-21 point 2 governing *what* is varied.
3. **Every stage needs an artifact, or it will not run.** Positioning and critique
   are the test case: give them something that renders, or accept they are optional.
4. **Retire the plain pass** in the document, as CHAT-21 already did in fact.
5. **Move or drop the design-system lock.** Locked-at-stage-6 was violated five times
   in one engagement; the anti-anchoring job it was doing belongs to plurality.
6. **Engagement as extraction**, not as polish — the strongest claim of the three and
   the one with no home today.
7. **A ledger that can say what happened**: section, state (`inherited` / `open` /
   `locked` / `parked` / `client-call`), and `supersedes`. §5's whole routing
   mechanism depends on fields `record_decision` does not have.
8. **Reachability is part of the deliverable.** A playbook nobody retrieves is
   indistinguishable from one nobody wrote.

Nothing filed. This is analysis pending the operator's call on shape.


---

## Finding 14 — The two-agent proposal (Alice / Bob), measured against what already exists

The operator's proposal: **Alice**, the craftsperson — the existing consultant on an
Opus-class model, judgement and opinions — and **Bob**, an executive assistant on a
cheap model that tracks progress against a plan, drives check-ins and provides the
executive container for the conversation. Plus (1) a shared project data structure
holding decisions, a task list and a plan, and (2) interaction widgets either agent
can insert into the chat stream.

Three of the four pieces already exist in part. Measured state, 2026-09-27:

### 14.1 The two-model topology is already live — as delegation, not as an executive

| | |
|---|---|
| `backends.json` → `claude` | `claude-opus-5`, `max_tokens` 64000 — Alice |
| `backends.json` → `claude_builder` | `claude-haiku-4-5`, `max_tokens` 32000 |
| `delegation.json` | `enabled: true`, `workers: { builder: { backend: claude_builder } }` |

REQ-295 adopted lagrange-framework REQ-148's `delegation` surface, which Finding 1
of this epic recorded as built-upstream-and-unconsumed. So the expensive-judgement /
cheap-construction split shipped. **Its direction is downward**: Alice holds the
engagement and hands bounded pieces of work to a worker whose system prompt is its
role's priming and whose only input from Alice is one brief turn (goal + `accept`
checks). The worker cannot converse, cannot see the client, and reports once.

Bob is a *different* topology, not a second instance of this one. A worker is
subordinate and transient; an executive is peer and durable.

### 14.2 Where the decisions actually live — the operator's question

**The chat ticket.** Not a comment, not a separate ticket.

| what | where |
|---|---|
| engagement ledger (`### Decision N`) | the `chat` ticket's **body** |
| standing note | `fields.frame` on the same chat ticket |
| feed cursor / unaccounted turn | `fields.kb_cursor`, `fields.pending_turn` |

`ledger-core.ts` records why the body: the knowledge component indexes a ticket's
title and body and **does not index comments**, so a ledger in a comment would be
unsearchable and a chat ticket with an empty body would contribute a content-free
vector to the client's corpus. `fields.frame` is the framework's `SummaryStore`
frame zone re-homed onto the same ticket (REQ-283) — rewritten in place, capped via
upstream's own `checkFrame`, raising rather than truncating.

Consequences for a shared project structure:

- **There is no plan, no task list, no position, and no state on a decision.** LF's
  ledger is 47 flat `Decision N` entries — no `section`, no `inherited`/`open`/
  `parked`, no `supersedes`. Finding 13.9 item 7 is the same gap seen from the
  playbook side.
- **The identity is the conversation, and the engagement outlives it.** DOC-33 §2:
  Act I "runs once per client, ever." The LF engagement spans days, many sittings
  and several lost sessions. A plan keyed on the chat ticket dies with the chat
  ticket — and this epic has watched that ticket brick twice (Findings 12, and the
  D1 ceiling work) and be repaired by hand once (BUG-116).
- So the structure's home is a **question to settle before anything is built**:
  business, site, or conversation. Analysis favours the business — it is the only
  identity that matches "once per client, ever" and survives a lost conversation.

### 14.3 The widget channel exists end to end, and 1stcontact adopts none of it

lagrange-framework REQ-14 built it:

| layer | artifact |
|---|---|
| stream protocol | `stream.js` `cardEvent(cardKind, payload, {id})`; `response.js` `addCard` |
| resume | `manager.answerCard` — answers an interactive card, resuming the paused turn |
| client registry | `webui-chat/src/cards.js` — `createCardRegistry`, kind → renderer, unknown kind renders a visible non-throwing fallback |
| panel wiring | `mountChat({ cards, cardRegistry })`, `getCards()`, `answerCard` hook |

It is vendored into this repo at
`apps/control-app/dist-assets/webui/webui-chat/src/cards.js`. **1stcontact registers
zero renderers and emits zero card events** — `createCardRegistry` / `card_kind` /
`cardRegistry` appear nowhere in `apps/control-app/src/`. Fifth instance of this
epic's standing pattern (after delegation, the development surface, agent/summary,
and the product tier).

**The one genuine gap.** The only emitter is `interactive.js` — the bidirectional
Claude Code CLI backend, where a permission prompt or `AskUserQuestion` arrives as a
protocol event and maps to card kind `claude_code_question`. That is the "User
Questions" the operator remembers, and it belongs to the *CLI* path. `ClaudeAPIBackend`
— what this product runs on — has no card emission path at all.

For the API backend the natural shape is different and simpler: **a tool that posts a
card and whose result is the client's answer.** The model already understands
call-a-tool-get-a-result; the pause is the tool call, and no new turn-suspension
concept is needed on the model's side. That is the framework piece to build.

### 14.4 Design position on the division of labour

Recorded as analysis, not as a decision:

1. **Bob should not be in the conversational path.** A broker between Alice and the
   client adds a round trip to turns that already run 2–9 minutes, and hands the
   product's hardest judgement — register — to the cheap model. What makes Alice good
   is unmediated contact with the client's own words and hesitation.
2. **Bob's output is state, not prose.** He reconciles what happened against the plan
   and writes task state and position into the shared structure; that structure is
   injected into Alice's next turn as *fact*, through the per-turn digest channel
   already proven to work (`page-digest`). Finding 13's measurement is the argument:
   coaching prose is ignored (2 of 102 turns carried process language) while the page
   digest is demonstrably worked from.
3. **Write authority splits by kind.** Alice owns decisions — judgement. Bob owns task
   state and position — bookkeeping. Bob must not be able to open or settle a
   decision, or design calls land on Haiku.
4. **One shared representation, not two.** A planner whose picture comes from a summary
   while the craftsperson's comes from the live conversation will diverge, and the
   client will hear it. Bob keeps no notes of his own.
5. **Bob may narrate the wait.** The one place a second voice is clearly additive:
   nine silent minutes currently read as failure, and a cheap fast agent saying what
   Alice is doing costs almost nothing. Narrator of a wait, never broker of an exchange.
6. **The standing plan belongs in a panel, not the stream.** A stream is chronological;
   a plan is current. A to-do list pasted into history is stale misinformation six
   turns later, and a stream widget demands a response where a panel can be glanced at
   and ignored — which is what makes it flexible structure rather than hoops. Reserve
   in-stream widgets for *moments*.
7. **A widget's value is that it is answerable without vocabulary** — the register-free
   channel. Two rendered pages and "which of these?" needs no shared language, which is
   Finding 13's variant result generalised. It must never be a form: the client can
   always ignore it and type instead.
8. **Restrict questionnaires to facts only the client has** — hours, phone number,
   service list. Never to taste; CHAT-21 and Finding 13 both say taste is settled by
   choosing between rendered artifacts, not by answering questions about them.
9. **Bound what Alice may create.** Measured over one engagement: 61 standing-note
   rewrites and 45 decisions. Given a task list she will generate forty items unless
   the shape forbids it — tasks should mostly be instantiated from the plan, with a cap.

Nothing filed. Analysis pending the operator's call on (a) the structure's identity,
(b) whether Bob ever speaks, (c) panel vs stream for the standing plan.


### 14.5 Revision — group chat conceded; the topology question

Recorded after the operator pushed back on 14.4. **Positions 1 and 6 of 14.4 are
withdrawn as stated.**

**The pipeline / group distinction.** 14.4's objection was to a *pipeline* —
client → Bob → Alice → Bob → client — where Bob relays and therefore filters. It does
not apply to a *group*: all three on one stream, both agents speaking directly, Bob's
turns concurrent with Alice's rather than in series. The operator's shape is the
second, the human precedent (consultant + EA in the room) is real, and the round-trip
and register-filtering objections dissolve. Conceded.

Retained gain: **the client can address Bob**, which makes plan correction a cheap
remark to the assistant rather than a challenge to the consultant's judgement.

**Asymmetric context is the load-bearing requirement.** Group chat alone does not
deliver the operator's stated goal (freeing Alice's context from "what comes next") —
if Bob's clerical turns land in Alice's history at full fidelity, Alice's context grows
and now carries process chatter. A group chat *in the UI* need not be a group chat *in
the context*: the client sees three participants; Alice receives the client verbatim
plus plan state as compact fact, and not Bob's transcript. The rule is **filter the
agents, never the client** — Alice's value is unmediated contact with how the client
said it, so that is the one thing no composition may compress.

**Cards.** Non-interactive cards conceded — the framework already documents `id` as
"empty for display-only", so a card rendering structured data is first-class. Two facts
found: `getCards()` returns `{id, element}` and the panel retains the element, so a
card *can* be mutated in place; but transcript replay goes through
`appendMessage(role, markdown)` — **markdown only** — so cards are absent from history
on reload. Hence: **a card is a projection of the shared structure, not a message.**
Live update and reload-survival both follow from that; neither is available to a
one-shot stream event. This is what makes the operator's pieces (1) and (2) one thing.

**Feature checklist conceded** — requirements, not taste. Surviving caution: a checkbox
list gives every item equal visual weight, implying equal cost, and "contact form" and
"recurring payments" are not the same size. Frame as *what we build first*, not a
catalogue.

### 14.6 Bob as interrogator — a better remedy than Finding 13 proposed

The operator's observation: *"If I ask the consultant 'do you really think this looks
like a premium site?' I get some great answers — but I can't train the user to keep
pushing like that. However, I can get Bob to do it."*

This supersedes 14.4's remedy. Finding 13 diagnosed Alice as **positionless** and
proposed supplying state and expecting leadership to follow — a *supply-side* fix that
depends on Alice choosing to lead. A challenge is a position-forcing device: "does this
read premium?" leaves no way to answer without taking a position on the artifact. So
this is a **demand-side** mechanism for the same diagnosis, and it is the stronger bet
for a measured reason — the capability is already observed (the operator gets good
answers when pushing), so the mechanism only has to *trigger* it rather than create it.
Finding 13 measured the supply-side approach failing: 2 of 102 turns carried process
language from coaching prose.

**Why a cheap model can do this.** Posing a good challenge does not require design
judgement; answering one does. "The brief says premium — does this page read premium?"
is a scripted move against a stated goal and an artifact. That asymmetry is what keeps
taste on Opus while the pressure comes from Haiku.

**Unclaimed additional benefit: it models the behaviour for the client.** A client
watching Bob ask "does this read premium?" learns that this is a thing one may ask.
That addresses the register problem socially rather than by inference, and it is the
answer to "I can't train the user" — you do not train them, you show them.

**Two failure modes.**
1. *Ritual.* A challenge that always fires becomes noise and Alice learns a ritual
   defence — both models pattern-match. So challenges must be anchored to an artifact
   and a stated goal, and must be able to **not fire**.
2. *Visible correction.* The client watches their consultant being pushed. Read one way
   that is rigour; read another it is a consultant who needed correcting. Which it is
   depends entirely on Bob's register — he must challenge against *the brief*, never
   against his own opinion of the site.

### 14.7 The four topologies

Vocabulary from the operator: a **chat session** is an LLM history — stored here as the
whole session file in a `chat_transcript` comment on the chat ticket (`ai.ts`,
`chat-copy.ts`), so the operator's description is exactly this repository's mechanism.
An **agent** is model + session. The postulated tool: X may (1) append turns to Y's
session as a participant and (2) be notified when Y's session changes.

| | room is | consequence |
|---|---|---|
| **1** | Alice's session | every Bob turn is in Alice's context at full fidelity — defeats the context goal unless 4 is applied. Alice is structurally host, so "who answers" defaults to her. **Only incrementally buildable option**, and reversible: switch Bob off and the product is exactly today's. |
| **2** | Bob's session | right economics — the cheap model holds the history, the expensive one is summoned. But **Alice loses continuity**: a briefed summons destroys the unmediated contact that is her whole value, and whoever composes her brief is judging "what matters" on Haiku. The Wix-ADI failure shape: the cheap orchestrator decides what the expensive designer may know. |
| **3** | nobody's — a durable artifact both participate in | cleanest; makes 4 the normal mechanism rather than an exclusion list, since each agent's view is *already* a projection. Forces the addressing discipline to be designed explicitly instead of falling out of who owns the room — a cost, but that is the hard problem and 1 and 2 both hide it behind an accident of ownership. Most work. |
| **4** | variant | reframe: not *excluding* messages but *composing* each participant's view. |

**Analysis favours 3, reached by starting at 1.** Build 1 because it is incremental and
reversible, but treat the room as an artifact from day one, with Alice's session a view
that currently happens to be complete — then 4 is a dial rather than a refactor.
Starting at 2 makes an architectural bet on the cheap model's judgement that is hard to
undo. Note also that 1 and 2 both *become* 3 once 4 is applied: filtering Alice's view
concedes that the room is not her context.

### 14.8 Primitive (2) already exists, and its design note constrains the room

REQ-160 / `session-delta.ts` is the notification primitive in general form: a cursor
over the change feed, delivering a per-turn delta **separately from the description**,
because — its words — *"a map is a description, not a notification."*

Two lessons transfer directly:

- It **rejected a change-log ticket** (DOC-39 §5.1) for reasons that apply to a written
  room: rewritten on every append, a compare-and-set contention point, unbounded growth
  in one body. So topology 3's room should be **derived — a cursor over the transcript —
  rather than a shared mutable object.** The feed is complete because it is derived from
  the corpus rather than written beside it.
- Its known gap is that the feed is *reliably additive and unreliably subtractive*. A
  chat room is purely additive, so that gap does not bite here.

### 14.9 The loop hazard, inherent to the postulated tool

Primitive (1) plus primitive (2) is a cycle: Alice appends → Bob is notified → Bob
appends → Alice is notified → … Two agents that can each wake the other have no natural
stopping point, and with Bob's purpose being to *push*, the pressure is toward more
exchanges rather than fewer. This needs a turn-taking rule at the UX level and not only
a spend cap — e.g. a user message opens a round, Bob may challenge once per Alice turn,
and Alice's answer closes it. Unbounded agent-to-agent chatter in front of a waiting
client is the failure the client actually sees.

Nothing filed.


### 14.10 Decisions carried from conversation (2026-09-26 → 2026-09-28)

Settled across the turns between 14.9 and here, and recorded because the body is the
durable record and these were argued once:

- **Topology 2 — Alice is a guest in Bob's room.** Bob (the cheap model) holds the
  transcript; Alice (the expensive model) posts into it. The room is therefore not a new
  object: it is the `chat_transcript` comment that already exists in production, reload-safe,
  already carrying the ledger. The framework's `group_surface.json` / `group.js` room is
  **topology 3** (the room is nobody's context; every member pulls) and is not adopted —
  it generalises turn-order, nomination, membership and rounds over an arbitrary roster,
  and we have three fixed participants with a human who talks whenever he likes.
- **Two conclusions worth stealing from that component rather than its code**: a `pass`
  must not advance the pointer (so "nothing from me" costs the others no context), and the
  chair must hold **no domain in the room** — REQ-154 §3's reason being that a chair with a
  stake routes toward its own domain and summarises toward its own conclusions. That is an
  independent arrival at why Bob holds no design opinion.
- **Alice posts when the shared structure changes**, not on ambient progress: a divergence
  from the plan, or a milestone. A milestone *is* a write to task state, so Bob's plan card
  ticks over during Alice's turn from the same structure he reports from — no second surface.
  Milestones are worth posting only where the client could still usefully redirect the
  remaining work; one on the last task is nearly pointless.
- **The queue is Alice's mailbox, not a freeze on the room.** Bob answers his own part
  immediately. Bob speaks only when he *takes an action* (with a one-time exception for
  teaching the mechanism) — which makes his silence informative.
- **The queue affordance is already built client-side, upstream.** `webui-chat` holds
  `queued[]`, paints pending bubbles `is-pending is-queued`, runs everything queued during a
  turn **as one** (it coalesces), and rules that text queued while *this* turn runs is "already
  too late" and belongs to the next round. Missing in 1stcontact is only the transport, which
  is why the words are dropped today (BUG-122).
- **Delivery point**: upstream delivers the batch *after* the turn as a new turn. That is
  wrong for us, because Alice would announce a finished homepage into a room that abandoned it
  four minutes ago. The queue must reach her **before her report** — see 14.11.
- **Interrupt asymmetry.** Build an activity indicator for both workers so the client can see
  there are two, but make interrupt meaningful only for Alice — Bob's ~1s turns flicker and
  interrupting him saves nothing. Her indicator carries *what* she is doing, sourced from her
  own milestone posts rather than from a spinner.
- **Bob's stop tool: fire on an imperative, offer otherwise.** "Bob, stop her" fires; anything
  weaker becomes a card with a button. Safe to give the cheap model for the reason 14.13 gave
  for withholding suppression from it: a wrong interrupt is loud and cheap (Alice restarts), a
  wrong suppression is silent and the consultation never happened. Same principle, opposite
  verdict. Style the card's button as Alice's activity badge, so the client learns the badge is
  the direct route — **a card that teaches its own redundancy has done its job.**

### 14.11 The tool loop IS the interjection channel — `inject: false` describes the wire, not the turn

The operator's position through 14.10 was that there is no mechanical way to help Alice
mid-turn: an API request is request/response with no channel in, so a ten-minute turn is
unreachable. That is true of a *request* and false of a *turn*.

`runToolLoop` (`components/ai/js/src/backends/api_tools.js:845`) is a host-driven loop of up
to `MAX_TOOL_ITERATIONS = 50` **separate API requests** per product turn — model returns tool
calls, host runs them, host builds the next request. Only a tools-off turn is one request
(`const maxIter = toolNames.length ? MAX_TOOL_ITERATIONS : 1`, line 822). So the host authors
a message at ~50 boundaries inside the ten minutes, and anything we want Alice to see can ride
the next one.

**This makes `ClaudeAPIBackend`'s declared `inject: false` (DOC-21 §6) misread rather than
wrong.** Its own comment is precise — *"There is no way to deliver text into a turn already in
flight — a stateless endpoint has no channel for it"* — and that is about the **stream**. Read
as a property of the turn, it is what produced this epic's "nothing can reach her" premise and
the abort-then-resend design that followed. The flag needs splitting: no injection into a
stream in flight; injection **between tool iterations** for free. Interjection at tool-call
granularity is not a feature to build — it is a boundary we already cross fifty times.

What it buys, exactly: delivery bounded by **her next tool call**, which during real work is
frequent (every screenshot, every `set_l1`, every delegate returning). What it does not buy:
interruption mid-thought. A single long delegation with no intervening call is a blind spot,
and 50 iterations is a hard ceiling on the turn.

### 14.12 The four packets — three exist, one is new, and the new one fixes a silent failure

Against the operator's four requirements (2026-09-28):

**(1) A hook for small notification packets — already built, and in a better place than the
tool result.** `turnTail` (REQ-144, `api_tools.js`) delivers the per-turn volatile tiers *past*
the entire message history, and **both** wires call it inside their per-request `_callModel`
(`claude_api.js:271`, `chatgpt.js:144`), reading `state.volatile` / `state.reminder` at call
time — so it already fires on every iteration of the loop, not once per turn. Three properties
we would otherwise have had to invent:

- **Ephemeral by construction.** Nothing here is written back into `state.messages`, for the
  stated reason that a reminder which accumulated would put turn 1's stale signals in turn 3's
  request. A queue count is exactly that kind of signal.
- **Cache-neutral.** It sits past the last breakpoint, so a counter that changes every request
  re-prices nothing behind it. This was REQ-144's whole point: *stable first, volatile last*
  over the request, which is the unit the cache matches on.
- **One placement rule for both wires**, including the Anthropic requirement that tool results
  come at the head of the user turn — so a signal lands *after* the tool results it accompanies.

Annotating the `tool_result` itself — the literal reading of "add packets to tool-use results" —
would be strictly worse: `wire.record(state, raw, outcomes)` is what writes outcomes into
`state.messages`, so the packet would become permanent history and be re-sent on every later
request of a warm segment.

What is genuinely missing is small and precise: **the reminder is assembled once per turn and
then frozen.** `manager.js:841` calls `assembleReminders(role, turnCtx, …)` and line 1013 passes
the resulting string into `send`. For a queue count to be *current* on iteration 37 it must be
assembled per request — a thunk, or a second `signals` channel the loop evaluates per iteration.
That is the hook. The transport under it is done.

**(2) Metering — the one new thing, and it closes a failure we have already observed.** Today
exhausting `maxIter` falls out of the `for` and yields `doneEvent`: the model is mid-plan, the
turn simply ends, and nobody — model, host or client — is told why. That is precisely the "it
stops without giving a report" symptom, and the operator's "poke it to complete" remedy is a
workaround for a budget nobody published. Three currencies are already measured and none is
disclosed to the model:

- **iterations** — `iter` against `MAX_TOOL_ITERATIONS = 50`;
- **wall-clock** — `timeout = 600`, checked at the loop head and *thrown* as an error;
- **context occupancy** — `turnOccupancy` / per-request `usage` (REQ-143), i.e. Finding 5's
  fuel gauge, still unshown.

Warnings at 75% and 90% and a countdown from 95% convert a silent truncation into a budget she
can plan against — at three calls left, stop working and post the report. This is the half worth
building first, because **it is host-enforced**: the host owns the cap and can act without her
cooperation. The queue half cannot be — she may be told and not pull — and Finding 13 measured
priming constraints failing at 2-in-102.

**(3) External visibility — the events already flow.** `toolIssueEvent` (REQ-175: issued
*before* the call runs, precisely so an interrupted turn is distinguishable from one interrupted
just before the call) and `toolEvent` are already emitted as control-class events on this path.
A progress bar is a consumer of events that exist: the denominator from (2)'s meter, the label
from Alice's own milestone posts (14.10) rather than a spinner.

**(4) `pull` is one tool over a cursor.** "Fetch my queued messages" and "read another chat" are
two cursors over one operation — which is REQ-160 / `session-delta`'s design already recorded at
14.8: the notification carries *a count and a number, not the contributions themselves*, and
spending context on the content is the agent's own choice. So (1) and (4) are the two halves of a
single primitive, not two features: the packet says *2 messages, from cursor 41*; `pull(41)` is
what costs tokens.

**Where the numbering lands**: (1) and (4) are one primitive whose transport exists and whose
assembly point needs widening from per-turn to per-request. (3) is a client consumer of existing
events. (2) is new, is host-enforced, and is the one that fixes an observed silent failure.
Build (2) first.

Nothing filed.


### 14.13 Correction — the occupancy gauge is BUILT, shipped, and the consultant is the one role that does not name it

14.12 said three currencies are measured and the model is told none. That is wrong on the
third, and the correction makes it the cheapest item on the whole list.

`budgetProvider` (LF REQ-169, `components/ai/js/src/defaults.js`) is a shipped framework
provider that renders occupancy, the window, the percentage and the room left; it returns
`null` when nothing has been measured so the entry *and* its separator disappear; and its
doc states the design intent in the operator's own terms — *"It arrives unasked, which is
the point. It is a priming entry and never an operation: the failure being fixed is that
cost is invisible at the moment of choosing, and a session that thought to check how full
it was would not have needed to."* `manager.js:861` puts `occupancyTokens` and
`contextWindow` into the turn context *before* the turn runs, for the stated reason that
the gauge is only useful at the moment of choosing.

**And `tools/generate/src/cli/ai/priming.json` names it in `settings_reminders` and not in
`reminders`.** The settings assistant has a fuel gauge. The site consultant — the role that
asked for one, in the words quoted in [[REQ-284]] — does not. [[REQ-284]] does not close
this: its commit prices *looking* and rewrites the `interrupted-turn` advice; it adds no
gauge entry. One line of configuration, in a file this repository owns.

**The gap that is real, and is the tool loop's:** `session.occupancyTokens` is what the
*previous* turn's last request carried, and is deliberately in-memory only. So during a
fifty-iteration ten-minute turn the gauge is **frozen at the reading from before the turn
began** — which is exactly the turn that is filling the context with screenshots. The loop
already collects a `usage` record per request and already has an `onUsage` hook; a live
figure is a matter of routing what it holds into the per-request channel.

Also standing, from the existing ledger rather than new: [[REQ-286]] removes the
browser quota (*wrong currency*), and [[REQ-283]] carries the ledger-read and the bounded
standing frame. The metering that matters was never absent from the plan — what is absent
is disclosure of *iterations* and *wall-clock*, and a gauge that moves inside a turn.

### 14.14 Is the per-request tail excessive? — it is the price of it existing at all

Asked directly: yes, `turnTail` re-sends the tail on every request of a turn, ~50 times
in the worst case, and REQ-144's own doc says so deliberately — *"Applied on every request
of a turn, not only its first — the reminder was in front of the model on all N+1 of them
before this moved, and it still is."*

The reason it is not waste: **nothing from `turnTail` is written back into
`state.messages`.** So on iteration 2 the iteration-1 tail is simply gone. The choice is
not *resend or send once* — it is **resend or absent**. Ephemerality and repetition are
the same property, and the property is what makes a stale "1 message queued" impossible.

Measured, so the size is not a guess: the consultant's nine reminder entries are **739
characters, ≈184 tokens**; the settings assistant's five are 379; the builder's four are
467. At fifty iterations that is ≈9k uncached input tokens per turn for the reminder — and
it buys the only channel into a turn we have. The figure worth measuring, and not yet
measured, is `volatile` (the session summary), which rides the same tail and is larger.

**Correction to 14.12's suggested shape.** 14.12 proposed making the reminder itself a
per-request thunk. That is wrong: `assembleReminders` runs *providers* — async, some of
them reading the corpus — and running that fifty times a turn is real waste for text that
cannot change mid-turn. The right shape is **two channels with different clocks**:

- **standing guidance** — assembled once per turn as today, delivered per request because
  that is the only way it is present at all;
- **signals** — assembled per request from cheap in-memory counters only (queue length,
  `iter`, the loop's own `usages`), no providers, no I/O.

And a quiet loop must cost nothing: `systemBlock` already drops empty parts without even a
separator, so a turn with nothing queued and no warning due appends zero bytes.

### 14.15 Sidebar — room vs the cheap model's context, on the merits

Setting the current implementation aside and asking which design is right. Topology 2
(the room *is* Bob's conversation, Alice posts into it) loses to topology 3 (the room is
nobody's context; each member reads at a cursor) on four counts, and the first is decisive.

**1. Compaction is a property of a context, and a room inside a context inherits it.**
Bob's messages array would hold two things with different lifetimes — the shared record,
and Bob's private working state. When Bob compacts under *his* context pressure, the
shared record is summarised away by an operation that has nothing to do with the record's
value. 14.8's lesson arrived at this from the other direction: derive the feed from the
corpus rather than write it beside it.

**2. A restart truncates it silently.** LF REQ-168 bounds a warm API conversation and
re-seeds a cold one from a *window*, so topology 2's room survives a process restart only
as far back as the window reaches. Topology 3's room is the durable artifact itself — the
chat ticket transcript, which is already reload-safe and already carries the ledger.

**3. The chair would own the medium.** 14.10 took REQ-154 §3's rule that the chair holds
no domain. A chair who also *is* the transcript is a lossy relay by construction: Alice
sees the room only in whatever Bob passed her at a turn boundary, and every question about
what the client actually said becomes a question about Bob's summarising.

**4. Read rates are wildly asymmetric and a cursor is what absorbs that.** Alice's turns
are ten minutes, Bob's about a second, the client's irregular. A cursor lets each read at
its own rate — and lets Alice read *mid-turn*, which is 14.11's mechanism exactly: the
packet says *2 new, from cursor 41* and `pull(41)` spends the tokens. In topology 2 there
is no cursor to be at.

**The client is already a topology-3 reader.** The browser scrolls a durable transcript it
does not own. Making the agents' room Bob's context would mean the two halves of the
product disagree about what the room is.

**What topology 3 costs, honestly:**

- **Coherence is no longer free.** A member who only pulls deltas has no standing summary
  of the engagement; topology 2 gets that from Bob's context for nothing. So topology 3
  *requires* the bounded standing frame — which is [[REQ-283]] item 2, already scoped. The
  dependency is worth stating plainly: **no standing frame, no room.**
- **Latency for the fast member.** If Bob must `pull` before answering, his ~1s turn pays
  a round trip first. The answer is that delivery need not be symmetric even though
  ownership is: **push the delta to the cheap fast member, notify-and-pull for the
  expensive slow one.** Bob's context is small and the delta is small, so pushing to him is
  free; Alice is the one for whom a pull is a real choice. The generalised group component
  does not do this, which is one more reason to take its *conclusions* rather than its code.
- **Additive only.** REQ-160's known gap (reliably additive, unreliably subtractive) does
  not bite: a chat room is append-only. `pass` must not advance the pointer — 14.10.

**The design, in one line:** the room is the durable transcript; membership is a cursor;
ownership is nobody's; **delivery is asymmetric and matched to each member's cost.**

### 14.16 Candidate requirements — the mechanism, in dependency order

Not yet filed. Framework unless marked. Sizes are impressions, not estimates.

**LF-1 — a per-request `signals` channel on the tool loop.** A second volatile channel
beside `volatile`/`reminder`, evaluated by each adapter's `_callModel` (so per request)
from in-memory state only, delivered by `turnTail`, never written back to `state.messages`.
Both wires already call `turnTail` per request; this widens *what* they may put in it.
Everything else here depends on it. **Small, and first.**

**LF-2 — the tool loop publishes and enforces its own budget.** Iterations (`iter` vs
`MAX_TOOL_ITERATIONS = 50`) and wall-clock (`timeout = 600`) disclosed through LF-1 at 75%
and 90% with a countdown from 95%; and the half that matters most — **exhaustion becomes a
delivered instruction rather than a silent `doneEvent`**: the last iteration says so, so a
report gets written. The timeout path currently *throws*, which is an error raised where a
report was wanted. This is the only item that needs no cooperation from the model to be
useful, which is why it is the one to build first after LF-1. Ref Finding 13's 2-in-102.

**LF-3 — the gauge moves inside the turn.** Route the loop's per-request `usages` /
`onUsage` into LF-1 so occupancy is live rather than frozen at the pre-turn reading.
Extends LF REQ-169's provider rather than replacing it.

**LF-4 — split the `inject` capability.** `inject: false` is true of a stream and false of
a turn (14.11). Declare the two separately so hosts stop designing around an impossibility
that only holds for one of them. Capability + DOC-21 §6 wording. **Tiny, and mostly a doc.**

**LF-5 — one cursor operation, two uses.** `pull(since)` over a transcript, where
"messages queued for me" and "another participant's room" are two cursors on the same
operation; the notification carries a count and a cursor and never the content (REQ-160's
rule). This is (1) and (4) of the operator's four as a single primitive.

**LF-6 — the room as a derived cursor with asymmetric delivery.** 14.15. Depends on LF-5
and on a standing frame; push to cheap members, notify-and-pull for expensive ones; `pass`
does not advance the pointer; the chair holds no domain. **Largest item; wants a design
note before a request.**

**LF-7 — the bounded standing frame.** Probably already [[REQ-283]] item 2 — check before
filing rather than duplicating. Named here because LF-6 cannot ship without it.

**FC-8 (1stcontact) — give the consultant the gauge.** Add `session-budget` to `reminders`
in `priming.json`. **One line**, unblocked, independent of every other item, and it closes
the *"I am driving with no fuel gauge"* quote that opened Finding 5. Do it now.

**FC-9 (1stcontact) — queue transport.** [[BUG-122]]: the client-side queue is built
upstream in `webui-chat` (pending bubbles, coalescing, "already too late" rule) and this
repository drops the words. Delivered as LF-1 notification + LF-5 pull — *before* her
report, not upstream's after-the-turn new turn (14.10).

**FC-10 (1stcontact) — the progress surface.** Consume `toolIssueEvent` / `toolEvent`
(both already emitted, REQ-175) with LF-2's denominator and Alice's milestone posts as the
label. Activity indicator for both workers; interrupt meaningful only for Alice (14.10).

Order: **FC-8 now** (one line) → **LF-1** → **LF-2** (+ **LF-4**, doc-sized) → **LF-3** →
**LF-5** → **FC-9** → **FC-10** → **LF-7 check** → **LF-6**.

Nothing filed.


### 14.17 Filed (2026-09-28) — [[DOC-61]] and seven tickets

The mechanism half of Finding 14 now has a design document of its own: **[[DOC-61]] —
*The interjection channel: what can reach a working session, and what it costs*.** It
carries §14.11–§14.16's reasoning in the shape DOC-60 established (the finding, what is
already built, the faults, the design, the order, the tickets) and it is the reference the
work tickets point at. Nothing in 14.10–14.16 is superseded; the doc is where the design
now lives, and this finding is where the thread stays.

| # | ticket | repo | state |
|---|---|---|---|
| 1 | [[REQ-344]] — the consultant is told how full its context is | ours | **unblocked, ships first** (one line of `priming.json`) |
| 2 | LF REQ-180 — the per-request signals channel, and the capability that says so | framework | unblocked |
| 3 | LF REQ-181 — the tool loop meters itself; exhaustion becomes an instruction | framework | blocked on 2 |
| 4 | LF REQ-182 — one cursor, two uses: notified of a count, pull the content | framework | blocked on 2 |
| 5 | [[REQ-345]] — words typed during a turn reach the consultant before her report | ours | blocked on 2 and 4 |
| 6 | [[REQ-346]] — both workers visible, only one worth interrupting | ours | blocked on 3 |
| 7 | LF REQ-183 — the room is a cursor over a durable transcript | framework | **gated** on 4 and [[REQ-283]]; design note first |

Four of the seven are upstream, which is the honest split: the channel, the meter, the
cursor and the room are all properties of how a turn is driven, and this repository is one
adopter of that. What is ours is the gauge entry, the queue's transport, and the chrome.

**What changed in the design between 14.12 and the doc:** the reminder does *not* become a
per-request thunk (providers would run fifty times a turn); it gains a sibling channel with
a faster clock. And the standing frame is not new work — [[REQ-283]] item 2 already decided
it as `fields.frame` on the chat ticket, which makes it the gate on the room rather than a
ticket of its own.

**Still owed, and named in the doc so it is not lost:** `volatile` — the session summary —
rides the same per-request tail as the reminder and is larger, and is the one figure in
this design that has not been measured.


### 14.18 [[DOC-62]] — the experience design, and DOC-61 demoted to its mechanism half

[[DOC-61]] was too narrow: judged by its title it read as an implementation appendix to a
document that did not exist. It now *is* that appendix, retitled *"Mechanism: reaching a
working turn between its tool calls, publishing its budget, and the cursor primitive"*, and
the document it is an appendix to is:

**[[DOC-62]] — *Building a site with two AIs: the client, the consultant and the
interrogator — roles, the room, and what each participant experiences*.**

It carries the UX and the AX as one design, because they are one: §1 the participants and
the two asymmetries (cost, latency) everything else is downstream of; §2 what the session is
like today on both sides; §3 the division of labour, marked settled / open, including the
interrogator's real job (pressure against the brief) and its two failure modes; §4 the room,
the four topologies and the answer; §5 what the client sees; §6 what each AI can perceive and
do; §7 the shared structure and its unsettled identity; §8 the method and what a second agent
fixes that priming cannot; §9–§12 not-this, measurements, where implementation lives, open
questions. All seven tickets now reference it alongside DOC-61.

**A correction to 14.10's label.** 14.10 recorded *"topology 2 conceded — the room is the
`chat_transcript` comment that already exists"*. The substance of that — a durable transcript
on the chat ticket — is topology **3**, and 14.7's own analysis favoured 3 independently. Only
the label was wrong, because the cheap model was described as "holding" the room. DOC-62 §4
states 3 as the answer and keeps 14.7's build advice: start at 1 because it is incremental and
reversible, but treat the room as an artifact from day one so composing views is a dial rather
than a refactor.

### 14.19 The context gauge was a misdiagnosis — [[REQ-344]] abandoned

Raised by the operator against his own earlier finding, and it is right:

> That is NOT the gauge we discussed — we talked about managing the number of tool iterations
> and feeding that back to whoever was making the calls in the results. We have technology for
> rolling the chat history window AND keeping two forms of summary, all of which is available
> in chunk level search to the AI — what would it do with its context size?

**Nothing.** The window is a host-managed resource with host-side remedies: LF REQ-168 rolls
it, [[REQ-283]] keeps a bounded standing frame *and* an append-only ledger, the ledger body is
KB-indexed at chunk level so what falls out stays reachable, and `_compactionDue` acts without
consulting the model. There is no cliff to steer away from, so a percentage buys no decision —
and it invites false economy, a session skipping a screenshot it should take to protect
something it cannot release.

**The sharper point, and why Finding 5 went wrong.** The consultant's *"the turn simply ends
[…] indistinguishable from having finished"* is a true report of a **misidentified cause**.
Finding 5 read it as context exhaustion and built the fuel-gauge line of work on that reading.
The code says the silent-stop path is **iteration-cap exhaustion** in `runToolLoop`, with the
wall-clock timeout as the other exit. Neither is a context event. So the gauge was an answer to
the right symptom and the wrong mechanism, and it survived a week because nobody had read the
loop.

What this changes, concretely:

- **[[REQ-344]] is abandoned.** The `session-budget` entry is *not* added to the consultant's
  reminders. The argument is recorded on the ticket rather than deleted with it.
- **LF REQ-181 loses its fourth item.** Live occupancy inside a turn is out of scope for the
  same reason; the ticket now meters **two** currencies, iterations and wall-clock, both of
  which bind absolutely and neither of which the model can learn any other way.
- **[[DOC-61]] §F2 is rewritten as a withdrawn fault** rather than deleted, and its numbering
  kept as filed so the rejection stays legible.
- **[[DOC-62]] gains a rule** from it: *meter what actually binds*. A signal is worth a packet
  only if the participant can act on it — and showing a non-binding resource does not produce
  care, it produces false economy.
- **What survives for cost** is the price of the call at the point of the call, which
  [[REQ-284]] already shipped.


## Finding 15 — the room exists upstream; what adopting it here takes (2026-09-30)

Reviewed LF EPIC-2, LF EPIC-7 (+ transcripts), the showcase Flock tab, and 1stcontact EPIC-22.

**Upstream state.** The room is built (EPIC-2: `group.js`, `orchestrator.js`, `group_toolbox.js`, JS and Python peers, all re-exported from `@lagrangefoundry/ai/workers`), none of it on `main`. No chair any more (LF REQ-195: *a chair is a participant's priming*) — which is exactly our assistant: a member primed to administer, with no framework concept behind it. Turn-taking is strictly sequential: `to` routes, otherwise round-robin; an exchange ends when settled (REQ-192). Persistence is a `chat_transcript` comment on a chat ticket (REQ-194). LF REQ-180 (signals channel) and REQ-181 (loop meters itself) have landed. LF REQ-182/183 abandoned. EPIC-7 (intercession: content reaching a round in flight at the next call boundary, as a size-bounded brief) is designed, not built, no children.

**Only Python has ever run a room.** The Flock tab's host is `ai_host.py`; no JS host runs one. Known JS gaps: `_liveLog` does not re-seed a room from its chat ticket (Python does, REQ-194 §3), so an evicted room is unreadable in a Worker; the 09-29 fixes (one post per round, `mine[-1]` preferring a contribution, unseen-default pull) are unfiled; EPIC-7 §11.2's `_seen` bug drops content posted during a round; F2 (two-speed room) does not exist, so the assistant cannot speak while the consultant works.

**1stcontact adopts none of it.** No room code, `webui-room` not vendored. EPIC-22's Debug tab (REQ-353) holds one switch (delegation); the group-chat switch and per-member private windows were deferred pending the room, and still cite the abandoned LF REQ-183.

**Our ticket set.** REQ-344 abandoned (correct). REQ-345: dependency (LF REQ-182) abandoned; its delivery half is EPIC-7 stage 1 and its durability half is BUG-122 — recommend abandon. REQ-346: unblocked but overlaps `webui-room`'s activity strip — recommend fold into the room adoption work. DOC-62 is behind (still describes a chair; the 2026-09-28 §4/§9 corrections never landed); DOC-61's did land.

**Decisions this turn (operator).** Two threads: (1) technical — make the three-way conversation work; (2) dramaturgy — how the agents are primed to drive it. This finding is thread 1. The assistant is a first-class member: its own session, KB access, and read access to everything the consultant can see. *Alice* and *Bob* are code names only: the roles are `consultant` and `assistant`, and display names must be configuration, never literals in code or priming.
