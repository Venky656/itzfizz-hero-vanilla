/* ============================================================
   ITZFIZZ scroll-driven hero — vanilla JS + GSAP
   Load:  headline letters stagger in.
   Scroll: pin + scrub drives car, trail, letter lighting,
           and the four stat cards (thresholds 0.18/0.36/0.54/0.72).
   Perf:  transform + opacity only, quickSetters, no layout reads
          inside the scroll handler (measure on refreshInit).
   ============================================================ */

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const road = document.getElementById("road");
const car = document.getElementById("car");
const trail = document.getElementById("trail");
const hud = document.getElementById("hud-value");
const letters = gsap.utils.toArray("[data-letter]");
const cards = gsap.utils.toArray("[data-card]");
const nums = gsap.utils.toArray("[data-count]");

/* ---------- Reduced motion: show the finished scene ---------- */
if (reduceMotion) {
  gsap.set(letters, { opacity: 1 });
  letters.forEach((l) => l.setAttribute("data-lit", "true"));
  gsap.set(cards, { opacity: 1 });
  nums.forEach((n) => (n.textContent = n.dataset.count));
  gsap.set(trail, { scaleX: 1 });
  gsap.set(car, { x: road.clientWidth * 0.7, yPercent: -50, y: 0 });
} else {
  init();
}

function init() {
  /* ---------- Intro (on load): headline stagger only ---------- */
  gsap.fromTo(
    letters,
    { y: 48, opacity: 0 },
    { y: 0, opacity: 1, duration: 1, stagger: 0.055, ease: "power4.out" }
  );
  gsap.set(cards, { y: 24, scale: 0.97, opacity: 0 });

  // Hand vertical centering over to GSAP so x/rotation don't fight the CSS transform
  gsap.set(car, { yPercent: -50, y: 0 });

  /* ---------- Measurements (layout reads happen ONLY here) ---------- */
  let roadW = 0;
  let carW = 0;
  let maxX = 0;
  let centres = [];
  let lastLit = -1;

  const measure = () => {
    roadW = road.clientWidth;
    carW = car.getBoundingClientRect().width;
    maxX = roadW - carW * 0.25;
    const roadLeft = road.getBoundingClientRect().left;
    centres = letters.map((el) => {
      const b = el.getBoundingClientRect();
      return b.left - roadLeft + b.width / 2;
    });
  };
  ScrollTrigger.addEventListener("refreshInit", measure);
  measure();

  /* ---------- quickSetters: zero-allocation per-frame writes ---------- */
  const setX = gsap.quickSetter(car, "x", "px");
  const setTrail = gsap.quickSetter(trail, "scaleX");

  const cardSetters = cards.map((card) => ({
    y: gsap.quickSetter(card, "y", "px"),
    scale: gsap.quickSetter(card, "scale"),
    opacity: gsap.quickSetter(card, "opacity"),
  }));

  /* ---------- Stat cards: reveal at scroll-progress thresholds ---------- */
  const CARD_AT = [0.18, 0.36, 0.54, 0.72];
  const CARD_WIN = 0.1;
  const counted = cards.map(() => false);

  const countUp = (el) => {
    const target = +el.dataset.count;
    const from = +el.textContent || 0;
    const obj = { v: from };
    gsap.to(obj, {
      v: target,
      duration: 1.2,
      ease: "power3.out",
      onUpdate: () => (el.textContent = Math.round(obj.v)),
    });
  };

  /* ---------- Speed HUD + tilt, smoothed on the ticker ---------- */
  let target = 0;
  let current = 0;
  let shown = -1;
  const tick = () => {
    target *= 0.9;
    current += (target - current) * 0.12;
    const v = Math.round(current);
    if (v !== shown) {
      hud.textContent = String(v).padStart(3, "0");
      shown = v;
    }
    gsap.set(car, { rotation: (current / 340) * 1.6 });
  };
  gsap.ticker.add(tick);

  /* ---------- Core: pin the hero, scrub everything by progress ---------- */
  ScrollTrigger.create({
    trigger: "#hero",
    start: "top top",
    end: "+=250%",
    pin: true,
    scrub: 1, // interpolation toward scroll position = fluid motion
    anticipatePin: 1,
    onUpdate: (self) => {
      const p = self.progress;
      const x = p * maxX;

      setX(x);
      setTrail(Math.min(1, (x + carW * 0.5) / roadW));
      target = Math.min(340, Math.abs(self.getVelocity()) / 6);

      // Letters light up as the car's front passes them
      const front = x + carW * 0.9;
      let lit = -1;
      for (let i = 0; i < centres.length; i++) {
        if (centres[i] < front) lit = i;
        else break;
      }
      if (lit !== lastLit) {
        letters.forEach((l, i) =>
          l.setAttribute("data-lit", i <= lit ? "true" : "false")
        );
        lastLit = lit;
      }

      // Cards: eased reveal window tied to scroll progress (reversible)
      for (let i = 0; i < cards.length; i++) {
        const t = (p - CARD_AT[i]) / CARD_WIN;
        const e = t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3); // power3.out
        cardSetters[i].y(24 * (1 - e));
        cardSetters[i].scale(0.97 + 0.03 * e);
        cardSetters[i].opacity(e);

        if (e >= 1 && !counted[i]) {
          counted[i] = true;
          countUp(nums[i]);
        }
        if (e <= 0 && counted[i]) {
          counted[i] = false;
          nums[i].textContent = "0"; // fully rewound
        }
      }
    },
  });

  /* ---------- Cleanup ---------- */
  window.addEventListener("beforeunload", () => {
    gsap.ticker.remove(tick);
    ScrollTrigger.removeEventListener("refreshInit", measure);
  });
}
