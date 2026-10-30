---
uid: report-e5eeda2a
id: REPORT-5621
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T23:32:28.223376+00:00'
updated_at: '2026-09-29T23:32:28.223376+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

# Resync conflict resolution: `.xgd/tickets/hot/request-8b33a146.md`

**Picked commit:** `e5c7208176` — `xgd(ticket): update request request-8b33a146`
(2026-09-11 11:53:54 -0700)
**Apply target:** `9ac98712a708888db67f8aff21f22b16bd98094e`
**HEAD at resolution:** `f38bc7ef24`
**Ticket:** REQ-172 — "Library detail: render documents inline, with an
expand-to-modal reader"
**Class:** `UU` (both modified), file materialized in the working tree
**Outcome:** `--ours`, zero net change from HEAD
**Prior stage failure:** none

## Stage blobs

| stage | blob | meaning |
| --- | --- | --- |
| `:1:` | `5545984cba` | base (picked commit's parent state) |
| `:2:` | `284e1e08f9` | ours — identical to `HEAD:<path>` |
| `:3:` | `ed24a4ce42` | theirs (the picked commit) |

## Why `--ours`

This is the **third-shape** pattern, and it took the **fast exit**: the picked
commit is xgd-working's re-bundle of REQ-172 into `bundle-8e1807f6`, and
`bundled_in: bundle-8e1807f6` is **byte-identical on both sides**. When the two
sides agree which bundle owns the ticket there is nothing to adjudicate, so no
`bundle-4efd33fe`-vs-`bundle-8e1807f6` pair analysis was needed.

Both sides' deltas from base are frontmatter-only and touch the same three
facts. Ours is strictly later on every one of them:

| fact | base | theirs (`e5c7208176`) | ours (HEAD) |
| --- | --- | --- | --- |
| `updated_at` | `2026-09-09T21:31:17` | `2026-09-11T18:53:54` | `2026-09-19T15:15:29` |
| `status` | `ready_to_reconcile` | `bundled` | `free_and_reconciled` |
| `completed_at` | `null` | `null` | `2026-09-14T10:29:05` |
| `bundled_in` | (absent) | `bundle-8e1807f6` | `bundle-8e1807f6` — **identical** |

Theirs' entire contribution — adding `bundled_in: bundle-8e1807f6` — is already
present on ours, and ours has since carried the ticket past `bundled` to the
terminal `free_and_reconciled` + `completed_at`. Nothing incoming is lost.
Theirs never touches the body; ours differs there only by adding the trailing
newline base lacked.

## Forecast for the remaining picks

Three xgd-working commits on this path remain after this one (ledger verified
live):

| pick | date | what it does | call |
| --- | --- | --- | --- |
| `1c9f59d330` | 09-14 | writes the exact `completed_at`/`status` ours already has; `updated_at` 09-14 < ours' 09-19 | `--ours` |
| `798a8a5ee0` | 09-15 | moves `status` **backward** to `bundled`; `updated_at` 09-16 < ours' 09-19 | `--ours` |
| `d1453db0b6` | 09-19 (tip) | `updated_at` `15:15:37.349811` vs ours' `15:15:29.110241` | **NOT `--ours`** — incoming wins `updated_at` alone (8.2 s later); every other field is byte-identical |

### Correction to REPORT-5604

REPORT-5604 forecast that all four remaining picks on this ticket were
`--ours` with "no exception at the tip", reasoning from ours already holding
the terminal lifecycle state. The live ours-vs-tip diff run here shows that is
**wrong**: the tip `d1453db0b6` leads ours' `updated_at` by 8.2 s and wins that
one fact. This is the same error REPORT-5620 corrected on bug-034bf955.

**Holding the terminal state does not imply the tip matches — always run the
ours-vs-incoming-tip diff instead of inferring it from the lifecycle status.**

Also note the **backward-lifecycle trap** on this ticket, which holds as
before: `free_and_reconciled` (09-14) → `bundled` (09-15) →
`free_and_reconciled` (09-19). A lifecycle status can move backward on
xgd-working, so "monotone lifecycle" is not a safe assumption when judging
which side is later.

## On the enrichment's resolution rule

The enrichment reported intent unknown on both sides and prescribed "take the
more recent commit by timestamp and flag for post-merge review". That rule
happens to agree with `--ours` here (ours' `updated_at` is 09-19 against
theirs' 09-11), but the agreement is incidental — the decision rests on the
identical `bundled_in` plus every theirs-side fact being superseded on ours.

## Verification

- `git status --porcelain` — completely empty (zero net change from HEAD, so
  finalize will skip the commit)
- `CHERRY_PICK_HEAD` intact at `e5c7208176`
- only `.xgd/tickets/hot/request-8b33a146.md` staged — the sole path in the
  picked commit's own diff

No test run: the caretaker rule forbids `test_fix`, and this resolution changes
no code. Verification is read-level by design.
