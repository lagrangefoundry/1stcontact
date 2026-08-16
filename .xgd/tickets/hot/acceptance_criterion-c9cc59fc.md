---
uid: acceptance_criterion-c9cc59fc
id: AC-946
type: acceptance_criterion
title: Derived family names describe the colour, and can be renamed to role vocabulary
  from the command line
created_by: xgd
created_at: '2026-08-06T21:08:34.173073+00:00'
updated_at: '2026-08-16T22:25:30.533844+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Every entry the retrofit derives is named after what the colour **is** — a name
describing its hue and intensity (a cool grey ramp, a teal, a cream) rather
than a role it may not play — and two families that would derive the same name
are disambiguated so every entry name in a palette is unique, including families
formed in a later grouping round. Names satisfy the site definition's
entry-naming rules.

Supplying a mapping from derived names to chosen names on the command line
renames those entries in the written palette and in every reference pointing at
them. Renaming changes names only: the entry values, the shade carried by each
reference, and which colour each reference resolves to are all unchanged, so the
retrofit is reproducible from a single command line rather than finished by hand.
A supplied mapping naming a family the derivation did not produce leaves the
palette otherwise intact.

As built, one command line reproduces the whole of `xgd`'s curated role
vocabulary:
`--names slate=text,teal=primary,orange=accent,sand=surface,slate-2=surface-accent,teal-2=primary-bright`.
The last of those exists because the site's brighter teal is both lighter *and*
more saturated than its brand teal, so it is not a shade of it and derives as a
second teal family of its own.

## Verification

Retrofit a site and assert the derived entry names describe their colours and
are unique. Retrofit the same site again supplying a rename mapping for two of
those families, and assert the palette carries the chosen names in place of the
derived ones, that the value under each renamed entry and the shade on every
reference into it are unchanged from the un-renamed run, and that resolving the
converted definition yields the same colours in both runs.
