# ITZFIZZ Scroll-Driven Hero (HTML + CSS + JS + GSAP)

Vanilla implementation of the **Scroll-Driven Hero Section Animation** assignment
for the Itzfizz web development internship. No frameworks — plain HTML, CSS,
JavaScript, and GSAP ScrollTrigger.

- **Live site:** https://venky656.github.io/itzfizz-hero-vanilla/
- **Repository:** https://github.com/Venky656/itzfizz-hero-vanilla
- **Next.js version:** https://github.com/Venky656/itzfizz-scroll-hero

## Run

No build step — it's static.

```bash
# any static server works, e.g.
python3 -m http.server 8080
# open http://localhost:8080
```

Or just open `index.html` in a browser (GSAP loads from CDN).

## Structure

```
index.html      # markup: hero, road, headline, car, stat cards
css/styles.css  # layout, palette, card/headline styles
js/main.js      # GSAP intro + ScrollTrigger scroll logic
car.svg         # top-down car facing right
```

## How it works

- **Intro (on load):** headline letters stagger in (`y: 48 → 0`, opacity,
  `power4.out`).
- **Scroll (core):** ScrollTrigger pins the hero (`pin: true`) and scrubs
  (`scrub: 1`), so the car's `x` equals `progress × maxDistance`. Scroll up and
  the whole scene reverses.
- **Stat cards:** hidden at load; each reveals at a scroll-progress threshold
  (0.18 / 0.36 / 0.54 / 0.72) with an eased `y`/`scale`/`opacity` transition,
  then its number counts up. Fully reversible.
- **Letters:** centres measured once on `refreshInit`; letters light up as the
  car's front passes them.
- **Extras:** headlight beam, speed HUD + tilt driven by scroll velocity.

## Performance

- Only `transform` (x, y, scale, scaleX, rotation) and `opacity` animate.
- `gsap.quickSetter` avoids per-frame allocations; all layout reads happen in
  `measure()` on `refreshInit`, never inside the scroll handler.
- `prefers-reduced-motion` renders the finished scene with no animation.

## Tech

- [HTML](index.html) · [CSS](css/styles.css) · [JavaScript](js/main.js)
- [GSAP 3.12](https://gsap.com/) + ScrollTrigger (CDN)
- Fonts: Unbounded + Manrope (Google Fonts)
