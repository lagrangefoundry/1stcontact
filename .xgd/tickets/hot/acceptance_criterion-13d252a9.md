---
uid: acceptance_criterion-13d252a9
id: AC-960
type: acceptance_criterion
title: Every name the workspace shows for the site surface has exactly one definition
  site
created_by: xgd
created_at: '2026-08-07T01:43:51.151373+00:00'
updated_at: '2026-08-07T23:16:13.743953+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Every name the workspace puts in front of a reader is declared once, and
changing that single declaration changes every place the name appears.

This holds for two names.

The human-readable name shown for the site surface: changing its one declaration
changes the tab's visible label and the accessible name of the site selector,
and the name appears as a literal in no other location in the repository.

The scope the shared UI components are published under, which is part of every
reference the workspace makes to a component: it too is declared once, everything
that generates a component reference composes it from that declaration, and the
scope in use appears as a literal nowhere else — and a scope the components were
previously published under appears nowhere at all, in any tracked file, including
generated artifacts checked in beside their generator and including prose such as
comments. There is exactly one permitted exception, and it is bounded: the
workspace's own browser source is served to the browser verbatim and can read no
build-time value, so it names components directly. That exception is held in step
rather than trusted — every component the browser source names must be one the
generated workspace document also declares, so a browser source and a generator
that disagree cannot both be satisfied.

## Verification

For the site-surface name: search the whole source tree (application, tooling and
package sources) for the label string and assert the only occurrence is the
single declaration. Mount the workspace and assert the tab's rendered label and
the site selector's accessible name both equal that declared value, so a rename
cannot leave one of them stale.

For the component scope: enumerate every text file the repository tracks — not a
fixed list of source directories, since the surface that gets forgotten is
precisely the one no such list anticipates — minus a declared exclusion list
(the ticket and workflow store, whose retention of a legacy namespace is a
recorded operator decision, and dependency lockfiles). Assert no enumerated file
contains a previously used scope; assert the scope in use is written only in its
single declaration and in the declared browser-source exception; and assert the
declaring location contains exactly one such literal, so neither its prose nor a
second constant can restate it. Independently, assert every component the browser
source names by bare specifier is under the scope in use and appears as a
reference in the freshly generated workspace document, and that this set is not
empty.

These checks are unconditional: they run and must pass on any machine, since
their subject is what the repository says, not what is installed on it.
