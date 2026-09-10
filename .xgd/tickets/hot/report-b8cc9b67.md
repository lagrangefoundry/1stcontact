---
uid: report-b8cc9b67
id: REPORT-3636
type: report
title: 'UAT Coverage: Client Material Store: What A Site Is Made From, As Tickets'
created_by: xgd
created_at: '2026-09-10T02:23:29.245655+00:00'
updated_at: '2026-09-10T02:23:29.245655+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-dfb0a4ff
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: Client Material Store: What A Site Is Made From, As Tickets

**Result**: PASS
**AC verdicts**: 24 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 3 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

The capability tree resolves to a **single** counting intent. All three stories
carry `fields.intent_uid: request-13a5e206`; no story or capability carries an
`updated_by`; the capability has no backlinks.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-162 | free_and_reconciled | created 2026-08-31, completed 2026-09-02, main `4b43dd9a` | The product ticket store: the D1 schema step, the tenant-scoped wiring point, the `1stcontact-material` blob bucket, and the `material` / `reference` / `brief` TypePack plus the merged chat schemas | YES |
| REQ-163 | draft | 2026-08-31 | Ingestion (creates `material` records) — explicitly out of scope on REQ-162 | NO (not yet active) |
| REQ-166 | draft | 2026-08-31 | Capture bundles become corpus members; `depends_on: [REQ-162, REQ-163]` | NO (not yet active) |

Nothing in the ledger retires a behavior. REQ-162 is the sole addition, and its
body carries both halves — the planning half (`## What it delivers`,
`## Acceptance`, `## Both open questions are now settled`) and the appended
`## What landed (free-coded, 2026-08-31)` half. Several ACs are grounded in the
second half rather than the first (register-if-absent bootstrap, the wiring-layer
construction refusal, the `1c assets` ticketing shim); reading only the planning
half would manufacture drift that is not there.

**The one apparent intent/code conflict is settled in the intent itself, not a
contradiction.** REQ-162's acceptance list asks for a store that refuses at
construction when it has nowhere to put bytes, while the shared component
deliberately does the opposite (attachments are an optional capability, refused
at first call). The intent body resolves this explicitly — "Enforcement lives at
our wiring layer, not the component's… The component's own policy is left as
upstream wrote it" — and STORY-126's Technical Context records the same
resolution. AC-1482 encodes the resolved position and is therefore **active**,
not `ac-edit`.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-126 (Product Ticket Store) | REQ-162 | aligned | Schema step, shared `tenants` registry + ALTER, wiring-point refusals, row barrier and build-time component resolution are all named in REQ-162. Three behaviors the intent is silent on (schema-agreement check → AC-1477, register-if-absent bootstrap → AC-1480, stale-install reporting → part of AC-1485) are recorded under `## Reconciliation Decisions` dated 2026-09-01 — decided, not gaps. |
| STORY-127 (Material Blob Storage) | REQ-162 | aligned | Separate `1stcontact-material` bucket, the disclosure boundary, content-addressed tenant-prefixed keys and the both-halves declaration are all in REQ-162. The attachment record's shape (AC-1486) and the cross-account byte barrier (AC-1488) are recorded under `## Reconciliation Decisions` — decided, not gaps. |
| STORY-128 (Material Types) | REQ-162 | aligned | The three kinds, the DOC-38 §9 six-field block, required booleans, `source_url` `required_when`, `fields.site_slug` on `brief`, and the merged chat schemas are all in REQ-162 (including its "both open questions are now settled" section). Four behaviors the intent is silent on (AC-1496 body-required half, AC-1497, AC-1498, AC-1499) are recorded under `## Reconciliation Decisions` — decided, not gaps. |

## Evidence Assessed

Every AC is covered by a `test_UAT_AC<n>_*` test. Five files carry them:

| File | ACs | Runtime |
|---|---|---|
| `tests/reconciliation-product-ticket-store.workers.test.ts` | 1478–1484 | workerd, real D1 + real R2, through `ticketStoreFor` |
| `tests/reconciliation-product-ticket-store-schema.test.ts` | 1476, 1477, 1485 | node; real `wrangler d1 migrations apply`, real `1c assets` on a mirror root, real `node` probes |
| `tests/reconciliation-material-blob-storage.workers.test.ts` | 1486–1488 | workerd, real `BLOBS` **and** real `SITES` |
| `tests/reconciliation-material-blob-storage.test.ts` | 1489, 1490 | node; TOML read per-half with mutation checks |
| `tests/reconciliation-material-types.workers.test.ts` | 1491–1499 | workerd, real D1, through `ticketStoreFor` |

These clear the evidence bar comfortably. Recurring properties that decided the
`pass` verdicts:

- **Real entry points throughout.** Every runtime assertion goes through
  `ticketStoreFor(env)` — the same wiring the Worker calls — against tables
  applied from `db/migrations`, not a fixture schema. No internal component is
  mocked anywhere in the five files.
