---
uid: capability-20802191
id: CAP-112
type: capability
title: 'Material Ingestion: How A File Becomes Stored, Described, Findable Material'
created_by: martin-github@westhead.me
created_at: '2026-09-11T04:05:33.075711+00:00'
updated_at: '2026-09-11T04:05:33.075711+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: Material Ingestion
---

Before this capability there was no way to put a byte into the platform at all. It owns the
path from a file — one the client hands us, or one we pull on their behalf — to a piece of
material that is stored, understood well enough to be found, and reachable by the assistant
the moment it lands.

Four concerns live here:

- **The pipeline.** Storing the bytes, classifying what the file is and what may be done with
  it, recording it as material whose body is its description, and announcing it for indexing —
  with the ordering and the refusals that make each of those safe to interrupt.
- **Description.** What the system understands a file to be, which is the only thing that makes
  it findable: extracted text for documents, a written description for images, a font's own
  name for a font, and an honest account of the reason when none of those is possible.
- **Guarded retrieval.** Material fetched on the client's behalf, behind a guard, because
  fetched content becomes corpus the assistant reads as well as a network request the platform
  makes.
- **Promotion.** The gate in front of moving a piece of material into a site's public asset
  library, which publishes it under the client's own domain and is refused unless the rights
  record allows it.

Rights are **inferred from provenance and never asked**: a per-file "do you own this?" is a
legal question the client frequently cannot answer, so the platform answers it from where the
file came from and forbids the dangerous action outright instead.

What this capability is NOT: the store the material tickets and their bytes live in (that is
the client material store), the knowledge base and index built over them, or the Library
surfaces that list and correct them. This capability is what creates material; those own where
it lives, how it is searched, and how it is shown.
