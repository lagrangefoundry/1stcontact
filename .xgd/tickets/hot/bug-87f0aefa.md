---
uid: bug-87f0aefa
id: BUG-30
type: bug
title: relativizeUrl turns /#frag into a same-page anchor, breaking cross-page links
created_by: xgd
created_at: '2026-07-31T00:45:39.331427+00:00'
updated_at: '2026-08-06T19:46:26.825134+00:00'
completed_at: '2026-08-06T19:46:26.825134+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: de4090ff226e69d6e57757d3481ab92673e0c9a9
    reconcile_sha: null
    main_sha: null
  version: 0.1.9
  story_points: 2
  bundled_in: bundle-e0143ffa
  chat_comment: comment-02316013
---

## Symptom

A root-relative link carrying a fragment is rewritten into a same-page fragment, so cross-page
anchor navigation silently points at the wrong document.

Authored `/#how` on `/whitepapers` renders as `href="#how"` — "the `how` anchor on *this* page"
rather than on the site root. The anchor does not exist on that page, so the link does nothing.

Found authoring xgd.dev's second page (CHAT-12). **It is undetectable on a single-page site**,
where `#how` and `/#how` resolve identically — which is why it has survived.

## Cause

`relativizeUrl` (`packages/framework/src/l1/render.ts:115`), added by REQ-109 to make a rendered
snapshot relocatable:

```ts
function relativizeUrl(v: string): string {
  if (!v.startsWith('/') || v.startsWith('//')) return v
  return v.slice(1) || './'
}
```

`slice(1)` is right for `/assets/x.svg` → `assets/x.svg`. It is wrong for `/#how` → `#how`, because
dropping the slash changes the *base* the fragment resolves against, not merely the path shape.

The function's own docstring already contains the argument against its behaviour. On the bare-`/`
case it explains that `''` would resolve to the current *page*, "which is a different target once
the page is not `index.html`" — and returns `./` for exactly that reason. `/#frag` has the same
defect and did not get the same treatment.

## Suggested fix

Treat a remainder that begins with `#` the same way the bare-slash case is already treated:

```ts
const rest = v.slice(1)
if (rest === '' || rest.startsWith('#')) return `./${rest}`
return rest
```

`/#how` → `./#how`, which resolves against the snapshot directory (i.e. `index.html`) from any
page. Relocatability is preserved — this stays document-relative, no leading slash reintroduced.

## Please check the rest of the sink while here

REQ-109's relativization is applied at more than one sink (`render.ts:1611` node links,
`render.ts:1765` image `src`, `render.ts:138` CSS `url()`). This ticket is the fragment case, but
the broader question is worth answering once rather than per-symptom:

- **Query strings.** `/x.svg?v=3` → `x.svg?v=3` is fine, but confirm nothing else depends on the
  leading slash. The site currently uses `?v=` cache-busting on grid assets.
- **The flat-snapshot invariant.** The docstring says dropping the slash "is only correct because
  every page sits FLAT at the snapshot root; `renderSite` asserts that invariant." Now that sites
  genuinely have more than one page, verify that assertion still holds and still fires — a nested
  page would make every rewritten URL wrong at once.
- **A page that is not `index.html`.** All of the above reasoning is about relative bases, and
  every case changes meaning once the current document is not the root. That condition was
  unreachable until xgd.dev grew a second page, so none of it has been exercised.

## Acceptance criteria

- **AC1** — `/#frag` renders as a link that resolves to the site root page's fragment from any
  page in the snapshot, not the current page's.
- **AC2** — asset relativization is unchanged: `/assets/x.svg` still emits `assets/x.svg`, and the
  snapshot still resolves correctly when served from a path prefix.
- **AC3** — the `//host` protocol-relative guard still holds; no leading-slash reintroduction.
- **AC4** — a UAT covers the two-page case specifically, since the single-page case cannot
  distinguish correct from incorrect behaviour.

## Workaround in place

xgd.dev's whitepapers page authors `/index.html#how` and `/index.html#signup`, which relativize to
`index.html#how` and resolve correctly. Remove once this lands.

-


### Update — the adjacent gap above is now closed

The extensionless-URL disagreement flagged in "NOT fixed here" was folded into **REQ-113**, whose
stated goal (preview and production agree on the URL the author writes) it turned out to be. That
ticket's premise — "Cloudflare Pages is the deployment target" — was false; the `public-site`
Worker serves everything. Fixed in `f782ae74a3` (REQ-113, v0.1.10): the Worker now performs the
same extensionless → `.html` mapping, with a trailing slash deliberately excluded to preserve
REQ-109 relative-asset resolution.

`test_UAT_FC_REQ-109_served_under_path_prefix` is green again.