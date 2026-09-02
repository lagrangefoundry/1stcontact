---
uid: report-0132ef73
id: REPORT-3291
type: report
title: 'Reconciliation Review: commits (REQ-162, the product ticket store)'
created_by: xgd
created_at: '2026-09-02T00:59:47.614999+00:00'
updated_at: '2026-09-02T00:59:47.614999+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: request-13a5e206
  anchor_uid: request-13a5e206
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: —
**Anchor**: request-13a5e206 (REQ-162)
**Stories Reviewed**: 4 (story-ab1ecd62, story-a7a12d81, story-e07c589b, story-fde7370b)

## Intent, as read

Read first: the ticket body, and the single chat comment (comment-aa271bc5), whose six questions are answered by the operator with *"re-read the ticket - you should have all the answers there"* — so the body is authoritative on every one of them, including the two the assistant flagged as blockers.

The intent declares: the component's schema as migration 0003 beside the existing two; one shared `tenants` registry reconciled by an `ALTER`; `MultiTenantTicketStore` tenant-scoped at construction; a blob bucket `1stcontact-material` distinct from `1stcontact-sites`, declared in both wrangler halves; `ticketStoreFor(env)` throwing at construction when `BLOBS` is absent (explicitly *at this platform's wiring layer*, with the component's own call-time refusal left as upstream wrote it); the cross-tenant barrier asserted rather than assumed; `material`, `reference` and `brief` carrying DOC-38 §9's six fields; the chat schemas merged into the same pack; and a ticket created through the Worker readable back through it — **with no HTTP routes**. Both open questions are settled in the body itself (`reference` keeps its own type; `brief` keeps its own type with `fields.site_slug`). Out of scope: ingestion, chat-session migration, and REQ-159's knowledge base. One operator obligation is recorded as unassertable: `wrangler r2 bucket create 1stcontact-material`.

## Behavior Inventory

7 behaviors identified in the code (`fc117f1d35`; `2284bf4bbd` and `bc36b2cce9` are version bumps only — `package.json` 0.2.18 → 0.2.20, no behaviour). The diff's footprint is 11 files and matches the intent's four deliverables plus the two collateral files the ticket itself declares.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | The ticket schema as migration 0003: the component's `SCHEMA_STATEMENTS` transcribed, applied in sequence after 0001/0002, listed in `d1-site-factory`'s explicit `MIGRATIONS`, plus the one locally-authored `ALTER TABLE tenants ADD COLUMN config` | Covered | story-ab1ecd62 | AC-1476, AC-1477, AC-1478 |
| 2 | `ticketStoreFor(env)` — the single wiring point: refuses at construction on a blank `TENANT_ID` or an absent `BLOBS`, registers the configured tenant only after a read proves it absent, hands the blob store in unscoped, returns a terminal scoped handle | Covered | story-ab1ecd62 | AC-1479 – AC-1482; the register-if-absent half is recorded as a Reconciliation Decision, not an unattributed claim |
| 3 | The tenant barrier on rows: cross-tenant `get` is `not_found`, cross-tenant uid absent from `query`/`list`, cross-tenant `update` refused and target unchanged | Covered | story-ab1ecd62 | AC-1483, AC-1484 |
| 4 | Attachments in a bucket of their own: `attach`/`attachments` returning `sha256` + `size` under the parent, bytes at `t/<tenant>/blob/<sha256>` in `1stcontact-material` and provably absent from `1stcontact-sites`, per-tenant content addressing, binding declared in both wrangler halves | Covered | story-a7a12d81 | AC-1486 – AC-1490; the disclosure claim leads, the environment-repetition claim re-pins AC-1341 by the repository's established convention |
| 5 | The product type pack: `material`, `reference`, `brief`; DOC-38 §9's six-field block shared verbatim; closed enums; `republishable`/`exportable` required and boolean; `source_url` `required_when` captured/fetched; `brief` requiring `site_slug` and a non-empty body; no status vocabulary; `chatSchemas()` and `ATTACHMENT_SCHEMA` merged as shipped; a chat session persisting as a ticket with a `chat_transcript` comment | Covered | story-e07c589b | AC-1491 – AC-1499 |
| 6 | Build-time resolution of the ticketing component: `1c assets` emitting `src/generated/ticketing.{js,d.ts}` as an absolute re-export with an enumerated export list, named in the build report, generation before typecheck, and a *stale* install detected by the capability file rather than by a version that never changes and reported as a named skip carrying the install command | Covered | story-ab1ecd62 | AC-1485; the stale-install half is recorded as a Reconciliation Decision |
| 7 | Router env widening (`RouterEnv extends StoreEnv, TicketStoreEnv`) with no route added | Acceptable omission | — | Verified in the diff: a type-only import and one `extends` clause, no HTTP surface. Carried implicitly by behavior 2's bindings; both story-ab1ecd62 and story-e07c589b state the HTTP surface is REQ-161's, as the intent does |

