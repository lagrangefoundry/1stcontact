---
uid: acceptance_criterion-f77d415d
id: AC-1234
type: acceptance_criterion
title: Renaming an entry moves the key in place and rewrites every reference in one
  write; positions and transparency survive and the site renders byte-identically
created_by: xgd
created_at: '2026-08-20T01:20:13.700020+00:00'
updated_at: '2026-08-20T01:50:35.937118+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ee073693
  kind: behavior
  regression_only: false
---

## Criterion

Renaming an entry moves the name **and rewrites every reference to it** in one write, so that
afterwards:
- the palette declares the new name and not the old one;
- no reference to the old name survives anywhere in the site definition or any page;
- the number of references to the new name equals the number the old name had;
- the position within the colour family and any transparency carried by each reference survive
  exactly as they were — only which entry a reference names changes;
- the site still validates and renders **byte-identically** to before the rename;
- the renamed entry occupies the position the old name held in the stored palette's order, so a
  palette an operator has arranged keeps that arrangement.

## Verification

Seed a site whose pages reference one entry three times — once as stored, once lighter, once
darker — and capture the rendered output. Rename the entry, then assert: the palette declares the
new name in the old name's position and no longer declares the old; no page contains a reference
to the old name; exactly three references name the new one; the three positions read back in the
same order and values as before; and the re-rendered output is identical to the captured one.