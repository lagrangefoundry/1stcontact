---
uid: capability-745b9a6c
id: CAP-80
type: capability
title: Asset Provenance & Licence Compliance
created_by: xgd
created_at: '2026-08-06T03:28:25.263757+00:00'
updated_at: '2026-08-07T18:54:28.768618+00:00'
completed_at: null
last_field_updated: status
status: superseded
fields:
  name: asset-provenance-compliance
  superseded_by_uid: capability-b4ac88fc
---

# Capability: Asset Provenance & Licence Compliance

Everything that answers **"where did this byte come from and what does its licence
permit"** for the assets the platform serves — and the gates that stop an
unanswered licence question from reaching a customer site.

This capability is distinct from the framework substrate (CAP-70), which binds an
asset *handle* to its served substance and bounds the values around it. Binding is
about pixels; provenance is about obligations. The two questions travel together
on the same file and have entirely different answers, so they are held apart.

## Scope

### Provenance record
A project-level index over every asset file of a governed kind in the repo,
recording origin (family/name, foundry, source URL, download date), licence terms
(name, URL, and the separate permissions the terms grant), outstanding licence
work, and the file list the record covers. Project level rather than per-site,
because a licence obligation attaches to the asset, not to the site that happens
to reference it — while the files themselves stay per-site so a site remains
self-contained and portable.

### The two questions
The load-bearing distinction: *"may we use this on a site we run ourselves"* and
*"may we ship this across ten thousand customer sites"* are different questions
with different answers. Commercial webfont licences are per-licensee; an agency or
hosting platform cannot buy one and share it. The record therefore carries a
three-state answer to the second question — settled yes, settled no, and **asked
but not yet answered** — and every gate treats the unresolved state as *no*, so an
open question cannot leak into product distribution by default.

### Distribution marker
A site declares which question it is asking. A site the platform builds and serves
itself is held to the looser bar; a site asserting it ships as part of the product
across customer domains is held to the strict one.

### Enforcement
Without a gate a provenance record is documentation, and documentation drifts.
The check joins what sites *reference* against the record **and** scans the source
trees for bytes present in the repo that nothing references — the class a capture
bundle produces, whose terms are exactly the least likely to be clear. Outstanding
licence work is advisory; an unanswered redistribution question is blocking. An
absent or malformed record is a hard error, never a vacuous pass.

## Out of scope
Asset *acquisition* (a download-and-register verb), licence purchasing workflows,
per-foundry OEM negotiation, and any runtime enforcement on a published page. This
capability is a build-time compliance boundary, not a serving-time one.