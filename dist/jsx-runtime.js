export function jsx(type, props, _key) {
    const safeProps = props ?? {};
    if (typeof type === "function") {
        return type(safeProps);
    }
    return makeNode(String(type), safeProps);
}
export const jsxs = jsx;
export const jsxDEV = jsx;
export function Fragment(props) {
    return makeNode("fragment", props);
}
export function makeNode(type, props) {
    const { children, ...rest } = props;
    return { type, props: rest, children: toChildArray(children) };
}
function toChildArray(children) {
    if (children == null || typeof children === "boolean")
        return [];
    const arr = Array.isArray(children) ? children : [children];
    const out = [];
    for (const c of arr) {
        if (c == null || typeof c === "boolean")
            continue;
        if (typeof c === "string" || typeof c === "number") {
            out.push({ type: "text", props: { value: String(c) }, children: [] });
        }
        else if (Array.isArray(c)) {
            out.push(...toChildArray(c));
        }
        else if (typeof c === "object" && c !== null && "type" in c) {
            out.push(c);
        }
    }
    return out;
}
//# sourceMappingURL=jsx-runtime.js.map