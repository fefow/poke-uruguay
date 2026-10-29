// Production build:
//   dist/            -> self-hostable static site (VPS / any static host)
//   dist/urumon.html -> single-file build (everything inlined)
// Usage: npx esbuild@0.24.0 must be installed (npm i -D esbuild), then `node build.mjs`
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';

await mkdir('dist/styles', { recursive: true });
const result = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['chrome120', 'firefox121', 'safari17'],
  write: false,
  legalComments: 'none',
});
const js = result.outputFiles[0].text;
const css = await readFile('styles/main.css', 'utf8');
const html = await readFile('index.html', 'utf8');

await writeFile('dist/game.js', js);
await copyFile('styles/main.css', 'dist/styles/main.css');
for (const f of ['manifest.webmanifest', 'icon.svg']) await copyFile(f, `dist/${f}`);
const sw = (await readFile('sw.js', 'utf8')).replace("'./src/main.js'", "'./game.js'");
await writeFile('dist/sw.js', sw);
await writeFile('dist/index.html', html.replace('src="src/main.js"', 'src="game.js"'));

// Single file: CSS + JS inlined, no external files except Google Fonts.
const body = html.split('<!--APP-->')[1].split('<!--/APP-->')[0];
const single = `<title>Poke Uruguay</title>
<meta name="description" content="Poke Uruguay: La Leyenda del Pampero. Un juego de criaturas 2D ambientado en el Uruguay.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Pixelify+Sans:wght@400;600&display=swap">
<style>
${css}
html, body { height: 100%; }
.app { height: 100%; }
</style>
${body}
<script type="module">
${js.replace(/<\/script/gi, '<\\/script')}
</script>
`;
await writeFile('dist/urumon.html', single);
console.log(`game.js ${(js.length / 1024).toFixed(1)} KB · urumon.html ${(single.length / 1024).toFixed(1)} KB`);
