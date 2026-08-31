---
uid: report-6d7b7fae
id: REPORT-2828
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-20'
created_by: xgd
created_at: '2026-08-31T08:01:37.841507+00:00'
updated_at: '2026-08-31T08:01:37.841507+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-20
---

## Files resolved

- `.xgd/tickets/hot/request-4fcbd354.md` — **AA** (both added), intent/bookkeeping ticket
  (`request-*`), rule **2e** (strict-superset branch). Path is outside the sparse-checkout
  cone (DOC-986 §2/§4.1), so the conflict existed index-only with no working-tree markers;
  resolved with `git checkout --ours --ignore-skip-worktree-bits` then `git add --sparse`
  (`--sparse` is not a valid `git checkout` option in this git build, hence
  `--ignore-skip-worktree-bits`).

  Both sides are the same 167-line REQ-151 ticket. A full blob diff shows the two versions
  are **byte-identical in the entire markdown body** — every difference is confined to three
  frontmatter facts, and HEAD holds the strictly later state on all three:

  | fact | incoming (`61d15c3f`) | ours (HEAD) |
  |---|---|---|
  | `updated_at` | `2026-08-22T21:55:22` | `2026-08-24T02:10:41` |
  | `status` | `ready_to_reconcile` | `bundled` |
  | `fields.bundled_in` | *(absent)* | `bundle-b3b7c399` |

  HEAD is a strict superset: it advanced `status` along its own lifecycle
  (`ready_to_reconcile` → `bundled`) and added a field the incoming side never carried.
  There is no field where the two sides assert different values for the same fact at the
  same lifecycle position, so the timeline rule for genuine per-fact conflicts was not
  reached. This also matches the auto-enrichment guidance ("take the more recent commit by
  timestamp") — ours is 2026-08-24, incoming is 2026-08-22.

  Taking the incoming side here would have reverted `status` to `ready_to_reconcile` and
  dropped `bundled_in: bundle-b3b7c399` — the bookkeeping for **this very reconcile
  bundle** — so keeping the superset is also the only resolution consistent with the run
  in progress. No content was invented; the resolved file is exactly HEAD's blob
  (`b2442a80`).

## Incoming changes preserved

Confirmed. The incoming commit `61d15c3f` ("xgd(ticket): update request request-4fcbd354")
touches exactly one file and is a whole-file add of 167 lines — there are no code or
implementation files in this conflict, and no UAT test files.

`git show 61d15c3f -- .xgd/tickets/hot/request-4fcbd354.md` against the resolved blob:
every line of the incoming ticket's authored content — the Why, What changed (the four
`siteConfigSchema` fields, `COUNTRY_DEFAULTS`, both renderers emitting `lang`/`dir`,
`BehaviorProps.locale`), the undeclared-default design note, all 7 acceptance criteria, the
9-UAT test list, the operator note on `1c.mjs`/`vite`, and the Origin links — is present
verbatim in the resolved version. Nothing the developer wrote was discarded.

The only incoming-side facts not carried forward are the two superseded bookkeeping scalars
(`updated_at: 2026-08-22...`, `status: ready_to_reconcile`). Those are not developer content
being overwritten; they are an earlier position of the same ticket's own lifecycle that HEAD
has since advanced past under rule 2e.

No hunk was dropped under the BUG-1301 precedence exception; that exception was not needed
and was not invoked.

## Note on the staged diff

The resolution stages identical to HEAD, so `git status --porcelain` shows no entry for the
path (index is merged at stage 0, blob `b2442a80`). Per STEP 4 this is expected and is not a
`@fail`: STEP 3's check distinguishes it as **redundant**, not discarded — the incoming
commit's substantive content is already present in HEAD in full, rather than being absent
from it. `--skip` was not called; `CHERRY_PICK_HEAD` (`61d15c3f`) is left intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit itself.
