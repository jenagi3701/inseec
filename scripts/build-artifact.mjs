// Inlines the `--mode artifact` build into one self-contained HTML page
// (dist-artifact/kizuna.html): fonts from Google Fonts, everything else inline.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-artifact';
const assets = readdirSync(join(dir, 'assets'));
const css = assets.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, 'assets', f), 'utf8')).join('\n');
const jsFiles = assets.filter((f) => f.endsWith('.js'));
if (jsFiles.length !== 1) throw new Error(`Expected a single JS bundle, found ${jsFiles.length}`);
const js = readFileSync(join(dir, 'assets', jsFiles[0]), 'utf8').replace(/<\/script/gi, '<\\/script');
const fonts = 'https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Nunito:wght@400;500;600;700;800&family=Zen+Maru+Gothic:wght@500;700;900&display=swap';

const html = `<title>Kizuna</title>
<meta name="description" content="Kizuna — trouve ta guilde à Lyon : quêtes en petites équipes autour de l’anime, du manga, des jeux et de la culture japonaise." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${fonts}" />
<style>${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
writeFileSync(join(dir, 'kizuna.html'), html);
console.log(`dist-artifact/kizuna.html written (${(html.length / 1024).toFixed(0)} kB)`);
