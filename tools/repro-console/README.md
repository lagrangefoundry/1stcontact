# repro-console — the reproduction console (REQ-254 / REQ-256 / REQ-261 / REQ-272 / REQ-277 / REQ-299, [[EPIC-12]] §8)

A localhost-only dev console that runs one reproduction round end to end —
capture a site, reproduce its home page, diff the two — and puts the three
artifacts one click apart.

```
pnpm install                   # once — the launcher needs vite, newly declared here
./bin/repro-console            # http://127.0.0.1:8710
./bin/repro-console --port 9000
```

Enter an address, press **recapture**. When the run finishes an *Iteration 1*
heading appears with links — the original site, the reproduction, the diff
images, the reproduction's own L1 document — each opening in a new tab.
**recapture** again, from the control under the list, appends *Iteration 2* below
it; earlier iterations stay on the page with their own artifacts. **clear
history** ends the chain and puts the page back to the blank state it opens in.

## One verb ([[REQ-299]])

The console used to render three controls that all meant "produce the next
iteration" — **reproduce** (`/run`), **recapture** (`/recapture`) and **run
again** (`/run-again`) — and only one bit varied between them: whether the
reference bundle is re-rolled before the fold. That bit cannot be answered from
the page. Answering it correctly needs the capture schema the stored bundle was
written at against the schema the extractor is at now, and when those differ
**run again** re-folds a stale bundle and cannot see any axis added since the
bundle was rolled, with nothing on the page saying so.

So there is one verb. **recapture** stands in both positions the retired pair
occupied — beside the address box, where it begins a chain for the typed address,
and under the iteration list, where it appends to the chain already on screen —
and in both it re-hits the site and re-rolls the reference before folding. There
is no longer any way to fold a stored bundle from the page: every iteration the
console produces is measured at the current capture schema. `/run` and
`/run-again` answer 404.

The label stays **recapture** on a blank console too, where the "re-" is slightly
wrong. Two labels for one act would put back the which-one-do-I-want question
this exists to remove.

## The loop, and the two places it stops ([[REQ-272]])

```
recapture → capture and compare
  ── you look, then press [diagnose this]
AI round → files a gap ticket
  ── [recapture] is HELD; you free-code the fix, then press
     [the implementation has landed]
recapture → capture and compare
  ── you look, then press [diagnose this]
```

Both stops are the same principle: the expensive thing does not start until
somebody has looked. A finished iteration leaves the page **idle** with its links
live, and the round starts from **diagnose this** on that iteration and from
nowhere else. When a round files a ticket, **recapture** goes inert and says what
it is waiting for — the next iteration exists to measure that implementation, so
running one before it lands measures nothing new. The release is a file beside
the round, so the hold survives a restart of the console.

## The AI round ([[REQ-256]], [[REQ-261]], [[REQ-272]])

Press **diagnose this** on an iteration and an **AI process starts**, reads that
round's evidence, and finishes by **filing a gap ticket against the reproduction
engine**. Its transcript streams onto the page underneath the iteration, and the
ticket it filed becomes a fifth link. Then it stops: the operator free-codes the
ticket in the ordinary way, presses **the implementation has landed**, and
presses **recapture**, which reproduces with whatever has landed since.

**The round writes no code.** It is a `claude -p` process that can read and do
nothing else: every tool that can write a file, run a command, reach the network
or spawn an agent is denied BY NAME — `AI_DISALLOWED_TOOLS` in `src/ai.ts`, and
the note beside it records why naming rather than omitting is what gates. Two
falsifiers run after every round and are shown on the page: the working tree is
compared before and after, and the filed ticket's status is read back (it must
be `draft`; a `ready_*` status is a dispatcher trigger).

**One unbounded gap ticket, plus bugs.** The gap ticket is capped neither in size
nor in the scope of work it asks for: a round that found five related residuals
describes five, because there is no later round that inherits its notes.
Anything it tripped over that is *not* a gap in the reproduction engine — a
defect in L1, in the brief, anywhere in `1c` — comes back in a separate `bugs`
list and the console files each as its own `draft` ticket, on every status.

**Every ticket says where the defect sits.** A round classifies each ticket it
files into a closed set of nine — three instrument classes, capture, fold,
renderer, `l1-cannot-express`, `harness`, and `cannot-tell` — in the
`defect_class` field, and defends it in one line in the body. The set is declared
once in `src/defect-class.ts`; the brief (§5) says what each one means and the
prompt carries the list generated from the code. Each class belongs to a queue,
and the two that matter are `ruler` (make the instrument trustworthy) and
`ceiling` (raise what the product can do): the round's status line and a panel
above the iteration list both show the split, so "did that round buy ruler repair
or ceiling" is a glance rather than an audit. A ticket read back carrying no
class, or one outside the set, is a violation beside the status and provenance
checks.

**The reference moves every iteration, and the page says so.** A **capture**
change is invisible to a refold by construction — the axis the fix added is not
in an oracle the old extractor wrote — and since [[REQ-299]] there is no refold:
**recapture**, on the site already loaded, takes a fresh bundle and **appends the
next iteration rather than starting a new list**. Every such iteration is marked
*re-captured* on the page and in its `iteration.json`, because its numbers are
not comparable with the one above it: the reference moved as well as the engine.
The marking is now the norm rather than the exception, and it stays — the page
does not start claiming a comparability it cannot offer. Every iteration also
shows which bundle it used and when that bundle was captured, so a chain reads as
one chain with its seams marked.

**A round knows how old its oracle is.** The digest opens with the reference's own
`capturedAt` and `captureSchema` and the engine commits that landed after it, and
the prompt says the same in a paragraph. This is arithmetic the console can do for
free over the bundle's own stamp and `git log`; the round that made it a ticket
spent **$7.70 and 78 turns** arriving at "the reference was captured 70 minutes
before the commit that fixed the residuals measured against it".

