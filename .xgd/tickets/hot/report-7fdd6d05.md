---
uid: report-7fdd6d05
id: REPORT-2439
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (ac) — attempt 8'
created_by: xgd
created_at: '2026-08-20T12:50:26.880908+00:00'
updated_at: '2026-08-20T12:50:26.880908+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: ac
  fixes_applied: 8
  progress_made: true
  needs_more_work: true
  violations_remaining: 3
  anchor_report_uid: report-2485c83c
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (ac)

**Attempt**: 8
**Fixes applied this call**: 8
**Violations remaining**: 3 (findings 3, 5 — and 5 may warrant two ACs)
**Needs more work**: true

Worked the report's own suggested order: the two multi-finding `ac-edit`s first (they
close both consistency defects at once), then the four single-AC coverage gaps, then one
of the three substantial ones (finding 6). Findings 3 and 5 — the viewport-height probe
and the recovered content column — are held for the next iteration; 5 is the 200-line,
two-paragraph block the report flags as possibly needing two ACs, and both deserve a
fresh read of `fold.ts:249-256 / :335-540 / :1576-1688` rather than being rushed in
behind six other mutations.

Every AC written below was checked against shipped code before authoring, not just
against the story body — file:line cited per row.

## Actions Taken — by Resolution Category

| # | Category | Element | Findings closed | Action |
|---|---|---|---|---|
| 1 | ac-edit | AC-731 (acceptance_criterion-6a5e0eec) | 8, 9 | Replaced the backing-box geometry clause: the box now **adopts the captured surface-bearing rect** (`fold.ts:1654-1666`) instead of "the run's geometry", with the **band guard** (`:1892-1896`), the **accent-bearer fallback** and its no-fill-only precedence (`:1898-1916`), the **radius-follows-resolved-surface** corollary (`:1917-1921`) and the rect as **exact grouping identity** with proximity arbitrating only unresolved rows (`:1610-1631`). Added the **full-bleed bar** as a second band-seeding path with the dominant-gap discriminator and the majority-rule-first ordering (`:1384-1434`, `:2059-2071`). Verification extended for all six. |
| 2 | ac-edit | AC-705 (acceptance_criterion-330b48e4) | 10, 11, 12 | Report shape is now **three channels, of which two grade**: added the `mounted` channel — oracle *text* whose box centre falls inside a slot rect, diverted only where no leaf paired, counted and surfaced, never graded, verdict stays residuals+unmatched (`probes.ts:574-584, 621, 628-636, 656, 704-711`). Added the **synthesized-surface exclusion** from the non-text queue (`probes.ts:671-684`) and the **width-ladder-only oracle** dedup on `(width, state)` (`probes.ts:526-540`). Three verification blocks added. |
| 3 | ac-edit | AC-736 (acceptance_criterion-76d9ee68) | 13 (warning) | Extended the slot clause so the **horizontal-clip retention is asserted for the inert placeholder slot as it is for the painted surface** — both are exempt from the overlap check only (`probes.ts:450-458` clips every leaf regardless of kind; `:468-474` exempts only from overlap). Verification adds an over-wide slot. |
| 4 | ac-add | AC-1345 (acceptance_criterion-4d1802d9) | 1 | **Translucent scrim.** A section folds when it paints an image **or** a scrim; the scrim rides on the same box as the background image; each axis is read from the widest width carrying **it** (`fold.ts:1246-1252`, `:1260`, `:1281-1288`). |
| 5 | ac-add | AC-1346 (acceptance_criterion-2f46402b) | 2 | **Per-side padding as a folded axis** — carried on text/image/box leaves, all-zero emits no axis (`fold.ts:542-565`), plus the per-width track for a varying side, written as the mirror of the numeric-type-axis rule (`fold.ts:644-670` mirroring `:613-642`). Authored as a new AC rather than widening AC-691, whose title scopes it to geometry keyframes. |
| 6 | ac-add | AC-1347 (acceptance_criterion-0e12e8aa) | 4 | **No-wrap threshold** derived from the reference's own measured line count, taken as a **suffix** of the ladder, with unmeasurable breaking the suffix rather than reading as one line, and no axis where the run always wrapped (`fold.ts:209-240`, `:1842-1844`). |
| 7 | ac-add | AC-1348 (acceptance_criterion-ca0d19f1) | 7 | **Capture-derived behavioural config** with the complete six-item enumeration (field list, label, label placement from the a11y name source, type with the height fallback, endpoint, submit wording) and the **derivation-gap channel** distinct from the typed element residual (`forms.ts:46-105`, `:208-257`). |
| 8 | ac-add | AC-1349 (acceptance_criterion-2ffbebad) | 6 | **Materialization into a servable site**: `1c repro <slug> --ref <bundle>` mounts the seams onto the folded document, localizes every media handle, **fails outright** on an unmirrored handle, reports a mirrored-but-unreferenced asset as a **fold gap** (distinct from the gate's reference-coverage proxy), and is **idempotent** (`assets.ts:22-113`, `repro.ts:127-140`, `:181-204`, `cli/index.ts:565-571`). |

All five new ACs were created under `story-8acc338d` (STORY-84) with
`kind=behavior`, `uat_coverage=fail`, and promoted from the create-time `pending`
status to `active` to match every other AC in the capability.

## Code Edits (if any)

None this call. Consistent with the validation report's own note — nothing here is a
`code-issue`; every behaviour was located in shipped code before being written up as a
matrix gap.

## UAT Note

The five new ACs carry `uat_coverage=fail` by design: this is level=ac, and the level=uat
phase is where their tests are authored. Their **Verification** sections were written as
concrete, executable test plans (fixture shape, the discriminating assertion, and the
counter-case that would fail without the rule) so the uat phase has a specification rather
than a restatement of the criterion.

## Remaining Violations (plan for next iteration)

| Finding | Element | Plan |
|---|---|---|
| 3 | STORY-84 — viewport-height probe pair + measured height response | One AC: selected ladder widths re-shot at a second viewport height; the pair folds to `{yFactor, heightFactor}` on geometry; keyframe ladder skips the probe; a band takes its response from its **section edges** and a reconstructed card from its **representative row**; a response indistinguishable from zero emits no axis. Code: `fold.ts:242-256`, `:1576-1578`, `:1687-1688`, `:1814`. |
| 5 | STORY-84 — recovered centred content column + column-anchored geometry | Likely **two** ACs, as the report suggests: (a) the fit itself — container, inset and content cap fitted to reproduce every sampled origin, modal-left-edge origin, rejected unless all samples fit; (b) per-axis anchoring with its three refusal rules — left edge and extent fitted independently, nested cap only on an over-determined fit at a plausible share, keyframed residual inset inheriting the node's `segments` where the offset has no closed form, and the full-bleed refusal. Code: `fold.ts:335-540`. |

## needs_review Items Forwarded

None. Every finding in `report-af76ac2a` carried an explicit resolution category and
traced to an **In scope** clause in a story body that passed its own alignment check one
cycle ago; nothing was ambiguous enough to escalate.
