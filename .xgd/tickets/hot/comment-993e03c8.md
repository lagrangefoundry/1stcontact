---
uid: comment-993e03c8
id: COMMENT-2366
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-09-09T23:13:23.190759+00:00'
updated_at: '2026-09-09T23:13:23.190759+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f56df596
  kind: note
---

Cluster 5 resolved: **both stories confirmed in place, no ticket changes.**

**The finding:** these aren't two routes to the same behaviour — they're two different granularities, and the boundary is already declared in both directions.

- **STORY-100 → CAP-86** (Structured Copy Editing) — a **change map of named fields** over an *editable region*: words, type-setting, a palette reference, a closed image pick, bounded framing percentages. Nothing structural is reachable. Its body contains zero references to the element tree, the closed element vocabulary, or the control surface; all 43 ACs are field derivation, closed pickers, bounded parameters, refusal shape.
- **STORY-106 → CAP-93** (Page Authoring Through The Control Surface) — a **map / verbatim read / whole-subtree replace** over an *element*. Add and remove are expressed as replacing a group with one holding a child more or fewer. All 12 ACs are the map, the unresolved read, subtree replacement, closed-vocabulary refusal.

**The "two AI routes" concern is already closed by STORY-106 itself.** Its body states the narrower copy-field pair *"retires from this surface rather than living alongside its successor,"* and AC-1092 asserts the surface offers exactly one way to change what's on a page. The field surface survives for the operator's click-to-edit form and the CLI — a different caller, not a second AI route. Symmetrically, CAP-93's out-of-scope names CAP-86/CAP-87 as unchanged and required to keep working, and STORY-100's out-of-scope hands stylisation off with "The AI addresses them directly."

The shared element is the write path, and CAP-86 owns it uncontested — STORY-106 records that it reaches the same validated all-or-nothing path and that **no new validation was written**. The structured-only security invariant appears in both (AC-991 vs AC-1089) because STORY-106 documents it as a deliberate *relocation* from "no operation accepts markup" to "the element vocabulary is closed" — two mechanisms, two surfaces, each needing its own evidence.

I checked AC-1093/AC-1094 (CAP-93 ACs that exercise the operator's click-to-edit form) and deliberately left them: they're STORY-106's non-regression obligation for widening the reach, and STORY-100 predates assistant-composed elements, so reparenting would attach an obligation it never carried.

One thing I flagged in the report rather than actioned, since a confirm forbids content edits: STORY-100 still frames itself as "the same path the AI uses" and asks "could the AI have produced this exact edit through its own tool surface?" Post-STORY-106 that describes history — the shared *write path* claim holds, the shared *tool surface* claim doesn't. Wording staleness inside one story, not a boundary defect.

Report created: **REPORT-3573** (`report-f56df596`), `cluster_id: "5"` verified as a string in the stored JSON.
