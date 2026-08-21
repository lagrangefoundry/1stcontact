import importmap from './generated/importmap.json'
import { APP_ID, BOOT_GUARD } from './boot-guard'

/**
 * The chrome document (REQ-145).
 *
 * The import map is DERIVED from each webui component's own `exports` map — it
 * always was — but it is derived at BUILD time now (`1c assets`) rather than by
 * resolving `node_modules` per request, because a Worker cannot resolve
 * `node_modules` at all. The property that mattered is unchanged: nothing here
 * hardcodes a component's file layout, so an upstream move surfaces as a
 * build-time throw instead of a 404 in the operator's browser.
 *
 * The map is imported as JSON and bundled, so serving this document costs no I/O
 * — no fetch into the assets binding, no store read. It is a string.
 *
 * THE BOOT GUARD IS INLINE AND COMES FIRST (REQ-149). Everything below this line
 * can fail in a way that leaves the page blank and says nothing: a 404ed module,
 * an API refusal `main.js` awaits at top level, a throw during mount. The guard
 * is a classic script, so it runs at parse time and has its listeners registered
 * before the deferred module executes — which is what lets it see the module's
 * own load failure. See `boot-guard.ts` for why it is a string rather than a
 * file.
 */

interface ImportMap {
  imports: Record<string, string>
  styles: string[]
}

const { imports, styles } = importmap as ImportMap

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>1st Contact builder</title>
${styles.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n')}
<link rel="stylesheet" href="/builder/builder.css">
<script type="importmap">${JSON.stringify({ imports })}</script>
</head>
<body>
<div id="${APP_ID}"></div>
<script>${BOOT_GUARD}</script>
<script type="module" src="/builder/main.js"></script>
</body>
</html>
`

export function chromeHtml(): string {
  return HTML
}
