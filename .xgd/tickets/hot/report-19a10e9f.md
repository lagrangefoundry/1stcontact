---
uid: report-19a10e9f
id: REPORT-3112
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-22'
created_by: xgd
created_at: '2026-08-31T22:33:08.931291+00:00'
updated_at: '2026-08-31T22:33:08.931291+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-22
---

## Files resolved

- `.xgd/tickets/hot/doc-4866a486.md` (DOC-13, "Reference Capture Model") — class **AA** (both added). Rule **2b**: incoming side is a strict superset, so the superset was kept (`git checkout --theirs` + `git add --sparse`). This also agrees with the enrichment metadata's tie-break rule (both sides are `xgd(ticket): update doc doc-4866a486` with unknown intent → take the more recent commit by timestamp): incoming `b629bf6a` is 2026-08-26 16:40:17 -0700, ours `bd33ffbd` is 2026-08-15 18:21:10 -0700.

## Incoming changes preserved

Verified by content hash, not by eye: after resolution the working-tree file hashes to `a24f8536a74e52648f5bc55c8af58dc95b0d7bb7`, which is byte-identical to the incoming (stage-3) blob. No conflict markers remain and the index has no unmerged entries.

A full `git diff` of ours vs. theirs confirmed the superset relationship before staging: 101 insertions, 3 deletions, and the only ours-side lines absent from theirs are the two frontmatter scalars that the incoming edit legitimately supersedes (`updated_at: 2026-08-16T01:21:09` → `2026-08-26T23:40:17`, `last_field_updated: system_kb` → `body`). No ours-side prose was dropped. The third deletion is the §10 bullet "The CF Browser Rendering driver (Playwright first)", which theirs rewrites in place as a strikethrough plus "Landed in REQ-154 — see §6.1–6.3, §8" — a replacement, not a loss.

The incoming commit's substantive additions are all present in the resolved file:
- §6.1 "The cloud has the same eyes, and Access is why it nearly did not (REQ-154)" — the in-process origin-resolver decision, the per-HOST rule, and the three recorded-and-rejected alternatives.
- §6.2 "One session, many contexts" — `withBrowserSession` one-browser-per-run leasing, fresh context per driver, one-driver-one-navigation, bounded lease.
- §6.3 "What the CF driver does not do" — `actuate`/`canActuate` absent, rest-only cloud captures.
- §8 addendum "Half of this has landed (REQ-154)" — `cf-driver.ts`, the `capture/screenshot.ts` split, and the two deliberately-open items (R2 bytes, no HTTP route).
- §10 strikethrough of the now-landed CF driver deferral.

No hunks were dropped; the BUG-1301 precedence exception was not invoked. No code, test, or UAT files were involved in this conflict.
