---
uid: story-66115f6b
id: STORY-96
type: story
title: 'Clean page URLs: the link an author writes resolves the same in local preview
  and on the deployed site'
created_by: xgd
created_at: '2026-08-06T19:02:03.988902+00:00'
updated_at: '2026-08-09T13:50:17.326111+00:00'
completed_at: null
last_field_updated: uat_coverage
status: completed
fields:
  intent_uid: bundle-e0143ffa
  capability_uid: capability-a12e557f
  story_kind: feature
  story_points: 2
  uat_coverage: pass
---

## Story

**As an** author writing links into a site's navigation, **I want** the clean URL I
write — `/whitepapers`, not `/whitepapers.html` — to resolve to that page both when
I preview the site locally and when a visitor loads it from the deployed site,
**so that** I can trust the environment in front of me and never bake a file
extension into the site to work around a disagreement between the two.

## Description

A page authored with the slug `whitepapers` renders to a file named
`whitepapers.html`. The URL an author naturally writes into the nav is
`/whitepapers`. This story is the mapping that makes that URL work — and,
specifically, the *agreement* between the two places a site is ever served from:
the local preview command and the deployed public site.

The agreement is the capability, not the mapping. Either environment alone is a
trap: the author writes the correct link, sees it fail in whichever environment
they are looking at, and "fixes" the site by baking `.html` into the authored
content — the wrong fix, applied to the wrong layer, at permanent cost to every
URL the site will ever have. A defect of exactly this shape is what this story
closes, and it was closed only when both halves changed.

In scope:

- **The mapping.** When a request resolves to nothing and its last path segment
  carries no extension, the page named by that path plus `.html` is served
  instead. This holds in the local preview server and on the deployed site, for
  both the preview (snapshot-addressed) and published addressing forms, and for
  full and header-only requests alike.
- **Exact matches always win.** The mapping is a last resort, consulted only
  after everything that resolves today has failed to. Nothing that resolves
  before the mapping exists starts resolving somewhere else because of it.
- **Extensions are never eligible.** Only the last path segment is examined for
  an extension, so a dotted intermediate segment does not disable a clean page
  URL, while a missing asset keeps returning not-found instead of quietly
  returning page markup under an image or stylesheet type.
- **A response produced by the mapping is typed from the page that answered**,
  because an extensionless request path offers nothing to type from.
- **A directory-shaped URL is never eligible on the deployed site.** This is
  correctness, not tidiness: rendered pages reference their assets
  document-relatively, so the request URL's directory is what every one of those
  references resolves against. Serving a page at `…/whitepapers/` would resolve
  them all one level too low and hand the visitor an unstyled page — the same
  failure the snapshot root's redirect exists to prevent.
- **No existing guard is loosened.** In the local preview server, confinement to
  the served site's directory is unchanged and the mapping is applied to the
  already-confined path, so it cannot reach a page outside it. On the deployed
  site, the URL grammar's rejections — invalid site names, empty, dot-shaped,
  separator-bearing and malformed segments — all still reject, and a rejected URL
  never serves page markup.

Out of scope: the deployed site's route grammar, addressing, caching and privacy
behaviour (its own story in this capability); the relocatable document-relative
asset emission this mapping's trailing-slash exclusion protects (documented
against the L1 emitter story); and cleaning the already-authored `.html` links
out of existing site content.

## Technical Context

- Depends on the serving story (STORY-95) for the addressing forms and guards the
  deployed half of this mapping sits inside, and on the relocatable-output rule
  documented against STORY-83 — the trailing-slash exclusion exists precisely
  because asset references are emitted document-relative.
- **Corrected intent, recorded rather than absorbed.** The source intent
  (REQ-113) rested on a premise later found to be false: that the deployment
  target auto-served `.html` at the clean URL, making the preview server the only
  broken half. There is no such component anywhere in the serving path — the
  deployed site serves every byte out of the artifact store — so the real state
  was the *inverse*: the clean URL worked in preview and returned not-found in
  production. The intent's stated goal (the two environments agree) was reached
  only when the production half was changed too, and the story documents that
  corrected intent. A stale in-code comment still cites the original premise as
  the preview server's rationale; that is documentation drift, not behaviour.
- **A known asymmetry that is not a disagreement.** The local preview server also
  resolves a bare directory to that directory's own index page, and prefers it
  over the mapping; the deployed site has no directory concept at all. No URL a
  rendered site can actually produce distinguishes the two, because rendered
  pages are emitted flat and that invariant is asserted at render time
  (documented against STORY-83). Should rendered output ever gain nesting, this
  asymmetry becomes a real divergence and this story is where it must be
  re-settled.
- Eligibility on the deployed site is a property of the URL alone and is settled
  before any stored bytes are consulted; only the lookup of the mapped page
  happens in the request path. That is an internal arrangement — the ACs below
  are all observable at the CLI and HTTP boundaries.
- **Follow-up left undone by the source intent:** the authored `.html` links in
  the operator's own site content, and the same-page-anchor workaround BUG-30
  documented, were both left in place when this landed (in-flight uncommitted
  authoring). Both are now unblocked by this story but are content changes, not
  behaviour.

## Dependencies

- Plan item 4 (STORY-95, deployed-site serving) — hard: half of this story's
  behaviour is observable only through that story's addressing forms and sits
  behind its guards.

## Story Points

2