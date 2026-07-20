/* md.js — tiny markdown → HTML renderer for walkthrough pages.
   Supports: headings, bold/italic/code, links, images, ul/ol lists (one nesting level),
   blockquotes, hr, tables, fenced code blocks, paragraphs. Escapes raw HTML. */
"use strict";

function mdToHtml(src) {
  const escapeHtml = s => s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // inline formatting, applied to already-escaped text
  const inline = s => s
    .replace(/`([^`]+)`/g, (_, c) => "<code>" + c + "</code>")
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");

  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  let listStack = []; // open list tags, e.g. ["ul"] or ["ul","ul"]
  let para = [];

  const closeLists = (depth = 0) => {
    while (listStack.length > depth) out.push("</" + listStack.pop() + ">");
  };
  const flushPara = () => {
    if (para.length) {
      out.push("<p>" + inline(escapeHtml(para.join(" "))) + "</p>");
      para = [];
    }
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
