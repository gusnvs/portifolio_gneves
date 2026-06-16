import { writeFileSync } from "node:fs";

// Builds a tiny but valid placeholder PDF (no dependencies).
const content = [
  "BT /F1 30 Tf 72 720 Td (Gustavo Neves) Tj ET",
  "BT /F1 13 Tf 72 694 Td (Full-Stack Developer and Creative Technologist) Tj ET",
  "BT /F1 11 Tf 72 660 Td (This is a placeholder resume.) Tj ET",
  "BT /F1 11 Tf 72 644 Td (Visit the live site for projects, stack, experience and contact.) Tj ET",
  "BT /F1 10 Tf 72 610 Td (hello@gustavoneves.dev) Tj ET",
].join("\n");

const objs = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
];

let pdf = "%PDF-1.4\n";
const offsets = [];
objs.forEach((body, i) => {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xrefStart = pdf.length;
pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
offsets.forEach((off) => {
  pdf += String(off).padStart(10, "0") + " 00000 n \n";
});
pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

writeFileSync(new URL("../apps/web/public/resume.pdf", import.meta.url), pdf, "latin1");
console.log("Wrote apps/web/public/resume.pdf");
