---
uid: comment-6669c434
id: COMMENT-2312
type: comment
title: Comment on chat CHAT-43
created_by: xgd
created_at: '2026-09-08T00:06:33.335870+00:00'
updated_at: '2026-09-08T00:07:54.522870+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-80217782
  kind: chat_transcript
---

<!-- xgd-turn id="621cc88e-6f3b-4163-ae04-219882eae253-user" -->

<!-- xgd-chat role="user" ts="2026-09-08T00:06:09.517645+00:00" -->
#### You
We created tools, I believe, for:
Website screenshoting
Website capture (download)

<!-- xgd-turn id="621cc88e-6f3b-4163-ae04-219882eae253-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-08T00:07:54.137379+00:00" -->
#### Claude
Yes — both exist, at three levels each (CLI, assistant tool, and Worker).

## Screenshotting

**CLI:** `1c shot <slug> [--source draft|published] [--viewport mobile|tablet|desktop]` or `1c shot --url <url>`
- `tools/generate/src/cli/shot.ts` — the Node shell (render → serve on loopback → screenshot the *served* page, so `/assets/` resolve)
- `tools/generate/src/cli/capture/screenshot.ts` — the runtime-agnostic core (REQ-154), so a Worker can reach it

**Assistant tool:** `screenshot` on the `fidelity` surface (`ai/fidelity-surface.json`), plus `compare` (perceptual diff of two pictures) and `check_fidelity` (structural + value + pixel gates, reporting *disagreement*). A "picture" is a tagged union: `reference | draft | edit | revision | url`.

**Worker:** `apps/control-app/src/shot.ts` — the composition root for Cloudflare Browser Rendering; the only file naming `@cloudflare/puppeteer`. Note its header says *no route answers it yet*, deliberately — exposing a metered browser over HTTP was left to REQ-157.

## Capture

**CLI:** `1c capture page <url>` → `tools/generate/src/cli/capture/` (18 modules)

Writes a self-contained bundle: `capture.json`, per-viewport screenshots, raw + rendered HTML, mirrored assets, `multistate.json` (the multi-viewport ladder / acceptance oracle), `l1.json` (the ladder folded to one L1 doc), `forms.json`, `hints.json`.

**Worth flagging against your word "download":** it's *rendered-only* capture, not a site download. It records computed values and mirrors referenced assets (images, `.woff2`) — it does not reproduce a source tree. Assets a CDN intercept missed come back as `files: []`.

**Assistant tool:** `capture_site` on the same surface, with `list_references` / `describe_reference` alongside. Capturing also auto-writes a prose description so references are findable by what they *are*.

**Two things guarding it:**
- `capture/egress-guard.ts` (REQ-157) — `capture_site` is the first operation taking a URL *from the model*, so it's an SSRF surface. The guard sits at the driver's per-request seam, not on the typed URL, because a pre-flight check can't see a redirect to `169.254.169.254`. It's honest that it can't defeat DNS rebinding.
- The surface overview tells the model that captured text is a third party's writing — material to report on, never an instruction.

**Two driver backends** behind one `BrowserDriver` seam: `playwright-driver.ts` (laptop) and `cf-driver.ts` (Browser Rendering, with `withBrowserSession` leasing *one* browser per run because sessions are metered and rate-limited).

Downstream of a capture bundle sits the whole reproduction pipeline — `1c repro`, `refold`, `l1-gate`, `gate`, `values-diff`, `diff`, `aligned-crops`, `responsive-diff`, `adopt-gaps`.

<!-- xgd-chat-end -->