Collateral: `test_UAT_FC_REQ-143_store_bindings.test.ts` was modified (file-wide `bucket_name` count → pairing by binding name). The ticket declares this under *Collateral*, and it is item 4 — a knowing supersession, carried by the AC-1398 modification, not a silent regression.

## Intent Fidelity

Every behaviour the intent declares is faithfully represented. Three points that could have been silent divergence absorption are instead flagged in story prose:

- **Construction-time refusal vs the component's call-time policy.** The intent's acceptance line and the component's design disagree; the intent body resolves it at this platform's wiring layer. story-ab1ecd62 §Technical Context states this explicitly and concludes "there is no contradiction between intent and code to fix here; the resolution is the operator's, recorded in the intent." Correct handling. The UAT for AC-1482 asserts *both* halves — this platform's construction-time refusal, and that a component-built store without blobs still constructs and serves records — so the boundary between the two policies is itself evidence.
- **The two open questions.** Settled in the intent body in favour of a type of its own for both `reference` and `brief`; the code matches; story-e07c589b records that no code fix is implied.
- **A seventh field.** `site_slug` on `material`/`reference` is beyond DOC-38 §9's six. The intent is silent, not contradictory, and story-e07c589b formalizes it as AC-1498 under `## Reconciliation Decisions` rather than as an unattributed claim. Same treatment for the optional material body (AC-1497), the brief's non-empty body (second half of AC-1496), and how a conversation persists (AC-1499).

No story claims behaviour that neither the intent nor the code supports.

## Ungrounded Stories

None found.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Product Ticket Store (feature, 3) | story-ab1ecd62 (STORY-126, CAP-106) | ✓ |
| 2. Material Blob Storage (feature, 2) | story-a7a12d81 (STORY-127, CAP-106) | ✓ |
| 3. Material Types (feature, 3) | story-e07c589b (STORY-128, CAP-106) | ✓ |
| 4. Cloudflare Site Store (upgrade, 1) | story-fde7370b — AC-1398 modified | ✓ — retitled and restated per binding; the count/one-distinct-value form is now explicitly named as the wrong reading, and the UAT proves the pairing reading has teeth by re-pointing `DB`, `SITES` and `BLOBS` in turn |

No plan item was dropped. No new story was created that the plan did not call for.

## Evidence Sufficiency (Step 5b)

24 active ACs across the three new stories; 24 distinct `test_UAT_AC{N}_*` UATs, one per AC, plus `test_UAT_AC1398_*` for the upgraded criterion. No AC is uncovered.

Quality of the evidence, checked claim by claim:

- **Real entry point throughout.** Every runtime UAT goes through `ticketStoreFor(env)` — the same wiring the Worker calls — inside workerd, against a real D1 whose tables come from `db/migrations` applied by the deployment's own order, and against both real R2 buckets. No fake accessor, no in-memory blob map, no fixture schema. Nothing repository-owned is mocked.
- **The construction-time claims are genuinely construction-time.** AC-1481 and AC-1482 pass an `untouchableDb()` Proxy that throws on any property access, so the named-error assertion is simultaneously evidence that nothing was read or written first. An implementation that refused *after* a failed read would fail these.
- **Non-vacuity is asserted, not assumed.** The barrier UATs re-read through the owning account's handle (so an absence is the barrier and not an empty table); the disclosure UAT enumerates the material store's keys and checks each against the public bucket, then asserts the public bucket is entirely untouched; the separation UATs assert the site bucket is *still declared* (a "distinct" claim passes trivially if `SITES` were dropped); AC-1477 deletes a published statement and asserts the check names exactly it.
- **Two source-shaped ACs are still behavioral.** AC-1489/AC-1490 read `wrangler.toml` — but the configuration *is* the artifact under test, and both UATs mutate it (drop a declaration, re-point a bucket) and assert the reading changes, so they distinguish a right file from a wrong one. AC-1485 does not inspect source for its central claims: it plants three fixture checkouts with byte-identical copies of the shipped files, runs them under a real `node`, and runs the real `1c assets` against a mirror root, asserting the emitted shim carries an absolute path outside this checkout. Its one textual sub-claim — that generation precedes typecheck in `bin/build` — is paired with a real `git ls-files` proving the generated directory is untracked, so the ordering claim is not the only thing standing between a fresh checkout and a build. Acceptable.
- **Could a broken implementation pass?** The substitution test fails in each case: the component's own attachment schema is asserted by `toBe` identity (a hand-written copy that matches today would fail); the chat schemas are compared against `chatSchemas()` rather than spelled; the content address is compared against a digest computed in the test rather than shape-matched; and AC-1488 asserts that naming another account on an `attach` call places nothing in that account's namespace.

