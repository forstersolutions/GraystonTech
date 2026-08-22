(() => {
  try {
    const payload = JSON.parse(window.sessionStorage.getItem("grayston:system-handoff") || "null");
    if (payload && !payload.native && Date.now() - payload.time < 8000) {
      document.documentElement.classList.add("route-arriving");
    }
  } catch {
    // The site remains fully usable when session storage is unavailable.
  }
})();
