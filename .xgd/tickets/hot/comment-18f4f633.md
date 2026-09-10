---
uid: comment-18f4f633
id: COMMENT-2546
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T14:50:25.973639+00:00'
updated_at: '2026-09-10T14:50:25.973639+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-645376b9
  kind: note
---

**Result: PASS** — REPORT-3747 (`report-645376b9`), 0 violations / 0 warnings / 0 needs_review.

## What I checked

CAP-71 holds two `upgrade` stories — STORY-84 (fold, 24 ACs) and STORY-86 (3-probe gate, 17 ACs) — both Capability-Matrix kinds expected to carry ACs. I rebuilt the intent ledger from a fresh 216-ticket census, re-derived coverage clause-by-clause from both stories' "In scope" lists, and re-verified every code claim in this worktree rather than inheriting it from the prior reports.

## The previous cycle's seven findings are all closed

| Prior finding | Status |
|---|---|
| **v1** — STORY-86's third envelope violation (pinned-box content overflow) uncovered, **5th raise** since 2026-08-05 | Closed by **AC-1630**, with AC-706/AC-707 amended so the tree isn't self-contradictory |
| **v2** — REQ-88's derived nowrap threshold uncovered | Closed by **AC-1631**; all three derivation rules match `fold.ts:215-240` |
| **v3** — AC-731's page-base rule contradicted AC-812 and the code, **4 cycles** | Closed — AC-731 now states greatest-total-band-height across bands *and* backdrops, delegating to AC-812 |
| **w4 + w5** — AC-710 stale/duplicative vs AC-705, 4th raise | Closed by one edit narrowing AC-710 to the envelope-finding contract |
| **w6** — AC-729/AC-733 both owned the source-less media case, 3rd raise | Closed — AC-729 narrowed to the foldable case, cross-referencing AC-733 |
| **w7** — BUG-19's full-bleed bar rule unexpressed | Closed in AC-731 **plus** the companion STORY-84 body edit |

The two long-running items ended because the AC edit and its companion story-body edit landed together — that omission is precisely what carried v3/w7 through four cycles.

## Verification highlights

- `probes.ts:405-417` — the `clip` finding fires on `contentHeight > pinnedH + epsilon`; a node pinning no height returns content height and can't raise it, matching AC-1630's negative case.
- `fold.ts:1785`/`:1825` — `framed` is width-ascending by construction, which is what makes AC-1631's "narrowest sampled width" verification correct (not assumed).
- `fold.ts:623-674` — `keyframes.length < 2 || every(k => k.value === keyframes[0].value)` is exactly AC-1625's "≥2 widths carry it AND values not all equal".
- `fold.ts:2105-2146` — page base by band height over bands and backdrops, run-count fallback, canvas last resort, as AC-731 now states.

## Five infos recorded, none actionable at this level

Most notable: **AC-736**'s backing-surface overlap exclusion is broader than the code (which excludes only fold-synthesized `section-band-*`/`section-bg-*`/`card-*`, not captured `box-*`). It's faithful to STORY-86's body, so under the level cascade it's story-level drift — third consecutive cycle recorded as info. Its *Verification* is correct as written, so a UAT built from that will pass; only one built from the criterion's literal wording would fail.

Also flagged: the STORY-84 body edit landed at 14:41, after the story-level check passed at 14:30. I read the current body in full — it's internally consistent and consistent with AC-731/AC-812 — so it doesn't disturb this level's working reference, but the sequencing is noted.
