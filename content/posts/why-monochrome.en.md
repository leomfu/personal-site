---
title: "Why I made my website black and white"
tags: [Design]
summary: "Once the color was gone, what was left actually got clearer. On restraint, white space, and tearing it all down to start over."
---

> This is a placeholder article, used to test the article system's typography, code highlighting and table of contents. Just delete it once you've written a real one.

I spent two whole days on the color scheme for the first version. Blue was too cold, orange was too loud, and once I added gradients every screen was fighting for attention. On the morning of the third day I deleted every color, and the page suddenly went quiet — it turned out the noise wasn't the color. It was that I hadn't thought the hierarchy through.

## White space isn't empty space

In black-and-white design, you're left with only three tools: **spacing**, **font weight**, and **grayscale**. It sounds like too few, but it's enough:

- Spacing handles grouping — readers judge "which things belong together" by distance;
- Font weight handles priority — the contrast between a thin 46px serif and 16px body text stands out more than any color;
- Grayscale handles near and far — `#111` is the heading, `#333` is the body, `#999` is the date. Three levels is enough; add a fourth and nobody can tell them apart.

### A concrete example

What color should the dates in a list be? In the color version I tried giving them a light tint of the brand color, and they ended up jumping out more than the titles. In the black-and-white version there's no choice — all you can do is push them down to `#999`, and that turned out to be right: a date is secondary information to begin with.

## Code is the same

Code blocks are usually where color runs the wildest. The highlighting theme on this site is a hand-written grayscale one: keywords in bold, strings darker, comments lighter, no color at all.

```ts
// 灰阶代码主题：靠深浅 + 粗细区分 token，不靠颜色
const MONO_THEME = {
  name: "bw",
  settings: [
    { scope: ["comment"], settings: { foreground: "#A3A3A3", fontStyle: "italic" } },
    { scope: ["keyword"], settings: { foreground: "#111111", fontStyle: "bold" } },
    { scope: ["string"], settings: { foreground: "#5C5C5C" } },
  ],
};
```

After two weeks of reading it, I never once wanted to go back to the color version.

## Was starting over worth it

Yes. The first version took ten days; the second was up in three, because there were fewer decisions to make: no picking colors, no tweaking saturation, no worrying about some green looking muddy in dark mode. All the time left over went into typography, and typography is what really affects reading.

If you want to try it too: delete all the color first and see whether the page falls apart. If it does, the structure was never standing on its own.
