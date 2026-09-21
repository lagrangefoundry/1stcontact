import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Where the L1 conformance corpus lives (REQ-290).
 *
 * ONE DEFINITION SITE, because fourteen suites read this tree and each of them
 * used to derive it from the repository root independently. That was fine while
 * the corpus WAS the repository's own `storage/sites/`: there was nothing to
 * agree about. Now that it is a fixture, fourteen copies of a relative path are
 * fourteen things to update the next time it moves — and a suite that missed the
 * move would not fail loudly, it would find no documents and assert nothing.
 *
 * WHY IT KEEPS REPO SHAPE (`<dir>/storage/sites/<slug>/`). `siteDir` resolves
 * `<cwd>/storage/<root>/<slug>`, so a directory shaped like a repository is
 * readable by `loadSite({ cwd: L1_CORPUS_CWD, root: 'sites' }, …)` with no new
 * code on either side. A flattened fixture would have needed a second path
 * resolver, or rewritten assertions in every suite that reads one. See the
 * README beside this file: the surviving `storage/sites/` segment is a path
 * shape, not a tier.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url))

/**
 * The corpus's repo-shaped root — the `cwd` of a {@link StoreContext} over it.
 *
 * Pair it with `root: 'sites'`. That root value no longer names anything the CLI
 * can reach (REQ-290 pinned every command to `sandbox`); it survives in the type
 * as the address of exactly this fixture.
 */
export const L1_CORPUS_CWD = HERE

/** The three site trees themselves: `<slug>/draft/{site.json,pages/*.json}`. */
export const L1_CORPUS_SITES = path.join(HERE, 'storage', 'sites')
