---
uid: capability-7cf24564
id: CAP-107
type: capability
title: 'Project Knowledge Base: The Client''s Own Corpus, Index & Landscape'
created_by: xgd
created_at: '2026-09-04T03:17:03.422426+00:00'
updated_at: '2026-09-04T03:17:03.422426+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: project-knowledge-base
---

# Project Knowledge Base: The Client's Own Corpus, Index & Landscape

The other half of "what the assistant knows". [[CAP-100]] is the **system** knowledge base —
our design documents, identical for every client, built once at release and sitting above the
tenancy barrier. This capability is **the client's own knowledge**, and it is what makes the
assistant know something about *this* business rather than about websites in general.

## What it is

- A **corpus of the client's own records** — the conversations held with them, the material
  they gave us, the reference sites captured on their behalf, and the brief recording what was
  decided. It is drawn from the client's own store, not from a shipped directory, so it differs
  per client and changes continuously.
- **Tenant-wide, never per-site.** The account is a hard barrier; a site is only a filter. Two
  sites belonging to one client *should* share what has been learned about that client, so the
  corpus deliberately carries no site term.
- A **searchable index that is private by residency.** The index is a derivative of the
  client's confidential material — a vector per brand guideline, a snippet per positioning
  paper — so it lives where nothing can serve it to the public internet, partitioned by
  account, and outside the key space any attachment can address.
- **Kept current incrementally**, as a consumer of what has changed rather than by periodic
  full rebuilds, so keeping the corpus fresh is cheap enough to do on every write.
- A **landscape** of the corpus: a complete listing while the corpus is small enough to read in
  full, and a clustered map of described territories once it is not.

## Boundaries

- **Membership is what the client's record is**, not an opt-in flag — the four record kinds
  above are the corpus, by declaration.
- Each host serves the knowledge bases it can actually resolve. A host holding only the shipped
  design-document corpus does not offer the client's corpus at all, rather than offering it and
  finding it empty.
- Assembling the landscape into a conversation's priming, and streaming per-turn changes into a
  live session, are **not** here.
