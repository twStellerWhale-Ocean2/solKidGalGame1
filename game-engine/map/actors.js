const DEFAULT_ANCHOR = 0.5;

const MOTION_HANDLERS = Object.freeze({
  bird({ phase, time }) {
    return {
      dx: ((time * 18 + phase * 40) % 70) - 20,
      dy: Math.sin(time * 2.1 + phase) * 5
    };
  },
  flag({ phase, time }) {
    return {
      dx: Math.sin(time * 2.4 + phase) * 1.2,
      opacity: 0.76,
      skewY: Math.sin(time * 3.2 + phase) * 5
    };
  },
  glow({ phase, time }) {
    return {
      opacity: 0.34 + Math.sin(time * 1.6 + phase) * 0.14,
      scale: 1 + Math.sin(time * 1.6 + phase) * 0.16
    };
  },
  pathLoop({ phase, time }) {
    return {
      dx: ((time * 20 + phase * 45) % 90) - 45,
      dy: Math.sin(time * 1.2 + phase) * 1.5
    };
  },
  ship({ phase, time }) {
    return {
      dx: Math.sin(time * 0.48 + phase) * 0.9,
      dy: Math.sin(time * 0.72 + phase) * 1.8,
      opacity: 0.38,
      rotate: Math.sin(time * 0.55 + phase) * 0.18
    };
  },
  water({ phase, time }) {
    return {
      dx: Math.sin(time * 0.34 + phase) * 7,
      dy: Math.cos(time * 0.28 + phase) * 4,
      opacity: 0.18 + Math.sin(time * 0.46 + phase) * 0.05,
      scale: 1 + Math.sin(time * 0.42 + phase) * 0.012
    };
  },
  wave({ phase, time }) {
    return {
      dx: Math.sin(time * 1.7 + phase) * 10,
      dy: Math.cos(time * 1.3 + phase) * 4,
      opacity: 0.44 + Math.sin(time * 1.4 + phase) * 0.22,
      scale: 1 + Math.sin(time * 1.4 + phase) * 0.07
    };
  },
  windmill({ phase, time }) {
    return {
      opacity: 0.8,
      rotate: (time * 72 + phase * 90) % 360
    };
  }
});

export const mapActorMotionTypes = Object.freeze(Object.keys(MOTION_HANDLERS));

export function createMapActorRuntime({ assetUrl = (src) => src, layer, pointToStage } = {}) {
  let frame = 0;

  function render(actors = [], metrics) {
    if (!layer || !metrics?.width || !metrics?.height) return;
    layer.innerHTML = "";
    actors.forEach((actor) => {
      const point = pointToStage(actor.x, actor.y, metrics);
      const item = document.createElement("span");
      item.className = `map-actor map-actor-${actor.type}${actor.src ? " map-actor-image" : ""}`;
      item.dataset.actorId = actor.id;
      item.dataset.actorType = actor.type;
      item.dataset.motion = actor.motion || actor.type;
      item.dataset.phase = String(actor.phase || 0);
      item.dataset.scale = String(actor.scale || 1);
      item.dataset.anchorX = String(actor.anchorX ?? DEFAULT_ANCHOR);
      item.dataset.anchorY = String(actor.anchorY ?? DEFAULT_ANCHOR);
      item.style.left = `${point.x}px`;
      item.style.top = `${point.y}px`;
      item.style.width = `${(actor.w / 100) * metrics.displayWidth}px`;
      item.style.height = `${(actor.h / 100) * metrics.displayHeight}px`;
      item.style.zIndex = String(actor.z || 1);
      if (actor.src) item.style.backgroundImage = `url("${assetUrl(actor.src)}")`;
      layer.appendChild(item);
    });
  }

  function start() {
    if (frame || !layer) return;
    const tick = (time) => {
      tickActors(layer, time / 1000);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }

  function stop() {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function snapshot() {
    if (!layer) return [];
    return [...layer.querySelectorAll(".map-actor")].map((item) => ({
      id: item.dataset.actorId,
      motion: item.dataset.motion,
      transform: item.style.transform
    }));
  }

  return { render, snapshot, start, stop };
}

export function tickActors(layer, time) {
  layer.querySelectorAll(".map-actor").forEach((item) => {
    const phase = Number(item.dataset.phase || 0);
    const baseScale = Number(item.dataset.scale || 1);
    const anchorX = Number(item.dataset.anchorX || DEFAULT_ANCHOR) * -100;
    const anchorY = Number(item.dataset.anchorY || DEFAULT_ANCHOR) * -100;
    const motion = MOTION_HANDLERS[item.dataset.motion] || MOTION_HANDLERS[item.dataset.actorType];
    const transform = motion ? motion({ phase, time }) : {};
    const dx = transform.dx || 0;
    const dy = transform.dy || 0;
    const rotate = transform.rotate || 0;
    const skewY = transform.skewY || 0;
    const pulse = transform.scale || 1;
    if (typeof transform.opacity === "number") item.style.opacity = String(transform.opacity);
    item.style.transform = `translate(${anchorX}%, ${anchorY}%) translate(${dx}px, ${dy}px) rotate(${rotate}deg) skewY(${skewY}deg) scale(${baseScale * pulse})`;
  });
}
