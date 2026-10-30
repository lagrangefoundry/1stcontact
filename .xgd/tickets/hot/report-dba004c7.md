---
uid: report-dba004c7
id: REPORT-4777
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T19:02:52.684252+00:00'
updated_at: '2026-09-21T19:02:52.684252+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-6893f6ea.md` (REQ-158) — **UU**, intent/bookkeeping ticket (`request-*`), rule **2e** + the auto-enriched metadata rule ("intent unknown on one or both sides; take the more recent commit by timestamp and flag for post-merge review"). Incoming commit `3325664f` (2026-09-01 12:35:38), titled `xgd(ticket): update request request-6893f6ea`.

  The incoming commit carried two kinds of change:

  1. **A large body reflow** — markdown line-unwrapping, renumbering of "What is missing" items 3–6 → 1–4, the byte-size table flattened to paragraphs, and the strikethrough removed from the first open question.
  2. **A frontmatter bump** — `updated_at` 19:35:35 → 19:35:38, `last_field_updated` `status` → `body`, `status` unchanged at `free_coded`.

  **The body reflow is not in conflict and is fully present.** `git diff HEAD 3325664f -- <path>` shows the two sides differ in frontmatter *only*; the entire body is byte-identical. HEAD already carries the reflowed text (via the 2026-09-11 `seed_local_overlay`), which is why git raised no body hunks — the incoming body content matched HEAD exactly.

  **Only the frontmatter block conflicted**, and there the two sides set the same fields differently — a genuine per-fact collision, resolved per fact in favour of the later-positioned intent:

  | fact | HEAD (`c94654a3` seed_local_overlay, 2026-09-11) | incoming (`3325664f`, 2026-09-01) | taken |
  |---|---|---|---|
  | `updated_at` | `2026-09-09T21:32:50` | `2026-09-01T19:35:38` | HEAD |
  | `last_field_updated` | `status` | `body` | HEAD |
  | `status` | `bundled` | `free_coded` | HEAD |

  On `last_field_updated` specifically: this scalar names the most recent field edit on the composed record. The incoming value `body` correctly describes *its own* 09-01 reflow, but that reflow is no longer the latest edit once HEAD's 09-09 status transition is layered on top — so `status` is the accurate value for the merged state, and `body` would assert something false about it.

  Corroboration on `status`: `xgd ticket get request-6893f6ea` reports the authoritative state as `Status: bundled`, and the *unconflicted* part of the same frontmatter carries `bundled_in: bundle-87be4669` (a field the incoming side lacks entirely). Taking `free_coded` would have regressed the status while leaving `bundled_in` populated — an internally inconsistent record.

  **Flagged for post-merge review** per the metadata rule, though the `bundled_in` asymmetry makes the direction unambiguous.

## Incoming changes preserved

No code/implementation files were in conflict, so STEP 3's incoming-code verification does not apply, and the BUG-1301 precedence exception was not invoked. No UAT test function on either side was deleted.

The incoming commit's substantive content contribution — the body reflow — is **present in full** in the resolved file, verified by direct diff showing HEAD and `3325664f` have identical bodies.

The three incoming frontmatter facts not carried forward (`updated_at` 09-01, `last_field_updated: body`, `status: free_coded`) were dropped under 2e's per-fact timeline rule, not discarded as inconvenient: each is an eight-day-older value of a field the branch has since advanced past, and `status: free_coded` directly contradicts the `bundled_in: bundle-87be4669` sitting unconflicted in the same block.

## Staging state

Because the body was already identical and HEAD won every contested frontmatter fact, the resolution is byte-identical to HEAD and the staged diff against HEAD is empty. `git status --porcelain` is clean, zero conflict markers remain, and `CHERRY_PICK_HEAD` is intact — this cherry-pick is now empty and the finalize step will skip the commit. No `--continue`/`--skip`/`--quit`/`--abort` was issued.
