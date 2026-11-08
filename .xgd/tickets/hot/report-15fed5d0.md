---
uid: report-15fed5d0
id: REPORT-11614
type: report
title: 'Report: mode_override for story-58b2cec4'
created_by: xgd
created_at: '2026-11-08T23:32:16.774006+00:00'
updated_at: '2026-11-08T23:39:42.113686+00:00'
completed_at: null
last_field_updated: files_touched
fields:
  report_kind: mode_override
  subject_uid: story-58b2cec4
  anchor_ticket: bundle-7ba3af93
  rule: code_frozen
  batch_index: 1
  parent_report_uid: report-42f82769
  quality_mode: reconcile
  justification: 'REQ-218, the latest intent in scope on this surface, requires the
    1c host to say it holds no Library and the no-image-store deployment to refuse
    as ENVIRONMENT; the reference leaves both unwired in picture.ts and does not settle
    the question the other way, so the settled AC-2487 test is right and the code
    is wrong. This is batch 1, not the batch 0 denied by report-07babd4a (REPORT-6909):
    that denial judged an earlier-bundle REQ-157 port into host-core/fidelity-core/ai/router/shot
    for AC2031/AC2034/AC2025 on a trust-boundary finding; this grant is a different
    AC and intent, excludes fidelity-core.ts, and has no trust-boundary component
    (precedent REPORT-11603).'
  files:
  - tools/generate/src/cli/picture.ts
  - tools/generate/src/cli/image-library.ts
  rung: 1
  tip_evidence:
  - file: tools/generate/src/cli/picture.ts
    lines: 214-233
  - file: tools/generate/src/cli/picture.ts
    lines: 462-479
  - file: tools/generate/src/cli/picture.ts
    lines: 498-503
  external_cause: null
  planner_trust_boundary: false
  granted_head: 127d2b56a3076bb5df59e796215c0d78dc8e2de0
  files_touched:
  - tools/generate/src/cli/image-library.ts
  - tools/generate/src/cli/picture.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
---

# Mode override granted: code_frozen

REQ-218, the latest intent in scope on this surface, requires the 1c host to say it holds no Library and the no-image-store deployment to refuse as ENVIRONMENT; the reference leaves both unwired in picture.ts and does not settle the question the other way, so the settled AC-2487 test is right and the code is wrong. This is batch 1, not the batch 0 denied by report-07babd4a (REPORT-6909): that denial judged an earlier-bundle REQ-157 port into host-core/fidelity-core/ai/router/shot for AC2031/AC2034/AC2025 on a trust-boundary finding; this grant is a different AC and intent, excludes fidelity-core.ts, and has no trust-boundary component (precedent REPORT-11603).

Planner instructions for the batch:

AC-2487 states REQ-218 intent and its UAT (tests/reconciliation-assistant-sees-a-stored-picture.test.ts:593) is correct; do not edit it. code_frozen is lifted for tools/generate/src/cli/picture.ts and tools/generate/src/cli/image-library.ts ONLY; do not edit fidelity-core.ts, host-core.ts, toolbox-core.ts or any other production file. (1) No image store: make the refusal render as `Error: screenshot failed (ENVIRONMENT).` followed by the existing NO_IMAGE_STORE sentence. The reference already carries declared codes from this surface as a `CODE: message` error message (fidelity-core.ts:563 and :690 throw `REFUSED: ...`, which the Toolbox renders as `failed (REFUSED)`); attach ENVIRONMENT to the no-store refusal by that same convention inside picture.ts (on PictureEnvironmentError or where it is thrown at :502), and confirm how PICTURE_INVALID reaches the model before choosing, so there is one error path, not two. (2) Not-found wording: storedImage must know whether this deployment holds a Library namespace. Expose that fact from mergeImageLibraries (image-library.ts), which already knows which parts it was given, on the ImageLibrary port; do not sniff host identity. When there is no Library (the 1c host), the refusal says this host holds no Library pictures, only the site own assets, points at list_assets, and does NOT contain the phrase the name it appears under in the Library. The Worker, which passes both namespaces (router.ts:339), keeps the current sentence exactly, which AC2484 pins. Keep every dependency test green, in particular AC2484, AC2028/AC2033 (PICTURE_INVALID) and AC2024/AC2025 (no-browser and Worker paths). If the fix genuinely cannot be made without editing a file outside the two named, stop and report blocked_by with the file and the evidence rather than editing it.

