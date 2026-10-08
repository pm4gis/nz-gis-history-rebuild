const fs = require("node:fs");
const path = require("node:path");
const PdfPrinter = require("pdfmake");

const root = path.resolve(__dirname, "..");
const chapterDirectory = path.join(root, "src/content/chapters");
const chapterFile = fs.readdirSync(chapterDirectory).find((name) => name.endsWith(".json"));
if (!chapterFile) throw new Error("No sample chapter is available for PDF generation.");
const chapter = JSON.parse(fs.readFileSync(path.join(chapterDirectory, chapterFile), "utf8"));
const fontDirectory = path.join(root, ".cache/pdf-fonts");
const bundledFonts = require("pdfmake/build/vfs_fonts.js");
fs.mkdirSync(fontDirectory, { recursive: true });
for (const name of ["Roboto-Regular.ttf", "Roboto-Medium.ttf", "Roboto-Italic.ttf", "Roboto-MediumItalic.ttf"]) {
  const encoded = bundledFonts[name];
  if (!encoded) throw new Error("Missing bundled PDF font: " + name);
  fs.writeFileSync(path.join(fontDirectory, name), Buffer.from(encoded, "base64"));
}
const fonts = {
  Roboto: {
    normal: path.join(fontDirectory, "Roboto-Regular.ttf"),
    bold: path.join(fontDirectory, "Roboto-Medium.ttf"),
    italics: path.join(fontDirectory, "Roboto-Italic.ttf"),
    bolditalics: path.join(fontDirectory, "Roboto-MediumItalic.ttf"),
  },
};
for (const font of Object.values(fonts.Roboto)) if (!fs.existsSync(font)) throw new Error("Missing PDF font file: " + font);
const printer = new PdfPrinter(fonts);
const content = [
  { text: "A HISTORY OF GIS IN NEW ZEALAND", style: "kicker" },
  { text: "Chapter " + chapter.number, style: "chapterNumber" },
  { text: chapter.name, style: "title" },
  { image: path.join(root, "public", chapter.heroImage.path.replace(/^\//, "")), fit: [330, 120], alignment: "center", margin: [0, 2, 0, 5] },
  { text: chapter.heroImage.title + " · " + chapter.heroImage.author + " · " + chapter.heroImage.license, style: "caption", alignment: "center", margin: [0, 0, 0, 8] },
  { text: "Staging edition · Source snapshot " + new Date().toISOString().slice(0, 10), style: "meta" },
  { text: "Source-note wording and image credits are retained from the published chapter.", style: "notice", margin: [0, 8, 0, 20] },
];
for (const section of chapter.sections) {
  content.push({ text: section.title, style: "section", headlineLevel: 1 });
  for (const block of section.blocks) {
    if (block.type === "figure") {
      const imagePath = path.join(root, "public", block.asset.replace(/^\//, ""));
      content.push({ image: imagePath, fit: [330, 220], alignment: "center", margin: [0, 5, 0, 2] });
      content.push({ text: block.caption || block.alt || "Chapter image", style: "caption" });
      content.push({ text: "Credit: " + (block.source || chapter.heroImage.author + " · " + chapter.heroImage.license), style: "caption", margin: [0, 0, 0, 8] });
    } else content.push({ text: block.text || block.markdown || "", style: "body" });
  }
}
content.push({ text: "Chapter source notes", style: "section", headlineLevel: 1, pageBreak: "before" });
chapter.sourceNotes.forEach((note, index) => content.push({ text: (index + 1) + ". " + note.text, style: "source" }));
content.push({ text: "Hero image: " + chapter.heroImage.title + ". Credit: " + chapter.heroImage.author + "; " + chapter.heroImage.license + ". " + chapter.heroImage.licenseUrl, style: "source", margin: [0, 10, 0, 0] });

const definition = {
  pageSize: "A5",
  pageMargins: [42, 48, 42, 48],
  info: { title: "Chapter " + chapter.number + " — " + chapter.name, author: "A History of GIS in New Zealand" },
  defaultStyle: { font: "Roboto", color: "#172321" },
  header: (currentPage) => currentPage === 1 ? null : ({ text: "A History of GIS in New Zealand · Chapter " + chapter.number, alignment: "right", margin: [42, 22, 42, 0], fontSize: 7, color: "#5b6964" }),
  footer: (currentPage, pageCount) => ({ text: currentPage + " / " + pageCount, alignment: "center", margin: [0, 0, 0, 20], fontSize: 8, color: "#5b6964" }),
  content,
  styles: {
    kicker: { fontSize: 8, bold: true, color: "#176b55", characterSpacing: 1.1, margin: [0, 0, 0, 18] },
    chapterNumber: { fontSize: 12, bold: true, color: "#176b55", margin: [0, 0, 4, 0] },
    title: { fontSize: 25, bold: true, lineHeight: 1.15, margin: [0, 0, 9, 0] },
    meta: { fontSize: 8, color: "#5b6964", margin: [0, 0, 0, 8] },
    notice: { fontSize: 8, color: "#5b6964", italics: true },
    section: { fontSize: 15, bold: true, color: "#104d40", margin: [0, 17, 0, 7], keepWithNext: true },
    body: { fontSize: 9.2, lineHeight: 1.35, margin: [0, 0, 0, 8] },
    caption: { fontSize: 8, color: "#5b6964", italics: true, margin: [0, 4, 0, 2] },
    source: { fontSize: 8, lineHeight: 1.25, margin: [0, 0, 0, 5] },
  },
};
const outputDirectory = path.join(root, "dist/downloads");
fs.mkdirSync(outputDirectory, { recursive: true });
const output = path.join(outputDirectory, "chapter-" + chapter.number + "-a5.pdf");
const pdf = printer.createPdfKitDocument(definition);
const writeStream = fs.createWriteStream(output);
pdf.pipe(writeStream);
pdf.end();
writeStream.on("finish", () => console.log("Generated A5 PDF: dist/downloads/chapter-" + chapter.number + "-a5.pdf (" + fs.statSync(output).size + " bytes)"));
writeStream.on("error", (error) => { console.error(error); process.exitCode = 1; });
