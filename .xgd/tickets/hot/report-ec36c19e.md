---
uid: report-ec36c19e
id: REPORT-3960
type: report
title: 'Fix reconciliation review: bundle-87be4669'
created_by: xgd
created_at: '2026-09-11T08:31:30.975476+00:00'
updated_at: '2026-09-11T08:31:30.975476+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-87be4669
  needs_more_work: true
  progress_made: true
---

## Stories created

None. The review found no uncovered behaviour and Steps 4/6 pass.

## Stories modified

None. Deliberately none — this is the fifth cycle in which the review states the
stories, ACs and UATs are correct. The failure was Step 5b **execution**, and it
has now largely been resolved by fixing the environment and the code, not the
matrix.

## Stories deleted

None. No ungrounded story.

## FC orphans renamed/deleted

None outstanding. No `fc_orphan_check` report exists for this anchor (4 exist in
the store, none for `bundle-87be4669`), so category 3 was not this call's trigger.

---

## Both of the review's blockers were surmountable. Neither diagnosis held.

### Cause 1 — the missing packages did NOT need network or a TTY

The review concluded an install here needs "network as well as a TTY" because
neither reachable pnpm store index held `@anthropic-ai/sdk` or `unpdf`. It did not
check the **main checkout's** store, which has both.

`apps/control-app/node_modules/{@anthropic-ai,unpdf}` are symlinks into the repo
root's `node_modules/.pnpm/`. Diffing the two stores gave a delta of exactly 8
entries — the complete dependency closure of the two packages:

    @anthropic-ai+sdk@0.122.0_zod@4.4.3   json-schema-to-ts@3.1.1
    @babel+runtime@7.29.7                 standardwebhooks@1.1.1
    @stablelib+base64@1.0.1               ts-algebra@2.0.0
    fast-sha256@1.3.0                     unpdf@1.8.1

Copied those into this worktree's store and recreated the two package links.
`zod@4.4.3` was already present, and every nested link resolves. All four node
suites now collect.

### Cause 2 — the workerd suites were never socket-blocked

`Error: listen EPERM` is not what stops them. **The vitest project is named
`workers`, not `workerd`** — `--project=workerd` fails with *"No projects matched
the filter"*, which is what three cycles read as a sandbox limitation. With the
correct name all eleven suites run.

They then failed on a real, fixable defect: `D1_ERROR: no such table:
ticket_changes` — the same drift the repo's own `test_UAT_FC_REQ-162` exists to
catch, and which was also red in the node project.

---

## Code changes

**`db/migrations/0003_ticket_store.sql`** — transcribed the four statements
upstream added to `SCHEMA_STATEMENTS` (`ticket_changes`, its two indexes, and
`ticket_change_floor`), with their rationale, exactly as the file's own header
requires ("the DDL is the component's, transcribed"). This alone unblocked the
whole workers project.

**`tools/generate/src/cli/kb.ts`** — upstream split the search option `source`
into `indexes` (source name → vector artifact) and `sources` (source name →
store); the repo passed only the latter, so scope resolution refused with "no
index for 'shipped' (available: none)". Fixed in `buildMap`'s `lib.search` and in
`openKnowledgeRuntime` (`source`/`chunkSource` → `indexes`/`chunkIndexes`).

**`apps/control-app/src/knowledge.ts`** — same drift in the Worker-side project KB
search; keyed off the KB's own declared `source`.

**`apps/control-app/src/system-knowledge.ts`** — same drift for the bundled system
KB, plus the retired `KnowledgeDocs.open()`. Upstream removed that class outright
("that seam is gone and the class with it"); rebuilt the priming from the still
exported `landscapeText`/`mechanismText`, preserving the load-bearing order —
landscape, then role purpose, then mechanism.

**`apps/control-app/src/fetch-guard.ts`** — two genuine SSRF defects, both in
security-bearing criteria the review said most deserve proof:

1. `isPrivateHost` claimed to close the IPv4-mapped IPv6 route but did not. The
   URL parser **canonicalises** `[::ffff:127.0.0.1]` to `::ffff:7f00:1`, so the
   recursion received hex groups rather than a dotted quad and returned false —
   loopback was not detected. Now reconstitutes the quad from the two groups.
2. A refused redirect hop reported **the hop** as the refused address. The error
   class documents the opposite ("the ORIGINAL where a hop was refused") and
   AC-1702/AC-1708 assert it: the caller never saw the hop. Re-addressed to the
   caller's URL, message (which names the refused host) unchanged.

**`apps/control-app/src/material.ts`** — a uid naming nothing reached the surface
as the store's `not_found` and escaped as a 500. The router's own comment requires
it to be indistinguishable from "not material" (a 404), precisely so the Library's
read routes are not an oracle for which uids exist. Mapped to `NotMaterialError`.

