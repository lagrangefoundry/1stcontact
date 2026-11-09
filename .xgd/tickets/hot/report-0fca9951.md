---
uid: report-0fca9951
id: REPORT-11649
type: report
title: 'Report: mode_override for report-0758e7c5'
created_by: xgd
created_at: '2026-11-09T01:40:31.173931+00:00'
updated_at: '2026-11-09T01:58:49.127106+00:00'
completed_at: null
last_field_updated: conformance_verdict
fields:
  report_kind: mode_override
  subject_uid: report-0758e7c5
  anchor_ticket: bundle-7ba3af93
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-44dcbef8
  quality_mode: reconcile
  justification: REQ-223 s6 and the EPIC-1 2026-09-11 REQ-218 answer, both in scope,
    require a body capped while it is read and a drawing caption warning that letter
    widths and line breaks are not evidence; the frozen code does neither, so the
    code is wrong and the tests are right.
  files:
  - apps/public-site/src/lead.ts
  - tools/generate/src/cli/picture.ts
  - tools/generate/src/cli/ai/fidelity-surface.json
  - tests/test_reconciliation_public_lead_capture.workers.test.ts
  - tests/reconciliation-assistant-sees-a-stored-picture.test.ts
  rung: 1
  tip_evidence:
  - file: apps/public-site/src/lead.ts
    lines: 243-265
  - file: tools/generate/src/cli/picture.ts
    lines: 329-332
  external_cause: null
  planner_trust_boundary: true
  granted_head: 6f7df9a1ea52f2a9dca999d039304610e614179e
  files_touched:
  - apps/public-site/src/lead.ts
  - tests/reconciliation-assistant-sees-a-stored-picture.test.ts
  - tests/test_reconciliation_public_lead_capture.workers.test.ts
  - tools/generate/src/cli/ai/fidelity-surface.json
  - tools/generate/src/cli/picture.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
  conformance_verdict: pass
  conformance_findings: []
---

# Mode override granted: code_frozen

REQ-223 s6 and the EPIC-1 2026-09-11 REQ-218 answer, both in scope, require a body capped while it is read and a drawing caption warning that letter widths and line breaks are not evidence; the frozen code does neither, so the code is wrong and the tests are right.

Planner instructions for the batch:

Nothing is failing; the evidence gap is that AC-2509 (just tightened) and AC-2486 state REQ-223 s6 and EPIC-1 2026-09-11 intent that neither the code nor the tests pin. RED first. In the AC-2509 UAT, add a POST whose body has no content-length and is a ReadableStream that never ends (it enqueues a chunk on every pull), and assert 413, that the stream was cancelled, and that the bytes pulled are no more than MAX_BODY_BYTES plus one chunk. In the AC-2486 UAT, assert the SVG caption says letter widths and line breaks are not evidence. GREEN next. In apps/public-site/src/lead.ts readFields, replace the request.arrayBuffer() read with a reader loop that keeps a running byte count and cancels the stream and returns the existing 413 as soon as the count passes MAX_BODY_BYTES; keep the declared-length precheck and the bytes-then-TextDecoder decode; correct the comment at about :243-245 so it describes the bounded read truthfully. In tools/generate/src/cli/picture.ts, extend DRAWING_RASTER_NOTE to say that letter widths and line breaks in the drawing are therefore not evidence, keeping the default-face and measure_drawing halves, and make the same change wherever fidelity-surface.json carries that caption text. Do not touch multipart handling or bounce/complaint suppression; those stay as divergences recorded in STORY-177. All dependency tests must stay green.

## Diff

