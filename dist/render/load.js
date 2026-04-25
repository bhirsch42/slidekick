import { pathToFileURL } from "node:url";
export async function loadDeck(entry) {
    const url = pathToFileURL(entry).href + `?t=${Date.now()}`;
    const mod = (await import(url));
    const deckFn = mod.default;
    if (typeof deckFn !== "function") {
        throw new Error(`deck entry must default-export a function returning Slide[]: ${entry}`);
    }
    const result = await deckFn();
    if (!Array.isArray(result)) {
        throw new Error(`deck function must return an array of <Slide> elements`);
    }
    return result;
}
//# sourceMappingURL=load.js.map