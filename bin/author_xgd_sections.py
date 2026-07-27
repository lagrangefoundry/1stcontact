#!/usr/bin/env python3
"""Throwaway authoring helper: splice xgd.dev sections 2-5 into home.json.

Not shipped with the package. Regenerates the tail of the L1 tree so the
repeated card/step subtrees stay consistent by construction rather than by
hand-editing 600 lines of JSON.

Idempotent: `nav` and `hero` are preserved untouched (including the hero's own
REQ-100 choreography, which uses explicit per-node `reveal.delayMs` rather than
a container stagger -- see the `responsive_row` docstring for why a
visibility-paired duplicate subtree cannot be staggered positionally).
"""
import json
import pathlib

HOME = pathlib.Path("storage/sites/xgd/draft/pages/home.json")

SATOSHI = "Satoshi, Helvetica Neue, Arial, sans-serif"
MONO = "JetBrains Mono, ui-monospace, Menlo, monospace"

BRIGHT = "#FAFAF9"
BODY = "#A1A1A6"
MUTED = "#8B8B90"
DIM = "#5E5E66"
BORDER = "#2E2E33"
BORDER_SOFT = "#1C1C21"
SURFACE = "#0E0E10"
CARD = "#131316"

BREAK = 768

# ── REQ-100 choreography ─────────────────────────────────────────────────────
# Restrained editorial: a short rise and a fade, never a slide or a bounce. The
# band's own stagger walks eyebrow -> heading -> body; each card row runs its own
# tighter stagger, offset so the cards arrive after the copy that introduces them.
BAND_STAGGER_MS = 90
CARD_STAGGER_MS = 80
CARD_OFFSET_MS = 140

RV_EYEBROW = {"yPx": 14, "durationMs": 500, "easing": "ease-out"}
RV_HEADING = {"yPx": 22, "durationMs": 640, "easing": "ease-out"}
RV_BODY = {"yPx": 18, "durationMs": 640, "easing": "ease-out"}
RV_CARD = {"yPx": 20, "durationMs": 560, "easing": "ease-out", "delayMs": CARD_OFFSET_MS}


def track(pairs):
    return {"keyframes": [{"at": at, "value": v} for at, v in pairs]}


def eyebrow(text):
    return {
        "kind": "text",
        "text": text,
        "reveal": dict(RV_EYEBROW),
        "axes": {
            "color": MUTED,
            "fontFamily": MONO,
            "fontSizePx": 13,
            "fontWeight": 400,
            "letterSpacingPx": 1.6,
            "lineHeightPx": 20,
            "textTransform": "uppercase",
        },
    }


def h2(text, max_px=760):
    return {
        "kind": "text",
        "text": text,
        "reveal": dict(RV_HEADING),
        "sizing": {"width": {"mode": "fluid", "maxPx": max_px}},
        "axes": {
            "color": BRIGHT,
            "fontFamily": SATOSHI,
            "fontSizePx": 48,
            "fontWeight": 700,
            "letterSpacingPx": -1.4,
            "lineHeightPx": 56,
        },
        "responsive": {
            "fontSizePx": track([(320, 30), (768, 40), (1440, 48)]),
            "lineHeightPx": track([(320, 36), (768, 46), (1440, 56)]),
            "letterSpacingPx": track([(320, -0.8), (1440, -1.4)]),
        },
    }


def body(text, max_px=640, color=BODY):
    return {
        "kind": "text",
        "text": text,
        "reveal": dict(RV_BODY),
        "sizing": {"width": {"mode": "fluid", "maxPx": max_px}},
        "axes": {
            "color": color,
            "fontFamily": SATOSHI,
            "fontSizePx": 18,
            "fontWeight": 400,
            "lineHeightPx": 30,
        },
        "responsive": {
            "fontSizePx": track([(320, 16), (1440, 18)]),
            "lineHeightPx": track([(320, 27), (1440, 30)]),
        },
    }


def index_label(text):
    return {
        "kind": "text",
        "text": text,
        "axes": {
            "color": DIM,
            "fontFamily": MONO,
            "fontSizePx": 12,
            "fontWeight": 400,
            "letterSpacingPx": 1.2,
            "lineHeightPx": 18,
        },
    }


