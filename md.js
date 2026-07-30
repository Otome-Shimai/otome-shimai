/* md.js — markdown → HTML renderer for the blog. It aims to render GitHub-flavored
   markdown the way github.com's editor preview does, so what an author sees while
   writing a post is what the site shows.

   Blocks: # h1 – ###### h6 and setext (=== / --- underlines), both with GitHub-style
   anchor ids; paragraphs with hard breaks (two trailing spaces or a trailing
   backslash); ``` / ~~~ fenced and 4-space-indented code blocks; nested blockquotes
   with lazy continuation; nested - * + / 1. 1) lists with task-list checkboxes;
   tables with :---: alignment; horizontal rules.
   Inline: **bold**, *italic*, __bold__, _italic_ (underscores never trigger inside
   snake_case words), ~~strikethrough~~ (single ~tildes~ too, like GitHub),
   `code spans` (``double backticks`` may contain backticks), links with titles,
   reference links [text][ref], bare/angle autolinked URLs and emails, footnotes
   [^1], :emoji: shortcodes (unknown codes stay as typed, same as GitHub),
   HTML entities (&copy; &#9829;), and backslash escapes (\~ prints a tilde).

   Raw HTML is escaped and shows as typed, except a small safe whitelist:
   <br> <b> <i> <em> <strong> <u> <s> <sub> <sup> <ins> <del> <kbd> <mark> <small>
   <details> <summary> <span> — attribute-free, plus <span style="color:…"> for
   colored text (GitHub strips the color but still shows the words).

   Site extension beyond GitHub: an image with a quoted title alone in its own
   paragraph renders as a <figure> with the title as a visible caption; an inline
   image keeps the title as its tooltip. Alt text stays separate from the caption
   so screen readers get a description either way.

   The source deliberately contains no doubled backslashes or unicode escapes —
   regexes that would need them are built from strings at runtime. */
"use strict";

