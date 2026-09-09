---
uid: bundle-4efd33fe
id: BUNDLE-24
type: bundle
title: REQ-155 + BUG-40 + REQ-160 + BUG-41 + BUG-42 + 3 more
created_by: xgd
created_at: '2026-09-09T00:17:23.326690+00:00'
updated_at: '2026-09-09T04:19:57.944967+00:00'
completed_at: null
last_field_updated: status
status: reconciling
fields:
  commits:
  - working_sha: 835230e1bd60b8c2dbd2d681962a4a9ac78abdb7
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 8b484d5832c65b1095c96a20c2fbe2c8aeeed8bf
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 6d345f3303440547e67b80441958352c27e80244
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: d019bab77200d88dd613c94e0bbaa93b300ed526
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 32366f9e2dc6205a0de9c8b07be2b1c306133828
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: eb6655c337e3b3644a59ee2c3daf6df6a423c810
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: a34527e3c793e213d159eced5dc9d13e5e55905d
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: f5807330c6481181505558bbed71cdce53c95e08
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 92e927e79f5da377f6258588a4fc7b896ec9cff9
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: d612c1aa20530e2b0c1aacea9a33a07a16fbf991
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 5c7cc72acc4de8678e746ed7dda56c49b8872e25
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  auto_merge_back: true
  priority: medium
---

# Bundle

This ticket bundles the following source tickets:


---

## REQ-155: Capture in workerd: a ReferenceStore port, with the filesystem behind it

# Capture in workerd: a ReferenceStore port, with the filesystem behind it

## Why this is its own ticket

Exactly the shape [[REQ-142]] and [[REQ-143]] used for `SiteStore`, and separated for the same
reason: a storage contract buried inside a feature change is a storage contract nobody reviewed.

[[REQ-154]] gives the cloud a browser. It does not give it anywhere to put what the browser
produces. `capture/bundle.ts` writes a bundle as a **directory tree** — seventeen `mkdirSync` /
`writeFileSync` call sites, not the fourteen first counted — and `capture/reextract.ts` reads one
back with `readdirSync`. None of that exists in a Worker.

## What a bundle is, and what must survive

[[DOC-13]] §8 states the constraint in its last clause: *"`storage/references/` bytes move to R2.
The capture pipeline, schema, and bundle are **unchanged**."* This is a port, not a redesign. A
bundle written by the laptop and a bundle written by the cloud must be the same artifact, readable
by either.

| Member | What it is |
|---|---|
| `capture.json` | the capture record |
| `screenshot.full.png` | the full-page shot |
| `screenshot-<width>.png` | the persisted viewport ladder |
| `rendered.html` / `raw.html` | post- and pre-script DOM |
| `assets/` | the referenced bytes |
| `multistate.json` | the multi-viewport ladder — the acceptance oracle |
| `l1.json` | the ladder folded into one L1 document |
| `forms.json`, `hints.json` | derived form model and advisory structural hints |

## The shape of the port

Two levels, because a bundle is the unit every verb already operates on:

- **`ReferenceBundle`** — one bundle's members, addressed by member key
  (`capture.json`, `assets/hero.jpg`, `screenshot-390.png`). `read`, `write`,
  `list`, all async, all bytes. This is what every codec function in
  `capture/bundle.ts` takes in place of a `bundleDir` string.
- **`ReferenceStore`** — the bundles one tenant holds. `bundle(name)` and
  `list()`.
- **`ReferenceStoreRoot`** — `forTenant(id)`, for the R2 adapter only, refusing
  an unknown or inactive tenant at construction exactly as `d1r2SiteStore` does.

Three adapters: `fsReferenceStore` (node-only, `storage/references/`),
`r2ReferenceStore` (the `BLOBS` bucket — captured competitor material is client-private
per [[DOC-38]] §7.1, so it does not belong in `SITES`, which a public Worker serves by path),
and `memoryReferenceStore` for tests and for the shared contract.

## Design decisions taken here

These are the five questions the investigation surfaced. Each is settled below rather than
discovered during implementation.

**1. `reextract.ts` reads through the port; it does not run in workerd.** Its `readdirSync` is
the stated reason for the list verb, but its real blocker is `createServer` — it serves the
bundle over ephemeral loopback so the browser performs a *real navigation* of mirrored bytes
([[DOC-13]] §2.3), and workerd has no `createServer`. So it loses `node:fs` (members come from
the port, served from memory) and keeps `node:http`/`node:net`. It stays node-only, reached the
same way `playwright-driver` is. A Worker route streaming members to a public browser is a
different design and is not in this ticket.

**2. `--ref` stays polymorphic, and the disambiguation stays in the CLI.** `1c diff --ref` takes
either a bundle directory or a loose PNG, told apart by `statSync().isDirectory()`
(`perceptual.ts`). A store has no answer to "is this a directory" and should not grow one:
resolving a *command-line argument* to either a bundle or a file is the CLI's job, above the port.
`perceptual.ts` therefore keeps its own filesystem resolution and takes the ladder screenshot's
path from the fs adapter, symmetric with the `screenshot.full.png` branch two lines below it.

**3. `readLadderScreenshotPath` is split, not ported.** It returns a filesystem path and feeds it
to the image layer — the "NO PATHS" leak `site-store.ts` argues against. The port gets
`readLadderScreenshot(bundle, width): Promise<Uint8Array | null>`; the *path* helper moves to the
fs adapter where a path is a legitimate thing to have. This is the one place REQ-155 and
[[REQ-156]] touch; the split is what stops either eating the other's change.

**4. Bundle identity stays URL-derived and overwriting: `<host>/<pathSlug>`.** The ticket asked for
a name derived from URL *and capture time*. Capture time goes in the record, not the name, for
three reasons: re-capturing a URL must keep replacing it in place (today's semantics, and what
"capture once, re-map forever" assumes); `--ref storage/references/joyfulculinarycreations.com/index`
is a path the operator types; and `bundleDirFor` is pinned by an existing UAT. `capture.json`
already carries `capturedAt`, which is where a generation is distinguished. A timestamped
naming scheme with a `latest` alias remains available and additive.

