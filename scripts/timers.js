const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;

Ext.timers = {
  init() {
    Ext.timers.loop();
  },

  loop() {
    setTimeout(Ext.timers.loop, 1000);
    Ext.timers.renderArenaTimer();
    Ext.timers.renderGuardTimer();
    Ext.timers.renderFarmTimer();
    Ext.timers.renderBrewingTimer();
    Ext.timers.renderCampTimer();
  },

  renderArenaTimer() {
    Ext.timers.renderTimer(
      "nav-arena",
      App.state.character.arenaState.cooldownUntil,
      5 * HOUR,
      [
        { below: 5 * MINUTE, color: "yellow" }, // < 5 min  → yellow
        { below: HOUR, color: "orange" }, // < 1 hr   → orange
        { color: "orangered" }, // default  → red
      ],
    );
  },

  renderGuardTimer() {
    Ext.timers.renderTimer(
      "nav-guard",
      App.state.character.activity.guardEndTime || 0,
      App.state.character.activity.guardDurationHours * HOUR,
      [
        { below: 5 * MINUTE, color: "yellow" }, // < 5 min  → yellow
        { below: HOUR, color: "orange" }, // < 1 hr   → orange
        { color: "orangered" }, // default  → red
      ],
      true,
    );
  },

  renderCampTimer() {
    Ext.timers.renderTimer(
      "nav-camp",
      App.state.monstrumData?.[App.state.myCampId]?.nextSpawnAt || 0,
      2 * HOUR,
      [
        { below: 5 * MINUTE, color: "yellow" }, // < 5 min  → yellow
        { below: HOUR, color: "orange" }, // < 1 hr   → orange
        { color: "orangered" }, // default  → red
      ],
      true,
    );
  },

  renderBrewingTimer() {
    const activity = App.state.character.activity;

    const bRem = Math.max(0, (activity.brewEndTime || 0) - Date.now());
    const bQueue = activity.brewQueue || [];
    let totalQueueMs = bRem;
    for (var qi = 0; qi < bQueue.length; qi++) {
      var qRec = App.POTION_RECIPES[bQueue[qi].potionId];
      if (qRec) totalQueueMs += qRec.brewMs;
    }

    Ext.timers.renderTimer(
      "nav-alchemy",
      Date.now() + bRem,
      App.POTION_RECIPES[activity.potionId]?.brewMs ?? totalQueueMs,
      [
        { below: 5 * MINUTE, color: "yellow" }, // < 5 min  → yellow
        { below: HOUR, color: "orange" }, // < 1 hr   → orange
        { color: "orangered" }, // default  → red
      ],
      true,
    );
  },

  async renderFarmTimer() {
    if (!App.state.farmPlots) {
      var res = await fetch("/api/game/farm", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) return;
      var data = await res.json();
      App.state.farmPlots = data.plots;
      App.state.farmFetchTime = Date.now();
    }

    // Get shortest plant
    let shortestCd = Number.MAX_VALUE;
    let shortestPlot = null;
    App.state.farmPlots
      .filter((plot) => plot.state != "empty")
      .forEach((plot) => {
        if (plot.remainingMs < shortestCd) {
          shortestCd = plot.remainingMs;
          shortestPlot = plot;
        }
      });

    // Check if has any plant in inventory
    const hasSeed = App.state.character.inventory.some((item) =>
      Object.keys(App.SEED_DEFINITIONS).includes(item.itemId),
    );

    // Check if any plot is empty
    const hasEmptyPlot = App.state.farmPlots.some(
      (plot) => plot.state === "empty",
    );

    Ext.timers.renderTimer(
      "nav-farm",
      hasEmptyPlot && hasSeed
        ? 0
        : shortestPlot.plantedAt + shortestPlot.growthDuration,
      shortestPlot.growthDuration,
      [
        { below: 5 * MINUTE, color: "yellow" }, // < 5 min  → yellow
        { below: HOUR, color: "orange" }, // < 1 hr   → orange
        { color: "orangered" }, // default  → red
      ],
      !hasSeed,
    );
  },

  renderTimer(
    elementId,
    cooldownUntil,
    totalDuration,
    thresholds,
    hideWhenReady = false,
  ) {
    // thresholds: array of { below: ms, color } sorted descending, last entry is the default
    // example: [
    //   { below: 60_000,     color: "yellow" },  // < 1 min  → yellow
    //   { below: 600_000,    color: "orange" },  // < 10 min → orange
    //   {                    color: "red" },  // default  → red
    // ]
    // ready (remaining <= 0) is always green

    const remaining = Math.max(0, cooldownUntil - Date.now());

    const button = document.getElementById(elementId);
    if (!button) return;

    // Format HH:mm
    const totalSeconds = Math.ceil(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    const timeText =
      remaining >= HOUR ? `${hours}:${minutes}` : `${minutes}:${seconds}`;

    // Inject or update overlay
    let overlay = button.querySelector(".cd-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "cd-overlay";
      overlay.innerHTML = `
            <span class="cd-text"></span>
            <div class="cd-bar-track">
                <div class="cd-bar-fill"></div>
            </div>
        `;
      button.style.position = "relative";
      button.appendChild(overlay);
    }

    const progressPct = remaining > 0 ? (remaining / totalDuration) * 100 : 100;

    const barColor =
      remaining <= 0
        ? "#2ecc71"
        : (
            thresholds.find(
              (t) => t.below !== undefined && remaining < t.below,
            ) ?? thresholds.at(-1)
          ).color;

    const text = overlay.querySelector(".cd-text");
    text.style.background =
      remaining <= 0 ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.8)";
    text.style.padding = "4px";
    text.style.border = remaining <= 0 ? "none" : `1px solid ${barColor}`;
    text.style.borderBottom = "none";
    text.style.color = barColor;
    text.textContent = remaining > 0 ? timeText : "";

    const fill = overlay.querySelector(".cd-bar-fill");
    fill.style.width = `${progressPct}%`;
    fill.style.background = barColor;

    overlay.style.display =
      hideWhenReady && (!remaining || remaining <= 0) ? "none" : "";
  },
};
