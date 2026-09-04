---
uid: acceptance_criterion-3a59387b
id: AC-1557
type: acceptance_criterion
title: A description is bounded and states in its own text when it was cut short
created_by: xgd
created_at: '2026-09-04T04:12:50.571222+00:00'
updated_at: '2026-09-04T04:23:05.376246+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-724e4e8c
  kind: behavior
  regression_only: false
---

## Criterion

A description is bounded in length, and when it has been cut short it says so in its own text.

A file whose extracted text exceeds the bound yields a description that carries the beginning of
that text, is no longer than the bound plus the notice, and ends with a statement that the text was
truncated and at what length. A description within the bound is stored complete and carries no
notice.

The material's stored bytes are unaffected by the bound: only the description is shortened.

## Verification

Ingest a text-bearing document far larger than the bound. Assert the created material's description
begins with the document's own opening text, ends with an explicit truncation statement naming the
length, and is no longer than the bound plus that statement. Ingest a small document and assert its
description carries no truncation statement. In both cases assert the stored bytes read back at
their original length.