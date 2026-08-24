---
uid: goal-4bb0f66d
id: GOAL-43
type: goal
title: What the backend data model really looks like
created_by: xgd
created_at: '2026-08-24T22:40:09.811456+00:00'
updated_at: '2026-08-24T22:40:09.811456+00:00'
completed_at: null
last_field_updated: created_at
status: concept
fields:
  provenance: discovered
  workstream: false
---

Open question, and the one the other two resolve into: the actual shape of the backend data model.

DOC-5 commits to the substrate -- D1 as the primary product database, R2 for blobs and artifacts, KV for low-criticality distributed values, Durable Objects for per-site coordination -- and lists the entity names: users, accounts, sites, site configuration, pages, sections, theme tokens, leads, contacts, customers, invoices, payments, subscriptions, monitoring events, audit events, automation tickets, magic-link tokens. It does NOT commit to the schema. Exact D1 schema is the first item in its own Open Architecture Questions list.

Since then the picture has grown in ways DOC-5 did not anticipate: L1 site definitions, chat sessions, the two knowledge bases, reference capture bundles, and uploaded assets. Several of those have no home in the entity list.

Also unsettled from DOC-5: whether site snapshots live in D1, R2, or both.

The forcing constraint is the revision model -- everything versioned forward-only, a revision being an immutable snapshot of the entire site including assets and metadata, the live site always the latest revision. That shapes every table it touches, so settling it early is cheaper than retrofitting.

This is a real blocker: the KM core system and asset storage both need it decided before they can be built properly rather than provisionally.