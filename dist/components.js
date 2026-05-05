function flatten(c) {
    if (c == null || c === false || c === true)
        return [];
    if (Array.isArray(c)) {
        const out = [];
        for (const x of c)
            out.push(...flatten(x));
        return out;
    }
    return [c];
}
function stylesEqual(a, b) {
    if (!a && !b)
        return true;
    if (!a || !b)
        return false;
    return (a.size === b.size &&
        a.weight === b.weight &&
        a.italic === b.italic &&
        a.font === b.font &&
        a.color === b.color &&
        !!a.cite === !!b.cite);
}
function mergeStyle(a, b) {
    if (!b)
        return a;
    return {
        size: b.size ?? a.size,
        weight: b.weight ?? a.weight,
        italic: b.italic ?? a.italic,
        font: b.font ?? a.font,
        color: b.color ?? a.color,
        cite: b.cite ?? a.cite,
    };
}
function isEmptyStyle(s) {
    return (s.size === undefined &&
        s.weight === undefined &&
        s.italic === undefined &&
        s.font === undefined &&
        s.color === undefined &&
        !s.cite);
}
export function flattenInline(children) {
    const out = [];
    function pushText(text, style) {
        if (text === "")
            return;
        const last = out[out.length - 1];
        if (last && stylesEqual(last.style, isEmptyStyle(style) ? undefined : style)) {
            last.text += text;
            return;
        }
        out.push(isEmptyStyle(style) ? { text } : { text, style: { ...style } });
    }
    function visit(c, style) {
        if (c == null || c === false || c === true)
            return;
        if (Array.isArray(c)) {
            for (const item of c)
                visit(item, style);
            return;
        }
        if (typeof c === "string") {
            pushText(c, style);
            return;
        }
        if (typeof c === "number") {
            pushText(String(c), style);
            return;
        }
        if (typeof c === "object" && c.kind === "span") {
            const span = c;
            const merged = mergeStyle(style, span.style);
            visit(span.children, merged);
            return;
        }
    }
    visit(children, {});
    return out;
}
export function Slide(props) {
    return {
        kind: "slide",
        step: props.step,
        background: props.background,
        align: props.align,
        children: flatten(props.children),
    };
}
export function Columns(props) {
    return {
        kind: "columns",
        step: props.step,
        gap: props.gap,
        children: flatten(props.children),
    };
}
export function Column(props) {
    return {
        kind: "column",
        step: props.step,
        weight: props.weight,
        children: flatten(props.children),
    };
}
export function Title(props) {
    return { kind: "title", step: props.step, runs: flattenInline(props.children), align: props.align };
}
export function Subtitle(props) {
    return { kind: "subtitle", step: props.step, runs: flattenInline(props.children), align: props.align };
}
export function Heading(props) {
    return { kind: "heading", step: props.step, runs: flattenInline(props.children), align: props.align };
}
export function Bullets(props) {
    return { kind: "bullets", step: props.step, children: flatten(props.children) };
}
export function Bullet(props) {
    return { kind: "bullet", step: props.step, runs: flattenInline(props.children), align: props.align };
}
export function Text(props) {
    return { kind: "text", step: props.step, runs: flattenInline(props.children), align: props.align };
}
export function Image(props) {
    return {
        kind: "image",
        step: props.step,
        src: props.src,
        alt: props.alt,
        fit: props.fit,
        crop: props.crop,
    };
}
export function Group(props) {
    return { kind: "group", step: props.step, children: flatten(props.children) };
}
export function Span(props) {
    const style = {};
    if (props.size !== undefined)
        style.size = props.size;
    if (props.weight !== undefined)
        style.weight = props.weight;
    if (props.italic !== undefined)
        style.italic = props.italic;
    if (props.font !== undefined)
        style.font = props.font;
    if (props.color !== undefined)
        style.color = props.color;
    return { kind: "span", children: props.children, style };
}
export function Em(props) {
    return { kind: "span", children: props.children, style: { italic: true } };
}
export function Strong(props) {
    return { kind: "span", children: props.children, style: { weight: 700 } };
}
export function Cite(props) {
    return { kind: "span", children: props.children, style: { italic: true, cite: true } };
}
//# sourceMappingURL=components.js.map