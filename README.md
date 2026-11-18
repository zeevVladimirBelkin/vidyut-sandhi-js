# Vidyut Sandhi for JavaScript

Vidyut Sandhi for JavaScript reverses external Sanskrit sandhi in SLP1.
It ports Vidyut’s rule lookup and phonetic checks from `py-0.4.0` to a
dependency-free ES module. It returns possible splits for the caller to
check against a lexicon or use in a larger segmentation pipeline. The
bundle includes the original generated rules and preserves Vidyut’s MIT
license and copyright notice. [Provenance and attribution](NOTICE.md)

## Build and test

```sh
npm run build
npm test
```

The build produces `dist/index.js`, the uncompressed `dist/rules.csv`,
`dist/LICENSE`, and `dist/NOTICE.md`. AynAyn imports this distribution
during its normal build. Node runs the build and tests. The module itself
uses standard JavaScript and takes the rule table as text.

## API

```js
import { createSandhiSplitter } from "./dist/index.js";

const response = await fetch(new URL("./dist/rules.csv", import.meta.url));
if (!response.ok) throw new Error("Could not load the sandhi rules");

const splitter = createSandhiSplitter(await response.text());
const candidates = splitter.splitAll("rAmo'sti").filter(
  ({ isValid, isRecursive }) => isValid && !isRecursive,
);
// One candidate has first: "rAmas", second: "asti".
```

- `createSandhiSplitter(csvText)` reads an unquoted `first,second,result`
  table and indexes each forward rule by its result. A result containing
  ASCII spaces also matches its joined form. An empty `second` is allowed.
- `splitAt(text, index)` takes a zero-based index into the SLP1 input.
  It returns the literal prefix through that index, followed by special
  cases and inverse rules starting at that index. As in Vidyut, the
  inverse-rule scan only matches keys ending before the end of input.
  An index outside the input throws a `RangeError`.
- `splitAll(text)` tries each position in the leading SLP1 chunk,
  including the ASCII apostrophe for avagraha. A rule can match across a
  space at the boundary of that chunk.

Each candidate has `first` and `second` strings. `kind` is `"prefix"`
for a literal split or `"standard"` for an inverse rule or special case.
`isEndOfChunk` marks a chunk boundary as defined by Vidyut. `isValid`
reports whether the two sides pass Vidyut’s phonetic checks, and
`isRecursive` reports whether the second side equals the input, which
lets a caller avoid processing the same remainder again.
