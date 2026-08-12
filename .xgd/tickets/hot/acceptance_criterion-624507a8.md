---
uid: acceptance_criterion-624507a8
id: AC-1115
type: acceptance_criterion
title: A handle whose bytes will not load keeps a named, selectable tile behind a
  placeholder frame
created_by: xgd
created_at: '2026-08-12T16:24:02.534342+00:00'
updated_at: '2026-08-12T16:24:02.534342+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

A handle whose bytes this origin cannot serve **keeps its tile**. When the
thumbnail fails to arrive, the tile stays where it was and at the size of its
neighbours: the file name still labels it, a placeholder stands in for the
picture so it reads as an image that did not load rather than as an empty tile,
and it remains selectable and remains selected if it was.

This is not cosmetic tolerance. The handle a region currently holds is **always**
among its options and may name bytes this origin cannot produce — an off-site
address the page could not mirror, a registry entry with no file behind it. A tile
that vanished with its picture would take with it the only way for that region to
keep the image it already has, and an operator who opened the dialog to change
the alt text would find the image gone.

## Verification

Open the picker over a region whose current handle names bytes this origin does
not serve. Assert its tile is present, labelled with the image's file name, and is
the selected option. Simulate the thumbnail failing to load and assert the tile is
still present, still labelled with the same file name, marked as an image that
could not be loaded rather than left blank, and still selected. Assert the region
can still be saved holding that handle.
