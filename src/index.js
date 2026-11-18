// Copyright (c) 2022 ambuda.org
// SPDX-License-Identifier: MIT
// JavaScript adaptation of Vidyut's splitter.rs and sounds.rs. See NOTICE.md.

const VOWELS = new Set("aAiIuUfFxXeEoO");
const CONSONANTS = new Set("kKgGNcCjJYwWqQRtTdDnpPbBmyrlvzSsh");
const SANSKRIT_SOUNDS = new Set("aAiIuUfFxXeEoOMHkKgGNcCjJYwWqQRtTdDnpPbBmyrlvSzshL'");
const VALID_FINALS = new Set("aAiIuUfFxXeEoOHkNwRtpnmsr");
const SEMIVOWELS = new Set("yrlv");
const SPARSHA = new Set("kKgGNcCjJYwWqQRtTdDnpPbBm");

function isValidFirst(text) {
  const last = text[text.length - 1];
  const previous = text[text.length - 2];
  if ((VOWELS.has(previous) && VOWELS.has(last))
      || (CONSONANTS.has(previous) && CONSONANTS.has(last))) {
    return false;
  }
  return last === undefined || VALID_FINALS.has(last);
}

function isValidSecond(text) {
  const initial = text[0];
  const following = text[1];
  if (VOWELS.has(initial) && VOWELS.has(following)) {
    return text.startsWith("afR");
  }
  return !(SEMIVOWELS.has(initial) && SPARSHA.has(following));
}

function createSplit(text, first, second, isEndOfChunk, kind) {
  return {
    first,
    second,
    isValid: isValidFirst(first) && isValidSecond(second),
    isRecursive: second === text,
    isEndOfChunk,
    kind,
  };
}

function parseRules(csvText) {
  if (typeof csvText !== "string") {
    throw new TypeError("Expected the sandhi rules as CSV text");
  }
  const [header, ...rows] = csvText.replace(/^\uFEFF/, "").split(/\r\n?|\n/);
  if (header !== "first,second,result") {
    throw new Error("Expected sandhi CSV header first,second,result");
  }

  const splitsByResult = new Map();
  let longestKeyLength = 0;
  function addRule(key, pair) {
    const existing = splitsByResult.get(key);
    if (existing) {
      existing.push(pair);
    } else {
      splitsByResult.set(key, [pair]);
    }
    longestKeyLength = Math.max(longestKeyLength, key.length);
  }

  for (const [index, row] of rows.entries()) {
    if (row === "") {
      continue;
    }
    const columns = row.split(",");
    const [first, second, result] = columns;
    if (columns.length !== 3 || !first || !result || row.includes('"')) {
      throw new Error(`Invalid sandhi CSV row ${index + 2}`);
    }
    const pair = [first, second];
    addRule(result, pair);
    const joinedResult = result.replaceAll(" ", "");
    if (joinedResult !== result) {
      addRule(joinedResult, pair);
    }
  }
  if (splitsByResult.size === 0) {
    throw new Error("Sandhi CSV contains no rules");
  }
  return { splitsByResult, longestKeyLength };
}

function checkText(text) {
  if (typeof text !== "string") {
    throw new TypeError("Expected SLP1 text");
  }
}

/** Creates an inverse splitter from Vidyut's generated first,second,result CSV. */
export function createSandhiSplitter(csvText) {
  const { splitsByResult, longestKeyLength } = parseRules(csvText);

  function splitAt(text, index) {
    checkText(text);
    if (!Number.isInteger(index) || index < 0 || index >= text.length) {
      throw new RangeError("The split index must refer to a character in the input");
    }

    const prefix = text.slice(0, index + 1);
    const remainder = text.slice(index + 1).trimStart();
    const splits = [
      createSplit(text, prefix, remainder, !SANSKRIT_SOUNDS.has(text[index + 1]), "prefix"),
    ];

    if (prefix === "sa" || prefix === "eza") {
      splits.push(createSplit(text, prefix + "s", remainder, true, "standard"));
    }
    if (index + 1 === text.length && text.endsWith("H")) {
      const withoutVisarga = text.slice(0, -1);
      splits.push(createSplit(text, withoutVisarga + "s", "", true, "standard"));
      splits.push(createSplit(text, withoutVisarga + "r", "", true, "standard"));
    }

    const leadingText = text.slice(0, index);
    // The upstream rule loop excludes matches that end exactly at end-of-input.
    const endLimit = Math.min(text.length, index + longestKeyLength + 1);
    for (let end = index + 1; end < endLimit; end++) {
      const key = text.slice(index, end);
      const matches = splitsByResult.get(key);
      if (!matches) {
        continue;
      }
      const isEndOfChunk = key.includes(" ");
      const trailingText = text.slice(end);
      for (const [first, second] of matches) {
        splits.push(createSplit(
          text, leadingText + first, (second + trailingText).trimStart(), isEndOfChunk, "standard",
        ));
      }
    }
    return splits;
  }

  function splitAll(text) {
    checkText(text);
    const splits = [];
    for (let index = 0; SANSKRIT_SOUNDS.has(text[index]); index++) {
      for (const split of splitAt(text, index)) {
        splits.push(split);
      }
    }
    return splits;
  }

  return { splitAt, splitAll };
}
