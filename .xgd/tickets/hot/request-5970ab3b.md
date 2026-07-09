---
uid: request-5970ab3b
id: REQ-40
type: request
title: 'Conformance harness: security dimension (content-injection inert + no egress)'
created_by: xgd
created_at: '2026-07-03T23:18:00.598522+00:00'
updated_at: '2026-07-09T23:59:26.737844+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: a7ef810b9d62a2a8aff53fdcbff24e15256430fc
    reconcile_sha: null
    main_sha: null
  - working_sha: e83ed32102190b41f8cc952a962dc111bd9136b3
    reconcile_sha: null
    main_sha: null
  - working_sha: bb2414aa7462b9e860097cee9cdeb9813d2f9529
    reconcile_sha: null
    main_sha: null
  version: 0.0.46
  bundled_in: bundle-df065afc
---

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