def card_title(text):
    return {
        "kind": "text",
        "text": text,
        "axes": {
            "color": BRIGHT,
            "fontFamily": SATOSHI,
            "fontSizePx": 19,
            "fontWeight": 600,
            "letterSpacingPx": -0.3,
            "lineHeightPx": 26,
        },
    }


def card_body(text):
    return {
        "kind": "text",
        "text": text,
        "axes": {
            "color": BODY,
            "fontFamily": SATOSHI,
            "fontSizePx": 15,
            "fontWeight": 400,
            "lineHeightPx": 25,
        },
    }


def band(node_id, children, fill=None, pad_top=(96, 140), pad_bottom=(96, 140)):
    """A full-bleed band with a centred 1200px content column."""
    inner = {
        "kind": "container",
        "id": f"{node_id}-inner",
        "layout": "stack",
        "align": "start",
        "gapPx": 0,
        "staggerMs": BAND_STAGGER_MS,
        "sizing": {"width": {"mode": "fluid", "maxPx": 1200}},
        "padding": {
            "topPx": pad_top[1],
            "bottomPx": pad_bottom[1],
            "leftPx": 32,
            "rightPx": 32,
        },
        "responsivePadding": {
            "topPx": track([(320, pad_top[0]), (1440, pad_top[1])]),
            "bottomPx": track([(320, pad_bottom[0]), (1440, pad_bottom[1])]),
            "leftPx": track([(320, 20), (768, 32)]),
            "rightPx": track([(320, 20), (768, 32)]),
        },
        "children": children,
    }
    outer = {
        "kind": "container",
        "id": node_id,
        "layout": "stack",
        "align": "center",
        "sizing": {"width": {"mode": "fluid"}},
        "children": [inner],
    }
    if fill:
        outer["axes"] = {"surfaceFill": fill}
    return outer


def rule():
    """A 1px hairline — L1's border axis is uniform, so a divider is a thin box."""
    return {
        "kind": "box",
        "axes": {"surfaceFill": BORDER_SOFT},
        "sizing": {"width": {"mode": "fluid"}, "height": {"mode": "fixed", "px": 1}},
    }


def card(idx, title, text, framed=True):
    node = {
        "kind": "container",
        "layout": "stack",
        "align": "start",
        "gapPx": 12,
        "reveal": dict(RV_CARD),
        "sizing": {"width": {"mode": "fluid"}},
        "children": [index_label(idx), card_title(title), card_body(text)],
    }
    if framed:
        node["axes"] = {
            "surfaceFill": CARD,
            "borderRadiusPx": 10,
            "border": {"widthPx": 1, "color": BORDER_SOFT, "style": "solid"},
        }
        node["padding"] = {"topPx": 26, "bottomPx": 28, "leftPx": 24, "rightPx": 24}
    return node


def responsive_row(node_id, items, gap=20):
    """A row above BREAK and a stack below it.

    L1 has no responsive `layout` axis, so the subtree is duplicated behind a
    visibility pair — the same shape the hero already uses for its CTA row.
    """
    return [
        {
            "kind": "container",
            "id": f"{node_id}-row",
            "layout": "row",
            "align": "stretch",
            "distribution": "start",
            "gapPx": gap,
            "staggerMs": CARD_STAGGER_MS,
            "sizing": {"width": {"mode": "fluid"}},
            "visibility": {"fromPx": BREAK},
            "children": items,
        },
        {
            "kind": "container",
            "id": f"{node_id}-stack",
            "layout": "stack",
            "align": "stretch",
            "gapPx": gap,
            "staggerMs": CARD_STAGGER_MS,
            "sizing": {"width": {"mode": "fluid"}},
            "visibility": {"untilPx": BREAK},
            "children": json.loads(json.dumps(items)),
        },
    ]


def spacer(px):
    return {
        "kind": "box",
        "sizing": {"width": {"mode": "fluid"}, "height": {"mode": "fixed", "px": px}},
    }


# ── §2 The problem ───────────────────────────────────────────────────────────
PROBLEM_ITEMS = [
    (
        "01",
        "Intent evaporates",
        "The reason a behaviour exists lives in a conversation that scrolls away, "
        "not in anything the build can check.",
    ),
    (
        "02",
        "Tests drift",
        "Suites grow around the implementation they were written against, so they "
        "keep passing long after the behaviour they describe has moved.",
    ),
    (
        "03",
        "Review stops scaling",
        "Reading every diff was always the weakest link. At generated volume it "
        "stops being a link at all.",
    ),
]

