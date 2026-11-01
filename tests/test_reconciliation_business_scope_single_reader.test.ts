import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

/**
 * **The platform-tenant setting has exactly two readers** (story-7102ffe3 —
 * AC-2124).
 *
 * WHY THE TYPESCRIPT PARSER AND NOT A REGEX. A read is a syntactic fact —
 * `env.TENANT_ID`, `env['TENANT_ID']`, a destructure, or the property declared
 * on an env interface — and prose in a comment or a string literal mentioning
 * the name is none of those. Parsing each file and walking its AST is the only
 * check that tells the two apart without a per-file exemption list.
 *
 * IT WALKS THE WHOLE SOURCE TREE, generated output included, rather than naming
 * files: the risk is the reader added next month in a file this test has never
 * heard of.
 */

const SRC = path.join(__dirname, '..', 'apps', 'control-app', 'src')
const SETTING = 'TENANT_ID'
const SOURCE_EXT = /\.(ts|tsx|mts|cts|js|mjs|cjs)$/

function sourceFiles(dir: string): string[] {
  const found: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...sourceFiles(full))
    else if (SOURCE_EXT.test(entry.name)) found.push(full)
  }
  return found
}

const nameIs = (node: ts.Node | undefined): boolean =>
  !!node && (ts.isIdentifier(node) || ts.isStringLiteral(node)) && node.text === SETTING

/** True when the file reads (or declares for reading) the setting in code. */
function readsSetting(file: string, text: string): boolean {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
  let found = false
  const visit = (node: ts.Node): void => {
    if (found) return
    if (
      (ts.isPropertyAccessExpression(node) && nameIs(node.name)) ||
      (ts.isElementAccessExpression(node) && nameIs(node.argumentExpression)) ||
      (ts.isBindingElement(node) && (nameIs(node.propertyName) || nameIs(node.name))) ||
      (ts.isPropertySignature(node) && nameIs(node.name)) ||
      (ts.isPropertyDeclaration(node) && nameIs(node.name))
    ) {
      found = true
      return
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}

describe('the platform-tenant setting is consulted only by scope resolution and identity', () => {
  it('test_UAT_AC2124_tenant_id_readers_across_control_app_source_are_exactly_scope_and_identity', () => {
    const files = sourceFiles(SRC)
    // Not vacuous: the walk reached the tree, including nested directories.
    expect(files.length).toBeGreaterThan(10)
    expect(files.some((f) => path.dirname(f) !== SRC)).toBe(true)

    const readers = files
      .filter((file) => {
        const text = fs.readFileSync(file, 'utf8')
        return text.includes(SETTING) && readsSetting(file, text)
      })
      .map((file) => path.relative(SRC, file))
      .sort()

    expect(
      readers,
      'TENANT_ID gained (or lost) a reader. Only the scope resolver and the identity ' +
        'module may read it; everything else takes the business from the resolved Scope.',
    ).toEqual(['identity.ts', 'scope.ts'])
  })
})