- **Construction-time refusals are observable, not asserted.** AC-1481/1482 pass
  an `untouchableDb()` proxy that throws on *any* property access, so "the
  refusal happened before the database was touched" is a fact the test can fail
  on rather than a claim in a comment.
- **Non-vacuity guards.** AC-1483 confirms the owning account *can* see the
  ticket on both paths before concluding the other account's blindness is a
  barrier; AC-1493 creates an accepted record to prove the empty listing reports
  records at all; AC-1485 plants a `working` fixture alongside the `stale` and
  `absent` ones.
- **Borrowed shapes are imported, not spelled.** AC-1491 compares
  `pack.schema(kind)` against `chatSchemas()[kind]`, and uses `toBe` (identity)
  against `ATTACHMENT_SCHEMA` — a restated literal would keep passing after the
  pack stopped carrying the component's own shape, which is the one failure the
  "merged, not restated" claim exists to exclude.
- **Mutation checks are executed where they can be.** AC-1477 removes a published
  statement and asserts the reported miss is exactly that statement; AC-1489/1490
  re-point and drop declarations in an in-memory copy of the TOML and assert the
  claim stops holding.
- **The two claims the story bodies flagged as unproven are now proven.**
  AC-1488's dedup-within-an-account half is exercised by counting objects in the
  account namespace before and after a second identical attach; AC-1498's
  `site_slug` field is exercised on both carriers plus a query that tells one
  site's material from another's.

Two criteria name mutation checks that are documented rather than automated —
AC-1478's "remove the reconciliation and 13 of 15 fail" and AC-1487's "re-point
the byte layer at the public site's store". Both were performed at free-coding
time and are recorded in REQ-162's `### Evidence`. Neither is a coverage gap:
each criterion's observable claims are directly asserted (AC-1478 reads
`PRAGMA table_info(tenants)` and registers an account as the first operation;
AC-1487 checks both real buckets and asserts `SITES` is entirely empty).

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | story | STORY-127 | story-body-edit | `## Reconciliation Decisions`, AC-1488 entry, says "The dedup-within-an-account half … the landed suite does not yet exercise on its own; it is stated because it is the property the addressing exists for." Literally still true of the *free-coded* suite, but misleading now: `test_UAT_AC1488_…` (`reconciliation-material-blob-storage.workers.test.ts:260-273`) counts objects in the account namespace across two identical attaches and proves exactly that half. | Replace the trailing clause with a note that the reconciliation UAT now exercises the dedup half directly |
| 2 | warning | story | STORY-128 | story-body-edit | `## Reconciliation Decisions`, AC-1498 entry, says "the landed suite does not yet exercise this field on its own, so it is stated here as the property it exists for." Same situation: `test_UAT_AC1498_…` (`reconciliation-material-types.workers.test.ts:462-496`) exercises `site_slug` on both carriers, present and absent, plus a discriminating query. | Drop the "not yet exercised" clause; the property is now asserted |
| 3 | warning | story | STORY-126 | story-body-edit | Technical Context opens a bullet with "**Two claims here were mutation-tested rather than argued**" and then names only one (removing the registry reconciliation fails 13 of 15). The second mutation-tested claim is the blob-store disclosure check, which lives on STORY-127, not here. | Either say "One claim here was mutation-tested" or name the second and where it lives |

No violations. No `needs_review` of either kind — the impact screen was not
reached, because every AC and every story-body behavior traces either to REQ-162
directly or to a dated `## Reconciliation Decisions` entry.

## Notes for the Editor

- **All three findings are the same shape and can be cleaned in one pass**: the
  story bodies carry provenance sentences written at reconciliation on
  2026-09-01 that describe the coverage situation *as it stood then*. The
  reconciliation UATs authored afterwards closed the two gaps those sentences
  flag. Nothing about the criteria or the code is wrong — only the narration of
  what is proven. None of the three affects pass/fail.
- **Do not read the operator obligations as coverage gaps.** Both STORY-126 and
  STORY-127 record that `wrangler r2 bucket create 1stcontact-material` must run
  before the next production deploy, and both say plainly it is not assertable
  (miniflare conjures the bucket locally; Cloudflare does not). It is recorded on
  REQ-162's closing operator note as well. That is the correct handling — it
  needs no AC and no UAT.
- **`.xgd/uat_index.json` is empty** (`{"acs": {}}`, stamped
  2026-09-09T22:50:28Z), so the index-driven AC→test lookup this prompt
  prescribes returns nothing for every AC. This assessment mapped ACs to tests by
  reading the five files directly. The tests use the required
  `test_UAT_AC<number>_<description>` form, so the index is under-populated
  rather than the tests being misnamed — worth repairing before a later stage
  trusts a zero-coverage reading from it.
- **Verdicts are about evidence quality, not a test run.** Per this prompt's
  criteria the judgment is whether each test substantively exercises its AC
  through real entry points; execution status is the structural/quality stage's
  concern and was not re-run here.
