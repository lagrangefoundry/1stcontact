---
uid: request-bc4c1408
id: REQ-90
type: request
title: L1 document-level resource table (font/image handle→substance) + renderer @font-face
  wiring
created_by: xgd
created_at: '2026-07-23T02:01:41.218807+00:00'
updated_at: '2026-07-23T04:41:26.579397+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 6cf5f4888d841953b624597430d18ba0a0df133c
    reconcile_sha: null
    main_sha: null
  version: 0.0.176
---

Scope under [[request-7ff1bacd]] (REQ-88). Closes the **form hole** in the L1
language — see [[DOC-27]] (handle vs substance), [[DOC-23]] (L1 substrate),
[[DOC-2]] (security). Sequence: after [[bug-5b7153d2]] (B1), part of "language
first".

## Behavior (request)
L1 holds *handles* — `text.axes.fontFamily` (a name), `image.src` (a URL) — but
has no place to bind a handle to its pixel-determining *substance* (the `.woff2`
glyph outlines, the mirrored image bytes). Result: `fontFamily: "Poppins"` renders
as a serif fallback because nothing serves/links the font file. This is a
structural gap, not a missing scalar.

## Scope
- Add a **document-level resource table** to the L1 schema: font faces
  (`family, weight, style → served asset`) and image/media assets.
- Renderer (packages/framework/src/l1/render.ts) emits `@font-face` rules binding
  family→served `.woff2`, through the existing safe sink (URL-scheme allowlist,
  served-asset only — no remote fetch, no raw url()).
- Capture already provides the inputs: `RawFontFace { family, srcUrls, weight }`
  and `fontLoaded` (tools/generate/src/cli/capture/extract.ts:174, :75).
- Fold + repro populate the table and mirror the assets (cmdRepro already copies
  bundle assets; wire them here).

## Design rule
An entry earns its place iff it moves a pixel (DOC-27). Validate against a real
webfont from the gigabytealchemy/joyful captures.

## Acceptance
A captured custom-font site reproduces with the correct face (no serif fallback);
`pixel-render(local) ~~ pixel-render(target)` on glyph shape at sampled widths.
Tests named `test_UAT_FC_<this-ticket>_*`.



## Implementation (free-coded — commit 6cf5f4888d84, v0.0.176)
Closed the form hole: L1 now carries a document-level `resources.fonts` table
(family → served `src`, optional weight/style), the renderer emits `@font-face`
rules through the sole safe sink (name-sanitised family, `isSafeUrl`+escaped url,
derived `format()`, `font-display: swap`), the envelope scheme-checks each font
`src` and bounds its weight, and the fold populates the table from the capture's
mirrored faces — keeping only families a text leaf actually paints. Capture wires
the bundle's theme font substance into the fold. UATs: schema/envelope/render/fold
+ a Chromium end-to-end (joyful Oswald webfont) proving the bound face loads and
paints at a different glyph width than the fallback.