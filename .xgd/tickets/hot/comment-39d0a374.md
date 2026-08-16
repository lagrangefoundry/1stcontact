---
uid: comment-39d0a374
id: COMMENT-1099
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-16T09:28:54.191262+00:00'
updated_at: '2026-08-16T09:28:54.191262+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-4d9be4ea
  kind: note
---

**REPORT-2100** (`report-4d9be4ea`) — **FAIL**: 2 violations, 1 warning, 0 needs_review.

## Intent ledger

Reconstructed from AC creation windows, because STORY-99's `updated_by` is a scalar holding only the latest updater and ACs carry no `intent_uid`. Counting: **BUNDLE-16** (REQ-115 + REQ-117 + REQ-44), **BUG-32** (scope rename), **REQ-119** (request-time render), **BUG-33** (toolbar control lifetime). Not counting: **REQ-145** and **REQ-147** (`draft`), **REQ-112** (`abandoned`).

The primary staleness hypothesis was disconfirmed. REQ-145 would delete the proxy and move the render into workerd, which would retire STORY-99's whole "the origin runs outside the edge Worker, and that is deliberate and temporary" section — but it is `draft` and blocked behind five dependencies. That section, and REQ-119's declared AC-1 deviation, are both still current.

## The two violations

One drift with one cause. The capability body draws a careful line: this capability owns *that bytes and operations are reachable over this origin*; the editing and write-path capabilities own *what they mean*. STORY-99 was written against REQ-115's origin and never grew the two seams REQ-117 later added to that same origin:

1. **`/framework/edit-client.js`** — the capability scopes "served from the same source the renderer is built from, so the two cannot drift" to itself. The story's single-origin enumeration lists only the workspace document, components, its own browser code and the channels. No AC covers it; the property is proven only under the editing capability's AC-1006.
2. **`/api/copy` as a semantics-free transport** — the capability scopes it here explicitly, including that a refusal arrives in the write path's own terms (400 carrying the validator's `code`/`path`/`hint`). The story names publish and the store listing as the origin's operations, never the copy transport. Proven only under the editing capability's AC-999.

Within this capability both routes appear only as rows in AC-977's non-cacheable sweep — incidental, not the claim. Either resolution works and the editor should pick one deliberately: add the two seams here as reachability-only ACs, or delete the clauses from the capability body and let editing own them whole. Doing both would duplicate AC-1006/AC-999.

The warning is the mechanism that hid this: AC-964's verbatim-forwarding evidence enumerates the same four routes the story body does, so the story's incomplete list and its evidence agree with each other and neither notices the omission.

## Two things worth your attention beyond the report

`xgd ticket comments` is not in this session's allowlist, so BUG-32's operator dialogue was unreadable. That matters for one item: AC-1030's working-tree anchoring is described at length in the story but is *not* in BUG-32's "What changed" list, though it was created inside BUG-32's active window and serves its anti-silent-green goal. I classified it `info` rather than `needs_review` — the behaviour is unambiguously active and nothing retires it, so failing the level on it would have been over-reading. If its provenance is ever disputed, BUG-32's comments are where it settles.

I also verified the story's "divergence noted, in commentary only" against current code rather than taking it on trust — `toolbar.js:100` does still read "on every mode change" while line 101 subscribes to both `mode` and `site`. The story records that accurately.
