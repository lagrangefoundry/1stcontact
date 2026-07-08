---
uid: report-90b36d20
id: REPORT-272
type: report
title: 'Reconciliation Plan: 1stcontact platform scaffold + framework Phase 0 (REQ-1/3/4/5/10)'
created_by: xgd
created_at: '2026-07-08T19:01:11.041341+00:00'
updated_at: '2026-07-08T19:13:55.025635+00:00'
completed_at: null
last_field_updated: items
fields:
  report_kind: reconciliation_plan
  subject_uid: bundle-6a071846
  anchor_uid: bundle-6a071846
  items:
  - index: 1
    component: Platform Scaffold + Cloudflare Deploy Pipeline
    item_type: feature
    story_points: 3
    dependencies: []
    description: 'pnpm monorepo skeleton with two Cloudflare Worker apps and an auto-deploy
      CI/CD pipeline. public-site is the generic multi-tenant site server: its production
      env routes both 1stcontact.io/* (apex marketing site) and *.1stcontact.io/*
      (customer sites by slug subdomain); control-app owns the more-specific app.1stcontact.io/*
      route which takes precedence (''app'' is a reserved slug). Each Worker returns
      a text/plain placeholder (200). deploy.yml deploys both Workers to the production
      env on push to xgd-stable, serialized via a concurrency group and exposing both
      Cloudflare secrets. ci.yml runs install + build + test + dry-run deploys on
      PRs. bin/project/xgd_version_bump is implemented against the root package.json
      version field (bare patch bump, --minor/--major, --check, --list-paths). Code
      identifiers are normalized to the 1stcontact name (worker names 1stcontact-*,
      sites/1stcontact/), guarded by naming UATs.'
    justification: Capability matrix is empty — no story documents the monorepo scaffold,
      the two-Worker multi-tenant routing model, the CI/deploy workflows, or the version-bump
      tool. Commits 3463be, c06a5f, 287093 stand up these behaviors (REQ-1).
    story_uid: story-0ceaf24d
  - index: 2
    component: '@1stcontact/site-schema (site definition contract)'
    item_type: feature
    story_points: 2
    dependencies:
    - 1
    description: TypeScript types + runtime validation for site definitions — the
      data contract every framework package and consumer imports. Zod schemas are
      the single source of truth (types derived via z.infer) for Site, SiteConfig,
      ThemeTokens (all required token slots), NavConfig with discriminated nav targets
      (page/anchor/url), Page, ModuleInstance, and AssetRef. validateSite(input) returns
      a discriminated Result — {ok:true,value:Site} or {ok:false,errors:ValidationError[]}
      — with JSON-pointer-style error paths. Validation enforces structural shape,
      field types (hex color, URL), the NavPattern enum, theme-token slot completeness,
      and structural uniqueness (module ids unique per page, page slugs unique per
      site) via superRefine. Catalog membership (is 'hero' a real module? is a variant
      valid?) is deliberately NOT validated — that is the framework's job at render
      time.
    justification: No existing story documents the site-definition schema, its validator,
      or the structure-vs-catalog validation boundary. Commit 7f2f18 implements this
      foundational contract (REQ-3).
    story_uid: story-6fc151b1
  - index: 3
    component: '@1stcontact/framework — theme tokens, CSS generator, module registry,
      chrome modules'
    item_type: feature
    story_points: 3
    dependencies:
    - 2
    description: 'The framework''s theme-token system and chrome module catalog. site-schema
      owns the 55-token ThemeTokens superset (palette with text role, 5xl type scale,
      weights, lineHeights, numeric spacing keys, container narrow/default/wide/bleed);
      the framework re-exports the contract, supplies sane defaults for every slot,
      and provides generateThemeCss(tokens, {dark?}) which deterministically emits
      :root CSS custom properties covering every slot, fills missing slots from defaults,
      and adds a prefers-color-scheme dark block when a dark palette is provided.
      A typed module registry maps id -> {meta, Component}; getModule(id, version)
      resolves a known module or throws a clear catalog-miss error. Three token-driven
      .astro chrome modules ship: header (top-nav, responsive hamburger collapse below
      md), hero (bg-color / bg-image variants, size/align dials, clamp-based responsive
      type), and footer (minimal variant, build-time-constant copyright year). Every
      module exports a moduleMeta conforming to the module contract.'
    justification: No existing story documents the theme-token/CSS-generation system,
      the module registry/getModule contract, or the header/hero/footer chrome modules.
      Commit 4a8a48 implements them and extends site-schema's ThemeTokens to the 55-token
      superset (REQ-4).
    story_uid: null
  - index: 4
    component: '@1stcontact/framework — content modules (text-block, services-grid,
      contact-form)'
    item_type: feature
    story_points: 3
    dependencies:
    - 3
    description: The three content modules completing the 6-module Phase 0 catalog,
      each following the established moduleMeta + scoped-CSS contract. text-block
      (prose/landing variants) renders a markdown body via a memoised renderMarkdown
      helper (@astrojs/markdown-remark) with variant-driven container width and lazy
      images. services-grid (three-col/two-col) renders markdown card bodies, collapses
      mobile-first to a single column below md, and bounds items 2..6. contact-form
      (inline) is a server-rendered form that fully submits without JS, with a JSON-fetch
      progressive-enhancement island (extracted to enhance.ts for JSDOM testing) that
      intercepts submit, POSTs JSON to the configured action, swaps in the success
      message on 200 and surfaces an inline error on non-200; it includes a CSS-hidden
      honeypot and a data-turnstile-target mount point (widget wired later). A framework-level
      validateModuleContent(meta, content) enforces content-schema-level list bounds
      (minItems/maxItems on ContentFieldSpec); the registry and barrel exports are
      extended to all six modules.
    justification: No existing story documents the content-module catalog (markdown
      rendering, list-of-content fields, no-JS-plus-progressive-enhancement form,
      content-schema list-bound validation). Commit 0b3638 implements them (REQ-5).
    story_uid: null
---

# Reconciliation Plan

**Mode**: commits
**Anchor**: bundle-6a071846 (type: bundle) — bundles REQ-1 + REQ-3 + REQ-4 + REQ-5 + REQ-10
**Subject**: bundle-6a071846 (bundle is a first-class intent type for reconcile)

The capability matrix is **empty** (zero capabilities, zero stories). Every behavior in these commits is therefore *uncovered* — all plan items are `feature` type. No `upgrade` items are possible because there are no existing stories to extend. No FC tests were found on disk, so there is no orphan-test coverage obligation.

## Behavior Inventory

```yaml
behavior_inventory:
  source: "free-coded commits: 3463be1, c06a5fb, 287093b, 7f2f186, 4a8a488, 0b36381, c88930b, 752a9d5"
  entry_files:
    - apps/public-site/src/index.ts
    - apps/public-site/wrangler.toml
    - apps/control-app/src/index.ts
    - apps/control-app/wrangler.toml
    - .github/workflows/deploy.yml
    - .github/workflows/ci.yml
    - bin/project/xgd_version_bump
    - packages/site-schema/src/{schema,types,validate,index}.ts
    - packages/framework/src/tokens/{contract,defaults,css}.ts
    - packages/framework/src/modules/{registry,types,dials,nav,validate,markdown}.ts
    - packages/framework/src/modules/{header,hero,footer,text-block,services-grid,contact-form}/
  features:
    - name: "Two-Worker monorepo + deploy pipeline (REQ-1)"
      description: "pnpm workspace; public-site multi-tenant server (apex + *.1stcontact.io wildcard); control-app app.1stcontact.io (more-specific wins); GitHub Actions CI (PR) + deploy (push to xgd-stable); xgd_version_bump vs root package.json; 1stcontact identifier normalization."
      behaviors:
        - public-site returns 'Hello from 1stcontact.io' (text/plain 200)
        - control-app returns 'Hello from app.1stcontact.io' (text/plain 200)
        - public-site prod env routes 1stcontact.io/* AND *.1stcontact.io/*
        - control-app prod env routes app.1stcontact.io/* (reserved slug, takes precedence)
        - deploy.yml deploys both Workers on push to xgd-stable, concurrency-serialized, both CF secrets exposed
        - ci.yml runs install/build/test + dryrun:public/dryrun:control on PRs
        - xgd_version_bump patch/minor/major bump + --check + --list-paths against root package.json version
        - worker names 1stcontact-*, sites/1stcontact/; naming UATs guard drift
      entry_point: "Worker fetch handlers; wrangler.toml routes; workflow yaml; bin/project/xgd_version_bump"
    - name: "site-schema types + validation (REQ-3)"
      description: "Zod-sourced types + validateSite for site definitions; structural validation only."
      behaviors:
        - validateSite -> discriminated Result with JSON-pointer error paths
        - validates Site/Page/ModuleInstance shape, field types (hex color, URL)
        - NavPattern enum; discriminated nav targets (page/anchor/url)
        - theme-token slot completeness enforced
        - structural uniqueness (module ids per page, page slugs per site) via superRefine
        - catalog membership NOT validated (documented boundary)
      entry_point: packages/site-schema/src/validate.ts::validateSite
    - name: "framework tokens + CSS generator + registry + chrome modules (REQ-4)"
      description: "55-token superset (owned by site-schema), generateThemeCss, typed registry + getModule, header/hero/footer."
      behaviors:
        - generateThemeCss emits :root custom properties for all slots
        - default-fill for missing slots; dark-mode block when dark palette provided
        - getModule resolves known module / throws catalog-miss error
        - header top-nav responsive collapse; hero bg-color/bg-image variants; footer build-time year
        - every module exports conforming moduleMeta
      entry_point: packages/framework/src/tokens/css.ts; modules/registry.ts
    - name: "framework content modules (REQ-5)"
      description: "text-block, services-grid, contact-form + validateModuleContent + markdown helper."
      behaviors:
        - text-block prose/landing markdown body, variant container width, lazy images
        - services-grid three-col/two-col, mobile-first single-column collapse, items 2..6
        - contact-form no-JS post + JSON-fetch enhancement, honeypot, Turnstile mount point
        - validateModuleContent enforces minItems/maxItems list bounds
        - registry extended to all 6 modules
      entry_point: packages/framework/src/modules/{text-block,services-grid,contact-form}/index.astro
    - name: "Toolchain upgrade (REQ-10) + .wrangler gitignore"
      description: "Astro 7 / Vitest 4 / Vite 8 / Wrangler 4 / Zod 4 / TS 6 version bumps across all workspaces; ignore apps/*/.wrangler cache. Pure dependency/infra change, no user-visible behavior."
      behaviors:
        - dependency majors bumped; suite stays green; dry-runs succeed under wrangler 4
        - no behavior/feature change (explicitly per ticket)
      entry_point: package.json / pnpm-lock.yaml / .gitignore (no runtime entry point)
