---
uid: request-6ae3512a
id: REQ-78
type: request
title: '1c aligned-crops: drift-aligned element crop pairs for the AI perceptual judge'
created_by: xgd
created_at: '2026-07-19T00:32:29.667387+00:00'
updated_at: '2026-07-24T22:27:37.610487+00:00'
completed_at: '2026-07-24T22:27:37.610487+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 47665a4fab054d935334b682226df51aba01b6cf
    reconcile_sha: null
    main_sha: null
  version: 0.0.155
---

## Goal

Automate the manual drift-aligned crop comparison (the AI's eyes for the perceptual gate). Whole-page pixel diff is corrupted by cumulative vertical drift (compares a heading vs a text field); the fix is to crop the SAME element in ref and ours, each aligned to its OWN position.

## Command

  1c aligned-crops <slug> --ref <bundleDir> [--size desktop] [--areas <text,...>] [--out <dir>]

Steps:
1. Load ref screenshot.full.png + multistate.json boxes at the viewport.
2. Render + serve ours; full-page screenshot + per-element boxes (getBoundingClientRect).
3. Pair elements by normalized text; pick anchors (heading/subheading roles, or --areas list).
4. For each anchor: crop a full-width window [anchorY..nextAnchorY] from BOTH screenshots, each using its OWN anchorY (drift removed) -> <name>-ref.png / <name>-ours.png.
5. Write index.md: per-area drift + crop paths + the value-diff deltas whose element falls in that window.

The AI then views the crop pairs + index and rules perceptible / not per the good-enough criteria (structural gate + per-aligned-element perceptual gate). Pure logic (pairing, anchor + crop-window computation) is unit-testable; browser/sharp IO is the orchestrator.

Evidence: the manual run of exactly this found the one real defect on gigabyte (card title->body gap, REQ-77) among 6 areas; the rest were sub-visual. Generalizes REQ-38 perceptual diff (drift-aligned, element-paired) — see DOC-19 / DOC-21.