---
uid: comment-3d422f9d
id: COMMENT-3034
type: comment
title: Comment on bug BUG-102
created_by: xgd
created_at: '2026-09-17T21:36:39.023282+00:00'
updated_at: '2026-09-17T21:49:39.053971+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-c35f573f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e0a7c203-d695-4725-8a5d-3ba723d79c7d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b52b2592-e069-44b6-a192-e109d7878e6e-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:36:01.215088+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="b52b2592-e069-44b6-a192-e109d7878e6e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T21:44:02.478541+00:00" -->
#### Claude
Findings — no code changed.

## The reported symptom is real, and the stored artifacts confirm it

`storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-{1,2}/diff/values-diff.json` both carry exactly the same two deltas, including:

```
§0  section  contentAnchor  bottom (0.66) → center (0.50)   LOW  sev 1040
```

Identical in both iterations — a frozen row, which is itself the tell.

## But the root cause is worse than the ticket says

The ticket hypothesises an *ordinal offset*: 8 reference sections against 6 reproduction bands, so `§n` lands on the wrong band. The reproduction side does not have 6 sections. **It has exactly one.**

`SectionValues` on the actual side comes from `flattenSignals(signals.bands)`, and `signals.bands` is built in `extract.ts:1493` from the **direct children of `<body>`** with painted extent ≥ 8px. `render.ts:3444` emits one root element (`emitNode(doc.root …)`) inside `<body>`. So an L1 reproduction has one band root, whose `paintedExtent` is the whole document. The `section-band-*` nodes the ticket lists are *grandchildren* — never band roots.

I confirmed this by running the real `EXTRACT_SCRIPT` under jsdom over an L1-shaped DOM (one relative wrapper, absolutely-positioned band boxes and text as siblings):

```
L1-shaped DOM -> bands: 1
[{ box: { x: 0, y: 0, width: 1280, height: 1900 }, anchor: 0.33, overlay: null }]
```

This is the same DOM-shape problem BUG-15 hit for elements, one level up — and `tests/bug15-values-diff-l1-flat-dom.test.ts` documents exactly that shape.

**The stored evidence favours this over the ordinal hypothesis.** If the repro really had 6 bands offset by one, reference `§1` (the hero, `overlay {#030717, 0.3}`) would have been compared against the cream band at y 800, and an `overlay` delta would be in the report. There is no overlay delta in either iteration. Under "repro has 1 section", `§1…§7` hit `if (!as) continue` at `values-diff.ts:2592` and are silently skipped — which is what the file shows.

So, precisely:

- The **only** section-level comparison ever made against an L1 reproduction is reference `§0` vs the whole-page wrapper.
- `overlay`, `contentAnchor` and `textAlign` are **dead axes** for `§1…§n` — not mispaired, unevaluated.
- The one delta produced is a false positive by construction: the reference's 192px absolutely-positioned header (anchor 0.66) against a document-spanning wrapper whose content centroid is ~0.50. `|0.66 − 0.50| = 0.16` clears `anchorTol` 0.15 (`values-diff.ts:1988`) by 0.01.

Consequence for the loop: this row can never be fixed by changing the reproduction, and it reappears every round — the gate's `reproduction-wrong` work list carries a permanently unactionable item. It does not flip a verdict (deltas are only consulted after a perceptual breach, `gate-core.ts:323`), but it burns rounds.

## What this means for the proposed fix

Joining by geometry removes the false positive, but **restores no signal**: with one repro band, 7 of 8 reference sections become "unpaired", i.e. 7 findings per page that report nothing but the segmentation asymmetry. That is louder noise than the single false delta it replaces.

Two levels to choose between:

**(a) Honest join only.** Pair by largest vertical overlap; when the actual side has a single body-spanning band, emit one "section values not comparable on a flat L1 render" diagnostic rather than N unpaired rows. Needs an ordinal fallback when boxes are absent — `SectionValues.box` is optional and several fixtures (`tests/req31-values-diff.test.ts:251+`) build sections without one. Cheap; kills the false positive; section fidelity stays unmeasured.

**(b) Give the reproduction real bands.** Derive the repro's section list geometrically from painted full-bleed backdrops — `backdropBoxes()` (`extract.ts:572`) already finds exactly the `section-band-*` / `section-bg-0` boxes, but currently emits them as *fields*, not bands. This is the structural fix, and it is not small: `overlayOf` (`extract.ts:1080`) and `anchorRatioOf` (`extract.ts:1110`) both walk **DOM descendants**, and in a flat L1 tree the scrim and the text runs are *siblings* of the band box — both would need the geometric, containment-by-box treatment that REQ-88/BUG-20 already built for per-run surfaces.

My read: (a) is the bug fix, (b) is a separate request. (a) alone is defensible — `contentAnchor` is already documented as a coarse proxy superseded by per-element `position` (`KIND_RANK` comment, `values-diff.ts:1198`) — but `overlay` is not covered elsewhere, so under (a) a missing hero scrim stays invisible to values-diff.

## Two smaller things confirmed

- **`objects` has no section entries** — 59 cards, roles `action/body/heading/link/subheading/textbox` only. `buildObjectCard` takes a `ValueElement`; a `SectionValues` card needs its own builder and an `ObjectKind` (`'text' | 'image' | 'control' | 'divider'`) to sit in.
- **`SectionValues.box`'s doc comment is stale** (`values-diff.ts:256`): it says "Present iff `backgroundImageUrl` is", but REQ-88 made both `flattenCapture` and `flattenSignals` carry it unconditionally. Worth correcting since a geometry join depends on it.

## One scope note

The same collapse can hit the **reference** side: BUG-27's own comment describes page-builder sites "where the whole page is one wrapper and the visually distinct panels are nested `<section>`s". So section segmentation agrees only when both sides are conventional semantic pages — and an L1 reproduction never is.

Probe script left at `.xgd/tmp/bug102_probe.mjs` (tree is clean; nothing tracked changed).

How far do you want to take this — (a), (b), or (a) now with (b) as a separate ticket?

<!-- xgd-turn id="2540b36d-820c-4151-86f3-b92af4520393-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:49:38.685978+00:00" -->
#### You
Lets go with a please

<!-- xgd-chat-end -->