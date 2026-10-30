---
uid: report-bd9d149f
id: REPORT-5452
type: report
title: 'Resync resolve conflicts: 9ac98712a708888db67f8aff21f22b16bd98094e'
created_by: xgd
created_at: '2026-09-29T04:23:45.236351+00:00'
updated_at: '2026-09-29T04:23:45.236351+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

Cherry-pick in flight: `ab467d6ce3 feat(store): a ReferenceStore port, with the filesystem behind it [FREE-CODED]` (REQ-155).

- **`package.json`** — UU, config file (§2g). Scalar `version` conflict: HEAD `0.2.40` vs incoming `0.2.32`. Kept HEAD's `0.2.40`. §2g says "incoming wins" for scalars, but the incoming side here is a *stale monotonic counter*, not a competing decision — the incoming commit predates HEAD (Sep 1 vs the branch tip) and taking it would be a version downgrade, which no side intended. Rest of the file merged cleanly.

- **`tests/reconciliation-colour-census-and-retrofit.test.ts`** — DU (deleted by us, modified by incoming), §2a. Resolved by `git rm`: the HEAD-side deletion is a legitimate, documented refactor. See "Incoming changes preserved" below.

- **`tests/req93-l1-slot-mounted-behaviors.test.ts`** — UU, code file (§2c). The conflict hunk was additive-on-HEAD only: HEAD adds two fixture imports (`mobile-overflow`, `throws-on-render`) that the incoming side does not have; the incoming side contributes nothing in that hunk. Kept both HEAD imports. The incoming side's actual contribution to this file — the `fsReferenceBundle` import and its call sites — merged cleanly outside the conflict region and is present in the resolved file.

## Incoming changes preserved

- **`tests/req93-l1-slot-mounted-behaviors.test.ts`** — CONFIRMED. `import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'` at line 62, with call sites at lines 583, 584, 614, 620. All incoming hunks present.

- **`package.json`** — no incoming semantic content beyond the version scalar; nothing discarded but the downgrade.

- **`tests/reconciliation-colour-census-and-retrofit.test.ts`** — hunk DROPPED under the BUG-1301 PRECEDENCE exception.
  - HEAD-side commit that removed the target: **`b8399b2fcf` "fix(uat): retire the superseded colour-retrofit UATs and stale wording"** (Sep 10 2026), which postdates the incoming commit (`ab467d6ce3`, Sep 1 2026).
  - Why the removal is a legitimate refactor, not a resolution shortcut: `b8399b2fcf` is a documented repair of three consistency/exclusivity violations found by `report-dde93f42` (uat level, `capability-b4ac88fc`), rooted in the ac-level repair at `1a027575a4`. Its message records that this file is the pre-REQ-137 original, re-claiming AC-939…AC-947 a second time with four byte-identical test function names — so an AC→test index could not attribute them — and that its AC-944 test asserted the pixel-identity guarantee REQ-137 superseded, passing and thereby reading as evidence for a retired guarantee. `tests/reconciliation-colour-retrofit-shade-model.test.ts` is a strict superset and remains in HEAD. No test coverage is lost by the deletion; the decision was made independently and earlier, and this resolution only acknowledges it.
  - The incoming hunk's sole content for this file was adding the same `fsReferenceBundle` import and switching `writeL1`/`cmdRepro` call sites to the port — i.e. a mechanical follow-through of the REQ-155 port across a file that no longer exists. The port itself is present in HEAD (`tools/generate/src/store/fs-reference-store.ts` resolves as a blob at HEAD), so nothing of REQ-155's substance is lost.

## Net result

`git diff --cached HEAD` is empty: every non-conflicting hunk of `ab467d6ce3` is already present in HEAD (the REQ-155 work arrived by a different path — `ab467d6ce3` is not an ancestor of HEAD, but its content is), and all three conflicts resolved toward HEAD. Staging is clean with no conflict-class entries; `CHERRY_PICK_HEAD` left intact for the finalize step, which will detect the empty staged diff and skip the commit.