## Diff

```diff
diff --git a/tools/generate/src/cli/image-library.ts b/tools/generate/src/cli/image-library.ts
index b8801f017e..e3638d2646 100644
--- a/tools/generate/src/cli/image-library.ts
+++ b/tools/generate/src/cli/image-library.ts
@@ -100,6 +100,15 @@ export interface ImageLibrary {
    * added later would be a second shape for callers to learn.
    */
   read(image: StoredImage, opts: { original: boolean }): Promise<Uint8Array>
+  /**
+   * Which namespaces this library holds, when it knows.
+   *
+   * So a refusal can say what this host has instead of pointing at a namespace
+   * it does not hold: the local `1c` has the site's assets and no Library, and
+   * a not-found there must not send the caller looking in the Library. Absent
+   * means unknown, and the refusal keeps naming every place a picture can be.
+   */
+  readonly holds?: readonly StoredImageWhere[]
 }
 
 /** Every spelling one picture answers to, canonical name first. */
@@ -142,8 +151,11 @@ export function resolveStoredImage(name: string, images: readonly StoredImage[])
 export function mergeImageLibraries(
   parts: Partial<Record<StoredImageWhere, ImageLibrary>>,
 ): ImageLibrary {
-  const entries = Object.entries(parts) as [StoredImageWhere, ImageLibrary][]
+  const entries = (Object.entries(parts) as [StoredImageWhere, ImageLibrary | undefined][]).filter(
+    (entry): entry is [StoredImageWhere, ImageLibrary] => entry[1] !== undefined,
+  )
   return {
+    holds: entries.map(([where]) => where),
     async list() {
       const lists = await Promise.all(entries.map(([, library]) => library.list()))
       return lists.flat()
diff --git a/tools/generate/src/cli/picture.ts b/tools/generate/src/cli/picture.ts
index 8bf5840881..a3a3e144a4 100644
--- a/tools/generate/src/cli/picture.ts
+++ b/tools/generate/src/cli/picture.ts
@@ -153,6 +153,13 @@ export class PictureSourceError extends Error {
  * surface's `ENVIRONMENT` refusal already means for a deployment with no browser.
  */
 export class PictureEnvironmentError extends Error {
+  /**
+   * The surface's declared `ENVIRONMENT` code, read by the Toolbox's failure
+   * renderer off the thrown instance — the convention `PageInteractionError`
+   * carries `INTERACTION_FAILED` by — so the model reads this as the same
+   * "cannot do that here; carry on" refusal a deployment with no browser gives.
+   */
+  readonly code = 'ENVIRONMENT'
   constructor(message: string) {
     super(message)
     this.name = 'PictureEnvironmentError'
@@ -350,6 +357,16 @@ async function storedImage(library: ImageLibrary, source: PictureSource): Promis
   // whatever made it, which is the case this whole capability is for — so the
   // refusal names the two listings a caller actually has and the one place a
   // Library handle comes from, rather than a verb that is not there.
+  //
+  // A HOST WITH NO LIBRARY SAYS SO ([[REQ-218]]) rather than sending the caller
+  // to look under a Library name it cannot answer for — the local `1c` holds the
+  // site's own assets and nothing else, and the library it was given says which.
+  if (library.holds && !library.holds.includes('library')) {
+    throw new PictureNotFoundError(
+      `no stored picture called '${name}'. This host holds no Library pictures, only ` +
+        `the site's own assets; name one by its filename or by anything list_assets shows.`,
+    )
+  }
   throw new PictureNotFoundError(
     `no stored picture called '${name}'.` +
       (images.length === 0

```
