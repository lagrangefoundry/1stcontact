---
uid: report-483291fe
id: REPORT-11323
type: report
title: 'Report: mode_override for story-39c992d3'
created_by: xgd
created_at: '2026-11-08T06:57:36.645080+00:00'
updated_at: '2026-11-08T07:10:19.006554+00:00'
completed_at: null
last_field_updated: conformance_verdict
fields:
  report_kind: mode_override
  subject_uid: story-39c992d3
  anchor_ticket: bundle-c0301347
  rule: code_frozen
  batch_index: 0
  parent_report_uid: report-a313553e
  quality_mode: reconcile
  justification: REQ-208 is in scope and requires that no error sentence the model
    sees names the image vendor. AC-2380 covers the unsupported-shape path. The code
    leaks 'openai' there, so the test is right and imagegen.ts must scrub the vendor
    from the error text.
  files:
  - apps/control-app/src/imagegen.ts
  rung: 1
  tip_evidence:
  - file: apps/control-app/src/imagegen.ts
    lines: 27-32
  - file: apps/control-app/src/imagegen.ts
    lines: 677-720
  external_cause: null
  planner_trust_boundary: false
  granted_head: 994c842a380878694aa546ed798df44bb0d8b197
  files_touched:
  - apps/control-app/src/imagegen.ts
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
  conformance_verdict: pass
  conformance_findings: []
---

# Mode override granted: code_frozen

REQ-208 is in scope and requires that no error sentence the model sees names the image vendor. AC-2380 covers the unsupported-shape path. The code leaks 'openai' there, so the test is right and imagegen.ts must scrub the vendor from the error text.

Planner instructions for the batch:

Production code is unfrozen for apps/control-app/src/imagegen.ts only (override below). The unsupported-shape (21:9) tool result names the vendor through the plugin's 'The host reports: Backend "openai" ...' detail. No other path leaks. In imagegen.ts, where imageSurface() composes the create_image plugin (next to the existing meteredDraws wrapper), make every tool error the model reads vendor-free: no IMAGE_PROVIDER and no backend model id. Keep the declared sentence 'That is not a shape this generator offers' and keep the list of supported ratios, because the shape ACs depend on them. Do not edit the generated ai-imagegen.js, which is gitignored and rebuilt. Do not edit the framework plugin either, because it is outside the override. Do not change AC-2380 or its test. All sibling AC tests and the REQ-208 FC tests must stay green.

## Diff

```diff
diff --git a/apps/control-app/src/imagegen.ts b/apps/control-app/src/imagegen.ts
index 9eb999d5e3..5717dc632f 100644
--- a/apps/control-app/src/imagegen.ts
+++ b/apps/control-app/src/imagegen.ts
@@ -263,6 +263,65 @@ export function generatedMaterialStore(
   }
 }
 
+/** Every occurrence of `find` in `text`, matched without regard to case, becomes `replacement`. */
+function replaceIgnoringCase(text: string, find: string, replacement: string): string {
+  const haystack = text.toLowerCase()
+  const needle = find.toLowerCase()
+  let out = ''
+  let from = 0
+  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, from)) {
+    out += text.slice(from, at) + replacement
+    from = at + needle.length
+  }
+  return out + text.slice(from)
+}
+
+/** The operations the model can call, whose failures it reads. */
+const IMAGE_OPERATIONS = ['create_image', 'edit_image'] as const
+
+/**
+ * Keep the vendor out of every failure the model reads (property 1 above).
+ *
+ * The plugin's declared error sentences are vendor-free, but the runtime appends
+ * the host's own detail after them ("The host reports: …"), and the framework's
+ * detail for an unsupported shape reads `Backend "openai" does not support …`.
+ * So each operation's failure is rewritten here, at the one place this file
+ * composes the plugin: the backend phrase becomes "This generator", and any
+ * remaining vendor or model name becomes "the generator". The error keeps its
+ * code and class, so the declared sentence and the rest of the detail (the
+ * ratios the generator does offer) still reach the model.
+ */
+function vendorless(surface: Untyped, names: string[]): void {
+  // Longest first, so a model id that contains the vendor name is replaced whole.
+  const words = [...new Set(names.filter((n) => n.length > 0))].sort((a, b) => b.length - a.length)
+  if (words.length === 0) return
+  const scrub = (text: string): string => {
+    let out = text
+    for (const word of words) {
+      out = replaceIgnoringCase(out, `Backend "${word}"`, 'This generator')
+    }
+    for (const word of words) out = replaceIgnoringCase(out, word, 'the generator')
+    return out
+  }
+
+  for (const op of IMAGE_OPERATIONS) {
+    const original = surface[op]
+    if (typeof original !== 'function') continue
+    surface[op] = async (...args: unknown[]): Promise<unknown> => {
+      try {
+        return await original.apply(surface, args)
+      } catch (error) {
+        if (error instanceof Error) {
+          error.message = scrub(error.message)
+          const detail = (error as { detail?: unknown }).detail
+          if (typeof detail === 'string') (error as { detail?: unknown }).detail = scrub(detail)
+        }
+        throw error
+      }
+    }
+  }
+}
+
 /** What a caller may substitute, so the capability is provable with no key. */
 export interface ImageSurfaceOptions {
   /**
@@ -340,7 +399,9 @@ export function imageSurface(
   if (surfaces.length === 0) return null
 
   const surface = surfaces[0]
-  model = String(surface.backend().model)
+  const backend = surface.backend()
+  model = String(backend.model)
+  vendorless(surface, [IMAGE_PROVIDER, String(backend.name ?? ''), model])
   // THE GRANT TRAVELS WITH THE SURFACE, unlike fidelity's, which is an entry in
   // `instances.json`. Two reasons, and the second is the load-bearing one.
   //

```