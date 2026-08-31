---
uid: report-8b7b0181
id: REPORT-2930
type: report
title: 'Reconciliation Review: commits (BUNDLE-20)'
created_by: xgd
created_at: '2026-08-31T13:00:33.176337+00:00'
updated_at: '2026-08-31T13:00:33.176337+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-b3b7c399
  anchor_uid: bundle-b3b7c399
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: —
**Anchor**: bundle-b3b7c399 (BUNDLE-20)
**Stories Reviewed**: 12 (11 plan items; item 4 targets two stories)

## Method

Intent read first: the bundle body in full (129,529 chars — ten ticket bodies plus
their implementation records). `xgd ticket comments bundle-b3b7c399` returns none,
so the body *is* the whole intent, including the "what landed" halves that
supersede several planning halves.

Code read second and independently: the control-app Worker entry and gate, the
D1/R2 store, the router, the publish service, the intl and locale modules, the
launcher, and the deploy hooks — plus the 18 reconciliation UAT files and the 19
`test_UAT_FC_*` files this bundle's tickets left behind.

Stories read third. 182 acceptance criteria across the 12 stories were enumerated
from the ticket store and each cross-checked against the `test_UAT_AC<n>_*`
functions actually present in the tree.

## Behavior Inventory

70 behaviours identified across ten source tickets, in ten groups matching the
plan's own inventory: the Access gate; the D1/R2 site store; the builder origin in
workerd; the AI host in workerd; behavior modules without a transform; the plain
Vite bootstrap; publish in the cloud; public serving from the revision record;
site locale identity; and the money/time seam.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Access JWT verified in-Worker: RS256, alg pinned from JWKS, `aud`/`iss`/`exp`/`nbf`/`iat` | Covered | story-182e8cb9 | AC-1375, AC-1377 |
| 2 | Two refusals distinguished: 503 names the missing setting, 401 for a bad identity | Covered | story-182e8cb9 | AC-1377, AC-1378 |
| 3 | Unfetchable JWKS denies; an unknown `kid` refreshes the cache once | Covered | story-182e8cb9 | AC-1379, AC-1380 |
| 4 | Identity accepted from header, cookie, or service token | Covered | story-182e8cb9 | AC-1376; header-first precedence recorded as a reconciliation decision |
| 5 | `workers_dev = false` top-level *and* under the named environment | Covered | story-182e8cb9 | AC-1382, AC-1383 |
| 6 | Access policy, granted identities and verification recorded in the repository | Covered | story-182e8cb9 | AC-1384 |
| 7 | REQ-147 AC2 (off-policy identity) is enforced before the Worker and unassertable here | Covered | story-182e8cb9 | Stated as an explicit exclusion in Technical Context and in AC-1384, so no unwritable UAT is commissioned |
| 8 | `ACCESS_DEV_OPEN` loopback bypass | Covered | story-182e8cb9, story-e674c60a, story-d5167ced | **Flagged, not absorbed** — see Judgment Calls |
| 9 | Tenancy bound at construction; no verb takes a tenant | Covered | story-fde7370b | AC-1386 |
| 10 | Unknown *or inactive* tenant refused with a typed error | Covered | story-fde7370b | AC-1387 |
| 11 | `SiteWrite.expect` + `version()` CAS; loser gets both versions | Covered | story-fde7370b | AC-1388, AC-1389 |
| 12 | The guard sits after the writes with no pre-read short-circuit, so a refusal really rolls back | Covered | story-fde7370b | AC-1390; the "must have executed" property is written into Technical Context as binding on any reimplementation |
| 13 | The filesystem adapter ignores `expect` rather than faking a CAS | Covered | story-fde7370b | AC-1391 |
| 14 | R2 bytes round-trip incl. non-UTF-8; content type off the object; traversal names refused | Covered | story-fde7370b | AC-1392, AC-1393, AC-1397 |
| 15 | Bytes written before metadata (chosen failure: orphan, not a listing 404) | Covered | story-fde7370b | Technical Context, folded into AC-1392 |
| 16 | `importSite` is port-to-port and crosses as one `SiteWrite` | Covered | story-fde7370b | AC-1394, AC-1395 |
| 17 | One contract module over three adapters; PreviewRenderer a named exception | Covered | story-fde7370b | AC-1385 |
| 18 | `@1stcontact/framework/worker` — the transform-free entry that makes `edit.ts` load in workerd | Covered | story-fde7370b | AC-1396; framed as infrastructure for the claim, not a capability |
| 19 | Bindings on both sides of the inheritance line; migration hook executable, lists on rehearsal | Covered | story-fde7370b | AC-1398 |
| 20 | Deployed Worker serves the document, lists sites and renders both draft channels with no local process | Covered | story-e674c60a | AC-1399 |
| 21 | Client, components and bridges are build artifacts, served behind the gate by falling through last | Covered | story-e674c60a | AC-1400 |
| 22 | An artifact request succeeds against a store holding no account (REQ-149 AC-10) | Covered | story-e674c60a | AC-1400, third consequence, stated explicitly |
| 23 | `1c builder` is a transport over the one route table; local store by default, `--remote` explicit | Covered | story-e674c60a | AC-1401 |
| 24 | `bin/publish` / `1c push` copies a local draft up idempotently through the serving store | Covered | story-e674c60a | AC-1402 |
| 25 | Inline boot guard: names a missing asset and a missing tenant, re-checks before every write (REQ-149 AC-11) | Covered | story-e674c60a | AC-1403 |
| 26 | `no-store` is the router's, so every front door inherits it | Covered | story-e674c60a | AC-977 |
| 27 | Preview-render reuse keyed on the store object, not the tenant id | Covered | story-e674c60a | Technical Context; the failure it fixes is stated |
| 28 | Store opened lazily after a route matches; construction failure keeps its own status | Covered | story-e674c60a | AC-965 (re-pointed), AC-1400 |
| 29 | Deferred routes answer 501 naming their ticket | Covered (as a design rule) | story-e674c60a | **No AC** — every deferral graduated inside this bundle and the helper was deleted; recorded as a rule with a stated re-entry condition. See Judgment Calls |
| 30 | Proxy and `BUILDER_ORIGIN` deleted outright | Covered | story-e674c60a | Recorded as having no matrix subject to archive |
| 31 | A whole turn runs in the Worker from a deploy secret; edits land in the cloud store | Covered | story-a58a0974 | AC-1404 |
| 32 | Transcript kept in the language-neutral session form byte for byte | Covered | story-a58a0974 | AC-1405 |
| 33 | Import-graph guard: no fs-backed junction or archive on the Worker path | Covered | story-a58a0974 | AC-1406; claimed over the shipped artifact, as the intent requires |
| 34 | Library bundled at build time; a missing component fails the build loudly | Covered | story-a58a0974 | AC-1407 |
| 35 | Secrets scrubbed at the response boundary, matching known values | Covered | story-a58a0974 | AC-1408 |
| 36 | Transcripts and audit outside the composed storage prefix | Covered | story-a58a0974 | AC-1409 |
| 37 | Deploy asks the store, not the shell; push / leave-and-report / fail; rehearsal same route | Covered | story-a58a0974 | AC-1410 |
| 38 | Session junction in-memory, drained during the turn — the turn in flight is the stated cost | Covered | story-a58a0974 | AC-1057, rewritten; cost stated inside the criterion |
| 39 | One chat host per isolate — the stale-tenant trade on two routes | Covered | story-a58a0974 | Technical Context, as the intent's own declared deviation |
| 40 | Declaration compared against `l1Operations` + `nodeOperations` | Covered | story-93905de4 | AC-1073, corrected |
| 41 | Publish unreachable from the assistant; KB degrades to absent on the deployed host | Covered | story-93905de4, story-a58a0974 | AC-1074, AC-1320; the reason changed inside the bundle and the criterion deliberately keeps the load-bearing one |
| 42 | Audit durable: survives the host, loses nothing to a concurrent caller, kept for an abandoned turn | **Partial** | story-93905de4 | Behaviour is described in the story and carried as **AC-1411 — but that AC is `pending` and has no `test_UAT_AC1411_*`**. See Gaps |
| 43 | Behavior components are plain `(props) => string` functions | Covered | story-179b8c06 | AC-1412 |
| 44 | A module-mounting site renders in workerd, serving the component's own bytes | Covered | story-179b8c06 | AC-1412 |
| 45 | The edit channel still switches the behaviour off for a module page | Covered | story-179b8c06 | AC-1413 |
| 46 | Module CSS is a real stylesheet, precompiled and pinned by re-extraction | Covered | story-179b8c06 | AC-809, AC-810 |
| 47 | Both survivors convert through one mechanism, no per-module machinery | Covered | story-179b8c06 | AC-699, AC-701 |
| 48 | Negative conformance fixtures are plain components and still discriminate | Covered | story-179b8c06 | AC-703, AC-704; the 20/20 improvement is correctly *not* claimed as this story's doing |
| 49 | The module now owns its own escaping boundary | Covered | story-179b8c06 | AC-1414 — formalized at reconciliation; intent was silent and the conversion moved a real obligation |
| 50 | Launcher boots plain Vite `createServer` with `configFile: false`; `vite` a direct dependency | Covered | story-e15a19ef | AC-1415 |
| 51 | Astro absent from every manifest, the lockfile and every source file, and off disk | Covered | story-e15a19ef | AC-1416; scope widened to every workspace manifest as a stated reconciliation decision |
| 52 | AC-739 restated unconditionally, measured by a static render-graph scan | Covered | story-e15a19ef | AC-739; the scan is argued (and is) strictly stronger than the spy it replaces |
| 53 | `1c assets` bootstraps without loading the CLI barrel | Covered | story-e15a19ef | AC-1417 |
| 54 | Quiet boot restated about any chatter; stdout→stderr diversion kept and re-justified | Covered | story-e15a19ef | AC-738, sharpened to an empty stderr as a stated decision |
| 55 | Publish mints, renders and stores with no filesystem, from both front doors, one implementation | Covered | story-5349d01f | AC-1418 |
| 56 | An unchanged draft is a no-op returning the live revision | Covered | story-5349d01f | AC-1419 |
| 57 | An invalid draft publishes nothing, failing before any write | Covered | story-5349d01f | AC-1420 |
| 58 | History readable; checkout re-parents and stays forward-only | Covered | story-5349d01f | AC-1421 |
| 59 | Slug claim is a primary key; a second tenant is refused, live untouched | Covered | story-5349d01f | AC-1422 |
| 60 | `1c deploy`, the manifest, the per-tree index, the dry run and the prune are removed | Covered | story-5349d01f | Technical Context enumerates each removal and why it was not ported |
| 61 | Draft preview snapshots dropped, not ported | Covered | story-5349d01f, story-d34eccd8 | Stated in both halves, with the index dependency as the reason |
| 62 | Live derived as the highest id, never stored | Covered | story-d34eccd8 | AC-1423 |
| 63 | The builder's published view redirects, so published bytes have one serving path | Covered | story-d34eccd8 | AC-1424; the accepted cost (a builder-shaped message lost) is stated |
| 64 | The revision record, not the key space, is the authority | Covered | story-d34eccd8 | AC-905, re-pointed from the index to the database behind the same seam |
| 65 | The servable/non-servable tree distinction is retired with its writer | Covered | story-d34eccd8 | Technical Context: what survives is stated as stronger, inside AC-905 |
| 66 | Two live-origin checks assert the operator surface is private, each on its own option, skipping by name | Covered | story-d5167ced | AC-1425 |
| 67 | The build refuses a Worker whose *type* program reaches a filesystem-bound module | Covered | story-d5167ced | AC-1426 |
| 68 | Generated assets produced before the typecheck | Covered | story-d5167ced | AC-1427 |
| 69 | Environment-repetition rule keeps its universal form with one named, inverted exception | Covered | story-d5167ced | AC-1341 |
| 70 | Locale identity, derivation table, lang/dir from one resolution, slug reservation, money/time seam | Covered | story-17ba490e, story-0598c150 | AC-1428…AC-1437, AC-1438…AC-1446 |

