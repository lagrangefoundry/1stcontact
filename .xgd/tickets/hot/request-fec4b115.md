---
uid: request-fec4b115
id: REQ-312
type: request
title: 'The font catalogue promises 1,941 families whose bytes do not exist: mirror
  + registry platform tier'
created_by: EPIC-21
created_at: '2026-09-23T03:18:55.065108+00:00'
updated_at: '2026-09-23T03:18:55.065108+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-b9b27697
  auto_merge_back: true
  needs_review: false
---

## The gap

[[DOC-56]] tells the assistant 1,941 families are available to serve. **None of their bytes
exist anywhere in the system.** The catalogue is a promise nothing keeps.

Font files today live per-site under `draft/assets/`, and every one of them arrived either
by hand (Satoshi, JetBrains Mono) or as a side effect of a capture. There is no platform
tier at all.

## Operator decision (2026-09-22)

**Platform fonts are platform-wide and shared. Tenant fonts are per-site, uploaded by the
tenant, and the tenant's licence responsibility.**

> "I was assuming this would be platform wide and shared — fonts may be small but copying
> them around is just going to get fiddly."

Copy-on-select is closed. It would have made font takedown an N-tenant sweep with N
rebuilds; shared serving makes it a registry flip plus a purge.

## Wanted

### 1. The mirror

Every OFL 1.1 / Apache 2.0 family in `fonts/catalogue.json`, mirrored into a **shared
platform R2 prefix** and served from a platform origin.

- **Unmodified upstream release `woff2`**, variable where the family ships variable. OFL's
  Reserved Font Name clause says a *modified* version must not carry the reserved name, and
  subsetting is arguably modification. Mirroring upstream bytes sidesteps the question
  entirely. Unicode-range splitting only if byte cost later bites, and then as a decision
  taken knowingly.
- **Eager, not on demand.** Removes cold-start latency on first use of a family, removes a
  runtime dependency on Google's servers at authoring time, and avoids leaking which tenant
  is building what.
- **`LICENSES.txt` served alongside**, carrying each family's copyright notice and licence
  text. OFL requires the notice to travel with the distribution; this is the obligation
  discharged rather than recorded.

### 2. A platform tier in the registry

`fonts/registry.yaml` records provenance per font file and is joined by `1c fonts check`.
It currently describes per-site files only, and hand-writing 1,941 entries is not an
option.

- Platform entries are **generated from the catalogue**, not authored:
  `redistribute_in_product: true` follows from the licence field, so no family needs an
  individual legal decision.
- The registry gains a **tier** distinction — `platform` vs `site` — because the two carry
  different obligations. A platform font is cleared by construction; a site font is
  attested by a tenant we cannot audit.

### 3. `1c fonts check` resolves platform-origin `src`

Today a page pointing at a platform origin URL would be reported `unregistered-file`,
because the check resolves a `src` to an asset basename and looks for it on disk. It must
resolve a platform-origin `src` against the platform tier instead.

The existing four violation kinds keep their meaning for the site tier. The gate that
matters — a `distribution: product` site referencing a font whose
`redistribute_in_product` is not `true` — is unchanged and still fires.

## Behaviour

- Every family listed in [[DOC-56]] resolves to served bytes. A family in the document with
  nothing behind it is the failure this ticket exists to prevent, so the mirror and the
  document are checked against each other.
- A page referencing a platform font passes `1c fonts check` without that font appearing in
  any site's `draft/assets/`.
- A page referencing a platform-origin `src` for a family **not** in the mirror fails the
  check, naming the family.
- `LICENSES.txt` is reachable from the serving origin and names every mirrored family.
- Re-running the mirror against an unchanged catalogue transfers nothing.
- A family removed upstream is reported rather than silently dropped — a live site may be
  serving it.

## Notes

- Five UFL 1.0 families are **excluded** pending individual clearing; their modification
  terms differ from OFL.
- Delisted and sandboxed families are excluded — the live list is the authority.
- Sizing: 1,941 families of unmodified upstream `woff2`, a few hundred MB. Storage is not
  the constraint; correctness of what is served is.
