Ext.gold = {
  init() {
    hookFunction(App, "updateCharacterUI", Ext.gold.updateTotalGold);
  },

  updateTotalGold() {
    const goldParent = document.querySelector(
      "#game-screen > header > div.header-stats > div:nth-child(4)",
    );
    const goldSum = Ext.gold.calculateTotalGold();
    const goldSumElement = document.createElement("span");
    goldSumElement.textContent = `(${goldSum} zł razem)`;
    goldSumElement.id = "gold-sum";
    goldSumElement.className = "stat-val";
    const existingSumElement = document.getElementById("gold-sum");

    if (existingSumElement) {
      goldParent.replaceChild(goldSumElement, existingSumElement);
    } else {
      goldParent.appendChild(goldSumElement);
    }
  },

  calculateTotalGold() {
    const excludeIds = new Set(
      Object.keys(App.SEED_DEFINITIONS).concat(
        Object.values(App.SEED_DEFINITIONS).map(function (s) {
          return s.yieldItemId;
        }),
        Object.keys(App.POTION_RECIPES || {}),
      ),
    );
    const ORE_IDS_SELL = App.CRAFT_NOSELL;
    ORE_IDS_SELL.delete("skora_owcy");
    ORE_IDS_SELL.delete("skora_wilka");
    ORE_IDS_SELL.delete("skora_kretoszczura");
    ORE_IDS_SELL.delete("skora_bestii");
    let goldSum = App.state.character.gold;
    App.state.character.inventory.forEach((item) => {
      if (excludeIds.has(item.itemId)) return;
      if (ORE_IDS_SELL.has(item.itemId)) return;
      if (App.getWeaponById(item.itemId) || App.getArmorById(item.itemId))
        return;

      const itemInfo = App.state.gameData.items[item.itemId];
      const sellPrice = App.state.character.skills.negocjator
        ? Math.ceil(itemInfo.price * 1.05)
        : itemInfo.price;
      goldSum += item.quantity * sellPrice;
    });
    return goldSum;
  },
};
