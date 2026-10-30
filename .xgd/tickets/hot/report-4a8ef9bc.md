---
uid: report-4a8ef9bc
id: REPORT-5596
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T18:49:03.764373+00:00'
updated_at: '2026-09-29T18:49:03.764373+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — request-909e42f8 (REQ-164)

**Anchor:** report-377b581e
**Cherry-picked commit:** `f73aee4cb9` — `xgd(ticket): update request request-909e42f8` (2026-09-09 10:03:13 -0700)
**Candidate publish tip (apply_target):** `9ac98712a708888db67f8aff21f22b16bd98094e`
**Conflicting path:** `.xgd/tickets/hot/request-909e42f8.md` (only path in the commit's diff)
**Prior stage failure:** none (first attempt)

## Resolution

`--ours`. Net change from HEAD: **zero** (`git diff --cached HEAD` empty), so finalize will skip the commit.

Path is outside the sparse cone — no working-tree file, no conflict markers. All three
sides read from the index (`:1:` base, `:2:` ours, `:3:` theirs).

## Per-fact divergence

| fact | base (`:1:`) | ours (`:2:`) | theirs (`:3:`) | winner |
|---|---|---|---|---|
| `updated_at` | `2026-09-02T17:48:26` | `2026-09-09T21:32:49` | `2026-09-09T17:03:13` | ours (also newer) |
| `status` | `bundled` | `bundled` | `ready_to_reconcile` | ours |
| `bundled_in` | `bundle-203b1dc2` | `bundle-87be4669` | `bundle-203b1dc2` | ours |
| body | long-line / `_em_` | reflowed ~80col / `*em*` | untouched | ours (= HEAD) |

`status` diverges on theirs alone and `bundled_in` on ours alone, so a naive 3-way merge
would pair theirs' `ready_to_reconcile` with ours' `bundle-87be4669` — asserting the ticket
is ready to reconcile under a bundle that already finished reconciling. Adjudicated as one
decision ("which bundle owns this ticket"), not three.

The enrichment's fallback rule ("intent unknown → take the more recent commit by timestamp")
happens to agree here: ours' `updated_at` is 4h29m newer than theirs.

## Evidence

This is the **`bundle-203b1dc2` → `bundle-87be4669` pair** (the second of the two known
pairs), whose seven members are REQ-164, REQ-159, REQ-165, REQ-163, REQ-161, REQ-158,
REQ-167. REQ-164 is this ticket. Ours `bundle-87be4669` is `free_and_reconciled`
(BUNDLE-26, main, 09-09, `main_sha 66e172dd4c`); theirs `bundle-203b1dc2` is
`ready_to_reconcile` with all nulls (BUNDLE-23, xgd-working, 09-02, archived on both sides).

`f73aee4cb9` is **quartet position 1** — the bundling-era `status` flip under the superseded
bundle. xgd-working's own ledger for this path:

```
44947863ce 2026-09-11 03:28:29   free_and_reconciled + completed_at + bundled_in: 87be4669
5a60c25f99 2026-09-09 14:32:49   re-bundle into bundle-87be4669          [position 3]
f03a4ed5dd 2026-09-09 10:03:14   unbundle (drops bundled_in)             [position 2]
f73aee4cb9 2026-09-09 10:03:13   status bundled -> ready_to_reconcile    [position 1] <- picked
7123292250 2026-09-02 10:48:26   (base state)
```

**Decisive blob test:** ours' frontmatter (lines 1–35) is **byte-identical** to
xgd-working's own re-bundle commit `5a60c25f99`. Main's side is a single
`seed_local_overlay` (`3bb3a8c547`, 09-09 14:35:23) that snapshotted it 2 min 34 s later.

So the picked commit is a transient waypoint xgd-working superseded **1 second later**, and
what `--ours` preserves is xgd-working's *own* later decision — not main's. This is the
strongest provenance shape: there is no "was main's change legitimate?" judgement to make.

## Wrinkle: the body reflow is ours-only

Unlike the four previously adjudicated members of this pair, ours is **not** byte-identical
to the re-bundle commit overall. Main's `seed_local_overlay` also **reflowed the body** —
hard-wrapped to ~80 columns and normalized `_em_` → `*em*`, plus some list-blank-line
changes. That reflow is present on ours only; it is in neither base nor xgd-working.

It does not affect this decision (theirs touches only `updated_at` and `status`, never the
body), but it is live for the remaining picks below.

## Forecast for the remaining picks on this path

- **Position 2 — `f03a4ed5dd`** (unbundle, 09-09 10:03:14). Base advances to `f73aee4cb9`'s
  state; ours unmoved. Theirs removes `bundled_in` and sets `last_field_updated: bundled_in`.
  Expect `--ours`, zero net change. The removal is *subsumed, not lost*: position 3 replaces
  the field with `bundle-87be4669`, which HEAD already carries.
- **Position 3 — `5a60c25f99`** (re-bundle into `bundle-87be4669`). Frontmatter is identical
  to ours, so the only divergence is the ours-only body reflow. May auto-merge; if it
  conflicts, `--ours`.
- **Position 4 — `44947863ce`** (09-11 03:28:29). **Genuine new intent — do NOT blanket
  `--ours`.** It advances `status` to `free_and_reconciled` and sets `completed_at`
  (`2026-09-11T10:28:29.840499+00:00`), both of which HEAD lacks; incoming wins those two
  facts. Keep ours' reflowed body and ours' `bundled_in` (already `bundle-87be4669` on both
  sides by then).

## Verification

- `git status --short` → clean, no unmerged paths.
- `git diff --cached HEAD --stat` → empty.
- No test run: `.xgd/tickets/**` is metadata only, and workerd/wrangler suites are
  unrunnable in this role (`listen EPERM` outside the `interactive` role).
