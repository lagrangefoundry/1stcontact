---
uid: report-a5cd0ed1
id: REPORT-3853
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-11T01:35:02.154408+00:00'
updated_at: '2026-09-11T01:35:02.154408+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/request-909e42f8.md` — class **UU**, intent/bookkeeping ticket (rule **2e**), resolved as **same-fact conflict → keep the later-positioned side (HEAD)**.
  - The path is outside the sparse-checkout cone (DOC-986 §2/§4.1), so the conflict existed only in the index with no working-tree markers; resolved with `git checkout --ours` + `git add --sparse`.
  - Incoming commit `1bc13abacf` (`xgd(ticket): update request request-909e42f8`, 2026-08-31 14:54 -0700) touches one file and changes one fact vs. the merge base: the lifecycle status, `draft → free_coding`, with its two bookkeeping companions `last_field_updated: created_at → status` and `updated_at → 2026-08-31T21:54:37`. No body change.
  - HEAD (`c3a477f30c`, `seed_local_overlay`, 2026-09-09 14:35 -0700) sets the same field to `status: bundled`, `last_field_updated: status`, `updated_at: 2026-09-09T21:32:49`.
  - Same field, different values on each side, so this is a genuine per-fact conflict rather than a superset. HEAD is the later-positioned side on three independent readings that agree: commit date (Sep 9 vs Aug 31), the ticket's own `updated_at` (Sep 9 vs Aug 31), and lifecycle direction — `bundled` is downstream of `free_coding`, and HEAD's `fields.bundled_in` names `bundle-87be4669`, this very reconcile bundle. Taking incoming would regress the ticket to `free_coding` in the middle of its own bundle run.
  - `xgd working-timeline` was not invoked because it takes two intent uids and the HEAD side here is a `seed_local_overlay` commit, which is not intent-bearing; the ordering is established directly and unambiguously by the evidence above.
  - No other field or section differs in the incoming diff, so nothing from incoming is left unaccounted for.

## Incoming changes preserved

- `.xgd/tickets/hot/request-909e42f8.md` — not a code file; the incoming change is **superseded, not discarded.** The `free_coding` transition the incoming commit records did occur, and HEAD has since advanced past it: the same file on the HEAD side carries the completed results of that free-coding work — `fields.commits` (858d63202f, c056002a52), `fields.version: 0.2.22`, `fields.bundled_in: bundle-87be4669`, `status: bundled`, and the full `# What landed` implementation record. This is STEP 3's "present via a different route" case rather than the "genuinely absent" case.

No hunks were dropped under the BUG-1301 precedence exception; no test files or code files were involved.

## Note for the finalize step

The staged tree is byte-identical to HEAD (`git diff --cached --stat HEAD` is empty), because HEAD's later state already subsumes this commit's effect. This is the redundant-commit case of BUG-1109/BUG-1122. Per STEP 4 no `--skip` was issued; `CHERRY_PICK_HEAD` (1bc13abacf) is intact for `cherry_pick_finalize_resolution` to detect the clean staged diff and skip the commit.
