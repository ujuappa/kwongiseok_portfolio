// The fall: turns the static summary in Fall.astro into a scroll-driven skydive.
//
// States (classes on [data-fall]):
//   is-boarding  plane on screen, skydiver pick, page can't scroll yet
//   is-falling   ScrollTrigger pins the stage and scroll scrubs the timeline
//   is-landed    timeline parked at the end; returning visitors start here
// `is-down` is added once a falling visitor reaches the ground by scrolling.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  CHARACTERS,
  getCharacter,
  hasSeenFall,
  markFallSeen,
  setCharacter,
  type CharacterId,
} from '../../lib/visitor';

/** Scroll distance of the whole fall, in screen heights. Tune after phone testing. */
const SCROLL_SCREENS = 6.5;

const root = document.querySelector<HTMLElement>('[data-fall]');
if (root) init(root);

function init(root: HTMLElement) {
  const $ = <T extends Element = HTMLElement>(sel: string) => {
    const el = root.querySelector<T>(sel);
    if (!el) throw new Error(`fall: missing ${sel}`);
    return el;
  };

  const form = $<HTMLFormElement>('[data-pick]');
  const jumpButton = $<HTMLButtonElement>('[data-jump]');
  const radios = [...root.querySelectorAll<HTMLInputElement>('input[name="character"]')];
  const selected = () => radios.find((r) => r.checked)?.value as CharacterId | undefined;

  const choose = (id: CharacterId) => {
    const character = CHARACTERS.find((c) => c.id === id);
    if (!character) return;
    root.style.setProperty('--diver', character.color);
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
  const chute = $<SVGElement>('[data-chute]');
  const clouds = $('[data-clouds]');
  const skyMid = $('[data-sky-mid]');
  const skyLow = $('[data-sky-low]');
  const scrollHint = $('[data-scroll-hint]');
  const cards = [...root.querySelectorAll<HTMLElement>('[data-card]')];
  const panel = $('[data-panel]');
  const panelScroll = $('[data-panel-scroll]');
  const ground = $('[data-ground]');
  const spot = $('[data-spot]');
  const landingTitle = $('#landing-title');

  const vh = () => window.innerHeight;
  const vw = () => window.innerWidth;
  // The skydiver is anchored at the feet (yPercent -100), so these are foot positions.
  const freefallY = () => vh() * 0.3;
  const chuteY = () => vh() * 0.27;
  const landY = () => offsetWithin(spot, stage) + spot.offsetHeight / 2;

  gsap.set(diver, { yPercent: -100 });
  gsap.set(cards, { yPercent: -50 });
  gsap.set(chute, { transformOrigin: '50% 100%' });

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

  function buildTimeline() {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });

    // Leaving the plane.
    tl.fromTo(scrollHint, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3 }, 0);
    tl.fromTo(plane, { x: 0, y: 0 }, { x: () => vw() * 1.1, y: () => -vh() * 0.06, duration: 1, ease: 'power1.in' }, 0);

    // Freefall: the sky brightens, clouds rush up, and each project passes as a cloud.
    const cardStart = 0.8;
    const cardGap = 2.2;
    const parachute = cardStart + (cards.length - 1) * cardGap + 2.4;
    tl.fromTo(skyMid, { autoAlpha: 0 }, { autoAlpha: 1, duration: parachute }, 0.3);
    tl.fromTo(clouds, { y: 0 }, { y: () => -vh() * 2.2, duration: parachute }, 0);
    cards.forEach((card, i) => {
      const t = cardStart + i * cardGap;
      tl.fromTo(
        card,
        { y: () => vh() + card.offsetHeight },
        { y: () => vh() * 0.62, duration: 0.9, ease: 'power2.out' },
        t,
      );
      tl.fromTo(
        card,
        { y: () => vh() * 0.62 },
        { y: () => -card.offsetHeight, duration: 0.9, ease: 'power2.in', immediateRender: false },
        t + 1.5,
      );
    });

    // Parachute: the chute opens, the fall slows, and the experience panel rises.
    tl.fromTo(chute, { scale: 0 }, { scale: 1, duration: 0.6, ease: 'back.out(1.6)' }, parachute);
    tl.fromTo(
      diver,
      { y: freefallY },
      { y: chuteY, duration: 0.8, ease: 'power2.out', immediateRender: false },
      parachute,
    );
    tl.fromTo(skyLow, { autoAlpha: 0 }, { autoAlpha: 1, duration: 5 }, parachute);
    tl.fromTo(
      clouds,
      { y: () => -vh() * 2.2 },
      { y: () => -vh() * 2.7, duration: 5, immediateRender: false },
      parachute,
    );
    tl.fromTo(
      panel,
      { autoAlpha: 0, y: () => vh() * 0.5 },
      { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      parachute + 0.4,
    );
    tl.fromTo(
      panelScroll,
      { y: 0 },
      { y: () => -Math.max(0, panelScroll.offsetHeight - panel.clientHeight), duration: 3.6 },
      parachute + 1.4,
    );

    // Landing: the village rises and the skydiver touches down in the middle.
    const landing = parachute + 5.4;
    tl.fromTo(
      panel,
      { autoAlpha: 1, y: 0 },
      { autoAlpha: 0, y: () => -vh() * 0.15, duration: 0.6, immediateRender: false },
      landing,
    );
    tl.fromTo(ground, { y: () => ground.offsetHeight }, { y: 0, duration: 1.6, ease: 'power2.out' }, landing + 0.2);
    tl.fromTo(
      diver,
      { y: chuteY },
      { y: landY, duration: 1.6, ease: 'power1.inOut', immediateRender: false },
      landing + 0.2,
    );
    tl.fromTo(chute, { scale: 1 }, { scale: 0, duration: 0.4, immediateRender: false }, landing + 1.6);
    tl.to({}, { duration: 0.3 });
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
    drop?.kill();
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
    intro?.progress(1);
    setState('falling');
    gsap.to(boarding, { autoAlpha: 0, duration: 0.3 });
    drop = gsap.fromTo(
      diver,
      { y: offsetWithin(plane, stage) + plane.offsetHeight },
      { y: freefallY(), duration: 0.9, ease: 'power2.in' },
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
