---
uid: doc-db9ba2aa
id: DOC-2
type: doc
title: Security Policy
created_by: xgd
created_at: '2026-06-30T00:54:42.938102+00:00'
updated_at: '2026-07-20T20:50:50.471366+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  doc_kind: security_policy
---

# Security Policy — Structured-Only, Validated by Construction

**Status:** Founded on L1 (REQ-82). The security posture of the platform is a
**property of the L1 layout substrate**, not a CI bolt-on or a review checklist.

## 1. The invariant

> A site definition is edited, stored, and rendered as **structured data only —
> never as raw code, CSS, HTML, or JS.** Every value that reaches the browser
> passes through a typed sink that is safe by construction.

This is the single load-bearing security boundary ([[DOC-7]] §6.2). Its value —
alongside robustness and cross-browser fidelity — is the framework's reason to
exist ([[DOC-4]]): agency-quality output at builder economics, with the only
hard walls being **security** and **reliability**, never taste.

## 2. Two layers enforce it (both in L1)

**Layer 1 — the schema + envelope validator** (`packages/site-schema/src/l1`,
`validateL1`):
- Every axis is a typed scalar or a closed enum. Colours are hex-only; numbers
  are finite and range-bounded (font-size 1–400, weight 1–1000, geometry ±100k).
- Every object is `.strict()` — an unknown/extra key (a would-be freeform CSS or
  `style=` escape hatch) is rejected, not ignored.
- Image `src` passes a **URL-scheme allowlist** (http/https or relative only);
  `javascript:` / `data:` / `vbscript:` / `file:` are rejected.
- Structural caps bound denial-of-service by malformed input: tree depth ≤ 32,
  node count ≤ 2000, geometry keyframes ⊆ the document's declared widths.

**Layer 2 — the renderer is the only emitter** (`packages/framework/src/l1`,
`renderL1Document`): defence in depth. Even a value that somehow bypassed the
validator is neutralised at emit time — text is HTML-escaped, colours are
re-checked against the hex pattern, font-family is stripped to real font-name
characters (no `@import`, no declaration break-out), lengths are numeric, and an
unsafe image `src` is dropped to empty. No instance string ever becomes raw CSS
or HTML.

## 3. Why structured-only (not a raw-code escape hatch)

- **Injection / XSS surface closed.** Raw CSS/HTML in instance data is the
  classic injection vector; structured-only removes it entirely.
- **Reproducibility & portability.** Structured properties round-trip through
  capture ([[DOC-13]]), serialise to storage, and re-render deterministically —
  raw CSS does not. The L1 round-trip gate (`capture(render(L1)) ≈ L1`, REQ-82)
  is only meaningful because every value is structured.

When the language cannot yet express a design, the response is to **add a typed
primitive to L1**, never to open a raw-CSS hole ([[DOC-7]] §6.3). Arbitrary code
enters only through the vetted **capability-module** seam (Phase D), which is a
gated framework artifact — never the instance-editing path.

## 4. Verification

The invariant is proven by executable UATs, not asserted:
- `test_UAT_FC_REQ-82_envelope_security_*` — injection payloads in text / url /
  colour / font-family are inert; the validator rejects unsafe URLs and non-hex
  colours; the renderer escapes and sanitises.
- `test_UAT_FC_REQ-82_envelope_robustness_*` — out-of-range, oversize, and
  freeform (unknown-key) inputs are rejected.
- The module-conformance harness ([[DOC-20]]) provides the per-module security
  dimension (content-injection inert + no off-allowlist egress) at the L1 /
  capability-module layer.

## 5. Scope of this document

This policy covers the **site-definition → render** security boundary. Platform
concerns — SSRF guards on web-fetch ([[REQ-20]]), magic-link auth, PII handling,
Turnstile on public forms — are specified in [[DOC-5]] and are out of scope here.
