---
uid: acceptance_criterion-a465080d
id: AC-1017
type: acceptance_criterion
title: Each command is gated on exactly what it loads; the offline verbs are never
  gated
created_by: xgd
created_at: '2026-08-07T03:13:38.664103+00:00'
updated_at: '2026-09-14T05:18:55.053025+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

The preflight gates a command on the dependencies that command actually loads, so
a verb is never blocked by a package it does not use.

- The gated set is exactly seven verbs — `capture`, `shot`, `values-diff`,
  `adopt-gaps`, `diff`, `gate` and `aligned-crops` — and every one of them is
  gated for the same reason: it drives a browser. Each runs wherever the browser
  automation dependency resolves, and refuses naming that dependency where it
  does not.
- `crop` is **not** among them. It decodes an image and never opens a browser,
  and its decoding is ordinary source in this repository rather than a declared
  package, so there is nothing it can be missing: it is ungated on a tree where
  only the browser dependency resolves and on a tree where nothing resolves at
  all.
- The offline verbs read and write files only and are **never** gated: `render`,
  `serve`, `builder`, `repro`, `refold`, `l1-gate`, `responsive-diff`, and the
  structured-edit commands. They run on a tree with no dependency present and no
  install at all, and reach their own failures rather than an environment
  refusal.

The gated set is pinned as a whole, so adding a command that launches a browser
without gating it is a visible failure rather than a silent reopening of the gap.
A verb whose requirement would be empty leaves the set rather than carrying an
empty entry: a gate on an empty requirement can only produce a refusal the
operator has no remedy for.

## Verification
Against a tree where the browser automation dependency resolves, confirm each of
the seven gated verbs passes the check. Against a tree where nothing resolves,
confirm each of the seven refuses, that the refusal names the browser automation
dependency, and that it names no imaging package. Confirm `crop` is refused on
neither tree. On a tree with nothing installed, confirm every offline verb still
runs, and that at least one of them reaches its own failure (an unusable
reference bundle) rather than an environment refusal. Assert the gated set equals
exactly the seven verbs above.
