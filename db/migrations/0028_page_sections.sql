-- [[REQ-396]] — A PAGE STORED AS A FRAME PLUS ONE ROW PER SECTION.
--
-- A decomposed page keeps its frame where every page has always lived, in
-- `site_pages.page`: the page with its root's children emptied, the ordered
-- list of section ids, and a stub for each module instance a section owns.
-- Each section is one row here, keyed by its stable element id and never by
-- position, so writing one section rewrites one row and leaves every other
-- section, and every address inside it, exactly as it was.
--
-- `unit` is the section's element and the module instances whose slot it
-- hosts, as JSON. The store assembles frame + rows into the single page every
-- reader sees; nothing outside the store reads this table.
--
-- AN UNDECOMPOSED PAGE HAS NO ROWS HERE, which is every page that exists when
-- this runs: nothing is migrated, pages are split on demand.
CREATE TABLE IF NOT EXISTS site_page_sections (
  site_id    TEXT NOT NULL,
  page_name  TEXT NOT NULL,
  section_id TEXT NOT NULL,
  unit       TEXT NOT NULL,
  PRIMARY KEY (site_id, page_name, section_id),
  FOREIGN KEY (site_id) REFERENCES sites (id) ON DELETE CASCADE
);
