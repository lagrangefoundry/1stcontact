---
uid: capability-bcbcdaf1
id: CAP-104
type: capability
title: 'Site Locale Identity: Where A Business Is, And What The Page Declares'
created_by: xgd
created_at: '2026-08-31T12:26:48.368651+00:00'
updated_at: '2026-08-31T12:26:48.368651+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: site_locale_identity
---

# Capability: Site Locale Identity — Where A Business Is, And What The Page Declares

**A site says where its business is, once, as structured data — and everything
that needs to know reads that one answer rather than assuming one.**

Before this capability existed the platform had no notion of place. A site
definition carried a business name, a tagline, contact details and integrations;
the language a page declared to a browser was a fixed literal, written twice, in
two independent renderers. That is not a gap that shows up as an error — it shows
up as a page that quietly claims to be American.

Three properties define this capability:

- **One declaration, one resolution.** A site declares a country, and optionally
  a locale, a currency and a timezone; the last three derive from the country and
  each is individually overridable. They stay four values rather than one because
  they correlate without determining — the same currency in two locales differs
  in symbol placement and in separators. Every consumer resolves through the same
  derivation, so two of them cannot disagree about the same business.

- **An unstated fact stays unstated.** A site that declares nothing resolves to
  the region-free language, not to one country's defaults. The language a page
  declares is what a screen reader uses to choose pronunciation and what a search
  index stores; asserting a region nobody stated puts a fabrication somewhere
  both act on. Anything the platform cannot derive honestly is a validation
  error at a machine-readable path, never a silent fall back.

- **The window closes on publication.** A published revision is an immutable
  snapshot. A wrong language attribute, or a page slug that collides with a
  locale path segment, is baked into artifacts that inbound links and search
  rankings already point at — fixable in the renderer and not in the artifact.
  This capability is therefore expected to be *ahead* of the features that
  consume it, and its reservations are cheap now and impossible later.

**In scope**: a site's declared locale identity and its resolution; the language
and text direction both render paths emit; the locale identity handed to behavior
modules; the validation of both a site's declaration and the platform's own
derivation table; the reservation of locale-shaped page slugs.

**Not in scope**: turning values into text (formatting money and dates is its own
capability, which reads this one), multilingual sites, and any locale path prefix
— the slug reservation protects the shape without adopting it.
