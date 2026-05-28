function enableExtension() {
  if (!App) {
    console.log("Socket not ready, retrying mine game socket setup...");
    setTimeout(enableExtension, 10);
    return;
  }
  hookFunction(App, "connectSocket", Ext.init);
}
enableExtension();
