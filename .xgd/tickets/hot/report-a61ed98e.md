---
uid: report-a61ed98e
id: REPORT-5298
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T06:13:51.813211+00:00'
updated_at: '2026-09-28T06:13:51.813211+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — class **UU** with a real merge base (stage 1 `276781dcf2`, stage 2/ours `36e51a0c74`, stage 3/theirs `ce69fd1a5d`). File class **2e — intent/bookkeeping ticket** (`request-*`), so resolved **per fact, composing both sides** rather than picking a winning file. Incoming commit is `60dd71c0533f493ff8a9dee945f5201af056d393` ("xgd(ticket): update request request-b88b79fe", authored 2026-08-28 09:40:51 -0700).

Per-fact decisions, measured against the shared base:

| Fact | base | ours (HEAD) | theirs (incoming) | Resolution |
| --- | --- | --- | --- | --- |
| `updated_at` | 2026-08-28T16:38:43Z | 2026-08-31T05:05:09Z | 2026-08-28T16:40:51Z | **ours** — later-positioned intent |
| `last_field_updated` | `status` | `status` | `story_points` | **ours** — its value reflects the Aug-31 status op, later than theirs' Aug-28 story_points op |
| `status` | `free_coded` | `bundled` | `free_coded` (unchanged) | **ours** — only ours changed this fact; theirs carries the base value |
| `fields.bundled_in` | absent | `bundle-8eef3846` | absent | **ours** — ours-only addition, kept |
| `fields.commits`, `fields.version` | present | identical | identical | no conflict |
| body — `# What was built` section | absent | added (mechanically rewrapped) | added (as authored) | **theirs** — see below |

**Why the body comes from theirs.** Both sides add the same section, so this is an overlapping
change. It is not a competing *intent*, though: a word-level comparison of the two bodies
(whitespace, `|`, `*`, `` ` `` and `_` normalised away) is identical except for **six tokens** —
two blockquote `>` continuation markers and two markdown table header separator rows
(`|---|---|`), all present on theirs and missing on ours. Ours is the authored text after a
`seed_local_overlay` rewrap, which flattened the `## Files` and `## AC status` tables into loose
lines and dropped the blockquote markers; theirs is the developer's authored markdown. Taking
theirs' body therefore loses **no** ours-side content while restoring structure the rewrap
destroyed, and it keeps this file's body byte-aligned with the hard-wrapped form the rest of the
xgd-working queue will diff against — so it also reduces conflict surface for later picks. Ours'
frontmatter is kept verbatim, so nothing HEAD decided is regressed.

Resolved blob = ours' frontmatter (lines 1–27, byte-identical) + theirs' body (13952 bytes,
byte-identical). Verified by `diff`: against theirs only the four frontmatter facts above differ;
against ours the first hunk starts at line 35, i.e. **no** frontmatter hunk, and all 39 hunks are
body rewrapping. No conflict markers remain (`grep -c '^<<<<<<<'` → 0).

## Incoming changes preserved

No code/implementation files were in this conflict, so STEP 3's per-file code verification has no
subject and the BUG-1301 precedence exception was **not** invoked — nothing was dropped on those
grounds.

Incoming's one substantive addition — the entire `# What was built` implementation record (AC3's
fourth option and in-process request fulfilment, the one-browser-per-run lease, the `1c shot`
runtime split, what the CF driver omits, deliberately-not-done, the Files table, the 25-UAT test
plan, the AC-status table) — is present **verbatim, byte-for-byte**, because the resolved body
*is* theirs' body. Its three remaining facts (`updated_at`, `last_field_updated`, `status`) are
superseded by strictly later values of the same fields already on HEAD; none is lost content.

Staging: `git status --porcelain` → `M  .xgd/tickets/hot/request-b88b79fe.md`, `git ls-files -u`
empty, and `CHERRY_PICK_HEAD` still `60dd71c0533f493ff8a9dee945f5201af056d393`. No
`--continue/--skip/--quit/--abort` was called. Unlike the previous pick in this queue
(`04d4a9841d`, resolved ours-wins to an empty diff, REPORT-5297), this resolution leaves a **real
staged change**, so finalize should commit it rather than skip.
