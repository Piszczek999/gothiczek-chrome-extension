App.mineGame = (function () {
  var socket = null;
  var canvas = null,
    ctx = null;
  var state = null;
  var skillInfo = null;
  var keys = {};
  var lastTickTime = 0;
  var rafId = null;
  var entered = false;

  var VIRT_W = 800,
    VIRT_H = 500;
  var VEIN_R = 18;
  var SPEED = 140;
  var MINING_DURATION_MS = 30000;
  var CHEST_INTERACT_R = 40;
  var chest = null;
  var autoMiningVeinId = null;

  var bgImage = (function () {
    var img = new Image();
    img.src = "/kopalnia_podloga.png";
    return img;
  })();

  var VEIN_MATERIAL_COLORS = {
    ore: { small: "#1e3a7a", normal: "#2356b8", rich: "#2e78e8" },
    gold: { small: "#7a5a00", normal: "#b88a00", rich: "#e8c020" },
    sulphur: { small: "#5a3a00", normal: "#a06000", rich: "#e08820" },
    coal: { small: "#282828", normal: "#404040", rich: "#5a5a5a" },
  };
  var VEIN_LABELS = {
    ore: {
      small: "Małe złoże rudy",
      normal: "Złoże rudy",
      rich: "Bogate złoże rudy",
    },
    gold: {
      small: "Małe złoże złota",
      normal: "Złoże złota",
      rich: "Bogate złoże złota",
    },
    sulphur: {
      small: "Małe złoże siarki",
      normal: "Złoże siarki",
      rich: "Bogate złoże siarki",
    },
    coal: {
      small: "Małe złoże węgla",
      normal: "Złoże węgla",
      rich: "Bogate złoże węgla",
    },
  };

  var toastMsg = "",
    toastUntil = 0;

  function _root() {
    return document.getElementById("mine-game-root");
  }

  function _buildLobbyHTML() {
    var skillLine = "";
    if (skillInfo) {
      skillLine =
        '<div class="mine-skill-info">Wydobywanie: Poz. <strong>' +
        skillInfo.miningLevel +
        "</strong> | EXP: <strong>" +
        skillInfo.miningXp +
        "/" +
        skillInfo.miningXpNeeded +
        "</strong> | Szansa: <strong>" +
        skillInfo.chance +
        "%</strong></div>";
    }
    return (
      '<div class="mine-lobby">' +
      '<div class="mine-lobby-title">⛏ Wejście do kopalni</div>' +
      skillLine +
      '<div class="mine-lobby-keys">Ruch: <strong>WASD / ↑↓←→</strong> &nbsp;|&nbsp; Kop: <strong>E / Spacja</strong> — auto-kopie aż do wyczerpania złoża &nbsp;|&nbsp; Anuluj: <strong>ESC / Q</strong></div>' +
      '<button class="btn btn-primary" onclick="App.mineGame._doEnter()">⛏ Wejdź do kopalni</button>' +
      "</div>"
    );
  }

  function _buildGameHTML() {
    return (
      '<div class="mine-root">' +
      '<div class="mine-hud-bar"><span class="mine-hud-info" id="mine-hud-info"></span></div>' +
      '<div class="mine-canvas-wrap" id="mine-canvas-wrap"><canvas id="mine-canvas" width="800" height="500"></canvas><div class="mine-result-toast" id="mine-toast" style="opacity:0"></div></div>' +
      '<div class="mine-mobile-controls">' +
      '<div class="mine-dpad">' +
      '<div class="mine-dpad-row"><button class="mine-dpad-btn" ontouchstart="App.mineGame.keyDown(\'ArrowUp\')" ontouchend="App.mineGame.keyUp(\'ArrowUp\')" onmousedown="App.mineGame.keyDown(\'ArrowUp\')" onmouseup="App.mineGame.keyUp(\'ArrowUp\')" onmouseleave="App.mineGame.keyUp(\'ArrowUp\')">▲</button></div>' +
      '<div class="mine-dpad-row">' +
      '<button class="mine-dpad-btn" ontouchstart="App.mineGame.keyDown(\'ArrowLeft\')" ontouchend="App.mineGame.keyUp(\'ArrowLeft\')" onmousedown="App.mineGame.keyDown(\'ArrowLeft\')" onmouseup="App.mineGame.keyUp(\'ArrowLeft\')" onmouseleave="App.mineGame.keyUp(\'ArrowLeft\')">◀</button>' +
      '<div class="mine-dpad-center">⛏</div>' +
      '<button class="mine-dpad-btn" ontouchstart="App.mineGame.keyDown(\'ArrowRight\')" ontouchend="App.mineGame.keyUp(\'ArrowRight\')" onmousedown="App.mineGame.keyDown(\'ArrowRight\')" onmouseup="App.mineGame.keyUp(\'ArrowRight\')" onmouseleave="App.mineGame.keyUp(\'ArrowRight\')">▶</button>' +
      "</div>" +
      '<div class="mine-dpad-row"><button class="mine-dpad-btn" ontouchstart="App.mineGame.keyDown(\'ArrowDown\')" ontouchend="App.mineGame.keyUp(\'ArrowDown\')" onmousedown="App.mineGame.keyDown(\'ArrowDown\')" onmouseup="App.mineGame.keyUp(\'ArrowDown\')" onmouseleave="App.mineGame.keyUp(\'ArrowDown\')">▼</button></div>' +
      "</div>" +
      '<div class="mine-action-btns">' +
      '<button class="btn btn-primary mine-action-btn" ontouchstart="App.mineGame.mobileKop()" onclick="App.mineGame.mobileKop()">⛏ Kop</button>' +
      '<button class="btn btn-secondary mine-action-btn" ontouchstart="App.mineGame.mobileCancel()" onclick="App.mineGame.mobileCancel()">✕ Przerwij</button>' +
      "</div>" +
      "</div>" +
      '<div class="mine-leave-bar">' +
      '<button class="btn btn-secondary" onclick="App.leaveMine()">⬅ Opuść kopalnię</button>' +
      "</div>" +
      "</div>"
    );
  }

  function enter() {
    var root = _root();
    if (!root) return;
    socket = App.state.socket;
    if (!socket) {
      root.innerHTML = '<p style="color:var(--text3)">Brak połączenia.</p>';
      return;
    }
    if (entered) {
      root.innerHTML = _buildGameHTML();
      _attachCanvas();
      return;
    }
    root.innerHTML = _buildLobbyHTML();
  }

  function _doEnter() {
    var char = App.state.character;
    if (char && char.activity && char.activity.type) {
      var actLabels = {
        hunting: "polowanie",
        guard: "wartę",
        foraging: "zbieractwo",
        brewing: "warzenie mikstury",
      };
      var actLabel = actLabels[char.activity.type] || char.activity.type;
      var extra =
        char.activity.type === "brewing" ? " Stracisz zużyte składniki!" : "";
      App.showConfirm(
        "Wejść do kopalni?",
        "Wejście do kopalni przerwie aktualną " +
          actLabel +
          "." +
          extra +
          " Kontynuować?",
        _doEnterNow,
      );
      return;
    }
    _doEnterNow();
  }

  function _doEnterNow() {
    var root = _root();
    if (!root) return;
    socket = App.state.socket;
    if (!socket) return;
    root.innerHTML = _buildGameHTML();
    _attachCanvas();
    entered = true;
    keys = {};
    App.state.inMine = true;

    socket.emit("mine_enter");
    socket.on("mine_state", _onState);
    socket.on("mine_player_joined", _onPlayerJoined);
    socket.on("mine_player_left", _onPlayerLeft);
    socket.on("mine_player_moved", _onPlayerMoved);
    socket.on("mine_mining_started", _onMiningStarted);
    socket.on("mine_mining_cancelled", _onMiningCancelled);
    socket.on("mine_result", _onResult);
    socket.on("mine_vein_update", _onVeinUpdate);
    socket.on("mine_vein_spawned", _onVeinSpawned);
    socket.on("mine_error", _onMineError);
    socket.on("mine_skill_info", _onSkillInfo);
    socket.on("mine_chest_spawned", _onChestSpawned);
    socket.on("mine_chest_claimed", _onChestClaimed);
    socket.on("mine_chest_loot", _onChestLoot);
  }

  function _attachCanvas() {
    canvas = document.getElementById("mine-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    lastTickTime = performance.now();
    _detachInput();
    document.addEventListener("keydown", _onKeyDown);
    document.addEventListener("keyup", _onKeyUp);
    canvas.addEventListener("mousemove", _onMouseMove);
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(_loop);
  }

  function pause() {
    _detachInput();
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    canvas = null;
    ctx = null;
  }

  function leave() {
    autoMiningVeinId = null;
    pause();
    if (entered && socket) {
      socket.emit("mine_leave");
      socket.off("mine_state", _onState);
      socket.off("mine_player_joined", _onPlayerJoined);
      socket.off("mine_player_left", _onPlayerLeft);
      socket.off("mine_player_moved", _onPlayerMoved);
      socket.off("mine_mining_started", _onMiningStarted);
      socket.off("mine_mining_cancelled", _onMiningCancelled);
      socket.off("mine_result", _onResult);
      socket.off("mine_vein_update", _onVeinUpdate);
      socket.off("mine_vein_spawned", _onVeinSpawned);
      socket.off("mine_error", _onMineError);
      socket.off("mine_skill_info", _onSkillInfo);
      socket.off("mine_chest_spawned", _onChestSpawned);
      socket.off("mine_chest_claimed", _onChestClaimed);
      socket.off("mine_chest_loot", _onChestLoot);
    }
    entered = false;
    state = null;
    chest = null;
    App.state.inMine = false;
  }

  function _detachInput() {
    document.removeEventListener("keydown", _onKeyDown);
    document.removeEventListener("keyup", _onKeyUp);
    if (canvas) {
      canvas.removeEventListener("mousemove", _onMouseMove);
    }
    keys = {};
  }

  var mouseVirtX = -1,
    mouseVirtY = -1;

  function _canvasToVirt(clientX, clientY) {
    if (!canvas) return { x: -1, y: -1 };
    var rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (VIRT_W / rect.width),
      y: (clientY - rect.top) * (VIRT_H / rect.height),
    };
  }

  function _onMouseMove(e) {
    var v = _canvasToVirt(e.clientX, e.clientY);
    mouseVirtX = v.x;
    mouseVirtY = v.y;
  }

  function _onKeyDown(e) {
    var tag = document.activeElement && document.activeElement.tagName;
    var isTyping = tag === "INPUT" || tag === "TEXTAREA";
    keys[e.code] = true;
    if (isTyping) return;
    if ((e.code === "KeyE" || e.code === "Space") && state) {
      e.preventDefault();
      _tryInteract();
    }
    if ((e.code === "Escape" || e.code === "KeyQ") && state) {
      e.preventDefault();
      autoMiningVeinId = null;
      socket.emit("mine_cancel_mining");
    }
  }
  function _onKeyUp(e) {
    keys[e.code] = false;
  }

  function _tryInteract() {
    var me = _me();
    if (!me) return;
    if (
      chest &&
      Math.hypot(me.x - chest.x, me.y - chest.y) <= CHEST_INTERACT_R
    ) {
      socket.emit("mine_open_chest");
      return;
    }
    if (me.miningVeinId) return;
    var nearest = _nearestVein(me.x, me.y, 58);
    if (nearest) {
      autoMiningVeinId = nearest.id;
      socket.emit("mine_start_mining", { veinId: nearest.id });
    }
  }

  function _nearestVein(x, y, maxDist) {
    if (!state) return null;
    var best = null,
      bestD = maxDist + 1;
    state.veins.forEach(function (v) {
      var d = Math.hypot(v.x - x, v.y - y);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    });
    return best;
  }

  function _me() {
    if (!state || !socket) return null;
    return (
      state.players.find(function (p) {
        return p.socketId === socket.id;
      }) || null
    );
  }

  function _loop(now) {
    if (!canvas || !ctx) return;
    var dt = Math.min((now - lastTickTime) / 1000, 0.1);
    lastTickTime = now;
    _tick(dt);
    _draw();
    rafId = requestAnimationFrame(_loop);
  }

  function _tick(dt) {
    if (!state || !socket) return;
    var me = _me();
    if (!me || me.miningVeinId) return;
    var dx = 0,
      dy = 0;
    if (keys["KeyW"] || keys["ArrowUp"]) dy -= 1;
    if (keys["KeyS"] || keys["ArrowDown"]) dy += 1;
    if (keys["KeyA"] || keys["ArrowLeft"]) dx -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) dx += 1;
    if (dx === 0 && dy === 0) return;
    var len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    me.x = Math.round(
      Math.max(8, Math.min(VIRT_W - 8, me.x + dx * SPEED * dt)),
    );
    me.y = Math.round(
      Math.max(8, Math.min(VIRT_H - 8, me.y + dy * SPEED * dt)),
    );
    socket.emit("mine_move", { x: me.x, y: me.y });
  }

  function _draw() {
    if (!ctx || !state) return;
    ctx.clearRect(0, 0, VIRT_W, VIRT_H);

    if (bgImage.complete && bgImage.naturalWidth > 0) {
      ctx.drawImage(bgImage, 0, 0, VIRT_W, VIRT_H);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, VIRT_W, VIRT_H);
    } else {
      ctx.fillStyle = "#0c0a10";
      ctx.fillRect(0, 0, VIRT_W, VIRT_H);
    }

    var me = _me();
    var nowTs = Date.now();

    state.veins.forEach(function (v) {
      var matColors =
        VEIN_MATERIAL_COLORS[v.materialType] || VEIN_MATERIAL_COLORS.ore;
      var col = matColors[v.type] || matColors.normal;
      var matLabels = VEIN_LABELS[v.materialType] || VEIN_LABELS.ore;
      var inRange = me && Math.hypot(me.x - v.x, me.y - v.y) <= 58;
      ctx.save();
      ctx.shadowBlur = inRange ? 22 : 8;
      ctx.shadowColor = col;
      ctx.beginPath();
      ctx.arc(v.x, v.y, VEIN_R, 0, Math.PI * 2);
      ctx.fillStyle = inRange ? col : _dimColor(col, 0.55);
      ctx.fill();
      ctx.strokeStyle = inRange ? "#aad4ff" : "rgba(100,160,255,0.3)";
      ctx.lineWidth = inRange ? 2 : 1;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = inRange ? "#ddeeff" : "rgba(180,210,255,0.55)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(matLabels[v.type] || v.type, v.x, v.y + VEIN_R + 13);
      var maxC = v.maxCharges || 15;
      var pips = Math.min(v.charges, maxC);
      var pipW = 3,
        pipGap = 2;
      var px0 = v.x - (pips * (pipW + pipGap) - pipGap) / 2;
      for (var i = 0; i < pips; i++) {
        ctx.fillStyle = col;
        ctx.fillRect(px0 + i * (pipW + pipGap), v.y - VEIN_R - 9, pipW, 5);
      }
    });

    var me3 = _me();
    if (me3 && me3.miningVeinId && me3.miningStartTime) {
      var mv = state.veins.find(function (vv) {
        return vv.id === me3.miningVeinId;
      });
      if (mv) {
        var frac = Math.min(
          (nowTs - me3.miningStartTime) / MINING_DURATION_MS,
          1,
        );
        ctx.beginPath();
        ctx.arc(
          mv.x,
          mv.y,
          VEIN_R + 7,
          -Math.PI / 2,
          -Math.PI / 2 + frac * Math.PI * 2,
        );
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    if (chest) {
      var me2 = _me();
      var chestNear =
        me2 && Math.hypot(me2.x - chest.x, me2.y - chest.y) <= CHEST_INTERACT_R;
      ctx.save();
      ctx.shadowBlur = chestNear ? 30 : 18;
      ctx.shadowColor = "#ffd700";
      ctx.fillStyle = "#7a4a10";
      ctx.fillRect(chest.x - 9, chest.y - 6, 18, 12);
      ctx.fillStyle = "#9a6020";
      ctx.fillRect(chest.x - 9, chest.y - 9, 18, 5);
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(chest.x - 2, chest.y - 4, 4, 4);
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = chestNear ? 2 : 1;
      ctx.strokeRect(chest.x - 9, chest.y - 9, 18, 15);
      ctx.restore();
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📦 Skrzynia", chest.x, chest.y + 16);
    }

    state.players.forEach(function (p) {
      _drawPlayer(p, p.socketId === socket.id);
    });

    if (toastMsg && nowTs < toastUntil) {
      var alpha = Math.min(1, (toastUntil - nowTs) / 400);
      var el = document.getElementById("mine-toast");
      if (el) {
        el.textContent = toastMsg;
        el.style.opacity = String(alpha);
      }
    } else {
      var toastEl = document.getElementById("mine-toast");
      if (toastEl) toastEl.style.opacity = "0";
    }

    var hud = document.getElementById("mine-hud-info");
    if (hud) {
      var meNow = _me();
      var txt = "Graczy: <strong>" + state.players.length + "</strong>";
      if (skillInfo) {
        txt +=
          " &nbsp;|&nbsp; Wydobywanie: <strong>Poz." +
          skillInfo.miningLevel +
          "</strong> EXP " +
          skillInfo.miningXp +
          "/" +
          skillInfo.miningXpNeeded +
          " (" +
          skillInfo.chance +
          "%)";
        if (skillInfo.potionActive)
          txt +=
            ' &nbsp; <span style="color:#c8a84b">⛏ Mikstura Kopacza!</span>';
      }
      if (meNow && meNow.miningVeinId)
        txt += autoMiningVeinId
          ? ' &nbsp; ⟳ <strong style="color:#ffd700">Auto-kopanie…</strong>'
          : ' &nbsp; ⛏ <strong style="color:#ffd700">Kopanie…</strong>';
      hud.innerHTML = txt;
    }
  }

  function _drawPlayer(p, isMe) {
    var x = p.x,
      y = p.y;
    if (!isMe) ctx.globalAlpha = 0.3;
    ctx.save();
    ctx.fillStyle = p.pantsColor || "#3a2a1a";
    ctx.fillRect(x - 5, y + 2, 10, 8);
    ctx.fillStyle = p.shirtColor || "#5a3a1a";
    ctx.fillRect(x - 6, y - 5, 12, 9);
    ctx.fillStyle = "#d4a070";
    ctx.beginPath();
    ctx.arc(x, y - 11, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.hairColor || "#8B6914";
    ctx.beginPath();
    ctx.arc(x, y - 14, 6, Math.PI, 0);
    ctx.fill();
    ctx.restore();
    ctx.font = isMe ? "bold 10px sans-serif" : "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = isMe ? "#ffd700" : "rgba(255,255,255,0.75)";
    ctx.fillText(p.charName || "?", x, y - 22);
    if (p.miningVeinId) {
      ctx.font = "13px sans-serif";
      ctx.fillText("⛏", x + 9, y - 5);
    }
    if (!isMe) ctx.globalAlpha = 1;
  }

  function _dimColor(hex, f) {
    return (
      "rgb(" +
      Math.round(parseInt(hex.slice(1, 3), 16) * f) +
      "," +
      Math.round(parseInt(hex.slice(3, 5), 16) * f) +
      "," +
      Math.round(parseInt(hex.slice(5, 7), 16) * f) +
      ")"
    );
  }

  function _onState(data) {
    var clockOffset = Date.now() - (data.serverNow || Date.now());
    state = {
      players: (data.players || []).map(function (p) {
        if (p.miningStartTime)
          p.miningStartTime = p.miningStartTime + clockOffset;
        return p;
      }),
      veins: data.veins || [],
      mapWidth: data.mapWidth,
      mapHeight: data.mapHeight,
    };
    chest = data.chest || null;
    VIRT_W = data.mapWidth || 800;
    VIRT_H = data.mapHeight || 500;
  }
  function _onPlayerJoined(data) {
    if (!state) return;
    state.players = state.players.filter(function (p) {
      return p.socketId !== data.player.socketId;
    });
    state.players.push(data.player);
  }
  function _onPlayerLeft(data) {
    if (!state) return;
    state.players = state.players.filter(function (p) {
      return p.socketId !== data.socketId;
    });
  }
  function _onPlayerMoved(data) {
    if (!state) return;
    var p = state.players.find(function (p) {
      return p.socketId === data.socketId;
    });
    if (p) {
      p.x = data.x;
      p.y = data.y;
      p.miningVeinId = data.miningVeinId;
      p.miningStartTime = data.miningStartTime;
    }
  }
  function _onMiningStarted(data) {
    if (!state) return;
    var p = state.players.find(function (p) {
      return p.socketId === data.socketId;
    });
    if (p) {
      p.miningVeinId = data.veinId;
      p.miningStartTime = Date.now();
    }
  }
  function _onMiningCancelled(data) {
    if (!state) return;
    var p = state.players.find(function (p) {
      return p.socketId === data.socketId;
    });
    if (p) {
      p.miningVeinId = null;
      p.miningStartTime = null;
    }
    if (socket && data.socketId === socket.id) autoMiningVeinId = null;
  }
  function _onResult(data) {
    var me = _me();
    if (me) {
      me.miningVeinId = null;
      me.miningStartTime = null;
    }
    if (data.success) {
      if (data.inventory && App.state.character) {
        App.state.character.inventory = data.inventory;
        if (App.state.currentSection === "bag") App.renderBag();
      }
      if (data.mineQuestProgress && App.state.character) {
        App.state.character.mineQuestProgress = data.mineQuestProgress;
      }
      var MAT_NAMES = {
        ore: "rudy",
        gold: "złota",
        sulphur: "siarki",
        coal: "węgla",
      };
      var matLabel = MAT_NAMES[data.materialType] || "rudy";
      _toast("✓ Wydobyto bryłkę " + matLabel + "! +1 EXP");
    } else if (!data.depleted && !data.veinGone) {
      _toast("✗ Nic nie znaleziono.");
    }
    if (data.depleted || data.veinGone) {
      autoMiningVeinId = null;
      if (data.depleted) _toast("⛏ Żyła wyczerpana!");
      return;
    }
    if (
      autoMiningVeinId &&
      String(autoMiningVeinId) === String(data.veinId) &&
      socket
    ) {
      socket.emit("mine_start_mining", { veinId: autoMiningVeinId });
    }
  }
  function _onVeinUpdate(data) {
    if (!state) return;
    if (data.depleted) {
      state.veins = state.veins.filter(function (v) {
        return v.id !== data.veinId;
      });
    } else {
      var v = state.veins.find(function (v) {
        return v.id === data.veinId;
      });
      if (v) v.charges = data.newCharges;
    }
  }
  function _onVeinSpawned(data) {
    if (state) state.veins.push(data.vein);
  }
  function _onMineError(data) {
    _toast("⚠ " + (data.error || "Błąd"));
  }
  function _onSkillInfo(data) {
    skillInfo = data;
    var char = App.state.character;
    if (char) {
      char.miningLevel = data.miningLevel;
      char.miningXp = data.miningXp;
      if (App.state.currentSection === "bag") App.renderBag();
    }
    var hud = document.getElementById("mine-hud-info");
    if (hud && state) {
      var me = _me();
      var txt = "Graczy: <strong>" + state.players.length + "</strong>";
      txt +=
        " &nbsp;|&nbsp; Wydobywanie: <strong>Poz. " +
        data.miningLevel +
        "</strong> EXP " +
        data.miningXp +
        "/" +
        data.miningXpNeeded +
        " (" +
        data.chance +
        "%)";
      if (data.potionActive)
        txt += ' &nbsp; <span style="color:#c8a84b">⛏ Mikstura Kopacza!</span>';
      if (me && me.miningVeinId)
        txt += ' &nbsp; ⛏ <strong style="color:#ffd700">Kopanie…</strong>';
      hud.innerHTML = txt;
    }
  }

  function _onChestSpawned(data) {
    chest = data.chest;
    _toast("📦 W kopalni pojawiła się skrzynia!");
  }
  function _onChestClaimed(data) {
    if (chest && chest.id === data.chestId) chest = null;
    var oreNames = {
      brylka_rudy: "bryłek rudy",
      brylka_zlota: "bryłek złota",
      brylka_siarki: "bryłek siarki",
      brylka_wegla: "bryłek węgla",
    };
    _toast(
      data.claimedBy +
        " otworzył skrzynię! (" +
        data.qty +
        "x " +
        (oreNames[data.itemId] || data.itemId) +
        ")",
    );
  }
  function _onChestLoot(data) {
    if (data.inventory && App.state.character) {
      App.state.character.inventory = data.inventory;
      if (App.state.currentSection === "bag") App.renderBag();
    }
    var oreNames = {
      brylka_rudy: "bryłek rudy",
      brylka_zlota: "bryłek złota",
      brylka_siarki: "bryłek siarki",
      brylka_wegla: "bryłek węgla",
    };
    _toast(
      "📦 Zdobyłeś " +
        data.qty +
        "x " +
        (oreNames[data.itemId] || data.itemId) +
        "!",
    );
  }

  function _toast(msg) {
    toastMsg = msg;
    toastUntil = Date.now() + 2500;
  }

  function rejoin() {
    if (!socket) return;
    socket.off("mine_state", _onState);
    socket.off("mine_player_joined", _onPlayerJoined);
    socket.off("mine_player_left", _onPlayerLeft);
    socket.off("mine_player_moved", _onPlayerMoved);
    socket.off("mine_mining_started", _onMiningStarted);
    socket.off("mine_mining_cancelled", _onMiningCancelled);
    socket.off("mine_result", _onResult);
    socket.off("mine_vein_update", _onVeinUpdate);
    socket.off("mine_vein_spawned", _onVeinSpawned);
    socket.off("mine_error", _onMineError);
    socket.off("mine_skill_info", _onSkillInfo);
    socket.off("mine_chest_spawned", _onChestSpawned);
    socket.off("mine_chest_claimed", _onChestClaimed);
    socket.off("mine_chest_loot", _onChestLoot);
    entered = false;
    state = null;
    chest = null;
    autoMiningVeinId = null;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    canvas = null;
    ctx = null;
    _doEnterNow();
  }

  function keyDown(code) {
    keys[code] = true;
  }
  function keyUp(code) {
    keys[code] = false;
  }
  function mobileKop() {
    if (state) _tryInteract();
  }
  function mobileCancel() {
    autoMiningVeinId = null;
    if (socket) socket.emit("mine_cancel_mining");
  }

  return {
    enter: enter,
    pause: pause,
    leave: leave,
    rejoin: rejoin,
    _doEnter: _doEnter,
    keyDown: keyDown,
    keyUp: keyUp,
    mobileKop: mobileKop,
    mobileCancel: mobileCancel,
  };
})();
App.music = (function () {
  var STORAGE_VOL = "mg_music_vol";
  var STORAGE_STOP = "mg_music_stopped";
  var audio = null;

  function getVolume() {
    var v = parseFloat(localStorage.getItem(STORAGE_VOL));
    return isNaN(v) ? 0.2 : Math.max(0, Math.min(1, v));
  }
  function saveVolume(v) {
    localStorage.setItem(STORAGE_VOL, String(v));
  }
  function isStopped() {
    return localStorage.getItem(STORAGE_STOP) === "1";
  }
  function setStopped(v) {
    localStorage.setItem(STORAGE_STOP, v ? "1" : "0");
  }

  function init() {
    if (audio) return;
    audio = new Audio("/dzwieki/Wyspa_Khorinis.mp3");
    audio.loop = true;
    audio.volume = getVolume();
    if (!isStopped()) {
      var p = audio.play();
      if (p && p.catch) {
        p.catch(function () {
          var unlock = function () {
            if (!isStopped()) audio.play().catch(function () {});
            document.removeEventListener("click", unlock);
            document.removeEventListener("keydown", unlock);
          };
          document.addEventListener("click", unlock, { once: true });
          document.addEventListener("keydown", unlock, { once: true });
        });
      }
    }
    App.music._audio = audio;
  }

  function play() {
    if (!audio) return;
    setStopped(false);
    audio.play().catch(function () {});
    App.music._updateUI();
  }

  function pause() {
    if (!audio) return;
    setStopped(true);
    audio.pause();
    App.music._updateUI();
  }

  function stop() {
    if (!audio) return;
    setStopped(true);
    audio.pause();
    audio.currentTime = 0;
    App.music._updateUI();
  }

  function setVolume(v) {
    v = Math.max(0, Math.min(1, parseFloat(v) || 0));
    saveVolume(v);
    if (audio) audio.volume = v;
    App.music._updateUI();
  }

  function isPlaying() {
    return audio && !audio.paused;
  }

  function _updateUI() {
    var btn = document.getElementById("music-play-btn");
    var slider = document.getElementById("music-vol-slider");
    var volLabel = document.getElementById("music-vol-label");
    if (btn) btn.textContent = isPlaying() ? "⏸ Pauza" : "▶ Odtwórz";
    if (slider) slider.value = String(Math.round(getVolume() * 100));
    if (volLabel) volLabel.textContent = Math.round(getVolume() * 100) + "%";
  }

  return {
    init: init,
    play: play,
    pause: pause,
    stop: stop,
    setVolume: setVolume,
    isPlaying: isPlaying,
    _updateUI: _updateUI,
    _audio: null,
  };
})();

App.renderTickets = async function () {
  const container = document.getElementById("tickets-container");
  if (!container) return;
  container.innerHTML =
    '<div style="color:var(--text3);padding:12px">Ładowanie zgłoszeń...</div>';
  App.state.ticketUnread = false;
  const navBtn = document.getElementById("nav-tickets");
  if (navBtn) navBtn.classList.remove("ticket-unread");
  try {
    const r = await fetch("/api/game/tickets", {
      headers: { Authorization: "Bearer " + localStorage.getItem("mg_token") },
    });
    const data = await r.json();
    if (!r.ok) {
      container.innerHTML =
        '<div class="auth-error">' +
        esc(data.error || "Błąd serwera") +
        "</div>";
      return;
    }
    const tickets = Array.isArray(data) ? data : data.tickets || [];
    let html = "";
    if (tickets.length > 0) {
      html += '<div class="ticket-list">';
      tickets.forEach(function (t) {
        const date = new Date(t.createdAt).toLocaleDateString("pl-PL");
        const statusClass =
          t.status === "open" ? "ticket-status-open" : "ticket-status-closed";
        const statusLabel = t.status === "open" ? "Otwarte" : "Zamknięte";
        html +=
          '<div class="ticket-item" onclick="App.openTicket(\'' +
          esc(t.id) +
          "')\">" +
          '<div class="ticket-item-header">' +
          '<span class="ticket-item-subject">' +
          esc(t.subject) +
          "</span>" +
          '<span class="' +
          statusClass +
          '">' +
          statusLabel +
          "</span>" +
          "</div>" +
          '<div class="ticket-item-meta">' +
          '<span class="ticket-date">' +
          date +
          "</span>" +
          (t.hasUnreadReply
            ? '<span class="ticket-unread-dot">● Nowa odpowiedź</span>'
            : "") +
          "</div>" +
          "</div>";
      });
      html += "</div>";
    } else {
      html +=
        '<div class="ticket-empty">Nie masz jeszcze żadnych zgłoszeń.</div>';
    }
    html +=
      '<div class="ticket-new-form">' +
      '<div class="ticket-form-title">Napisz nowe zgłoszenie</div>' +
      '<div class="form-group"><label>Temat</label><input type="text" id="ticket-subject-input" maxlength="80" placeholder="Krótki opis problemu" class="ticket-input"></div>' +
      '<div class="form-group"><label>Wiadomość</label><textarea id="ticket-body-input" maxlength="1000" placeholder="Opisz szczegółowo swój problem..." class="ticket-textarea" rows="5"></textarea></div>' +
      '<button class="btn btn-primary" onclick="App.sendTicket()">Wyślij zgłoszenie</button>' +
      "</div>";
    container.innerHTML = html;
  } catch (e) {
    container.innerHTML =
      '<div class="auth-error">Błąd połączenia z serwerem.</div>';
  }
};
