---
uid: acceptance_criterion-6fb2bebc
id: AC-966
type: acceptance_criterion
title: The display panel's ordinary mode displays the selected site's own rendering,
  not a stand-in
created_by: xgd
created_at: '2026-08-07T01:44:18.770079+00:00'
updated_at: '2026-09-10T09:49:32.257562+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

With a site selected and the display panel in its ordinary viewing mode, the
pane displays that site's own rendering — the document the platform's renderer
produces from that site's stored definition — and not a placeholder, a starter
template, or a stand-in for a site that has not been chosen.

What this criterion owns is the binding itself: whatever site is selected, the
ordinary mode's pane is showing *that* site, from the real rendering path. It
deliberately says nothing about how those bytes came to exist. Whether a channel
is rendered ahead of time or produced on request is not this criterion's
concern — the draft-side channels are produced on request and there is no
rendered artifact for the workspace to serve (AC-1031) — and the equality of
what the origin serves with what the render command writes is AC-1032's claim,
made over both draft-side channels and every artifact a channel contains,
including the per-site stylesheet. Which sites the selector offers, and that
choosing another one changes the displayed document, is AC-967's; that an
editable mode is registered and composes with the chosen site is AC-1029's.

## Verification

With a known site in the store, mount the workspace with that site selected and
the ordinary mode active, and assert the pane's displayed document is that
site's own rendering under that site's channel address — carrying content drawn
from that site's stored definition, a string present in the definition and in no
starter or placeholder, so a pane wired to a stand-in would fail the assertion.

Do not assert byte-equality against a rendered file on disk: that claim is
AC-1032's, and asserting it here would require a pre-rendered artifact whose
absence AC-1031 exists to guarantee.
