const canvas = document.querySelector("[data-hero-canvas]");

if (canvas) {
  const mobile = window.matchMedia("(max-width: 719px)").matches;
  const start = () => {
    import("/hero-scene.js?v=20260819c").catch(() => {
      canvas.dataset.sceneReady = "error";
    });
  };
  const schedule = () => window.setTimeout(start, mobile ? 900 : 450);

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
}
