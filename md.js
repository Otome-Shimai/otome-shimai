/* md.js — tiny markdown → HTML renderer for walkthrough pages.
   Supports: headings, bold/italic/code, links, images, ul/ol lists (one nesting level),
   blockquotes, hr, tables, fenced code blocks, paragraphs. Escapes raw HTML.

   Images take an optional quoted title, which becomes a visible caption:
   ![alt text](images/foo.png "Caption shown under the photo"). An image alone in its
   own paragraph is rendered as <figure> (+ <figcaption> when it has a title); an image
   inline in a sentence stays an <img>, with the title as its tooltip. Alt text is kept
   separate from the caption so screen readers still get a description either way. */
"use strict";

function mdToHtml(src) {
  const escapeHtml = s => s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // the quoted title in ![alt](src "title") — escapeHtml has already turned its
  // double quotes into &quot; by the time these patterns run
  const IMG = new RegExp("!\\[([^\\]]*)\\]\\(([^)\\s]+)(?:\\s+&quot;(.*?)&quot;)?\\)", "g");

  // inline formatting, applied to already-escaped text. `code spans` are lifted out
  // first and put back last, so a post can show markup literally (a guide that writes
  // `![alt](file.png)` in backticks means to print it, not to embed a picture).
  const inline = s => {
    const spans = [];
    // the placeholder is NUL-delimited: no markdown source can contain one, so it
    // cannot collide with ordinary prose the way a printable marker would
    const held = s.replace(/`([^`]+)`/g, (_, c) => "\u0000" + (spans.push(c) - 1) + "\u0000");
    return held
      .replace(IMG, (_, alt, src, title) =>
        '<img src="' + src + '" alt="' + alt + '"' + (title ? ' title="' + title + '"' : "") + ">")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/\u0000(\d+)\u0000/g, (_, n) => "<code>" + spans[n] + "</code>");
  };

  // an image alone in a paragraph becomes a figure, so its title can be a real caption
  const IMG_ONLY = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/;

  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let listStack = []; // open list tags, e.g. ["ul"] or ["ul","ul"]
  let para = [];

  const closeLists = (depth = 0) => {
    while (listStack.length > depth) out.push("</" + listStack.pop() + ">");
  };
  const flushPara = () => {
    if (!para.length) return;
    const text = para.join(" ");
    const img = text.match(IMG_ONLY);
    if (img) {
      const [, alt, src, caption] = img;
      out.push("<figure>" +
        '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '">' +
        (caption ? "<figcaption>" + inline(escapeHtml(caption)) + "</figcaption>" : "") +
        "</figure>");
    } else {
      out.push("<p>" + inline(escapeHtml(text)) + "</p>");
    }
    para = [];
  };
  const flush = () => { flushPara(); closeLists(); };

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block
    if (/^```/.test(line)) {
      flush();
      const code = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
      i++; // skip closing fence
      out.push("<pre><code>" + escapeHtml(code.join("\n")) + "</code></pre>");
      continue;
    }

    // table: header row followed by |---|---| separator
    if (/^\s*\|/.test(line) && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      flush();
      const cells = row => row.trim().replace(/^\||\|$/g, "").split("|")
        .map(c => inline(escapeHtml(c.trim())));
      out.push("<table><thead><tr>" +
        cells(line).map(c => "<th>" + c + "</th>").join("") + "</tr></thead><tbody>");
      i += 2;
      while (i < lines.length && /^\s*\|/.test(lines[i])) {
        out.push("<tr>" + cells(lines[i]).map(c => "<td>" + c + "</td>").join("") + "</tr>");
        i++;
      }
      out.push("</tbody></table>");
      continue;
    }

    // heading
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      flush();
      const n = h[1].length;
      out.push(`<h${n}>` + inline(escapeHtml(h[2].trim())) + `</h${n}>`);
      i++;
      continue;
    }

    // horizontal rule
    if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
      flush();
      out.push("<hr>");
      i++;
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      flush();
      const quote = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      out.push("<blockquote>" + mdToHtml(quote.join("\n")) + "</blockquote>");
      continue;
    }

    // list item (- or * or 1.), one optional nesting level via indentation
    const li = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)/);
    if (li) {
      flushPara();
      const depth = li[1].length >= 2 ? 2 : 1;
      const tag = /\d/.test(li[2]) ? "ol" : "ul";
      while (listStack.length > depth) out.push("</" + listStack.pop() + ">");
      while (listStack.length < depth) {
        listStack.push(tag);
        out.push("<" + tag + ">");
      }
      // task-list items: "- [ ] thing" / "- [x] thing"
      const task = li[3].match(/^\[([ xX])\]\s+(.*)/);
      const body = task
        ? (task[1] === " " ? "☐ " : "☑ ") + task[2]
        : li[3];
      out.push("<li>" + inline(escapeHtml(body)) + "</li>");
      i++;
      continue;
    }

    // blank line
    if (/^\s*$/.test(line)) {
      flush();
      i++;
      continue;
    }

    // paragraph text (a plain line following a list closes the list)
    if (!para.length) closeLists();
    para.push(line.trim());
    i++;
  }
  flush();
  return out.join("\n");
}
