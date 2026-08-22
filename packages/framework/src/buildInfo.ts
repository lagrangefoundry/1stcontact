/**
 * Build-time constants. Kept here so render output is deterministic across
 * rebuilds: a page rendered twice from the same source must produce
 * byte-identical HTML, because a published revision is an immutable R2 snapshot
 * (DOC-12 §7) and is never re-rendered.
 *
 * That rule used to read *"modules must never call `new Date()` at render
 * time"*, which a calendar module — whose whole job is time-varying
 * availability — could not satisfy. REQ-152 resolved the tension without
 * weakening determinism, and the resolution lives in `intl.ts` and DOC-34 §8.4:
 *
 * > Render output stays byte-deterministic. Time-varying content is rendered on
 * > the client or fetched at request time, and is NEVER derived from the render
 * > clock.
 *
 * So the prohibition on reading the clock at render time stands exactly as it
 * did; what changed is that showing a date is no longer mistaken for breaking
 * it. A module formats an instant it was HANDED (`formatDateTime` in `intl.ts`
 * takes one as an argument and has no clock-reading overload), or it emits a
 * mount point plus its data and lets the client resolve "today".
 *
 * `BUILD_YEAR` is the copyright year stamped into the footer.
 */
export const BUILD_YEAR = 2026
