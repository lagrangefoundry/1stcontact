---
uid: acceptance_criterion-ec2bf84f
id: AC-989
type: acceptance_criterion
title: Copy inside a behavior module's presentation slot is read and written through
  the same operation, scoped by instance and slot
created_by: xgd
created_at: '2026-08-07T02:02:45.503091+00:00'
updated_at: '2026-08-16T06:55:35.899823+00:00'
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

A region inside a behavior module's presentation slot is read and edited by the
same operations as a region in the page's own layout, with the addressing scoped
by the module instance and the named slot. This works for both slot shapes — a
repeated slot holding one subtree per item, and a single-subtree slot — and the
edit appears in the rendered page. An address rooted in a module instance that
names no slot is refused, since instance-rooted and page-rooted addresses reuse
the same short forms.

## Verification

For a page carrying a module with a repeated slot and one with a single slot:
read the copy in each through the scoped address and assert the current value;
save a replacement and assert the rendered page contains the replacement and not
the original. Then submit an instance-scoped address with no slot named and
assert it is refused.