// Reads the first sheet of an Excel file (.xlsx) into rows of text, in the browser.
// An .xlsx is a zip of XML files: the cells are in xl/worksheets/sheet1.xml and most texts sit
// in a shared table (xl/sharedStrings.xml) that the cells point into. Numbers come as written
// in the file ("7.5"), which the table import reads as a price.
import { strFromU8, unzipSync } from "fflate";

const MAX_BYTES = 5 * 1024 * 1024;

function columnIndex(ref: string): number {
  let n = 0;
  for (const ch of ref.replace(/\d+$/, "")) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

const textOf = (el: Element) => Array.from(el.getElementsByTagName("t"), (t) => t.textContent ?? "").join("");

export async function readXlsxRows(file: File): Promise<string[][]> {
  if (file.size > MAX_BYTES) throw new Error("Die Datei ist zu groß (höchstens 5 MB).");
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter: (f) => f.name === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(f.name) });
  } catch {
    throw new Error("Die Datei lässt sich nicht lesen. Bitte als .xlsx oder .csv speichern.");
  }
  const sheetName = Object.keys(files).filter((n) => n.startsWith("xl/worksheets/")).sort((a, b) => a.length - b.length || a.localeCompare(b))[0];
  if (!sheetName) throw new Error("In der Datei wurde kein Tabellenblatt gefunden.");

  const xml = (name: string) => new DOMParser().parseFromString(strFromU8(files[name]), "application/xml");
  const shared = files["xl/sharedStrings.xml"] ? Array.from(xml("xl/sharedStrings.xml").getElementsByTagName("si"), textOf) : [];

  const rows: string[][] = [];
  for (const rowEl of Array.from(xml(sheetName).getElementsByTagName("row"))) {
    const row: string[] = [];
    for (const c of Array.from(rowEl.getElementsByTagName("c"))) {
      const type = c.getAttribute("t");
      const v = c.getElementsByTagName("v")[0]?.textContent ?? "";
      const value = type === "s" ? shared[Number(v)] ?? "" : type === "inlineStr" ? textOf(c) : v;
      const i = columnIndex(c.getAttribute("r") ?? "");
      row[i >= 0 ? i : row.length] = value.trim();
    }
    const filled = Array.from(row, (cell) => cell ?? "");
    if (filled.some((cell) => cell !== "")) rows.push(filled);
  }
  return rows;
}