function mdToHtml(src, _ctx) {
  const CH = String.fromCharCode;
  // placeholder delimiters: control chars no markdown source can contain
  const BS = CH(92), NUL = CH(0), ESC = CH(1), RAW = CH(2), BRK = CH(3), PIPE = CH(4);

  const escapeHtml = s => s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  // built from strings so the file itself never holds a doubled backslash
  const RX_ESCAPE = new RegExp(BS + BS + "(&amp;|[" + "`*_~(){}#!|.+" + BS + BS + BS + "[" + BS + "]-])", "g");
  const RX_CODE = new RegExp(NUL + "([0-9]+)" + NUL, "g");
  const RX_ESC = new RegExp(ESC + "([0-9]+)" + ESC, "g");
  const RX_RAW = new RegExp(RAW + "([0-9]+)" + RAW, "g");
  const RX_BRK = new RegExp(BRK, "g");
  const RX_ESCPIPE = new RegExp(BS + BS + "[|]", "g");
  const RX_PIPE = new RegExp(PIPE, "g");

  const safeUrl = u => /^\s*(javascript|vbscript|data):/i.test(u) ? "#" : u;

  const EMOJI = {
    smile: "😄", smiley: "😃", grin: "😁", laughing: "😆", joy: "😂", rofl: "🤣",
    blush: "😊", relaxed: "☺️", wink: "😉", heart_eyes: "😍", kissing_heart: "😘",
    smiling_face_with_three_hearts: "🥰", yum: "😋", stuck_out_tongue: "😛",
    stuck_out_tongue_winking_eye: "😜", zany_face: "🤪", sunglasses: "😎",
    smirk: "😏", unamused: "😒", roll_eyes: "🙄", thinking: "🤔", flushed: "😳",
    pleading_face: "🥺", cry: "😢", sob: "😭", scream: "😱", angry: "😠",
    rage: "😡", exploding_head: "🤯", sleeping: "😴", sweat_smile: "😅",
    upside_down_face: "🙃", innocent: "😇", star_struck: "🤩", partying_face: "🥳",
    grimacing: "😬", weary: "😩", tired_face: "😫", triumph: "😤", skull: "💀",
    ghost: "👻", robot: "🤖",
    heart: "❤️", orange_heart: "🧡", yellow_heart: "💛", green_heart: "💚",
    blue_heart: "💙", purple_heart: "💜", black_heart: "🖤", white_heart: "🤍",
    broken_heart: "💔", two_hearts: "💕", revolving_hearts: "💞", heartbeat: "💓",
    heartpulse: "💗", sparkling_heart: "💖", cupid: "💘", gift_heart: "💝",
    kiss: "💋", love_letter: "💌",
    sparkles: "✨", star: "⭐", star2: "🌟", dizzy: "💫", boom: "💥", fire: "🔥",
    tada: "🎉", confetti_ball: "🎊", balloon: "🎈", gift: "🎁", trophy: "🏆",
    crown: "👑", gem: "💎", ribbon: "🎀", ring: "💍", lipstick: "💄",
    cherry_blossom: "🌸", blossom: "🌼", hibiscus: "🌺", sunflower: "🌻",
    rose: "🌹", tulip: "🌷", bouquet: "💐", four_leaf_clover: "🍀", herb: "🌿",
    maple_leaf: "🍁",
    strawberry: "🍓", peach: "🍑", cherries: "🍒", cake: "🍰", birthday: "🎂",
    cookie: "🍪", candy: "🍬", lollipop: "🍭", chocolate_bar: "🍫", icecream: "🍦",
    coffee: "☕", tea: "🍵", dango: "🍡", sushi: "🍣", ramen: "🍜", bento: "🍱",
    rice_ball: "🍙", sake: "🍶", shaved_ice: "🍧",
    thumbsup: "👍", "+1": "👍", thumbsdown: "👎", "-1": "👎", ok_hand: "👌",
    clap: "👏", raised_hands: "🙌", pray: "🙏", muscle: "💪", wave: "👋",
    point_right: "👉", point_left: "👈", point_up: "👆", point_down: "👇",
    eyes: "👀", 100: "💯",
    heavy_check_mark: "✔️", white_check_mark: "✅", x: "❌", o: "⭕",
    warning: "⚠️", question: "❓", exclamation: "❗", bangbang: "‼️", zzz: "💤",
    speech_balloon: "💬", thought_balloon: "💭", bulb: "💡", key: "🔑",
    lock: "🔒", mag: "🔍", link: "🔗", pushpin: "📌", paperclip: "📎",
    memo: "📝", pencil2: "✏️", book: "📖", books: "📚", bookmark: "🔖",
    art: "🎨", camera: "📷", movie_camera: "🎥", clapper: "🎬", tv: "📺",
    video_game: "🎮", game_die: "🎲", dart: "🎯", headphones: "🎧",
    microphone: "🎤", musical_note: "🎵", notes: "🎶", computer: "💻",
    iphone: "📱", envelope: "✉️", calendar: "📅", hourglass: "⌛",
    alarm_clock: "⏰", bell: "🔔", mega: "📣", rocket: "🚀",
    sunny: "☀️", cloud: "☁️", rainbow: "🌈", snowflake: "❄️", zap: "⚡",
    droplet: "💧", ocean: "🌊", umbrella: "☔", crescent_moon: "🌙",
    cat: "🐱", dog: "🐶", rabbit: "🐰", bear: "🐻", panda_face: "🐼",
    koala: "🐨", fox_face: "🦊", unicorn: "🦄", butterfly: "🦋", penguin: "🐧",
    tennis: "🎾", soccer: "⚽", basketball: "🏀", baseball: "⚾",
    volleyball: "🏐", ping_pong: "🏓", badminton: "🏸", school: "🏫",
    fireworks: "🎆", sparkler: "🎇", wind_chime: "🎐", kimono: "👘",
    izakaya_lantern: "🏮", japanese_castle: "🏯", tokyo_tower: "🗼",
    mount_fuji: "🗻",
  };

  // shared across the whole document (and blockquote recursion): link reference
  // definitions, footnote definitions and use order, heading ids already taken
  const ctx = _ctx || {
    links: Object.create(null),
    notes: Object.create(null),
    noteUsed: [],
    ids: Object.create(null),
  };

  const lines = src.replace(/\r\n?/g, "\n").split("\n");

  // definition pre-pass, top-level call only: collect and remove
  // "[ref]: url" link definitions and "[^name]: text" footnote definitions
  if (!_ctx) {
    for (let j = 0; j < lines.length; j++) {
      let m = lines[j].match(/^ {0,3}\[\^([^\]\s]+)\]:\s+(.*)$/);
      if (m) {
        let text = m[2];
        lines[j] = null;
        while (j + 1 < lines.length && /^ {2,}\S/.test(lines[j + 1])) {
          text += " " + lines[++j].trim();
          lines[j] = null;
        }
        ctx.notes[m[1]] = text;
        continue;
      }
      m = lines[j].match(/^ {0,3}\[([^\]^][^\]]*)\]:\s*(\S+)(?:\s+["'(]([^]*)["')])?\s*$/);
      if (m) {
        ctx.links[m[1].toLowerCase()] = { href: m[2], title: m[3] };
        lines[j] = null;
      }
    }
    for (let j = lines.length - 1; j >= 0; j--) if (lines[j] === null) lines.splice(j, 1);
  }

  // inline formatting, applied to already-escaped text. Three kinds of pieces are
  // lifted into placeholders while the passes run and put back at the end: code
  // spans, backslash-escaped characters, and finished HTML (links, images, allowed
  // tags) — lifting finished HTML keeps later passes from mangling URLs.
  const inline = s => {
    const codes = [], escs = [], raws = [];
    const hold = h => RAW + (raws.push(h) - 1) + RAW;
    const link = (label, href, title) =>
      hold('<a href="' + safeUrl(href) + '"' + (title ? ' title="' + title + '"' : "") + ">") +
      label + hold("</a>");

    let t = s
      .replace(/(`+)([^]*?[^`])\1(?!`)/g, (m, tick, c) => {
        if (/^ [^]*[^ ] $/.test(c)) c = c.slice(1, -1); // GFM strips one framing space
        return NUL + (codes.push(c) - 1) + NUL;
      })
      .replace(RX_ESCAPE, (m, ch) => ESC + (escs.push(ch) - 1) + ESC);

    // footnote references become numbered superscript links; numbering follows
    // order of first use, like GitHub
    t = t.replace(/\[\^([^\]\s]+)\]/g, (m, name) => {
      if (!(name in ctx.notes)) return m;
      let n = ctx.noteUsed.indexOf(name);
      const first = n < 0;
      if (first) n = ctx.noteUsed.push(name) - 1;
      // only the first reference carries the backlink id, so ids stay unique
      return hold('<sup><a href="#fn-' + (n + 1) + '"' + (first ? ' id="fnref-' + (n + 1) + '"' : "") + ">" + (n + 1) + "</a></sup>");
    });

    t = t
      .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^]*?)&quot;)?\)/g, (m, alt, url, title) =>
        hold('<img src="' + safeUrl(url) + '" alt="' + alt + '"' + (title ? ' title="' + title + '"' : "") + ">"))
      // the label stays in the stream so bold/italics inside it still format
      .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;([^]*?)&quot;)?\)/g, (m, label, url, title) =>
        link(label, url, title))
      .replace(/\[([^\]]+)\]\[([^\]]*)\]/g, (m, label, ref) => {
        const def = ctx.links[(ref || label).toLowerCase()];
        return def ? link(label, def.href, def.title) : m;
      })
      .replace(/\[([^\]]+)\](?![(\[])/g, (m, label) => {
        const def = ctx.links[label.toLowerCase()];
        return def ? link(label, def.href, def.title) : m;
      })
      .replace(/&lt;(https?:[^\s]+?)&gt;/g, (m, u) => hold('<a href="' + u + '">' + u + "</a>"))
      .replace(/&lt;([\w.+-]+@[\w.-]+)&gt;/g, (m, u) => hold('<a href="mailto:' + u + '">' + u + "</a>"))
      .replace(/(^|[\s(])(https?:[^\s]+|www\.[^\s]+)/g, (m, pre, u) => {
        const url = u.replace(/[.,:;!?]+$/, ""); // trailing punctuation stays prose
        const href = url.slice(0, 4) === "www." ? "http://" + url : url;
        return pre + hold('<a href="' + href + '">' + url + "</a>") + u.slice(url.length);
      })
      .replace(/(^|[\s(])([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g, (m, pre, u) =>
        pre + hold('<a href="mailto:' + u + '">' + u + "</a>"));

    // the HTML whitelist: colored spans, then attribute-free formatting tags
    t = t
      .replace(/&lt;span style=(?:&quot;|')color:\s*([#\w(),.% -]+?)(?:&quot;|')&gt;/g,
        (m, col) => hold('<span style="color:' + col + '">'))
      .replace(/&lt;(\/?)(br|b|i|em|strong|u|s|span|sub|sup|ins|del|kbd|mark|small|details|summary)\s*\/?&gt;/gi,
        (m, close, tag) => hold("<" + close + tag.toLowerCase() + ">"));

    t = t
      .replace(/~~(?=\S)([^]+?\S)~~/g, "<del>$1</del>")
      .replace(/~(?=\S)([^~]*\S)~(?!~)/g, "<del>$1</del>")
      .replace(/\*\*\*(?=\S)([^]+?\S)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(?=\S)([^]+?\S)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(?=\S)([^*]*\S)\*/g, "<em>$1</em>")
      // underscore emphasis needs non-word neighbours, so snake_case stays intact
      .replace(/(^|[^\w])___(?=\S)([^]+?\S)___(?!\w)/g, "$1<strong><em>$2</em></strong>")
      .replace(/(^|[^\w])__(?=\S)([^]+?\S)__(?!\w)/g, "$1<strong>$2</strong>")
      .replace(/(^|[^\w])_(?=\S)([^_]*\S)_(?!\w)/g, "$1<em>$2</em>");

    t = t
      .replace(/:([a-z0-9_+-]+):/g, (m, name) => EMOJI[name] || m)
      // entities the author typed (&copy; &#9829;) render as characters
      .replace(/&amp;(#[0-9]{1,7}|#[xX][0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});/g, "&$1;");

    return t
      .replace(RX_RAW, (m, n) => raws[n])
      .replace(RX_CODE, (m, n) => "<code>" + codes[n] + "</code>")
      .replace(RX_ESC, (m, n) => escs[n])
      .replace(RX_BRK, "<br>");
  };

  // an image alone in a paragraph becomes a figure, so its title can be a real caption
  const IMG_ONLY = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/;

  const out = [];
  let i = 0;
  let listStack = []; // open list tags by nesting depth
  let liIdx = -1;     // index in `out` of the last <li>, for continuation lines
  let para = [];

  const closeLists = () => {
    while (listStack.length) out.push("</" + listStack.pop().tag + ">");
  };

  const heading = (n, text) => {
    const html = inline(escapeHtml(text.trim().replace(/\s+#+\s*$/, "")));
    // GitHub-style anchor id: tags stripped, lowercased, punctuation dropped,
    // spaces to dashes, duplicates numbered -1, -2, …
    let id = html.replace(/<[^>]+>/g, "").toLowerCase()
      .replace(/[!-\/:-@\[-`{-~—–‘’“”…·♡☆★]/g, ch => ch === "-" || ch === "_" ? ch : "")
      .trim().replace(/\s+/g, "-");
    if (id) {
      if (id in ctx.ids) id += "-" + ++ctx.ids[id];
      else ctx.ids[id] = 0;
    }
    out.push("<h" + n + (id ? ' id="' + id + '"' : "") + ">" + html + "</h" + n + ">");
  };

  const flushPara = () => {
    if (!para.length) return;
    // a line ending in two spaces or a backslash is a hard break
    const parts = para.map((ln, k) => {
      const t = ln.replace(/^\s+/, "");
      if (k < para.length - 1) {
        if (/ {2,}$/.test(t)) return t.replace(/\s+$/, "") + BRK;
        if (t.slice(-1) === BS && t.slice(-2) !== BS + BS) return t.slice(0, -1).replace(/\s+$/, "") + BRK;
      }
      return t.replace(/\s+$/, "");
    });
    let text = "";
    for (const p of parts) text += p.slice(-1) === BRK ? p : p + " ";
    text = text.replace(/\s+$/, "");
    const img = text.match(IMG_ONLY);
    if (img) {
      const [, alt, imgSrc, caption] = img;
      out.push("<figure>" +
        '<img src="' + safeUrl(escapeHtml(imgSrc)) + '" alt="' + escapeHtml(alt) + '">' +
        (caption ? "<figcaption>" + inline(escapeHtml(caption)) + "</figcaption>" : "") +
        "</figure>");
    } else {
      out.push("<p>" + inline(escapeHtml(text)) + "</p>");
    }
    para = [];
  };
  const flush = () => { flushPara(); closeLists(); };

  const RX_LI = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
  const RX_HR = /^ {0,3}([-*_])( *\1){2,} *$/;
  const RX_FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
  const isBlockStart = l =>
    /^ {0,3}(#{1,6}\s|>)/.test(l) || RX_FENCE.test(l) || RX_HR.test(l) || RX_LI.test(l);

  // split a table row into cells; escaped pipes don't split
  const splitRow = row => row.replace(RX_ESCPIPE, PIPE)
    .trim().replace(/^\||\|$/g, "").split("|")
    .map(c => c.replace(RX_PIPE, BS + "|").trim());

  while (i < lines.length) {
    const line = lines[i];

    // fenced code block (``` or ~~~), optional language after the fence
    const fence = line.match(RX_FENCE);
    if (fence) {
      flush();
      const mark = fence[1][0], len = fence[1].length;
      const lang = fence[2].trim().split(/\s+/)[0].replace(/`/g, "");
      const code = [];
      i++;
      while (i < lines.length) {
        const cm = lines[i].match(/^ {0,3}(`{3,}|~{3,})\s*$/);
        if (cm && cm[1][0] === mark && cm[1].length >= len) { i++; break; }
        code.push(lines[i]);
        i++;
      }
      out.push("<pre><code" + (lang ? ' class="language-' + escapeHtml(lang) + '"' : "") + ">" +
        escapeHtml(code.join("\n")) + "</code></pre>");
      continue;
    }

    // table: header row + |---|:--:| separator with matching column counts
    if (/\|/.test(line) && i + 1 < lines.length && /^ {0,3}[\s:|-]+$/.test(lines[i + 1]) && /-/.test(lines[i + 1])) {
      const head = splitRow(line);
      const seps = splitRow(lines[i + 1]);
      if (seps.length === head.length && seps.every(c => /^:?-+:?$/.test(c))) {
        flush();
        const aligns = seps.map(c => {
          const l = c[0] === ":", r = c.slice(-1) === ":";
          return l && r ? "center" : r ? "right" : l ? "left" : "";
        });
        const cellHtml = (cells, tag) => cells.map((c, k) =>
          "<" + tag + (aligns[k] ? ' style="text-align:' + aligns[k] + '"' : "") + ">" +
          inline(escapeHtml(c)) + "</" + tag + ">").join("");
        out.push("<table><thead><tr>" + cellHtml(head, "th") + "</tr></thead><tbody>");
        i += 2;
        while (i < lines.length && /\|/.test(lines[i]) && !/^\s*$/.test(lines[i])) {
          const cells = splitRow(lines[i]);
          while (cells.length < head.length) cells.push("");
          out.push("<tr>" + cellHtml(cells.slice(0, head.length), "td") + "</tr>");
          i++;
        }
        out.push("</tbody></table>");
        continue;
      }
    }

    // setext heading: a paragraph underlined with === (h1) or --- (h2)
    if (para.length && /^ {0,3}=+\s*$/.test(line)) {
      const text = para.join(" "); para = [];
      heading(1, text); i++; continue;
    }
    if (para.length && /^ {0,3}-+\s*$/.test(line)) {
      const text = para.join(" "); para = [];
      heading(2, text); i++; continue;
    }

    // atx heading
    const h = line.match(/^ {0,3}(#{1,6})\s+(.*)$/);
    if (h) {
      flush();
      heading(h[1].length, h[2]);
      i++;
      continue;
    }

    // horizontal rule (---, ***, ___, spaced forms too)
    if (RX_HR.test(line)) {
      flush();
      out.push("<hr>");
      i++;
      continue;
    }

    // blockquote: > lines plus lazy continuation of plain text lines
    if (/^ {0,3}>/.test(line)) {
      flush();
      const quote = [];
      while (i < lines.length) {
        const l = lines[i];
        if (/^ {0,3}>/.test(l)) quote.push(l.replace(/^ {0,3}> ?/, ""));
        else if (!/^\s*$/.test(l) && !isBlockStart(l)) quote.push(l);
        else break;
        i++;
      }
      out.push("<blockquote>" + mdToHtml(quote.join("\n"), ctx) + "</blockquote>");
      continue;
    }

    // 4-space-indented code block (only outside lists, where indentation nests)
    if (!para.length && !listStack.length && /^(?: {4}|\t)/.test(line)) {
      flush();
      const code = [];
      while (i < lines.length && (/^(?: {4}|\t)/.test(lines[i]) || /^\s*$/.test(lines[i]))) {
        code.push(lines[i].replace(/^(?: {4}|\t)/, ""));
        i++;
      }
      while (code.length && /^\s*$/.test(code[code.length - 1])) { code.pop(); i--; }
      out.push("<pre><code>" + escapeHtml(code.join("\n")) + "</code></pre>");
      continue;
    }

    // list item; nesting depth from indentation (2 spaces per level)
    const li = line.match(RX_LI);
    if (li) {
      flushPara();
      const depth = Math.min(Math.floor(li[1].replace(/\t/g, "  ").length / 2), 5) + 1;
      const tag = /^\d/.test(li[2]) ? "ol" : "ul";
      // a change of marker style (- vs *, 1. vs 1)) starts a fresh list, like GitHub
      const delim = li[2].slice(-1);
      while (listStack.length > depth) out.push("</" + listStack.pop().tag + ">");
      const top = listStack[depth - 1];
      if (listStack.length === depth && (top.tag !== tag || top.delim !== delim))
        out.push("</" + listStack.pop().tag + ">");
      while (listStack.length < depth) {
        const start = tag === "ol" ? parseInt(li[2], 10) : 1;
        out.push("<" + tag + (tag === "ol" && start !== 1 ? ' start="' + start + '"' : "") + ">");
        listStack.push({ tag, delim });
      }
      let body = li[3];
      let attr = "", prefix = "";
      const task = body.match(/^\[([ xX])\]\s+(.*)$/);
      if (task) {
        attr = ' class="task-list-item"';
        prefix = '<input type="checkbox" disabled' + (task[1] !== " " ? " checked" : "") + "> ";
        body = task[2];
      }
      out.push("<li" + attr + ">" + prefix + inline(escapeHtml(body)) + "</li>");
      liIdx = out.length - 1;
      i++;
      continue;
    }

    // blank line — inside a list it only ends the list if what follows isn't
    // another item (GitHub keeps "loose" lists together across blank lines)
    if (/^\s*$/.test(line)) {
      flushPara();
      let j = i + 1;
      while (j < lines.length && /^\s*$/.test(lines[j])) j++;
      if (!(listStack.length && j < lines.length && RX_LI.test(lines[j]))) closeLists();
      i++;
      continue;
    }

    // a plain line straight after a list item continues that item (lazy continuation)
    if (listStack.length && !para.length && liIdx === out.length - 1) {
      out[liIdx] = out[liIdx].replace(/<\/li>$/, " " + inline(escapeHtml(line.trim())) + "</li>");
      i++;
      continue;
    }

    // paragraph text
    if (!para.length) closeLists();
    para.push(line);
    i++;
  }
  flush();

  // used footnotes render as a numbered list at the end, with backlinks
  if (!_ctx && ctx.noteUsed.length) {
    out.push('<section class="footnotes"><hr><ol>');
    for (let k = 0; k < ctx.noteUsed.length; k++) {
      out.push('<li id="fn-' + (k + 1) + '">' + inline(escapeHtml(ctx.notes[ctx.noteUsed[k]])) +
        ' <a href="#fnref-' + (k + 1) + '">↩</a></li>');
    }
    out.push("</ol></section>");
  }

  return out.join("\n");
}
