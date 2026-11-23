// The fall: turns the static summary in Fall.astro into a scroll-driven skydive.
//
// States (classes on [data-fall]):
//   is-boarding  plane on screen, skydiver pick, page can't scroll yet
//   is-falling   ScrollTrigger pins the stage and scroll scrubs the timeline
//   is-landed    timeline parked at the end; returning visitors start here
// `is-down` is added once a falling visitor reaches the ground by scrolling.
//
// The diver (Diver.astro) swaps between three drawn poses: freefall until
// about 60% of the way down, parachute until the ground, then landing, which
// turns into the village sprite behind a puff of dust. Everything is on the
// scrubbed timeline, so scrolling back up plays it all in reverse.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getCharacter, hasSeenFall, markFallSeen, setCharacter } from '../../lib/visitor';
import { VISITORS, type CharacterId } from '../../lib/characters';

/** Scroll distance of the whole fall, in screen heights (the art handoff asks for 2 to 3). */
const SCROLL_SCREENS = 3;

/** Wide layout: the experience panel sits beside the diver. Keep in sync with Fall.astro. */
const WIDE = '(min-width: 56rem) and (min-aspect-ratio: 5/4)';

const root = document.querySelector<HTMLElement>('[data-fall]');
if (root) init(root);

function init(root: HTMLElement) {
  const $ = <T extends Element = HTMLElement>(sel: string) => {
    const el = root.querySelector<T>(sel);
    if (!el) throw new Error(`fall: missing ${sel}`);
    return el;
  };
  const $$ = <T extends Element = HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];

  const form = $<HTMLFormElement>('[data-pick]');
  const jumpButton = $<HTMLButtonElement>('[data-jump]');
  const radios = $$<HTMLInputElement>('input[name="character"]');
  const blocks = $$('[data-char]');
  const selected = () => radios.find((r) => r.checked)?.value as CharacterId | undefined;

  // Showing the character's block on pick also starts loading its art.
  const choose = (id: CharacterId) => {
    if (!VISITORS.some((c) => c.id === id)) return;
    for (const block of blocks) block.hidden = block.dataset.char !== id;
    root.classList.add('has-character');
    jumpButton.disabled = false;
  };

  form.hidden = false;
  const saved = getCharacter();
  if (saved) {
    const radio = radios.find((r) => r.value === saved);
    if (radio) radio.checked = true;
    choose(saved);
  }
  for (const radio of radios) radio.addEventListener('change', () => choose(radio.value as CharacterId));

  // Static summary (reduced motion, or the inline script gave up): Jump just
  // saves the pick and moves down to the projects.
  if (!root.classList.contains('is-animated')) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const id = selected();
      if (!id) return;
      setCharacter(id);
      document.getElementById('freefall')?.scrollIntoView();
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const stage = $('[data-stage]');
  const plane = $('[data-plane]');
  const planeBody = $('[data-plane-body]');
  const boarding = $('[data-boarding]');
  const diver = $('[data-diver]');
  const pop = $('[data-pop]');
  const wind = $('[data-wind]');
  const clouds = $('[data-clouds]');
  const skyMid = $('[data-sky-mid]');
  const skyLow = $('[data-sky-low]');
  const scrollHint = $('[data-scroll-hint]');
  const cards = $$('[data-card]');
  const panel = $('[data-panel]');
  const panelScroll = $('[data-panel-scroll]');
  const ground = $('[data-ground]');
  const spot = $('[data-spot]');
  const landingTitle = $('#landing-title');

  // Every character has its own copy of each part; only the picked one is displayed.
  const freefall = $$('[data-pose="freefall"]');
  const parachute = $$('[data-pose="parachute"]');
  const landing = $$('[data-pose="landing"]');
  // A character without a village sprite keeps its landing pose.
  const landingSwapped = $$('[data-pose="landing"]:not([data-keep])');
  const canopies = $$('[data-canopy]');
  const sprites = $$('[data-sprite]');
  const flashes = $$('[data-flash]');
  const puffs = $$('[data-puff]');
  const puffsEach = Math.max(1, Math.round(puffs.length / Math.max(blocks.length, 1)));

  const vh = () => window.innerHeight;
  const vw = () => window.innerWidth;
  const wide = () => matchMedia(WIDE).matches;

  // The diver's origin is the face, so these are face positions. Offsets come
  // from the picked character's layout (transforms ignored).
  const active = () => blocks.find((b) => !b.hidden) ?? blocks[0];
  const part = (sel: string) => active()?.querySelector<HTMLElement>(sel) ?? null;
  const feet = () => {
    const el = part('[data-pose="landing"]');
    return el ? el.offsetTop + el.offsetHeight : 0;
  };
  const canopyTop = () => {
    const pose = part('[data-pose="parachute"]');
    // An <svg> has no offsetTop; its CSS top is the same layout value.
    const chute = active()?.querySelector('[data-canopy]');
    return pose && chute ? pose.offsetTop + (parseFloat(getComputedStyle(chute).top) || 0) : 0;
  };
  const freefallY = () => vh() * 0.26;
  // Canopy just under the shortcut links, so the figure stays clear of the panel.
  const chuteY = () => vh() * 0.06 - canopyTop();
  const landY = () => offsetWithin(spot, stage) + spot.offsetHeight / 2 - feet();
  // Drift toward what is being shown: each project card comes in a little to
  // one side, and on wide screens the diver moves left of the experience panel.
  const cardShift = () => Math.min(vw() * 0.1, 90);
  const side = (i: number) => (i % 2 ? 1 : -1);
  const chuteX = () => (wide() ? -Math.min(vw() * 0.3, 420) : 0);

  gsap.set(cards, { yPercent: -50 });
  gsap.set(freefall, { autoAlpha: 1 });
  gsap.set([...parachute, ...landing, ...sprites, ...puffs, ...flashes], { autoAlpha: 0 });
  gsap.set(pop, { transformOrigin: '0px 0px' });

  // Continuous motion runs on its own clock, on elements the timeline leaves alone.
  gsap.fromTo(freefall, { rotation: -4 }, { rotation: 4, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.fromTo(parachute, { rotation: -3.5 }, { rotation: 3.5, duration: 2.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  const tl = buildTimeline();
  let trigger: ScrollTrigger | null = null;
  let intro: gsap.core.Tween | null = null;
  let drop: gsap.core.Tween | null = null;
  const bob = gsap.to(planeBody, {
    y: -6,
    duration: 1.6,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    paused: true,
  });

  // Every tween below states its start values (fromTo). A plain to() or set()
  // records whatever is on screen when it first runs, and after ScrollTrigger
  // refreshes the timeline that can be the end state, which then sticks.

  /** Instant change at `at`, undone when scrolled back past it. */
  function flip(tl: gsap.core.Timeline, targets: gsap.TweenTarget, from: gsap.TweenVars, to: gsap.TweenVars, at: number) {
    tl.fromTo(targets, from, { ...to, duration: 0, immediateRender: false }, at);
  }

  /** Pose change: a hard swap, so two poses never show at once, then a quick tilt and bounce. */
  function swap(tl: gsap.core.Timeline, from: HTMLElement[], to: HTMLElement[], at: number) {
    flip(tl, from, { autoAlpha: 1 }, { autoAlpha: 0 }, at);
    flip(tl, to, { autoAlpha: 0 }, { autoAlpha: 1 }, at);
    const rest = { scaleX: 1, scaleY: 1, rotation: 0 };
    const hit = { scaleX: 1.08, scaleY: 0.9, rotation: -7 };
    tl.fromTo(pop, rest, { ...hit, duration: 0.05, immediateRender: false }, at);
    tl.fromTo(pop, hit, { ...rest, duration: 0.35, ease: 'back.out(3)', immediateRender: false }, at + 0.05);
  }

  function buildTimeline() {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

    // Leaving the plane.
    tl.fromTo(scrollHint, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3 }, 0);
    tl.fromTo(plane, { x: 0, y: 0 }, { x: () => vw() * 1.1, y: () => -vh() * 0.06, duration: 1, ease: 'power1.in' }, 0);
    tl.fromTo(wind, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0.1);
    tl.fromTo(diver, { x: 0, y: freefallY }, { x: 0, y: freefallY, duration: 0.01 }, 0);

    // Freefall: the sky brightens, clouds rush up, and each project passes as a cloud.
    const cardStart = 0.8;
    const cardGap = 2.2;
    const opens = cards.length ? cardStart + (cards.length - 1) * cardGap + 2.4 : 2;
    tl.fromTo(skyMid, { autoAlpha: 0 }, { autoAlpha: 1, duration: opens }, 0.3);
    tl.fromTo(clouds, { y: 0 }, { y: () => -vh() * 2.2, duration: opens }, 0);
    const drift = (i: number) => () => (i < 0 ? 0 : side(i) * cardShift() * 0.6);
    cards.forEach((card, i) => {
      const t = cardStart + i * cardGap;
      const x = () => side(i) * cardShift();
      tl.fromTo(
        card,
        { x, y: () => vh() + card.offsetHeight },
        { x, y: () => vh() * 0.66, duration: 0.9, ease: 'power2.out' },
        t,
      );
      tl.fromTo(
        card,
        { y: () => vh() * 0.66 },
        { y: () => -card.offsetHeight, duration: 0.9, ease: 'power2.in', immediateRender: false },
        t + 1.5,
      );
      tl.fromTo(
        diver,
        { x: drift(i - 1) },
        { x: drift(i), duration: 0.9, ease: 'sine.inOut', immediateRender: false },
        t,
      );
    });
    const lastDrift = drift(cards.length - 1);
    tl.fromTo(wind, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, immediateRender: false }, opens - 0.2);

    // Parachute, about 60% of the way down: the canopy opens, the fall slows,
    // and the experience panel rises.
    swap(tl, freefall, parachute, opens);
    tl.fromTo(
      canopies,
      { scaleX: 0.2, scaleY: 0.1 },
      { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'back.out(1.7)' },
      opens,
    );
    tl.fromTo(
      diver,
      { y: freefallY },
      { y: chuteY, duration: 0.8, ease: 'power2.out', immediateRender: false },
      opens,
    );
    tl.fromTo(diver, { x: lastDrift }, { x: chuteX, duration: 1, ease: 'sine.inOut', immediateRender: false }, opens);
    tl.fromTo(skyLow, { autoAlpha: 0 }, { autoAlpha: 1, duration: 4 }, opens);
    tl.fromTo(
      clouds,
      { y: () => -vh() * 2.2 },
      { y: () => -vh() * 2.7, duration: 4, immediateRender: false },
      opens,
    );
    tl.fromTo(
      panel,
      { autoAlpha: 0, y: () => vh() * 0.5 },
      { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      opens + 0.4,
    );
    tl.fromTo(
      panelScroll,
      { y: 0 },
      { y: () => -Math.max(0, panelScroll.offsetHeight - panel.clientHeight), duration: 2.2 },
      opens + 1.2,
    );

    // Landing: the village rises and the diver comes down in the middle of it.
    const descent = opens + 3.6;
    const touchdown = descent + 1.5;
    tl.fromTo(
      panel,
      { autoAlpha: 1, y: 0 },
      { autoAlpha: 0, y: () => -vh() * 0.15, duration: 0.5, immediateRender: false },
      descent,
    );
    tl.fromTo(ground, { y: () => ground.offsetHeight }, { y: 0, duration: 1.4, ease: 'power2.out' }, descent + 0.1);
    tl.fromTo(
      diver,
      { y: chuteY },
      { y: landY, duration: 1.4, ease: 'power1.inOut', immediateRender: false },
      descent + 0.1,
    );
    tl.fromTo(diver, { x: chuteX }, { x: 0, duration: 1.2, ease: 'sine.inOut', immediateRender: false }, descent);

    // On the ground: the landing pose, squashed from the feet.
    flip(tl, pop, { transformOrigin: '0px 0px' }, { transformOrigin: () => `0px ${feet()}px` }, touchdown);
    swap(tl, parachute, landing, touchdown);

    // A flash and a puff of dust cover the landing pose turning into the village sprite.
    const dust = touchdown + 0.45;
    const swapAt = dust + 0.15;
    tl.fromTo(flashes, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.15, ease: 'power2.out' }, dust);
    tl.fromTo(
      flashes,
      { autoAlpha: 1, scale: 1 },
      { autoAlpha: 0, scale: 1.2, duration: 0.35, immediateRender: false },
      swapAt,
    );
    flip(tl, landingSwapped, { autoAlpha: 1 }, { autoAlpha: 0 }, swapAt);
    flip(tl, sprites, { autoAlpha: 0 }, { autoAlpha: 1 }, swapAt);
    const angle = (i: number) => Math.PI * (1 + (i % puffsEach) / Math.max(puffsEach - 1, 1));
    tl.fromTo(puffs, { autoAlpha: 0, scale: 0.3, x: 0, y: 0 }, { autoAlpha: 1, duration: 0.08 }, dust);
    tl.fromTo(
      puffs,
      { autoAlpha: 1, scale: 0.3, x: 0, y: 0 },
      {
        immediateRender: false,
        x: (i: number) => Math.cos(angle(i)) * 46,
        y: (i: number) => Math.sin(angle(i)) * 22 - 4,
        scale: 1.4,
        autoAlpha: 0,
        duration: 0.6,
        ease: 'power2.out',
      },
      dust + 0.08,
    );
    tl.to({}, { duration: 0.2 });
    return tl;
  }

  /**
   * Park the timeline at its start or end, recomputing the size-based values.
   * invalidate() drops each tween's recorded start, and an invalidated tween
   * only re-initializes when rendered forward. So rewind, play through to the
   * end once (one synchronous pass, never painted), then settle where needed.
   */
  function park(at: 0 | 1) {
    tl.invalidate();
    tl.progress(0).progress(1);
    if (at === 0) tl.progress(0);
  }

  function setState(state: 'boarding' | 'falling' | 'landed') {
    root.classList.remove('is-boarding', 'is-falling', 'is-landed', 'is-down');
    root.classList.add(`is-${state}`);
  }

  function reset() {
    trigger?.kill();
    trigger = null;
    drop?.progress(1).kill();
    intro?.progress(1);
    window.scrollTo(0, 0);
  }

  function board() {
    reset();
    setState('boarding');
    park(0);
    gsap.set(boarding, { autoAlpha: 1 });
    bob.play();
    intro = gsap.fromTo(plane, { x: () => -vw() * 1.1 }, { x: 0, duration: 2.2, ease: 'power3.out' });
  }

  function jump() {
    const id = selected();
    if (!id) return;
    setCharacter(id);
    choose(id);
    intro?.progress(1);
    setState('falling');
    // Measure the picked character before the fall starts.
    park(0);
    gsap.to(boarding, { autoAlpha: 0, duration: 0.3 });
    // The drop out of the plane moves `top`, so it can't fight the timeline's `y`
    // if the visitor starts scrolling before it ends.
    drop = gsap.fromTo(
      diver,
      { top: offsetWithin(plane, stage) + plane.offsetHeight - freefallY() },
      { top: 0, duration: 0.9, ease: 'power2.in' },
    );
    trigger = ScrollTrigger.create({
      trigger: stage,
      start: 'top top',
      end: () => `+=${vh() * SCROLL_SCREENS}`,
      pin: true,
      scrub: 0.6,
      animation: tl,
      invalidateOnRefresh: true,
      onUpdate(self) {
        if (self.progress > 0.99 && !root.classList.contains('is-down')) {
          root.classList.add('is-down');
          markFallSeen();
        }
      },
    });
  }

  /** Straight to the ground: skip button, and returning visitors. */
  function land(moveFocus: boolean) {
    reset();
    bob.pause();
    gsap.set(boarding, { autoAlpha: 0 });
    setState('landed');
    park(1);
    markFallSeen();
    if (moveFocus) landingTitle.focus({ preventScroll: true });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    jump();
  });
  $('[data-skip]').addEventListener('click', (event) => {
    event.preventDefault();
    land(true);
  });
  $('[data-replay]').addEventListener('click', () => {
    board();
    (radios.find((r) => r.checked) ?? radios[0])?.focus({ preventScroll: true });
  });

  let resizeQueued = false;
  window.addEventListener('resize', () => {
    if (resizeQueued || !root.classList.contains('is-landed')) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      park(1);
    });
  });

  if (hasSeenFall()) land(false);
  else board();
  root.classList.add('is-ready');
}

/** Layout offset of `el` from the top of `ancestor`, ignoring transforms. */
function offsetWithin(el: HTMLElement, ancestor: HTMLElement) {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}
