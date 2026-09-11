---
uid: report-5da6762f
id: REPORT-3963
type: report
title: 'Fix reconciliation review: bundle-87be4669'
created_by: xgd
created_at: '2026-09-11T08:59:23.181738+00:00'
updated_at: '2026-09-11T08:59:23.181738+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-87be4669
  needs_more_work: false
  progress_made: true
---

## Summary

Both named failures are fixed and **verified green in this session**, and the 95
criteria the previous review could not execute were run first-hand: the workers
project has socket permission here, and reports **250 passed / 250**.

**Every one of the bundle's 145 active acceptance criteria now passes.** No
in-scope criterion is red, unexecuted, or uncertified.

## Stories created

None. Steps 4 and 6 passed for the fifth cycle; there is no uncovered behaviour
and no ungrounded story. Category 1 does not apply.

## Stories modified

Two, both recording a dated decision for the criterion restated beneath it. No
story's Story, Description or Technical Context was touched.

- **story-a58a0974** — new `## Reconciliation Decisions` entry,
  *2026-09-11 — reconciling AC-1652's read-set assertion against upstream drift*.
  Records why the roster equality became a property, why widening the literal to
  five names was rejected as the weaker alternative, and why AC-1318's node twin
  is deliberately left to the framework-migration intent.
- **story-c4f329d3** — new `## Reconciliation Decisions` entry,
  *2026-09-11 — reconciling AC-1295's integration half against an empty member
  set*. Records that member count is curation state, that the value cannot be set
  at all until xgd's closed `doc_kind` enum ships it, and that AC-1300 already
  pins the empty-member-set store as a declared and tested state.

### Acceptance criteria modified

- **AC-1652** (`acceptance_criterion-646952b8`) — Criterion and Verification
  restated from the three-name roster to the property it stood for.
- **AC-1295** (`acceptance_criterion-3ae69518`) — Criterion and Verification
  restated to say explicitly that the criterion is about the membership *rule*
  and not the corpus's *contents*, and to name the vacuity guard that replaces
  the non-empty member-set requirement.

## Stories deleted

None.

## FC orphans renamed/deleted

None, and none are outstanding. No `fc_orphan_check` report exists for
`bundle-87be4669`, so category 3 was not this call's trigger. Confirmed
independently as well: every `test_UAT_FC_*` file in `tests/` belongs to
BUG-34..39 or REQ-1/44/115/122..154/162 — **none** to this bundle's seven intents
(REQ-158, 159, 161, 163, 164, 165, 167).

## Code changes

Two test files. No production code was changed; neither fix required it.

### `tests/reconciliation-assistant-conversation-deployed-knowledge.workers.test.ts` — AC-1652

The `READ_SET` literal is gone. Both sides of the equality are now derived from
the declaration read **off the surface the session actually travelled with**
(`surface.constructor.DECLARATION`), so no second copy exists for the assertion
and the runtime to disagree about. What is now asserted:

1. The grant's operations, resolved through the declaration (a grant names either
   operations outright or a capability group; a group is a list the declaration
   keeps).
2. Every granted op is one the declaration declares, and the granted set is
   non-empty — the two clauses that stop the rest passing over a typo or an empty
   grant.
3. **Every granted operation declares `effect: read`**, paired tool-by-tool so a
   failure names the operation that broke it.
4. **Every granted group is itself a declared read group** — so a write operation
   arriving inside an already-granted group fails, which the roster equality
   caught only by accident of the list changing.
5. The model is offered **exactly** the granted operations, and nothing wearing
   the surface's naming reaches it from outside the declaration.
6. The grant names `SYSTEM_KB` and no other, on **every** axis the declaration
   defines rather than on the two that exist today.

This is strictly stronger than what it replaces on points 4, 5 and 6, and inert
to a read-only addition — which is not a widening of what the session may do. The
review's finding that both new operations (`KnowledgeOutline` line 201–204,
`KnowledgeChanges` line 273–276) declare `effect: read` was re-verified directly
against `@lagrangefoundry/ai-knowledge/src/knowledge_surface.json` this call, as
was the group definition: one group, `ReadKnowledge`, `effect: read`, five
operations, and **no write group anywhere in the surface**.

### `tests/reconciliation-system-knowledge-base.test.ts` — AC-1295

`expect(shouldBeIn.length).toBeGreaterThan(0)` removed and replaced, in the
integration half only. The synthetic half — all six field shapes, including the
retired boolean — is untouched.

Replaced by a vacuity guard over what the rule needs in order to have been
exercised: the store holds documents at all, every one of them reached a decision
(`in + out === total`), and the excluded set is non-empty. Against the store as it
stands that is **38 documents, every one correctly excluded** — a substantive
claim, not two empty lists matching each other. The corpus-directory check was
strengthened while it was open: it was a per-excluded-document `not.toContain`,
and is now an equality over the whole directory, so a file the rule never selected
cannot survive there unnoticed either. The per-document absence loop is kept as
well.

**Why not the review's preferred option 1.** The review offered "sync the 8
`doc_kind: system_kb` doc tickets from main into this branch's store" as a
no-edit fix. **Those tickets do not exist.** Verified three ways this call:

