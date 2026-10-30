---
uid: report-a70f0b30
id: REPORT-5311
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T07:04:42.176554+00:00'
updated_at: '2026-09-28T07:04:42.176554+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-78f4e2fe.md` (BUNDLE-21) — **UU**, intent/bookkeeping
  ticket (**STEP 2e**, `bundle-*`). Resolved to **ours (HEAD)** wholesale;
  staged blob is exactly stage 2 (`d51c00436b`).

  One hunk, lines 8-18, confined to the frontmatter lifecycle scalars:

  | field | ours (HEAD) | incoming (`bcb265bba4`) |
  |---|---|---|
  | `status` | `free_and_reconciled` | `reconciling` |
  | `completed_at` | `2026-08-31T19:19:32` | `null` |
  | `updated_at` | `2026-08-31T19:19:50` | `2026-08-31T14:23:56` |
  | `last_field_updated` | `result` | `status` |

  Rule applied: the two sides changed the SAME facts differently, so this is a
  genuine intent conflict and the later-positioned intent wins **per fact**.
  Ours is later on every conflicting field (19:19 vs 14:23 the same day), and
  ours is additionally a strict superset — so "later per fact" and "keep the
  superset" both select ours for the whole hunk. This also matches the
  auto-enrichment rule supplied for this file ("take the more recent commit by
  timestamp"), since both sides' subjects are the generic
  `xgd(ticket): update bundle bundle-78f4e2fe` and neither states an operation.

  Sparse-checkout note (DOC-986 §2/§4.1): the path is outside the cone on this
  resync branch. `git checkout --ours` printed "will not be updated in the
  index" but *did* write the file; staging required `git add --sparse`.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is a
bookkeeping ticket — so STEP 3's "incoming code changes must appear in the
result" check has no code-file subjects, and the BUG-1301 precedence exception
was not invoked anywhere. No hunk was dropped under it.

The incoming commit's intent is nonetheless **preserved by supersession, not
discarded**. `git show bcb265bba4` shows its sole content change was advancing
the bundle `ready_to_reconcile` → `reconciling` at 14:23. HEAD already sits at
`free_and_reconciled` — strictly downstream on the bundle lifecycle — so the
incoming transition is an earlier waypoint on the same path HEAD has already
travelled past.

The ours-vs-incoming blob diff confirms the direction independently of the
timestamps; ours is the completed end state and incoming is mid-flight:

- ours carries the 21-entry `orphan_commits` remap table; incoming has none
- ours carries `merged_at_commit: 96a76934e0` and `result: pass`; incoming neither
- ours has the commit remapped to main (`working_sha: null`,
  `main_sha: 96a76934e0`); incoming still holds five un-remapped `working_sha`
  entries with `main_sha: null`

Taking incoming would have regressed `free_and_reconciled` → `reconciling`,
nulled `completed_at`, dropped `result: pass` and `merged_at_commit`, and
resurrected five stale un-remapped working shas. Lifecycle scalars must not
regress.

Bodies are byte-identical between the two sides — the blob diff shows no hunk
below `# Bundle`, including trailing-newline state — so nothing outside the
frontmatter was in question and no incoming body content is lost.

## Net effect

Because ours already subsumed the picked commit's intent, the staged tree equals
HEAD's tree for this path and the cherry-pick is **empty**. Per STEP 4 this is
staged and left as-is rather than `--skip`ped; the finalize step is expected to
detect the clean staged diff and skip the commit.

Staging verified clean: `git status --porcelain` empty, `git ls-files -u` empty.
`CHERRY_PICK_HEAD` deliberately left live at `bcb265bba4` — no `--continue`,
`--skip`, `--quit`, or `--abort` was run.
