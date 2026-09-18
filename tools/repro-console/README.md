# repro-console — the reproduction console (REQ-254 / REQ-256 / REQ-261 / REQ-272, [[EPIC-12]] §8)

A localhost-only dev console that runs one reproduction round end to end —
capture a site, reproduce its home page, diff the two — and puts the three
artifacts one click apart.

```
pnpm install                   # once — the launcher needs vite, newly declared here
./bin/repro-console            # http://127.0.0.1:8710
./bin/repro-console --port 9000
```

Enter an address, press **reproduce**. When the run finishes an *Iteration 1*
heading appears with links — the original site, the reproduction, the diff
images, the reproduction's own L1 document — each opening in a new tab. **run
again** re-runs the reproduction and appends *Iteration 2* below it; earlier
iterations stay on the page with their own artifacts.

## The loop, and the two places it stops ([[REQ-272]])

```
capture and compare
  ── you look, then press [diagnose this]
AI round → files a gap ticket
  ── [run again] is HELD; you free-code the fix, then press
     [the implementation has landed]
run again → capture and compare
  ── you look, then press [diagnose this]
```

Both stops are the same principle: the expensive thing does not start until
somebody has looked. A finished iteration leaves the page **idle** with its links
live, and the round starts from **diagnose this** on that iteration and from
nowhere else. When a round files a ticket, **run again** goes inert and says what
it is waiting for — the next iteration exists to measure that implementation, so
running one before it lands measures nothing new. The release is a file beside
the round, so the hold survives a restart of the console.

## The AI round ([[REQ-256]], [[REQ-261]], [[REQ-272]])

Press **diagnose this** on an iteration and an **AI process starts**, reads that
round's evidence, and finishes by **filing a gap ticket against the reproduction
engine**. Its transcript streams onto the page underneath the iteration, and the
ticket it filed becomes a fifth link. Then it stops: the operator free-codes the
ticket in the ordinary way, presses **the implementation has landed**, and
presses **run again**, which reproduces with whatever has landed since.

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

**The reference can move, deliberately.** **run again** *refolds*: it re-derives
the fold from the oracle the bundle already holds, so a FOLD change shows up and
the reference stays still, which is the comparison an iteration exists to make. A
**capture** change is invisible to a refold by construction — the axis the fix
added is not in an oracle the old extractor wrote — so **recapture**, on the site
already loaded, takes a fresh bundle and **appends the next iteration rather than
starting a new list**. That iteration is marked *re-captured* on the page and in
its `iteration.json`, because its numbers are not comparable with the one above
it: the reference moved as well as the engine. Every iteration also shows which
bundle it used and when that bundle was captured, so a chain whose reference
moved half way through reads as one chain with a marked seam.

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
