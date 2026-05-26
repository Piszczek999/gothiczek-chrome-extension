hookFunction(App, "renderMonsters", onHuntSection);
hookFunction(App, "renderBag", onBagSection);
hookFunction(App, "updateCharacterUI", onSyncCharacter);
hookFunction(App.mineGame, "_doEnter", onMineGame);
hookFunction(App.mineGame, "enter", onMineGameInstant);

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

function onMineGame() {
  setTimeout(onMineGameInstant, 100);
}

function onMineGameInstant() {
  renderAutoMineButton();
  addPriorityPanel();
  renderMineQuestContainer();
}
