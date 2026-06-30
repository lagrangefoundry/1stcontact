/**
 * Build-time constants. Kept here so render output is deterministic across
 * rebuilds — modules must never call `new Date()` at render time (a footer
 * rendered twice from the same source must produce byte-identical HTML).
 *
 * `BUILD_YEAR` is the copyright year stamped into the footer.
 */
export const BUILD_YEAR = 2026