## Ungrounded Stories

None found. No story claims behaviour that neither the intent nor the code
supports. Three claims were checked specifically because they *looked* like
candidates and each turned out to be grounded:

- story-e674c60a's "the local front door is admitted by a variable that applies
  only when the gate is unconfigured" — grounded in `apps/control-app/src/index.ts:56-60`
  and in REQ-145's own review note.
- story-179b8c06's escaping criterion (AC-1414) — intent-silent, code-grounded,
  and correctly recorded under `## Reconciliation Decisions` rather than asserted
  unattributed.
- story-d34eccd8's "published responses carry no crawler directive at all" —
  intent-silent, code-grounded, recorded as a decision with its reason.

## Intent Fidelity

The chain of authority (intent → comments → code) is respected throughout. Every
place where the code departs from an intent statement is flagged rather than
absorbed. The four supersessions the plan predicted are all present and all
carry explicit `remove` reasoning in the story that owns them.

The one genuine intent-versus-intent conflict in this bundle is handled correctly
and is worth naming: **REQ-147's implementation record states "no
local-development bypass ... a security control with an off switch is not one"
and leaves it as an open question to the operator; REQ-145 — later in the same
bundle — answers it by adding `ACCESS_DEV_OPEN`, and the operator's own review
note names it as a bypass and says it should be read as one.** The plan item's
prose still carried the earlier "there is no local-development bypass" wording.
story-182e8cb9 does not. It records the supersession explicitly, states why no
criterion asserts "no bypass exists" (that would set regression against intent
the operator has since restated), and asserts instead the property that is true
and durable — a *configured* gate has no exception path — while delegating the
containment of the exception (its absence from the production environment) to
story-e674c60a and story-d5167ced, which own the files it lives in. That is the
correct handling: neither silent absorption nor a criterion that would fail the
moment the bypass is removed.