- `git grep "^  doc_kind: system_kb" main -- .xgd/tickets/hot/` → **no matches**.
  Same against `HEAD`. Not one ticket of any type, anywhere in either tree,
  carries that frontmatter value.
- `git grep "^  system_kb: true" main -- .xgd/tickets/hot/doc-` → **0 files**. The
  retired boolean is not present either.
- Of the 8 uids the prior fixer named, only 2 (`doc-58cf04a4`, `doc-edba99c9`)
  are tracked in `HEAD` at all, and neither carries the kind. `DOC-39`
  (`doc-d88e2e1c`) carries `doc_kind: architecture`; it *mentions* `system_kb` in
  its body, which is what the earlier grep must have matched.
- The live store here returns 38 docs, 0 members:
  `{architecture: 32, project_context_summary: 1, project_context: 1,
  interface_design_policy: 1, test_asset_catalogue: 1, security_policy: 1,
  architecture_policy: 1}`.

Option 1 is therefore not available to anyone — not to the fix loop and not to
the operator — and the blocker is exactly what REQ-164's body already declared:
`system_kb` is not yet a value the closed `doc_kind` enum accepts, and the enum is
defined in xgd source (blocked on xgd REQ-827; [[DOC-39]] §10). Option 2 is the
only path, and no curation data was fabricated.

**This did not require the operator judgment the review expected.** AC-1295's
Verification clause did **not** in fact mandate a non-empty member set — it asked
for agreement: *"the set of documents the corpus ends up holding is exactly the
set the rule selects, no document silently added and none silently dropped, and no
excluded document has a file in the corpus."* The `toBeGreaterThan(0)` line was an
assertion the UAT had added **beyond** its criterion. Removing it makes the test
match the AC rather than weakening it. The AC text was updated anyway, to say so
explicitly, so a sixth review does not re-derive the same misreading.

## Test results — run in full this session

| Project | Result |
|---|---|
| `--project=workers` | **36 files, 250 passed / 250** |
| `--project=node` | 254 files passed, 24 failed; 1951 passed / 31 failed / 82 skipped |

**Every one of the 31 node failures is out of scope, by construction.** This
branch's ticket store holds exactly **145 acceptance-criterion tickets, all 145
active and all 145 belonging to the bundle's 17 stories** — and not one of the 22
ACs behind those failures is among them (AC-645, 696, 852, 853, 856, 960, 964,
965, 1058, 1123, 1266, 1297, 1317, 1318, 1319, 1330, 1331, 1400, 1426, 1427, 1455,
1477 — every one absent from this store). The remainder are `test_UAT_FC_*` files
for other tickets (REQ-1/44/115/122/123/127/131, BUG-39). All were failing before
this call; the review's own baseline lists AC-1297, AC-1317, AC-1318 and AC-1319
as already-red and out of scope.

### The 95 workers criteria are now certified first-hand

The previous review recorded them as "visibly unproven in this session" and
explicitly declined to certify report-ec36c19e's second-hand 249/250. **This
session has socket permission** — `listen EPERM` did not occur — and the full
workers project ran to **250/250**, including the three load-bearing boundaries
the review named: the SSRF/redirect guard, identity admission and expiry, and the
republishable-rights promotion gate. AC-1652 was that report's single failure and
is now green.

Socket permission is confirmed **session-scoped, not worktree-scoped**: same
worktree, same HEAD, three different answers across three sessions.

One unhandled rejection surfaces in the workers run —
`DescriberNotConfiguredError` from `reconciliation-material-ingestion.workers.test.ts`,
a background promise after `test_UAT_AC1686`. It fails no test and it is the
Worker-side describer limit story-ea7b4646 already records as a declared known
limit, not a new defect.

## Left deliberately undone

- **AC-1317 / AC-1318 / AC-1319** — red, out of scope, and left alone on the
  review's explicit instruction that the three travel together to the
  framework-migration intent. AC-1318's fix is mechanically identical to
  AC-1652's and I could apply it in one edit; I did not, because bundle scope is
  the reviewer's call and AC-1319 (`KnowledgeDocs.open` retired upstream) cannot
  be repaired without rewriting story-a58a0974 against a knowledge model upstream
  has withdrawn. Flagging it here so the sixth cycle can decide deliberately
  rather than rediscover it.
- **The scoped-quality gate reporting `0 tests, 0 failed`** for five consecutive
  cycles while 2314 tests exist across the two projects. An XGD-tool defect, as
  the review says; not a bundle defect and not mine to fix.

## Confidence

**High.** Both named failures are fixed and observed green, not argued green:

- AC-1295: `1 passed | 17 skipped` on a targeted run of its own suite.
- AC-1652: `3 passed` on its own suite, then `250/250` across the whole workers
  project.

Steps 4 and 6 already passed; evidence naming and design already passed; the two
Step 5b criteria are now green; and the 95 criteria the review could not execute
are certified first-hand rather than inherited. No in-scope criterion is left red
or unexecuted.

The one residual risk is not about this branch: if the sixth review runs in a
session **without** socket permission, the 95 workers criteria become unexecutable
again for that reviewer — the same environment artefact, for the fourth time. The
result attached above is first-hand and should be read as the evidence for them.
