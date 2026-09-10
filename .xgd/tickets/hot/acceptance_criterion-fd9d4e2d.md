---
uid: acceptance_criterion-fd9d4e2d
id: AC-1618
type: acceptance_criterion
title: The slug reservation consults the complete ISO 639-1 registry, not a curated
  subset
created_by: martin-github@westhead.me
created_at: '2026-09-10T04:03:23.505101+00:00'
updated_at: '2026-09-10T04:03:23.505101+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-17ba490e
  kind: behavior
  regression_only: false
  uat_coverage: fail
---

## Criterion

The slug reservation consults the **complete** ISO 639-1 two-letter language
registry, not a curated subset of the languages the platform expects to serve.

A rarely-used but real language code is reserved exactly as `de` is: refused at
the same machine-readable path (`/pages/<index>/slug`), with the same message
naming the slug, the locale reason and both working alternatives.

Membership, not shape, is what decides: of the 676 two-letter segments, exactly
the real ISO 639-1 codes are reserved and every same-shaped non-code (`zz`,
`qq`, and the rest) is an ordinary page slug. A registry carrying only the
common languages would leave a code out, and a code left out is a collision
discoverable only once a site is already published under it — in an immutable
revision that cannot be moved, only broken.

Pinning the registry's completeness is safe where pinning the country
derivation table's breadth would not be: ISO 639-1 is a closed, frozen list,
while the country table is an open surface that grows by a one-row data edit.

## Verification

Sweep every two-letter segment `aa`–`zz` through site validation and collect
the set that is refused; assert it equals the complete ISO 639-1 registry
exactly — no real code missing, no non-code reserved.

Then take several rare-but-real codes (e.g. `ki`, `nv`, `io`, `cu`, `za`) —
none of them among the common languages the shipped fixtures exercise — and
assert each is refused at `/pages/0/slug` with a message carrying the slug, the
locale reason and both alternatives, identically to `de`.
