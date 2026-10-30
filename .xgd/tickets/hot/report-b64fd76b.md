---
uid: report-b64fd76b
id: REPORT-5597
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T18:52:07.831988+00:00'
updated_at: '2026-09-29T18:52:07.831988+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution — request-909e42f8 (REQ-164), quartet position 2

**Anchor:** report-377b581e
**Cherry-picked commit:** `f03a4ed5dd` — `xgd(ticket): update request request-909e42f8` (2026-09-09 10:03:14 -0700)
**Candidate publish tip (apply_target):** `9ac98712a708888db67f8aff21f22b16bd98094e`
**HEAD:** `956b96b079` (unmoved — position 1 resolved to zero net change, finalize skipped the commit)
**Scope:** `.../resync_cherry_pick_one_attempt/1797/0`

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e**
  (per-fact adjudication, later-positioned intent wins). Path is outside the sparse-checkout cone
  (DOC-986 §2/§4.1): no working-tree file, conflict exists only in the index. Resolved with
  `git checkout --ours` + `git add --sparse`. Outcome **`--ours`**; net change from HEAD is **zero**
  (`git diff --cached HEAD` empty). Per STEP 4 this is staged and left for Python's finalize to skip —
  `--skip` was NOT called here.

## Per-fact divergence

Theirs (`f03a4ed5dd`) is the **unbundle**, landing 1 second after position 1.

| fact | base (`:1:`) | ours (`:2:`) | theirs (`:3:`) | winner |
|---|---|---|---|---|
| `updated_at` | `2026-09-09T17:03:13` | `2026-09-09T21:32:49` | `2026-09-09T17:03:14` | ours (later-positioned) |
| `last_field_updated` | `status` | `status` | `bundled_in` | ours |
| `bundled_in` | `bundle-203b1dc2` | `bundle-87be4669` | *(removed)* | ours |

Base advanced to position 1's result (verified byte-identical to `f73aee4cb9`'s blob); ours is
unmoved and byte-identical to HEAD.

## Incoming changes preserved

Not a code file — no `xgd_source/**`, `tests/**`, or `bin/**` content, no UAT test functions on
either side. The BUG-1301 precedence exception was **not** invoked; nothing was dropped as obsolete.

Theirs' removal of `bundled_in` is **subsumed, not discarded**. `f03a4ed5dd` is not the last commit
on the incoming side for this path — two more follow, and xgd-working itself restores every fact
this commit touches 4h29m later in `5a60c25f99` (the re-bundle):

- `bundled_in` → `bundle-87be4669` (the value ours/HEAD already carries)
- `last_field_updated` → `status`
- `status` → `bundled`

So `--ours` preserves the developer's own later decision rather than pinning a transient waypoint.
Taking theirs here would have stripped `bundled_in` from a ticket whose owning bundle
(`bundle-87be4669`, BUNDLE-26, `free_and_reconciled`) has already finished reconciling.

## Remaining picks on this path — forecast

- **Position 3 — `5a60c25f99`** (re-bundle into `bundle-87be4669`). Frontmatter is identical to ours;
  the only divergence is the ours-only body reflow that main's `seed_local_overlay` (`3bb3a8c547`)
  introduced. May auto-merge; if it conflicts, `--ours`.
- **Position 4 — `44947863ce`** (2026-09-11 03:28:29). **Genuine new intent — do NOT blanket-`--ours`.**
  It advances `status` to `free_and_reconciled` and sets `completed_at`
  (`2026-09-11T10:28:29.840499+00:00`), neither of which HEAD has; incoming wins those two facts.
  Keep ours' reflowed body and ours' `bundled_in` (both sides agree on `bundle-87be4669` by then).

## Verification

- `git status --porcelain` → clean, no `UU/AA/DU/UD` lines.
- `git diff --cached HEAD --stat` → empty.
- `CHERRY_PICK_HEAD` still present at `f03a4ed5dd` for the finalize step.
- No test run: `.xgd/tickets/**` is metadata only, and workerd/wrangler suites are unrunnable in this
  role (`listen EPERM` outside the `interactive` role).