## Evidence Sufficiency (Step 5b)

**182 acceptance criteria across the 12 stories. 181 are `active`, and every one
of the 181 has a `test_UAT_AC<n>_*` function present in the tree.** No active AC
lacks a covering UAT.

Shape was spot-checked on the criteria most at risk of being structural
bookkeeping rather than behavioural evidence:

- **AC-1426** (`test_UAT_AC1426_a_type_only_reach_to_the_filesystem_fails_the_build_naming_the_chain`)
  runs the real compiler over the real Worker tsconfig, walks the type program,
  proves the walk non-vacuous against four modules it must reach, pins the
  type-only edge it depends on, and then reintroduces the original offending
  specifier in a fixture that differs by exactly one import. This is behavioural
  evidence, not a name check.
- **AC-1406** is asserted over the shipped bundle's import graph deliberately —
  the intent states in terms that a passing turn is *not* evidence, because
  `node:fs` resolves under `nodejs_compat` and hands back a per-isolate ephemeral
  disk. REQ-146's record confirms the walker is proven non-vacuous by planted
  imports. The static form is correct here rather than a weakness.
- **AC-1416 / AC-739** are static scans by necessity — the container factory
  cannot be spied on once the package is uninstalled. The replacement is
  argued, and is, strictly stronger than the spy: "no container for *this*
  render" becomes "no container reachable from *any* render", and the
  render-output assertions are kept unchanged alongside it.
