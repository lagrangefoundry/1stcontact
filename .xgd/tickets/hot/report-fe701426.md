---
uid: report-fe701426
id: REPORT-5430
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T03:02:24.716797+00:00'
updated_at: '2026-09-29T03:02:24.716797+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-3bc4b835.md` — **UU**, intent/bookkeeping ticket
  (`request-*`; classified by ticket *type* under STEP 2e, not 2d — `request`
  is not a matrix-defining spec type, it just lives in `hot/` in this repo).
  Path is outside the sparse-checkout cone (`!/.xgd/tickets/**`, DOC-986
  §2/§4.1), so the conflict existed only in the index with no working-tree
  markers; resolved with `git checkout --ours` + `git add --sparse`.
  **Rule applied:** 2e per-fact later-positioned-intent. Resolved to the OURS
  blob `b4342d0ddc9f5d1ce0a150d02eedf2e944364dc3` (stage 0).

Incoming commit: `36728a6a1a63437f2d2a7c5d39fcb96ad1f3c4b3`
("xgd(ticket): update request request-3bc4b835", 2026-08-31 18:31:23, empty
commit body — no `--commit-message` narrative to compose from).
Merge base: `e6b5619e`. Ours: `b4342d0d`. Theirs: `2b8dcbd1`.

### Per-fact resolution

| fact | base | incoming (theirs) | HEAD (ours) | winner | why |
|---|---|---|---|---|---|
| `updated_at` | 01:31:19 | 01:31:23 (+4s) | **2026-09-09T21:32:50** | ours | both sides changed it — genuine same-fact conflict; ours is 8 days later |
| `last_field_updated` | `status` | `story_points` | **`status`** | ours | derived breadcrumb, functionally dependent on `updated_at` (see below) |
| `status` | `free_coded` | `free_coded` (unchanged) | **`bundled`** | ours | only ours changed it; `bundled` is downstream of `free_coded` |
| `bundled_in` | absent | absent | **`bundle-87be4669`** | ours | only ours added it |
| body retrospective note | absent | absent | **present** | ours | only ours added it |
| `story_points` | `3` | `3` | `3` | *identical* | no conflict — unchanged in all three stages |

`last_field_updated` is not an independently composable field: it records which
field the *most recent* update touched, so it is functionally dependent on
whichever `updated_at` wins. Taking incoming's `story_points` alongside ours'
2026-09-09 timestamp would produce an incoherent record — it would assert that
the 2026-09-09 bundling update touched `story_points`. Because ours' update is
the chronologically later one (and the one that actually changed a field,
`status` → `bundled`), `last_field_updated: status` is the only self-consistent
value. Composing the two sides here is not possible; this is the genuine
same-fact conflict 2e resolves by recency.

Ours' recency is corroborated by real downstream state, not just the timestamp:
`bundle-87be4669` is a live bundle shared with `request-78370159`,
`request-439cd0c8`, and `request-909e42f8`, and the change ledger only ever
records `bundled → free_and_reconciled`. Accepting incoming would have
regressed this ticket eight days backwards out of its bundle.

## Incoming changes preserved

No code or implementation files were involved in this conflict, so STEP 3's
`git show $CPHEAD -- <file>` check applies only to the one ticket file.

The incoming commit's **complete** contribution, per
`git diff e6b5619e 2b8dcbd1`, is two lines:

```
-updated_at: '2026-09-01T01:31:19.917604+00:00'
+updated_at: '2026-09-01T01:31:23.680548+00:00'
-last_field_updated: status
+last_field_updated: story_points
```

**It changes no field value whatsoever.** `story_points` is `3` in the merge
base, `3` in theirs, and `3` in ours — verified directly against all three
blobs. The commit recorded a `story_points` update event whose value was
identical to what was already there, so there is no developer-authored content
on the incoming side to preserve or discard. Both incoming lines are pure
bookkeeping breadcrumbs superseded by ours' strictly later update, as tabulated
above.

No BUG-1301 precedence exception was invoked — no hunk was dropped on the
grounds of a prior HEAD-side refactor. No UAT test files were involved and no
test function was deleted.

## Net effect

The resolution is byte-identical to HEAD (`b4342d0d`), so this cherry-pick has
an empty net diff. Staged and left as-is per instructions —
`--continue`/`--skip`/`--quit`/`--abort` not invoked; `CHERRY_PICK_HEAD`
(`36728a6a1a`) remains present for the finalize step, which will detect the
clean staged diff and skip the commit.
