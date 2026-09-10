import fs from 'node:fs'
import path from 'node:path'
import { CATALOG } from '@1stcontact/framework/worker'

/**
 * Precompiling the behavior modules' chrome (REQ-145).
 *
 * WHY THIS EXISTS. `getModuleCss()` and `getModuleClientJs()` read each module's
 * chrome and `client.js` off disk, *at render time*, for every site — not
 * only for sites that use a module. So the render could not run in workerd at
 * all, which the ticket had not anticipated: the L1 renderer really is portable,
 * but `renderSiteFiles` folds this CSS into every `theme.css` it emits, and a
 * page served without it renders unstyled.
 *
 * Rather than give the Worker a second, thinner render — which is the one thing
 * `render.ts` exists to prevent — the READ moves to build time. Only *when* the
 * bytes are read has moved; the composition below is the composition the
 * filesystem readers performed.
 *
 * THE OUTPUT IS COMMITTED, and a UAT re-extracts and compares. A generated file
 * that can go stale silently would serve last week's module CSS with nothing to
 * signal it; a failing test is how that surfaces instead. This is the same
 * bargain the import map takes — derive it, commit it, prove it current.
 *
 * WHAT REQ-148 CHANGED. The CSS used to be scanned out of each module's `.astro`
 * `<style>` block by a regex with two documented footguns (a doc comment that
 * merely *mentions* `<style>`; a self-closing `<style set:html>` with no closing
 * partner). The components are plain TypeScript now and their chrome lives in a
 * real `styles.css` beside them, so the scanner is gone and this step reads two
 * files per module — symmetric with `client.js`, and greppable as CSS.
 *
 * The *components* no longer need precompiling at all: a behavior renders in
 * workerd because it is a plain function, not because a build baked it.
 */

/** Where the module sources live, relative to the repo root. */
const MODULES_DIR = 'packages/framework/src/modules'

/** Where the generated file lands, relative to the repo root. */
const GENERATED = 'packages/framework/src/modules/module-assets.ts'

/**
 * One behavior's `client.js`, scoped so it cannot collide with another's (BUG-75).
 *
 * WHAT WENT WRONG WITHOUT IT. The parts were spliced together with `join`, into
 * one module scope. `contact-form`, `account-portal` and `account-chrome` each
 * declared a top-level `const ERROR_SELECTOR` — three private names that happened
 * to agree — and two `const`s of one name in one scope is a *parse* error. The
 * browser discarded the whole bundle before running a line, so every behavior
 * died, including the ones whose names never collided. It failed that way for
 * five days: each `client.js` is unit-tested on its own by importing the source,
 * and the REQ-145 UAT compares the generated file to its inputs, so nothing
 * anywhere parsed the composed result.
 *
 * WHY A BLOCK RATHER THAN A RENAME. Renaming `ERROR_SELECTOR` fixes this
 * collision and waits for the next one. These identifiers are private to their
 * file, nothing about authoring a behavior says the namespace is shared, and a
 * convention that must be remembered by every future module is not a fix. A
 * block gives each behavior its own lexical scope, so two of them may declare the
 * same top-level name and the bundle still parses. `const`, `let`, `class` and —
 * in a module, which is always strict — `function` are all block-scoped, and no
 * `client.js` uses `var`, which is the one form that would still escape.
 *
 * WHY STRIPPING `export` IS FREE. `export` is not legal inside a block, so the
 * wrap requires dropping it, and the bundle loses nothing: it is self-wiring —
 * every behavior ends with its own DOM-ready auto-init — and nothing imports it.
 * The exports exist for the unit tests, which import each `client.js` directly
 * and never see this transform. Only a statement-leading `export` at column 0 is
 * touched; every export in every `client.js` is a top-level `export function` or
 * `export async function`, and none is indented, re-exported or defaulted.
 */
export function scopeBehaviorJs(id: string, js: string): string {
  const body = js.replace(/^export\s+/gm, '')
  return `/* behavior: ${id} */\n{\n${body}\n}`
}

export interface ModuleAssetBuild {
  /** The generated file's path, relative to the repo root. */
  file: string
  /** Module ids that contributed CSS, in catalog order. */
  css: string[]
  /** Module ids that contributed client behaviour, in catalog order. */
  clientJs: string[]
}

/**
 * The two strings, composed exactly as the filesystem readers composed them.
 *
 * Catalog order, deduplicated by id — `CATALOG` is what `registry` derives its
 * order from, and iterating the contracts rather than the components keeps this
 * build step independent of anything renderable while producing the identical
 * sequence.
 */
export function composeModuleAssets(repoRoot: string): {
  css: string
  clientJs: string
  cssIds: string[]
  clientJsIds: string[]
} {
  const dir = path.join(repoRoot, MODULES_DIR)
  const seen = new Set<string>()
  const cssParts: string[] = []
  const jsParts: string[] = []
  const cssIds: string[] = []
  const clientJsIds: string[] = []

  for (const meta of CATALOG) {
    if (seen.has(meta.id)) continue
    seen.add(meta.id)

    const stylesFile = path.join(dir, meta.id, 'styles.css')
    const css = fs.existsSync(stylesFile) ? fs.readFileSync(stylesFile, 'utf8').trim() : ''
    if (css) {
      cssParts.push(`/* module: ${meta.id} */\n${css}`)
      cssIds.push(meta.id)
    }

    const clientFile = path.join(dir, meta.id, 'client.js')
    if (fs.existsSync(clientFile)) {
      const js = fs.readFileSync(clientFile, 'utf8').trim()
      if (js) {
        jsParts.push(scopeBehaviorJs(meta.id, js))
        clientJsIds.push(meta.id)
      }
    }
  }

  return { css: cssParts.join('\n\n'), clientJs: jsParts.join('\n\n'), cssIds, clientJsIds }
}

function literal(value: string): string {
  // A template literal would have to escape `${`, and module CSS and client JS
  // are both allowed to contain one. JSON.stringify produces a double-quoted
  // string literal that is valid TypeScript and needs no second escaping rule.
  return JSON.stringify(value)
}

/** Regenerate the committed file. Returns what it contributed. */
export function buildModuleAssets(repoRoot: string): ModuleAssetBuild {
  const { css, clientJs, cssIds, clientJsIds } = composeModuleAssets(repoRoot)
  const source = `// GENERATED by \`1c assets\` (REQ-145). Do not edit.
//
// The behavior modules' static chrome, read from their \`styles.css\` and
// \`client.js\` sources at BUILD time so that \`theme.css\` and \`capabilities.js\` can be
// composed in a runtime with no filesystem. See tools/generate/src/cli/module-assets.ts
// for why, and the REQ-145 UAT for the check that this file still matches its
// sources.

/** Every catalogued module's static \`<style>\` content, in catalog order. */
export const MODULE_CSS = ${literal(css)}

/** Every catalogued behavior's \`client.js\`, in catalog order. */
export const MODULE_CLIENT_JS = ${literal(clientJs)}
`
  fs.writeFileSync(path.join(repoRoot, GENERATED), source)
  return { file: GENERATED, css: cssIds, clientJs: clientJsIds }
}
