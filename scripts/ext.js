const Ext = {};
let socket = null;
let token = null;

// Hook App.connectSocket
Ext.init = function () {
  socket = App.state.socket;
  token = localStorage.getItem("mg_token");
  replaceAppMineGame();
  Ext.mineQuest.init();
  Ext.mineGame.init();
  Ext.hunt.init();
  Ext.bag.init();
  Ext.gold.init();
};
