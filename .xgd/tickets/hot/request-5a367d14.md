---
uid: request-5a367d14
id: REQ-77
type: request
title: 'services-grid card: zero body outer margin so title->body gap isn''t doubled'
created_by: xgd
created_at: '2026-07-19T00:13:32.893050+00:00'
updated_at: '2026-07-24T22:27:35.803439+00:00'
completed_at: '2026-07-24T22:27:35.803439+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 10dbed3dc7320739a80cadb5d83259f7b1e1426a
    reconcile_sha: null
    main_sha: null
  version: 0.0.154
---

## Problem

A services-grid card is flex-column with gap: var(--space-3) (12px) — matching the reference's 12px card title->body gap. But the card body is rendered markdown (<p>), whose default block margin ADDS on top of the flex gap, so title->body renders ~28px in ours vs 12px in the reference. Systematic across all cards (Presence, Sanctum Voice, XGD, What We're Exploring: ref 12-16 -> ours 28-31). Visible as looser cards in aligned crops.

## Fix

Zero the card body's OUTER block margins so the flex gap is the sole title->body spacer (inter-paragraph margins within a multi-para body are preserved):
  .services-grid__card-body > :global(:first-child) { margin-top: 0 }
  .services-grid__card-body > :global(:last-child) { margin-bottom: 0 }

Bug fix, not a dial — the gap token already matches; the extra p margin was erroneous.