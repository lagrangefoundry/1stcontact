-- [[REQ-358]] — THE GROUP CHAT'S SECOND MEMBER IS THE COORDINATOR, AND A ROOM
-- OPENED BEFORE THE RENAME IS RECREATED RATHER THAN RE-KEYED.
--
-- REQ-357 shipped the second member as `assistant`, with a private session
-- `assistant-<site>` homed on a `chat` ticket and listed in its room's roster.
-- REQ-358 renamed it `coordinator`, so the member session is now
-- `coordinator-<site>`. Left alone, a room opened before the rename keeps the old
-- ticket in its roster while the coordinator starts a fresh session beside it:
-- two second members, one of them orphaned, which is BUG-116's shape.
--
-- RECREATED, NOT RE-KEYED. Re-keying would mean rewriting the session id inside
-- the transcript comment's header as well as the ticket — and the member's record
-- stream lives in a junction keyed by the OLD id, which no SQL here can move. A
-- re-keyed session would resume against an empty junction. So the old session,
-- its transcript, and every room listing it are archived: the next open finds no
-- room, creates one with the consultant and the coordinator, and the consultant's
-- own session — the site's conversation — is untouched. Group chat shipped off
-- for everybody the day this was written, so what is archived is a day of
-- testing at most.
--
-- ARCHIVED, NOT DELETED, so it stays readable to the storage layer's own listing
-- (REQ-281) and nothing is lost that somebody might want to look at.
--
-- IDEMPOTENT: every statement skips rows already archived, and the predicate
-- reads the rows' own fields, so running it twice changes nothing the second
-- time. Comments first, then rooms, then the sessions themselves — each
-- statement finds its targets through the sessions, which none of them filter on
-- `archived`, so the order is for reading rather than correctness.

-- The transcripts of the old sessions and of the rooms that list them.
UPDATE tickets
SET archived = 1, version = version + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE archived = 0
  AND type = 'comment'
  AND json_extract(fields, '$.subject_uid') IN (
    SELECT s.uid FROM tickets s
    WHERE s.type = 'chat' AND json_extract(s.fields, '$.session_id') LIKE 'assistant-%'
    UNION
    SELECT r.uid FROM tickets r, json_each(r.fields, '$.members') m
    JOIN tickets s ON s.uid = m.value AND s.tenant_id = r.tenant_id
    WHERE r.type = 'chat'
      AND s.type = 'chat'
      AND json_extract(s.fields, '$.session_id') LIKE 'assistant-%'
  );

-- Every room whose roster names an old session.
UPDATE tickets
SET archived = 1, version = version + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE archived = 0
  AND type = 'chat'
  AND uid IN (
    SELECT r.uid FROM tickets r, json_each(r.fields, '$.members') m
    JOIN tickets s ON s.uid = m.value AND s.tenant_id = r.tenant_id
    WHERE r.type = 'chat'
      AND s.type = 'chat'
      AND json_extract(s.fields, '$.session_id') LIKE 'assistant-%'
  );

-- The old sessions.
UPDATE tickets
SET archived = 1, version = version + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE archived = 0
  AND type = 'chat'
  AND json_extract(fields, '$.session_id') LIKE 'assistant-%';