problem = band(
    "problem",
    [
        eyebrow("The problem"),
        spacer(20),
        h2("Code got cheap. Confidence didn't."),
        spacer(22),
        body(
            "An agent can produce a thousand lines before lunch. What it cannot tell "
            "you is whether the ninety thousand already there still do what you "
            "promised. Velocity moved; verification stayed exactly where it was."
        ),
        spacer(56),
        *responsive_row("problem-items", [card(*i) for i in PROBLEM_ITEMS]),
    ],
    fill=SURFACE,
)

# ── §3 How it works ──────────────────────────────────────────────────────────
STEPS = [
    (
        "01",
        "Capability",
        "A durable slice of what your system does — finite, named, and stable "
        "across refactors.",
    ),
    (
        "02",
        "User story",
        "Why that behaviour exists, in plain English. Derived from your intent, "
        "never loose free text.",
    ),
    (
        "03",
        "Acceptance criteria",
        "What correct means for the story. Behavioural, not bound to any one "
        "implementation.",
    ),
    (
        "04",
        "Verification",
        "An executable test per criterion. Passing tests are the evidence; missing "
        "ones are reported, not hidden.",
    ),
]

how = band(
    "how",
    [
        eyebrow("How it works"),
        spacer(20),
        h2("A living spec, tested on every change."),
        spacer(22),
        body(
            "XGD maintains a capability matrix: a traceable chain running from what "
            "your software is for, down to executable proof that it still does it. "
            "Every change is checked against that chain before it lands."
        ),
        spacer(56),
        *responsive_row("how-steps", [card(*s) for s in STEPS], gap=16),
    ],
)

# ── §4 The contract ──────────────────────────────────────────────────────────
def panel(heading, items, accent):
    children = [
        {
            "kind": "text",
            "text": heading,
            "axes": {
                "color": accent,
                "fontFamily": MONO,
                "fontSizePx": 12,
                "fontWeight": 400,
                "letterSpacingPx": 1.4,
                "lineHeightPx": 18,
                "textTransform": "uppercase",
            },
        },
        spacer(6),
    ]
    for it in items:
        children.append(
            {
                "kind": "text",
                "text": it,
                "axes": {
                    "color": BODY,
                    "fontFamily": SATOSHI,
                    "fontSizePx": 16,
                    "fontWeight": 400,
                    "lineHeightPx": 27,
                    "listMarker": "disc",
                },
                "padding": {"leftPx": 18},
            }
        )
    return {
        "kind": "container",
        "layout": "stack",
        "align": "start",
        "gapPx": 10,
        "reveal": dict(RV_CARD),
        "sizing": {"width": {"mode": "fluid"}},
        "axes": {
            "surfaceFill": CARD,
            "borderRadiusPx": 10,
            "border": {"widthPx": 1, "color": BORDER_SOFT, "style": "solid"},
        },
        "padding": {"topPx": 30, "bottomPx": 32, "leftPx": 28, "rightPx": 28},
        "children": children,
    }


contract = band(
    "contract",
    [
        eyebrow("The contract"),
        spacer(20),
        h2("You own the intent. XGD owns the implementation.", max_px=860),
        spacer(22),
        body(
            "The split is deliberate and it does not move. You stay responsible for "
            "the decisions only you can make; XGD takes the work that scales badly "
            "with human attention."
        ),
        spacer(56),
        *responsive_row(
            "contract-panels",
            [
                panel(
                    "You own",
                    [
                        "Product intent and priorities",
                        "The architecture and its constraints",
                        "What done means for each behaviour",
                        "The decision to ship",
                    ],
                    BRIGHT,
                ),
                panel(
                    "XGD owns",
                    [
                        "Technical design and sprint planning",
                        "The code, and the tests that pin it",
                        "Regression, reconciliation, repair",
                        "Evidence that all of it still holds",
                    ],
                    MUTED,
                ),
            ],
            gap=20,
        ),
    ],
    fill=SURFACE,
)

