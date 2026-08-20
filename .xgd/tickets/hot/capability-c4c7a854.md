---
uid: capability-c4c7a854
id: CAP-101
type: capability
title: 'Site Storage Port: One Async Store Behind Every Edit'
created_by: xgd
created_at: '2026-08-20T05:08:07.064393+00:00'
updated_at: '2026-08-20T05:08:07.064393+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: site-storage-port
---

Storage is something the platform *asks*, not somewhere it *is*.

Every operation the site-editing surface needs from storage is declared once, as a small,
total, asynchronous set of questions and one whole-change write. No operation hands back a
filesystem location: assets cross as bytes, and a page is named by a store key that carries
no directory component. Because the set is small and total, the thing behind it can change
without any command, any error envelope, or any test changing with it.

Two implementations are live and current at the same time, neither a legacy mode and neither
detected at runtime — the one chosen at start-up is the one the whole process uses:

- the operator's git-tracked site tree on their own machine, and
- a store with no filesystem behind it at all.

The second is not a mock. It holds real definitions, applies real writes, keeps a real change
count and validates through the same assembly path. Driving the whole editing surface against
it is what turns "no command depends on the filesystem" from a reading of a diff into a
property that is checked every time the suite runs.

This capability also owns the runtime the claim is checked in: tests run in two runtimes,
routed by filename alone, one of which is the Workers runtime with real D1 and R2 bindings and
the same compatibility settings the deployed Workers declare — so a store proved here is
proved where it will run.
