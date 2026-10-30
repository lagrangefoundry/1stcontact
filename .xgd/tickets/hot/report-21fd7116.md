---
uid: report-21fd7116
id: REPORT-4852
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-23T18:48:57.749154+00:00'
updated_at: '2026-09-23T18:48:57.749154+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-51514090.md` (REQ-156) — **UU**, intent/bookkeeping
  ticket (`request-*`), STEP 2e. Resolved in favour of HEAD for both conflict
  hunks, because HEAD is a **strict superset** of the incoming side ("one side a
  strict superset: keep the superset"). Staged blob is byte-identical to HEAD's
  `efd42480e9b08490d9668a9f3ebfe80537d4824c`, trailing-newline state included.
  Staged with `git add --sparse` (path is outside the sparse-checkout cone,
  DOC-986 §2/§4.1).

  Three-way analysis (base `6cdf2fb086`, ours `efd42480e9`, theirs `57c474750a`):

  | | incoming (`02673c14e8`, `update request`) | HEAD (`seed_local_overlay request`) |
  |---|---|---|
  | body append "What the codec must do, precisely" … "A finding AC4 turned up" | added | added, **byte-identical** |
  | `updated_at` | 2026-09-01T21:53:59 | 2026-09-16T01:48:38 |
  | `status` / `completed_at` | `draft` / `null` | `bundled` / 2026-09-14T10:29:03 |
  | `last_field_updated` | `body` | `status` |
  | `fields.commits` (3 entries), `fields.version: 0.2.39`, `fields.bundled_in: bundle-8e1807f6` | absent | present |
  | body tail "One honest caveat about 'the last native dependency'" | absent | present |

  The identical body append on both sides is why the middle of the file merged
  cleanly and the conflict is confined to the frontmatter block and the file
  tail. No field is changed *differently* on the two sides — every incoming fact
  is either identical to HEAD's or a strictly earlier state of it — so 2e's
  "genuine conflict, take the later-positioned intent per fact" branch is not
  reached. Taking the incoming side on either hunk would have regressed the
  ticket from `bundled` back to `draft` and dropped the bundle/commit metadata.

## Incoming changes preserved

- `.xgd/tickets/hot/request-51514090.md` — **all substantive incoming content is
  present.** Verified against `git show 02673c14e8 -- <path>`: the commit's sole
  content contribution is the 69-line body append, and all nine of its sections
  ("It must reproduce sharp's greyscale expansion", "It must cover the decode
  paths the corpus pins", "It must refuse what it cannot do, by name",
  "Dimensions must be readable without inflating", "Crop clamps rather than
  throws", "Greyscale heatmaps should be stored as greyscale", "`crop` leaves the
  preflight map", "Sequencing, revisited: AC5 is not deliverable yet", "A finding
  AC4 turned up") are present verbatim in the staged blob.

  The only incoming value not carried forward is the `updated_at` scalar
  (2026-09-01T21:53:59), superseded by HEAD's later 2026-09-16T01:48:38. That is
  the intended outcome of the superset rule on a monotonic bookkeeping timestamp,
  not a discarded edit.

- No code, spec-ticket, or UAT files were in conflict; the BUG-1301 precedence
  exception was not invoked and no hunk was dropped under it.