- **AC-1384** asserts the substance of the policy record, not the file's
  existence.

### Execution status, stated plainly

Three of the eighteen reconciliation UAT files were executed clean in this
session: `reconciliation-builder-private-access-gate`,
`reconciliation-site-locale-identity` and
`reconciliation-money-time-formatting-seam` — 29/29 pass. Four more node-project
files pass (`reconciliation-1c-launcher-bootstrap`,
`reconciliation-assistant-conversation-artifact`,
`reconciliation-behavior-module-escaping`,
`reconciliation-platform-build-order-and-private-surface`,
`reconciliation-workspace-build-artifacts`).

**The socket-dependent suites could not be executed in this session.** Every
failure observed was `listen EPERM: operation not permitted 0.0.0.0` — the
session sandbox denies socket binding, so any UAT that starts the local transport
or a Miniflare instance aborts before asserting anything. This is the same
environmental restriction REQ-148's record documents at length ("the workerd
project is unrunnable — Miniflare cannot listen"), and which that ticket's own
verification run resolved once binding was permitted. It is not evidence of a
code defect, and it is not evidence of correctness either: the workers-project
UATs for AC-1385, AC-1396, AC-1399, AC-1404–AC-1410, AC-1412, AC-1413, AC-1418–
AC-1424 and AC-1425 are present and were verified to exist and to be correctly
shaped, but were not run here. The bundle's own records report them green
(workers project 57/57 at REQ-149, 5 files / 49 tests at REQ-148).

