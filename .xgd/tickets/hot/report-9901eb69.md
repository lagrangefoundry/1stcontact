---
uid: report-9901eb69
id: REPORT-4595
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T00:37:39.182985+00:00'
updated_at: '2026-09-21T00:37:39.182985+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/bug-23d1ec27.md` — **UU**, intent/bookkeeping ticket
  (`bug-*` → §2e; §2d does not apply, it covers
  story/acceptance_criterion/capability). Resolved **per fact**; staged with
  `git add --sparse` (outside the sparse-checkout cone, DOC-986 §2/§4.1).

Incoming commit this attempt: `5a68fc8db7f64271fd4bb2068eef3775e138cf0d`
("xgd(ticket): update bug bug-23d1ec27", 2026-08-26T23:21:08Z), 1 file,
91 insertions / 95 deletions. Note this is a **different commit** from attempt
85's `bffb6b34fa`: its `last_field_updated: body` names a real content edit —
it rewraps the `## Symptom` section and everything after it from hard-wrapped
to flowed long lines.

Per-fact disposition (ours = stage 2, incoming = stage 3):

| fact | ours | incoming | disposition |
|---|---|---|---|
| `status` | `bundled` | `ready_to_reconcile` | contested, ours (later-positioned) |
| `updated_at` | 2026-08-31T05:05:09Z | 2026-08-26T23:21:08Z | contested, ours (later-positioned) |
| `last_field_updated` | `status` | `body` | contested, ours (later-positioned) |
| `fields.bundled_in` | `bundle-8eef3846` | absent | ours-only, kept |
| body (`## Symptom` to EOF) | flowed | flowed | **byte-identical, no conflict** |
| EOF newline | present | absent | ours (well-formed) |

Later-positioned determination via `xgd working-timeline` (SHA-stable), not raw
`updated_at`, per §2e / BUG-1030:

- incoming `5a68fc8db7f64271fd4bb2068eef3775e138cf0d` = 2026-08-26T23:21:08+00:00
- HEAD-side `09291354553b3cc38e451bf37d9b827567ee7546`
  (`xgd(ticket): seed_local_overlay bug bug-23d1ec27`) = 2026-08-31T19:21:41+00:00

## Incoming changes preserved

**Incoming's substantive change is fully present in the resolved file.** This
commit's only content contribution is the body reflow, and HEAD already carries
that reflow byte-for-byte: `git diff --no-index` between stage 2 and stage 3
shows zero hunks across the whole body (lines 26-161); the only differences are
the three contested frontmatter scalars, the ours-only `bundled_in`, and the
trailing newline.

Verified directly after staging by diffing the incoming stage against the
resolved working-tree file: the sole hunks are those same frontmatter facts plus
the EOF newline. No body text from the incoming side is missing.

No code/implementation files were in this conflict, so STEP 3's
`git show $CPHEAD -- <file>` had no code targets. No UAT test file was involved
and no test function was deleted. The BUG-1301 precedence exception was **not**
invoked: nothing was dropped as obsolete; incoming's content is present, and
only its frontmatter bookkeeping lost to a strictly later intent already
integrated into HEAD.

Applying incoming's frontmatter instead would have regressed BUG-39 from
`bundled` back to `ready_to_reconcile` and orphaned its
`bundled_in: bundle-8eef3846` membership, while changing nothing about the prose.

## Post-state

- `git status --porcelain` is empty; no UU/AA/DU/UD lines remain.
- Staged tree is identical to HEAD (no `M` line): this resolution leaves no net
  change, which STEP 4 says to leave for Python's finalize to detect and skip.
  `--skip` was **not** called here, nor were `--continue`/`--quit`/`--abort`.
- `CHERRY_PICK_HEAD` re-verified present after staging:
  `5a68fc8db7f64271fd4bb2068eef3775e138cf0d`.
- Resolved file carries `status: bundled`, `updated_at: 2026-08-31T05:05:09Z`,
  `last_field_updated: status`, `fields.bundled_in: bundle-8eef3846`, flowed body.