**Execution.** This review runs in a sandbox that denies socket binding, so the workerd pool and any UAT spawning `wrangler … --local` could not be executed here: they abort with `EPERM: listen 127.0.0.1`, which is the environment, not an assertion failure. Executed and passing in this session: `test_UAT_AC1477`, `test_UAT_AC1485`, `test_UAT_AC1489`, `test_UAT_AC1490`, `test_UAT_AC1398`, and all 13 static FC cases (`REQ-162_ticket_store_bindings`, `REQ-143_store_bindings`). The workerd suites and `test_UAT_AC1476` were assessed by reading; the standing quality report (report-5f83e766) recorded `0 tests, 0 failed` and is not usable as pass evidence for them. This limitation is stated rather than papered over.

## Judgment Calls

- **Router env widening (behavior 7) omitted as an acceptable gap.** It is a type-program change with no runtime behaviour and no route; a developer reading these stories — both of which say the HTTP surface belongs to REQ-161 — would not be surprised to find `RouterEnv` typed for bindings no route yet reaches. The materiality test says no.
- **The version-bump commits produce no story.** Correct: they change `package.json` only.
- **Two story notes are now stale, and it is not material.** story-a7a12d81 says the dedup-within-an-account half of AC-1488 "the landed suite does not yet exercise on its own", and story-e07c589b says the same of AC-1498's `site_slug`. True of the free-coded suite at plan time; the reconciliation UATs now exercise both (blob-storage workers test lines 260–273, material-types workers test lines 462–496). The notes understate the evidence rather than overstating it, so nothing rests on them. Worth a tidy the next time those stories are opened; not a coverage or fidelity defect.
- **The CAP-89 boundary call was re-examined and upheld.** The plan flagged item 3 against capability-b4ac88fc (Site Materials & Starting Point) as the one classification worth a second look. CAP-89 owns what a *site* references — its scaffold, its asset registry, the repository's font licences. CAP-106's `material`/`reference` are the *account's* source corpus: tenant-scoped in D1 and R2, queried across, never rendered. Different subject, new bucket, correctly classified. story-e07c589b records the call and notes it converts to an upgrade cleanly if the CAP-89 owner reads it otherwise.
- **AC-1341's generic environment-repetition claim is duplicated by AC-1490 deliberately.** That is the convention this repository already set for the site store's bindings (REQ-143), and AC-1490 leads with the pairing-by-name reading that AC-1341 does not make. Duplication by convention, not by accident.
- **The operator obligation is recorded where it can be.** `wrangler r2 bucket create 1stcontact-material` is unassertable — miniflare conjures the bucket and Cloudflare does not — and is carried on the intent and in both relevant stories' Technical Context as such.

## Verdict

**PASS.** The four plan items produced four stories, the intent's every declared behaviour is covered, and the three places where code goes beyond a silent intent are recorded under `## Reconciliation Decisions` as decisions rather than absorbed as facts. The one place where the intent's acceptance list and the component's design genuinely disagree is flagged in story prose and resolved the way the intent body itself resolves it, with a UAT that asserts both policies. A developer reading only these stories would have a correct picture of what the operator intended to build: a second store beside the site store, holding the client's material as tickets, scoped so one account cannot reach another's, with its bytes in a bucket the public-facing Worker has no binding for.
