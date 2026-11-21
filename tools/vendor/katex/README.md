# KaTeX 0.19.1

`katex.cjs` is the unmodified `dist/katex.min.js` from the official npm package, renamed for CommonJS loading by Node. The build uses its `renderToString` API. [Upstream release](https://github.com/KaTeX/KaTeX/releases/tag/v0.19.1) · [Package archive](https://registry.npmjs.org/katex/-/katex-0.19.1.tgz)

Archive integrity (npm SHA-512)

```text
sha512-jG8uKntjSEcm2EpQOh0XturpPuuC9r3Sq5HLHdsFdWZT27E672SF19QEi+of0/YeOy15lDgRhKvr5614uRrEfA==
```

The published assets are in `assets/katex/0.19.1/`. The stylesheet is the upstream `dist/katex.min.css` with the WOFF and TrueType fallback URLs removed. All 20 WOFF2 files are copied verbatim from `dist/fonts/`.

The renderer and stylesheet are distributed under the MIT license included with the package. The font metadata identifies SIL Open Font License 1.1 and the reserved font names, recorded with the license in `fonts/OFL.txt` alongside the distributed fonts. [Official OFL text](https://openfontlicense.org/documents/OFL.txt)