```diff
diff --git a/apps/public-site/src/lead.ts b/apps/public-site/src/lead.ts
index 489a725e06..7f79ed4e3e 100644
--- a/apps/public-site/src/lead.ts
+++ b/apps/public-site/src/lead.ts
@@ -242,26 +242,45 @@ async function readFields(
 ): Promise<{ fields: Record<string, string> } | { error: string; status: number }> {
   // THE DECLARED LENGTH IS CHECKED FIRST, so the common oversized case is
   // refused without the bytes ever being read. It is a CLAIM and not a
-  // guarantee, which is why the read below is bounded as well.
+  // guarantee — a chunked body declares nothing — which is why the read below
+  // counts bytes as they arrive and stops at the cap.
   const declared = Number(request.headers.get('content-length') ?? '')
   if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
     return { error: 'That submission is too large.', status: 413 }
   }
 
-  // READ AS BYTES AND DECODED HERE, not `request.text()`. The size limit is a
-  // limit on BYTES, and re-encoding a decoded string to measure it is a second
+  // READ AS BYTES, CAPPED WHILE READING, AND DECODED HERE — not
+  // `request.arrayBuffer()` or `request.text()`, both of which buffer the whole
+  // body before anything can measure it, so a body that never ends is never
+  // refused. The stream is cancelled the moment the running count passes the
+  // cap, so at most one chunk beyond it is ever pulled. The limit is a limit on
+  // BYTES, and re-encoding a decoded string to measure it would be a second
   // answer to how big the body was — one that disagrees with the first for any
-  // input that is not valid UTF-8. (It also spares the runtime's warning about
-  // calling `.text()` on a form encoding, which is a real signal worth not
-  // drowning.)
-  let raw: ArrayBuffer
-  try {
-    raw = await request.arrayBuffer()
-  } catch {
-    return { error: 'That submission could not be read.', status: 400 }
+  // input that is not valid UTF-8.
+  const chunks: Uint8Array[] = []
+  let total = 0
+  if (request.body) {
+    const reader = request.body.getReader()
+    try {
+      for (;;) {
+        const { done, value } = await reader.read()
+        if (done) break
+        total += value.byteLength
+        if (total > MAX_BODY_BYTES) {
+          await reader.cancel().catch(() => undefined)
+          return { error: 'That submission is too large.', status: 413 }
+        }
+        chunks.push(value)
+      }
+    } catch {
+      return { error: 'That submission could not be read.', status: 400 }
+    }
   }
-  if (raw.byteLength > MAX_BODY_BYTES) {
-    return { error: 'That submission is too large.', status: 413 }
+  const raw = new Uint8Array(total)
+  let offset = 0
+  for (const chunk of chunks) {
+    raw.set(chunk, offset)
+    offset += chunk.byteLength
   }
   const body = new TextDecoder().decode(raw)
 
diff --git a/tests/reconciliation-assistant-sees-a-stored-picture.test.ts b/tests/reconciliation-assistant-sees-a-stored-picture.test.ts
index 8bc932dbda..6363286a2e 100644
--- a/tests/reconciliation-assistant-sees-a-stored-picture.test.ts
+++ b/tests/reconciliation-assistant-sees-a-stored-picture.test.ts
@@ -557,6 +557,9 @@ describe('a drawing says how it was photographed, and a stored picture cannot be
     expect(caption.text).toContain('site image wordmark.svg')
     expect(caption.text).toContain("photographed outside the site's own page")
     expect(caption.text).toContain("browser's default face")
+    // EPIC-1 2026-09-11: the caption says what is wrong, not only that something is.
+    expect(caption.text).toContain('letter widths and line breaks')
+    expect(caption.text).toContain('not evidence')
     expect(caption.text).toContain('measure_drawing')
     expect(documentOf(eyes.log.navigated[0])).toContain('src="data:image/svg+xml;base64,')
 
diff --git a/tests/test_reconciliation_public_lead_capture.workers.test.ts b/tests/test_reconciliation_public_lead_capture.workers.test.ts
index e5c898b4d9..0f2e582def 100644
--- a/tests/test_reconciliation_public_lead_capture.workers.test.ts
+++ b/tests/test_reconciliation_public_lead_capture.workers.test.ts
@@ -844,6 +844,33 @@ describe('story-f2e5032c — public lead capture', () => {
       expect([label, await response.text()]).not.toEqual([label, ACK])
     }
     expect(pulled).toBe(false)
+
+    // A body with no declared length that never ends: the read is capped while
+    // it happens (REQ-223 §6, "a large body must be rejected rather than read"),
+    // so the stream is cancelled once the cap is passed rather than buffered.
+    const CHUNK = 1024
+    let pulledBytes = 0
+    let cancelled = false
+    const endless = new ReadableStream<Uint8Array>(
+      {
+        pull(controller) {
+          pulledBytes += CHUNK
+          controller.enqueue(new Uint8Array(CHUNK).fill(0x20))
+        },
+        cancel() {
+          cancelled = true
+        },
+      },
+      { highWaterMark: 0 },
+    )
+    const unending = await send(
+      new Request(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: endless }),
+    )
+    expect(unending.status).toBe(413)
+    expect(await unending.text()).not.toEqual(ACK)
+    expect(cancelled).toBe(true)
+    expect(pulledBytes).toBeLessThanOrEqual(MAX_BODY_BYTES + CHUNK)
+
     expect(limited).toHaveLength(0)
     expect(verifications).toHaveLength(0)
     expect(await anyAddress('mal@example.com')).toBe(0)
diff --git a/tools/generate/src/cli/ai/fidelity-surface.json b/tools/generate/src/cli/ai/fidelity-surface.json
index ac3ec6d91d..a3bab9c3ef 100644
--- a/tools/generate/src/cli/ai/fidelity-surface.json
+++ b/tools/generate/src/cli/ai/fidelity-surface.json
@@ -197,7 +197,7 @@
       "tool": "screenshot",
       "effect": "read",
       "summary": "Take a picture of any of the six things, and look at it.",
-      "description": "The image comes back to you as an image. You are looking at the page, not reading a description of it.\n\nLarge pictures are reduced before you see them — a full-page shot of a long page is scaled down so that its longest edge is manageable. That costs you nothing you could have used: fine detail is not what a picture is for here. When you need to judge something small, take the picture at the viewport it matters at and use `compare` for the measurement.\n\nOne picture at a time. If you are asking whether two things match, `compare` answers that better than two screenshots and your own recollection of the first one.\n\n**A picture says which channel it is of, and what that channel does not do.** An `edit` picture is of the page as your user is editing it, and that channel ships no behaviour — panels, carousels and disclosures show their settled state and nothing on it opens or submits. The picture tells you so. Do not reason about what a visitor would see from a picture that says it is not showing you that.\n\n**To photograph something a visitor has to reach by doing something, say so in `after`.** A modal, a carousel's third slide, a form's success state — all of them are a `draft` picture with a step or two in front of it, and the state you get is the real one, produced the way a visitor produces it.\n\n**A picture in the store comes back as a picture, the same as a page does.** One you generated, one your client uploaded, an SVG you drew — you are looking at it rather than reading a description of it, which is the difference between judging a picture and taking somebody's word for it. It is reduced on the way in exactly as a page shot is.\n\n**Looking at a picture is deliberate and it is not free.** The image stays in this conversation for every turn after this one, so look when you have a reason to — when your client is asking about that picture, when you have just changed it, when you are about to place it and its shape matters. Not after every generation on the chance it went wrong.\n\n**A drawing is photographed outside the site's own page**, so its text is in the browser's default face rather than the one the site serves — the picture says so. `measure_drawing` is what reads where anything in a drawing actually is; looking is not a substitute for measuring.",
+      "description": "The image comes back to you as an image. You are looking at the page, not reading a description of it.\n\nLarge pictures are reduced before you see them — a full-page shot of a long page is scaled down so that its longest edge is manageable. That costs you nothing you could have used: fine detail is not what a picture is for here. When you need to judge something small, take the picture at the viewport it matters at and use `compare` for the measurement.\n\nOne picture at a time. If you are asking whether two things match, `compare` answers that better than two screenshots and your own recollection of the first one.\n\n**A picture says which channel it is of, and what that channel does not do.** An `edit` picture is of the page as your user is editing it, and that channel ships no behaviour — panels, carousels and disclosures show their settled state and nothing on it opens or submits. The picture tells you so. Do not reason about what a visitor would see from a picture that says it is not showing you that.\n\n**To photograph something a visitor has to reach by doing something, say so in `after`.** A modal, a carousel's third slide, a form's success state — all of them are a `draft` picture with a step or two in front of it, and the state you get is the real one, produced the way a visitor produces it.\n\n**A picture in the store comes back as a picture, the same as a page does.** One you generated, one your client uploaded, an SVG you drew — you are looking at it rather than reading a description of it, which is the difference between judging a picture and taking somebody's word for it. It is reduced on the way in exactly as a page shot is.\n\n**Looking at a picture is deliberate and it is not free.** The image stays in this conversation for every turn after this one, so look when you have a reason to — when your client is asking about that picture, when you have just changed it, when you are about to place it and its shape matters. Not after every generation on the chance it went wrong.\n\n**A drawing is photographed outside the site's own page**, so its text is in the browser's default face rather than the one the site serves — the picture says so, and its letter widths and line breaks are therefore not evidence of how the drawing looks on the site. `measure_drawing` is what reads where anything in a drawing actually is; looking is not a substitute for measuring.",
       "params": {
         "of": {
           "type": "picture",
diff --git a/tools/generate/src/cli/picture.ts b/tools/generate/src/cli/picture.ts
index a3a3e144a4..bd7b703c9e 100644
--- a/tools/generate/src/cli/picture.ts
+++ b/tools/generate/src/cli/picture.ts
@@ -322,14 +322,17 @@ function drivableSteps(source: PictureSource): PageStep[] {
  * page, so the `@font-face` rules the site serves are not in scope and its text
  * resolves in the browser's default face. On a wordmark that is a visible
  * difference and exactly the kind of thing a model would otherwise report as a
- * finding about the drawing. Written here for the same reason
+ * finding about the drawing — so the caption says what is wrong (letter widths
+ * and line breaks are not evidence), not only that something is (EPIC-1,
+ * 2026-09-11). Written here for the same reason
  * {@link EDIT_CHANNEL_NOTE} is: it is a fact about how the picture was made, not
  * about any one operation on it.
  */
 export const DRAWING_RASTER_NOTE =
   'This is a drawing, photographed outside the site\'s own page, so its text is ' +
-  'in the browser\'s default face rather than the one the site serves. Use ' +
-  '`measure_drawing` to read where anything in it actually is.'
+  'in the browser\'s default face rather than the one the site serves — so the ' +
+  'letter widths and line breaks you see here are not evidence of how it looks ' +
+  'on the site. Use `measure_drawing` to read where anything in it actually is.'
 
 /**
  * Which stored picture `image` names, refusing by name when it is not one.

```