---
uid: comment-f4fb5413
id: COMMENT-4304
type: comment
title: Comment on request REQ-331
created_by: xgd
created_at: '2026-09-29T04:03:31.212889+00:00'
updated_at: '2026-09-29T04:03:31.212889+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-20156646
  kind: note
---

repro-console:repro-faelan-com#4

Issue 5 (single-layer L1 shadow) re-measured on this ticket's own bundle,
`storage/references/faelan.com/index`, iteration 4. **Still open for `textShadow`,
and this bundle's `<h1>` is a live instance of it.**

The source declares two layers on the hero heading — mirrored stylesheet
`assets/index.BM9-dqc-.css`:

```
.header-text[data-astro-cid-j7pv25f6] h1[data-astro-cid-j7pv25f6]{
  font-size:4rem;font-weight:900;color:#fff;
  text-shadow:4px 4px 20px rgba(0,0,0,.9),0 0 40px rgba(255,255,255,.3);
  margin:0;letter-spacing:2px}
```

The capture carries both — `capture.json` → `sections[0].content[0]`:

```
"textShadow": "rgba(0, 0, 0, 0.9) 4px 4px 20px, rgba(255, 255, 255, 0.3) 0px 0px 40px"
```

L1 carries one — `iteration-4/page.json`:

```json
"textShadow": { "offsetXPx": 4, "offsetYPx": 4, "blurPx": 20, "color": "#000000e6" }
```

and the served document (`iteration-4/site/home.html`) emits
`text-shadow: 4px 4px 20px #000000e6`. The white 40px glow — the halo visible
around `FAELAN` in `screenshot.full.png` — is gone.

The schema is still asymmetric between the two shadow axes,
`packages/site-schema/src/l1/schema.ts`:

```
:468  export const l1ShadowSchema = z…
:500  export const l1BoxShadowSchema = z.union([l1ShadowSchema, z.array(l1ShadowSchema).min(2).max(4)])
:1931   textShadow: l1ShadowSchema.optional(),
```

So `boxShadow` takes 2–4 layers (and this bundle's images use it — all four
collage photos carry two-layer `boxShadow` correctly in `page.json`), while
`textShadow` still takes exactly one. Confirming what COMMENT-4043 reported on the
joyfulculinarycreations bundle: the fix landed for `boxShadow` and not for
`textShadow`, and the ceiling item is open.

**Pixel cost on this bundle: not separable.** The `<h1>` is buried under a
collage photograph here (REQ-347 issue 1), so region #1's 5005.72 score is
dominated by the occlusion and the missing glow cannot be measured out of it. The
value cost is 0 deltas either way — `values-diff` compares `textShadow` as a
treatment, and a dropped *layer* of a present shadow is not a presence change.

Also confirmed landed on this bundle this round: issue 1 (the tagline rejoins as
one `text` node with three segments and renders as one `<p>` with an inline `<a>`)
and issue 2 (`stacked: true` is emitted on all four collage images — see BUG-164
for what that now costs the overlap probe).
