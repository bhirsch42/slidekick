function joinText(c) {
    if (c == null)
        return "";
    if (typeof c === "string")
        return c;
    if (typeof c === "number")
        return String(c);
    return c.map((p) => (typeof p === "number" ? String(p) : p)).join("");
}
function arr(c) {
    if (c == null)
        return [];
    return Array.isArray(c) ? c : [c];
}
export function Slide(props) {
    return { kind: "slide", step: props.step, children: arr(props.children) };
}
export function Columns(props) {
    return {
        kind: "columns",
        step: props.step,
        gap: props.gap,
        children: arr(props.children),
    };
}
export function Column(props) {
    return {
        kind: "column",
        step: props.step,
        weight: props.weight,
        children: arr(props.children),
    };
}
export function Title(props) {
    return { kind: "title", step: props.step, text: joinText(props.children) };
}
export function Subtitle(props) {
    return { kind: "subtitle", step: props.step, text: joinText(props.children) };
}
export function Heading(props) {
    return { kind: "heading", step: props.step, text: joinText(props.children) };
}
export function Bullets(props) {
    return { kind: "bullets", step: props.step, children: arr(props.children) };
}
export function Bullet(props) {
    return { kind: "bullet", step: props.step, text: joinText(props.children) };
}
export function Text(props) {
    return { kind: "text", step: props.step, text: joinText(props.children) };
}
export function Image(props) {
    return { kind: "image", step: props.step, src: props.src, alt: props.alt };
}
export function Quote(props) {
    return {
        kind: "quote",
        step: props.step,
        text: joinText(props.children),
        attribution: props.attribution,
    };
}
export function Group(props) {
    return { kind: "group", step: props.step, children: arr(props.children) };
}
//# sourceMappingURL=components.js.map