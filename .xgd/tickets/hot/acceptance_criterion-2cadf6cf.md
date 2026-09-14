---
uid: acceptance_criterion-2cadf6cf
id: AC-1790
type: acceptance_criterion
title: '1c crop is an offline verb: it is never gated and it crops on a tree with
  nothing installed'
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:19:19.068119+00:00'
updated_at: '2026-09-14T05:19:19.068119+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

`1c crop` is not a gated command. It carries no entry in the set of commands the
install preflight checks, and invoking it never produces an environment refusal.

On a tree where neither the browser automation package nor any imaging package
resolves — including a tree that was never installed at all — `1c crop` gets past
the check and does its own work: it reads the PNG it was given and writes the
cropped PNG, and if it fails it fails on its own terms (a missing input, a format
it cannot read) rather than on the installed tree.

The entry was removed rather than emptied. `crop` opens no browser and its image
decoding is ordinary source in this repository, so its requirement would be the
empty set — and a gate on an empty requirement can only produce a refusal the
operator has no remedy for.

## Verification
On a tree where nothing resolves, and again on a tree where only the browser
automation package resolves, confirm `1c crop` is not refused. Drive a gated verb
(`diff`) on the same tree and confirm it *is* refused with the environment code,
so the contrast is between the two verbs and not between two trees. Confirm the
set of gated commands contains no entry for `crop`.
