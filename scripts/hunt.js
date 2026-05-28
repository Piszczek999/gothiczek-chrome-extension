Ext.hunt = {
  init() {
    hookFunction(App, "renderMonsters", Ext.hunt.onHuntSection);
  },

  onHuntSection() {
    Ext.hunt.addExpPerHourToMonsters();
    Ext.hunt.addGoldPerHourToMonsters();
  },

  // ─── Stats ──────────────────────────────────────────────────────────────────

  addExpPerHourToMonsters() {
    Ext.hunt.renderStatToMonsters(
      (i) => `Exp na godzinę: ${Ext.hunt.getExpPerHour(i).toFixed(2)}`,
    );
  },

  addGoldPerHourToMonsters() {
    Ext.hunt.renderStatToMonsters(
      (i) => `Złoto na godzinę: ${Ext.hunt.getGoldPerHour(i).toFixed(2)}`,
    );
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

  // ─── UI ──────────────────────────────────────────────────────────────────────

  renderStatToMonsters(labelFn) {
    const monsters = document.getElementById("monsters-grid");
    if (!monsters) return;

    [...monsters.children].forEach((element, i) => {
      const monStats = element.querySelector(".mon-stats");
      if (!monStats) return;

      const stat = document.createElement("span");
      stat.className = "mon-stat";

      const inner = document.createElement("span");
      inner.textContent = labelFn(i);
      inner.style.color = "#9dff00";

      stat.appendChild(inner);
      monStats.appendChild(stat);
    });
  },
};
