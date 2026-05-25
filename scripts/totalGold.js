function updateTotalGold() {
  const goldParent = document.querySelector(
    "#game-screen > header > div.header-stats > div:nth-child(4)",
  );
  const goldSum = calculateTotalGold();
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
}

function calculateTotalGold() {
  const excludeIds = new Set(
    Object.keys(App.SEED_DEFINITIONS).concat(
      Object.values(App.SEED_DEFINITIONS).map(function (s) {
        return s.yieldItemId;
      }),
      Object.keys(App.POTION_RECIPES || {}),
    ),
  );
  const ORE_IDS_BAG = new Set([
    "brylka_rudy",
    "brylka_zlota",
    "brylka_siarki",
    "brylka_wegla",
    "podpalka",
    "spoiwo",
    "magiczny_klejnot",
    "element_bizuterii",
    "pierscien_sily",
    "pierscien_potegi",
    "pierscien_wladzy",
    "amulet_giganta",
    "amulet_tytana",
    "amulet_niezlomnego",
    "klamra",
    "garbowana_skora",
    "wzmacniana_skora",
    "twarda_skora",
    "pas_wedrowca",
    "pas_straznika",
    "pas_gladiatora",
  ]);

  let goldSum = App.state.character.gold;
  App.state.character.inventory.forEach((item) => {
    if (excludeIds.has(item.itemId)) return;
    if (ORE_IDS_BAG.has(item.itemId)) return;
    if (App.getWeaponById(item.itemId) || App.getArmorById(item.itemId)) return;
    if (
      (App.state.gameData.weapons || []).some(function (w) {
        return w.id === item.itemId;
      })
    )
      return;
    if (
      (App.state.gameData.armors || []).some(function (a) {
        return a.id === item.itemId;
      })
    )
      return;

    const itemInfo = App.state.gameData.items[item.itemId];
    const sellPrice = App.state.character.skills.negocjator
      ? Math.ceil(itemInfo.price * 1.05)
      : itemInfo.price;
    goldSum += item.quantity * sellPrice;
  });
  return goldSum;
}
