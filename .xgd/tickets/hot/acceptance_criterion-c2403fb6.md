---
uid: acceptance_criterion-c2403fb6
id: AC-2086
type: acceptance_criterion
title: A captured reference states how many files it holds in place of the single-file
  field, and its download link returns the screenshot
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T02:17:14.750915+00:00'
updated_at: '2026-11-01T12:15:13.495995+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

A captured reference's record does **not** show the single-file *File* field — a capture has no
one filename — and every other row of the read-only record is still shown. In its place the pane
says plainly how many files the capture holds: *"N files captured"*, or *"1 file captured"* for
one. The count is the number of named members the capture holds, and it appears once the
material's detail has been read; until then, and when no member names are known, the line is
empty rather than stating a number.

The capture's download link fetches the **screenshot**: it points at the screenshot member by
name, it is labelled with the screenshot's name, and it saves under the screenshot's name — not
under the capture's title, and not as whichever member would come back first.

Ordinary single-file material is unaffected: its record keeps the *File* field, it shows no file
count, and its download link names no member and saves under its original filename.

## Verification

Select a capture holding a known number of named members, including its screenshot. Observe that
the record has no *File* row while its other rows (kind, role, origin, rights, may-appear,
*Placed on*, fetched-from) remain; that once the detail loads the pane reads "<N> files captured"
for that number (and "1 file captured" for a one-member capture); and that the download link
addresses the screenshot member, is labelled and saved under the screenshot's name, and returns
the screenshot's bytes. Before the detail loads, observe the count line empty. Select an ordinary
single-file material and observe the *File* row present, no count line, and a download link with
no member that saves under the original filename.

> Corrected in reconcile fix-plan iteration 2 (story-1500b111): the placement row is labelled
> *Placed on* since REQ-181 (in scope, later) relabelled it from *Used on*.
