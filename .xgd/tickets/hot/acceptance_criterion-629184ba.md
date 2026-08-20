---
uid: acceptance_criterion-629184ba
id: AC-1314
type: acceptance_criterion
title: 'Capture-time font settling: a post-settle web-font barrier, mirrored faces
  offline, and a real-painted-face fontLoaded probe'
created_by: xgd
created_at: '2026-08-20T04:39:05.904089+00:00'
updated_at: '2026-08-20T05:40:52.743324+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pending
---

## Criterion
The reference value set is measured against the face the page really paints, not a fallback — the **capture-side** half of the fontLoad problem, complementary to (not a restatement of) the diff-side FOUT suppression, which handles only the residue this barrier cannot reach. Three mechanisms:

**(a) A web-font barrier immediately before extraction and screenshot.** The barrier runs *after* the page has been scrolled and settled, not only at navigation: a face first needed by a revealed below-fold run starts loading only after the early `document.fonts.ready` await has already resolved, and would otherwise still be a fallback at measure time. The barrier force-loads every visible run's **exact** face — family, real weight, style, and the run's own text, so a subsetted webfont fetches the subset it actually paints — then awaits `document.fonts.ready`. Generic keywords are skipped, and identical face+text requests are issued once. Every wait is **bounded**, so a face that genuinely 404s or times out cannot hang the capture; it stays unresolved and is honestly reported `fontLoaded: false` rather than silently assumed loaded.

**(b) Mirrored faces served on the offline re-extraction path.** Captured HTML/CSS references cross-origin webfonts by their live absolute URL, which never reaches the loopback server, so offline the mirrored `@font-face` never loads and the run is measured against the fallback. Every absolute `http(s)` URL inside a served text asset whose **basename is a mirrored asset** is rewritten to a loopback-relative `/<basename>` — precise by construction, so a live URL with no mirror is left to fail exactly as before — and an **extensionless CSS mirror** (a Google Fonts `css2` response) is served as `text/css` so the browser accepts the stylesheet.

**(c) A `fontLoaded` probe of the real painted face.** The load check is built from the full font shorthand — style plus the run's **real numeric weight** plus size — and is passed the run's own text, rather than a bare size-and-family that implies weight 400/normal. A run painting a weight the page never loaded therefore reports `fontLoaded: false` instead of a false `true`.

The invariant this defends: a value set captured against the wrong face silently corrupts `font-family` *and* every glyph-derived metric — box width, height, line-height, and the geometry keyframes derived from them — so a perfectly faithful reproduction reproduces the wrong thing and no downstream axis can tell.

## Verification
Capture a page whose below-fold section is the only user of a webfont face; assert that face's runs record `fontLoaded: true` and their captured `fontFamily` and box metrics match those measured with the face pre-warmed — i.e. the below-fold run is not measured against the fallback. Capture a page referencing a face whose URL 404s and assert the capture completes within its bound and reports `fontLoaded: false` for that run rather than hanging or claiming `true`. Re-extract a written bundle offline whose HTML references a mirrored webfont by absolute URL; assert the request is served from the mirror and the run's `fontLoaded`/family/metrics match the live capture, and assert an extensionless mirrored CSS file is served with a `text/css` content type. Assert an absolute URL with **no** mirror is left unrewritten. Capture a run painted at weight 700 where only weight 400 was loaded and assert `fontLoaded: false`.
**Evidence gating.** Mechanism (a)'s post-settle barrier and mechanism (b)'s
end-to-end offline serve (including the extensionless-CSS `text/css` clause, which
is decided inside the re-extract server and has no exported seam) are browser-gated
and skip where no Chromium is provisioned. Two halves run headlessly over real
entry points: mechanism (b)'s URL rewrite (`rewriteMirroredRefs`, including the
no-mirror-left-unrewritten clause) and mechanism (c)'s probe construction — the
full shorthand carrying style, the run's real numeric weight and its size, passed
the run's own text, with an unloaded face reported `fontLoaded: false` rather than
assumed true.
