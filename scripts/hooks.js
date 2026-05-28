// hookFunction(App, "renderMonsters", onHuntSection);
// hookFunction(App, "renderBag", onBagSection);
// hookFunction(App, "updateCharacterUI", onSyncCharacter);

function enableExtension() {
  if (!App) {
    console.log("Socket not ready, retrying mine game socket setup...");
    setTimeout(enableExtension, 10);
    return;
  }
  hookFunction(App, "connectSocket", Ext.init);
}
enableExtension();

// function onHuntSection() {
//   addExpPerHourToMonsters();
//   addGoldPerHourToMonsters();
// }

// function onBagSection() {
//   addSellAllButtons();
// }

// function onSyncCharacter() {
//   updateTotalGold();
// }

// App.state.socket.on("tick_update", (data) => {
//   if (data.expGained && !App.state.huntSwitchTimer) {
//     App.startHunt(App.state.character.activity.monsterId);
//   };
// });
