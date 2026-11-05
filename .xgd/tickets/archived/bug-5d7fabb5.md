---
uid: bug-5d7fabb5
id: BUG-345
type: bug
title: 'ticketing: query materialises every ticket of a type before filtering, so
  a keyed lookup costs the whole corpus'
created_by: EPIC-32
created_at: '2026-11-04T19:54:38.916195+00:00'
updated_at: '2026-11-04T20:06:16.100738+00:00'
completed_at: null
last_field_updated: status
status: abandoned
fields:
  severity: high
  priority: high
  auto_merge_back: true
  needs_review: false
---

## Symptom

`ReadSlice.query` (`components/ticketing/js/src/read_slice.js`) pushes only a bare `type=` equality into `_scan`. It then loads **every record of that type** into memory and filters, sorts and paginates afterwards. `limit: 1` doesn't help, because the load happens before the filter.

A lookup such as `type=comment AND fields.kind=… AND fields.subject_uid=…` therefore costs the size of the whole comment corpus. One such lookup per item, run in parallel, is what crashed 1stcontact's dev worker at about 1.4 GB: 1,616 Library items each scanning about 640 KB of comments, about 2 GB of live heap. That is 1stcontact BUG-341, which was worked around there with one shared scan. Any caller that queries per item hits the same multiplier.

## Fix

- **Push every equality term down to `_scan`** (not just `type`), so a backing store that can narrow by field does so before materialising. 1stcontact's store sits on D1 and can use indexed columns or JSON paths.
- **With no `sort` and a `limit`, stop scanning** once the page is full.
- Stores that can't narrow keep today's behaviour, unchanged in semantics.
- Python peer (`ticketing_simple`) in the same change: JS and Python stay in sync.

## Test plan

UATs in JS and Python with a store holding 10,000 tickets of one type:
- a three-term equality query with `limit: 1` reads at most the matching records, counted through a counting store adapter;
- the results are identical to today's for every predicate in the existing query suite.

Filed from 1stcontact EPIC-32 (execution architecture and performance). DOC-1 item 35 there requires lookups that do not scale with the corpus.