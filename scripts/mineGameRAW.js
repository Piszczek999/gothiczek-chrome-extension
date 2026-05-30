function replaceAppMineGame() {
  App.mineGame = (function () {
    var socket = null;
    var canvas = null,
      ctx = null;
    var state = null;
    var skillInfo = null;
    var lastTickTime = 0;
    var rafId = null;
    var lastMoveSent = 0;
    var entered = false;
    var mineType = "main";
    var targetMaterialType = null;
    var autoActive = false;
    var startMiningSent = false;

    var VIRT_W = 800,
      VIRT_H = 500;
    var VEIN_R = 18;
    var SPEED = 140;
    var MINING_DURATION_MS = 30000;

    var MINE_MATERIAL_TYPES = {
      main: ["ore", "gold", "sulphur", "coal"],
      shaft: ["sulphur", "iron"],
      bottom: ["black_ore", "gold"],
    };

    var MATERIAL_BTN_LABELS = {
      ore: "⛏ Ruda",
      gold: "✨ Złoto",
      sulphur: "🔥 Siarka",
      coal: "◼ Węgiel",
      iron: "🔩 Żelazo",
      black_ore: "🖤 Czarna ruda",
    };

    var MATERIAL_NAMES_PL = {
      ore: "rudy",
      gold: "złota",
      sulphur: "siarki",
      coal: "węgla",
      iron: "żelaza",
      black_ore: "czarnej rudy",
    };

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
      iron: { small: "#5a2a0a", normal: "#8b4010", rich: "#c05a18" },
      black_ore: { small: "#1a0a2a", normal: "#2e0f4a", rich: "#4a1870" },
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
      iron: {
        small: "Małe złoże żelaza",
        normal: "Złoże żelaza",
        rich: "Bogate złoże żelaza",
      },
      black_ore: {
        small: "Małe złoże czarnej rudy",
        normal: "Złoże czarnej rudy",
        rich: "Bogate złoże czarnej rudy",
      },
    };

    var toastMsg = "",
      toastUntil = 0;

    function _root() {
      return document.getElementById("mine-game-root");
    }

    function _buildLobbyHTML() {
      var mLevel =
        (App.state.character && App.state.character.miningLevel) || 1;
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
      var shaftOk = mLevel >= 20;
      var bottomOk = mLevel >= 35;
      return (
        '<div class="mine-lobby">' +
        '<div class="mine-lobby-title">⛏ Kopalnia w Khorinis</div>' +
        skillLine +
        '<div class="mine-lobby-btns">' +
        '<div class="mine-lobby-entry">' +
        '<button class="btn btn-primary" onclick="App.mineGame._doEnter(\'main\')">⛏ Wejdź do głównej kopalni</button>' +
        '<div class="mine-lobby-desc">Ruda · Złoto · Siarka · Węgiel</div>' +
        "</div>" +
        '<div class="mine-lobby-entry">' +
        '<button class="btn btn-primary" ' +
        (shaftOk ? "" : "disabled") +
        " onclick=\"App.mineGame._doEnter('shaft')\">" +
        (shaftOk ? "⛏" : "🔒") +
        " Wejdź do bocznego szybu kopalni</button>" +
        '<div class="mine-lobby-desc' +
        (shaftOk ? "" : " mine-lobby-locked") +
        '">Siarka · Żelazo' +
        (shaftOk
          ? ""
          : " — wymagany poziom wydobycia 20 (masz: " + mLevel + ")") +
        "</div>" +
        "</div>" +
        '<div class="mine-lobby-entry">' +
        '<button class="btn btn-primary" ' +
        (bottomOk ? "" : "disabled") +
        " onclick=\"App.mineGame._doEnter('bottom')\">" +
        (bottomOk ? "⛏" : "🔒") +
        " Zejdź na dno kopalni</button>" +
        '<div class="mine-lobby-desc' +
        (bottomOk ? "" : " mine-lobby-locked") +
        '">Czarna ruda · Złoto' +
        (bottomOk
          ? ""
          : " — wymagany poziom wydobycia 35 (masz: " + mLevel + ")") +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>"
      );
    }

    function _buildAutoPanel() {
      var types = MINE_MATERIAL_TYPES[mineType] || [];
      var html = '<div class="mine-auto-target-btns">';
      types.forEach(function (t) {
        var isSel = targetMaterialType === t;
        var dis = autoActive ? " disabled" : "";
        html +=
          '<button class="btn mine-target-btn' +
          (isSel ? " mine-target-btn-active" : "") +
          '"' +
          dis +
          " onclick=\"App.mineGame.selectMaterial('" +
          t +
          "')\">" +
          (MATERIAL_BTN_LABELS[t] || t) +
          "</button>";
      });
      html += '</div><div class="mine-auto-actions">';
      if (!autoActive) {
        html +=
          '<button class="btn btn-primary mine-auto-start-btn"' +
          (targetMaterialType ? "" : " disabled") +
          ' onclick="App.mineGame.startAuto()">▶ Rozpocznij wydobycie</button>';
      } else {
        html +=
          '<button class="btn btn-danger mine-auto-start-btn" onclick="App.mineGame.stopAuto()">⏹ Zakończ wydobycie</button>';
      }
      html += "</div>";
      var statusMsg = "";
      if (!targetMaterialType) {
        statusMsg = "Wybierz złoże aby rozpocząć";
      } else if (!autoActive) {
        statusMsg =
          "Cel: <strong>" +
          (MATERIAL_NAMES_PL[targetMaterialType] || targetMaterialType) +
          "</strong> — kliknij Rozpocznij wydobycie";
      } else {
        var me = _me();
        if (me && me.miningVeinId) {
          statusMsg = '<strong style="color:#ffd700">⛏ Kopanie…</strong>';
        } else if (startMiningSent) {
          statusMsg = '<span style="color:#aad4ff">⛏ Zaczynam kopanie…</span>';
        } else {
          var tv =
            me && state
              ? _nearestVeinOfType(me.x, me.y, targetMaterialType)
              : null;
          statusMsg = tv
            ? '<span style="color:#aad4ff">→ Idę do złoża…</span>'
            : '<span style="color:#888">⏳ Czekam na pojawienie się złoża…</span>';
        }
      }
      html += '<div class="mine-auto-status">' + statusMsg + "</div>";
      return html;
    }

    function _buildGameHTML() {
      return (
        '<div class="mine-root">' +
        '<div class="mine-hud-bar"><span class="mine-hud-info" id="mine-hud-info"></span></div>' +
        '<div class="mine-canvas-wrap" id="mine-canvas-wrap"><canvas id="mine-canvas" width="800" height="500"></canvas><div class="mine-result-toast" id="mine-toast" style="opacity:0"></div></div>' +
        '<div class="mine-auto-panel" id="mine-auto-panel">' +
        _buildAutoPanel() +
        "</div>" +
        '<div class="mine-leave-bar"><button class="btn btn-secondary" onclick="App.leaveMine()">⬅ Opuść kopalnię</button></div>' +
        "</div>"
      );
    }

    function _updateAutoUI() {
      var panel = document.getElementById("mine-auto-panel");
      if (panel) panel.innerHTML = _buildAutoPanel();
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
        socket.emit("mine_request_sync");
        return;
      }
      root.innerHTML = _buildLobbyHTML();
    }

    function _doEnter(type) {
      var char = App.state.character;
      if (
        char &&
        char.activity &&
        char.activity.type &&
        char.activity.type !== "mining"
      ) {
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
          function () {
            _doEnterNow(type);
          },
        );
        return;
      }
      _doEnterNow(type);
    }

    function _doEnterNow(type) {
      mineType = type || "main";
      targetMaterialType = null;
      autoActive = false;
      startMiningSent = false;
      var root = _root();
      if (!root) return;
      socket = App.state.socket;
      if (!socket) return;
      root.innerHTML = _buildGameHTML();
      _attachCanvas();
      entered = true;
      App.state.inMine = true;
      socket.emit("mine_enter", { mineType: mineType });
      socket.on("mine_state", _onState);
      socket.on("mine_player_joined", _onPlayerJoined);
      socket.on("mine_player_left", _onPlayerLeft);
      socket.on("mine_players_moved", _onPlayersMoved);
      socket.on("mine_mining_started", _onMiningStarted);
      socket.on("mine_mining_cancelled", _onMiningCancelled);
      socket.on("mine_result", _onResult);
      socket.on("mine_vein_update", _onVeinUpdate);
      socket.on("mine_vein_spawned", _onVeinSpawned);
      socket.on("mine_error", _onMineError);
      socket.on("mine_skill_info", _onSkillInfo);
      socket.on("mine_restore_material", _onRestoreMaterial);
      socket.on("mine_offline_results", _onOfflineResults);
    }

    function _attachCanvas() {
      canvas = document.getElementById("mine-canvas");
      if (!canvas) return;
      ctx = canvas.getContext("2d");
      lastTickTime = performance.now();
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(_loop);
    }

    function pause() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      canvas = null;
      ctx = null;
    }

    function leave() {
      targetMaterialType = null;
      autoActive = false;
      startMiningSent = false;
      pause();
      if (entered && socket) {
        socket.emit("mine_leave");
        socket.off("mine_state", _onState);
        socket.off("mine_player_joined", _onPlayerJoined);
        socket.off("mine_player_left", _onPlayerLeft);
        socket.off("mine_players_moved", _onPlayersMoved);
        socket.off("mine_mining_started", _onMiningStarted);
        socket.off("mine_mining_cancelled", _onMiningCancelled);
        socket.off("mine_result", _onResult);
        socket.off("mine_vein_update", _onVeinUpdate);
        socket.off("mine_vein_spawned", _onVeinSpawned);
        socket.off("mine_error", _onMineError);
        socket.off("mine_skill_info", _onSkillInfo);
        socket.off("mine_restore_material", _onRestoreMaterial);
        socket.off("mine_offline_results", _onOfflineResults);
      }
      entered = false;
      state = null;
      App.state.inMine = false;
    }

    function _me() {
      if (!state || !socket) return null;
      return (
        state.players.find(function (p) {
          return p.socketId === socket.id;
        }) || null
      );
    }

    function _nearestVeinOfType(x, y, matType) {
      if (!state) return null;
      var best = null,
        bestD = Infinity;
      state.veins.forEach(function (v) {
        if (v.materialType !== matType) return;
        var d = Math.hypot(v.x - x, v.y - y);
        if (d < bestD) {
          bestD = d;
          best = v;
        }
      });
      return best;
    }

    function _loop(now) {
      rafId = requestAnimationFrame(_loop);
      if (!canvas || !ctx) return;
      var elapsed = now - lastTickTime;
      if (elapsed < 15) return;
      var dt = Math.min(elapsed / 1000, 0.1);
      lastTickTime = now;
      _tick(dt);
      _draw();
    }

    function _tick(dt) {
      if (!state || !socket) return;
      state.players.forEach(function (p) {
        if (p.socketId === socket.id || p.miningVeinId) return;
        if (p.targetX === undefined) {
          p.targetX = p.x;
          p.targetY = p.y;
        }
        var f = Math.min(1, 12 * dt);
        p.x += (p.targetX - p.x) * f;
        p.y += (p.targetY - p.y) * f;
      });
      var me = _me();
      if (!me || me.miningVeinId) return;
      if (!autoActive || !targetMaterialType || startMiningSent) return;
      var tv = _nearestVeinOfType(me.x, me.y, targetMaterialType);
      if (!tv) return;
      var vdx = tv.x - me.x,
        vdy = tv.y - me.y;
      var vdist = Math.hypot(vdx, vdy);
      if (vdist > 52) {
        _moveToward(me, vdx / vdist, vdy / vdist, dt);
      } else {
        socket.emit("mine_move", { x: me.x, y: me.y });
        socket.emit("mine_start_mining", { veinId: tv.id });
        startMiningSent = true;
      }
    }

    function _moveToward(me, dirX, dirY, dt) {
      me.x = Math.round(
        Math.max(8, Math.min(VIRT_W - 8, me.x + dirX * SPEED * dt)),
      );
      me.y = Math.round(
        Math.max(8, Math.min(VIRT_H - 8, me.y + dirY * SPEED * dt)),
      );
      var nowMs = performance.now();
      if (nowMs - lastMoveSent >= 33) {
        socket.emit("mine_move", { x: me.x, y: me.y });
        lastMoveSent = nowMs;
      }
    }

    function selectMaterial(type) {
      if (autoActive) return;
      var types = MINE_MATERIAL_TYPES[mineType] || [];
      if (types.indexOf(type) === -1) return;
      targetMaterialType = targetMaterialType === type ? null : type;
      _updateAutoUI();
    }

    function startAuto() {
      if (!targetMaterialType || autoActive) return;
      autoActive = true;
      startMiningSent = false;
      if (socket)
        socket.emit("mine_set_material", { materialType: targetMaterialType });
      _updateAutoUI();
    }

    function stopAuto() {
      autoActive = false;
      startMiningSent = false;
      if (socket) socket.emit("mine_cancel_mining");
      if (socket) socket.emit("mine_set_material", { materialType: null });
      _updateAutoUI();
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
      var targetVein =
        autoActive && targetMaterialType && me
          ? _nearestVeinOfType(me.x, me.y, targetMaterialType)
          : null;
      state.veins.forEach(function (v) {
        var matColors =
          VEIN_MATERIAL_COLORS[v.materialType] || VEIN_MATERIAL_COLORS.ore;
        var col = matColors[v.type] || matColors.normal;
        var matLabels = VEIN_LABELS[v.materialType] || VEIN_LABELS.ore;
        var isTarget =
          targetMaterialType && v.materialType === targetMaterialType;
        var isNextTarget = targetVein && v.id === targetVein.id;
        var dim = !!(targetMaterialType && !isTarget);
        ctx.save();
        ctx.globalAlpha = dim ? 0.28 : 1;
        ctx.shadowBlur = isNextTarget ? 30 : isTarget ? 16 : 8;
        ctx.shadowColor = col;
        ctx.beginPath();
        ctx.arc(v.x, v.y, VEIN_R, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = isNextTarget
          ? "#ffffff"
          : isTarget
            ? "#aad4ff"
            : "rgba(100,160,255,0.3)";
        ctx.lineWidth = isNextTarget ? 3 : isTarget ? 2 : 1;
        ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = dim ? 0.28 : 1;
        ctx.fillStyle = isTarget ? "#ddeeff" : "rgba(180,210,255,0.55)";
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
        ctx.restore();
      });
      if (me && me.miningVeinId && me.miningStartTime) {
        var mv = state.veins.find(function (vv) {
          return vv.id === me.miningVeinId;
        });
        if (mv) {
          var frac = Math.min(
            (nowTs - me.miningStartTime) / MINING_DURATION_MS,
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
      ctx.textAlign = "center";
      if (p.title) {
        ctx.font = "9px sans-serif";
        ctx.fillStyle = isMe ? "#c8a84b" : "rgba(200,168,75,0.7)";
        ctx.fillText("(" + p.title + ")", x, y - 32);
      }
      ctx.font = isMe ? "bold 10px sans-serif" : "10px sans-serif";
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

    function _onRestoreMaterial(data) {
      if (!data || !data.materialType) return;
      var validTypes = MINE_MATERIAL_TYPES[mineType] || [];
      if (validTypes.indexOf(data.materialType) === -1) return;
      targetMaterialType = data.materialType;
      autoActive = true;
      startMiningSent = false;
      _updateAutoUI();
    }
    function _onOfflineResults(data) {
      if (data && data.events && data.events.length)
        App.showOfflineSummary(data.events);
      if (data && data.inventory && App.state.character) {
        App.state.character.inventory = data.inventory;
        if (App.state.currentSection === "bag") App.renderBag();
      }
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
      VIRT_W = data.mapWidth || 800;
      VIRT_H = data.mapHeight || 500;
      _updateAutoUI();
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
      if (data.socketId === socket.id) return;
      var p = state.players.find(function (p) {
        return p.socketId === data.socketId;
      });
      if (p) {
        p.targetX = data.x;
        p.targetY = data.y;
        p.miningVeinId = data.miningVeinId;
        p.miningStartTime = data.miningStartTime;
      }
    }
    function _onPlayersMoved(batch) {
      if (!state) return;
      batch.forEach(function (d) {
        _onPlayerMoved(d);
      });
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
      if (socket && data.socketId === socket.id) {
        startMiningSent = false;
        _updateAutoUI();
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
      if (socket && data.socketId === socket.id) {
        startMiningSent = false;
        _updateAutoUI();
      }
    }
    function _onResult(data) {
      var me = _me();
      if (me) {
        me.miningVeinId = null;
        me.miningStartTime = null;
      }
      startMiningSent = false;
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
          iron: "żelaza",
          black_ore: "czarnej rudy",
        };
        _toast(
          "✓ Wydobyto bryłkę " +
            (MAT_NAMES[data.materialType] || "rudy") +
            "! +1 EXP",
        );
      } else if (!data.depleted && !data.veinGone) {
        _toast("✗ Nic nie znaleziono.");
      }
      if (data.depleted) _toast("⛏ Żyła wyczerpana!");
      _updateAutoUI();
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
      _updateAutoUI();
    }
    function _onPlayerTitleChanged(data) {
      if (!state) return;
      var p = state.players.find(function (p) {
        return p.socketId === data.socketId;
      });
      if (p) p.title = data.title;
    }
    function _onMineError(data) {
      startMiningSent = false;
      _toast("⚠ " + (data.error || "Błąd"));
    }
    function _onSkillInfo(data) {
      skillInfo = data;
      var char = App.state.character;
      if (char) {
        var prevMiningLevel = char.miningLevel || 1;
        char.miningLevel = data.miningLevel;
        char.miningXp = data.miningXp;
        if (data.miningLevel > prevMiningLevel) {
          App.state.titlesData = null;
          if (App.state.socket) App.state.socket.emit("titles_get");
        }
        if (App.state.currentSection === "bag") App.renderBag();
      }
      var hud = document.getElementById("mine-hud-info");
      if (hud && state) {
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
          txt +=
            ' &nbsp; <span style="color:#c8a84b">⛏ Mikstura Kopacza!</span>';
        hud.innerHTML = txt;
      }
    }
    function refreshSkillInfo() {
      var char = App.state.character;
      if (!char || !state) return;
      var mLevel = char.miningLevel || 1;
      var mXp = char.miningXp || 0;
      var potionActive = !!(
        char.activeEffects &&
        char.activeEffects.minerPotion &&
        char.activeEffects.minerPotion.expiresAt > Date.now()
      );
      var XP_TABLE = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14];
      var xpNeeded =
        mLevel >= 1 && mLevel <= 10
          ? XP_TABLE[mLevel]
          : Math.floor(14 * Math.pow(1.18, mLevel - 10));
      var chance =
        Math.round(
          (0.1 + (mLevel - 1) * 0.005 + (potionActive ? 0.1 : 0)) * 1000,
        ) / 10;
      _onSkillInfo({
        miningLevel: mLevel,
        miningXp: mXp,
        miningXpNeeded: xpNeeded,
        chance: chance,
        potionActive: potionActive,
      });
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
      socket.off("mine_players_moved", _onPlayersMoved);
      socket.off("mine_mining_started", _onMiningStarted);
      socket.off("mine_mining_cancelled", _onMiningCancelled);
      socket.off("mine_result", _onResult);
      socket.off("mine_vein_update", _onVeinUpdate);
      socket.off("mine_vein_spawned", _onVeinSpawned);
      socket.off("mine_error", _onMineError);
      socket.off("mine_skill_info", _onSkillInfo);
      socket.off("mine_restore_material", _onRestoreMaterial);
      socket.off("mine_offline_results", _onOfflineResults);
      entered = false;
      state = null;
      startMiningSent = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      canvas = null;
      ctx = null;
      _doEnterNow(mineType);
    }

    return {
      enter: enter,
      pause: pause,
      leave: leave,
      rejoin: rejoin,
      _doEnter: _doEnter,
      selectMaterial: selectMaterial,
      startAuto: startAuto,
      stopAuto: stopAuto,
      refreshSkillInfo: refreshSkillInfo,
      _onPlayerTitleChanged: _onPlayerTitleChanged,
    };
  })();
}