```

## Coverage Map

```yaml
coverage_map:
  - feature: "Two-Worker monorepo + deploy pipeline (REQ-1)"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps: ["entire capability — matrix empty"]
  - feature: "site-schema types + validation (REQ-3)"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps: ["entire capability — matrix empty"]
  - feature: "framework tokens + CSS + registry + chrome (REQ-4)"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps: ["entire capability — matrix empty"]
  - feature: "framework content modules (REQ-5)"
    status: uncovered
    existing_stories: []
    existing_acs: []
    gaps: ["entire capability — matrix empty"]
  - feature: "Toolchain upgrade (REQ-10) + gitignore"
    status: n/a — no user-visible capability to document (see Observations)
    existing_stories: []
    existing_acs: []
    gaps: []
```

## Plan Items

| # | Component | Type | Points | Deps | Description |
|---|-----------|------|--------|------|-------------|
| 1 | Platform Scaffold + Deploy Pipeline | feature | 3 | - | Monorepo, two multi-tenant Workers, CI/deploy workflows, version-bump tool, 1stcontact naming (REQ-1) |
| 2 | @1stcontact/site-schema | feature | 2 | 1 | Site-definition types + validateSite; structural validation, catalog boundary (REQ-3) |
| 3 | @1stcontact/framework — tokens/CSS/registry/chrome | feature | 3 | 2 | 55-token system, generateThemeCss, registry/getModule, header/hero/footer (REQ-4) |
| 4 | @1stcontact/framework — content modules | feature | 3 | 3 | text-block, services-grid, contact-form + content validation + markdown (REQ-5) |

## Observations

- **Empty matrix → all features.** No capabilities or stories exist, so every behavior is uncovered and no `upgrade` items are possible. Items are ordered/dependency-linked to reflect the build stack (scaffold → schema → chrome → content).
- **Story granularity.** Four stories map to the four capability-bearing REQs. REQ-4 and REQ-5 are kept separate (not merged) because each is a substantial 3-point unit and combining would exceed the ≤3-point sizing rule; they are distinct capability surfaces (token/chrome system vs content-module catalog) sharing only the registry contract. The three REQ-1 commits (scaffold, wildcard routing, 1stcontact rename) are folded into a single story — routing and naming are behaviors of the scaffold, not separate capabilities.
- **REQ-10 (toolchain upgrade) and 752a9d5 (.wrangler gitignore) deliberately get NO story.** Both are pure dependency/infrastructure changes with, by the ticket's own words, 'no feature/behavior change.' They document no user-visible capability, so per the justification test and parsimony rule they are excluded from the matrix rather than inflated into a story. The zod 3→4, wrangler 3→4, and Astro 4→7 bumps were verified by the existing REQ-3/4/5 UATs continuing to pass, so their correctness is already evidenced by the stories above; one contact-form no-JS UAT assertion was adjusted to Astro 7's deferred-island output (the no-JS `<form method=post>` contract itself is unchanged and is covered by item 4).
- **Structure verified on disk** (packages/framework/src/{modules,tokens}, packages/site-schema/src, apps/*/src, .github/workflows) — matches the commit evidence exactly.
- **No FC tests found** — no orphan-test coverage obligation for this bundle.