function addSellAllButtons() {
  const NOSELL_IDS = new Set([
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
        const SHOP_NOSELL = new Set([
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

  const bagItems = App.state.character.inventory;

  const inventoryGrid = document.getElementById("inventory-grid");

  [...bagItems].forEach((item, i) => {
    if (NOSELL_IDS.has(item.itemId)) return;
    if (App.POTION_RECIPES[item.itemId]) return;
    if (item.quantity <= 1) return;

    const itemInfo =
      App.state.gameData.items[item.itemId] ||
      App.getWeaponById(item.itemId) ||
      App.getArmorById(item.itemId);
    let price = itemInfo.price;
    if (App.state.character.skills.negocjator) {
      price = Math.ceil(price * 1.05);
    }
    if (App.getWeaponById(item.itemId) || App.getArmorById(item.itemId)) {
      price = Math.floor(price * 0.4);
    }

    const itemElement = inventoryGrid.children[i];

    const sellAllButton = document.createElement("button");
    sellAllButton.textContent = `Sprzedaj Wszystko (${item.quantity * price} zł)`;
    sellAllButton.className = "btn btn-xs btn-secondary";
    sellAllButton.addEventListener("click", async () => {
      await sell(item.itemId, item.quantity);
    });
    itemElement.querySelector(".inv-item-actions").appendChild(sellAllButton);
  });
}

async function sell(itemId, qty) {
  const token = localStorage.getItem("mg_token");
  try {
    const res = await fetch("/api/game/shop/sell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ itemId, quantity: qty }),
    });
    const data = await res.json();
    if (!res.ok) {
      App.showNotification(data.error || "Błąd", "error");
      App.syncCharacter();
      return;
    }
    App.state.character = data.character || App.state.character;
    App.fixServerTimestamps(App.state.character);
    App.updateCharacterUI(App.state.character);
    App.renderBag();
    App.showNotification(
      "Sprzedano za " + (data.earned || 0) + " złota.",
      "success",
    );
  } catch (e) {
    App.showNotification("Błąd połączenia", "error");
  }
  onSectionChange("bag");
}
