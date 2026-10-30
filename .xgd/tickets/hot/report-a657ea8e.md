---
uid: report-a657ea8e
id: REPORT-5632
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-30T03:01:55.316175+00:00'
updated_at: '2026-09-30T03:01:55.316175+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — `6728fc3361` (BUG-86) vs ours (REQ-155 merge replay)

- Resync anchor: `report-377b581e`, branch `resync-377b581e`
- Apply target: `9ac98712a708888db67f8aff21f22b16bd98094e`
- HEAD at resolution: `3736c47dfaddb25f24e616ef869fe19f161e9f09`
- Cherry-picked commit: `6728fc336105be1fe163ccc17f0d9e04202e1903` —
  `[FREE-CODED] BUG-86: the contact form provisions its own endpoint`
  (author 2026-09-12 13:03:28, 40 files)
- `prior_stage_failure`: empty; retry count 1
- Conflicting path (one, `UU`, materialized):
  `tests/req93-l1-slot-mounted-behaviors.test.ts`
- Result: **integrated both sides** (code conflict — not `--ours`, not `--theirs`)

## What collided

A code conflict, fifth shape, and a sub-shape not yet recorded: **theirs edited an
inline literal that ours had hoisted to a module-level constant.**

Index stages for the path:

| stage | blob | change from base |
| --- | --- | --- |
| `:1:` base | `f6892cf42f` | — |
| `:2:` ours | `e53f3858a0` | +331 / −13 |
| `:3:` theirs | `457317b9e2` | +2 / −2 (two one-line hunks) |

Theirs' whole delta is the deletion of `config.action` from two contact-form
fixtures — BUG-86 deletes `config.action` from the module contract entirely
(contact-form → v5 with a declared `migrations: { 5: … }` identity step) and the
module now emits `LEAD_ACTION` (`./api/lead`) itself.

- Hunk 1 (`contactInstance` helper, `action: ''`) **auto-merged** cleanly.
- Hunk 2 conflicted: ours had replaced the inline `fixture` literal in
  `test_UAT_AC1624_mounted_behavior_carries_its_conformance_obligations` with a
  reference to a new module-level constant `mountedContactFixture` (defined at
  `:186`, also used at `:283`, `:294`, `:658`, `:683`), while theirs edited the
  inline literal in place to drop `action: '/leads'`.

So the two sides changed the same lines for disjoint purposes: ours refactored the
fixture's *location*, theirs changed its *content*. Nothing is mutually exclusive.

## Resolution

Two `Edit`s, following the HARD RULES / §2c mandate to integrate on code files
(the enrichment's "take the more recent commit by timestamp and flag for
post-merge review" fallback is wrong here, as on every code conflict on this
branch — obeying it would have discarded one of the two genuine changes):

1. Conflict region (`:632`–`:645`) → ours' hoisted call
   `serveOneModulePage('contact-form', mountedContactFixture, { mountInL1: true })`;
   theirs' now-redundant local `fixture` const dropped (it had exactly one use,
   inside the region).
2. `mountedContactFixture` at `:190` → `action: '/leads'` removed, so theirs' hunk
   lands at the definition site ours moved it to.

After (1)+(2) the constant is behaviourally identical to theirs' post-edit inline
literal, so both intents are preserved in full and neither side's line survives in
a form the other would have rejected.

### Checks run

- **Identifier scope:** `mountedContactFixture` is defined at `:186`, every use is
  later in the file; theirs' `fixture` binding has no surviving references.
- **Placement precedent:** the hoisted constant is ours' own decision, reused
  verbatim — no new formatting invented.
- **Semantic necessity of edit 2, not just tidiness:** BUG-86 removes `action`
  from the config schema, and this test's own comment notes the harness
  schema-validates the page it serves ("`serveOneModulePage` throws on an invalid
  page"), so an `action` left in the fixture is a live failure, not dead data.
  `ConformanceFixture.props` is `Record<string, unknown>`
  (`tools/generate/src/conformance/types.ts:24`), so the removal is required by
  the runtime contract rather than by the type.
- **No other `config.action` survives** in the merged file. The remaining
  `action` references (`:481`–`:525`) are the *capture-side* form binding
  (`foldedFormFor(...).action`, from a captured `formAction`), a different concept
  that BUG-86 does not touch and theirs' diff never went near.
- **Verified from the index, not the worktree:**
  `git show :tests/req93-l1-slot-mounted-behaviors.test.ts` — no conflict markers,
  no `config.action`, all five `mountedContactFixture` uses intact.

## Staged state

- `git status --porcelain`: 40 paths, zero `UU`; staged path count equals
  `git show --numstat 6728fc3361` path count (40 == 40), so nothing outside the
  commit's own diff was staged.
- Net staged change vs HEAD: 40 files, +473 / −141. A code pick commits, so
  zero-net-change is *not* the success signal here.
- `CHERRY_PICK_HEAD` intact at `6728fc336105be1fe163ccc17f0d9e04202e1903`.

## Verification limits

Read-level only. The caretaker rule forbids `test_fix`, and this repo's suites are
unrunnable in a headless role (`listen EPERM` on the workerd/wrangler suites), so
**no test was run and none is claimed to pass**. BUG-86's own message records
2990 node / 759 workers green on xgd-working at authoring time.

## Forecast for remaining picks on this path

**None.** `git log xgd-working -- tests/req93-l1-slot-mounted-behaviors.test.ts`
shows `6728fc3361` is the TIP for this path (ledger: `6728fc3361`, `ab467d6ce3`,
`03cdac5d40`, `f4336be264`), so there is no further xgd-working commit to pick
here and no forecast section to write. Ours' side ledger is `60a0561aa8` (replay
of xgd-working's own `Merge branch 'free-REQ-155'`), main's `337286c379`
(`Workflow fix_uat_coverage`), then the two shared 07-25 commits — i.e. the two
sides share all history before BUG-86, which is why theirs' diff is only two
lines.

No author's-own-merge oracle was available (the usual "merge xgd-working" commit
one step later does not exist here — BUG-86 is the last commit on the path), so
the resolution rests on the disjointness argument plus the schema-contract check
above.
