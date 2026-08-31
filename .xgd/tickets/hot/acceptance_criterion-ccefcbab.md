---
uid: acceptance_criterion-ccefcbab
id: AC-704
type: acceptance_criterion
title: Survivor behavior modules declare the full five-dimension conformance obligation
  set
created_by: xgd
created_at: '2026-07-22T19:55:07.909196+00:00'
updated_at: '2026-08-31T11:05:12.181779+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Each survivor behavior module (carousel, contact-form) is subject to the full set
of conformance obligations: safety, security, cross-browser, responsive, and
isolation. The behavior's published contract enumerates exactly these five
dimensions, so the conformance harness holds every behavior module to the
complete envelope rather than a subset.

**The harness's negative fixtures are plain behavior components too.** The
deliberately-broken modules that prove each dimension discriminates — an
overflowing one, a throwing one, a collapsed one, an unsafe-URL one, an
off-allowlist-egress one, a too-small-font one and the rest — are ordinary
props-to-markup functions carrying the same `kind: 'behavior'` contract shape as a
catalogued module, mounted through the **same** render path via an injected
test-only resolver rather than the shipping catalog. A fixture therefore needs no
build step, and the test suite cannot drag a build transform back onto the render
path through the back door. Each still discriminates: the harness flags every
broken fixture red on the dimension it is broken for, and passes a well-formed
catalog module with no false positive.

## Verification
Introspect each survivor behavior module's contract and assert its declared
conformance obligations are exactly {safety, security, cross-browser, responsive,
isolation}. Run each dimension against its negative fixtures through the injected
resolver and assert every one is flagged on the dimension it targets, and that a
clean catalog module passes all five. Assert every fixture is a plain function
component reached by the same resolution the shipping catalog uses, and that a
fixture whose defect is a render-time throw fails at render rather than at load,
so the isolation dimension sees the failure it is meant to discriminate.