## Gaps

**AC-1411 is `pending` and has no UAT — the only such criterion in a matrix of
583.**

- Story: story-93905de4 (STORY-105), plan item 4's second target.
- Criterion: "The record of every call survives the host that wrote it, loses no
  entry to a concurrent caller, and is kept even for an abandoned turn."
- Origin: REQ-146 AC3 — "Every AI write is audited durably; the audit survives a
  Worker restart" — an explicitly declared intent acceptance criterion, which the
  intent further says must be tested by killing the isolate and reading the audit
  back.
- Status: created 2026-08-31T10:40 by this bundle's story cycle, alongside every
  other AC in this reconciliation. Every one of the other 181 reached `active`
  and received a UAT; this one reached neither. Item 4 targets two stories, and
  the UAT pass that produced `test_UAT_AC1404`…`test_UAT_AC1410` in
  `tests/reconciliation-assistant-conversation-deployed.workers.test.ts` covered
  story-a58a0974's new criteria only.
- The behaviour itself is implemented and is proven by free-coded evidence —
  `test_UAT_FC_REQ-146_every_ai_write_is_audited_and_survives_a_restart` and
  `test_UAT_FC_REQ-146_the_audit_is_append_only_across_concurrent_flushes`
  (`tests/test_UAT_FC_REQ-146_ai_host_in_workerd.workers.test.ts:284,314`) — so
  this is not an unproven claim in the code. It is an unlinked one in the matrix:
  the criterion cites no UAT, and those two FC tests are claimed by no AC.

This gap is reported here because it belongs to this bundle's output and must not
disappear, but it is **not** the reason for this review's verdict and is not
addressable by the story-coverage fix loop: the stories are correct, the
criterion is correctly worded and correctly placed, and what is missing is a UAT
and a status promotion. It belongs to the UAT-coverage stage
(`check_uat_coverage` / `fix_uat_coverage`), which owns `uat_coverage` and AC
promotion. Routing it into `fix_reconciliation_review` — which rewrites stories
and criteria — would spend fix cycles on a matrix that does not need rewriting.

Three stories carry a stale `uat_coverage: fail` field (story-e674c60a,
story-179b8c06, story-e15a19ef). Every active AC on all three has a UAT present,
so the field predates this reconciliation's UAT generation; it is that same
stage's to refresh.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Builder Access Gate (feature) | story-182e8cb9 (STORY-120) | ✓ created, 10 ACs |
| 2. Cloudflare Site Store (feature) | story-fde7370b (STORY-121) | ✓ created, 14 ACs |
| 3. Builder Workspace Origin (upgrade) | story-e674c60a (STORY-99) | ✓ updated by bundle-b3b7c399, 5 new ACs |
| 4. AI Site Assistant Runtime (upgrade) | story-a58a0974 (STORY-103) | ✓ updated, 7 new ACs |
| 4. AI Site Assistant Runtime (upgrade) | story-93905de4 (STORY-105) | ✓ updated, 1 new AC (AC-1411, pending — see Gaps) |
| 5. Behavior Module Rendering (upgrade) | story-179b8c06 (STORY-85) | ✓ updated, 3 new ACs |
| 6. 1c CLI Bootstrap (upgrade) | story-e15a19ef (STORY-79) | ✓ updated, 3 new ACs |
| 7. Publish, operator half (upgrade) | story-5349d01f (STORY-94) | ✓ updated, 5 new ACs |
| 8. Public Serving, visitor half (upgrade) | story-d34eccd8 (STORY-95) | ✓ updated, 2 new ACs |
| 9. Platform Build & Smoke (upgrade) | story-d5167ced (STORY-119) | ✓ updated, 3 new ACs |
| 10. Site Locale Identity (feature) | story-17ba490e (STORY-122) | ✓ created, 10 ACs |
| 11. Money & Time Formatting Seam (feature) | story-0598c150 (STORY-123) | ✓ created, 9 ACs |

