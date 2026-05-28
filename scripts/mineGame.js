Ext.mineGame = {
  mineClosest: false,
  state: null,

  init() {
    Ext.mineGame.mineClosest = false;
    Ext.mineGame.setFakeAudio();

    hookFunction(App.mineGame, "_doEnter", Ext.mineGame.connect, {
      patchFlag: "__mineGame",
    });
    hookFunction(App.mineGame, "leave", Ext.mineGame.disconnect, {
      patchFlag: "__mineGame",
    });
  },

  // Important to force app to work in the background
  setFakeAudio() {
    const audio = new Audio("/dzwieki/Wyspa_Khorinis.mp3");
    audio.loop = true;
    audio.volume = 0.01;
    document.addEventListener("click", () => audio.play(), { once: true });
    document.addEventListener("keydown", () => audio.play(), { once: true });
  },

  connect() {
    socket.on("mine_state", Ext.mineGame.onMineState);
    socket.on("mine_player_joined", Ext.mineGame.onPlayerJoined);
    socket.on("mine_player_left", Ext.mineGame.onPlayerLeft);
    socket.on("mine_players_moved", Ext.mineGame.onPlayersMoved);
    socket.on("mine_mining_started", Ext.mineGame.onMiningStarted);
    socket.on("mine_mining_cancelled", Ext.mineGame.onMiningCancelled);
    socket.on("mine_vein_update", Ext.mineGame.onVeinUpdate);
    socket.on("mine_vein_spawned", Ext.mineGame.onVeinSpawned);
  },

  disconnect() {
    socket.off("mine_state");
    socket.off("mine_player_joined");
    socket.off("mine_player_left");
    socket.off("mine_players_moved");
    socket.off("mine_mining_started");
    socket.off("mine_mining_cancelled");
    socket.off("mine_vein_update");
    socket.off("mine_vein_spawned");
  },

  // ─── Socket event handlers ────────────────────────────────────────────────────

  onMineState(data) {
    const clockOffset = Date.now() - (data.serverNow || Date.now());
    Ext.mineGame.state = {
      players: (data.players || []).map(function (p) {
        if (p.miningStartTime)
          p.miningStartTime = p.miningStartTime + clockOffset;
        return p;
      }),
      veins: data.veins || [],
      mapWidth: data.mapWidth,
      mapHeight: data.mapHeight,
    };
  },

  onPlayerJoined(data) {
    Ext.mineGame.state.players = Ext.mineGame.state.players.filter(
      function (p) {
        return p.socketId !== data.player.socketId;
      },
    );
    Ext.mineGame.state.players.push(data.player);
  },

  onPlayerLeft(data) {
    Ext.mineGame.state.players = Ext.mineGame.state.players.filter(
      function (p) {
        return p.socketId !== data.socketId;
      },
    );
  },

  onPlayersMoved(batch) {
    batch.forEach((d) => {
      if (d.socketId === socket.id) return;
      var p = Ext.mineGame.getPlayer(d.socketId);
      if (p) {
        p.targetX = d.x;
        p.targetY = d.y;
        p.miningVeinId = d.miningVeinId;
        p.miningStartTime = d.miningStartTime;
      }
    });
  },

  onMiningStarted(data) {
    var p = Ext.mineGame.getPlayer(data.socketId);
    if (p) {
      p.miningVeinId = data.veinId;
      p.miningStartTime = Date.now();
    }
  },

  onMiningCancelled(data) {
    var p = Ext.mineGame.getPlayer(data.socketId);
    if (p) {
      p.miningVeinId = null;
      p.miningStartTime = null;
    }
  },

  onVeinUpdate(data) {
    if (data.depleted) {
      Ext.mineGame.state.veins = Ext.mineGame.state.veins.filter(
        (v) => v.id !== data.veinId,
      );
    } else {
      var v = Ext.mineGame.state.veins.find((v) => v.id === data.veinId);
      if (v) v.charges = data.newCharges;
    }
  },

  onVeinSpawned(data) {
    Ext.mineGame.state.veins.push(data.vein);
  },

  onPlayerTitleChanged(data) {
    var p = Ext.mineGame.getPlayer(data.socketId);
    if (p) p.title = data.title;
  },

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  getPlayer(socketId) {
    return Ext.mineGame.state.players.find(
      (p) => p.socketId === socketId ?? App.state.socket.id,
    );
  },

  nearestVeinOfType(x, y, matType) {
    var best = null,
      bestD = Infinity;
    Ext.mineGame.state.veins.forEach((v) => {
      if (v.materialType !== matType) return;
      var d = Math.hypot(v.x - x, v.y - y);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    });
    return best;
  },
};
