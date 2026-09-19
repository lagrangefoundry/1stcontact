---
uid: epic-95bc3b15
id: EPIC-19
type: epic
title: Web Builder Experience
created_by: martin-github@westhead.me
created_at: '2026-09-18T18:58:18.644541+00:00'
updated_at: '2026-09-19T18:55:46.666492+00:00'
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
- lagrange-framework **REQ-168** — bound a warm API conversation: apply `window()`
  in flight, age images out to pointers after ~3 turns, and give the pointer a
  host-supplied way back (the REQ-149 `display` pattern). Filed upstream; no code
  here.
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
