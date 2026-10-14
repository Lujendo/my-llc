// Runnable check: node browser-test.mjs [baseUrl]
// BUG-1 acceptance: the deployed CSS must contain Tailwind v4 responsive
// variants, and the desktop nav (`hidden md:flex`) must resolve to display:flex
// at >=768px (md = 48rem), hence at the 1024px desktop viewport.
//
// ponytail: no headless browser is installed and no new deps are allowed, so
// this asserts the CSS contract that makes the nav visible rather than
// rasterising a viewport. Add Playwright if pixel-level proof is ever needed.
const baseUrl = process.argv[2] || process.env.VITE_API_URL || "https://my-llc-staging.info-eac.workers.dev";

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log("  ok  -", msg);
  else {
    failures++;
    console.error("  FAIL-", msg);
  }
};

const html = await (await fetch(`${baseUrl}/`)).text();
ok(html.includes('id="root"'), "SPA shell served at /");

const cssHref = (html.match(/assets\/[^"]+\.css/) || [])[0];
ok(!!cssHref, `CSS asset linked in HTML (${cssHref})`);

const css = await (await fetch(`${baseUrl}/${cssHref}`)).text();
console.log(`  css bytes: ${css.length}`);

for (const bp of ["40rem", "48rem", "64rem"]) {
  ok(css.includes(`@media(min-width:${bp})`), `responsive breakpoint @media(min-width:${bp}) present`);
}
ok(css.includes(".md\\:flex{display:flex}"), "desktop nav rule .md\\:flex{display:flex} present");

// Cascade: .md:flex must come after .hidden and inside the 48rem block, else
// `hidden md:flex` stays display:none on desktop.
const hidden = css.indexOf(".hidden{");
const mdFlex = css.indexOf(".md\\:flex{");
const mdBlock = css.indexOf("@media(min-width:48rem)");
ok(hidden !== -1 && mdFlex > hidden, ".md:flex overrides .hidden (source order)");
ok(mdBlock !== -1 && mdFlex > mdBlock, ".md:flex lives inside the 48rem media query");

console.log(failures === 0 ? "\nbrowser-test PASSED" : `\nbrowser-test FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
