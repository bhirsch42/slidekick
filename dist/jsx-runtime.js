export function jsx(type, props, _key) {
    return type(props);
}
export const jsxs = jsx;
export const jsxDEV = jsx;
export function Fragment(_props) {
    throw new Error("Fragments (<>...</>) are not supported in slidekick. Use <Group> instead.");
}
//# sourceMappingURL=jsx-runtime.js.map