---
uid: acceptance_criterion-5b2178b0
id: AC-1556
type: acceptance_criterion
title: How a description turned out, and what produced it, are queryable on every
  material
created_by: xgd
created_at: '2026-09-04T04:12:49.508947+00:00'
updated_at: '2026-09-04T04:23:05.529570+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-724e4e8c
  kind: behavior
  regression_only: false
---

## Criterion

Every piece of material carries, as queryable state, both how its description turned out and what
produced it — so material with no real description is found by asking for it rather than by
re-reading every record.

Specifically:

- The outcome is present on every material, including successful ones, and is one of the six
  distinguished values (a real description; nothing configured to look; nothing to extract; nothing
  here can read it; too large to look at; reached and failed).
- The producer is present on every material as a stated value, naming what wrote the description
  where something did and stated as empty where nothing did — so a query over it never has to treat
  absence as a third state.
- Asking for the material whose descriptions are not real returns exactly those records, and no
  record that carries a real description.
- No material's description is ever an empty body: a degraded description is written prose naming
  what is missing, plus the file's own name, declared type and size, and the address it came from
  where it was retrieved rather than handed over.

## Verification

Ingest a mixture of material producing several different outcomes. Assert each created record
carries an outcome value and a producer field (the latter stated-as-empty for degraded ones), that
querying by outcome returns exactly the expected subset in each case, and that every record's
description is non-empty and names the file. Assert a retrieved file's description also names the
address it came from.