**5. Tenancy is the R2 adapter's, and the filesystem has none.** There is no D1 on the CLI path
and no `references` table; the R2 root takes `DB` purely to run the same `tenants` check
`d1r2SiteStore.forTenant` runs, and keys everything under `t/<tenant>/ref/<name>/<member>`
([[DOC-38]] §7.2's prefix convention). The filesystem adapter serves one operator and has no
tenant to check — AC5 is a claim about the R2 adapter, stated rather than left to be discovered.

## Non-determinism, stated rather than discovered (AC3)

A locally-captured and a cloud-captured bundle of the same URL will not be byte-equal, and
pretending otherwise would make AC3 unfalsifiable. The known sources: `capturedAt`; whatever the
live site served at each capture time; font-load and layout settle timing; per-engine ladder
differences; and PNG encoder differences between Playwright's Chromium and Browser Rendering's.
The honest claim is therefore **same member set, same schemas, geometry within the existing
gate's tolerance** — which is `values-diff`'s job and not a new one. No PNG is compared byte-wise.

## Blast radius

Bundle members are read outside `capture/` by `repro.ts`, `gate.ts`, `responsive-diff.ts` and
`perceptual.ts`, and `writeL1` / `writeMultiState` / `writeForms` are a fixture-authoring API in
a dozen test files. Every one of those functions is synchronous today, so the port makes the
chain async: `cmdRepro`, `cmdRefold`, `cmdL1Gate`, `referenceCoverage`, `cmdResponsiveDiff`.
That cascade is unavoidable — the port is async totally, for the reason `site-store.ts` gives —
and it is the largest single cost in this ticket. `aligned-crops.ts` reads members with raw
`readFileSync` rather than through `bundle.ts`; it is a developer-only diff verb outside the
capture pipeline and is left as it is.

## Deliberately not here

Re-pointing the *reproduction* verbs (`repro`, `adopt-gaps`) at a non-filesystem store. They now
read through the port because their dependency moved, but the CLI hands them the filesystem
adapter and nothing else: they are the framework-growth loop ([[DOC-21]]), operated by a developer
at a CLI. `refold` is the exception, because AC4 names it.

## Acceptance criteria

1. A `ReferenceStore` port with two implementations — filesystem and R2 — selected by injection,
   as REQ-142 did for sites. No `node:fs` call remains reachable from the capture pipeline
   (`pipeline.ts`, `capture.ts`, `bundle.ts`), and no `node:` import at all remains in
   `capture/bundle.ts`.
2. `1c capture page <url>` runs inside workerd and lands a complete bundle, every member above
   present, against a real R2 bucket.
3. A bundle captured locally and one captured in the cloud, for the same URL, are equivalent
   member-for-member — same member set, same schemas, geometry within the gate's tolerance — with
   the non-determinism stated above rather than discovered.
4. `1c refold --ref <bundle>` re-derives `l1.json` and `forms.json` from a stored bundle without
   re-hitting the site, in both implementations.
5. Bundles are tenant-scoped, and a read across tenants is refused at the same layer `SiteStore`
   refuses it — `forTenant` throws `UnknownTenantError` for an unknown or inactive tenant, and a
   handle for one tenant cannot address another's keys.
6. Every CLI verb taking `--ref <dir>` behaves identically against the filesystem implementation.

## Test plan

- `tests/support/reference-store-contract.ts` — one body of assertions, run against every
  adapter, mirroring `site-store-contract.ts`. Registered from the node project (filesystem,
  memory) and the workers project (R2).
- `tests/test_UAT_FC_REQ-155_reference_store.test.ts` — the node-side registration plus AC1
  (no `node:` import reachable from the capture pipeline, asserted structurally against the
  source), AC4 (`refold` over both node adapters), AC6 (`--ref <dir>` behaviour unchanged).
- `tests/test_UAT_FC_REQ-155_reference_store.workers.test.ts` — the workers-side registration
  plus AC2 (a whole bundle landed inside workerd through `cmdCapturePage` with an injected fake
  driver and a real R2 bucket), AC3 (member-set and schema equivalence against a bundle the node
  adapter wrote), AC5 (tenant refusal and key isolation).
- Regression scope: `tests/capture.test.ts`, `tests/req22-storage.test.ts`,
  `tests/req58-multi-viewport.test.ts`, `tests/req83-capture-to-l1-fold.test.ts`,
  `tests/reconciliation-l1-fold*.test.ts`, `tests/reconciliation-size-aware-diff.test.ts`,
  and every suite importing `writeL1` / `writeMultiState` / `writeForms`.

## Origin

[[CHAT-27]]. Second of four: the browser can see, and now there is somewhere to keep what it saw.


---

## BUG-40: Test suite: 27 failures + 30 collection errors — a half-finished install, a stale asset build, and eleven UATs superseded by later work

## Symptom

`pnpm test` (vitest, node + workers projects) fails. As found:

```
Test Files  30 failed | 220 passed | 4 skipped (254)
     Tests  27 failed | 1788 passed | 63 skipped (1878)
    Errors  30 errors
```

Three independent causes, two of them environmental and one a real backlog of
UATs that later intents superseded without updating.

## Cause 1 — a half-finished `pnpm install` (environment, no code change)

`node_modules/.pnpm/whatwg-encoding@3.1.1/node_modules/iconv-lite` pointed at
`iconv-lite@0.6.3/node_modules/iconv-lite`, which did not exist: an earlier
`pnpm install` aborted part-way through extracting it. jsdom loads
`whatwg-encoding`, so **17 test files failed at import** with
`Cannot find module 'iconv-lite'` and contributed 30 collection errors.

The same aborted install left `node_modules/.pnpm/lock.yaml` carrying an
`overrides: { iconv-lite: file:.local-vendor/iconv-lite }` entry that
`pnpm-lock.yaml` does not have. REQ-44's install preflight compares those two
files byte-for-byte, so every browser/imaging-gated `1c` verb (`values-diff`,
`gate`, `diff`, `capture`, `shot`, `crop`, `adopt-gaps`, `aligned-crops`)
refused with `ENVIRONMENT`, failing a further ~11 tests across
`reconciliation-size-aware-diff`, `reconciliation-cross-gate-reconciliation`,
`reconciliation-l1-fold`, `reconciliation-l1-navigation`,
`reconciliation-l1-interaction-and-motion`, `reconciliation-l1-pointer-accent`,
`reconciliation-colour-retrofit-shade-model` and
`reconciliation-platform-build-deploy-smoke`.

`pnpm install` cannot complete inside this session's sandbox: the published
`iconv-lite@0.6.3` tarball carries a `.idea/codeStyles/` directory, and creating
any `.idea` directory under the project is denied (`EPERM`). Repaired by hand —
the real 0.6.3 payload restored at its canonical path, and the installed-lockfile
snapshot brought back into agreement with `pnpm-lock.yaml`. **The operator should
still run `pnpm install` outside the sandbox** to leave the tree pnpm-managed.

## Cause 2 — a stale `1c assets` build (environment, plus one real defect)

`apps/control-app/dist-assets/` held only `builder/`; `webui/` and `framework/`
were absent, so the builder origin answered 404 for every
`/webui/<component>/…` and `/framework/*.js` route. That failed AC-961, AC-963,
AC-964, AC-977, `REQ-115` and both `REQ-117` criteria. Rebuilding with
`1c assets` fixed the isolated runs — but not the full one, which uncovered the
defect below.

**`1c assets` emptied the directory it was about to fill.** It `rm -rf`'d
`dist-assets/` and then spent the next several seconds copying into it, so
anything reading that directory meanwhile — a `wrangler dev` on the checkout, or
another suite in the same vitest run — got a 404 for every component; and a run
that failed part-way left the hole permanently. `reconciliation-platform-build-deploy-smoke`
drives `bin/build` (and therefore `1c assets`) against the real tree, so it and
`reconciliation-builder-workspace-origin` raced whenever they overlapped. The
build now assembles the new tree in `dist-assets.staging/` and swaps it into
place once it is whole: a reader sees the previous build or the new one and
never half of either, and a failed build leaves the working one standing.

## Cause 3 — eleven UATs left behind by later intents

Each is a criterion whose evidence stopped matching the system when a subsequent
ticket deliberately changed it. In every case the *implementation* is current and
the *test* is stale, so the test moves.

1. **AC-960** (`bug32-webui-scope-rebrand`) — the guard forbids the component
   scope literal in any tracked file but its single declaration. Three files
   added since now write it in prose about *non-webui* components in the same
   org scope: `apps/control-app/src/knowledge.ts` (an error message naming the
   describer's entry point) and the REQ-158 / REQ-159 workers-test headers. The
   guard is right — a rebrand would leave all three stale — so the prose is
   reworded to name the component without restating the scope.

2. **AC-1055** and **REQ-127's unissued-id criterion** — both assert that a
   *derivable* session id for an existing site is refused 404 because it was
   never issued. BUG-38 deliberately replaced the per-isolate issued-id registry
   with a store read (`slugForSession` → `hasDraft`), because in workerd
   `/api/ai/session` and `/api/ai/prompt` are not promised the same isolate and
   every turn was being told its conversation had closed. Under that design an id
   resolves exactly when it names a site this tenant holds — a stronger property
   than the one it replaced, since a per-process map could not check tenancy at
   all. Both criteria are re-pinned to that rule: an id naming no such site, an
   empty slug, a traversal string and a traversal that would reach a real site if
   it were ever joined onto a path are all refused identically and before
   anything is streamed; an id held over a restart now works, which is BUG-38's
   fix rather than a hole. Both tests are renamed to state the claim they make.

3. **AC-1123** (`reconciliation-copy-edit-parameter-sheet`) — asserts the run's
   non-string descriptors are exactly `{integer, enum, boolean}`, and separately
   that a painted panel renders no parameter sheet. The palette work added a
   `color` descriptor, which breaks both. The test's own comment says a hardcoded
   list "would strand the next field the derivation grows", which is what
   happened: the type assertion becomes containment over the shapes the criterion
   enumerates, and the panel assertion becomes "each form is rendered exactly
   when it has fields to put in it", read off the descriptors rather than off a
   remembered shape.

4. **AC-1331** (`bin/build`) — the `--skip-preflight` leg hides `webui-shell` and
   expects the build to complete. REQ-145 added the `1c assets` stage to
   `bin/build`, and that stage needs every component the preflight checks, so
   hiding one now fails the build after the skipped check rather than before it.
   The leg is split into the two claims that are actually true: with a component
   hidden the flag skips the *check* and the run reaches the assets stage before
   stopping there, bundling nothing; with a complete store the flag skips the
   check and the build completes. The incomplete leg runs first, deliberately, so
   the complete one leaves the shared asset tree whole.

5. **AC-1336 / AC-1337 / AC-1338** — pinned to a hardcoded nine-check list.
   REQ-147 added `control_app_challenges_unauthenticated` and
   `control_app_workers_dev_closed` to `tools/generate/bin/smoke.mjs`. The
   criteria are re-pinned to the checks the run actually reports: the site checks
   stay an ordered list because the skip clauses are ranges of it, the two Access
   checks are their own list because they skip for their own reason, and AC-1336
   supplies both control-app origins so "nothing skipped" remains a claim about a
   complete run. The suite's fetch double now keys on origin as well as path, so
   one `/` can answer differently for the public site and the control app.

6. **AC-1341** — asserts every named environment repeats every top-level var,
   with no exception. `ACCESS_DEV_OPEN`'s *absence* from `[env.production]` is a
   deliberate security control (REQ-145/REQ-147) that
   `test_UAT_FC_REQ-145_build_artifacts` separately pins, and REQ-144's own copy
   of this guard already carries the exception. It is added here with the same
   rationale. The criterion also asserts `BUILDER_ORIGIN` is present top-level
   and in production; REQ-145 replaced that proxy var with the `ASSETS` binding
   and the var is gone, so those two assertions are dropped — the synthetic
   fixture below them keeps the name, which is the shape the guard must keep
   catching.

7. **AC-1342** — reads `would push ANTHROPIC_API_KEY to $DEPLOY_WORKER_NAME` and
   its past-tense partner out of `bin/deploy.d/secrets/README.md`. REQ-149
   genericised the README to `NAME` and moved the two messages into the hook that
   emits them, `bin/deploy.d/secrets/10-anthropic-api-key`. The criterion reads
   them from the hook instead — stronger evidence, since that is the file that
   actually produces them — and the hook joins the list of files scanned for
   committed credential shapes.

8. **AC-964** — ends by requiring `GET /preview/alpha/draft/` to answer 200 for
   an admitted caller. The Worker reads its own D1, which the fixture gives a
   schema and no sites, so that only passed on a checkout where an earlier run
   had left a site behind in the local miniflare state; it failed on a clean one.
   Two lines earlier the same URL is already allowed to be 200 *or* 404. What the
   criterion is about is stated in its own comment — that it is the gate, not
   routing, standing between the caller and the route — so the pair becomes
   "admitted: not 401, and non-cacheable" against "unauthenticated: 401", which
   is the claim, and holds whatever the store happens to contain.

## Test plan

No new behaviour is introduced, so no new UAT: the deliverable is the existing
suite passing. The one production change — staging the asset build and swapping
it in — is covered by AC-1331's incomplete-store leg, which now asserts that a
build stopping in the assets stage bundles nothing, and by AC-961/963/964/977
passing in the same run as the smoke suite that rebuilds those assets, which is
the race the staging removes.

Regression scope is a full `vitest run` (node + workers projects).


---

## REQ-160: Session seeding and turn reminders: two-KB priming, the change cursor, and the delta channel

# Session seeding and turn reminders: two-KB priming, the change cursor, and the delta channel

## Why

[[REQ-158]] primes a session against one knowledge base. [[REQ-159]] adds a
second that changes *during* the conversation. This ticket is what makes the
second one visible.

The problem, stated concretely:

> The AI asks *"do you have any positioning material?"* The client says yes and
> uploads it. Nothing tells the AI it arrived.

[[DOC-39]] §5 and §6 are the specification. The essential finding it records:
**this is not a priming-freshness bug.** Priming already runs every turn and the
map is an ordinary ticket read, so a rebuilt map is picked up next turn with no
new machinery. The fault is that **a map is a description, not a notification** —
a new brand document lands inside the existing "brand and positioning" territory
and changes the map's prose not at all. Correct, current, freshly read, and
silent.

So the delta has to travel separately from the description.

## Three pieces

### 1. Seeding, with both maps in one landscape

`primeSession` assembles landscape → role purpose → mechanism and trigger, and
that order is the component's and is load-bearing.

Both KBs appear in **one** landscape section. Splitting them would recreate what
[[DOC-10]] §5.2 removed when it merged the transcript tools into the knowledge
surface: the AI having to know which *kind* of thing it was looking for before it
could look. A question half-answered by a design document and half by the
client's own paper must return both, ranked together.

Project map first, then system — the client's material is what the session is
about, and the role purpose already frames standing capability. Cheap to flip.

### 2. The session cursor and the per-turn delta

Each chat session holds a cursor. Each turn asks the corpus what changed since
it, inlines the new titles, and advances it.

**No new artifact.** `updated_at >= cursor` is the same change feed [[REQ-159]]
consumes for indexing; this is that query with a different cursor, and the
session is a ticket, so it already has somewhere to keep one.

**Except that in the Worker it is not one yet, and that is part of this ticket.**
`apps/control-app/src/ai.ts` wires an `R2TranscriptArchive` — the transcript is
an object at `chat/<tenant>/<session>.md` and no `chat` ticket is ever created.
The component's `TicketSessionArchive` is what [[DOC-10]] §8 specifies: the
session homed in a `chat` ticket found or created by `fields.session_id`, the
whole session file in a `chat_transcript` comment on it, the body left for the
AI-maintained summary, writes compare-and-set. Everything is a ticket, and the
transcript is not the exception.

The switch is a drop-in and not a port. `TicketStore` already exposes the six
operations the component's duck-typed `TicketClient` names, with the same
envelopes, and `productTypePack` already merges `chatSchemas()` — so this is a
line in `workerHost` and the deletion of a class, not an adapter.

Three things follow, and each is a reason rather than a side effect:

- **The cursor has a home with a lifetime that matches it.** It is per session,
  and the session is now a ticket, so it is a field on that ticket. It is not
  derived data beside the index — which is where [[REQ-159]] correctly put the
  *transcript* cursors, because those are a property of an index pass and not of
  a conversation.
- **[[REQ-159]]'s `onTranscriptGrew` gets its caller.** It has none today, for
  exactly this reason: there is no chat ticket for a transcript to grow on.
- **Tenancy stops being a convention.** The R2 transcript's isolation is that its
  key sits outside `draft/` and nothing derives an R2 root from a request. Under
  the ticket store it is the same information barrier as everything else, bound
  into the handle by `forTenant`.

The costs are named rather than discovered. The whole session file is rewritten
per turn — [[DOC-10]] §8.1 accepts this and records the message-granular archive
as the fix for the day it hurts. A D1 row is bounded where an R2 object is not,
so a long enough conversation meets a ceiling the R2 archive did not have. And a
concurrent write now fails loudly on the compare-and-set instead of silently
losing the later fold, which is the better failure and still one the junction
serialises upstream.

A change-log *ticket* was considered and rejected ([[DOC-39]] §5.1): rewritten on
every upload, a compare-and-set contention point, unbounded growth in one body,
and either polluting the corpus or requiring a predicate everyone remembers. The
feed is automatically complete over every corpus member.

Three behaviours that are requirements, not polish:

- **An empty delta emits nothing** — not *"nothing new"*. A line that appears
  every turn and is almost always empty trains the model to skip the region it
  appears in, which is the region the non-empty case needs to be noticed in.
- **The delta is capped** with an *"…and N more"* summary. A bulk import or a
  capture run can put hundreds of entries in one turn, and an unbounded delta
  reintroduces the pile priming exists to avoid.
- **The cursor must not re-report the document it stopped on.** The change feed's
  predicate is `updated_at >= cursor`, inclusive at the boundary — the component
  chose that so an indexer cannot miss a document written in the same instant its
  cursor was taken. Inclusivity means a cursor set to the newest timestamp sweeps
  that document up again next turn, and every turn after it. So the boundary
  travels with the uids that sat exactly on it, and those are dropped from the
  next sweep. A bulk import writes many documents in one instant, so it is a list
  and not a single uid — bounded by one timestamp's worth of ties, never by the
  corpus.
- **A corrupt cursor costs a sweep and never a turn.** It is a bookkeeping field;
  one that will not parse is worth one over-wide sweep, which re-announces a
  document at worst. Failing the conversation over it would be the more expensive
  answer, and it is the same judgement [[REQ-159]] made for its transcript
  cursors.
- **A conversation is never reported to itself.** Chat tickets are corpus members
  and are not delta entries. The session's own chat ticket is where the cursor
  lives, so a sweep that included it would announce the conversation to itself
  every turn, forever — and until [[REQ-171]] writes the summary its body is
  reserved for, a chat ticket carries no content to search for anyway. The
  exclusion is the delta's alone: chat tickets stay in the corpus, stay indexed,
  and stay in the landscape.
- **Ordering is a cost decision.** The maps are stable across turns; the delta
  and the transcript tail are not. Stable material sits *before* volatile
  material, so the seeded prefix stays prompt-cached for the life of the session
  instead of being invalidated every turn. Trigger last of all.

### 3. The change-feed operation

**RAG cannot answer "what changed."** Cosine similarity has no notion of time —
the ranker's `recencyFactor` biases relevance, it does not permit a temporal
query. So *"what have we added since we last spoke?"* and *"did we ever upload
the pricing deck?"* have no path today.

It is an **operation on the declared knowledge surface**, not a bespoke tool —
the reasoning [[DOC-10]] §5.2 used for the four memory tools applies unchanged.
Declaring it supplies argument validation, the capability grant, results marked
untrusted, the audit trail, and the projected manual. Same KB scope argument as
search, defaulting to all; returns uid, title, `kind` and `rights`, ordered by
time.

## Depends on

[[REQ-158]] (the surface exists and is wired) and [[REQ-159]] (there is a corpus
that changes). The delta is inert without a second KB, which is why this is not
folded into either.

And on the `knowledge` component, through lagrange-framework REQ-112, for the two
things the host cannot supply for itself:

- **Co-ranked search over independent per-KB indexes.** The knowledge bases stay
  independent — separate corpora, separate indexes, separate build cadences — and
  meet only when results are presented. `search` takes a single `IndexSource`
  today, so a session declaring two KBs can only search one of them. Merging the
  two indexes into one artifact would make "independent" false at the layer that
  matters; re-ranking in the host would be a second answer to how hits are
  ordered.
- **The change-feed operation of piece 3**, which has to be declared on the
  surface to get what declaring buys.

The second is genuinely blocked and waits. The first is not, and is delivered
here in the only place available today: the session's knowledge surface fans a
search out to each knowledge base's own runtime — its own index, its own store,
its own declared weight, so the component's full ranking runs within each — and
then merges the results on the component's own scores, sorting by them and
cutting the union to the requested `k`. It does not re-rank, re-weight or
re-score; a second answer to how hits are ordered is what the component refuses
to have, and this does not become one. **Two independent indexes, co-ranked for
presentation** — which is the requirement, not a stand-in for it. A tie breaks
project-first, by the stability of the sort over the same order the landscape
uses.

The scores are comparable by construction, and that is what makes the merge sound
rather than merely plausible: one embedding model across both indexes, which the
component's search already requires, and one set of ranking dials on both sides.
REQ-112 moves the merge inside the ranking, at which point the fan-out here
deletes.

## Out of scope

- The project KB's corpus, indexing and map triggers — [[REQ-159]].
- **The chat ticket's AI-maintained summary.** Making the session a ticket does
  not make the conversation knowledge: the component indexes title and body, the
  transcript is a comment, and the body is deliberately left alone. So a chat
  ticket enters the corpus carrying its session id and nothing else until
  something writes that summary. Named here because [[DOC-39]] §7 leans on chat
  entries having an AI-written body, and after this ticket they still will not.
  [[REQ-171]] owns it, together with the session prompts and turn reminders it
  has to be written into.
- **The audit trail.** `flushAudit` keeps writing one R2 object per record —
  distinct keys cannot collide, which is a different trade from a ticket per
  record and not one this ticket is making.
- **Node's host.** `1c builder` keeps `FileArchive`; there is no writable ticket
  store under the CLI to home a session in.
- Removals. The feed is reliably additive and unreliably subtractive; an archive
  or detach may not surface in an `updated_at >=` sweep. Recorded, not solved.

## Acceptance

- A cold session is primed with both landscapes in one section, then role
  purpose, then mechanism and trigger.
- A small project corpus enumerates in the landscape and says it is complete.
- **The behavioural test:** upload a document mid-session; on the *next* turn the
  AI knows it exists and can answer from it — **without** waiting for a map
  rebuild. This is the criterion that matters; the rest is mechanism.
- An empty delta contributes no tokens.
- A delta above the cap is truncated with a count and remains reachable through
  the change-feed operation.
- The change-feed operation appears in the projected manual without anyone
  writing prose for it.
- A resumed session's first turn reports what arrived while the client was away.
- A turn taken in the Worker leaves a `chat` ticket carrying `session_id`, with
  the session file in a `chat_transcript` comment on it and the body untouched;
  the next turn folds onto it rather than minting a second.
- The session's cursor is a field on that ticket, and it advances by the turn.
- A search reaching both knowledge bases returns one list ordered by the
  component's own scores, with each index read through its own runtime.

## Decided

Both open questions are settled by [[DOC-39]] rather than left to fall out.

- **The cursor starts where the landscape's coverage ends** (§6.3) — concretely,
  the awareness map's build timestamp, and session start below the enumerate
  floor where the listing is generated fresh. Not "now": a document uploaded
  after the last rebuild and before the session opens belongs to neither the map
  nor a start-of-session cursor, and anchoring on the build time makes the two
  exactly complementary. This also answers the cross-session case — B has a
  cursor of its own, so material A saw is new to B only if it postdates B's map.
- **A single oversized title is clipped, not dropped.** The degenerate case of
  the cap: one title longer than the whole budget. A delta reporting that a
  document arrived while naming none would announce that something happened and
  withhold the only part that is actionable.
- **The cap is characters, ~400, and the count is always exact** (§6.4). A
  character budget is a hard stop on content, but the number is one integer and
  is never truncated — so a bulk import reads *"41 documents added, including
  …"* and the AI has both the magnitude and a sample. Truncating the count would
  hide the one thing searching cannot recover.
- **Resumption needs no separate report.** It is identical to initiation (§6.3);
  the cursor rule above is what makes the first turn after a resume carry what
  arrived while the client was away.


---

## BUG-41: Library: an uploaded .md is stored undescribed because the browser sends no content type

## Symptom

Upload a `.md` file to the Library, click it, and the detail pane says:

> **What this is** — Stored but not described: nothing here can read
> application/octet-stream. It can be found by name, not by its contents.
> File: gigabyte_alchemy_summary.md · application/octet-stream · 2811 bytes

Expected: the file's own text in the detail pane (which is what the "What this
is" body is for a textual document), alongside the material's metadata block.

## Root cause

Two independent faults, both on the ingestion path.

**1. The content type is never resolved from the filename.** Browsers have no
registered MIME type for `.md`, so `File.type` is the empty string. The upload
route (`router.ts`) falls back to `application/octet-stream`, and that string is
then used verbatim by all three downstream steps:

- `classify()` → `kindOf` returns `document` (correct, by its catch-all);
- `describe()` → `describeDocument` asks `isTextual('application/octet-stream')`,
  which is false, so it takes the `unsupported` branch and writes the degraded
  body above instead of the file's text;
- `store.attach()` → the attachment record records `application/octet-stream`
  permanently, so the wrong type is what a re-describe pass would read too.

`kindOf` already consults the extension when the type says nothing — but only to
pick `kind`, and only for fonts and images. Nothing repairs the content type
itself, so the describer keeps seeing `application/octet-stream`.

**2. A leading YAML front-matter block becomes the title.** Once the file *is*
read as text, `titleFromText` takes the first line of three or more characters —
which for a front-mattered markdown file is the `---` fence. The document's real
title, frequently sitting in that block as `title:`, is ignored.

## Fix

**Resolve the content type once, at the head of `ingest()`,** so classification,
description and the attachment record all see the same repaired value:

- a new `resolveContentType(contentType, filename)` in `material.ts` maps a
  filename extension to a content type **only** when the caller's type is absent
  or `application/octet-stream` — a type the browser or server actually stated is
  never second-guessed;
- the table covers the textual formats a client plausibly hands over (`md`,
  `txt`, `csv`, `html`, `json`, `xml`, `yaml`, …) plus `pdf`, the image types and
  the font wrappers, so the repair benefits `kind` and the describer alike;
- an unmapped extension still lands on `application/octet-stream` and still
  degrades honestly — the existing trade is preserved, not widened.

A markdown upload then reaches `describeDocument`'s textual branch and its body
becomes the file's own text, which is what the detail pane renders.

**Take the title from the front matter where there is one.** `titleFromText`
skips a leading `---` … `---` block rather than reading its fence as a title,
and prefers a `title:` declared inside that block when present. This is a
technical consequence of fault 1's fix: until markdown was read as text at all,
neither behaviour could be observed.

The attachment's recorded `content_type` becomes the resolved value, so the
Library's metadata block names the file honestly (`text/markdown`, not
`application/octet-stream`).

## Test plan

`tests/test_UAT_FC_BUG-41_markdown_material.test.ts` (node) —
`resolveContentType` repairs an absent and an `application/octet-stream` type
from the extension, leaves a stated type alone, and leaves an unknown extension
degrading as before; `describe()` of markdown returns `status: 'ok'` with the
file's text as the body; the front-matter title is preferred and the `---` fence
never becomes a title.

`tests/test_UAT_FC_BUG-41_markdown_upload.workers.test.ts` (workerd) — a `.md`
file posted to `/api/material` with an empty `File.type`, through the real route
against real D1/R2, yields `description_status: 'ok'`, a ticket body carrying the
file's own words, and an attachment record whose `content_type` is
`text/markdown`.


---

## BUG-42: Builder: markdown shows as source on first load, and never renders in the Library

## Symptom

Two places in the builder show markdown **source** where they should show
rendered markdown.

1. **The chat transcript, on a cold load.** Open the builder for the first time
   (or after a hard reload with an empty HTTP cache) and the replayed transcript
   appears as raw text with the markdown markers still in it — `**bold**`,
   `## heading`, `- item`. Reload and it renders correctly.
2. **The Library tab's "What this is".** The material description never renders
   as markdown, on any load. It is the AI-written body of a `material` ticket
   (DOC-38 §6) and is markdown by construction, but it is shown as its source.

## Root cause

Both are the same missing rule, in two places: **a surface renders markdown
before the engine that renders it has arrived.**

The rendering engines are third-party and lazily imported from a CDN behind the
components' seams — `marked` via `loadMarked()`, DOMPurify via `loadSanitizer()`.
Until one is present, `renderSafe()` deliberately degrades to *escaped source*
rather than raw HTML. That degradation is correct policy; what is wrong is that
we hit it on a path where the engine was merely late rather than absent.

1. `chat.js` fires `loadMarked()` / `loadSanitizer()` and does not wait for them,
   while `app.js`'s `showSite` replays the transcript as soon as the session
   fetch answers. On a **cold** load the CDN import is uncached and loses the
   race, so every turn is painted as escaped source — permanently, because
   `mountChat` renders each message once and exposes no way to re-render it. On
   a **warm** load the CDN import is served from cache, wins, and the same code
   looks correct. That is the whole of the "works on refresh" behaviour.
2. `library.js` renders the description through `mountFields`, whose read cell is
   a plain-text span by design. It was never asked to render markdown at all, so
   there is no race here — just a permanent miss.

## Fix

**One rule, applied at both surfaces: do not paint markdown before the engine
has settled.**

- A new `builder/markdown.js` owns the engines for the whole builder. It starts
  both loads once, at import, and exports `markdownReady` — a promise that
  settles when they have loaded *or* failed. It never rejects: offline is a
  plainer panel, not a broken one, and that is unchanged.
- `chat.js` stops firing the loaders itself and takes them from that module.
- `app.js`'s `showSite` awaits `markdownReady` alongside `openSession`, so a
  transcript is never replayed into a panel that cannot yet render it. The two
  waits run in parallel, so this costs no added latency beyond the slower of the
  two, and the existing generation guard already covers the extra async. The
  failure branch waits too, because the note it writes is also markdown.
  `markdownReady` is injectable through `mountBuilder` so a test can hold the
  engines open and observe the ordering directly.
- `library.js` paints the description's read cell as rendered markdown. The cell
  element is kept — only its children are replaced — so the component's
  click-to-edit affordance, its classes and its listeners all survive, and
  editing still opens a textarea over the markdown **source**. A `MutationObserver`
  repaints whenever the component rebuilds the cell (commit, cancel, or a failed
  write rolling back), and the paint is redone once `markdownReady` settles, so a
  detail opened during a cold load upgrades itself rather than staying as source.
  An empty description keeps the component's own placeholder.

Rendering goes through `renderSafe` — render then sanitize — in both places.
Material descriptions are LLM output written from client-supplied files, so they
carry exactly the trust level the chat panel already sanitizes for; the library
must not be the one surface that inserts that HTML unscrubbed.

Read-only rights fields, the commit model (`auto`, no Save button) and the
"one editable field, and it is the description" shape are all unchanged.

## Test plan

`tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts`, against the actually
installed components with only the network doubled, on the pattern the REQ-127
and REQ-161 suites already use:

- the transcript is not painted until `markdownReady` settles, and renders as
  HTML once it does — driven by holding an injected `markdownReady` open across
  the session open, which is the cold-load ordering stated as a test;
- a transcript replayed with the engines already present renders as HTML, so the
  fix is not merely a delay;
- the Library's "What this is" shows the description rendered, not its source;
- clicking it still opens a textarea holding the markdown source, and committing
  through it still writes — the existing REQ-161 editing contract is intact;
- a corrected description is repainted as rendered markdown after the write;
- an empty description still shows the component's placeholder.


---

## REQ-172: Library detail: render documents inline, with an expand-to-modal reader

## What the client sees today

The Library detail pane renders **images** inline and offers everything else as
a bare download link. A client who has just uploaded their brand guidelines or a
positioning note gets a filename and a download — the pane can show them a
photograph but not a document, which is the same "recognise it by its path"
problem [[REQ-132]] removed from the image picker.

## What changes

**A document is shown, not named.** The preview slot above the metadata gains a
bounded, scrolling reader window for the kinds we can render, with the download
link kept beneath it in every case:

| The bytes are | Shown as |
|---|---|
| `image/*` | inline `<img>` — unchanged |
| `text/markdown` | the markdown, rendered |
| any other `text/*` (plain, csv, log), plus JSON and XML | the text itself, preformatted |
| `application/pdf` | the browser's own PDF viewer, in a frame |
| anything else | the download link alone — unchanged |

The window is capped at the height the image preview already uses and scrolls,
so a fifty-page brand book does not push the rights record and the description
off the bottom of a pane whose job is to show them together.

**An expand button, top right of the reader.** Two arrows pointing away from each
other. Pressing it opens the same content in the builder's existing modal shell
at modal size, so a long document can be read without the list and the metadata
competing for the pane. Escape, the backdrop and the close button all shut it, as
they do for every other builder dialog — the shell is reused rather than rebuilt,
which is what makes that true without this ticket implementing any of it.

**PDFs — yes, and cheaply.** The file route already serves the stored content
type with `content-disposition: inline`, which is exactly what the browser's
built-in PDF viewer wants, so a frame pointed at that URL is a real scrollable
viewer with no library, no build step and no second transport. Two honest limits,
both accepted: it is the *browser's* viewer, so its chrome differs a little
between browsers and we do not control it; and iOS Safari renders only the first
page inside a frame — irrelevant while the builder is a desktop surface
([[DOC-14]] §8). The bytes are read once: the frame asks the route for them
itself, so nothing fetches them a second time to show the file once.

## Technical consequences of the above

These are not separate asks; they are what the above requires.

**The row has to say what the bytes are.** The detail decides how to render from
the content type, and `MaterialRow` carries only `kind` — which is `document` for
markdown, text and PDF alike. So the resolved content type is duplicated onto the
material ticket's own fields at ingest, exactly as `filename` already is and for
the identical reason: the alternative is an `attachments()` call per row to draw
a list. It is written from the same variable the attachment record gets, so the
[[BUG-41]] repair recorded there cannot drift from what the Library reads.

**Material that predates the field resolves its type from its own name.** A
client's existing corpus has no `content_type` on its tickets, and treating
absence as a fourth state would leave every document they already had as a
download link — the bug, still there, for everyone already using this. The row
falls back to `resolveContentType`, which is the same mapping the field caches,
so nothing has to be backfilled. A stated type is still kept over what the
extension would say, and an unmapped extension still degrades to
`application/octet-stream` and no reader — this widens what can be shown without
changing what happens to what cannot.

**Rendered markdown is sanitized.** Markdown reaches the DOM as HTML, and a `.md`
can arrive from `/api/material/fetch` as well as from the client's own disk, so
these bytes are not necessarily trusted. It is rendered through the same
`renderSafe` seam the chat panel and the description cell already use
(`webui-chat` over `webui-markdown` + DOMPurify), which degrades to escaped source
rather than raw HTML when the sanitizer has not loaded. A hand-rolled second
sanitizer for the same origin would be a second security boundary to keep in step
with the first.

**And it repaints when the engines land.** [[BUG-42]]'s failure applies to this
window exactly as it did to the transcript and the description: a reader painted
while `marked`/DOMPurify are still coming down from a CDN shows escaped source,
which is right when they are absent and wrong when they are merely late. The
window therefore waits on the same `markdownReady` signal and repaints once —
including into an expanded dialog that is already open.

**Plain text is not rendered as markdown, and HTML is not run.** A `.txt` put
through a markdown parser loses its own line breaks and gains headings its author
did not write, so it is shown as itself. An uploaded `.html` is shown as its
source for the stronger reason: rendering a client-supplied document as live
markup would be a script-execution surface offered as a convenience.

**An SVG stays a picture.** It decodes as text, and it is the one textual type the
reader refuses — `kindOf` files it as an image and the pane already has an `<img>`
for it. Showing a client their own logo as angle brackets would be a regression
dressed as a feature.

**The reader is destroyed with the detail.** It owns an in-flight fetch and
possibly an open dialog, and `list-detail` swaps details as the client browses. A
reader left behind would repaint an element no longer on screen and leave its
expanded window hanging over the file that replaced it.

**A record whose bytes are gone says so**, in the same words the missing-image
path uses, rather than showing an empty window.

**The markdown seam is re-exported from the builder's own module.**
`bug32-webui-scope-rebrand` permits the component scope in its declaration and in
`src/builder` alone, and a suite asserting *rendered* markdown must inject the
engines because a CDN import cannot run under vitest. So `markdown.js` — already
"the builder's markdown engines, in one place" — re-exports `setParser` and
`setSanitizer` beside `renderSafe`.

## Why free-coded

A pane that renders four content types where it rendered one, inside a component
vocabulary and a modal shell that both already exist. No new design decision, no
new transport.

## Test plan

`tests/test_UAT_FC_REQ-172_library_document_preview.test.ts` (jsdom, real
components, `WEBUI_INSTALLED`-gated as its [[REQ-161]] sibling is): which reader a
content type selects; markdown rendered into the window above the metadata; a
`.txt` shown as itself with the engines present; a PDF given a frame at the file
URL and its bytes not read twice; an image keeping its `<img>`; an unrenderable
kind offered exactly as before; missing bytes reported; the cold-load repaint;
the expand button opening the builder's dialog shell with the same content;
Escape closing it and the button reopening it; and browsing to another row taking
the expanded window with it.

`tests/test_UAT_FC_REQ-172_material_content_type.workers.test.ts` (workerd,
through `route()` against real D1 and R2, on the REQ-161 surface suite's pattern):
three documents one `kind` cannot tell apart arriving with three content types;
the row and the attachment record agreeing; a stated type kept over the
extension; material written before the field resolving from its filename; and an
unnamed binary staying unnamed.


---

## REQ-156: The image layer leaves native code: sharp off the fidelity path

# The image layer leaves native code: `sharp` off the fidelity path

## The blocker

`sharp` is a **native** module. It cannot run in workerd, and no amount of `nodejs_compat` changes
that. It is a declared dependency of this repo — `1c preflight` lists it beside `playwright` — and
every pixel-comparing verb bottoms out in it. So `1c diff`, `1c crop`, `1c aligned-crops` and
therefore `1c gate` are blocked in the cloud for a reason that has nothing to do with the cloud.

This was not previously ticketed and is not visible from any design document; it was found by
reading the imports.

## It is much smaller than it looks

Seven call sites, four operations, all PNG:

| Operation | Call sites |
|---|---|
| decode PNG → raw RGBA | `perceptual.ts:308`, `perceptual.ts:319` |
| encode raw RGBA → PNG | `perceptual.ts:334`, `perceptual.ts:360` |
| read dimensions | `perceptual.ts:384` |
| extract a rectangle | `perceptual.ts:393`, `aligned-crops.ts:156`, `aligned-crops.ts:163` |

No resize, no colour management, no format conversion, no compositing. That is a **codec**, not an
imaging library. Once decode and encode exist, crop and dimensions are arithmetic over a raw
buffer — which is the representation the perceptual code already works in.

## The decision: hand-rolled, dependency-free

Candidates were weighed — a WASM PNG codec (`@jsquash/png`, `@cf-wasm/photon`) or a pure-JS one
(`fast-png`, `upng-js`) — and **rejected in favour of writing the codec into this repo**. The
deciding fact is that the expensive half of PNG is DEFLATE, and both Node and workerd expose
`DecompressionStream('deflate')` / `CompressionStream('deflate')` natively. What is left is the
PNG container itself: chunk walking, five row filters, and the reverse. Roughly two hundred lines
against a bundled WASM binary or a dependency whose own maintenance we would inherit.

Taking a dependency stays available if decode turns out too slow to live with — this is a
reversible decision, and the measurement in AC6 is what would reopen it.

## Formats: PNG is the whole of this path, deliberately

`sharp` is confined to `tools/generate/src/cli/`, whose only decode inputs are Playwright
screenshots — always 8-bit truecolour PNG. Replacing it with a PNG-only codec narrows nothing,
because **JPEG, GIF and WebP are already supported everywhere the product actually handles them,
and none of those paths decode**:

- `apps/control-app/src/material.ts` accepts `jpeg, gif, webp, avif, svg`, stores the bytes whole
  and records the content type.
- `apps/control-app/src/describe.ts` hands those bytes to the vision model to produce the
  searchable body. It never looks at a pixel.
- `apps/public-site/src/content-type.ts` serves them by content type; the browser decodes.

Hand-rolling those codecs would therefore buy nothing and cost a great deal: baseline JPEG is
~1200 lines and — because the IDCT is specified only to a precision *bound* (ITU-T T.83) — is not
even bit-exact between conforming decoders, which is the property AC2 depends on. Lossy WebP is a
VP8 keyframe decoder. **HEIC is out of reach dependency-free** and is not attempted here: it is an
HEVC intra decoder, patent-encumbered, and `libheif` itself delegates to `libde265`.

HEIC *is* a real gap — an iPhone photo has no content type in `material.ts`, is refused by the
Messages API, and no browser will display it — but it fails at the ingestion boundary, not at
`sharp`, and its fix is transcode-on-upload. **Out of scope here; needs its own ticket.**

### Consequence: non-PNG input is refused, not silently mishandled

`1c crop --input` today accepts anything `sharp` can read. After this change it accepts PNG only,
so it must **fail with an explicit error naming the format it was given** rather than misreading
a JPEG's header as a corrupt PNG. This is a deliberate, stated narrowing of an existing verb.

## What must not move

The verdicts. `1c diff` produces ranked regions, band statistics, and mean/percentage floors that
`1c gate` compares against `values-diff` and `l1-gate` to decide whether a disagreement means
`capture-incomplete`, `reproduction-wrong` or `unexplained-disagreement`. If a codec swap shifts
those numbers, every fidelity result recorded to date becomes incomparable with every result
after — and the failure is silent, because the new numbers look just as plausible as the old ones.

Pin it with a fixture corpus. Because the decoder is ours and PNG is lossless, this is **exact
equality on decoded pixels**, not a tolerance band — a bound would hide precisely the drift it is
meant to catch.

## Worth doing even if the cloud were cancelled

Once [[REQ-154]] puts `playwright` behind the driver seam, `sharp` is this repo's last native
dependency. Removing it makes `pnpm install` portable across platforms and removes a class of
build failure that has nothing to do with the product.

## The rest of the fidelity path

`l1-gate`, `values-diff` and `responsive-diff` are manifest arithmetic, not pixels. They are
probably already free of Node built-ins and probably already run in workerd — but "probably" is
not a state to ship, so confirming it is in scope, and porting whatever is not.

## Shape: a pure core the Worker can import

`perceptual.ts` mixes arithmetic with filesystem reads. The codec and the comparison arithmetic
must separate from the fs/browser shell, so the workerd UAT can import the core without dragging
`node:fs` into the isolate. This is a structural consequence of AC3 rather than a request in its
own right.

## Acceptance criteria

1. No `sharp` import remains under `tools/generate/src`; `1c preflight` no longer declares it.
2. `1c diff`, `1c crop` and `1c aligned-crops` produce the same verdicts, ranked regions and band
   statistics on a fixture corpus as they do today — decoded pixels **byte-identical** to what
   `sharp` produced, and re-encoded PNGs decoding back to identical pixels (the compressed bytes
   themselves may differ, since DEFLATE output is not canonical).
3. The same code runs in workerd: a UAT in the workers project produces a perceptual diff from two
   PNG fixtures against real bindings.
4. `l1-gate`, `values-diff` and `responsive-diff` are confirmed workerd-clean at their **arithmetic
   cores** — the comparison functions, imported and exercised in the workers project. Whether their
   *bundle-reading* entry points run in workerd depends on the store seam and belongs to
   [[REQ-155]], not here.
5. `1c gate` runs end-to-end in workerd against a stored reference bundle and reproduces the CLI's
   three-way reconciliation.
6. Decode time for a full-page screenshot is measured and recorded, not assumed.

## Deferred: streaming row-lockstep decode

Decoding whole rasters holds two full-page images plus a diff buffer at once — around 60 MB for a
1280×4744 screenshot, against a Worker's 128 MB isolate. Since PNG is stored row-major and the
diff compares like coordinates, decode and diff could run in row lockstep and hold only a few rows
at a time. **Not built now**: the decoder unfilters row by row internally regardless, so this
remains a change to one function rather than a rewrite, and it should wait until a real page
exceeds the budget.

## Note on sequencing

Only AC5 needs [[REQ-155]]. Everything above it is independent of the browser and the store and
can start immediately, in parallel with [[REQ-154]].

## Origin

[[CHAT-27]]. Third of four, and the only one nobody knew about.


## What the codec must do, precisely

These are consequences of the decision above rather than separate requests, but
each is a behaviour someone could get wrong, so each is stated.

**It must reproduce sharp's greyscale expansion.** `sharp` does not hand back the
source's channel count — it converts to sRGB on decode, so a greyscale PNG
arrives as 3-channel RGB and greyscale+alpha as 4-channel RGBA, and an indexed
image is promoted from 3 channels to 4 only when a `tRNS` chunk is present. This
is not cosmetic: `computeDiff` strides its reads by `Raster.channels`, so a
decoder that honestly returned the source's own count would read across pixel
boundaries and silently change every number the gate depends on. The codec
reproduces the expansion exactly.

**It must cover the decode paths the corpus pins.** All five row filters, an IDAT
stream split across chunks, odd row strides, sub-byte greyscale and indexed bit
depths, and a palette with and without transparency. The fixtures are authored by
hand rather than by an encoder, because asking an encoder for a specific filter
is asking it to hit one by luck.

**It must refuse what it cannot do, by name.** 16-bit samples and Adam7
interlacing are out of scope — nothing in this pipeline produces either — so they
raise an error naming the feature rather than being guessed at. A truncated or
self-inconsistent PNG is a distinct failure from an unsupported one, and from a
file that is not a PNG at all.

**Dimensions must be readable without inflating.** The IHDR is the first 33 bytes;
`1c crop` clamps its box against them before deciding it needs pixels at all.

**Crop clamps rather than throws.** A region bbox on the bottom band of a tall
page routinely over-reaches the image by a few pixels. Failing a run over an edge
the operator did not choose would be the wrong trade, and is not what the
previous implementation did.

**Greyscale heatmaps should be stored as greyscale.** `sharp` converted to sRGB on
the way *in*, so the 1-channel rasters `1c diff` handed it came back as 3-channel
PNGs — the heatmaps have been stored at three times the size they need. Writing
colour type 0 is free, because decode reproduces the expansion and hands back
(g,g,g) either way.

**`crop` leaves the preflight map.** `sharp` was its only declared dependency and
it opens no browser, so with the codec in-repo it loads nothing that can be
absent. A gate on an empty requirement can only produce false refusals, so the
entry goes rather than emptying.

## Sequencing, revisited: AC5 is not deliverable yet

[[REQ-155]] is `ready_to_reconcile`, not reconciled, so its `ReferenceStore` port
is not on this branch to build against — and `cmdGate` still resolves its
reference with `fsReferenceBundle(opts.ref)` and passes a filesystem *path* down
to `cmdDiff` and `aligned-crops`. AC5 therefore stays open until REQ-155 lands,
exactly as the sequencing note above anticipated. AC1–AC4 and AC6 do not depend
on it and are delivered.

## A finding AC4 turned up

The l1-gate arithmetic is workerd-clean, but not through the front door. `cmdL1Gate`
lives in `repro.ts`, which reads and writes files, and the `l1` **barrel**
re-exports `roundtrip.ts`, which imports `node:http`. `foldToL1` and
`threeProbeGate` themselves are pure, so reaching them from a Worker means
importing `l1/fold` and `l1/probes` directly rather than `../l1`. That is an
import path, not a port — recorded so the next caller does not rediscover it.

`values-diff` needed nothing: `capture/values-diff.ts` imports no `node:` module
at all. `responsive-diff.ts` does import `node:fs` at module scope for the report
it writes, but the import resolves under `nodejs_compat` without being called, so
its table builder and classifier run as they are.


## One honest caveat about "the last native dependency"

`sharp` is gone from `tools/generate/package.json` and from the workspace
lockfile's direct entries, and `pnpm install` no longer places it in
`tools/generate/node_modules`. It does still appear in `pnpm-lock.yaml` as a
TRANSITIVE dependency of `miniflare`, which `@cloudflare/vitest-pool-workers`
pulls in to run the workerd test project. So a developer's `pnpm install` still
builds a native module — for the test harness, not for the tool. The claim this
ticket can make is the narrower one: nothing the product ships declares or loads
`sharp`, and no `1c` verb can fail because it is absent.


---

## BUG-43: Builder preview: the frame is never reloaded after an assistant turn

## Symptom

Asking the assistant in the builder chat to change a site appears to work — tool
activity streams into the pane, the assistant reports what it did — but the site
in the preview panel does not change. A manual browser refresh does show the
change (confirmed by the operator), which locates the fault in the panel rather
than in the write path.

## What was verified, and how

The **server side is not at fault**. A probe driving the real Worker in workerd —
`POST /api/ai/session`, then `POST /api/ai/prompt` with a scripted model that
calls `add_page` — showed the whole chain working: the tool ran, `edit.ts` wrote
to D1, and an immediately following `GET /preview/<slug>/draft/<newpage>` rendered
the new page (200, correct `<title>`). The write lands and the next render sees
it.

## Root cause

**Nothing reloads the preview iframe when the assistant writes.**

Every *other* producer of structured edits does reload it, in the same idiom:

- `app.js:140` — the palette popup's `onChanged: () => panel.frame.contentWindow?.location.reload()`
- `app.js:227` — the segment editor's `onSaved: () => …reload()`

The chat pane has no equivalent. `draft` and `edit` render at request time
(REQ-119), so there is no artifact for a save to keep in step — the reload *is*
the update mechanism, and the assistant is the one writer that never triggers it.

The assistant is also told the opposite: `CARETAKER_SYSTEM` (`roles.ts`) states
"The page the user is looking at re-renders after every change, so they will see
it" — which is why it reports the change and does not suggest reloading.

## What is wanted

A change signal on the turn stream that the panel can act on, **emitted per write
rather than once at the end of the turn**, so that a request answered by several
edits shows the page unfolding as the assistant works rather than jumping to a
finished state when it stops talking.

The signal is produced by the host from the draft change counter, not asked of
the model. The assistant does not have to remember to announce its own writes,
cannot forget to, and cannot announce one it did not make — the same reason the
per-turn change reminder (REQ-131) is pushed rather than looked up. There is
deliberately no new operation on the L1 surface for this: a declared tool would
be a capability the model could skip, and the page would then not update at
exactly the moments it mattered most.

## Fix

Give the turn a change signal, emit it as the writes happen, and reload on it.

1. `host-core.ts` `streamPrompt` already reads the draft change counter before
   the turn (for REQ-131's reminder) and again after it (for the baseline).
   Instead of passing the model's stream straight through, it iterates it: after
   every `tool_activity` event it re-reads the counter, and when the counter has
   moved it yields a `{kind: 'site_changed', meta: {at, changes}}` event of its
   own before continuing. One primary-key read per tool call, and none on a turn
   that calls no tools.
2. `chat.js` takes an `onSiteChanged` callback and wraps the transport to watch
   for that event. Unknown event kinds are ignored by `mountChat`, so the signal
   is observed in our own wrapper and never reaches the component.
3. `app.js` passes the same `reload()` the palette popup and the editor pass.

Reloading a frame is the host's business, and a host that fails at it must not
take the conversation with it: a callback that throws is swallowed and the turn
finishes streaming its answer in full.

Only a counter that actually moved produces a signal, which is what keeps a
read-only turn ("what pages does this site have?") from resetting the operator's
scroll position for nothing.

## Test plan

`tests/test_UAT_FC_BUG-43_*`:

- **workerd** — a scripted turn that calls two write tools emits a `site_changed`
  frame after *each* of them, each carrying the counter as it stood at that
  moment, and interleaved with the tool activity rather than collected at the
  end. A read-only turn emits none. Asserted through the Worker's own `fetch`
  against real D1/R2, so it also pins the write-lands-and-the-next-render-sees-it
  property the probe established.
- **panel** — a turn whose stream carries `site_changed` invokes `onSiteChanged`
  once per signal, carrying the counter; one that does not, does not. The signal
  leaves no trace in the conversation, and a callback that throws does not cost
  the operator the assistant's answer.
- **app** — a turn reporting two writes reloads the preview frame twice, and a
  turn reporting none leaves it alone.