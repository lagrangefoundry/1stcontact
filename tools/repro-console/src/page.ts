/**
 * The console's two rendered pages (REQ-254).
 *
 * SERVER-RENDERED, DELIBERATELY. The iteration list is markup the server emits
 * on every request, not something a client script assembles from JSON. One
 * definition of the markup, no build step, no bundle, and the page survives a
 * reload with its history intact. The only thing the browser script does is
 * update the one status line and reload when the version moves — see
 * {@link POLL_SCRIPT}.
 */

/** One finished iteration, as the page shows it. */
export interface IterationView {
  n: number
  /** The live site, for comparison — the address the capture actually answered on. */
  originalUrl: string
  /** This iteration's rendered reproduction, served by the console. */
  reproHref: string
  /** This iteration's diff images, served by the console. */
  diffHref: string
}

export interface PageState {
  /** Bumped whenever the iteration list changes; the poller reloads when it moves. */
  version: number
  running: boolean
  /** What is happening, or what failed. Empty before the first run. */
  message: string
  /** Whether {@link message} is a failure rather than progress. */
  failed: boolean
  /** The address currently loaded, if any — what [run again] would re-run. */
  url: string | null
  iterations: IterationView[]
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * The poller. Two jobs and no more: keep the status line and the buttons honest
 * while a run is in flight, and reload when the server says the iteration list
 * has changed. Reloading rather than re-rendering is what keeps the markup
 * defined in exactly one place.
 */
const POLL_SCRIPT = `
const page = Number(document.body.dataset.version);
async function poll() {
  try {
    const state = await (await fetch('/state')).json();
    if (state.version !== page) { location.reload(); return; }
    const line = document.getElementById('status');
    line.textContent = state.message;
    line.className = state.failed ? 'failed' : 'progress';
    for (const button of document.querySelectorAll('button')) button.disabled = state.running;
  } catch {}
  setTimeout(poll, 1000);
}
poll();
`

const STYLE = `
:root { color-scheme: light dark }
body { font: 15px/1.5 ui-sans-serif, system-ui, sans-serif; margin: 3rem auto; max-width: 42rem; padding: 0 1rem }
form { display: flex; gap: .5rem }
input { flex: 1; padding: .5rem .6rem; font: inherit }
button { padding: .5rem 1rem; font: inherit; cursor: pointer }
button[disabled] { cursor: progress; opacity: .5 }
#status { min-height: 1.5em; margin: 1rem 0 }
#status.failed { color: #c0392b; white-space: pre-wrap }
#status.progress { opacity: .7 }
h2 { margin: 2rem 0 .25rem; font-size: 1rem }
ul { margin: 0; padding-left: 1.2rem }
figure { margin: 1.5rem 0 }
figure img { max-width: 100%; border: 1px solid #8884 }
.triptych { display: grid; grid-template-columns: repeat(3, 1fr); gap: .5rem }
.triptych figcaption { font-size: .8rem; opacity: .7 }
`

/**
 * The console itself.
 *
 * Opens blank: a text box and a [reproduce] button, and nothing else. Every
 * artifact link carries `target="_blank"`, so following one never loses the
 * console — which is the point of the console being a page at all rather than a
 * sequence of printed paths.
 */
export function renderConsolePage(state: PageState): string {
  const rows = state.iterations
    .map(
      (it) => `<section>
  <h2>Iteration ${it.n}</h2>
  <ul>
    <li><a href="${escapeHtml(it.originalUrl)}" target="_blank" rel="noopener noreferrer">the original site</a></li>
    <li><a href="${escapeHtml(it.reproHref)}" target="_blank" rel="noopener noreferrer">the reproduction</a></li>
    <li><a href="${escapeHtml(it.diffHref)}" target="_blank" rel="noopener noreferrer">the diff images</a></li>
  </ul>
</section>`,
    )
    .join('\n')

  // [run again] appears only once there is something to re-run. It takes no
  // address: [reproduce] captures and starts a new list at Iteration 1, this
  // re-runs the site already loaded and appends the next one.
  const again = state.iterations.length
    ? `<form method="post" action="/run-again"><button${state.running ? ' disabled' : ''}>run again</button></form>`
    : ''

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>reproduction console</title><style>${STYLE}</style></head>
<body data-version="${state.version}">
<form method="post" action="/run">
  <input name="url" value="${escapeHtml(state.url ?? '')}" placeholder="site address" autocomplete="off" autofocus>
  <button${state.running ? ' disabled' : ''}>reproduce</button>
</form>
<p id="status" class="${state.failed ? 'failed' : 'progress'}">${escapeHtml(state.message)}</p>
${rows}
${again}
<script>${POLL_SCRIPT}</script>
</body>
</html>`
}

/** The headline numbers and one region `1c diff` wrote. */
export interface DiffRegionView {
  id: number | string
  ref: string
  actual: string
  diff: string
}

export interface DiffReportView {
  meanDiff?: number
  pctOverThreshold?: number
  regions: DiffRegionView[]
}

/**
 * One iteration's diff images, on one page.
 *
 * The heatmaps first, then a ref / ours / diff triptych per ranked region —
 * the same worst-first reading order the runbook prescribes ([[DOC-19]]): the
 * regions say *where*, and the operator opens them in order.
 */
export function renderDiffPage(n: number, base: string, report: DiffReportView): string {
  const headline =
    report.meanDiff === undefined
      ? ''
      : `<p>mean difference <strong>${report.meanDiff}</strong>/255 · <strong>${report.pctOverThreshold ?? 0}%</strong> of pixels over threshold</p>`

  const triptychs = report.regions
    .map(
      (region) => `<figure class="triptych">
  <div><img src="${escapeHtml(base + region.ref)}" alt="reference, region ${region.id}"><figcaption>reference</figcaption></div>
  <div><img src="${escapeHtml(base + region.actual)}" alt="reproduction, region ${region.id}"><figcaption>reproduction</figcaption></div>
  <div><img src="${escapeHtml(base + region.diff)}" alt="difference, region ${region.id}"><figcaption>difference</figcaption></div>
</figure>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Iteration ${n} — diff images</title><style>${STYLE}</style></head>
<body>
<h2>Iteration ${n} — diff images</h2>
${headline}
<figure><img src="${escapeHtml(base + 'diff-blocks.png')}" alt="block-averaged difference heatmap"><figcaption>block-averaged heatmap</figcaption></figure>
<figure><img src="${escapeHtml(base + 'diff.png')}" alt="per-pixel difference heatmap"><figcaption>per-pixel heatmap</figcaption></figure>
${triptychs || '<p>No region of interest — the two agree everywhere the diff looks.</p>'}
</body>
</html>`
}
