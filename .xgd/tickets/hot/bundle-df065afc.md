---
uid: bundle-df065afc
id: BUNDLE-4
type: bundle
title: REQ-45 + REQ-39 + REQ-40 + REQ-46 + REQ-47 + 1 more
created_by: xgd
created_at: '2026-07-09T23:59:26.312625+00:00'
updated_at: '2026-07-09T23:59:49.609051+00:00'
completed_at: null
last_field_updated: status
status: reconciling
fields:
  commits:
  - working_sha: 111d3c5924e54c56f3ae8f8c3d49bc1f16142e65
    reconcile_sha: null
    main_sha: null
  - working_sha: a96677a7ecf66bf3c482678df92ac89bf13d53af
    reconcile_sha: null
    main_sha: null
  - working_sha: 0a3e029ca8214f874f669ef83be23e673efb84bb
    reconcile_sha: null
    main_sha: null
  - working_sha: a7ef810b9d62a2a8aff53fdcbff24e15256430fc
    reconcile_sha: null
    main_sha: null
  - working_sha: e83ed32102190b41f8cc952a962dc111bd9136b3
    reconcile_sha: null
    main_sha: null
  - working_sha: bb2414aa7462b9e860097cee9cdeb9813d2f9529
    reconcile_sha: null
    main_sha: null
  - working_sha: 8064f06445b1d9cd270117e495a8f2dfd8478e2f
    reconcile_sha: null
    main_sha: null
  - working_sha: df5732b5d72ad409328665bd01f57141e03e85a6
    reconcile_sha: null
    main_sha: null
  - working_sha: 0805f9c758553b2fb8a29d2a2a40529f0198ca83
    reconcile_sha: null
    main_sha: null
  - working_sha: def150456ad3ea0536ca3ef6cc8c21a00ad39591
    reconcile_sha: null
    main_sha: null
  - working_sha: b73ecc634b7e43d2dc4eed5cc66adac4a4692df7
    reconcile_sha: null
    main_sha: null
  - working_sha: a8eae22bd96f322e757fcb41da9a23ff3898bb58
    reconcile_sha: null
    main_sha: null
  - working_sha: 78d20cedb88121d635cdce69527914b051090c10
    reconcile_sha: null
    main_sha: null
  - working_sha: 29e80bc5b835c2196853868f8ad78a6980061d93
    reconcile_sha: null
    main_sha: null
  - working_sha: b63e9e815299387fe4616cd75e8bc815e3eb626c
    reconcile_sha: null
    main_sha: null
  - working_sha: 6ef4c9a96f52821ba78c05687503999078560941
    reconcile_sha: null
    main_sha: null
  - working_sha: a0d7e63d0ac2f91534ea8c526ef7856225428485
    reconcile_sha: null
    main_sha: null
  - working_sha: afb8f2593f572a8124a07649bb382e7f5f0db60b
    reconcile_sha: null
    main_sha: null
  - working_sha: 2a2a7ba8973221250a6b44d35abe14e9a66aea87
    reconcile_sha: null
    main_sha: null
  - working_sha: 22446c3a8dea55fc8ff0af3c407142775531cff3
    reconcile_sha: null
    main_sha: null
  auto_merge_back: true
  priority: medium
---

# Bundle

This ticket bundles the following source tickets:


---

## REQ-45: Framework last-mile fidelity primitives surfaced by the gigabytealchemy perceptual diff (left-aligned column, heading/wordmark tracking, hero subhead line-height, submit-label foreground, form subhead/caption size)

## Scope

Generic, reusable **framework capabilities** the gigabytealchemy repro needs to close the *last mile* of fidelity but cannot yet express. Surfaced *by* — not scoped *to* — the import: each applies to any site. Successor to [[REQ-32]] (which closed gradient / scrim / anchor / cool-neutral); this ticket covers the primitives the **perceptual diff** ([[REQ-38]] `1c diff`) and the **values-diff** ([[REQ-31]]) flag after config is exhausted.

**Explicitly out of scope: site-specific values.** Exact tracking (−1.8 / −0.9), exact line-heights, the exact white button label, exact column width — those are *config* under the site milestone [[REQ-20]] and are already flagged mechanically by the values-diff. This ticket is only the missing **expressiveness**.

## Evidence (config ceiling reached)

