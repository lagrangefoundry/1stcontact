---
uid: acceptance_criterion-60683857
id: AC-970
type: acceptance_criterion
title: The toolbar renders exactly the controls the active mode declares, and re-derives
  them whenever the displayed mode or site changes
created_by: xgd
created_at: '2026-08-07T01:44:36.665871+00:00'
updated_at: '2026-08-10T11:18:35.693247+00:00'
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

At any moment the toolbar shows exactly the controls named by the currently
active mode — no more and no fewer — and it re-derives that set whenever what
the pane is displaying changes: a mode change *or* a site change replaces the
strip's contents with the set the active mode names. The strip itself persists
through a re-derivation; only the controls within it are replaced, so the
toolbar keeps its place in the layout.

Every control is built against the state current at that moment — the mode now
active and the site now displayed — so a control whose content depends on the
site (the site selector's own shown value) reflects the site on screen whatever
changed it: choosing it in the selector, restoring the workspace from its
remembered state, or a change made programmatically. Asking for the mode or
site already displayed changes nothing and re-derives nothing.

A mode that names no document-oriented control does not get one, so the strip
never assumes a document is displayed beneath it, and a mode naming a control
that does not exist is reported rather than rendered as a partial strip.

## Verification

Register two modes declaring different control sets, mount, and assert the
rendered control ids equal the active mode's declared list. Switch modes and
assert the rendered ids equal the second mode's list.

Then change the site and assert both halves of the wider trigger: that the
strip's controls are fresh instances rather than the ones held before the change
(compare captured element identity, so a strip that merely looks the same cannot
pass), and that the site selector's shown value is the site now displayed.
Repeat for a site change made without touching the selector — restoring from
remembered state, and a programmatic change — so the trigger is not read as "the
selector updated itself". Ask for the site already displayed and assert the
controls are the same instances, so the trigger is a change and not every call.

Register a mode naming a control that does not exist and assert the workspace
reports it rather than rendering a partial strip.
