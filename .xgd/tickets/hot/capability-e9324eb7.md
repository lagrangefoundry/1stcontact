---
uid: capability-e9324eb7
id: CAP-113
type: capability
title: 'Material Library Surface: Seeing, Correcting And Adding The Client''s Own
  Material'
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:16:40.357097+00:00'
updated_at: '2026-09-11T05:16:40.357097+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: Material Library Surface
---

Everything the client has given us — photographs, logos, fonts, brand guidelines, positioning
papers, and eventually captures of their own previous site — is held as material with a written
description of what it is. Until this capability existed the builder could see none of it, and
there was no way to put a byte into the platform from a browser at all.

This capability owns the two client-facing surfaces over that material:

- **The Library.** A tab of its own beside the site, listing everything the client's account
  holds — including material bound to their other sites and material bound to none — with the
  current site as a badge and a filter rather than a boundary. Selecting a piece of material
  shows the file itself and the record of what we hold and what may be done with it. The one
  thing the client may change is what the material **says**: the description is editable, and a
  correction reaches retrieval rather than just the screen.
- **Adding material from the browser.** The gesture that puts a file into the platform, and the
  single question it asks — what the file is *for* — because the content type already answers
  what kind of file it is, and nothing else answers what the client wants done with it.

The rights record is shown and never asked for. "Do you own this?" is a legal question the
client frequently cannot answer, so provenance answers it and the client is asked only about
their own intention. That is why this capability displays rights read-only while making the
description freely editable.

What this capability is NOT: the pipeline that stores, classifies, describes and indexes a file
(material ingestion), the store the material and its bytes live in (the client material store),
the knowledge base built over them, or the site asset picker — which chooses a value for a field
rather than managing the client's material.
