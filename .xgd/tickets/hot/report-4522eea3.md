---
uid: report-4522eea3
id: REPORT-4664
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T05:59:52.638509+00:00'
updated_at: '2026-09-21T05:59:52.638509+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` — **UU** (both modified), intent/bookkeeping
  ticket (REQ-161, "The Library tab: list-detail over the client's material, and the
  drop-to-upload overlay"). Rule **2e** applied per fact, not per file.

  Incoming `CHERRY_PICK_HEAD` = `0d29fbb504` ("xgd(ticket): update request
  request-78370159", 6 insertions / 6 deletions) — the 2026-08-31 content edit that
  renames the *text-shadow* concept to *attachment description* and moves the fields
  to `description_status` / `description_model`. Two conflict hunks; both resolved to
  HEAD (ours), each for a per-fact reason:

  | hunk | fact | incoming (parent → child) | HEAD (ours) | taken |
  |---|---|---|---|---|
  | 1 (frontmatter) | `updated_at` | `2026-08-31T20:15:23Z` → `2026-08-31T22:57:14Z` | `2026-09-09T21:32:50Z` | **ours** |
  | 1 | `last_field_updated` | `created_at` → `body` | `status` | **ours** |
  | 1 | `status` | *(untouched by incoming)* | `bundled` (was `draft`) | **ours** |
  | 2 (`## Open questions — resolved`) | three open-question bullets | *(untouched; incoming adds only a trailing newline)* | all three answered | **ours** |

  Hunk 1 is a genuine same-field conflict on `updated_at` / `last_field_updated`:
  HEAD's stamp is later-positioned by nine days, so ours wins per 2e. `status` is not
  a competing fact at all — incoming never touches it; it entered the hunk only
  because it sits between two lines incoming did change, and taking theirs would have
  rewound the ticket from `bundled` back to `draft`.

  Hunk 2 is likewise not a competing fact: incoming's only contribution to that
  region is a trailing newline on the final line, and the file already ends with one.
  Its three bullets are the *open* phrasings ("Probably folds into the first area;
  worth a look", "A click-to-browse affordance is needed", "Prompt, or default to
  'just for you to read'?"); HEAD carries the *answered* versions of the same three
  questions (third area: **No**; non-drag upload: **Built**, every area is a real
  `<button>`; ambiguous drop: **Prompt, never default**, with the reasoning that
  neither fallback is safe). HEAD is strictly later intent on every bullet.

- No code, test, spec-matrix (`story-` / `acceptance_criterion-` / `capability-`) or
  config files were in this conflict set — the cherry-pick touches exactly one path,
  an xgd bookkeeping ticket. No test function on either side was touched, and the
  BUG-1301 precedence exception was **not** invoked.

## Incoming changes preserved

Nothing the incoming side authored was dropped.

The commit's two substantive body edits — `text shadow` → `description` at the
detail-pane paragraph and at "classify, write the description" — are **present in
the resolved file** (lines 69 and 155). They never entered a conflict hunk: HEAD had
reached that same wording independently, so both sides made the identical change and
git merged it cleanly. Verified against `CHERRY_PICK_HEAD` per STEP 3:

    git show 0d29fbb504 -- .xgd/tickets/hot/request-78370159.md
    git show HEAD:.xgd/tickets/hot/request-78370159.md | grep -c shadow   # -> 0

The `description_status=ok` / `description_model=client` field names the commit
message calls out are likewise already in HEAD, in the
`POST /api/material/description` bullet (lines 206-207).

The only facts not carried forward are the superseded `updated_at` /
`last_field_updated` stamps, the `status: draft` that a later edit advanced to
`bundled`, and the three open-question phrasings that HEAD answers — all bookkeeping
or superseded intent, not developer work.

## Staging state

Conflict markers removed and the path staged with `git add --sparse` (it sits outside
this branch's sparse-checkout cone — 11% of tracked files present; DOC-986 §2/§4.1).
`git status --porcelain` is empty: no unmerged paths, no modified paths; `grep -c` for
conflict markers is `0`.

The staged blob is **identical to HEAD's blob** (`git diff --cached HEAD` empty; a
direct diff of the working file against `HEAD:` exits 0), so this cherry-pick carries
an empty net change — expected, since its entire substantive payload is already
recorded on HEAD and every remaining difference was a superseded timestamp, a rewound
status, or an open question HEAD has since answered. Per STEP 4 this is staged and
exited normally rather than skipped; the finalize step should expect a clean staged
diff.

Per STEP 4, `--continue`, `--skip`, `--quit` and `--abort` were **not** called and
nothing was run that resets or forgets the cherry-pick; `CHERRY_PICK_HEAD`
(`0d29fbb50470b5705d7ba9cd78e1a71992697e90`) is intact for the finalize step.
