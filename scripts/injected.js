hookFunction(App, "renderMonsters", onHuntSection);
hookFunction(App, "renderBag", onBagSection);
hookFunction(App, "updateCharacterUI", onSyncCharacter);

function onHuntSection() {
  addExpPerHourToMonsters();
  addGoldPerHourToMonsters();
}

function onBagSection() {
  addSellAllButtons();
}

function onSyncCharacter() {
  updateTotalGold();
}
