# ✿ Markdown Hints ✿

A cheat sheet for writing posts and walkthroughs. The site renders
**GitHub-flavored Markdown**, so the preview you see while editing on GitHub is
what the page will look like — if it looks right in the preview, it'll look
right on the site. (One small exception: text color — see [HTML](#html).)

Every section shows the **plain text you type** in a code box, and the
**rendered result** in a quoted box directly underneath, so you can compare.
This file isn't listed in `posts.json`, so it never appears on the blog.

**Jump to:**
[Headings](#headings) ·
[Bold & italic](#bold-italic-and-friends) ·
[Literal symbols](#tildes-and-other-literal-symbols) ·
[Line breaks](#line-breaks) ·
[Lists](#lists) ·
[Quotes & dividers](#quotes-and-dividers) ·
[Code](#code-blocks) ·
[Links](#links) ·
[Images](#images-and-captions) ·
[Tables](#tables) ·
[Footnotes](#footnotes) ·
[Emoji](#emoji) ·
[HTML](#html) ·
[Publishing](#publishing-checklist)

---

## Headings

**Type this:**

```markdown
# Page title (use once, at the top)
## Section
### Sub-section
#### Smaller still (goes down to ######)
```

**…and you get:** headings exactly like the ones on this page — big for `#`,
smaller for each extra `#`.

💡 Every heading automatically gets an anchor: lowercase, spaces become dashes,
punctuation is dropped. `## Recommended Route Order` can be linked as
`[jump there](#recommended-route-order)` — from the same post or another one.
(The "Jump to" row at the top of this page is exactly that.)

---

## Bold, italic, and friends

| Type this | Get this |
|:---|:---|
| `**bold**` or `__bold__` | **bold** |
| `*italic*` or `_italic_` | *italic* |
| `***bold italic***` | ***bold italic*** |
| `~~strikethrough~~` | ~~strikethrough~~ |
| `` `code` `` | `code` |
| `snake_case_word` | snake_case_word — underscores *inside* a word are left alone |

---

## Tildes and other literal symbols

A single pair of tildes also strikes through (`~oops~` → ~oops~), which is a
problem for game titles. Put a backslash before a symbol to print it literally.

**Type this:**

```markdown
# The Prince of Tennis Sweet School Festival \~♡-40 and more...\~ Guide
```

**…and you get:**

> The Prince of Tennis Sweet School Festival \~♡-40 and more...\~ Guide

Works for any markdown symbol: `\*` `\_` `\#` `\~` `` \` `` `\|` and so on.

---

## Line breaks

- A **blank line** starts a new paragraph.
- A single Enter within a paragraph is joined into one line (same as GitHub).
- To force a line break *without* starting a new paragraph, end the line with
  **two spaces**, a **backslash** `\`, or write `<br>`.

**Type this:**

```markdown
Roses are red<br>
violets are blue
```

**…and you get:**

> Roses are red<br>
> violets are blue

---

## Lists

**Type this:**

```markdown
- a bullet
- another bullet
  - nest by indenting two spaces
    - and again

1. numbered
2. list

- [ ] an unchecked box
- [x] a checked box
```

**…and you get:**

> - a bullet
> - another bullet
>   - nest by indenting two spaces
>     - and again
>
> 1. numbered
> 2. list
>
> - [ ] an unchecked box
> - [x] a checked box

💡 Task-list lines render as real checkboxes — nice for endings checklists.
A numbered list keeps your starting number, so `5.` starts counting at 5.

---

## Quotes and dividers

**Type this:**

```markdown
> A blockquote — good for in-game dialogue.
> More lines with more > marks.
```

**…and you get:**

> A blockquote — good for in-game dialogue.
> More lines with more > marks.

`---` on its own line draws a divider, like the ones between sections of this
page. ⚠️ Keep a **blank line above it** — without one, `---` turns the line
above into a heading instead (that's standard markdown behavior).

---

## Code blocks

**Type this:**

````markdown
```
Anything between the fences is shown exactly as typed,
useful for showing markdown itself or spacing-sensitive text.
```
````

**…and you get:**

> ```
> Anything between the fences is shown exactly as typed,
> useful for showing markdown itself or spacing-sensitive text.
> ```

Inline, use single backticks: `` `like this` `` → `like this`.

---

## Links

**Type this:**

```markdown
[link text](https://example.com)
[link with a hover tooltip](https://example.com "the tooltip")
Bare URLs link themselves: https://otomeshimai.buzzsprout.com
```

**…and you get:**

> [link text](https://example.com)
> [link with a hover tooltip](https://example.com "the tooltip")
> Bare URLs link themselves: https://otomeshimai.buzzsprout.com

For a post with many links, reference style keeps the text tidy — define the
targets anywhere (usually at the bottom of the file):

```markdown
Play [Ryoma's route][ryoma] first, then [Tezuka's][tezuka].

[ryoma]: https://example.com/ryoma
[tezuka]: https://example.com/tezuka
```

**…and you get:**

> Play [Ryoma's route][ryoma] first, then [Tezuka's][tezuka].

[ryoma]: https://example.com/ryoma
[tezuka]: https://example.com/tezuka

---

## Images and captions

Upload the image to `blog/images/`, then:

**Type this:**

```markdown
![Gakuensai no Oujisama game art](images/gakupuri.jpg "The GakuPuri key art")
```

**…and you get:**

> ![Gakuensai no Oujisama game art](images/gakupuri.jpg "The GakuPuri key art")

The `[square brackets]` are the alt text (what screen readers announce — always
write one). The `"quoted part"` is optional. **On the site**, an image on a line
of its own becomes a centered figure with the quoted text as a visible caption
underneath; an image used mid-sentence stays inline with the quote as its
tooltip. (GitHub's preview shows the image but not the caption — that part is
our site being fancier.)

---

## Tables

**Type this:**

```markdown
| Choice        | Affection | Notes         |
|:--------------|:---------:|--------------:|
| left-aligned  | centered  | right-aligned |
| "Say nothing" |    +2     | best pick     |
```

**…and you get:**

> | Choice        | Affection | Notes         |
> |:--------------|:---------:|--------------:|
> | left-aligned  | centered  | right-aligned |
> | "Say nothing" |    +2     | best pick     |

The `:` marks on the separator row control column alignment. Need a literal `|`
inside a cell? Escape it: `\|`.

---

## Footnotes

**Type this:**

```markdown
This choice matters more than it looks[^example].

[^example]: It locks you out of the good ending. Ask us how we know.
```

**…and you get:**

> This choice matters more than it looks[^example].

[^example]: It locks you out of the good ending. Ask us how we know.
    (This is a live footnote — it collected itself at the very bottom of this
    page, numbered, with a ↩ link back. Posts work the same way.)

---

## Emoji

Shortcodes turn into emoji. A sample of the supported set:

| Type | Get | Type | Get | Type | Get |
|:---|:---|:---|:---|:---|:---|
| `:sparkles:` | ✨ | `:two_hearts:` | 💕 | `:sob:` | 😭 |
| `:tada:` | 🎉 | `:heart_eyes:` | 😍 | `:scream:` | 😱 |
| `:tennis:` | 🎾 | `:ribbon:` | 🎀 | `:thinking:` | 🤔 |
| `:cherry_blossom:` | 🌸 | `:crown:` | 👑 | `:warning:` | ⚠️ |
| `:sushi:` | 🍣 | `:cake:` | 🍰 | `:white_check_mark:` | ✅ |
| `:kimono:` | 👘 | `:video_game:` | 🎮 | `:bulb:` | 💡 |

The common ones are all there — faces, hearts, flowers, food, sports, and a
Japan set (`:ramen:` `:tokyo_tower:` `:wind_chime:` `:japanese_castle:`…). An
unknown code just shows as typed, same as GitHub. If one you want doesn't
convert, paste the emoji itself 🎀 (always works) or ask to have the code added.

---

## HTML

Most HTML is deliberately **not** rendered — it shows up as plain text. That's
what keeps a stray `<script>` or a typo'd tag from breaking the page. A small
whitelist of safe tags does work, the same ones GitHub allows:

`<br>` `<b>` `<i>` `<em>` `<strong>` `<u>` `<s>` `<sub>` `<sup>` `<ins>`
`<del>` `<kbd>` `<mark>` `<small>` `<span>` `<details>` `<summary>`

| Type this | Get this |
|:---|:---|
| `H<sub>2</sub>O` | H<sub>2</sub>O |
| `x<sup>2</sup>` | x<sup>2</sup> |
| `press <kbd>A</kbd>` | press <kbd>A</kbd> |
| `<mark>highlighted</mark>` | <mark>highlighted</mark> |
| `<u>underlined</u>` | <u>underlined</u> |

The two genuinely useful ones:

### Colored text

**Type this:**

```markdown
Pick <span style="color:hotpink">Ryoma's route</span> first!
```

**…and on the site you get** the words in hotpink. The color can be any
[CSS named color](https://developer.mozilla.org/en-US/docs/Web/CSS/named-color)
(`hotpink`, `crimson`, `mediumseagreen`, …) or a hex code like `#3d57ee`.

⚠️ This is the one thing GitHub's preview won't show — GitHub strips colors, so
right here the example just looks normal:
<span style="color:hotpink">Ryoma's route</span> ← colored on the site, plain
on GitHub. Everything else on this page matches in both places.

### Spoiler sections

**Type this:**

```markdown
<details><summary>Click for the true ending requirements</summary>

- Finish all five routes first
- Collect every memory fragment

</details>
```

**…and you get** (click it!):

<details><summary>Click for the true ending requirements</summary>

- Finish all five routes first
- Collect every memory fragment

</details>

Perfect for hiding ending spoilers in a walkthrough. Keep the blank lines
around the content so the markdown inside still formats.

---

## Publishing checklist

1. Write `blog/<slug>.md` (this folder).
2. Add the post to `blog/posts.json`:
   ```json
   { "slug": "<slug>", "type": "walkthrough", "title": "Game Name", "summary": "One-line teaser.", "date": "2026-07-28" }
   ```
3. Commit — the site updates itself in a minute or two. The newest date becomes
   the featured post on the home page.

✿ Happy writing! ✿