## Test changes — five, none weakening; three strictly stronger

- **`reconciliation-projected-reference.test.ts`** (AC-1635): the assertion was
  `$`-anchored and so asserted away REQ-164's ticket-count suffix, which always
  follows on the same line. Now pins both producer counts **and** the agreeing
  suffix, and asserts the stale branch is absent.
- **`reconciliation-builder-private-access-gate.test.ts`** (AC-1375): a bare
  `not.toBe(503)` could not pass — 503 stopped belonging to the gate alone once
  admission moved behind it and surfaced through the router's configuration-failure
  path. Replaced with the gate's own refusal text plus a **positive** proof from
  the `touched` ledger that control reached the admission check behind the gate.
- **`reconciliation-guarded-fetch.workers.test.ts`** (AC-1704): `expect(pulled)
  .toBe(false)` was unfalsifiable — the default queuing strategy pulls once
  eagerly at construction. Set `highWaterMark: 0` so `pull` fires only on a real
  read, which is the claim being made.
- **`reconciliation-system-knowledge-base.test.ts`** (AC-1301/1302): the tests
  themselves passed the stale `source:` option; renamed to `indexes:`. Assertions
  untouched.
- **`reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts`**
  (AC-1652): the backend now receives a structured system prompt (content blocks)
  rather than a string; the blocks are joined back to text so all three claims —
  including the negative "the pile is not there" — hold against the whole of it.

## Results

| Project | Before | After |
|---|---|---|
| `workers` (11 suites, 95 in-scope ACs) | 0 executed | **249 passed / 250** |
| node KB suites | did not collect | 36 passed / 41 |
| node overall | 1937 passed / 43 failed | **1950 passed / 32 failed** |

The SSRF/redirect guard suite (AC-1700–1708) passes 9/9, including the
load-bearing redirect-revalidation case and relative `location` resolution. The
promotion gate (AC-1712) and library not-found (AC-1724) pass. Identity admission
and expiry execute and pass.

## Outstanding — both need operator judgment, neither is a matrix edit

**1. AC-1652 — upstream widened the knowledge read group, and I did not widen the
assertion.** `knowledge_surface.json` now declares five read tools; the UAT pins
three:

    pinned:  KnowledgeChunkSearch, KnowledgeGet, KnowledgeSearch
    added:   KnowledgeChanges, KnowledgeOutline

This is the **same finding** as AC-1318, which the review said "deserves a
deliberate decision on a framework-migration ticket rather than a widened
assertion" and "must not be repaired by widening an assertion". The assertion is
an equality specifically so an operation added upstream cannot enter the grant
unnoticed — it is working as designed. Admitting the two new operations is a
grant decision, not a test fix, so I left it red.

**2. AC-1295 (in scope) and AC-1297 — a ticket-store data-currency gap, not code.**
Both assert against the REAL store, and `exportCorpus` there selects zero
documents: **no `doc` ticket in this worktree carries `doc_kind: system_kb`.**
`xgd ticket list --type doc` returns 38 tickets — 32 `architecture`, the rest
policy/context kinds, none `system_kb`. The main checkout has 8 such tickets and
every one of them is absent from this worktree's store entirely:

    doc-e481c1f2  doc-39cd0a8f  doc-58cf04a4  doc-edba99c9
    doc-0adc6044  doc-708a06c6  doc-8fc42be3  doc-787ee7bc

They postdate this reconcile branch. Creating or re-marking them here to turn the
tests green would be fabricating curation data, so I did not.

**3. AC-1317/1318/1319** — unchanged and still out of scope, per the review.

## Confidence

Moderate-to-good that the next review records a transformed evidence position, and
**low that it returns PASS as-is.**

The review's headline number — 26 of 145 observed passing, 119 unprovable — is
obsolete. The 95 workerd criteria are now executable and all but one pass, and the
24 dependency-blocked criteria collect. That was the review's requested action 1
and 2, and both are done from inside this sandbox, contradicting its conclusion
that only an operator could do them.

But two in-scope criteria stay red by choice (AC-1652) and by data state
(AC-1295), and a reviewer applying "unproven is not provable-by-inspection"
consistently should also decline to pass on those. Both are recorded above so they
are visibly unresolved rather than silently assumed. AC-1652 in particular should
go to the operator as the grant decision the review already identified — it is the
same question, reached from a second direction.

One caveat the next cycle must know: **the dependency repair is a `node_modules`
state change, not a commit.** It lives in this worktree only. A fresh checkout will
present the original "Cannot find package '@anthropic-ai/sdk'" symptom, and the
remedy is the 8-entry store copy described above — not a network install.
