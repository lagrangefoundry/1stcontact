---
uid: report-dab8a9bf
id: REPORT-4189
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-14T00:38:42.743619+00:00'
updated_at: '2026-09-14T00:38:42.743619+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU**, intent/bookkeeping ticket
  (2e; sparse-excluded, so index-only — resolved with `git checkout --ours` +
  `git add --sparse`). Enrichment: ours = `seed_local_overlay`, theirs =
  `free_coded` `update`. **Resolution: take ours, per-fact — ours is a strict
  superset of theirs on every fact.**

  Per-fact breakdown of the three conflict hunks:

  1. **Frontmatter.** Ours `updated_at: 2026-09-09T21:32:50Z`,
     `status: bundled`, plus `fields.bundled_in: bundle-87be4669`. Theirs
     `updated_at: 2026-09-01T19:34:09Z`, `status: ready_to_reconcile`, no
     `bundled_in`. Ours is later-positioned on the same facts and adds a field
     theirs never had; taking theirs would regress the status and drop
     `bundled_in`.
  2. **"3. The size argument…" section.** Same facts on both sides; ours is a
     reflowed rendering of the identical content (long lines, `_italics_` for
     `*italics*`, the size table flattened to loose lines, approximation tildes
     dropped). No fact differs.
  3. **"A second blocker … `HTTPS_PROXY`" paragraph.** Theirs bundles the three
     follow-on paragraphs ("The cause is proxy handling…", "This is an
     environment artefact…", "Q2 — generated, not committed…") that already sit
     *below* the conflict region as common (unconflicted) context in both
     sides. Taking theirs would have duplicated all three verbatim; ours has
     each exactly once.

  No content was invented, and no field outside what one side already declared
  was touched.

## Incoming changes preserved

Confirmed present. The incoming commit `d14bb2985c` contributed exactly two
content changes over the merge base (verified by diffing merge stages `:1:` vs
`:3:`):

1. Rewrote "3. The size argument…" from projected to measured numbers.
2. Added the `HTTPS_PROXY` / `NODE_USE_ENV_PROXY=1` build-blocker paragraphs.

HEAD already carried both in full — the ticket was updated again on 2026-09-09
through a path that reflowed the whole file, which is why the hunks conflict on
formatting while agreeing on content. Every distinct fact from the incoming diff
was grepped for in the resolved file and found: `measured, not projected`,
`1052 KiB`, `107,305`, `520,730`, `294,767`, `1341 KiB`, `2.75×`, `228,864`,
`642,230`, `3.6× headroom`, `29 of the 39`, `doc_kind: system_kb`,
`NODE_USE_ENV_PROXY=1`. Nothing from the incoming side is absent.

No hunks were dropped under the BUG-1301 precedence exception; it does not
apply here.

Note: the staged tree therefore nets to **no diff vs HEAD** — the seeded local
overlay already carried the incoming field state (the redundant-commit case of
STEP 4 / BUG-1109, not the discard case of STEP 3, which the fact-presence check
above distinguishes). `CHERRY_PICK_HEAD` (`d14bb2985c`) is left intact for
`cherry_pick_finalize_resolution` to detect the clean staged diff and skip the
commit. No `--continue`/`--skip`/`--abort`/`reset` was run.

## Flagged for post-merge review (per the enrichment's resolution rule)

Not blocking, and pre-existing in HEAD rather than introduced by this
resolution — the 2026-09-09 reflow that produced HEAD's version degraded the
markdown in ways worth a cleanup pass on the working branch:

- The size table (`Source markdown` / `kb.js` raw / `kb.js` gzip) is now
  unstructured loose lines; labels are no longer associated with their numbers.
- Approximation tildes were dropped, changing hedged figures into exact ones:
  `~223 KiB` → `223 KiB`, `~78%` → `78%`, `~6×` → `6×`, `~2.7 MiB` → `2.7 MiB`.
- Strikethrough was dropped from the answered entry under "Open questions".
- Bold adjacent to inline code is mangled throughout (e.g.
  `**1052 KiB gzip with **`KB = null``).

Widening the resolution to repair these was deliberately avoided: it would make
the reconcile branch diverge from HEAD beyond what the conflict required.
