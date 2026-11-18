// SPDX-License-Identifier: MIT

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createSandhiSplitter } from "../src/index.js";

const csv = await readFile(new URL("../data/rules.csv", import.meta.url), "utf8");

function splitterFromRows(...rows) {
  return createSandhiSplitter(["first,second,result", ...rows].join("\n"));
}

test("ships the original release table and can reverse every row", () => {
  const rows = csv.trimEnd().split(/\r?\n/).slice(1);
  assert.equal(rows.length, 1468);
  assert.equal(
    createHash("sha256").update(csv).digest("hex"),
    "f691868cdf76da8c4034c690603a70929d0c18335306c6254f86347b208999a7",
  );

  const splitter = createSandhiSplitter(csv);
  for (const row of rows) {
    const [first, second, result] = row.split(",");
    for (const key of new Set([result, result.replaceAll(" ", "")])) {
      const candidates = splitter.splitAt(key + "ra", 0);
      assert.ok(candidates.some((candidate) => (
        candidate.kind === "standard" && candidate.first === first
        && candidate.second === second + "ra" && candidate.isEndOfChunk === key.includes(" ")
      )), row);
    }
  }
});

test("offers valid inverse-sandhi candidates for joined SLP1 text", () => {
  const splitter = createSandhiSplitter(csv);
  const examples = [
    ["rAmo'sti", "rAmas", "asti"],
    ["gacCatyeva", "gacCati", "eva"],
    ["taTEva", "taTa", "eva"],
    ["aByudayaH", "aBi", "udayaH"],
  ];
  for (const [text, first, second] of examples) {
    assert.ok(splitter.splitAll(text).some((candidate) => (
      candidate.kind === "standard" && candidate.first === first && candidate.second === second
      && candidate.isValid === true && candidate.isRecursive === false
    )), text);
  }
});

test("returns the prefix first and reads the matching rules in order", () => {
  const splitter = splitterFromRows("a,i,e", "a,I,e", "A,i,e", "A,I,e", "a,i,e");
  assert.deepEqual(
    splitter.splitAt("ceti", 1).map(({ first, second, kind }) => [first, second, kind]),
    [
      ["ce", "ti", "prefix"],
      ["ca", "iti", "standard"],
      ["ca", "Iti", "standard"],
      ["cA", "iti", "standard"],
      ["cA", "Iti", "standard"],
      ["ca", "iti", "standard"],
    ],
  );
  const initial = splitterFromRows("a,f,ar", "a,F,ar", "A,f,ar", "A,F,ar");
  assert.deepEqual(
    initial.splitAt("arka", 0).map(({ first, second }) => [first, second]),
    [["a", "rka"], ["a", "fka"], ["a", "Fka"], ["A", "fka"], ["A", "Fka"]],
  );
});

test("restores a spaced boundary and only scans the leading chunk", () => {
  const splitter = splitterFromRows("as,a,o '");
  const crossing = splitter.splitAll("rAmo 'sti").find(({ first }) => first === "rAmas");
  assert.deepEqual(crossing, {
    first: "rAmas",
    second: "asti",
    isValid: true,
    isRecursive: false,
    isEndOfChunk: true,
    kind: "standard",
  });

  const [prefix] = splitter.splitAt("nare \t ca", 3);
  assert.deepEqual([prefix.first, prefix.second, prefix.isEndOfChunk], ["nare", "ca", true]);
  assert.deepEqual(
    splitter.splitAll("a'La| iti").map(({ first, second, isEndOfChunk }) => [first, second, isEndOfChunk]),
    [["a", "'La| iti", false], ["a'", "La| iti", false], ["a'L", "a| iti", false], ["a'La", "| iti", true]],
  );
  assert.deepEqual(splitter.splitAll("| iti"), []);
  assert.deepEqual(splitter.splitAll(""), []);
});

test("handles the pronouns and final visarga special cases", () => {
  const splitter = splitterFromRows("s,,H");
  assert.deepEqual(
    splitter.splitAt("devaH", 4).map(({ first, second, isEndOfChunk, kind }) => [first, second, isEndOfChunk, kind]),
    [["devaH", "", true, "prefix"], ["devas", "", true, "standard"], ["devar", "", true, "standard"]],
  );
  const [prefix, restored] = splitter.splitAt("naraH \t sa", 4);
  assert.deepEqual([prefix.first, prefix.second, prefix.isEndOfChunk], ["naraH", "sa", true]);
  assert.deepEqual([restored.first, restored.second, restored.isEndOfChunk], ["naras", "sa", false]);

  for (const [text, index, first, second] of [["sagacCati", 1, "sas", "gacCati"], ["eza asti", 2, "ezas", "asti"]]) {
    const [, candidate] = splitter.splitAt(text, index);
    assert.deepEqual([candidate.first, candidate.second, candidate.isEndOfChunk], [first, second, true]);
  }
});

test("keeps the upstream exclusive end of the inverse-rule scan", () => {
  const splitter = splitterFromRows("a,i,e", "a,f,ar");
  assert.deepEqual(splitter.splitAt("ce", 1).map(({ first }) => first), ["ce"]);
  assert.deepEqual(splitter.splitAt("kar", 1).map(({ first }) => first), ["ka"]);
  assert.deepEqual(splitter.splitAt("kar|", 1).map(({ first }) => first), ["ka", "ka"]);
});

test("marks phonetic validity and recursive candidates separately", () => {
  const splitter = createSandhiSplitter(csv);
  const recursive = splitter.splitAt("AnandaH", 0).find(({ first, second }) => first === "a" && second === "AnandaH");
  assert.equal(recursive.isValid, true);
  assert.equal(recursive.isRecursive, true);

  const examples = [
    ["PalaM", "asti", false],
    ["zaz", "asti", false],
    ["vAc", "asti", false],
    ["raI", "asti", false],
    ["rakt", "asti", false],
    ["vAk", "afRin", true],
    ["rAma", "rmakzetre", false],
    ["rAma", "lga", false],
    ["rAma", "aitad", false],
    ["rAma", "fasya", false],
    ["rAma", "vyajanam", true],
  ];
  for (const [first, second, isValid] of examples) {
    const [prefix] = splitter.splitAt(`${first} ${second}`, first.length - 1);
    assert.equal(prefix.isValid, isValid, `${first} ${second}`);
    assert.equal(prefix.isRecursive, false);
  }
});

test("loads generated CSV syntax and rejects a malformed table or index", () => {
  const splitter = createSandhiSplitter("\uFEFFfirst,second,result\r\na,i,e\r\n\r\n");
  assert.equal(splitter.splitAt("ceti", 1)[1].second, "iti");
  assert.throws(() => createSandhiSplitter(42), TypeError);
  assert.throws(() => createSandhiSplitter("first,second,result\n"), /no rules/i);
  assert.throws(() => createSandhiSplitter("first,second,wrong\na,i,e"), /header/i);
  assert.throws(() => splitterFromRows("a,i"), /row 2/i);
  assert.throws(() => splitter.splitAt("ceti", -1), RangeError);
  assert.throws(() => splitter.splitAt("ceti", 1.5), RangeError);
  assert.throws(() => splitter.splitAt("ceti", 4), RangeError);
});
