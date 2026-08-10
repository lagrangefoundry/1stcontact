---
uid: capability-00e77e55
id: CAP-92
type: capability
title: 'Site Control Surface: Declared, Granted, Validated & Audited'
created_by: xgd
created_at: '2026-08-10T09:04:25.561174+00:00'
updated_at: '2026-08-10T09:04:25.561174+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: site_control_surface
---

# Capability: The Site Control Surface — Declared, Granted, Validated & Audited

**Everything that can describe or change a site is declared once, in one place, as
data: what each operation is for, what it takes, what comes back, how it fails,
and what is deliberately impossible. A consumer is then granted a deliberately
narrower slice of it, every argument is checked before it reaches the site, every
read is marked as somebody else's prose, and every call is written down.**

This capability owns the *contract* between the platform and anything that acts on
a site on someone's behalf — most immediately the builder's assistant, but the
declaration is not written for one consumer. It is distinct from the conversation
that uses it (CAP-90) and from the pane the operator watches (CAP-91): those are
the surface a person sees, this is the governed contract behind it.

## Scope

- **The declaration** — the operations, their parameters and return shapes, the
  error taxonomy with caller-facing meanings, effect-homogeneous capability
  groups, worked sequences, declared absences, the addressing rule, and the
  surface's own version. Data, checkable before anything runs.
- **The grant** — a separate statement of which capability groups a given
  consumer gets. The whole surface can be documented and validated while a
  narrower slice is what any one consumer can reach.
- **Validation before invocation** — arguments are checked against the
  declaration before any value reaches the write path.
- **Provenance** — site content re-entering a model's context is marked as
  third-party, and the marking is explained rather than left to be inferred.
- **Audit** — one record per call: which operation against which site, with which
  arguments, allowed or refused and by which rule, and what became of it.
- **One write path** — the surface is a caller like the command line and the
  click-to-edit form. It reaches the same validated, all-or-nothing write, and
  gains no way past it.

## Not in scope

- The conversation that consumes the surface (CAP-90) or the pane it appears in
  (CAP-91).
- The write path itself — its validation, atomicity and re-render are CAP-86's.
- What the surface can reach *into* the page and beyond it, which the authoring
  stories build on top of this contract.
