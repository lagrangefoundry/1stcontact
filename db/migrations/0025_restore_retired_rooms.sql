-- [[BUG-176]] — A ROOM WHOSE MEMBER WAS REPLACED KEEPS ITS TICKET; ONLY ITS
-- ROSTER CHANGES. THIS UNDOES THE PART OF 0024 THAT RETIRED ROOMS.
--
-- 0024 archived every room whose roster named an `assistant-<site>` session, on
-- the reasoning that the next open would find no room and create a fresh one.
-- It could not: a room's session id is fixed per site (`room-<site>`), and the
-- room's JUNCTION lives in the `SessionJunction` Durable Object, which no SQL
-- reaches. The junction survived the archive, so `createGroup` found it and
-- refused — "already has a junction; it is not a new room" — on every open,
-- forever.
--
-- THE ROOM IS RESTORED, NOT RECREATED. Its ticket, its transcript and its junction
-- belong together and are kept together. The retired member is dropped from the
-- roster here, and the coordinator joins on the next open: `openRoom` brings a
-- reopened room's roster to exactly the consultant and the coordinator, which is
-- the one place that knows the coordinator's chat ticket (it may not exist yet,
-- since a session's ticket is minted on its first drain).
--
-- WHAT 0024 RETIRED AND THIS LEAVES RETIRED: the `assistant-<site>` sessions and
-- their transcripts. Nothing will ever open `assistant-<site>` again, so their
-- junctions are kept deliberately — harmless, and the only copy of anything in
-- flight when they were retired.
--
-- ONLY ROOMS WITH NO LIVE SUCCESSOR. A room that a later open did manage to
-- recreate (a site whose junction happened to be gone) already has a live ticket
-- under `room-<site>`; restoring the old one beside it would give one session two
-- homes. Such a room stays archived.
--
-- ONLY WHAT 0024 ARCHIVED. A room's comments are restored only if they were
-- archived with it — at or just before its own archive moment, because 0024
-- archived comments first and rooms second, in one run. A comment archived for
-- some other reason (a chat copy's surplus) keeps its state.
--
-- IDEMPOTENT: comments first while their room is still archived, then the rooms'
-- rosters and flags in one statement. A second run finds no archived room with a
-- retired member and changes nothing.

-- The transcripts archived with those rooms.
UPDATE tickets
SET archived = 0, version = version + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE archived = 1
  AND type = 'comment'
  AND EXISTS (
    SELECT 1 FROM tickets r, json_each(r.fields, '$.members') m
    JOIN tickets s ON s.uid = m.value AND s.tenant_id = r.tenant_id
    WHERE r.uid = json_extract(tickets.fields, '$.subject_uid')
      AND r.tenant_id = tickets.tenant_id
      AND r.archived = 1
      AND r.type = 'chat'
      AND json_extract(r.fields, '$.is_group') = 1
      AND s.type = 'chat'
      AND json_extract(s.fields, '$.session_id') LIKE 'assistant-%'
      AND tickets.updated_at <= r.updated_at
      AND tickets.updated_at >= strftime('%Y-%m-%dT%H:%M:%fZ', r.updated_at, '-60 seconds')
      AND NOT EXISTS (
        SELECT 1 FROM tickets live
        WHERE live.tenant_id = r.tenant_id
          AND live.type = 'chat'
          AND live.archived = 0
          AND json_extract(live.fields, '$.session_id') = json_extract(r.fields, '$.session_id')
      )
  );

-- The rooms, live again, without their retired member.
UPDATE tickets
SET archived = 0,
    version = version + 1,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    fields = json_set(
      fields,
      '$.members',
      json((
        SELECT json_group_array(m.value)
        FROM json_each(tickets.fields, '$.members') m
        WHERE NOT EXISTS (
          SELECT 1 FROM tickets s
          WHERE s.uid = m.value
            AND s.tenant_id = tickets.tenant_id
            AND s.type = 'chat'
            AND json_extract(s.fields, '$.session_id') LIKE 'assistant-%'
        )
      ))
    )
WHERE archived = 1
  AND type = 'chat'
  AND json_extract(fields, '$.is_group') = 1
  AND EXISTS (
    SELECT 1 FROM json_each(tickets.fields, '$.members') m
    JOIN tickets s ON s.uid = m.value AND s.tenant_id = tickets.tenant_id
    WHERE s.type = 'chat'
      AND json_extract(s.fields, '$.session_id') LIKE 'assistant-%'
  )
  AND NOT EXISTS (
    SELECT 1 FROM tickets live
    WHERE live.tenant_id = tickets.tenant_id
      AND live.type = 'chat'
      AND live.archived = 0
      AND json_extract(live.fields, '$.session_id') = json_extract(tickets.fields, '$.session_id')
  );