At the current config ceiling the gates read **perceptual mean 19.12 / 255** (12 regions) and **12 values-diff deltas**. Every remaining delta is framework-level, not config:
- Hero fold anchor is a no-op (content already exceeds the fold — no empty band to anchor into).
- Wordmark size already matches (72px) and the gradient stops are an exact match; residual heat is tracking + weight.
- The dominant perceptual heat (regions #1/#2/#3/#5 — the Building/mission blocks and the footer strip) is **cumulative vertical drift**: our centered 72rem column is wider than the reference's left-aligned column, so text wraps into fewer lines and the page runs ~90px short.

## Capabilities

1. **Left/start-aligned constrained content column** *(dominant — fixes the vertical drift lighting up 6+ regions).* Today a narrower container (`narrow`/`default`/`wide`) is always **centered**, so constraining the column shifts it inward, away from the page's left gutter — which is why narrowing regressed the diff. Add a **start-aligned** option so a section can carry a narrower content max-width that stays pinned to the left gutter (aligned with the header/hero content edge). Reference content is a ~896px column left-aligned at the gutter; ours is a centered 1152px column. Matching width + alignment makes the paragraphs wrap identically and the page height converge. *(Driver: gigabytealchemy body column; generalizes the container/section, no new module.)*

2. **Structured letter-spacing (tracking) on hero heading + header wordmark.** Both are currently hardcoded to `0`; the reference uses tight tracking (wordmark −1.8 `tracking-tight`, hero heading −0.9). Add a token-backed `tracking` treatment (closed enum → em) on the hero heading and the header wordmark. *(Value is config; this is the knob.)*

3. **Hero subhead line-height control.** The hero subhead line-height is hardcoded (`--line-height-relaxed`); the reference reads a tighter value. Expose the subhead line-height as a dial/treatment so it can be set independently of the global relaxed token.

4. **Contact-form submit label foreground.** The submit button label inherits a surface tint (renders cream `#e8dfd3`/`#f7f4ee`) where the reference is a legible on-primary **white**. Generalize `submitTreatment` to carry a proper foreground role rather than deriving the label color from the surface. *(Value config; the gap is that a legible foreground can't be expressed.)*

5. **Contact-form subhead / caption size.** The form subhead ("Join our mailing list…") and small captions ("More to come…") are fixed at one size; the reference varies them (18 / 14). Add a size dial on the contact-form subhead (and the caption slot) so these can be set per the reference.

## Notes

- Bundled per the "fewer, generic tickets" preference; each is a small primitive. Split only if one grows.
- Capability 1 is the high-leverage item — it collapses the cumulative vertical drift that dominates the perceptual heat. Capabilities 2–5 are localized typography/color fidelity.
- Reusable across all sites and the future builder; gates [[REQ-20]] / [[REQ-21]] fidelity. The runbook [[DOC-19]] points here for "known still-missing capabilities."

## Implementation note

Implement each by **generalizing the existing module/primitive**, not by adding a new one (CLAUDE.md "Generalize Modules Before Adding New Ones"): (1) start-aligned column → a container/section alignment option; (2) tracking → hero-heading + wordmark treatment; (3) subhead line-height → hero dial; (4) submit foreground → generalize `submitTreatment`; (5) subhead/caption size → contact-form dials. No new modules expected. All token-backed, `.strict()` preserved, no raw CSS reaching the page.

## Acceptance

- A section can render a **start-aligned narrower column** pinned to the left gutter; the gigabytealchemy body column matches the reference's width + left edge, and the perceptual mean drops (vertical drift regions collapse) — measured via `1c diff` as the guardrail.
- Hero heading + wordmark can carry token-backed `tracking`; hero subhead line-height is settable; contact-form submit label can render a legible on-primary foreground; contact-form subhead/caption size is settable.
- `test_UAT_FC_<TICKET>_*` cover each capability's emitted custom property / class, with default fallback unchanged when the dial is absent.


## Implementation (delivered — commit 111d3c5, v0.0.41)

All five capabilities landed as generalizations of existing modules (no new modules), token-backed, `.strict()` preserved, each dial defaulting to prior behaviour so a site that omits it is unchanged:

1. **Start-aligned content column** — `contentWidth` dial (`default`/`narrow`/`wide`) on **text-block** and **services-grid**. Caps the content *within* the section's full-width frame; the flex cross-start pins a narrow column to the left gutter (the header/hero content edge). `default` fills the frame → unchanged fallback.
2. **Tracking** — `tracking` dial (`normal`/`tight`/`tighter`) on the **hero heading** and **header wordmark**, backed by new `--tracking-*` typography tokens (`0 / -0.025em / -0.05em`). `normal` emits no override, so a display wordmark keeps its font-face tracking.
3. **Hero subhead line-height** — `subheadLeading` dial (`tight`/`normal`/`relaxed`) on the hero, mapped to `--line-height-*`. `relaxed` preserves the prior value.
4. **Submit-label foreground** — `submitForeground` dial (`auto` + palette roles incl. `bg`) on **contact-form**; paints the label a framework-computed `var(--color-<role>)` (e.g. `bg` = legible white) instead of inheriting a surface tint. `auto` keeps the treatment's colour.
5. **Contact-form subhead / caption size** — `subheadSize` + `captionSize` dials and a `caption` markdown content slot.

Token surface: +3 `--tracking-*` custom properties. The `tracking` typography-token group uses a schema `.default()` so themes predating it keep validating while the resolved type stays required.

**Tests:** `tests/req45-fidelity-primitives.test.ts` (19 UATs, `test_UAT_FC_REQ-45_*`) — each capability's emitted class/inline-property + the unchanged default; plus the `--tracking-*` token emission. The REQ-4 token-count UATs were updated 61→64 for the new tokens. Full suite green except two **pre-existing** REQ-20 failures (`framework-content-modules` card-count, broken by REQ-20's `card-size-*` class in ef43bea — confirmed failing at HEAD independent of this work).

**Guardrail note:** per the ticket's own out-of-scope clause, the gigabytealchemy site JSON was **not** modified here — wiring these dials with the exact site values (56rem column, −1.8/−0.9 tracking, white label, 18/14 sizes) and re-measuring `1c diff` is REQ-20 config.


## Follow-up (commit a96677a, v0.0.42)

Fixed the two `framework-content-modules` card-count UATs that were failing at HEAD: REQ-20's per-card `card-size-*` class made the card attribute `class="services-grid__card card-size-md …"`, breaking their exact `class="services-grid__card"` match. Now matched by the leading class token. **Full suite green (268 passed, 0 failed).** Folded into REQ-45 per operator direction ("if you break it, you fix it, in this ticket").


---

## REQ-39: Conformance harness core: assertModuleConforms + one-module isolation + fast safety checks + negative-fixture self-tests (Chromium)

## Goal

Build the **conformance harness core** — the `assertModuleConforms()` seam, the one-module isolation/render model, the **fast safety checks** (Chromium), and the **negative-fixture self-test suite** that proves the harness actually discriminates. This is the foundation every other conformance component depends on, and the discriminator that must be proven *before* any per-module leaf is allowed to delegate to it. Architecture: [[DOC-20]].

## Why first

Per [[DOC-20]] "Who tests the harness": if module leaves delegate to a buggy harness, 4×M leaves become rubber-stamps — the model-grading-its-own-homework failure mechanized at scale. So the harness's *own* correctness (via negative fixtures) is the gating deliverable, not an afterthought.

## Scope / behaviour

`assertModuleConforms(slug, fixtures, opts)` — the single call every thin leaf makes (interface below in [[DOC-20]]). Throws (fails the UAT) on any non-excepted violation.
- **Isolation model:** render a *one-module page* through the existing catalog-driven renderer, serve it over loopback (the same seam as `1c shot` / `values-diff`, [[REQ-13]]), drive with Playwright (already a dep).
- **`tier: 'fast'` (default), Chromium only.** Viewports default to a small set (e.g. desktop + one mobile).
- **Safety dimension checks:** no console/page errors, no unhandled rejections, no failed requests; `scrollWidth ≤ viewport.width` (no horizontal overflow); no expected-content container collapsed to 0; text not clipped.
- **`except` option:** an AC id list a fixture legitimately opts out of (declared + reasoned) — the exemption mechanism.
- **Negative-fixture self-tests:** deliberately-broken fixture modules the harness **MUST** flag red, plus a clean one it must pass. This is the proof-of-discrimination.
- Determinism: wait for fonts + network-idle, freeze animation (`prefers-reduced-motion`), before asserting.

## Dependencies
[[REQ-13]] (`1c shot` render+serve+screenshot seam), catalog-driven renderer ([[REQ-9]]). Playwright + sharp already declared.

## UATs (`test_UAT_FC_<TICKET-ID>_*`)
- `_clean_module_passes` — a well-formed fixture passes with no violations (no false positive).
- `_overflow_fixture_flagged` — a module that overflows horizontally is flagged red.
- `_console_error_fixture_flagged` — a module that throws a console/page error is flagged red.
- `_collapsed_container_flagged` — a module whose expected-content band collapses to 0 height is flagged red.
- `_except_suppresses_declared_ac` — a fixture that declares an exemption for an AC is not failed on that AC.
- `_isolation_renders_single_module` — the harness mounts exactly one module through the catalog renderer and serves it over loopback.

## Out of scope
Security fuzzing, responsive viewport axis, cross-browser engines, the module-contract template/stamp — each its own component REQ.

## Notes
Framework/test-infra **code** → full free-coding ceremony. The negative fixtures are test-infrastructure (Philosophy story-type), not shipping modules.

## Design decisions (session, REQ-39)

Confirmed with operator before coding:

1. **Console/page-error capture → extend the `BrowserDriver` seam.** The seam currently exposes `navigate/screenshot/query/responses/content` but records no console errors, `pageerror`, or unhandled rejections. Add capture of these events during `navigate()` so the CF-swap abstraction stays intact (nothing above the seam holds a raw Playwright page). `responses()` statuses already cover 'no failed requests'.

2. **One-module isolation → on-disk one-module site in a dedicated, isolated temp sandbox** (chosen for debuggability on failure). The harness `mkdtemp`s its **own** store root under the OS temp dir — never `storage/` and never the real `storage/sandbox/` — scaffolds a one-module site there, and drives the existing `cmdRender` + `startServe` seam against it via the `cwd` store context. `cli/fidelity.ts` (values-diff) is the structural template.

3. **CRITICAL — no site-data pollution.** Because the harness renders/serves only under its own `mkdtemp` root, it is structurally impossible to write into a real site. Lifecycle: **clean up the temp root on success; preserve it on failure** and log its path + the served HTML path so the exact page an assertion saw can be reopened.

## Design decision 3 (session, REQ-39) — where the harness lives + the resolver seam

- **Location:** harness lives in `tools/generate/src/conformance/`, NOT `packages/framework` (DOC-20 said 'e.g. framework/…' — illustrative). The render/serve/driver seams it composes all live in `tools/generate`, which depends on `packages/framework`, not the reverse; putting the harness in framework would invert that dependency.
- **Injectable module resolver:** the negative broken modules must render through the *same* catalog renderer (DOC-20), but they are not in the shipping registry and a console/page error cannot be provoked through content props on a real static module. So `renderSite` gains an optional `resolveModule` (default = framework `getModule`) + `extraCss`; the harness self-tests inject a tiny test-only registry of deliberately-broken `.astro` modules. Additive, default-unchanged — a generalization of the renderer, not a new module.
- **Viewport plumbing:** `BrowserDriver.navigate(url, viewport?)` gains an optional viewport (fast tier runs safety checks at desktop + one mobile, per scope) and a `diagnostics()` accessor (console errors / page errors / failed requests captured during load). Existing driver fakes updated for the new method.


---

## REQ-40: Conformance harness: security dimension (content-injection inert + no egress)

## Goal

Add the **security dimension** to the conformance harness ([[REQ-39]] core): treat every module as the sanitization boundary for untrusted content, and prove it renders injection-inert and makes no unexpected network egress. Architecture: [[DOC-20]].

## Why

For a site *builder* the threat model is content injection: AI/customer-supplied text, URLs, and markdown flow through modules. Even though pre-prod the operator (trusted) authors content, the product thesis is untrusted content — so the module *is* the boundary. This is a universal module-contract AC (AC-M2 in [[DOC-20]]).

## Scope / behaviour

`assertModuleConforms(slug, fixtures, { dimension: 'security' })`:
- **Injection fuzzing:** for each content field the schema exposes, mount a payload set (`<script>`, `"><img onerror=…>`, `javascript:` / `data:` URLs, markdown-embedded HTML) → assert it renders **inert**: no script execution, escaped text, no unsafe `href`/`src` scheme.
- **No CSS breakout:** no content value reaches an inline `style=` in a way that can break out (e.g. a colour of `red;}body{display:none`).
- **No unexpected egress:** the rendered module issues no network request outside an asset allowlist (same-origin assets + declared fonts).
- Payloads derived generically from the module's schema content fields (not hand-listed per module).

## Dependencies
[[REQ-39]] (harness core seam + isolation + negative-fixture framework).

## UATs (`test_UAT_FC_<TICKET-ID>_*`)
- `_script_payload_rendered_inert` — a `<script>` in a content field does not execute and is escaped.
- `_unsafe_url_scheme_rejected` — a `javascript:` href/src is neutralized.
- `_css_breakout_blocked` — a content value cannot escape an inline style context.
- `_unexpected_egress_flagged` — a fixture module that fetches an off-allowlist URL is flagged red.
- `_clean_content_passes` — ordinary content passes (no false positive).

## Out of scope
Dependency/supply-chain scanning; auth; anything beyond content-injection + egress at render time.

## Notes
Framework/test-infra code → full free-coding ceremony. Adds security negative fixtures to the [[REQ-39]] self-test set.


## Scope decision (operator, 2026-07-06)

**Enforcement contract** — for the payloads this dimension mounts: unsafe **URL
schemes** are *rejected* (fail-closed) and inline **content** stays *escaped/inert*
(remark already drops dangerous HTML); a content value must never reach an inline
`style=`. See the full contract in the hardening ticket [[REQ-46]].

**This ticket = the detector, not the fix.** REQ-40 delivers:
1. The `security` conformance **dimension** (checks + generic schema-derived
   payloads) and its **negative-fixture self-tests** (`test_UAT_FC_REQ-40_*`,
   green) — proof the discriminator flags script/handler, unsafe URL scheme, CSS
   breakout, and off-allowlist egress, and passes clean content.
2. A **gap demonstration**: pointing the dimension at a *real* configured module
   with an injected `javascript:` URL flags it today — proving the render path is
   unenforced. This is the evidence that motivates [[REQ-46]].

**Split out to [[REQ-46]]:** the actual renderer/validator hardening that makes
real modules pass (fail loudly on dangerous content). When REQ-46 lands, the
gap-demonstration UAT here flips from "flagged" to "rejected/inert".


---

## REQ-46: Renderer hardening: fail loud on dangerous content (unsafe URL schemes / injection)

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


---

## REQ-47: Fidelity-diff: severity-ranked structural diff over a richer rendered projection (geometry/containment/arrangement), not pixel area

## Scope

Make the fidelity-diff pipeline surface the differences that **actually matter to the eye** — structure, position, containment, arrangement, shape — instead of ranking by pixel area, which we proved is a bad proxy for importance. Surfaced by the gigabytealchemy import ([[REQ-20]]): three glaring, visually-obvious defects (hero paragraph block ~200px out of position; contact-form fields rendered as labels-above vs the reference's placeholders-inside; Subscribe button stacked-below vs the reference's inline-right) were **missed or actively deprioritised** by the current tools and by the operator-in-the-loop, because:

- the **values-diff** ([[REQ-31]]) only compares a thin slice of scalar properties (colour, font-size, line-height, padding) and is blind to geometry, structure, and arrangement;
- the **perceptual-diff** ([[REQ-38]]) ranks regions by `intensity × area`, so a small element that is 100% structurally wrong (the form) sorts *below* a large element that is mildly wrong in tone — and pixel count does not track eye-importance (a small image shift yields big pixel heat but is barely visible; rounded-vs-square corners are visually obvious but tiny in pixels).

This ticket is a **framework/tooling** change (successor to the fidelity tools [[REQ-31]] / [[REQ-38]]), not site config. It is the "close the loop" work that [[REQ-20]] repeatedly bounced off.

## Key principle — we diff the *rendered projection*, never the DOM

Their page and our reproduction have **completely different DOM trees** (their Tailwind/hand-HTML vs our Astro modules). Two pixel-identical pages can have arbitrarily different DOMs, so a DOM-tree diff is noise. The tools already avoid this: they compare a **normalised projection of the computed render** — text + `getComputedStyle`/`getBoundingClientRect` results — joined on **text** (verbatim between site and repro, so a near-perfect join key). Computed style + geometry is exactly the layer where two different DOMs that render identically become identical.

**Every captured field MUST be expressed in rendered / geometric / a11y terms, never in CSS-mechanism terms.** (E.g. capture "button box is right-of vs below the input box", NOT `flex-direction: row|column` — mechanism differs between frameworks; rendered result does not.)

## A — richer rendered projection (the capture is the contract)

Extend the capture/extract ([[REQ-12]] / [[REQ-31]] manifest) to record, per rendered element (not just per section — today only the 8 section boxes carry geometry; individual headings/paragraphs/inputs/buttons carry none):

1. **Geometry** — `box: {x, y, width, height}` from `getBoundingClientRect`, per element. (The harness already does this for sections; descend it to elements — same call.)
2. **Shape** — computed `border-radius`, `border-width/style`, `box-shadow` (rendered values, whatever CSS produced them).
3. **Structure / a11y** — element role and **accessible-name source** from the accessibility tree, e.g. `{role: "textbox", name: "Your email address", nameSource: "placeholder" | "label" | "aria"}`. The a11y tree is the browser's own framework-agnostic semantic projection — the right normalisation target for structural facts geometry can't see.

**Two hard cases to design explicitly:**
- **Text-free elements** (input box, image, divider, icon) have no text join key → pair on `role + order-within-section` or asset id. Fuzzier; this is the main false-positive source (acceptable — see B).
- **Placeholder-inside vs label-above** is not geometry or text-value; it is `nameSource` (a11y) + the relative geometry of the name vs the field box.

## B — categorise + prioritise the A↔A diff (severity, not area)

A pure function of A's output — no pixels, no heuristics:

1. Tag every delta with a **kind** (derivable from *which projected field* differs): `presence | containment | arrangement | position | size | shape | color | lineHeight | padding | …`.
2. Map kind → **severity tier** via a fixed constant table: **CRITICAL** = presence / containment / arrangement / position-past-threshold; **HIGH** = size; **MEDIUM** = shape / alignment; **LOW** = colour-within-tolerance / line-height / padding.
3. **Stable-sort by (tier, then magnitude).** Magnitude (Δpx, ΔE) is a tiebreak *within* a tier only — so a small-but-structural defect can never sort below a large-but-tonal one. Pixel area is never an input.

**Design stance — bias to over-emit (false positives are the cheap failure):** any field differing past a *loose* threshold emits a delta. Do **not** write logic to decide "this one's probably fine, suppress it" — that suppression logic is exactly where 6 months of corner-cases breed. A false positive costs the AI one glance; a false negative is the current disaster (ignoring the form). The tool is a **smoke detector, not a diagnosis** — it points the AI at the right place; the AI confirms. Thresholds are the only knob, set loose, never agonised over. The only fuzzy step anywhere is element *pairing*, which already exists (text join) and fails safe (unmatched → `presence` delta).

## C — structure-aware image diffs (optional; the residual layer only)

For the genuine visual residue A cannot project (photo/image content, gradient aesthetics, font-render quality, overall "does it feel right"):

- **Shift-compensated diff** — cross-correlate a block across vertical offsets, report "content identical, shifted +Npx" instead of diffuse "drift" heat (and thus distinguish pure translation from a real content difference).
- **Edge-diff** — Sobel both images, diff the *edges*: shape / outline / location / corners pop; uniform-fill tone shifts recede — matching what the eye weights.
- **Region → element labels** — hit-test each perceptual region's bbox against A's element boxes so a crop arrives labelled ("contact-form subscribe input + button"), not `@80,3856`.

**C is lower priority and partly redundant with A**: the wireframe/onion-skin overlay is just "draw A's boxes for both and overlay"; shift-compensation largely duplicates A's position delta. Build A first, B immediately after (nearly free given A), C last and selectively (edge + shift as a backstop for when pairing fails).

## Acceptance

- The three [[REQ-20]] misses each appear as an explicit, high-severity **text** delta from A→B, with no image inspection required:
  - `[position] "Intentional Software": Δy ≈ 195px` (CRITICAL)
  - `[containment] "Your email address": nameSource placeholder (ref) vs label (ours)` (CRITICAL)
  - `[arrangement] subscribe button: right-of input (ref) vs below input (ours)` (CRITICAL)
- Ranking is by severity tier, never pixel area; a small 100%-wrong element outranks a large mildly-wrong one.
- All A fields are rendered/geometric/a11y — no CSS-mechanism field (no `flex-direction`, no tag/class) reaches the diff.
- Over-emit verified: loose thresholds, unmatched elements surface as `presence` deltas rather than being dropped.
- `test_UAT_FC_<TICKET>_*` cover: element-geometry capture, the severity comparator ordering (structural-small > tonal-large), the placeholder-vs-label `nameSource` delta, and the arrangement-from-geometry derivation.

## Notes

- Runbook [[DOC-19]] should point here once landed ("how the fidelity tools rank differences, and why pixel area is not importance").
- The lesson driving this: the fidelity mean (e.g. "16.33 / 255") reads like "≈98% done" and manufactures false confidence while the most obvious defects sit unflagged. Status reporting should lead with the severity-ranked delta list, not the aggregate mean.

## Implementation decisions (A + B this cycle; C deferred)

Agreed scope for this pass: **A (richer rendered projection) + B (severity-tier ranking)**. C (structure-aware image diffs) is deferred — the ticket itself marks it lower-priority/partly-redundant, and A+B alone satisfy all three CRITICAL acceptance items (they are derivable from A's projection with no image work).

**Correction to the Scope section's mechanism note:** the perceptual-diff ([[REQ-38]]) does not rank by literal `intensity × area`. It scores each region by the **sum of block-averages** inside it (`score = Σ block-averages`, descending). That already partly balances large-faint ≈ small-intense; what it lacks is any *structural* signal (containment/arrangement/position) — which is the real gap B closes in the values-diff. The practical premise stands; only the stated formula was imprecise.

**A — capture extensions** (`tools/generate/src/cli/capture/{extract,sections,types}.ts`): add to each rendered element `box{x,y,w,h}` (per-element, descending the existing `absBox` from sections to elements), shape (`borderRadiusPx`, `boxShadow`), and a11y `{role, name, nameSource}` derived **in-page** in `EXTRACT_SCRIPT` (placeholder-attr / associated `<label>` / `aria-label` precedence). Text-free elements (inputs) captured as a new per-section `fields[]` list, paired by `role + document order` (fails safe: unmatched → `presence`). Per-element `arrangement` (`row`/`stack`) derived from geometry vs the previous element in the section.

**B — severity comparator** (`values-diff.ts`): every delta tagged with a `kind` → fixed `tier` table (CRITICAL: presence/containment/arrangement/position/text · HIGH: size/fontSize/fontFamily · MEDIUM: shape/borderLeft/gradient/fontWeight · LOW: color/overlay/contentAnchor/lineHeight/padding/letterSpacing). Sort = (tier, kindRank-within-tier, magnitude). `contentAnchor` stays LOW (the coarse proxy is superseded by the new per-element CRITICAL `position` kind — this preserves the existing REQ-31 `overlay > contentAnchor` ordering while making structural defects outrank tonal ones). Existing `property` names and the `overlay>contentAnchor` / `text>color` / `color>letterSpacing` orderings are preserved so REQ-31/REQ-35 UATs stay green.

**Containment:** kept from [[REQ-20]]/[[REQ-46]] in-flight work — this ticket touches only the `capture/` + `fidelity` tooling files, never the module `.astro` or site JSON those tickets are editing. UATs run on synthetic fixtures (no live browser, no gigabytealchemy repro), so REQ-47 lands without racing them.

Tests: `tests/req47-*.test.ts`, `test_UAT_FC_REQ-47_*` — element-geometry capture, severity comparator (structural-small > tonal-large), placeholder-vs-label `nameSource` containment delta, arrangement-from-geometry.


---

## REQ-48: Fidelity gate: extend beyond the static single-state frame — motion/interaction, layering/compositing, treatments, media, multi-viewport, cross-engine (successor to REQ-47)

## Scope

Successor to [[REQ-47]] (delivered: severity-ranked structural diff over a richer rendered projection — per-element geometry, shape, a11y containment, arrangement, over-emit + severity taxonomy). REQ-47 fixed the *static-frame* blind spots that let the gigabytealchemy misses (hero 195px position, placeholder-vs-label, inline-vs-stacked) sail past. But REQ-47 compares **one static, motion-frozen, single-viewport, single-engine rendered frame**. A cross-transcript review of every import/ceiling benchmark ([[REQ-20]] gigabytealchemy, [[REQ-21]] faelan, [[REQ-36]] joyfulculinary, [[REQ-19]] ceiling) shows the remaining fidelity differences all live on axes that single frame **cannot contain**. This ticket extends the fidelity gate along those axes.

**Core finding:** the art-directed benchmark (faelan) repeatedly hit differences the mechanical gate called "clean / 6 matched" while the pixels were visibly wrong — *"the values-diff is structurally blind to exactly the deltas that are obvious to you… it called an ellipse-portrait, mis-rotated collage, and doubled footer 'excellent'."* REQ-47 closed the 2D-static subset; the rest is motion, depth, treatment, viewport, and engine.

## Tier 1 — diff-tool itself (highest impact; extend REQ-47's projection + capture)

1. **Motion & interaction states.** REQ-47 has no time axis and never actuates states — *"hover can't be screenshotted"*; hover-scale / carousel / scroll-reveal / parallax leave zero signal in a resting frame. Extend the capture from single-state to multi-state:
   - project + diff at `:hover` / `:focus` / `:active`, not just rest;
   - project **transforms** (`rotate` / `scale` / `transform-origin`) as first-class — `transform-origin: top-left` vs center displaced whole photos and is absent from the schema today; record the *effective* post-transform box;
   - capture animation/transition specs (entrance, scroll-reveal, hover-transition, `background-attachment: fixed` parallax);
   - **freeze-determinism precondition** (`prefers-reduced-motion` / fixed snapshot) or the whole gate is flaky.
   - *(This item alone changes capture from single- to multi-state and cross-links [[REQ-16]]; it is the largest sub-scope and may warrant its own split.)*

2. **Layering / z-order / overlay / scrim.** REQ-47's arrangement is 2D-plane only — no paint-order axis, so correctly-positioned-but-wrongly-stacked is invisible (faelan: hand-fixed `violin < alley < torn < circle < text`). Plus a proven **false-negative**: an overlay nested in a layer background renders identically (`#000000 @ 0.3`) but is uncompared / mis-flagged. Add per-element z-order + overlay / scrim / background-gradient as explicit projected fields.

3. **Treatments beyond box-shadow.** REQ-47 shape = radius/border/box-shadow only. The pixel-obvious, values-blind cases were **mask / clip-path feather geometry (halos), filters, text-shadow / glow, translucent-vs-solid rings**, and the compose case (rounded + mask). Extend the treatment fields.

4. **Media/image fidelity + capture descends into children.** Circle-rendered-as-ellipse (object-fit/aspect); and critically the montage photos were captured as **`items: []`** — text-free media children were never captured, so *"nothing for values-diff to compare"* while the gate said "matched". Add object-fit / aspect / crop-framing / intrinsic-vs-rendered, and fix capture to descend into layer/montage children (generalises REQ-47's text-free-element hard case from "one input" to "whole child sets").

## Tier 2 — run the diff across more dimensions (cross-reference existing tickets, don't duplicate)

5. **Multi-viewport / responsive reflow** as a gate dimension — layout recomposes at mobile (faelan mobile needed a full `reflow` redo; wordmark overflow). Run projection+diff across `{320,375,768,1024,1280,1440}`; include the cheap deterministic `scrollWidth <= viewport.width` no-horizontal-overflow check. **Viewport-match is a precondition** — shooting at the wrong viewport makes the whole diff lie (false-positive trap). *(Ties [[REQ-41]].)*
6. **Cross-engine divergence** (Blink vs WebKit vs Gecko) — a real faelan `%-top` shift in Safari/FF; harness had only Chromium installed. Diff as layout-box equivalence (±2px / ±1%), not pixel-equality (AA/fonts differ per engine). *(Ties [[REQ-42]].)*
7. **Web-font load / FOUT / fallback-metrics** as a capture-timing precondition — wait for fonts + network-idle; verify the intended face actually resolved (not a fallback with different metrics). *"Skip this and the whole suite is flaky."* Contaminates every downstream delta if skipped.

## Tier 3 — diff-quality refinements

8. **Systemic sub-threshold aggregation + perceptual colour distance.** The near-black-vs-slate-700 body-tone miss slipped through because a small per-element delta repeated across ~30 elements is individually below threshold but collectively obvious. B (REQ-47) ranks per-element → a pervasive LOW delta is buried. Add an **escalate-when-repeated-on-N-elements** rule, and use **ΔE / OKLCH** colour distance, not raw RGB, for the tolerance.
9. **Ignore-masks for legitimate dynamic content.** `© 2025` hardcoded vs our dynamic `2026` year is a permanent, correct-by-design false-positive; live counters likewise. Needs an allowlist / ignore-mask. *(Ties [[REQ-35]].)*
10. **Stale-capture / re-capture discipline.** Gradient stops were missed pre-[[REQ-31]] because the bundle predated the field. When the projection schema grows (as it just did in REQ-47, and again here), bundles MUST be re-captured or the new fields silently compare null↔null.

## Tier 4 — trust / verifier independence

11. **Anti-self-grading.** *"we already watched the faelan agent grade its own diff against a number it could influence."* A severity score authored and read by the same agent that built the repro is self-certification. The gate's output needs an **independent / adversarial consumer + negative-fixture calibration** — prove the discriminator actually discriminates (seed known-bad fixtures and confirm it fires) before trusting a "clean" verdict. Pairs with the REQ-47 principle that the aggregate mean is not "% done".

## Acceptance

- The fidelity gate produces high-severity, *localised* deltas (no unaided eyes required) for each blind spot on its benchmark:
  - motion/interaction: a hover-scale / rotation / parallax present in the reference but absent/wrong in the repro is flagged (multi-state capture);
  - layering: a wrong z-order or a missing overlay/scrim is flagged (not a false-negative);
  - treatment: mask-feather halo / missing text-glow / rounded-vs-mask edge is flagged;
  - media: circle-vs-ellipse and an uncaptured photo child are flagged (capture descends into children);
  - multi-viewport: a mobile reflow break (overflow / recomposition) is flagged at ≥1 non-desktop viewport.
- Colour tolerance is perceptual (ΔE/OKLCH); a systemic low delta on N elements escalates above an isolated one.
- Dynamic-content false-positives are suppressible via an ignore-mask.
- A negative-fixture suite proves the gate fires on seeded defects (verifier independence).
- `test_UAT_FC_<TICKET>_*` cover each capability's emitted delta on a seeded fixture, plus the unchanged-pass on a faithful control.

## Notes

- Evidence sourced from a cross-transcript review of [[REQ-19]] / [[REQ-20]] / [[REQ-21]] / [[REQ-36]] plus the [[REQ-47]] design sessions; the art-directed faelan case ([[REQ-21]]) is the dominant source (motion, layering, treatments, media).
- Bundled per the "fewer, generic tickets" preference, but **Tier-1 item 1 (motion/interaction, multi-state capture) is large and self-contained — split it into a sibling if it grows**, cross-linked to [[REQ-16]].
- Runbook [[DOC-19]] should point here for "fidelity axes the static structural diff does not yet cover."
- The through-line lesson (carried from [[REQ-47]]): the fidelity gate must not report an aggregate score as "≈% done" — a single-state/single-viewport/single-engine "clean" is only clean *on those axes*; state that scope explicitly in every verdict.