# ── §5 Evidence + close ──────────────────────────────────────────────────────
def cta(label, primary, node_id):
    inner_axes = {
        "color": "#0A0A0B" if primary else BRIGHT,
        "fontFamily": SATOSHI,
        "fontSizePx": 15,
        "fontWeight": 600 if primary else 500,
        "lineHeightPx": 20,
        "nowrapFromPx": 0,
        "textAlign": "center",
    }
    axes = {"borderRadiusPx": 6}
    if primary:
        axes["surfaceFill"] = BRIGHT
    else:
        axes["border"] = {"widthPx": 1, "color": BORDER, "style": "solid"}
    hover = (
        {
            "surfaceFill": "#FFFFFF",
            "motion": {"offsetYPx": -2},
            "boxShadow": {
                "offsetXPx": 0,
                "offsetYPx": 8,
                "blurPx": 24,
                "color": "#00000059",
            },
        }
        if primary
        else {
            "surfaceFill": "#16161A",
            "border": {"widthPx": 1, "color": "#4A4A52", "style": "solid"},
            "motion": {"offsetYPx": -2},
        }
    )
    return {
        "kind": "box",
        "id": node_id,
        "axes": axes,
        "padding": {"topPx": 15, "bottomPx": 15, "leftPx": 26, "rightPx": 26},
        "children": [{"kind": "text", "text": label, "axes": inner_axes}],
        "reveal": {"yPx": 16, "durationMs": 520, "easing": "ease-out", "delayMs": 120},
        "interaction": {
            "transition": {"durationMs": 160, "easing": "ease-out"},
            "hover": hover,
        },
    }


close = band(
    "close",
    [
        eyebrow("Evidence, not promises"),
        spacer(20),
        h2("Every change leaves proof behind.", max_px=820),
        spacer(22),
        body(
            "XGD does not claim your software is correct. It guarantees that every "
            "claim of correctness is backed by inspectable evidence — and that every "
            "gap in that evidence is visible rather than quietly absent.",
            max_px=660,
        ),
        spacer(44),
        {
            "kind": "container",
            "id": "close-cta-row",
            "layout": "row",
            "align": "center",
            "gapPx": 14,
            "visibility": {"fromPx": 520},
            "children": [
                cta("Join the beta waitlist", True, "close-cta-primary"),
                cta("Read the whitepaper", False, "close-cta-secondary"),
            ],
        },
        {
            "kind": "container",
            "id": "close-cta-stack",
            "layout": "stack",
            "align": "stretch",
            "gapPx": 12,
            "sizing": {"width": {"mode": "fluid"}},
            "visibility": {"untilPx": 520},
            "children": [
                cta("Join the beta waitlist", True, "close-cta-primary-s"),
                cta("Read the whitepaper", False, "close-cta-secondary-s"),
            ],
        },
    ],
)

# ── Footer ───────────────────────────────────────────────────────────────────
footer = {
    "kind": "container",
    "id": "footer",
    "layout": "stack",
    "align": "center",
    "sizing": {"width": {"mode": "fluid"}},
    "axes": {"surfaceFill": SURFACE},
    "children": [
        {
            "kind": "container",
            "id": "footer-inner",
            "layout": "row",
            "distribution": "between",
            "align": "center",
            "gapPx": 20,
            "sizing": {"width": {"mode": "fluid", "maxPx": 1200}},
            "padding": {"topPx": 36, "bottomPx": 36, "leftPx": 32, "rightPx": 32},
            "children": [
                {
                    "kind": "text",
                    "text": "xgd",
                    "axes": {
                        "color": MUTED,
                        "fontFamily": SATOSHI,
                        "fontSizePx": 17,
                        "fontWeight": 700,
                        "letterSpacingPx": -0.4,
                        "lineHeightPx": 22,
                    },
                },
                {
                    "kind": "text",
                    "text": "© 2026 GenDev Labs",
                    "axes": {
                        "color": DIM,
                        "fontFamily": MONO,
                        "fontSizePx": 12,
                        "fontWeight": 400,
                        "lineHeightPx": 18,
                    },
                },
            ],
        }
    ],
}


def main():
    doc = json.loads(HOME.read_text())
    root = doc["l1"]["root"]
    keep = [c for c in root["children"] if c.get("id") in ("nav", "hero")]
    root["children"] = keep + [
        rule(),
        problem,
        how,
        contract,
        close,
        rule(),
        footer,
    ]
    HOME.write_text(json.dumps(doc, indent=2) + "\n")
    print(f"wrote {HOME} — {len(root['children'])} top-level nodes")


if __name__ == "__main__":
    main()
