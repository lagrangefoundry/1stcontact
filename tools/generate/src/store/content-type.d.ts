/**
 * The typed face of {@link ./content-type.js}.
 *
 * WHY THE IMPLEMENTATION IS `.js` AND THIS FILE EXISTS ([[REQ-246]]). There were
 * five copies of this table, and the fifth — `tools/generate/bin/smoke.mjs` — is
 * the one that genuinely could not import the others: it runs under bare `node`,
 * outside every bundler in this repo, and cannot load TypeScript. Its own header
 * said so and called the duplication "pinned by a UAT rather than by hope"; the
 * table beside it in `public-site` said the same thing and drifted anyway,
 * because a pinning test only ever compares the rows both sides happen to have.
 *
 * So the module moved to JavaScript, which every consumer can read — the Workers
 * through their bundler, the CLI through Vite, the tests through Vitest, and the
 * smoke script directly. This declaration is what keeps it typed for the four
 * that are compiled: TypeScript resolves the import to this file and never looks
 * at the implementation, so no `allowJs` is needed anywhere.
 *
 * It is the same seam `apps/control-app/src/builder/*.js` already uses for rules
 * both sides of the browser/server boundary need — one definition, reachable
 * from runtimes that share no toolchain.
 *
 * WHAT DRIFT IS STILL POSSIBLE, and why it is cheap: this file restates the
 * SHAPE, never the table. A signature that falls out of step with the
 * implementation is caught by the compiler at every call site, which is not true
 * of a row that falls out of a duplicated map.
 */

/** The answer for an extension the table does not hold. */
export declare const OCTET_STREAM: 'application/octet-stream'

/** The types a browser will execute on our own origin, as values. */
export declare const ACTIVE_CONTENT_TYPES: readonly string[]

/** Whether a content type is one a browser will run on our own origin. */
export declare function isActiveContentType(type: string): boolean

/** The table, for a test that wants to enumerate it. Not a second reader. */
export declare function contentTypeEntries(): ReadonlyArray<readonly [string, string]>

/** The lowercased extension of a store key or served path, or `''`. */
export declare function extensionOf(name: string): string

/** The content type for a store key or a served path. */
export declare function contentTypeOf(name: string): string
