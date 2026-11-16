// Copies the PDF.js worker into /public so the in-browser PDF viewer works everywhere.
import fs from "node:fs";
import path from "node:path";
const src = path.resolve("node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const dest = path.resolve("public/pdf.worker.min.mjs");
if (fs.existsSync(src)) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("✓ PDF.js worker copied to public/");
}
