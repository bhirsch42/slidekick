export function jsx(type, props, _key) {
    return type(props);
}
export const jsxs = jsx;
export const jsxDEV = jsx;
export function Fragment(props) {
    if (props.children == null)
        return [];
    return props.children;
}
//# sourceMappingURL=jsx-runtime.js.map