#!/usr/bin/env node
// Generates index.html for Capacitor from the TanStack Start Vercel build output.
// Also patches the main bundle to use createRoot instead of hydrateRoot (no SSR in Capacitor).
import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const staticDir = ".vercel/output/static";
const assetsDir = join(staticDir, "assets");
const files = readdirSync(assetsDir);

const bySize = (a, b) =>
  statSync(join(assetsDir, b)).size - statSync(join(assetsDir, a)).size;

const cssFiles = files.filter((f) => f.endsWith(".css")).sort(bySize);

const mainJs = files
  .filter((f) => f.startsWith("index-") && f.endsWith(".js"))
  .sort(bySize)[0];

if (!mainJs) {
  console.error("Could not find main JS entry in", assetsDir);
  process.exit(1);
}

// Patch: replace hydrateRoot(document, ...) with createRoot(document).render(...)
// TanStack Start uses hydrateRoot expecting SSR HTML. Capacitor has no SSR HTML.
const bundlePath = join(assetsDir, mainJs);
const original = readFileSync(bundlePath, "utf8");
const patched = original.replace(/\.hydrateRoot\(document,/g, ".createRoot(document).render(");
if (patched === original) {
  console.warn("⚠ hydrateRoot patch not applied — pattern not found");
} else {
  writeFileSync(bundlePath, patched);
  console.log("✓ Patched hydrateRoot → createRoot(document).render");
}

const cssLinks = cssFiles
  .map((f) => `  <link rel="stylesheet" crossorigin href="/assets/${f}" />`)
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>SOL DE CABO™</title>
  <link rel="icon" type="image/png" href="/favicon.png" />
${cssLinks}
  <script>
    // Minimal TanStack Start dehydration stub — no SSR server in Capacitor.
    window.$_TSR = {
      buffer: [],
      h: function() {},
      router: { matches: [], lastMatchId: undefined, manifest: undefined, dehydratedData: undefined },
    };
    // Patch console.error so Capacitor can show Error objects (normally serialized as {}).
    var _origError = console.error.bind(console);
    console.error = function() {
      var args = Array.prototype.slice.call(arguments).map(function(a) {
        if (a instanceof Error) return "[Error] " + (a.stack || a.message);
        if (a && typeof a === "object") { try { return JSON.stringify(a); } catch(e) { return String(a); } }
        return a;
      });
      _origError.apply(console, args);
    };
    window.addEventListener("error", function(e) {
      console.log("GLOBAL ERROR:", e.message, e.filename + ":" + e.lineno, e.error && e.error.stack);
    });
    window.addEventListener("unhandledrejection", function(e) {
      var r = e.reason;
      console.log("UNHANDLED PROMISE:", r instanceof Error ? (r.stack || r.message) : JSON.stringify(r));
    });
  </script>
</head>
<body>
  <script>
    // Detect the real safe-area-inset-top for Capacitor iOS.
    // env(safe-area-inset-top) can return 0 in some Capacitor WebView configs
    // even when the status bar overlaps. Probe it; fall back to screen heuristic.
    (function () {
      if (!(window.Capacitor && window.Capacitor.isNativePlatform())) return;
      var probe = document.createElement('div');
      probe.style.cssText =
        'position:fixed;top:env(safe-area-inset-top,0px);left:0;width:1px;height:1px;visibility:hidden;pointer-events:none';
      document.body.appendChild(probe);
      var top = probe.getBoundingClientRect().top;
      document.body.removeChild(probe);
      // If env() worked, top > 0. If it returned 0, fall back to screen heuristic.
      // screen.height in CSS pixels: ≥900 = Dynamic Island iPhone (59pt),
      //   ≥750 = notch iPhone (44pt), else older/SE (20pt).
      if (top <= 0) {
        var h = window.screen.height;
        top = h >= 900 ? 59 : h >= 750 ? 44 : 20;
      }
      document.documentElement.style.setProperty('--sat', top + 'px');
      // Bottom safe area (home indicator) — env() usually works for this one
      var botProbe = document.createElement('div');
      botProbe.style.cssText =
        'position:fixed;bottom:env(safe-area-inset-bottom,0px);left:0;width:1px;height:1px;visibility:hidden;pointer-events:none';
      document.body.appendChild(botProbe);
      var bot = window.innerHeight - botProbe.getBoundingClientRect().bottom;
      document.body.removeChild(botProbe);
      document.documentElement.style.setProperty('--sab', (bot > 0 ? bot : 34) + 'px');
    })();
  </script>
  <script type="module" crossorigin src="/assets/${mainJs}"></script>
</body>
</html>`;

writeFileSync(join(staticDir, "index.html"), html);
console.log(`✓ index.html generated (entry: ${mainJs})`);
