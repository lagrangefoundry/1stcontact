---
uid: acceptance_criterion-53c66f17
id: AC-978
type: acceptance_criterion
title: A request that tries to escape a served tree is never satisfied, identically
  on the channels and on every artifact prefix
created_by: xgd
created_at: '2026-08-07T01:45:12.257776+00:00'
updated_at: '2026-09-10T10:01:36.277263+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Nothing the workspace origin serves off a file tree satisfies a request that
resolves outside that tree: the response is not a success, and none of the
targeted file's contents come back. Two classes are served that way, and the
criterion asserts over both:

- **The rendered channels** — a site's own pages and assets, addressed under a
  channel prefix and produced when they are asked for.
- **The built-artifact tree** — the one directory the build command writes,
  reached under three prefixes: `/builder/*`, the workspace's own browser
  source; `/webui/*`, the installed components; and `/framework/*.js`, the
  framework bridges and the shared client code the editing gesture runs in the
  displayed page.

The outcome is identical across the channels and across every prefix of the
artifact tree; no prefix lacks the confinement. That clause is why this
criterion exists — confinement present on one prefix and absent on another is
the failure it rules out. Today the three artifact prefixes are resolved at a
single point over a single directory root, so the assertion is what would catch
a prefix that later acquires a resolution path of its own. `/framework/*.js` is
the prefix worth naming rather than leaving to implication: it is the one
carrying the edit client, and it is served through the same fall-through as the
other two rather than off a tree of its own.

The criterion deliberately does not pin *which* refusing status. Confinement is
achieved by clamping an escaping path back inside the tree root, so such a
request resolves to a path that does not exist there and is answered as *not
found* rather than singled out as forbidden. What an operator — or an attacker —
can observe is the guarantee: the targeted file is never served, and every
served prefix behaves the same way.

## Verification

For the rendered channels, and for each artifact prefix — `/builder/`,
`/webui/` and `/framework/` — request a path that escapes the tree's root using
traversal segments (including percent-encoded forms) and assert the response is
a non-success status whose body contains none of the targeted file's contents.
Assert that every probe across every prefix produced the same status, so the
confinement cannot be present on one and missing on another.
