/**
 * What the system knowledge base is called, and what it is made of (REQ-158).
 *
 * THREE CONSTANTS, IN A FILE OF THEIR OWN, and the reason is the package
 * boundary rather than tidiness. `kb.ts` — where these used to live and where
 * everything else about the KB still lives — imports `node:fs`, `node:path` and
 * `node:child_process`, because building a corpus is a release-time job on a
 * machine that has a filesystem. `apps/control-app/src/system-knowledge.ts` is
 * the same KB seen from workerd, which has none of those, and
 * `test_UAT_FC_REQ-146_worker_ai_boundary` asserts over the import graph that no
 * module reachable from the Worker names one.
 *
 * So the two halves cannot share a module that touches a disk — and they must
 * share these three values, because they are the same KB. A corpus indexed under
 * one `type` and searched under another does not error; it returns nothing, and
 * looks exactly like a KB with nothing in it. That is the failure this file
 * exists to make impossible: one declaration, imported by both sides, no second
 * literal to drift.
 *
 * `kb.ts` re-exports all three, so every existing importer is unaffected.
 */

/** The knowledge base's name — its key in the config, and its scope axis value. */
export const SYSTEM_KB = 'system'

/**
 * The store name the KB's corpus resolves against.
 *
 * A KB names a SOURCE rather than carrying a store, so "a shipped read-only
 * directory" and "a tenant's D1 store" are the same code path with different
 * sources (DOC-7 §4.2). This is the former; the project KB is the latter and
 * declares no source at all.
 */
export const SHIPPED_SOURCE = 'shipped'

/** The ticket type the corpus selects. Everything we write as a document. */
export const CORPUS_TYPE = 'doc'
