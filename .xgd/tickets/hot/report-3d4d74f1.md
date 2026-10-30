---
uid: report-3d4d74f1
id: REPORT-4878
type: report
title: 'Resync resolve conflicts: 47116ed717337769dcd15931d012acf6050e6d0a'
created_by: xgd
created_at: '2026-09-23T22:48:58.331039+00:00'
updated_at: '2026-09-23T22:48:58.331039+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-78370159.md` (REQ-161) — **UU**, intent/bookkeeping
  ticket (`request-*`), rule **2e**: per-fact composition, later-positioned
  intent wins per fact.

  Conflict was index-only: the path is outside the sparse-checkout cone
  (DOC-986 §2/§4.1), so there were no working-tree markers. Resolved via
  `git checkout --ours` + `git add --sparse`.

  Both sides diverge from the merge base (`bf8f70ef`, status
  `ready_to_reconcile`) in exactly three frontmatter facts. Composed per fact:

  | fact | ours (HEAD) | theirs (incoming `bc1af120f1`) | taken |
  |---|---|---|---|
  | `status` | `bundled` | `bundled` | **agree — no conflict** |
  | `bundled_in` | `bundle-87be4669` | `bundle-203b1dc2` | **ours** |
  | `updated_at` | `2026-09-09T21:32:50` | `2026-09-02T17:48:27` | **ours** |

  Ours additionally terminates the file with a newline (base had
  `\ No newline at end of file`); kept.

  Because ours is later-positioned on every *contested* fact and identical on
  the rest, the composed result coincides exactly with stage 2. This is a
  per-fact composition that happens to equal ours, not a whole-file
  "pick a winner".

### Why `bundled_in` resolves to ours

`bundle-87be4669` is the **successor re-bundle** of `bundle-203b1dc2`, not a
competing bundle:

- Identical titles: both are
  `REQ-164 + REQ-159 + REQ-165 + REQ-163 + REQ-161 + 2 more`.
- `bundle-203b1dc2` (BUNDLE-23): created 2026-09-02, status
  `ready_to_reconcile`, working-shas only, then updated 2026-09-07 and
  **archived 2026-09-08** (`64a726eda0`, a 100%-similarity rename
  `hot/` → `archived/`).
- `bundle-87be4669` (BUNDLE-26): created 2026-09-09, reached
  `free_and_reconciled`, `completed_at` 2026-09-11, and carries a real
  `main_sha` (`66e172dd4c…`) plus resync `orphan_commits` remapping.
- `bundle-87be4669` contains a `## REQ-161: The Library tab: list-detail over
  the clients material, and the drop-to-upload overlay` section — i.e. this
  exact request is a member of the successor bundle.

HEAD's value arrived via `seed_local_overlay` (`58ee785188`, 2026-09-09), which
advanced the overlay past the incoming working-side state. Taking incoming
wholesale would have regressed `bundled_in` to point at a bundle that was
archived on 2026-09-08 and never reconciled.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
bookkeeping ticket, so STEP 3's code-diff check does not apply. The incoming
commit's semantic intent is nonetheless carried:

- Incoming `bc1af120f1` bundles REQ-161 (`ready_to_reconcile` → `bundled`).
  The resolved version **is** `status: bundled`. The bundling intent is
  preserved in full.
- The only incoming value not literally present is
  `bundled_in: bundle-203b1dc2`, deliberately superseded by
  `bundle-87be4669` per the supersession evidence above. The request is still
  bundled, into the successor bundle that actually reconciled onto main.
- Incoming's `updated_at` bump is superseded by a strictly later bump in the
  same direction.

Body content is untouched by this resolution: both sides' diffs against the
merge base are frontmatter-only, so the prose (including the
`seed_local_overlay` additions such as the read-only rights-record paragraph
and the shadow → description rename) is already common to base, ours and
theirs.

No test function was deleted; the BUG-1301 precedence exception was not
invoked.

## Staging state

`git ls-files -u` is empty; no `UU`/`AA`/`DU`/`UD` entries remain.
`CHERRY_PICK_HEAD` (`bc1af120f1a82c46afba797f090d254108d5aa86`) is intact and
untouched — no `--continue`/`--skip`/`--quit`/`--abort` was issued.

The staged diff against HEAD is empty: the resolved content equals HEAD because
the already-integrated overlay state supersedes the incoming bookkeeping update
on every contested fact. Per the brief, this is left for the finalize step to
detect and skip; `--skip` was **not** called here.

Remaining `??` entries under `.xgd/tickets/cold/` (6 `comment-*`, 3 `doc-*`)
are pre-existing untracked files present before this resolution began and are
unrelated to the conflict.
