---
uid: report-c3916d82
id: REPORT-314
type: report
title: 'Reconciliation Review: commits (bundle REQ-1/3/4/5/10)'
created_by: xgd
created_at: '2026-07-09T19:54:26.231379+00:00'
updated_at: '2026-07-09T19:54:26.231379+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-6a071846
  anchor_uid: bundle-6a071846
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: bundle-6a071846 (type: bundle — first-class intent)
**Subject (intent)**: bundle-6a071846
**Stories Reviewed**: 4 (story-0ceaf24d, story-6fc151b1, story-a224111f, story-903e3e3a)
**ACs**: 43 (AC-416 … AC-458) — one covering UAT each, 43/43 passing

## Behavior Inventory

5 behavior clusters in the bundle: (1) two-Worker monorepo + multi-tenant routing + CI/deploy + version-bump + 1stcontact naming (REQ-1); (2) site-schema types + structural validateSite (REQ-3); (3) framework theme tokens, CSS generator, module registry, chrome modules header/hero/footer (REQ-4); (4) framework content modules text-block/services-grid/contact-form + content validation (REQ-5); (5) toolchain upgrade Astro7/Vitest4/Vite8/Wrangler4/Zod4/TS6 (REQ-10 — pure dependency change, no user-visible behavior).

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | public-site / control-app placeholder responses | Covered | story-0ceaf24d | AC-416/417 boot real worker via unstable_dev, assert 200/content-type/body |
| 2 | Multi-tenant routing (apex + wildcard; app reserved, more-specific wins) | Covered | story-0ceaf24d | AC-418/419 assert real wrangler.toml route patterns |
| 3 | Deploy pipeline (push xgd-stable, both Workers, serialized, secrets) | Covered | story-0ceaf24d | AC-420 parses deploy.yml structure |
| 4 | CI pipeline (PR build/test/dry-run) | Covered | story-0ceaf24d | AC-421 parses ci.yml |
| 5 | Version-bump tool (patch/minor/major, --check, --list-paths) | Covered | story-0ceaf24d | AC-422/423 execute the tool against staged fixtures, observe manifest + exit codes |
| 6 | 1stcontact identifier normalization | Covered | story-0ceaf24d | AC-424 asserts worker names + sites/1stcontact + absence of first-contact |
| 7 | validateSite discriminated Result + JSON-pointer error paths | Covered | story-6fc151b1 | AC-425/426 real validator |
| 8 | Structural validation (nav enum, token slots, hex color, uniqueness) | Covered | story-6fc151b1 | AC-427..430 |
| 9 | Catalog-membership boundary (NOT validated) | Covered | story-6fc151b1 | AC-431 documents boundary; AC-432 nav target kinds |
| 10 | generateThemeCss: 55-slot :root, deterministic naming, default-fill, dark block | Covered | story-a224111f | AC-433/434/435 real generator, byte-identical determinism, 55-decl count |
| 11 | Module registry / getModule resolve + catalog-miss error | Covered | story-a224111f | AC-436/437 real resolution + error message content |
| 12 | Module contract shape (variants/dials/contentSchema) | Covered | story-a224111f | AC-438 |
| 13 | header/hero/footer rendering (nav+collapse, variants, cta, build-year copyright, links) | Covered | story-a224111f | AC-439..444 Astro SSR render; scoped-CSS rules asserted in module source (container strips <style>) paired with render assertions |
| 14 | text-block (markdown, lazy images, variant width, optional heading) | Covered | story-903e3e3a | AC-445/446/447 |
| 15 | services-grid (cards per item, mobile-first collapse) | Covered | story-903e3e3a | AC-448/449 |
| 16 | contact-form no-JS post, honeypot, Turnstile mount | Covered | story-903e3e3a | AC-450/451/452/453 SSR render |
| 17 | contact-form progressive enhancement (intercept, JSON POST, success swap, inline error) | Covered | story-903e3e3a | AC-454/455/456 JSDOM + fetch mock (external boundary only) |
| 18 | validateModuleContent list bounds + required fields | Covered | story-903e3e3a | AC-457 real validator |
| 19 | 6-module registry extension | Covered | story-903e3e3a | AC-458 |
| 20 | Toolchain upgrade (REQ-10) | n/a — no user-visible capability | — | Deliberately storyless per plan; correctness evidenced by all UATs passing under new majors; divergence flagged in stories 1 & 2 |

## Ungrounded Stories

None. Every story claim is grounded in both the bundle intent and the implementation on disk.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Platform Scaffold + Deploy Pipeline | story-0ceaf24d | ✓ |
| 2. @1stcontact/site-schema | story-6fc151b1 | ✓ |
| 3. framework tokens/CSS/registry/chrome | story-a224111f | ✓ |
| 4. framework content modules | story-903e3e3a | ✓ |

All 4 plan items produced stories. REQ-10 and the .wrangler gitignore correctly produced no story (pure dependency/infra, no capability).

## Evidence Sufficiency (Step 5b)

- 43/43 UATs pass; exactly one UAT per active AC.
- Real entry points: worker boot (unstable_dev), generateThemeCss, getModule, Astro SSR container, validateModuleContent, enhanceContactForm (JSDOM). No internal/repository-owned code is mocked; only `fetch` (external boundary) is stubbed for the enhancement UATs.
- Config-file assertions (AC-418..421, 424) target wrangler.toml / workflow YAML — for infra deliverables the config file IS the artifact under test; there is no separate runtime that could diverge from it. Structure is parsed (yaml.parse / route-pattern regex), not opaque substring-matched.
- Scoped-CSS guarantees (header collapse AC-439, hero clamp AC-440, services-grid collapse AC-449) are asserted against module source because Astro's container API strips scoped <style> from SSR output — the only observable surface for scoped CSS — and are paired with render assertions of the corresponding markup/classes. This is not the source-inspection anti-pattern (proving a name exists); it inspects the stylesheet artifact itself.
- A broken implementation could not pass: version-bump UATs run the tool and observe outputs; validator UATs feed invalid input and require path-located errors; render UATs assert concrete emitted markup and attributes.

## Intent Fidelity — Divergence Handling

- REQ-10 (wrangler 3→4 / Astro 4→7) upgraded the toolchain the intent originally described at wrangler 3. story-0ceaf24d explicitly flags this and states the routing/response/pipeline behaviors are unchanged — flagged, not silently absorbed.
- REQ-4 extended REQ-3's originally-locked theme-token slot list to the 55-token superset. story-6fc151b1 explicitly notes the divergence and clarifies the slot-completeness contract itself is unchanged — flagged, not silently absorbed.

## Judgment Calls

- REQ-10 storyless: acceptable — pure dependency change with no user-visible capability; its correctness is evidenced by the existing UATs passing under the new majors.
- Config-inspection UATs for routing/CI/deploy: acceptable — the deployment/CI configuration is the deliverable and its only observable surface short of a live Cloudflare deploy.
- Scoped-CSS-in-source assertions: acceptable — unavoidable given the container API, and paired with runtime render assertions.

## Verdict

PASS: Stories accurately and completely document the behavior surface within the bundle's declared intent. All 43 active ACs have passing UATs that enter real interfaces and could not be passed by a broken implementation. Both intent-vs-code divergences (toolchain upgrade, token superset) are explicitly flagged rather than silently absorbed. All plan items produced output. A developer reading these four stories would have a correct mental model of what the operator intended to build.