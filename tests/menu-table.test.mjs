// tests/menu-table.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { TABLE_TEMPLATE, cellPriceCents, parseDelimited, parseMenuTable, rowsToText } from "../src/lib/menu-table.ts";

test("the template we hand out imports cleanly", () => {
  const { sections, skipped } = parseMenuTable(TABLE_TEMPLATE);
  assert.deepEqual(skipped, []);
  assert.deepEqual(sections.map((s) => [s.name, s.items.length]), [["Vorspeisen", 2], ["Hauptspeisen", 1], ["Getränke", 1]]);
  const [bruschetta, vitello] = sections[0].items;
  assert.equal(bruschetta.name, "Bruschetta");
  assert.equal(bruschetta.price_cents, 750);
  assert.equal(bruschetta.description, "Geröstetes Brot mit Tomaten und Basilikum");
  assert.equal(bruschetta.allergens, "A");
  assert.equal(vitello.allergens, "C, D");
  assert.equal(sections[1].items[0].allergens, "A, C, G");
  const beer = sections[2].items[0];
  assert.equal(beer.name, "Hausbier");
  assert.deepEqual(beer.variants, [{ label: "0,3 l", price_cents: 390 }, { label: "0,5 l", price_cents: 490 }]);
  assert.equal(beer.price_cents, 390);
});

test("comma files with quotes, English headers, any column order", () => {
  const csv = 'Price,Product Name,Category,Description\n13,"Apple Pie, warm",Dessert,"A classic ""house"" pie"\n4.5,Espresso,Coffee,\n';
  const { sections, skipped } = parseMenuTable(csv);
  assert.deepEqual(skipped, []);
  assert.equal(sections[0].name, "Dessert");
  assert.equal(sections[0].items[0].name, "Apple Pie, warm");
  assert.equal(sections[0].items[0].description, 'A classic "house" pie');
  assert.equal(sections[0].items[0].price_cents, 1300);
  assert.equal(sections[1].items[0].price_cents, 450);
});

test("cells copied from Excel: tabs, no header row", () => {
  const { sections, skipped } = parseMenuTable("Suppen\tFrittatensuppe\t5,90\tA, C, G\nSuppen\tGulaschsuppe\t7,50\t\n");
  assert.deepEqual(skipped, []);
  assert.equal(sections.length, 1);
  assert.equal(sections[0].name, "Suppen");
  assert.deepEqual(sections[0].items.map((i) => [i.name, i.price_cents, i.allergens]), [["Frittatensuppe", 590, "A, C, G"], ["Gulaschsuppe", 750, null]]);
});

test("nothing is dropped silently", () => {
  const { sections, skipped } = parseMenuTable("Kategorie;Gericht;Preis\nVorspeisen;;5,00\nVorspeisen;Suppe;gratis\nVorspeisen;Tagesgericht;\nNachspeisen;;\n;Eis;4,00\n");
  assert.deepEqual(skipped, ["Zeile 2: kein Name", "Zeile 3: „Suppe“ — Preis „gratis“ nicht lesbar"]);
  assert.equal(sections[0].items[0].name, "Tagesgericht");
  assert.equal(sections[0].items[0].priceless, true);
  assert.equal(sections[1].name, "Nachspeisen"); // the heading row set the category for the next dish
  assert.equal(sections[1].items[0].name, "Eis");
});

test("a table we cannot read says so", () => {
  const { sections, skipped } = parseMenuTable("Hallo\nWelt\n");
  assert.equal(sections.length, 0);
  assert.equal(skipped.length, 1);
  assert.match(skipped[0], /Vorlage/);
});

test("prices as owners write them", () => {
  assert.equal(cellPriceCents("7,50"), 750);
  assert.equal(cellPriceCents("€ 7.50"), 750);
  assert.equal(cellPriceCents("7,5 EUR"), 750);
  assert.equal(cellPriceCents("12"), 1200);
  assert.equal(cellPriceCents("12,-"), 1200);
  assert.equal(cellPriceCents("gratis"), null);
  assert.equal(cellPriceCents("0,3 l"), null);
  assert.equal(cellPriceCents(""), null);
});

test("an Excel sheet travels to the server as tab text and reads the same", () => {
  const rows = parseDelimited(TABLE_TEMPLATE);
  assert.deepEqual(parseMenuTable(rowsToText(rows)), parseMenuTable(TABLE_TEMPLATE));
});
