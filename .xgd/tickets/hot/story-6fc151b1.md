---
uid: story-6fc151b1
id: STORY-54
type: story
title: Structural validation of site definitions
created_by: xgd
created_at: '2026-07-08T19:12:44.724841+00:00'
updated_at: '2026-07-09T21:02:08.243814+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-6a071846
  capability_uid: capability-785f2608
  story_kind: upgrade
  story_points: 2
---

## Story
**As a** consumer of the site-definition contract (the framework renderer, the site generator, the control app, and AI tool-call validators), **I want** to submit an arbitrary input and receive a definitive verdict on whether it is a structurally valid site definition — with precise, path-located errors when it is not — **so that** malformed sites are rejected at the boundary before rendering or persistence, and callers can self-correct or surface actionable feedback.

## Description
Provides the foundational data contract for a "site definition": the typed shape of a site (business config, theme tokens, navigation, pages, ordered module instances, and assets) together with a runtime validator that returns a definitive pass/fail verdict over unknown input.

On success the caller receives the validated site value; on failure it receives a list of structural errors, each carrying a JSON-pointer-style path to the offending node and a human-readable message.

**In scope** (structural validation, per DOC-7 §6.5 layer 1):
- Required shape of Site, Page, and ModuleInstance
- Primitive field types (strings, positive integers, hex colors, url/text strings)
- Universal enums (the navigation-pattern set; discriminated navigation-target kinds)
- Theme-token slot completeness (every required token slot present with a value of the correct primitive type)
- Structural uniqueness (module ids unique within a page; page slugs unique within a site)
- Module content-value shapes: each `content` map value is a scalar (string, number, or boolean), an asset reference, a nested typed object (a record of content values — e.g. a services-grid item, a contact-form field, a footer link), or a list of any of these, recursively. This is shape validation only; per-module field names remain the framework's job at render time.

**Out of scope** (deliberately NOT validated here):
- Catalog membership — whether a referenced module `type` is a real module, or whether a `variant`/dial value exists for that module. This is the framework's responsibility at render time.
- Theme-token *values* / defaults (the framework owns defaults), the site-definition file format (JSON/YAML/TOML — the generator's concern), module-specific content schemas, and JSON-Schema export.

## Technical Context
- Structural-vs-catalog boundary is a deliberate design decision (DOC-7 §6.5): the schema validates structure; catalog-correctness is enforced downstream at render time by the framework (see the framework capability, plan items 3–4).
- The theme-token contract validated here is the **REQ-4 superset** as it stands in code, not REQ-3's originally-locked slot list. During implementation the token slots were extended by the framework work (plan item 3, commit 4a8a48): e.g. the palette foreground role was renamed `fg` → `text`; the spacing scale moved to numeric keys; the type scale gained `5xl`; the container token became `narrow`/`default`/`wide`/`bleed`; and typography `weights` and `lineHeights` groups were added. The **slot-completeness contract itself is unchanged** — every required slot must be present with a correct primitive type — so the acceptance criteria assert the contract, not a frozen slot enumeration. Regression will surface the concrete slot set against the code.
- Content values (REQ-23): the module-instance `content` map accepts scalars (string/number/boolean), asset references, nested objects (records of content values), and arrays thereof, recursively. This lets list-based modules (services-grid items, contact-form fields, footer links) persist and round-trip through the validator, with `field.required` (boolean) and `field.maxLength` (number) surviving as real scalars rather than stringified text. An asset content value still validates as an AssetRef because the asset shape precedes the generic record in the value union. Widening the content-value set does NOT open a raw-CSS/HTML escape hatch: the `.strict()` raw-prop rejection on the module instance is untouched, and values remain a closed set of content-value shapes.
- This capability is imported by the framework, the generator tooling, the control app, and (eventually) the persistence layer; it is the shared root of the build stack.

## Dependencies
- Plan item 1 (Platform Scaffold & Deploy Pipeline / CAP-48, STORY-53) — provides the monorepo workspace this package lives in.

## Story Points
2