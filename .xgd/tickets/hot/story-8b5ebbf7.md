---
uid: story-8b5ebbf7
id: STORY-74
type: story
title: Styled-text block-document content model with lossless authoring notation
created_by: xgd
created_at: '2026-07-13T20:59:47.725544+00:00'
updated_at: '2026-07-13T21:05:58.817916+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-d9c2e655
  capability_uid: capability-ad1670cb
  story_kind: feature
  story_points: 3
---

## Story

**As a** site author (and the capture/transcription pipeline that reads real pages), **I want** to express richly structured text — paragraphs, headings, bullet/ordered lists with nesting, blockquotes, code, and tables, with arbitrary per-run styling — as a block-document model with a compact, lossless authoring notation, **so that** structured, individually-styled text can be authored, stored, and re-read without ever losing a byte or a style delta as it moves between the document form and its markup string.

## Description

Text content is modelled as a **block-document tree**: a shared `baseline` style plus an ordered list of blocks. Block kinds are `paragraph`, `heading` (level 1–6), `list` (one kind for both bullet and ordered via an `ordered` dial, with positional ordinals and an optional `start`), `blockquote` (a container of child blocks — nested / multi-paragraph quotes), `code` (verbatim raw text with an optional language), and `table` (a 2-D grid of cells, each a container of child blocks). The tree's **inline leaves** are styled runs; a run carries its verbatim text plus only the style axes that differ from the block baseline (font family, size, weight, colour, letter-spacing, line-height, left padding), an optional link target, and optional emphasis. Because lists, blockquotes, cells, and rows all hold blocks, the structure is genuinely recursive.

Alongside the model is its **notation**: a CommonMark-flavoured markup extended with a generic attribute-span `[text]{field=value …}` whose keys are the styled-run field names. Serialization emits only self-delimiting forms and escapes any leading text that would otherwise re-parse as block structure; parsing additionally accepts ergonomic markdown shorthands (`*x*`, `**x**`, `#…###### `, `> `, `- `/`N. `) for authoring. The defining contract is the **round-trip invariant**: parsing serialized markup reproduces the normalized document, and an already-normalized document round-trips byte-exactly.

**In scope:** the model shape (all block kinds + the inline run leaf) and the lossless serialize/parse/normalize notation over the scalar run overrides plus `href` and `emphasis`.

**Out of scope:** structured run fields `gradient` and `position` (runtime-only, no notation); and the downstream workstreams that *consume* this model — schema wiring, render, capture projection, and diff pairing — which are separate capabilities.

## Technical Context

This story reconciles two source intents that build one evolving capability: REQ-54 established the block-document model and its notation (superseding an initial flat `{ baseline, runs[] }` inline model via the block pivot — no parallel model survives), and REQ-57 drained the deferred backlog of richer block kinds (heading, code, blockquote container, table, nested/multi-block list items) onto the same module and the same round-trip contract. No dual model: the paragraph-level `blockquote` flag was replaced outright by the `blockquote` container block, and list items always carry child blocks (a single-line item is one paragraph of one inherited run).

**Intent-vs-code divergence (flagged, not absorbed):** REQ-54 declared five workstreams (schema, render, capture, diff in addition to model+notation). The operator's locked scope decisions state that only **workstreams 1 & 2 — model + notation — are implemented**; the module is a standalone pure unit wired into no render/schema/capture/diff path yet ("gated on those stages existing"). Accordingly, this story's acceptance criteria assert only the observable behaviour of the notation unit — the document ⇄ markup round-trip and the block/inline forms it produces — not rendered pixels or capture output. Those downstream behaviours belong to their own future stories under the render/capture/diff capabilities.

The notation is a pure unit: no DOM, no theme, no async. The round-trip invariant is verified by a property test over 500+ seeds spanning all block kinds nested.

## Dependencies

None. (Related capabilities that will *consume* this model — object-grouped fidelity report, exact-match tolerances, typography subscales — are independent stories.)

## Story Points

3