**Rounds resume.** A second iteration on the same reproduction continues the
first round's CLI session rather than re-deriving its bearings, and is not
re-sent the brief. The chain is cut when the reference moves — a different bundle, **or the
same site re-captured** — when the brief changes, or after `RESUME_MAX_ROUNDS`
rounds — the scope and the reasoning are in
`src/session.ts`. A resumed round is told, in as many words, that what it
remembers is a pointer and never evidence.

Since [[REQ-299]] every continuation re-captures, so the first of those cuts
fires on **every** iteration of a chain and resume no longer reaches across one.
That is the cut rule working, not failing: the reason a remembered number cannot
be trusted once the reference has moved does not weaken because the reference now
moves every time. What it costs is one round's re-reading per iteration.

**The unmeasured set is the headline, not the delta count** ([[REQ-277]]). Every
iteration leads with *how much this run did not measure* — compared axes only one
side of the projection can read ([[REQ-274]]), bands with no counterpart
([[BUG-111]]), elements that paired with nothing ([[BUG-106]]), probes that
declared they could not run — as one number with its breakdown under it. The
delta count stays, directly beneath, and the page says which way each moved since
the iteration above. It does that because the delta count **rises when the
instrument sharpens**: [[BUG-107]] added `role` comparison and took one
reproduction from 1 delta to 14 with nothing about the page having changed, and a
console that made that read as a 14× regression would be teaching the loop to
avoid adding axes. A report that does not carry one of the four parts reads as
`unmeasured ≥ N` with the missing parts named — silence is never counted as zero.
Across a **re-capture** the delta count is marked *not comparable* on that axis
specifically: the oracle moved, so it is a different measurement wearing the same
name, while the unmeasured set falling is exactly what the re-capture was for.
Since [[REQ-299]] that is every iteration of a new chain, so the delta comparison
is normally suppressed and the unmeasured movement is what the page reports; a
chain already on disk from before, re-opened, still reads its refolds as
comparable.
The same number and the same definition lead the digest and the round's prompt,
and the brief (§3) tells the round to drive it.

**The history can be put down** ([[REQ-299]] part 2). **clear history** sits with
the list it clears, under it rather than beside the address box, so the position
reads *this acts on the list* rather than *this starts something*. Pressing it
ends the chain: the page returns to the blank state and the next chain starts at
*Iteration 1*. It **archives rather than deletes** — the chain directory under
`storage/tmp/repro-console/repro-<site>/` is renamed to
`repro-<site>.cleared-<timestamp>` beside itself, so the transcripts, diffs,
filed ticket ids and rail results stay one `ls` away, and the status line names
the archive. It does **not** touch `storage/references/<site>/`: that is a
separate artifact with a separate lifecycle, the regression rail baselines
against it, and the blank page still offers it back. It follows the same inert
rules as every other control — disabled while a round runs, disabled while the
chain is held, carrying the same `data-inert` reason the poller reads.

**The console counts what it can.** Beside the evidence it writes
`ai/evidence-digest.md` (`src/digest.ts`): asset attribution, the key census of
the reference manifest, every value delta and every ranked region. It is
arithmetic over files the console already has parsed, it is an addition to those
files and never a replacement, and the prompt says so.

**A round is priced, and recoverable.** The model, cost, duration, turns and
tokens are read off the stream and recorded beside the outcome. A round whose
final message the console could not parse says which file holds what it said, and
**read it again** re-reads that transcript and files from it — spawning nothing
and paying for nothing.

A **`capture-incomplete`** verdict means the reference itself is wrong, not the
engine. The console reads that verdict out of `gate.json` and starts no AI
process at all — the round stops and files nothing.

What the round is told is `brief/DIAGNOSE-THE-GAP.md`: a document, reviewed in
the diff that changes it, distilled from [[DOC-19]] and [[EPIC-12]] §7.4–§8.5.

```
REPRO_CONSOLE_AI=my-claude          # a different executable
REPRO_CONSOLE_AI_MODEL=opus         # a different model
REPRO_CONSOLE_RAIL=off              # don't wait for the rail this round
```

The **regression rail** ([[REQ-255]]) runs read-only once per iteration and its
findings are shown beside the links, so each round sees the cross-site state
rather than only this site's. Its verdict never fails the iteration — that
gating belongs to the free-coding session that implements a gap ticket.

The round runs the rail's **`references` phase only** — the cross-site
comparison. The other three phases (typecheck, worker build, the test suite)
gate the *checkout*, and re-running them between two iterations that changed
nothing would spend minutes to re-answer a question no reproduction asked. The
narrowing is never silent: the rail reports what it did not cover and that
carries onto the page. A checkout with no recorded bar says so rather than
passing by default — record one with `repro-rail record`.

## It is not deployable, by construction ([[EPIC-12]] §8.6)

It lives in `tools/`, not `apps/`; it is `private`; it declares **no `build`
script**, so the `pnpm -r build` visit `pnpm-workspace.yaml`'s `tools/*` glob
guarantees is a no-op; it ships **no wrangler configuration**; and nothing under
`apps/` or `packages/` may depend on it. All of that is asserted by
`tests/test_UAT_FC_REQ-254_isolation.test.ts` rather than left as convention.

## It spawns `1c`; it does not run the engine in-process

Every step of an iteration is a **fresh `1c` process**. `1c` compiles TypeScript
on the fly through a Vite SSR server ([[REQ-150]]), so a long-lived server would
cache the module graph and keep running the code it booted with — iteration N+1
would silently reproduce iteration N's result. See `src/iteration.ts`.
