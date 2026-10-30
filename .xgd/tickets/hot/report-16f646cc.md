---
uid: report-16f646cc
id: REPORT-4774
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T18:57:45.655443+00:00'
updated_at: '2026-09-21T18:57:45.655443+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` — **UU, intent/bookkeeping ticket (§2e)**, outside the sparse-checkout cone (DOC-986 §2/§4.1), resolved with `git checkout --ours` + `git add --sparse`.

  Three conflict hunks, all resolved to the HEAD side:

  1. **Frontmatter.** HEAD `updated_at: 2026-09-09T21:32:50Z`, `status: bundled`, `bundled_in: bundle-87be4669`. Incoming `updated_at: 2026-09-01T19:34:09Z`, `status: ready_to_reconcile`, no `bundled_in`. Same fields changed differently on both sides → genuine conflict, later-positioned intent wins per fact. Taking incoming would have rewound the ticket past its own bundling and dropped the `bundled_in` key.

  2. **"3. The size argument needs restating…" section.** Same facts on both sides; HEAD is the xgd-CLI-serialized rendering of the same prose.

  3. **"A second blocker … Node's `fetch` ignores `HTTPS_PROXY`" section.** Same — and the paragraphs that appear only inside the incoming side of this hunk ("The cause is proxy handling…", "This is an environment artefact…", "Q2 — generated, not committed") are present verbatim in HEAD immediately below the conflict block, so `--ours` loses nothing and `--theirs` would have duplicated them.

  Both the enrichment rule ("take the more recent commit by timestamp") and §2e's superset rule select the same side: HEAD's commit `c94654a3` (`seed_local_overlay`, 2026-09-09 14:35:22 -0700) postdates incoming `d14bb298` (2026-09-01 12:34:09 -0700).

## Incoming changes preserved

Confirmed. This is a bookkeeping ticket, not a code file, but the incoming content was verified present rather than assumed:

- `git diff --no-index --word-diff --ignore-all-space` between index stage 2 (HEAD) and stage 3 (incoming) shows **no prose present on the incoming side that HEAD lacks**. Every paragraph `d14bb298` adds — the measured bundle-size analysis (1052 KiB baseline, 288 KiB gzip `kb.js`, 78%-vectors argument, 3.6× headroom), the `NODE_USE_ENV_PROXY=1` blocker, and the Q2 "generated, not committed" answer — is already in HEAD.
- The apparent conflict is serialization drift from the xgd CLI's markdown round-trip, not divergent content: paragraphs unwrapped to single lines, the pipe table flattened to one cell per line, `_em_` → `*em*`, `` **`x`** `` → `` `x` ``, ordered-list renumbering.
- **No BUG-1301 precedence exception was invoked**; no hunk was dropped on the grounds that its target had been removed. Nothing was deleted.

## Flagged for post-merge review

Per the enrichment rule's "flag this file for post-merge review":

- HEAD's CLI round-trip (pre-existing on this branch, not introduced by this resolution) lost some rendering fidelity relative to the incoming text: the §3 markdown table is flattened into an unreadable cell-per-line run, the `~` approximation qualifiers were stripped (`~223 KiB` → `223 KiB`, `~78%` → `78%`, `~6×` → `6×`, `~2.7 MiB` → `2.7 MiB`), and a `~~strikethrough~~` in "Open questions" was dropped. Semantics are unchanged; this is a serializer-fidelity issue worth a separate look, not a merge defect.
- The staged result is byte-identical to HEAD, so this cherry-pick produces an empty commit. Expected — the working branch had already absorbed this edit. Left for Python's finalize step to skip; `--skip` was not called here.
