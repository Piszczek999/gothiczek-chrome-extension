Ext.hunt = {
  turboActive: false,

  init() {
    hookFunction(App, "renderMonsters", Ext.hunt.onHuntSection);
  },

  onHuntSection() {
    Ext.hunt.addExpPerHourToMonsters();
    Ext.hunt.addGoldPerHourToMonsters();
    Ext.hunt.addSkipWaitingButton();
  },

  // ─── Stats ──────────────────────────────────────────────────────────────────

  addExpPerHourToMonsters() {
    Ext.hunt._addStatToMonsters(
      (i) => `Exp na godzinę: ${Ext.hunt.getExpPerHour(i).toFixed(2)}`,
    );
  },

  addGoldPerHourToMonsters() {
    Ext.hunt._addStatToMonsters(
      (i) => `Złoto na godzinę: ${Ext.hunt.getGoldPerHour(i).toFixed(2)}`,
    );
  },

  _addStatToMonsters(labelFn) {
    const monsters = document.getElementById("monsters-grid");
    if (!monsters) return;

    [...monsters.children].forEach((element, i) => {
      const monStats = element.querySelector(".mon-stats");
      if (!monStats) return;

      const stat = document.createElement("span");
      stat.className = "mon-stat";

      const inner = document.createElement("span");
      inner.textContent = labelFn(i);

      stat.appendChild(inner);
      monStats.appendChild(stat);
    });
  },

  // ─── Calculations ────────────────────────────────────────────────────────────

  getExpPerHour(monsterId) {
    const monster = App.state.gameData.monsters[monsterId];
    const huntTime = Ext.hunt.getHuntTime(
      monster.hp,
      App.state.character.damage,
    );
    return (3600 / huntTime) * monster.exp;
  },

  getHuntTime(monsterHp, characterDamage) {
    const base = Math.ceil(monsterHp / characterDamage) * 1.5;
    return base + (App.state.character.skills.tropiciel ? 5 : 6.5);
  },

  getAvgGoldPerKill(monsterId) {
    const { drops } = App.state.gameData.monsters[monsterId];
    return drops.reduce((sum, drop) => {
      const item = App.state.gameData.items[drop.itemId];
      return sum + item.price * drop.chance;
    }, 0);
  },

  getGoldPerHour(monsterId) {
    const monster = App.state.gameData.monsters[monsterId];
    const huntTime = Ext.hunt.getHuntTime(
      monster.hp,
      App.state.character.damage,
    );
    return (3600 / huntTime) * Ext.hunt.getAvgGoldPerKill(monsterId);
  },

  switchTurboMode() {
    if (Ext.hunt.turboActive) socket.on("tick_update", Ext.hunt.startHunt);
    else socket.off("tick_update", Ext.hunt.startHunt);
  },

  startHunt(data) {
    if (data.expGained && !App.state.huntSwitchTimer) {
      App.startHunt(App.state.character.activity.monsterId);
    }
  },

  // ─── UI ──────────────────────────────────────────────────────────────────────

  addSkipWaitingButton() {
    const title = document.querySelector("#section-hunt > div.section-title");
    if (!title || document.getElementById("hunt-skip-btn")) return;

    const button = document.createElement("button");
    button.id = "hunt-skip-btn";
    button.className = "btn btn-secondary";
    button.style.width = "auto";
    button.textContent = "Pomiń oczekiwanie";

    button.addEventListener("click", () => {
      Ext.hunt.turboActive = !Ext.hunt.turboActive;
      button.textContent = Ext.hunt.turboActive
        ? "Tryb turbo włączony"
        : "Tryb turbo wyłączony";
      button.classList.toggle("btn-secondary", !Ext.hunt.turboActive);
      button.classList.toggle("btn-primary", Ext.hunt.turboActive);
      Ext.hunt.switchTurboMode();
    });

    title.appendChild(button);
  },
};
