---
uid: capability-40a5527e
id: CAP-105
type: capability
title: 'Money & Time Presentation: One Formatting Seam'
created_by: xgd
created_at: '2026-08-31T12:37:33.263187+00:00'
updated_at: '2026-08-31T12:37:33.263187+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: money_time_presentation
---

# Capability: Money & Time Presentation — One Formatting Seam

**A stored value becomes text in exactly one place, and that place refuses the
representations whose wrong answer cannot be undone.**

Two capabilities that do not exist yet — payments and calendar — each have to
turn a stored value into a string a customer acts on. Both have a wrong answer
that is *unrecoverable* rather than merely expensive, and both would otherwise
invent their own. This capability exists ahead of them so neither has to.

Three properties define it:

- **Derived, never authored twice.** A price is held once as a minor-unit
  integer plus a currency code and *derived* for display; a moment is held once
  as an absolute instant plus a zone id and *derived* for display. A module that
  hand-rolls a symbol or a division is authoring a second number, and a shown
  price that differs from the charged price is a legal exposure, not a cosmetic
  bug.

- **The lossy representations are refused, not accepted and repaired.** Scale
  comes from the currency's own minor-unit count rather than a fixed two;
  exactness survives past the range where floating-point division drops a unit;
  a zone-less wall-clock string is rejected rather than silently reinterpreted as
  whichever zone the machine that ran the render happened to be in. Each refusal
  is loud, at the boundary, before anything plausible-looking is produced.

- **The determinism rule is an API, not a reminder.** A published revision is an
  immutable snapshot and is never re-rendered, so a moment derived from the
  render clock is wrong the following day and cannot self-heal. Render output
  stays byte-deterministic; time-varying content is resolved on the client or at
  request time. The seam has no way to format "now", so a module reaching for it
  cannot accidentally make its output depend on when it ran.

Reading a site's declared locale, currency and timezone belongs to Site Locale
Identity (CAP-104). This capability is what turns those declared facts into
text: the identity is useful with no formatter, and the formatter is exercisable
with no site.
