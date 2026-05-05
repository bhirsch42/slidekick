# Keynote rendering options

slidekick currently emits `.pptx` via pptxgenjs. Keynote opens `.pptx` natively, but the import is lossy (fonts substituted, text wrapping differs, master slides re-applied). This doc lays out three paths for improving the Keynote story, ranked by effort.

## 1. Status quo: emit `.pptx`, let Keynote import

No new code. Keynote opens `.pptx` files directly. Drift exists but may be acceptable for slidekick's minimal component vocabulary (fixed-height title/subtitle/heading, flex bullets/text/image/quote — no exotic effects).

**Action:** render the demo deck, open in Keynote, visually diff against the HTML preview and the PowerPoint render. Document the actual delta. If tolerable, declare Keynote "supported via import" in the README and move on.

**Pros:** zero work.
**Cons:** drift is real; users hit it the moment they care.

## 2. AppleScript post-step: `.pptx → .key` via Keynote.app (macOS only)

After `render/pptx.ts` writes the `.pptx`, shell out to an AppleScript that opens it in Keynote and exports as `.key`.

```applescript
tell application "Keynote"
  set theDoc to open POSIX file "<in.pptx>"
  export theDoc to POSIX file "<out.key>" as Keynote
  close theDoc saving no
end tell
```

Wire it into a new CLI flag (`slidekick build --keynote`) or as a sibling output when running on macOS with Keynote installed.

**Pros:** produces a real `.key` file Keynote treats as native. Small, contained change (~30 LOC + an `osascript` invocation).
**Cons:** macOS-only, requires Keynote installed, slow (launches the GUI app per build), and the fidelity ceiling is *still* Keynote's `.pptx` importer — same drift as path 1, just front-loaded into the build.

The honest pitch for path 2: it's not better fidelity, it's *convenience* — the user gets a `.key` they can open without the import dialog.

## 3. Emit `.key` directly via `keynote-parser`

[psobot/keynote-parser](https://github.com/psobot/keynote-parser) round-trips `.key` bundles by unpacking the Snappy-compressed Protobuf `.iwa` files into editable YAML and repacking them.

**Approach:**
1. Hand-author a `template.key` in Keynote containing one stamped slide per slidekick component (title slide, bullets slide, columns slide, quote slide, etc.).
2. Unpack with `keynote-parser` to inspect the YAML/Protobuf structure for each slide type.
3. Build a new renderer (`src/render/keynote.ts`) that consumes the same `Placed[]` IR as `pptx.ts`/`html.ts`, clones the appropriate template slide per component, and substitutes text/image content.
4. Repack to `.key`.

**Pros:** real native `.key` output, cross-platform generation (no Keynote.app required), full control over the result.
**Cons:** significant work. Python dep (or a TS port of the unpacker — non-trivial, Snappy + Protobuf + iWork's archive schema). Brittle across Keynote versions: the parser tracks specific releases (currently Keynote 14.4) and Apple changes the schema. This is a multi-week project, not a feature.

## Recommendation

Do path 1 first — measure the drift before investing. If unacceptable, do path 2; it ships in a day and covers macOS users who are the realistic Keynote audience anyway. Reserve path 3 for if/when slidekick has enough non-Mac users authoring for Keynote-using audiences that cross-platform `.key` generation becomes load-bearing.

## References

- [psobot/keynote-parser](https://github.com/psobot/keynote-parser)
- [AppleScript and Keynote: Exporting Documents](https://iworkautomation.com/keynote/document-export.html)
- [Export to PowerPoint or another file format in Keynote on Mac](https://support.apple.com/guide/keynote/export-to-powerpoint-or-another-file-format-tana0d19882a/mac)
- [KEY File Format reference](https://docs.fileformat.com/presentation/key/)