No plan item was dropped. Eleven `reconciliation_story_generation` reports sit on
the anchor, one per item. The plan's two collapses and one split (REQ-151+REQ-153
into item 10; REQ-149 across items 7 and 8; REQ-149's three follow-ups
distributed to items 3, 4 and 9 by surface rather than by filing ticket) are all
present in the stories as planned, and each landed in the capability that owns
the surface it repairs rather than the one it was filed against.

## Judgment Calls

- **The 501-deferral shape has no acceptance criterion, and that is correct.**
  REQ-145 AC-9 required a deferred route to answer 501 naming its ticket. Both
  deferrals graduated inside this same bundle and `notImplemented()` was deleted
  with the last of them, so a criterion asserting the shape of a deferral would
  assert behaviour that cannot be observed. story-e674c60a records it as a design
  rule with a stated re-entry condition instead. Documenting an invariant with no
  live instance beats putting an unverifiable assertion in the matrix — and the
  original criterion's own note anticipated routes graduating and leaving it.
- **REQ-147 AC2 has no criterion, and that is correct.** It is enforced by
  Cloudflare before the Worker sees the request, so it cannot be asserted from
  this repository at all. The story says so explicitly and AC-1384 carries the
  exclusion, which is what stops a later cycle commissioning a UAT that cannot
  exist. The plan flagged this as an uncertainty; the story resolved it.
- **`ACCESS_DEV_OPEN` is a material behaviour and it is covered three ways** —
  the gate story records the supersession and declines to assert its absence, the
  workspace story records why the local front door can serve, and the build story
  carries it as the single named, inverted exception to the
  environment-repetition rule (AC-1341). A developer reading these stories would
  find the bypass, its containment, and the argument for both. Not a gap.
- **Two stories per plan item 4 is not a defect.** The conversation contract and
  the declared control surface fail independently and the plan targeted both
  deliberately; putting the audit-durability criterion on the conversation story
  would have misplaced it.
- **Item 9 at one point is small but correctly separate.** story-d5167ced
  genuinely owns both the live-origin check set and "refuses before emitting a
  broken artifact"; folding those criteria into items 1 and 3 would put deploy
  behaviour in capabilities that do not own it. The story's own reconciliation
  decision #1 argues the same split from the other side.
- **The stale `uat_coverage: fail` fields and the socket-blocked suites are
  reported, not treated as verdict-bearing.** Neither is a story-coverage defect;
  both are recorded so they are visible to the stages that own them.
- **AC-1411 is reported as a gap but does not fail this review.** Step 5b's
  failure conditions are written over *active* criteria; AC-1411 is `pending`,
  and the review's own constraints place AC completeness and test generation
  outside its scope. The behaviour is in the story, in the intent, in the code and
  in executed free-coded evidence. What is missing is the link, and the stage that
  owns links is not this one.

## Verdict

**PASS.** The stories accurately and faithfully represent what the operator
intended to build. Every behaviour the intent declares across all ten source
tickets is covered by a story; every place the code departs from an earlier intent
statement — the Access bypass, the graduated deferrals, the deleted deploy
command, the retired index and preview addressing, the restated Astro guarantee —
is flagged with its reasoning rather than silently absorbed; and every
intent-silent behaviour formalized into a criterion is recorded under
`## Reconciliation Decisions` as a decision with a rationale, not left as an
unattributed claim. No story invents behaviour. All eleven plan items produced
output. All 181 active acceptance criteria have covering UATs, and the ones most
at risk of being structural bookkeeping were checked and are behavioural.

A developer reading only these stories would have a correct and honest mental
model of what this bundle built — including its accepted costs, its named
exceptions, and the two things it deliberately did not prove.

One gap is recorded above and routed rather than absorbed: AC-1411 (audit
durability, from REQ-146 AC3) is `pending` with no UAT, alone among 583 criteria.
It needs a UAT and a status promotion from the UAT-coverage stage; it does not
need a story rewrite.
