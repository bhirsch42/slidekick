import { pathToFileURL } from "node:url";
export async function loadDeck(entry) {
    const url = `${pathToFileURL(entry).href}?t=${Date.now()}`;
    const mod = (await import(url));
    const deckFn = mod.default;
    if (typeof deckFn !== "function") {
        throw new Error(`deck entry must default-export a function returning Slide[] or { theme?, slides }: ${entry}`);
    }
    const result = await deckFn();
    return normalizeResult(result);
}
function normalizeResult(result) {
    if (Array.isArray(result)) {
        const slides = flattenSlides(result);
        assertSlides(slides);
        return { slides };
    }
    if (result && typeof result === "object" && "slides" in result) {
        const r = result;
        if (!Array.isArray(r.slides)) {
            throw new Error(`deck object's "slides" property must be an array of <Slide> elements`);
        }
        const slides = flattenSlides(r.slides);
        assertSlides(slides);
        return { theme: r.theme, slides };
    }
    throw new Error(`deck function must return an array of <Slide> elements or { theme?, slides }`);
}
function flattenSlides(input) {
    const out = [];
    function visit(c) {
        if (c == null || c === false || c === true)
            return;
        if (Array.isArray(c)) {
            for (const x of c)
                visit(x);
            return;
        }
        out.push(c);
    }
    visit(input);
    return out;
}
function assertSlides(arr) {
    for (const s of arr) {
        if (!s ||
            typeof s !== "object" ||
            s.kind !== "slide") {
            throw new Error("deck array must contain only <Slide> elements");
        }
    }
}
//# sourceMappingURL=load.js.map