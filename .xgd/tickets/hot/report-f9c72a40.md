---
uid: report-f9c72a40
id: REPORT-11978
type: report
title: 'Report: mode_override for story-6ccaedd5'
created_by: xgd
created_at: '2026-11-09T18:11:05.925997+00:00'
updated_at: '2026-11-09T18:17:34.116886+00:00'
completed_at: null
last_field_updated: conformance_verdict
fields:
  report_kind: mode_override
  subject_uid: story-6ccaedd5
  anchor_ticket: bundle-0881342c
  rule: code_frozen
  batch_index: 1
  parent_report_uid: report-b47373ae
  quality_mode: reconcile
  justification: The reference state has a single [images] and a single [env.production.images]
    table; the working tree duplicates both, which makes wrangler.toml invalid TOML
    that wrangler would refuse at deploy. The AC-2537 test is correct and only the
    config can satisfy it.
  files:
  - apps/control-app/wrangler.toml
  rung: 2
  tip_evidence:
  - file: apps/control-app/wrangler.toml
    lines: 440-441
  - file: apps/control-app/wrangler.toml
    lines: 758-761
  external_cause: null
  planner_trust_boundary: false
  granted_head: c59872835e8f40a6d7e04078a0c5747a4ed0ed11
  files_touched:
  - apps/control-app/wrangler.toml
  unnamed_files_touched: []
  trust_boundary_touched: false
  trust_boundary_matches: []
  trust_boundary_notes: []
  trust_boundary_mismatch: false
  conformance_verdict: pass
  conformance_findings: []
---

# Mode override granted: code_frozen

The reference state has a single [images] and a single [env.production.images] table; the working tree duplicates both, which makes wrangler.toml invalid TOML that wrangler would refuse at deploy. The AC-2537 test is correct and only the config can satisfy it.

Planner instructions for the batch:

wrangler.toml is invalid TOML because the REQ-222 cherry-pick appended a second [images] table (line 401) and a second [env.production.images] table (line 480) instead of merging them. Delete the second table of each pair. Fold the REQ-222 width-ladder rationale (optional binding whose absence means no srcset, metered per transform, content-addressed renditions cached under derived/<tenant>/ outside sites/) into the remaining top-level [images] comment, and add [[REQ-221]] and [[REQ-222]] to the citation on the remaining production block, as the reference does. Do not change any binding name or any other table. The AC-2537 test must then parse the file and find binding IMAGES on both sides.

## Diff

```diff
diff --git a/apps/control-app/wrangler.toml b/apps/control-app/wrangler.toml
index 8f1e218f60..7cfae3729c 100644
--- a/apps/control-app/wrangler.toml
+++ b/apps/control-app/wrangler.toml
@@ -342,6 +342,31 @@ binding = "BROWSER"
 # regardless, because REQ-219's recipe renderer uses it for every other image
 # operation.
 #
+# THE DELIVERY WIDTH LADDER A PUBLISH BUILDS ([[REQ-222]]) uses the same
+# binding. `POST /api/publish` freezes the draft and renders it here, in the
+# Worker, and this is what sizes the pictures on the way out: a photograph from a
+# modern phone is several thousand pixels wide, and without this every visitor
+# downloads all of them on their own data. Nothing is resized on request — the
+# ladder is built once, into the revision, and `public-site` serves what is there.
+#
+# FOR THE LADDER, ABSENCE IS NOT A LOUD FAILURE, and the asymmetry is deliberate
+# rather than an omission. `[ai]` missing means the knowledge base knows nothing
+# and `[browser]` missing means the assistant cannot see, so both raise named
+# errors; this missing means a publish carries no `srcset`, which is this
+# repository's publish exactly as it was before the ladder existed and exactly as
+# `1c publish` performs it against an operator's disk. Refusing to publish would
+# take away something that works to protect something that is an optimisation.
+#
+# METERED PER TRANSFORM, which is why renditions are content-addressed on the
+# source bytes and the width, and cached under `derived/<tenant>/` — OUTSIDE the
+# `sites/` root `public-site` resolves, so the cache is unreachable by URL. A
+# republish of an unchanged picture reads the cache and transforms nothing, and
+# publishing is a toolbar button that gets pressed often.
+#
+# DECLARED ONCE PER ENVIRONMENT. TOML forbids defining a table twice, so the
+# HEIC converter and the width ladder share this one declaration (and its single
+# restatement under [env.production]) rather than each adding its own.
+#
 # REPEATED UNDER [env.production] because a named environment inherits NEITHER
 # vars NOR bindings — the rule every other binding in this file records.
 # Forgetting the repeat is not a silent degradation: the deployed Worker sees no
@@ -371,36 +396,6 @@ binding = "IMAGES"
 [ai]
 binding = "AI"
 
-# Cloudflare Images — the delivery width ladder a publish builds ([[REQ-222]]).
-#
-# WHAT IT IS FOR. `POST /api/publish` freezes the draft and renders it here, in
-# the Worker, and this is what sizes the pictures on the way out: a photograph
-# from a modern phone is several thousand pixels wide, and without this every
-# visitor downloads all of them on their own data. Nothing is resized on request
-# — the ladder is built once, into the revision, and `public-site` serves what is
-# there.
-#
-# THE ONE OPTIONAL BINDING WHOSE ABSENCE IS NOT A LOUD FAILURE, and the asymmetry
-# is deliberate rather than an omission. `[ai]` missing means the knowledge base
-# knows nothing and `[browser]` missing means the assistant cannot see, so both
-# raise named errors; this missing means a publish carries no `srcset`, which is
-# this repository's publish exactly as it was before the ladder existed and
-# exactly as `1c publish` performs it against an operator's disk. Refusing to
-# publish would take away something that works to protect something that is an
-# optimisation.
-#
-# METERED PER TRANSFORM, which is why renditions are content-addressed on the
-# source bytes and the width, and cached under `derived/<tenant>/` — OUTSIDE the
-# `sites/` root `public-site` resolves, so the cache is unreachable by URL. A
-# republish of an unchanged picture reads the cache and transforms nothing, and
-# publishing is a toolbar button that gets pressed often.
-#
-# REPEATED UNDER [env.production] because a named environment inherits NEITHER
-# vars NOR bindings — the rule every other binding in this file records. A UAT
-# pins the two sides together so the omission cannot recur unnoticed.
-[images]
-binding = "IMAGES"
-
 [env.production]
 name = "1stcontact-control-app"
 workers_dev = false
@@ -468,14 +463,11 @@ bucket_name = "1stcontact-material"
 [env.production.browser]
 binding = "BROWSER"
 
-# See the top-level block: restated rather than inherited, on purpose (REQ-219).
+# See the top-level block: restated rather than inherited, on purpose (REQ-219,
+# [[REQ-221]], [[REQ-222]]).
 [env.production.images]
 binding = "IMAGES"
 
 # See the top-level block: restated rather than inherited, on purpose (REQ-159).
 [env.production.ai]
 binding = "AI"
-
-# See the top-level block: restated rather than inherited, on purpose ([[REQ-222]]).
-[env.production.images]
-binding = "IMAGES"

```