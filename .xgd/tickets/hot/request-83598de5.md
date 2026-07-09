---
uid: request-83598de5
id: REQ-46
type: request
title: 'Renderer hardening: fail loud on dangerous content (unsafe URL schemes / injection)'
created_by: xgd
created_at: '2026-07-06T18:48:44.667679+00:00'
updated_at: '2026-07-09T23:59:26.869239+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 8064f06445b1d9cd270117e495a8f2dfd8478e2f
    reconcile_sha: null
    main_sha: null
  version: 0.0.47
  bundled_in: bundle-df065afc
---

## Goal

Make the render/validate path **fail loudly** on dangerous content instead of
silently rendering it. Today content-field values flow through modules to raw
sinks (`href`/`src`/`action` interpolation, markdown-link URLs, `set:html`) with
**no injection or URL-scheme enforcement** — neither the content validator
(`packages/framework/src/modules/validate.ts`, which checks structure only) nor
the markdown renderer (`markdown.ts`, which explicitly punts: *"Raw HTML … is the
validator's concern, not this renderer's"*) rejects it. The gap is proven by the
[[REQ-40]] security conformance dimension, which flags real modules today.

## Why

The product thesis is untrusted content (AI-/customer-supplied text and URLs), so
the module is the sanitization boundary. A permissive renderer that silently
emits `<a href="javascript:…">` or an off-allowlist request is a live injection
vector. Failing **loudly** (not silently neutralizing) is deliberate: the AI
author must *see the error and adjust* the content it generated, rather than have
a scheme quietly stripped behind its back.

## Enforcement contract (decided with operator, see [[REQ-40]])

- **URL fields (`url` type, and href/src/action inside `object`/`asset-ref`
  content):** reject at the validator (fail-closed / load-time). A scheme outside
  the safe allowlist (`http`, `https`, `mailto`, `tel`, relative, `#`,
  `data:image/*` for images only) is invalid config → hard error, not a render.
- **Inline content (`string`/`markdown`):** raw HTML stays escaped/inert (remark
  already drops dangerous HTML); markdown-link URLs get the same scheme rejection
  as URL fields (they are currently *not* filtered — a live vector through
  `set:html`).
- **CSS context:** no content value may reach an inline `style=` (dials only feed
  style; content must never). A content value in a style context is an error.
- **Errors are loud:** a distinct, actionable validation error naming the field
  and the offending value — surfaced to the generating AI (per the failure/error
  taxonomy: this is a recoverable *failure*, fixable by regenerating content).

## Scope / behaviour

Extend `validateModuleContent` (and/or the render path) so that:
- URL-bearing content fields are scheme-checked and rejected when unsafe.
- Markdown-link URLs are scheme-checked (rehype pass or post-render scan).
- A clear `ContentValidationError` names field + value + reason.

## Dependencies
[[REQ-40]] (security conformance dimension — the detector whose real-module
failures motivate and validate this work; its gap-demonstration test flips to the
inert/rejected outcome once this lands).

## UATs (`test_UAT_FC_<THIS-TICKET>_*`)
- `_javascript_href_rejected` — a `cta.href` of `javascript:…` on a real module
  fails validation with a clear error (was: rendered live).
- `_data_html_url_rejected` — a `data:text/html,…` URL is rejected.
- `_markdown_link_scheme_rejected` — `[x](javascript:…)` in a markdown field is
  rejected/neutralized (currently reaches `set:html` unfiltered).
- `_safe_urls_pass` — ordinary `https`/relative/`mailto`/`#` URLs pass unchanged.
- `_real_module_passes_security_dimension` — after hardening, running the
  [[REQ-40]] `security` dimension against a real module with injected payloads
  passes (the REQ-40 gap-demonstration expectation inverts).

## Out of scope
The detector itself (that is [[REQ-40]]); dependency/supply-chain scanning; auth.

## Notes
Framework/production code → full free-coding ceremony. When this lands, update the
[[REQ-40]] gap-demonstration UAT (currently asserts the real module is *flagged*)
to assert it now *passes / is rejected at load*.


## Confirmed finding (from [[REQ-40]] detector, 2026-07-06)

Two live vectors were confirmed by running the REQ-40 `security` dimension against
real catalog modules:

1. **Unsafe URL scheme** — `hero` with a `javascript:` CTA href / markdown link
   renders `<a href="javascript:…">` straight through (`security.url-scheme`).
2. **Inline HTML executes** — a raw `<script>` in a `text-block` **markdown**
   `body` field is passed verbatim into the static HTML and **executes on load**
   (parser-inserted script). Confirmed: the execution sentinel fired
   (`security.script`). The renderer uses markdown *with raw-HTML passthrough*, so
   `markdown.ts`'s "raw HTML is the validator's concern" comment is load-bearing —
   and the validator does not close it.

So hardening must cover **both** URL-scheme rejection **and** raw-HTML handling in
markdown fields (strip/escape, or reject at load). The two REQ-40 gap-demonstration
UATs (`_real_module_leaks_unsafe_url_today`, `_real_module_executes_injected_script_today`)
are the acceptance tripwires: they assert the modules are *flagged* today and must
be flipped to *passes* when this ticket lands.


## Tripwire mechanism (updated 2026-07-06)

The [[REQ-40]] gap tests are now **expected-fail (`it.fails`)** assertions of the
*secure* contract, not "flagged today" assertions:

- `test_UAT_FC_REQ-40_real_module_rejects_unsafe_url` — hero + `javascript:`
  payload must render inert / be rejected.
- `test_UAT_FC_REQ-40_real_module_renders_injected_script_inert` — a raw
  `<script>` in a `text-block` markdown body must not execute.

Both **fail today** (that failure is the gap) and are marked `it.fails`, so the
REQ-40 suite is green (`5 passed | 2 expected fail`). When this ticket's hardening
lands and the renderer enforces, these bodies start passing → `it.fails` flips to
a hard RED failure → convert each `itBGap(...)` to a plain `itB(...)`. That flip is
the acceptance signal that REQ-46 closed the gap.


## Acceptance spec now exists and is RED (2026-07-06)

The failing acceptance tests for this ticket live in
`tests/req46-renderer-hardening.test.ts` and are **RED until this ticket is
implemented** (by operator direction — a real failing test, not an xfail):

- `test_UAT_FC_REQ-46_real_module_rejects_unsafe_url` — FAILS (hero emits live
  `javascript:` hrefs → `security.url-scheme`).
- `test_UAT_FC_REQ-46_real_module_renders_injected_script_inert` — FAILS (raw
  `<script>` in a markdown body executes on load → `security.script`).

Implement the enforcement (reject unsafe URL schemes at the validator; strip/escape
raw HTML in markdown, or reject at load), then these two turn GREEN — that is the
done signal. The [[REQ-40]] security dimension is the detector they run through;
its own suite is all green and unaffected.



## Implementation — as built (2026-07-06)

Enforcement is unified to **reject / fail-loud** everywhere (operator direction:
"make the renderer reject anything that is unsafe … fail loudly so the AI can be
aware and adjust"). This **refines the earlier "Enforcement contract"** above in
two ways learned from the [[REQ-40]] detector and the code:

1. **Inline HTML is *rejected*, not neutralized.** The earlier note assumed
   "remark already drops dangerous HTML" — the REQ-40 detector proved it does
   **not** (a raw `<script>` in a markdown body executes). So raw dangerous HTML
   in markdown is a hard error, consistent with URL rejection — nothing is
   silently stripped.
2. **Enforcement lives in the render layer, not the structural validator.** The
   URL sinks that leak (`hero.cta.href`, `services-grid.item.cta.href`,
   `asset-ref.src`, nav `url` targets) are **not** all declared `type:'url'` in
   their metas (`cta` is an untyped `object`), so a validator scheme-check keyed
   on field type would miss them. The renderer is the single complete boundary
   where every URL/HTML value actually materializes, and it is the boundary the
   operator named. (`validateModuleContent` is also not currently wired into the
   load path, so the validator is not the live gate today.)

### What is "unsafe" (single-sourced, matches the [[REQ-40]] probe)

`packages/framework/src/modules/safety.ts` (new) is the one definition of unsafe,
mirroring the harness `SECURITY_PROBE`:
- **Unsafe URL scheme** — any scheme not in `{http, https, mailto, tel}`, except
  relative / `#hash` / no-scheme (safe) and `data:image/*` (safe for image `src`
  only). `javascript:`, `vbscript:`, `data:text/html`, `file:`, … are unsafe.
- **Dangerous HTML** — a `<script>` / `<iframe>` / `<object>` / `<embed>` tag, an
  inline `on*=` event handler, or an `href`/`src`/`action`/`formaction` carrying
  an unsafe scheme.

Exports: `class ContentSafetyError extends Error`, `isUnsafeUrl(url)`,
`assertSafeUrl(url, context)` (returns the url or throws `ContentSafetyError`),
`assertSafeHtml(html, context)` (returns the html or throws). Errors are loud and
name the field/context and the offending value.

### Production changes (framework render path)

- **`safety.ts`** — the module above.
- **`markdown.ts`** — `renderMarkdown` runs its produced HTML through
  `assertSafeHtml` before returning, so every `set:html` markdown sink
  (hero/services-grid/contact-form/text-block subheads, bodies, captions) rejects
  raw script/handler/unsafe-scheme-link content. The load-bearing "raw HTML is
  the validator's concern" comment is removed — the renderer now owns it.
- **`nav.ts`** — `navHref` routes a `kind:'url'` target through `assertSafeUrl`
  (header/footer nav links).
- **Module components** — every raw href/src/action sink wraps its value in
  `assertSafeUrl`: `hero` (`cta.href`, `image.src`), `services-grid`
  (`item.cta.href`, `item.icon.src`), `contact-form` (`action`), `header`/`footer`
  (`logo.src`). A dangerous value throws at render (`renderSite`) → the build
  fails loudly, surfacing the field + value to the generating AI.

**No live CSS-breakout vector exists** in real modules: every inline `style=`
(`hero.subheadStyle`, `headingGradient`) is framework-computed from **enum dials**
(closed sets), never from free content — so there is nothing to reject there. The
[[REQ-40]] `security.css-breakout` check stays green on real modules and is proven
by the REQ-40 fixture self-test.

### Harness extension ([[REQ-40]], `tools/generate/src/conformance`)

A module that **refuses** to emit unsafe content is *conformant*. `assertModuleConforms`
(security dimension) now treats a `ContentSafetyError` thrown while serving a
fixture as a **safe rejection** — the fixture passes with no violation instead of
crashing the run (`serveOneModulePage` rethrows it as identifiable; the harness
catches it). Benign/clean fixtures must still *render* (not reject); that
false-positive guard is the `_clean_content_passes` self-test plus direct
framework unit tests on `assertSafeUrl` / `renderMarkdown`.

### Tests — "every aspect of unsafe"

- **Framework unit tests** (`tests/req46-content-safety.test.ts`, new): parameterized
  over every scheme and HTML vector — `assertSafeUrl` rejects
  `javascript:`/`vbscript:`/`data:text/html`/`file:` and accepts
  `http`/`https`/`mailto`/`tel`/relative/`#`/`data:image/*`; `renderMarkdown`
  rejects `<script>`, `<iframe>`, `<img onerror>`, `[x](javascript:)`,
  `![x](javascript:)` and accepts clean prose, safe links, and safe images.
- **Harness acceptance** (`tests/req46-renderer-hardening.test.ts`, was RED →
  now GREEN): a real `hero` / `text-block` given schema-derived injection content
  conforms to the security dimension (rejected, no violation). Extended to also
  cover `services-grid` and `contact-form`.
- **[[REQ-40]] suite** is unaffected (its self-tests use injected fixture modules,
  not the real render path) and stays green.