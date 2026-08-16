---
uid: acceptance_criterion-4bf1f692
id: AC-984
type: acceptance_criterion
title: A rejected edit leaves the draft and the already-rendered page byte-for-byte
  unchanged
created_by: xgd
created_at: '2026-08-07T02:02:22.269537+00:00'
updated_at: '2026-08-16T06:55:29.872259+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

When an edit is refused for any reason — an unaddressable region, a malformed
address, an unacceptable value, a definition that fails validation — the site's
draft definition and its previously rendered output are byte-for-byte identical
to their state before the attempt. Nothing is partially applied and no
re-rendering occurs.

## Verification

Snapshot the bytes of the draft definition and the rendered output. Attempt each
class of rejected edit in turn. After each, re-read both and assert byte
equality with the snapshot.