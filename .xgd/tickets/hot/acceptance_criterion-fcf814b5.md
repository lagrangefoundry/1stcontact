---
uid: acceptance_criterion-fcf814b5
id: AC-739
type: acceptance_criterion
title: 'No render can reach a build transform: no Astro specifier on the render graph
  and no Astro module on disk'
created_by: xgd
created_at: '2026-07-29T04:33:06.638626+00:00'
updated_at: '2026-08-31T11:18:04.024268+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

No render can reach a build transform, unconditionally: no source file on the
render graph names an Astro specifier, and no Astro module resolves from disk.

- No source file reachable from any render names an `astro` specifier — neither
  as a static `from 'astro/…'` import nor as a dynamic `import('astro/…')` — and
  no `.astro` component file exists anywhere in the repository. A bundler
  resolves a static specifier whether or not the branch runs, so a dynamic import
  behind an untaken branch is as disqualifying as a taken one.
- `astro/container` cannot be resolved from the installed tree at all, so no
  container can be constructed by any render regardless of which pages the site
  carries.
- The render outputs are unchanged by this. A site whose pages are all L1
  reproductions — and the empty starter — renders its expected page HTML with no
  module hooks in the markup. A site with at least one behavior-module page
  renders the module markup, its folded theme CSS, and its client script exactly
  as before, and it does so **without** a container: no page needs the transform,
  because a behavior module is a plain typed function of its props.

This criterion previously read "an Astro container is constructed only for pages
that carry behavior modules", measured by observing container construction during
one render. That measurement no longer has a subject — the dependency is gone —
and the conditional no longer has a case: the module-carrying render constructs no
container either. The replacement is strictly stronger: observing one render could
only prove "no container for *this* render", while the scan and the resolution
check prove "no container is reachable from *any* render". The guarantee survives
the rewrite rather than being weakened by it.

## Verification
Scan every source file on the render graph — the framework sources, the CLI render
sources, and the control app's sources — and confirm none names an `astro`
specifier statically or dynamically, and that no `.astro` file exists in the
repository. Confirm `astro/container` fails to resolve from the installed tree.
Then render, through the ordinary render entry point, an L1-only reproduction, the
empty starter, and a site carrying a behavior module: confirm the first two emit
their expected HTML with no module hooks, the third emits its module markup,
folded theme CSS and client script, and no container is constructible in any of
the three.
