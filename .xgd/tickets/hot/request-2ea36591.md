---
uid: request-2ea36591
id: REQ-109
type: request
title: 'Rendered output is not relocatable: normalise asset URLs to document-relative'
created_by: xgd
created_at: '2026-07-30T19:34:47.469373+00:00'
updated_at: '2026-07-30T20:13:45.105165+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 2
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: c72e50b4650dce77f04e65844f265ea0e7a990f0
    reconcile_sha: null
    main_sha: null
  version: 0.1.5
---

## The gap

Rendered output is **not relocatable**: it only works when served from a host
root. The renderer emits root-absolute asset URLs, so the same bytes cannot be
served under a path prefix.

From `storage/dist/sites/xgd/draft/index.html`:

```
href="./theme.css"                       ← relative, fine
src="./capabilities.js"                  ← relative, fine
url("/assets/satoshi-400.woff2")         ← ROOT-ABSOLUTE, inside CSS url()
url("/assets/xgd-grid-hero.svg?v=3")     ← ROOT-ABSOLUTE
```

Served from `1stcontact.io/site/xgd/draft/<sha>/`, every `/assets/…` reference
resolves against the apex and 404s. `<base href>` is **not** a fix: it does not
apply to `url()` inside CSS, which is exactly where the font and image
references live.

The absolute form originates in the authored L1 document — `storage/sites/xgd/draft/pages/home.json`
literally contains `"/assets/satoshi-400.woff2"` in its resource table.

## Why this matters beyond hosting

Relocatable output is what makes a rendered snapshot **content-addressable**. If
the serving URL is baked into the bytes, promoting a draft snapshot to published
requires a re-render rather than a pointer flip, and the same content deployed
at two URLs is two different artifacts. Relocatability is the precondition for
the immutable snapshot model in [[DOC-12]].

It also removes a Cloudflare dependency: proxied **wildcard** DNS records are
plan-dependent, and without relocatable output every draft preview needs its own
hostname. With it, previews live under a single apex path.

## Proposed change

Normalise root-relative URLs to **document-relative** at the emission sinks.
One rule, applied identically at all three:

```
relativizeUrl(v):
  starts with "/" and not "//"  →  v.slice(1)    "/assets/x.svg" → "assets/x.svg"
  otherwise                     →  unchanged     absolute URLs, "#anchor", "//host" untouched
```

The three sinks in `packages/framework/src/l1/render.ts`:

| Sink | Line | Emits |
|---|---|---|
| `cssUrl` | 105 | `url("…")` — fonts, background images |
| `<img>` | 1735 | `src="…"` |
| link `href` | 1581 | `href="…"` — internal page links |

Applied **after** the existing safety checks (`isSafeUrl`, `CSS_URL_ALLOWED`), so
validation semantics are unchanged and the security envelope is untouched. The
`not //` guard is explicit defence: `//evil.com/x` must never become
`/evil.com/x`.

**The authored L1 face does not change.** Sites keep writing `/assets/…`; only
the emitted bytes change. No site definition is edited, so no reproduction
ticket is disturbed.

### Flatness invariant

Stripping the leading `/` is correct only because every rendered page sits flat
at the snapshot root (`index.html`, `home.html`). If nested page paths are ever
introduced, a depth-aware prefix (`../`) is required. Assert flatness at render
time and fail loud rather than emit silently-wrong relative URLs.

## Non-goals

- No change to the authored L1 schema or to any site definition.
- No base-path or host configuration on the renderer — the artifact stays
  location-independent, which is the entire point.

## Acceptance

- `test_UAT_FC_<TICKET>_relative_asset_urls` — rendered output for `xgd` contains
  no `url("/…")` and no `src="/…"`; the same references appear as `assets/…`.
- `test_UAT_FC_<TICKET>_absolute_urls_untouched` — `https://…`, `//host/…`, and
  `#anchor` values pass through unmodified.
- `test_UAT_FC_<TICKET>_served_under_path_prefix` — the rendered directory served
  from a nested path resolves every asset (no 404s), verified against the same
  bytes served from a root.
- `test_UAT_FC_<TICKET>_nested_page_fails_loud` — a page that would render below
  the snapshot root raises rather than emitting a wrong relative URL.
- Security envelope unchanged: the existing renderer-hardening and injection
  tests pass untouched.

## Risk

Emitted bytes change, so the fidelity and round-trip gates need re-baselining on
both `xgd` and `gigabytealchemy`. This is the whole cost of the ticket. Captured
`url()` values resolve to absolute URLs in the browser, so the capture side
should be unaffected — verify rather than assume.

## Dependencies

None. Prerequisite for the path-based preview URL used by the R2 artifact store
and the public-site Worker (this session's other two tickets). Relates to
[[DOC-12]] (storage model) and [[DOC-2]] (renderer security policy).