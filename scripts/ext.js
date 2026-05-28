const Ext = {};
let socket = null;
let token = null;

// Hook App.connectSocket
Ext.init = function () {
  socket = App.state.socket;
  token = localStorage.getItem("mg_token");
  Ext.initMineQuest();
};
