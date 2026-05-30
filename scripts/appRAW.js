const App = (function () {
  const App = {};

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  }

  App.state = {
    character: null,
    gameData: null,
    selectedGuardHours: 1,
    currentSection: "hunt",
    socket: null,
    guardInterval: null,
    guardSectionInterval: null,
    rankInterval: null,
    uiInterval: null,
    farmPlots: null,
    farmFetchTime: null,
    selectedSeedPlotIndex: null,
    foragingLocalCycleStart: null,
    monsterDying: false,
    xardasLineIndex: 0,
    xardasTyping: false,
    xardasTimer: null,
    rankingData: [],
    rankingPage: 1,
    rankTab: "general",
    mineRankingData: [],
    mineRankingPage: 1,
    arenaRankingData: [],
    arenaRankingPage: 1,
    tavernMessages: [],
    tavernRanks: {},
    tavernChatAutoScroll: true,
    prisonData: [],
    prisonObservers: [],
    imprisoned: false,
    cachedGuardQuest: null,
    huntSwitchAllowedAt: null,
    huntSwitchTimer: null,
    huntSwitchCountdownInterval: null,
    inMine: false,
    craftingRecipes: [],
    craftTab: "materials",
    ticketUnread: false,
    respawnCountdownInterval: null,
    campTab: "members",
    campData: null,
    myCampId: null,
    monstrumData: null,
    _monstrumTimer: null,
    campMonsterBlink: false,
  };

  App.POTION_RECIPES = {
    mikstura_lowcy: {
      name: "Mikstura Łowcy",
      brewMs: 20 * 60 * 1000,
      recipe: { jagoda: 3, bagienne_ziele: 3, czarne_ziele: 3 },
      description:
        "Receptura zaginionego łowcy Gorutha z Mrocznego Lasu. Przez kilka minut każde uderzenie mieczem natychmiastowo pokonuje przeciwnika.",
      effectDurationMs: 10 * 60 * 1000,
      effectType: "hunterPotion",
    },
    mikstura_wartownika: {
      name: "Mikstura Wartownika",
      brewMs: 10 * 60 * 1000,
      recipe: { jagoda: 5, bagienne_ziele: 5 },
      description:
        "Sekret straży khoriniskiej przekazywany z ust do ust. Natychmiastowo przyznaje wynagrodzenie za cztery godziny warty.",
      effectDurationMs: null,
      effectType: "guardPotion",
    },
    mikstura_wzrostu: {
      name: "Mikstura Wzrostu",
      brewMs: 30 * 60 * 1000,
      recipe: { czarne_ziele: 3 },
      description:
        "Starożytna wiedza druidów z wyspy Irdorath, zapomniana przez wieki. Wszystkie zasiane zioła na działce natychmiast dojrzewają.",
      effectDurationMs: null,
      effectType: "growthPotion",
    },
    mikstura_kopacza: {
      name: "Mikstura Kopacza",
      brewMs: 15 * 60 * 1000,
      recipe: { jagoda: 1, bagienne_ziele: 1, czarne_ziele: 4 },
      description:
        "Stary sekret górników z Kopalni Khorinis. Przez 20 minut zwiększa szansę wydobycia każdej rudy o 10%.",
      effectDurationMs: 20 * 60 * 1000,
      effectType: "minerPotion",
    },
  };

  App.SEED_DEFINITIONS = {
    nasiona_jagod: {
      name: "Nasiona jagód",
      growthMs: 3600000,
      yieldName: "Jagoda",
      yieldItemId: "jagoda",
    },
    nasiona_bagiennego_ziela: {
      name: "Nasiona bagiennego ziela",
      growthMs: 10800000,
      yieldName: "Bagienne ziele",
      yieldItemId: "bagienne_ziele",
    },
    nasiona_czarnego_ziela: {
      name: "Nasiona czarnego ziela",
      growthMs: 18000000,
      yieldName: "Czarne ziele",
      yieldItemId: "czarne_ziele",
    },
  };

  App.CRAFT_NOSELL = new Set([
    "brylka_rudy",
    "brylka_zlota",
    "brylka_siarki",
    "brylka_wegla",
    "brylka_zelaza",
    "brylka_czarnej_rudy",
    "skora_owcy",
    "skora_wilka",
    "skora_kretoszczura",
    "skora_bestii",
    "podpalka",
    "spoiwo",
    "magiczny_klejnot",
    "element_bizuterii",
    "klamra",
    "garbowana_skora",
    "wzmacniana_skora",
    "twarda_skora",
    "pierscien_sily",
    "pierscien_potegi",
    "pierscien_wladzy",
    "amulet_giganta",
    "amulet_tytana",
    "amulet_niezlomnego",
    "pas_wedrowca",
    "pas_straznika",
    "pas_gladiatora",
  ]);

  App.MONSTER_GIF_MAP = {
    0: "/potwory/chrzaszcz.gif",
    1: "/potwory/owca.gif",
    2: "/potwory/wilk.gif",
    3: "/potwory/olbrzymi%20szczur.gif",
    4: "/potwory/goblin.gif",
    5: "/potwory/kretoszczur.gif",
    6: "/potwory/olbrzymi%20szczur.gif",
    7: "/potwory/polna%20bestia.gif",
    8: "/potwory/wilk.gif",
    9: "/potwory/krwiopijca.gif",
    10: "/potwory/%C5%9Bcierwojad.gif",
    11: "/potwory/topielec.gif",
    12: "/potwory/jaszczur.gif",
    13: "/potwory/pelzacz.gif",
    14: "/potwory/goblin.gif",
    15: "/potwory/czarny%20goblin.gif",
    16: "/potwory/warg.gif",
    17: "/potwory/harpia.gif",
    18: "/potwory/kamienny_golem.gif",
    19: "/potwory/z%C4%99bacz.gif",
    20: "/potwory/smoczy%20z%C4%99bacz.gif",
    21: "/potwory/ognisty%20jaszczur.gif",
    22: "/potwory/goblin%20szkielet.gif",
    23: "/potwory/szkielet.gif",
    24: "/potwory/szkielet_wojownik.gif",
    25: "/potwory/szkielet%20mag.gif",
    26: "/potwory/lodowy_golem.gif",
    27: "/potwory/waz%20blotny.gif",
    28: "/potwory/bagienny_golem.gif",
    30: "/potwory/jaszczuroczlek.gif",
    31: "/potwory/poszukiwacz.gif",
    32: "/potwory/pan_cienia.gif",
    33: "/potwory/cieniostwor.gif",
    34: "/potwory/szkielet_cieniostwora.gif",
    35: "/potwory/troll.gif",
    36: "/potwory/demon.gif",
    37: "/potwory/ork%20elita.gif",
    38: "/potwory/czarny_troll.gif",
    40: "/potwory/smok_bagienny.gif",
    41: "/potwory/smok_kamienny.gif",
    42: "/potwory/smok_lodowy.gif",
    43: "/potwory/smok_ognisty.gif",
    44: "/potwory/smok_ozywieniec.gif",
    29: "/potwory/ognisty_golem.gif",
    39: "/potwory/ksiaze_demonow.gif",
  };

  App.getGifMonsters = function () {
    return localStorage.getItem("mg_gif_monsters") === "1";
  };

  App.setGifMonsters = function (enabled) {
    localStorage.setItem("mg_gif_monsters", enabled ? "1" : "0");
    var cb = document.getElementById("toggle-gif-monsters");
    if (cb) cb.checked = !!enabled;
    App.renderMonsters();
    App.renderActivityDisplay();
    var token = localStorage.getItem("mg_token");
    if (token) {
      fetch("/api/game/log-pref", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ key: "gif_monsters", value: !!enabled }),
      }).catch(function () {});
    }
  };

  App.getChatLines = function () {
    var v = parseInt(localStorage.getItem("mg_chat_lines"), 10);
    return !isNaN(v) && v >= 5 && v <= 30 ? v : 9;
  };

  App.applyChatLines = function () {
    var chatEl = document.getElementById("tavern-chat-messages");
    if (!chatEl) return;
    var px = App.getChatLines() * 20 + "px";
    chatEl.style.height = px;
    chatEl.style.maxHeight = px;
  };

  App.setChatLines = function (n) {
    n = Math.max(5, Math.min(30, parseInt(n, 10) || 9));
    localStorage.setItem("mg_chat_lines", String(n));
    App.applyChatLines();
    var lbl = document.getElementById("chat-lines-label");
    if (lbl) lbl.textContent = n + " linii";
  };

  App.getMonsterImg = function (monsterId, forActivity) {
    var id = parseInt(monsterId) || 0;
    if (App.getGifMonsters() && App.MONSTER_GIF_MAP[id]) {
      var size = forActivity ? 90 : 80;
      var centeredIds = new Set([
        0, 1, 17, 18, 23, 24, 26, 28, 29, 30, 32, 34, 35, 36, 38, 39, 40, 41,
        42, 43, 44,
      ]);
      var centered = centeredIds.has(id) ? " monster-gif-center" : "";
      return (
        '<img src="' +
        App.MONSTER_GIF_MAP[id] +
        '" class="monster-gif' +
        centered +
        (forActivity ? " monster-gif-lg" : "") +
        '" width="' +
        size +
        '" height="' +
        size +
        '" alt="" loading="lazy">'
      );
    }
    return App.getMonsterSvg(monsterId);
  };

  App.xardasLines = [
    "Nareszcie. Myślałem, że już po tobie. Wygnanie Śniącego wyzwoliła niewyobrażalne siły. Zniszczenie Bariery było dopiero początkiem.",
    "Wszystkie istoty, które żyły w dolinie, zostały wezwane przez potężnego pana. Zgromadził on armię w głębi Górniczej Doliny. Armię ciemności... Smoków!",
    "Ruszaj, Khorinis Cię potrzebuje!",
  ];

  App.syncCharacter = async function () {
    const token = localStorage.getItem("mg_token");
    if (!token) return;
    try {
      const res = await fetch("/api/game/character", {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.character) {
          App.state.character = data.character;
          App.fixServerTimestamps(App.state.character);
          App.updateCharacterUI(App.state.character);
          if (App.state.currentSection === "bag") App.renderBag();
          if (App.state.currentSection === "shop") App.renderShop();
          if (App.state.currentSection === "hunt") App.renderMonsters();
        }
      }
    } catch (e) {}
  };

  App.fetchOnlineCount = async function () {
    try {
      const res = await fetch("/api/game/online");
      if (!res.ok) return;
      const data = await res.json();
      const count = data.count || 0;
      const authEl = document.getElementById("online-auth-count");
      if (authEl) authEl.textContent = count;
      const gameEl = document.getElementById("online-game-count");
      if (gameEl) gameEl.textContent = count + " osób online";
    } catch (e) {}
  };

  App.init = async function () {
    const token = localStorage.getItem("mg_token");
    await App.loadGameData();
    App.fetchOnlineCount();
    setInterval(App.fetchOnlineCount, 30000);
    if (token) {
      await App.loadCraftingRecipes();
      await App.fetchCharacter();
    } else {
      App.showScreen("auth-screen");
    }
    App.setupColorPickers();
    App.initKronika();
  };

  App.loadGameData = async function () {
    const res = await fetch("/api/game/data");
    if (res.ok) App.state.gameData = await res.json();
  };

  App.loadCraftingRecipes = async function () {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/crafting/recipes", {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.ok) App.state.craftingRecipes = await res.json();
    } catch (e) {}
  };

  App.showScreen = function (id) {
    [
      "loading-screen",
      "auth-screen",
      "char-create-screen",
      "xardas-screen",
      "game-screen",
    ].forEach((s) => {
      const el = document.getElementById(s);
      if (el) el.classList.add("hidden");
    });
    const target = document.getElementById(id);
    if (target) target.classList.remove("hidden");
  };

  App.switchAuthTab = function (tab) {
    document
      .getElementById("tab-login")
      .classList.toggle("active", tab === "login");
    document
      .getElementById("tab-register")
      .classList.toggle("active", tab === "register");
    const lf = document.getElementById("login-form");
    const rf = document.getElementById("register-form");
    if (lf) lf.classList.toggle("hidden", tab !== "login");
    if (rf) rf.classList.toggle("hidden", tab !== "register");
  };

  App.doLogin = async function () {
    const login = document.getElementById("login-user").value.trim();
    const password = document.getElementById("login-pass").value;
    const errEl = document.getElementById("login-error");
    errEl.textContent = "";
    errEl.classList.add("hidden");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        errEl.textContent = data.error || "Błąd logowania";
        errEl.classList.remove("hidden");
        return;
      }
      localStorage.setItem("mg_token", data.token);
      if (data.userId) localStorage.setItem("mg_userId", data.userId);
      await App.fetchCharacter();
    } catch (e) {
      errEl.textContent = "Błąd połączenia z serwerem";
      errEl.classList.remove("hidden");
    }
  };

  App.doRegister = async function () {
    const login = document.getElementById("reg-user").value.trim();
    const password = document.getElementById("reg-pass").value;
    const password2 = document.getElementById("reg-pass2").value;
    const errEl = document.getElementById("register-error");
    errEl.textContent = "";
    errEl.classList.add("hidden");
    if (password !== password2) {
      errEl.textContent = "Hasła się nie zgadzają";
      errEl.classList.remove("hidden");
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        errEl.textContent = data.error || "Błąd rejestracji";
        errEl.classList.remove("hidden");
        return;
      }
      localStorage.setItem("mg_token", data.token);
      if (data.userId) localStorage.setItem("mg_userId", data.userId);
      await App.fetchCharacter();
    } catch (e) {
      errEl.textContent = "Błąd połączenia z serwerem";
      errEl.classList.remove("hidden");
    }
  };

  App.logout = function () {
    localStorage.removeItem("mg_token");
    localStorage.removeItem("mg_userId");
    if (App.state.socket) App.state.socket.disconnect();
    if (App.state.guardInterval) clearInterval(App.state.guardInterval);
    if (App.state.guardSectionInterval)
      clearInterval(App.state.guardSectionInterval);
    if (App.state.rankInterval) clearInterval(App.state.rankInterval);
    if (App.state.uiInterval) clearInterval(App.state.uiInterval);
    if (App.state.brewCountdownInterval)
      clearInterval(App.state.brewCountdownInterval);
    window.location.reload();
  };

  App.fetchCharacter = async function () {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/character", {
        headers: { Authorization: "Bearer " + token },
      });
      if (res.status === 404) {
        App.showScreen("char-create-screen");
        return;
      }
      if (!res.ok) {
        localStorage.removeItem("mg_token");
        localStorage.removeItem("mg_userId");
        App.showScreen("auth-screen");
        return;
      }
      const data = await res.json();
      App.state.character = data.character || data;
      App.fixServerTimestamps(App.state.character);
      if (data.offlineEvents && data.offlineEvents.length > 0) {
        App.showOfflineSummary(data.offlineEvents);
      }
      if (!App.state.character.xardasShown) {
        App.showXardasDialog();
      } else {
        App.enterGame();
        if (App.state.character.imprisoned) {
          App.state.imprisoned = true;
          App.applyImprisonmentLockdown();
        }
      }
    } catch (e) {
      App.showScreen("auth-screen");
    }
  };

  App.createCharacter = async function () {
    const name = document.getElementById("char-name").value.trim();
    const hairColor = document.getElementById("color-hair").value;
    const shirtColor = document.getElementById("color-shirt").value;
    const pantsColor = document.getElementById("color-pants").value;
    const errEl = document.getElementById("char-create-error");
    errEl.textContent = "";
    errEl.classList.add("hidden");
    if (!name) {
      errEl.textContent = "Podaj imię postaci";
      errEl.classList.remove("hidden");
      return;
    }
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/character/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ name, hairColor, shirtColor, pantsColor }),
      });
      const data = await res.json();
      if (!res.ok) {
        errEl.textContent = data.error || "Błąd tworzenia postaci";
        errEl.classList.remove("hidden");
        return;
      }
      App.state.character = data.character || data;
      App.showXardasDialog();
    } catch (e) {
      errEl.textContent = "Błąd połączenia z serwerem";
      errEl.classList.remove("hidden");
    }
  };

  App.setupColorPickers = function () {
    const pairs = [
      ["color-hair", ["cp-hair"]],
      ["color-shirt", ["cp-shirt", "cp-arm1", "cp-arm2"]],
      ["color-pants", ["cp-pants", "cp-leg1", "cp-leg2"]],
    ];
    pairs.forEach(([pickId, svgIds]) => {
      const picker = document.getElementById(pickId);
      if (!picker) return;
      picker.addEventListener("input", function () {
        svgIds.forEach((sid) => {
          const el = document.getElementById(sid);
          if (el) el.setAttribute("fill", picker.value);
        });
      });
    });
  };

  App.showXardasDialog = function () {
    App.showScreen("xardas-screen");
    document.getElementById("xardas-screen").classList.remove("hidden");
    App.state.xardasLineIndex = 0;
    App.typeXardasLine(0);
  };

  App.typeXardasLine = function (index) {
    const textEl = document.getElementById("xardas-text");
    if (!textEl) return;
    const line = App.xardasLines[index];
    textEl.textContent = "";
    App.state.xardasTyping = true;
    let i = 0;
    if (App.state.xardasTimer) clearInterval(App.state.xardasTimer);
    App.state.xardasTimer = setInterval(function () {
      if (i < line.length) {
        textEl.textContent += line[i];
        i++;
      } else {
        clearInterval(App.state.xardasTimer);
        App.state.xardasTyping = false;
      }
    }, 30);
    const counter = document.getElementById("xardas-counter");
    if (counter)
      counter.textContent = index + 1 + " / " + App.xardasLines.length;
  };

  App.xardasNext = async function () {
    if (App.state.xardasTyping) {
      clearInterval(App.state.xardasTimer);
      App.state.xardasTyping = false;
      const textEl = document.getElementById("xardas-text");
      if (textEl)
        textEl.textContent = App.xardasLines[App.state.xardasLineIndex];
      return;
    }
    App.state.xardasLineIndex++;
    if (App.state.xardasLineIndex < App.xardasLines.length) {
      App.typeXardasLine(App.state.xardasLineIndex);
    } else {
      const token = localStorage.getItem("mg_token");
      try {
        await fetch("/api/game/xardas-done", {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
        });
        if (App.state.character) App.state.character.xardasShown = true;
      } catch (e) {}
      App.enterGame();
    }
  };

  App.enterGame = function () {
    App.showScreen("game-screen");
    App.loadCraftingRecipes();
    App._prefetchCampState();

    var _char = App.state.character;
    if (
      _char &&
      _char.activity &&
      _char.activity.type === "foraging" &&
      _char.activity.remainingMs !== undefined
    ) {
      App.state.foragingLocalCycleStart =
        Date.now() - (60000 - _char.activity.remainingMs);
    }
    App.updateCharacterUI(_char);
    App.connectSocket();
    App.music.init();
    App.showSection("hunt");
    if (App.state.rankInterval) clearInterval(App.state.rankInterval);
    App.state.rankInterval = setInterval(function () {
      if (App.state.currentSection === "rank") App.renderRanking(false);
    }, 15000);
    App.state.uiInterval = setInterval(function () {
      var char = App.state.character;
      if (!char) return;
      if (App.state.currentSection === "farm" && App.state.farmPlots) {
        App.renderFarmGrid();
      }
      if (char.activity && char.activity.type === "foraging") {
        var elapsed = App.state.foragingLocalCycleStart
          ? Date.now() - App.state.foragingLocalCycleStart
          : 0;
        var pct = Math.min(100, Math.round((elapsed / 60000) * 100));
        var remaining = Math.max(0, 60000 - elapsed);
        var actFill = document.querySelector(
          "#activity-display .foraging-progress-fill",
        );
        if (actFill) actFill.style.width = pct + "%";
        var actRem = document.querySelector(
          "#activity-display .foraging-remaining",
        );
        if (actRem) actRem.textContent = App.formatDuration(remaining);
        var cycFill = document.querySelector(
          "#foraging-container .foraging-cycle-fill",
        );
        if (cycFill) cycFill.style.width = pct + "%";
        var cycRem = document.querySelector(
          "#foraging-container .foraging-subtitle strong",
        );
        if (cycRem) cycRem.textContent = App.formatDuration(remaining);
      }
      if (
        char.activity &&
        char.activity.type === "brewing" &&
        char.activity.brewEndTime
      ) {
        var brewRemMs = Math.max(0, char.activity.brewEndTime - Date.now());
        var brewRec =
          App.POTION_RECIPES && App.POTION_RECIPES[char.activity.potionId];
        var brewTotal = brewRec ? brewRec.brewMs : 1;
        var brewPct = Math.min(
          100,
          Math.round((1 - brewRemMs / brewTotal) * 100),
        );
        var actBrewFill = document.querySelector(
          "#activity-display .brewing-fill",
        );
        if (actBrewFill) actBrewFill.style.width = brewPct + "%";
        var actBrewRem = document.querySelector(
          "#activity-display .brewing-remaining",
        );
        if (actBrewRem) actBrewRem.textContent = App.formatDuration(brewRemMs);
        if (App.state.currentSection === "alchemy") {
          var alcFill = document.getElementById("alchemy-brew-fill");
          if (alcFill) alcFill.style.width = brewPct + "%";
          var alcRem = document.getElementById("alchemy-brew-remaining");
          if (alcRem) alcRem.textContent = App.formatDuration(brewRemMs);
        }
      }
      if (App.state.currentSection === "quests") {
        var dqTimer = document.getElementById("dq-timer");
        if (dqTimer) {
          var dqRem = App.msUntilMidnight();
          if (dqRem <= 0) {
            App.renderQuests();
          } else {
            dqTimer.textContent = App.formatDuration(dqRem);
          }
        }
      }
      if (App.state.currentSection === "arena") {
        var arenaCdEl = document.getElementById("arena-cd-timer");
        if (arenaCdEl) {
          var as = App.state.character && App.state.character.arenaState;
          var cdRem =
            as && as.cooldownUntil
              ? Math.max(0, as.cooldownUntil - Date.now())
              : 0;
          if (cdRem <= 0) {
            App.renderArena();
          } else {
            arenaCdEl.textContent = App.formatDuration(cdRem);
          }
        }
        var arenaNextEl = document.getElementById("arena-next-timer");
        if (arenaNextEl) {
          var as2 = App.state.character && App.state.character.arenaState;
          var nextRem =
            as2 && as2.nextBattleAt
              ? Math.max(0, as2.nextBattleAt - Date.now())
              : 0;
          arenaNextEl.textContent =
            nextRem > 0 ? App.formatDuration(nextRem) : "Lada moment...";
        }
      }
      if (App.state.currentSection === "daily") {
        var drTimer = document.getElementById("dr-timer");
        if (drTimer) {
          var drRem = App.msUntilMidnight();
          if (drRem <= 0) {
            App.renderDailyReward();
          } else {
            drTimer.textContent = App.formatDuration(drRem);
          }
        }
      }
      if (char.activeEffects && char.activeEffects.hunterPotion) {
        var effRem = Math.max(
          0,
          char.activeEffects.hunterPotion.expiresAt - Date.now(),
        );
        var effTimerEl = document.getElementById("h-effect-timer");
        if (effTimerEl) effTimerEl.textContent = App.formatDuration(effRem);
        var effAlcEl = document.querySelector(".alchemy-active-effect strong");
        if (effAlcEl) effAlcEl.textContent = App.formatDuration(effRem);
        if (effRem <= 0) {
          var effPill = document.getElementById("h-effect-pill");
          if (effPill) effPill.style.display = "none";
        }
      }
      if (char.activeEffects && char.activeEffects.minerPotion) {
        var mEffRem = Math.max(
          0,
          char.activeEffects.minerPotion.expiresAt - Date.now(),
        );
        var mEffTimerEl = document.getElementById("m-effect-timer");
        if (mEffTimerEl) mEffTimerEl.textContent = App.formatDuration(mEffRem);
        if (mEffRem <= 0) {
          var mEffPill = document.getElementById("m-effect-pill");
          if (mEffPill) mEffPill.style.display = "none";
        }
      }
    }, 1000);
  };

  App.connectSocket = function () {
    const token = localStorage.getItem("mg_token");
    if (!token) return;
    if (window.io) {
      App.state.socket = io({ auth: { token } });
      App.state.socket.on("tick_update", App.onTickUpdate);
      App.state.socket.on("state_sync", App.onStateSync);
      App.state.socket.on("world_event", App.onWorldEvent);
      App.state.socket.on("world_history", App.onWorldHistory);
      App.state.socket.on("brew_complete", App.onBrewComplete);
      App.state.socket.on("effect_expired", App.onEffectExpired);
      App.state.socket.on("force_logout", function (data) {
        if (!data.silent)
          App.showNotification(
            data.reason || "Wylogowano — zalogowano na innym urządzeniu.",
            "error",
          );
        setTimeout(() => App.logout(), data.silent ? 0 : 1500);
      });
      App.state.socket.on("robbery_notification", function (data) {
        if (App.state.character)
          App.state.character.gold = Math.max(
            0,
            (App.state.character.gold || 0) - (data.gold || 1000),
          );
        App.updateCharacterUI(App.state.character);
        App.showNotification(
          "Zostałeś okradziony przez " +
            esc(data.robberName) +
            "! Straciłeś " +
            (data.gold || 1000) +
            " złota.",
          "error",
        );
      });
      App.state.socket.on("hunt_interrupted", function (data) {
        var char = App.state.character;
        if (char) char.activity = { type: null };
        App.state.respawnUntil = null;
        App.stopRespawnCountdown();
        App.renderActivityDisplay();
        App.renderMonsters();
        App.showNotification(
          data.reason || "Polowanie zostało przerwane.",
          "error",
        );
      });
      App.state.socket.on("connect_error", function (err) {
        console.warn("Socket error:", err.message);
      });
      var _firstConnect = true;
      App.state.socket.on("connect", function () {
        if (_firstConnect) {
          _firstConnect = false;
          return;
        }
        App.state.socket.emit("tavern_get_state");
        if (App.state.inMine) {
          App.mineGame.rejoin();
        }
        App._checkMonstrumBlink();
      });
      App.state.socket.on("admin_banner", function (data) {
        App.renderAdminBanner(data);
      });
      App.state.socket.on("force_reload", function () {
        location.reload();
      });
      App.state.socket.on("camp_update", function () {
        if (App.state.currentSection === "camp") {
          App.renderCamp();
        } else {
          App._prefetchCampState();
        }
      });
      App.state.socket.on("monstrum_update", function (data) {
        App.state.monstrumData = data;
        var myCampId = App.state.myCampId;
        if (
          myCampId &&
          data[myCampId] &&
          data[myCampId].state === "joining" &&
          App.state.currentSection !== "camp"
        ) {
          App.state.campMonsterBlink = true;
          var btn = document.getElementById("nav-camp");
          if (btn) btn.classList.add("ticket-unread");
        }
        if (
          App.state.currentSection === "camp" &&
          App.state.campTab === "monstrum"
        ) {
          App._refreshMonstrumTab();
        }
      });
      App.state.socket.on("monstrum_monster_appeared", function (data) {
        if (App.state.myCampId && App.state.myCampId === data.campId) {
          App.state.campMonsterBlink = true;
          var btn = document.getElementById("nav-camp");
          if (btn) btn.classList.add("ticket-unread");
        }
      });
      App.state.socket.on("monstrum_reward", function (data) {
        if (data.newGold !== undefined && App.state.character) {
          App.state.character.gold = data.newGold;
          App.state.character.exp = data.newExp;
          App.state.character.campReputation = data.newCampReputation;
          App.updateCharacterUI(App.state.character);
        }
        App._showMonstrumRewardPopup(data);
      });
      App.state.socket.on("tavern_state", App.onTavernState);
      App.state.socket.on("tavern_message", App.onTavernMessage);
      App.state.socket.on("tavern_message_deleted", App.onTavernMessageDeleted);
      App.state.socket.on("tavern_muted", App.onTavernMuted);
      App.state.socket.on("tavern_error", function (data) {
        if (data && data.error) App.showNotification(data.error, "error");
      });
      App.state.socket.on("titles_data", function (data) {
        App.state.titlesData = data;
        App.state._titleCooldownExpiry =
          Date.now() + (data.cooldownRemainingMs || 0);
        if (App.state.currentSection === "titles") App._renderTitlesUI();
      });
      App.state.socket.on("title_changed", function (data) {
        var char = App.state.character;
        if (char) char.equippedTitle = data.equippedTitle;
        App.state._titleCooldownExpiry =
          Date.now() + (data.cooldownMs || 60000);
        if (App.state.currentSection === "titles") App.renderTitles();
        var label = data.titleName ? "(" + data.titleName + ")" : "brak";
        App.showNotification("Tytuł zmieniony: " + label, "success");
      });
      App.state.socket.on("title_error", function (data) {
        if (data && data.error) App.showNotification(data.error, "error");
      });
      App.state.socket.on("mine_player_title_changed", function (data) {
        if (!App.mineGame) return;
        App.mineGame._onPlayerTitleChanged(data);
      });
      App.state.socket.on("prison_update", function (data) {
        App.state.prisonData = data.prisoners || [];
        if (App.state.imprisoned) {
          var myName = App.state.character && App.state.character.name;
          var stillIn = App.state.prisonData.some(function (p) {
            return p.charName === myName;
          });
          if (!stillIn) {
            location.reload();
            return;
          }
        }
        if (App.state.currentSection === "prison") App.renderPrisonGrid();
      });
      App.state.socket.on("prison_observers", function (data) {
        App.state.prisonObservers = data.observers || [];
        if (App.state.currentSection === "prison") App.renderPrisonObservers();
      });
      App.state.socket.on("prison_sentenced", function (data) {
        App.showNotification(
          "Zostałeś uwięziony! Twoje konto jest zablokowane.",
          "error",
        );
        App.state.imprisoned = true;
        App.applyImprisonmentLockdown();
      });
      App.state.socket.on("prison_released", function () {
        App.showNotification("Zostałeś zwolniony z więzienia!", "success");
        App.state.imprisoned = false;
        location.reload();
      });
      App.state.socket.on("arena_battle_result", App.onArenaBattleResult);
      App.state.socket.on("arena_finished", App.onArenaFinished);
      App.state.socket.on("ticket_update", App.onTicketUpdate);
      App.state.socket.on("name_updated", function (data) {
        if (App.state.character) {
          App.state.character.name = data.name;
          App.updateCharacterUI(App.state.character);
          if (App.state.currentSection === "options") App.renderOptions();
        }
      });
      App.state.socket.emit("tavern_get_state");
      App.initTavernChat();
    }
  };

  App.renderAdminBanner = function (data) {
    var el = document.getElementById("admin-banner");
    if (!el) return;
    if (data && data.message) {
      el.innerHTML =
        '<div class="admin-banner-inner"><span class="admin-banner-icon">📢</span><span class="admin-banner-text">' +
        esc(data.message) +
        "</span></div>";
      el.style.display = "block";
    } else {
      el.style.display = "none";
      el.innerHTML = "";
    }
  };

  App.onTickUpdate = function (data) {
    const char = App.state.character;
    if (!char) return;
    if (data.level !== undefined) char.level = data.level;
    if (data.exp !== undefined) char.exp = data.exp;
    if (data.expNeeded !== undefined) char.expNeeded = data.expNeeded;
    if (data.gold !== undefined) char.gold = data.gold;
    if (data.learningPoints !== undefined)
      char.learningPoints = data.learningPoints;
    if (data.questProgress !== undefined) {
      char.questProgress = data.questProgress;
      if (App.state.currentSection === "quests") App.updateQuestProgressUI();
    }
    if (data.dailyQuestUpdate && char.dailyQuest) {
      char.dailyQuest.progress = data.dailyQuestUpdate.progress;
      char.dailyQuest.completed = data.dailyQuestUpdate.completed;
      if (App.state.currentSection === "quests") App.updateDailyQuestUI();
    }
    if (
      char.activity &&
      char.activity.type === "hunting" &&
      data.currentMonsterHp !== undefined
    ) {
      char.activity.currentMonsterHp = data.currentMonsterHp;
    }
    if (
      char.activity &&
      char.activity.type === "hunting" &&
      data.loot &&
      data.loot.length
    ) {
      data.loot.forEach(function (itemId) {
        var ex = (char.inventory || []).find(function (x) {
          return x.itemId === itemId;
        });
        if (ex) ex.quantity++;
        else {
          char.inventory = char.inventory || [];
          char.inventory.push({ itemId: itemId, quantity: 1 });
        }
      });
      if (App.state.currentSection === "bag") App.renderBag();
      if (App.state.currentSection === "shop") App.renderShop();
      if (App.state.currentSection === "crafting") App.renderCrafting();
      if (App.state.currentSection === "alchemy") App.renderAlchemy();
    }
    App.updateCharacterUI(char);
    if (data.levelUps && data.levelUps > 0) {
      App.showNotification("Awans na poziom " + char.level + "!", "levelup");
      App.state.titlesData = null;
      if (App.state.socket) App.state.socket.emit("titles_get");
    }
    if (char.activity && char.activity.type === "hunting") {
      if (App.state.respawnUntil && App.state.respawnUntil <= Date.now()) {
        App.state.respawnUntil = null;
        App.renderActivityDisplay();
      }
      if (data.respawnWait) {
        var wasInRespawn = !!App.state.respawnUntil;
        App.state.respawnUntil = Date.now() + (data.respawnRemainingMs || 0);
        if (!wasInRespawn) App.renderActivityDisplay();
      } else if (data.kills && data.kills > 0) {
        App.state.respawnUntil = Date.now() + 6000;
        App.showDamageFloat(data.expGained || "");
        App.showMonsterDeath(function () {
          App.renderActivityDisplay();
        });
      } else {
        if (App.state.respawnUntil) {
          App.state.respawnUntil = null;
          App.renderActivityDisplay();
        } else {
          var hpFill = document.querySelector("#activity-display .hp-bar-fill");
          if (!hpFill) {
            App.renderActivityDisplay();
          } else {
            var huntMonster = App.getMonsterById(char.activity.monsterId);
            if (huntMonster) {
              var huntHpPct = Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    (char.activity.currentMonsterHp / huntMonster.hp) * 100,
                  ),
                ),
              );
              hpFill.style.width = huntHpPct + "%";
              var hpTxt = document.querySelector("#activity-display .hp-text");
              if (hpTxt)
                hpTxt.textContent =
                  char.activity.currentMonsterHp +
                  " / " +
                  huntMonster.hp +
                  " HP";
            }
            var monSprite = document.querySelector(
              "#activity-display .monster-info.monster-sprite",
            );
            if (monSprite) {
              monSprite.classList.add("hurt");
              setTimeout(function () {
                if (monSprite.parentNode) monSprite.classList.remove("hurt");
              }, 400);
            }
          }
        }
      }
    }
    if (data.activity !== undefined) {
      char.activity = data.activity;
      if (!data.activity || !data.activity.type) {
        if (App.state.guardInterval) clearInterval(App.state.guardInterval);
        if (App.state.guardSectionInterval)
          clearInterval(App.state.guardSectionInterval);
        App.renderGuardView();
        App.renderActivityDisplay();
      }
    }
    if (
      data.guardPaidHours !== undefined &&
      char.activity &&
      char.activity.type === "guard"
    ) {
      char.activity.paidHours = data.guardPaidHours;
      const earnedEl = document.getElementById("guard-earned");
      const _grBase = 10 + ((char.level || 1) - 1) * 2;
      const _gr = char.skills && char.skills.straznik ? _grBase * 2 : _grBase;
      if (earnedEl) earnedEl.textContent = data.guardPaidHours * _gr;
    }
    if (data.foragingCycleComplete) {
      App.state.foragingLocalCycleStart = Date.now();
      if (data.foragingDrop) {
        var existing = (char.inventory || []).find(function (x) {
          return x.itemId === data.foragingDrop;
        });
        if (existing) {
          existing.quantity++;
        } else {
          char.inventory = char.inventory || [];
          char.inventory.push({ itemId: data.foragingDrop, quantity: 1 });
        }
        var gd = App.state.gameData;
        var itemName =
          gd && gd.items && gd.items[data.foragingDrop]
            ? gd.items[data.foragingDrop].name
            : data.foragingDrop;
        App.showNotification("Znaleziono: " + itemName + "!", "success");
      }
      if (App.state.currentSection === "foraging") App.renderForagingView();
    }
    if (
      (data.questReady === true || data.guardQuestReady === true) &&
      App.state.currentSection === "quests"
    ) {
      App.renderQuests();
    }
    if (data.guardQuestProgress !== undefined && App.state.character) {
      App.state.character.guardQuestProgress = data.guardQuestProgress;
      if (App.state.currentSection === "quests")
        App.updateGuardQuestProgressUI();
    }
  };

  App.onStateSync = function (data) {
    const char = App.state.character;
    if (!char) return;
    if (data.level !== undefined) char.level = data.level;
    if (data.exp !== undefined) char.exp = data.exp;
    if (data.expNeeded !== undefined) char.expNeeded = data.expNeeded;
    if (data.gold !== undefined) char.gold = data.gold;
    if (data.damage !== undefined) char.damage = data.damage;
    if (data.defense !== undefined) char.defense = data.defense;
    if (data.activity !== undefined) {
      char.activity = data.activity;
      if (
        data.activity &&
        data.activity.type === "foraging" &&
        data.activity.remainingMs !== undefined
      ) {
        App.state.foragingLocalCycleStart =
          Date.now() - (60000 - data.activity.remainingMs);
      }
      if (
        data.activity &&
        data.activity.type === "hunting" &&
        data.activity.respawnUntil &&
        data.activity.respawnUntil > Date.now()
      ) {
        App.state.respawnUntil = data.activity.respawnUntil;
      } else {
        App.state.respawnUntil = null;
      }
      App.fixServerTimestamps(char);
    }
    if (data.lastHuntStartTime) {
      const allowedAt = data.lastHuntStartTime + 20000;
      App.state.huntSwitchAllowedAt = allowedAt;
      if (allowedAt > Date.now()) {
        if (App.state.huntSwitchTimer) clearTimeout(App.state.huntSwitchTimer);
        App.state.huntSwitchTimer = setTimeout(function () {
          App.state.huntSwitchTimer = null;
          if (App.state.huntSwitchCountdownInterval) {
            clearInterval(App.state.huntSwitchCountdownInterval);
            App.state.huntSwitchCountdownInterval = null;
          }
          if (App.state.currentSection === "hunt") App.renderMonsters();
        }, allowedAt - Date.now());
        if (App.state.huntSwitchCountdownInterval)
          clearInterval(App.state.huntSwitchCountdownInterval);
        App.state.huntSwitchCountdownInterval = setInterval(function () {
          if (App.state.currentSection === "hunt") App.renderMonsters();
        }, 1000);
      }
    }
    if (data.activeEffects !== undefined)
      char.activeEffects = data.activeEffects;
    if (data.questProgress !== undefined)
      char.questProgress = data.questProgress;
    if (data.miningLevel !== undefined) char.miningLevel = data.miningLevel;
    if (data.miningXp !== undefined) char.miningXp = data.miningXp;
    if (
      (data.miningLevel !== undefined || data.miningXp !== undefined) &&
      App.state.currentSection === "bag"
    )
      App.renderBag();
    if (data.inventory !== undefined) {
      char.inventory = data.inventory;
      if (App.state.currentSection === "bag") App.renderBag();
    }
    if (data.arenaState !== undefined) {
      const prevActive = char.arenaState && char.arenaState.active;
      char.arenaState = data.arenaState;
      if (
        data.arenaState &&
        data.arenaState.active &&
        data.arenaState.nextBattleAt
      ) {
        const serverNow = data.arenaState.serverNow || Date.now();
        const remaining = data.arenaState.nextBattleAt - serverNow;
        char.arenaState.nextBattleAt = Date.now() + Math.max(0, remaining);
      }
      if (App.state.currentSection === "arena") App.renderArena();
    }
    if (data.equippedTitle !== undefined)
      char.equippedTitle = data.equippedTitle;
    App.updateCharacterUI(char);
    if (data.offlineEvents && data.offlineEvents.length > 0)
      App.showOfflineSummary(data.offlineEvents);
    App.renderActivityDisplay();
    if (App.state.currentSection === "guard") App.renderGuardView();
    if (App.state.currentSection === "foraging") App.renderForagingView();
    if (App.state.currentSection === "alchemy") App.renderAlchemy();
  };

  App.onWorldEvent = function (ev) {
    App.addFeedEvent(ev);
  };

  App.onWorldHistory = function (events) {
    const feed = document.getElementById("world-feed-body");
    if (!feed) return;
    feed.innerHTML = "";
    (events || [])
      .slice()
      .reverse()
      .forEach((ev) => App.addFeedEvent(ev));
  };

  App.updateCharacterUI = function (char) {
    if (!char) return;
    const setT = (id, val) => {
      const e = document.getElementById(id);
      if (e) e.textContent = val;
    };
    setT("h-level", char.level || 1);
    setT("h-gold", char.gold || 0);
    setT("h-charname", char.name || "");
    setT("mini-name", char.name || "");
    const expCur = char.exp || 0;
    const expNext = char.expNeeded || char.expToNext || 10;
    setT("h-exp", expCur);
    setT("h-expn", expNext);
    setT("h-lp", char.learningPoints !== undefined ? char.learningPoints : 0);
    const pct = Math.min(100, Math.round((expCur / expNext) * 100));
    const miniBar = document.getElementById("mini-exp-bar");
    if (miniBar) miniBar.style.width = pct + "%";
    const miniPct = document.getElementById("mini-exp-pct");
    if (miniPct) miniPct.textContent = pct + "%";
    const miniNext = document.getElementById("mini-lvl-next");
    if (miniNext) miniNext.textContent = (char.level || 1) + 1;
    const activity = char.activity || {};
    const pill = document.getElementById("h-activity-pill");
    const actIcon = document.getElementById("h-act-icon");
    const actText = document.getElementById("h-act-text");
    if (pill) {
      if (activity.type === "hunting") {
        pill.style.display = "";
        if (actIcon) actIcon.textContent = "⚔";
        if (actText) actText.textContent = "Polowanie";
      } else if (activity.type === "guard") {
        pill.style.display = "";
        if (actIcon) actIcon.textContent = "🛡";
        if (actText) actText.textContent = "Warta";
      } else if (activity.type === "foraging") {
        pill.style.display = "";
        if (actIcon) actIcon.textContent = "🍃";
        if (actText) actText.textContent = "Zbieractwo";
      } else if (activity.type === "brewing") {
        pill.style.display = "";
        if (actIcon) actIcon.textContent = "⚗";
        if (actText) actText.textContent = "Warzenie";
      } else {
        pill.style.display = "none";
      }
    }
    const effectPill = document.getElementById("h-effect-pill");
    if (effectPill) {
      const hp = char.activeEffects && char.activeEffects.hunterPotion;
      if (hp && hp.expiresAt > Date.now()) {
        effectPill.style.display = "";
        const rem = Math.max(0, hp.expiresAt - Date.now());
        const timerEl = document.getElementById("h-effect-timer");
        if (timerEl) timerEl.textContent = App.formatDuration(rem);
      } else {
        effectPill.style.display = "none";
      }
    }
    const mEffectPill = document.getElementById("m-effect-pill");
    if (mEffectPill) {
      const mep = char.activeEffects && char.activeEffects.minerPotion;
      if (mep && mep.expiresAt > Date.now()) {
        mEffectPill.style.display = "";
        const mRem = Math.max(0, mep.expiresAt - Date.now());
        const mTimerEl = document.getElementById("m-effect-timer");
        if (mTimerEl) mTimerEl.textContent = App.formatDuration(mRem);
      } else {
        mEffectPill.style.display = "none";
      }
    }
    App.updateMiniSvg(char);
  };

  App.updateMiniSvg = function (char) {
    const hair = char.hairColor || "#4a3728";
    const shirt = char.shirtColor || "#8b4513";
    const pants = char.pantsColor || "#2f4f2f";
    const ids = {
      "mc-hair": hair,
      "mc-shirt": shirt,
      "mc-arm1": shirt,
      "mc-arm2": shirt,
      "mc-pants": pants,
      "mc-leg1": pants,
      "mc-leg2": pants,
    };
    Object.entries(ids).forEach(([id, color]) => {
      const el = document.getElementById(id);
      if (el) el.setAttribute("fill", color);
    });
  };

  App.showSection = function (name) {
    if (App.state.currentSection === "prison" && name !== "prison") {
      if (App.state.socket) App.state.socket.emit("prison_leave");
    }
    if (App.state.currentSection === "mine" && name !== "mine") {
      App.mineGame.pause();
    }
    App.state.currentSection = name;
    [
      "hunt",
      "guard",
      "quests",
      "shop",
      "hazard",
      "daily",
      "farm",
      "foraging",
      "mine",
      "crafting",
      "alchemy",
      "bag",
      "rank",
      "titles",
      "options",
      "prison",
      "arena",
      "tickets",
      "skills",
      "thieves",
      "camp",
    ].forEach((s) => {
      const sec = document.getElementById("section-" + s);
      if (sec) sec.classList.toggle("hidden", s !== name);
      const btn = document.getElementById("nav-" + s);
      if (btn) btn.classList.toggle("active", s === name);
    });
    if (name === "hunt") {
      App.renderMonsters();
      App.renderActivityDisplay();
    }
    if (name === "guard") App.renderGuardView();
    if (name === "quests") App.renderQuests();
    if (name === "shop") App.renderShop();
    if (name === "farm") App.renderFarm();
    if (name === "foraging") App.renderForagingView();
    if (name === "mine") {
      App.mineGame.enter();
      App.renderMineLootBtn();
    }
    if (name === "crafting") App.renderCrafting();
    if (name === "alchemy") App.renderAlchemy();
    if (name === "bag") App.renderBag();
    if (name === "rank") App.renderRanking(true);
    if (name === "titles") App.renderTitles();
    if (name === "daily") App.renderDailyReward();
    if (name === "options") App.renderOptions();
    if (name === "prison") App.renderPrison();
    if (name === "arena") App.renderArena();
    if (name === "tickets") App.renderTickets();
    if (name === "skills") App.renderSkills();
    if (name === "thieves") App.renderThievesGuild();
    if (name === "hazard") App.renderHazard();
    if (name === "camp") {
      App.renderCamp();
      App.state.campMonsterBlink = false;
      var campBtn = document.getElementById("nav-camp");
      if (campBtn) campBtn.classList.remove("ticket-unread");
    }
    if (name !== "camp" && App.state._monstrumTimer) {
      clearInterval(App.state._monstrumTimer);
      App.state._monstrumTimer = null;
    }
  };

  App.leaveMine = function () {
    App.mineGame.leave();
    App.mineGame.enter();
  };

  App.renderActivityDisplay = function () {
    const div = document.getElementById("activity-display");
    if (!div) return;
    const char = App.state.character;
    if (!char) return;
    const activity = char.activity || {};
    if (activity.type === "hunting") {
      if (App.state.respawnUntil && App.state.respawnUntil > Date.now()) {
        div.innerHTML =
          '<div class="activity-scene">' +
          '<div style="text-align:center" class="char-sprite attacking">' +
          App.getCharSvg(char) +
          '<div style="font-size:0.8rem;color:var(--text2);margin-top:4px">' +
          esc(char.name || "Bohater") +
          "</div></div>" +
          '<div class="vs-text">VS</div>' +
          '<div class="respawn-wait-screen">' +
          '<div class="respawn-skull">&#128128;</div>' +
          '<div class="respawn-title">Wypatruję kolejnej bestii...</div>' +
          '<div class="respawn-timer" id="respawn-countdown"></div>' +
          "</div>" +
          "</div>";
        App.startRespawnCountdown();
        return;
      }
      App.stopRespawnCountdown();
      const monster = App.getMonsterById(activity.monsterId);
      const monsterName = monster ? monster.name : "Potwór";
      const monsterHp =
        activity.currentMonsterHp !== undefined
          ? activity.currentMonsterHp
          : monster
            ? monster.hp
            : 100;
      const monsterMaxHp = monster ? monster.hp : 100;
      const hpPct = Math.max(
        0,
        Math.min(100, Math.round((monsterHp / monsterMaxHp) * 100)),
      );
      div.innerHTML =
        '<div class="activity-scene">' +
        '<div style="text-align:center" class="char-sprite attacking">' +
        App.getCharSvg(char) +
        '<div style="font-size:0.8rem;color:var(--text2);margin-top:4px">' +
        esc(char.name || "Bohater") +
        "</div></div>" +
        '<div class="vs-text">VS</div>' +
        '<div class="monster-info monster-sprite">' +
        App.getMonsterImg(activity.monsterId || 0, true) +
        '<div class="monster-name">' +
        monsterName +
        "</div>" +
        '<div class="hp-bar-wrap"><div class="hp-bar"><div class="hp-bar-fill" style="width:' +
        hpPct +
        '%"></div></div>' +
        '<div class="hp-text">' +
        monsterHp +
        " / " +
        monsterMaxHp +
        " HP</div></div>" +
        "</div>" +
        "</div>";
    } else if (activity.type === "guard") {
      const endTime = activity.guardEndTime
        ? new Date(activity.guardEndTime).getTime()
        : 0;
      const now = Date.now();
      const secsLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      const h = Math.floor(secsLeft / 3600);
      const m = Math.floor((secsLeft % 3600) / 60);
      const s = secsLeft % 60;
      const pad = (n) => String(n).padStart(2, "0");
      div.innerHTML =
        '<div class="guard-scene char-sprite guarding">' +
        '<div class="guard-title">Na warcie w Khorinis</div>' +
        '<div class="guard-time" id="guard-countdown">' +
        pad(h) +
        ":" +
        pad(m) +
        ":" +
        pad(s) +
        "</div>" +
        '<div class="guard-sub">Pozostały czas warty</div>' +
        "</div>";
      App.startGuardCountdown(endTime);
    } else if (activity.type === "foraging") {
      var elapsed = App.state.foragingLocalCycleStart
        ? Date.now() - App.state.foragingLocalCycleStart
        : 0;
      var pct = Math.min(100, Math.round((elapsed / 60000) * 100));
      var remaining = Math.max(0, 60000 - elapsed);
      div.innerHTML =
        '<div class="guard-scene char-sprite guarding">' +
        '<div class="guard-title">🍃 Zbierasz w lasach Khorinis</div>' +
        '<div class="foraging-progress-bar"><div class="foraging-progress-fill" style="width:' +
        pct +
        '%"></div></div>' +
        '<div class="guard-sub">Następne znalezisko za: <span class="foraging-remaining">' +
        App.formatDuration(remaining) +
        "</span></div>" +
        "</div>";
    } else if (activity.type === "brewing") {
      var brewRecipe = App.POTION_RECIPES[activity.potionId];
      var brewMs = brewRecipe ? brewRecipe.brewMs : 1;
      var brewRemaining = Math.max(0, (activity.brewEndTime || 0) - Date.now());
      var brewPct = Math.min(
        100,
        Math.round((1 - brewRemaining / brewMs) * 100),
      );
      div.innerHTML =
        '<div class="guard-scene char-sprite guarding">' +
        '<div class="guard-title">⚗ Warzysz: ' +
        esc(brewRecipe ? brewRecipe.name : activity.potionId) +
        "</div>" +
        '<div class="alchemy-progress-bar" style="max-width:220px;margin:0 auto 8px"><div class="alchemy-progress-fill brewing-fill" style="width:' +
        brewPct +
        '%"></div></div>' +
        '<div class="guard-sub">Gotowe za: <span class="brewing-remaining">' +
        App.formatDuration(brewRemaining) +
        "</span></div>" +
        "</div>";
    } else if (activity.type === "mining") {
      var mineDispNames = {
        main: "głównej kopalni Khorinis",
        shaft: "bocznego szybu kopalni",
        bottom: "dna kopalni",
      };
      var mineDisp = mineDispNames[activity.mineType] || "kopalni Khorinis";
      div.innerHTML =
        '<div class="guard-scene char-sprite guarding">' +
        '<div class="guard-title">⛏ Wydobywasz w ' +
        mineDisp +
        "</div>" +
        '<div class="guard-sub">Wydobycie działa w tle. Możesz zamknąć przeglądarkę.</div>' +
        "</div>";
    } else {
      div.innerHTML =
        '<div class="activity-idle-text">Twoja postać odpoczywa w Khorinis.</div>';
    }
  };

  App.startRespawnCountdown = function () {
    App.stopRespawnCountdown();
    App.state.respawnCountdownInterval = setInterval(function () {
      var el = document.getElementById("respawn-countdown");
      if (!el) {
        App.stopRespawnCountdown();
        return;
      }
      var remaining = App.state.respawnUntil
        ? Math.max(0, App.state.respawnUntil - Date.now())
        : 0;
      el.textContent = (remaining / 1000).toFixed(1) + "s";
    }, 100);
  };

  App.stopRespawnCountdown = function () {
    if (App.state.respawnCountdownInterval) {
      clearInterval(App.state.respawnCountdownInterval);
      App.state.respawnCountdownInterval = null;
    }
  };

  App.startGuardCountdown = function (endTime) {
    if (App.state.guardInterval) clearInterval(App.state.guardInterval);
    App.state.guardInterval = setInterval(function () {
      const el = document.getElementById("guard-countdown");
      if (!el) {
        clearInterval(App.state.guardInterval);
        return;
      }
      const secsLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      const h = Math.floor(secsLeft / 3600);
      const m = Math.floor((secsLeft % 3600) / 60);
      const s = secsLeft % 60;
      const pad = (n) => String(n).padStart(2, "0");
      el.textContent = pad(h) + ":" + pad(m) + ":" + pad(s);
      if (secsLeft === 0) clearInterval(App.state.guardInterval);
    }, 1000);
  };

  App.showDamageFloat = function (dmg) {
    const scene = document.querySelector(".activity-scene");
    if (!scene) return;
    const el = document.createElement("div");
    el.className = "damage-float";
    el.textContent = dmg ? "-" + dmg : "HIT";
    el.style.left = 40 + Math.random() * 30 + "%";
    el.style.top = "20px";
    scene.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  };

  App.showMonsterDeath = function (callback) {
    if (App.state.monsterDying) {
      if (callback) callback();
      return;
    }
    var el = document.querySelector(".monster-info.monster-sprite");
    if (!el) {
      if (callback) callback();
      return;
    }
    App.state.monsterDying = true;
    var skull = document.createElement("div");
    skull.className = "monster-death-skull";
    skull.textContent = "💀";
    el.appendChild(skull);
    setTimeout(function () {
      App.state.monsterDying = false;
      if (callback) callback();
    }, 560);
  };

  App.getCharSvg = function (char) {
    const hair = char.hairColor || "#4a3728";
    const shirt = char.shirtColor || "#8b4513";
    const pants = char.pantsColor || "#2f4f2f";
    return (
      '<svg viewBox="0 0 40 80" width="60" height="80" xmlns="http://www.w3.org/2000/svg">' +
      '<rect x="13" y="2" width="14" height="14" rx="3" fill="' +
      hair +
      '"/>' +
      '<rect x="14" y="4" width="12" height="10" rx="2" fill="#f5c89a"/>' +
      '<rect x="11" y="16" width="18" height="20" rx="2" fill="' +
      shirt +
      '"/>' +
      '<rect x="5" y="16" width="7" height="16" rx="2" fill="' +
      shirt +
      '"/>' +
      '<rect x="28" y="16" width="7" height="16" rx="2" fill="' +
      shirt +
      '"/>' +
      '<rect x="12" y="36" width="7" height="20" rx="2" fill="' +
      pants +
      '"/>' +
      '<rect x="21" y="36" width="7" height="20" rx="2" fill="' +
      pants +
      '"/>' +
      '<rect x="11" y="54" width="8" height="6" rx="1" fill="#3a2a1a"/>' +
      '<rect x="21" y="54" width="8" height="6" rx="1" fill="#3a2a1a"/>' +
      "</svg>"
    );
  };

  App.getMonsterSvg = function (monsterId) {
    const id = parseInt(monsterId) || 0;
    if (id <= 1) {
      return (
        '<svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">' +
        '<ellipse cx="40" cy="50" rx="20" ry="14" fill="#c8b87a"/>' +
        '<circle cx="40" cy="34" r="10" fill="#c8b87a"/>' +
        '<rect x="30" y="24" width="4" height="8" rx="1" fill="#c8b87a"/>' +
        '<rect x="46" y="24" width="4" height="8" rx="1" fill="#c8b87a"/>' +
        '<circle cx="36" cy="32" r="2" fill="#000"/>' +
        '<circle cx="44" cy="32" r="2" fill="#000"/>' +
        '<rect x="28" y="58" width="6" height="10" rx="1" fill="#a89060"/>' +
        '<rect x="38" y="60" width="6" height="8" rx="1" fill="#a89060"/>' +
        '<rect x="46" y="58" width="6" height="10" rx="1" fill="#a89060"/>' +
        "</svg>"
      );
    } else if (id <= 8) {
      return (
        '<svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">' +
        '<ellipse cx="40" cy="52" rx="22" ry="14" fill="#7a6a4a"/>' +
        '<ellipse cx="22" cy="44" rx="12" ry="9" fill="#7a6a4a"/>' +
        '<circle cx="16" cy="40" r="5" fill="#7a6a4a"/>' +
        '<circle cx="13" cy="38" r="2" fill="#000"/>' +
        '<polygon points="10,34 14,28 18,34" fill="#7a6a4a"/>' +
        '<rect x="28" y="62" width="6" height="10" rx="1" fill="#5a4a2a"/>' +
        '<rect x="38" y="62" width="6" height="10" rx="1" fill="#5a4a2a"/>' +
        '<rect x="46" y="62" width="6" height="10" rx="1" fill="#5a4a2a"/>' +
        '<polygon points="58,46 72,40 68,52" fill="#7a6a4a"/>' +
        "</svg>"
      );
    } else if (id <= 14) {
      return (
        '<svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">' +
        '<ellipse cx="40" cy="50" rx="18" ry="14" fill="#5a4a6a"/>' +
        '<circle cx="40" cy="34" r="11" fill="#5a4a6a"/>' +
        '<polygon points="20,36 2,24 18,40" fill="#5a4a6a"/>' +
        '<polygon points="60,36 78,24 62,40" fill="#5a4a6a"/>' +
        '<circle cx="35" cy="32" r="2" fill="#ffcc00"/>' +
        '<circle cx="45" cy="32" r="2" fill="#ffcc00"/>' +
        '<rect x="32" y="56" width="6" height="14" rx="1" fill="#3a2a4a"/>' +
        '<rect x="42" y="56" width="6" height="14" rx="1" fill="#3a2a4a"/>' +
        "</svg>"
      );
    } else if (id <= 22) {
      return (
        '<svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">' +
        '<rect x="26" y="34" width="28" height="24" rx="3" fill="#6a8a4a"/>' +
        '<circle cx="40" cy="26" r="12" fill="#6a8a4a"/>' +
        '<polygon points="30,18 26,8 34,16" fill="#6a8a4a"/>' +
        '<polygon points="50,18 54,8 46,16" fill="#6a8a4a"/>' +
        '<circle cx="35" cy="24" r="2" fill="#cc0000"/>' +
        '<circle cx="45" cy="24" r="2" fill="#cc0000"/>' +
        '<rect x="30" y="58" width="8" height="12" rx="1" fill="#4a6a2a"/>' +
        '<rect x="42" y="58" width="8" height="12" rx="1" fill="#4a6a2a"/>' +
        '<rect x="18" y="36" width="10" height="6" rx="1" fill="#6a8a4a"/>' +
        '<rect x="52" y="36" width="10" height="6" rx="1" fill="#6a8a4a"/>' +
        "</svg>"
      );
    } else if (id <= 34) {
      return (
        '<svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">' +
        '<rect x="28" y="36" width="24" height="22" fill="#d4d4c8"/>' +
        '<circle cx="40" cy="28" r="12" fill="#d4d4c8"/>' +
        '<circle cx="34" cy="26" r="3" fill="#000"/>' +
        '<circle cx="46" cy="26" r="3" fill="#000"/>' +
        '<rect x="34" y="34" width="12" height="3" fill="#000"/>' +
        '<rect x="28" y="58" width="8" height="14" fill="#d4d4c8"/>' +
        '<rect x="44" y="58" width="8" height="14" fill="#d4d4c8"/>' +
        '<rect x="16" y="38" width="14" height="6" fill="#d4d4c8"/>' +
        '<rect x="50" y="38" width="14" height="6" fill="#d4d4c8"/>' +
        '<rect x="36" y="14" width="8" height="4" fill="#d4d4c8"/>' +
        "</svg>"
      );
    } else if (id <= 39) {
      return (
        '<svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">' +
        '<rect x="20" y="30" width="40" height="30" rx="4" fill="#8a2020"/>' +
        '<circle cx="40" cy="22" r="14" fill="#8a2020"/>' +
        '<polygon points="28,12 22,2 34,10" fill="#8a2020"/>' +
        '<polygon points="52,12 58,2 46,10" fill="#8a2020"/>' +
        '<circle cx="34" cy="20" r="3" fill="#ffaa00"/>' +
        '<circle cx="46" cy="20" r="3" fill="#ffaa00"/>' +
        '<rect x="24" y="60" width="10" height="14" rx="2" fill="#6a1010"/>' +
        '<rect x="46" y="60" width="10" height="14" rx="2" fill="#6a1010"/>' +
        '<rect x="8" y="34" width="14" height="10" rx="2" fill="#8a2020"/>' +
        '<rect x="58" y="34" width="14" height="10" rx="2" fill="#8a2020"/>' +
        "</svg>"
      );
    } else {
      return (
        '<svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg">' +
        '<ellipse cx="40" cy="54" rx="28" ry="18" fill="#4a6a2a"/>' +
        '<ellipse cx="40" cy="36" rx="18" ry="14" fill="#4a6a2a"/>' +
        '<circle cx="40" cy="22" r="12" fill="#4a6a2a"/>' +
        '<polygon points="10,30 0,10 22,28" fill="#4a6a2a"/>' +
        '<polygon points="70,30 80,10 58,28" fill="#4a6a2a"/>' +
        '<polygon points="30,14 28,2 38,12" fill="#4a6a2a"/>' +
        '<polygon points="50,14 52,2 42,12" fill="#4a6a2a"/>' +
        '<circle cx="34" cy="20" r="3" fill="#ff4400"/>' +
        '<circle cx="46" cy="20" r="3" fill="#ff4400"/>' +
        '<ellipse cx="40" cy="26" rx="8" ry="3" fill="#2a4a10"/>' +
        "</svg>"
      );
    }
  };

  App.getMonsterById = function (id) {
    if (!App.state.gameData || !App.state.gameData.monsters) return null;
    return App.state.gameData.monsters.find((m) => m.id === id) || null;
  };

  App.renderMonsters = function () {
    const grid = document.getElementById("monsters-grid");
    if (!grid) return;
    if (!App.state.gameData || !App.state.gameData.monsters) {
      grid.innerHTML = '<div class="no-data">Ładowanie danych...</div>';
      return;
    }
    const char = App.state.character;
    const monsters = App.state.gameData.monsters;
    grid.innerHTML = "";
    const switchCooldownMs = App.state.huntSwitchAllowedAt
      ? App.state.huntSwitchAllowedAt - Date.now()
      : 0;
    const switchLocked = switchCooldownMs > 0;
    monsters.forEach((m) => {
      const locked = char.level < (m.levelReq || 1);
      const defLocked = (char.defense || 0) < (m.defenseReq || 0);
      const isActive =
        char.activity &&
        char.activity.type === "hunting" &&
        char.activity.monsterId === m.id;
      const cooldownLocked = switchLocked && !isActive && !locked && !defLocked;
      const card = document.createElement("div");
      card.className =
        "monster-card" +
        (locked || defLocked ? " locked" : "") +
        (isActive ? " active-hunt" : "") +
        (cooldownLocked ? " hunt-cooldown-lock" : "");
      let lockBadge = "";
      if (locked)
        lockBadge =
          '<div class="mon-lock">Poz. ' + (m.levelReq || 1) + "</div>";
      else if (defLocked)
        lockBadge =
          '<div class="mon-lock">Obr. ' + (m.defenseReq || 0) + "</div>";
      else if (cooldownLocked)
        lockBadge =
          '<div class="mon-lock hunt-cooldown-badge">Do zmiany zostało: ' +
          Math.ceil(switchCooldownMs / 1000) +
          "</div>";
      let dropRangeBadge = "";
      if (m.drops && m.drops.length > 0) {
        const chances = m.drops.map((d) => Math.round(d.chance * 100));
        const minC = Math.min(...chances);
        const maxC = Math.max(...chances);
        const rangeStr = minC === maxC ? minC + "%" : minC + "-" + maxC + "%";
        dropRangeBadge =
          '<span class="mon-stat">Szansa na materiały <span>' +
          rangeStr +
          "</span></span>";
        const gd = App.state.gameData;
        const dropItems = gd ? gd.items || {} : {};
        m.drops.forEach(function (d) {
          const dName = dropItems[d.itemId]
            ? dropItems[d.itemId].name
            : d.itemId;
          dropRangeBadge +=
            '<span class="mon-stat"><span>' + dName + "</span></span>";
        });
      }
      card.innerHTML =
        App.getMonsterImg(m.id, false) +
        '<div class="mon-name">' +
        m.name +
        "</div>" +
        '<div class="mon-stats">' +
        '<span class="mon-stat exp-stat">EXP: <span>' +
        m.exp +
        "</span></span>" +
        '<span class="mon-stat hp-stat">Życie: <span>' +
        m.hp +
        "</span></span>" +
        '<span class="mon-stat">Wymagany Poziom: <span>' +
        (m.levelReq || 1) +
        "</span></span>" +
        '<span class="mon-stat">Wymagana Obrona: <span>' +
        (m.defenseReq || 0) +
        "</span></span>" +
        dropRangeBadge +
        "</div>" +
        lockBadge;
      if (!locked && !defLocked && !isActive && !cooldownLocked) {
        card.addEventListener("click", () => App.startHunt(m.id));
      }
      if (isActive) {
        const stopBtn = document.createElement("button");
        stopBtn.className = "btn btn-sm btn-secondary";
        stopBtn.style.cssText = "margin-top:8px;width:100%";
        stopBtn.textContent = "Zatrzymaj";
        stopBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          App.stopHunt();
        });
        card.appendChild(stopBtn);
      }
      grid.appendChild(card);
    });
  };

  App.startHunt = function (monsterId) {
    if (App.state.inMine) {
      App.showConfirm(
        "Opuścić kopalnię?",
        "Rozpoczęcie polowania wymaga wyjścia z kopalni. Kontynuować?",
        function () {
          App.mineGame.leave();
          App.doStartHunt(monsterId);
        },
      );
      return;
    }
    const char = App.state.character;
    if (char && char.activity && char.activity.type) {
      const labels = {
        brewing: "warzenie mikstury",
        guard: "wartę",
        foraging: "zbieractwo",
      };
      const actLabel = labels[char.activity.type];
      if (actLabel) {
        const extra =
          char.activity.type === "brewing" ? " Stracisz zużyte składniki!" : "";
        App.showConfirm(
          "Przerwać aktywność?",
          "Rozpoczęcie polowania przerwie aktualną " +
            actLabel +
            "." +
            extra +
            " Kontynuować?",
          function () {
            App.doStartHunt(monsterId);
          },
        );
        return;
      }
    }
    App.doStartHunt(monsterId);
  };

  App.doStartHunt = async function (monsterId) {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/hunt/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ monsterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.activity && App.state.character)
        App.state.character.activity = data.activity;
      App.state.huntSwitchAllowedAt = Date.now() + 20000;
      if (App.state.huntSwitchTimer) clearTimeout(App.state.huntSwitchTimer);
      App.state.huntSwitchTimer = setTimeout(function () {
        App.state.huntSwitchTimer = null;
        if (App.state.huntSwitchCountdownInterval) {
          clearInterval(App.state.huntSwitchCountdownInterval);
          App.state.huntSwitchCountdownInterval = null;
        }
        if (App.state.currentSection === "hunt") App.renderMonsters();
      }, 20000);
      if (App.state.huntSwitchCountdownInterval)
        clearInterval(App.state.huntSwitchCountdownInterval);
      App.state.huntSwitchCountdownInterval = setInterval(function () {
        if (App.state.currentSection === "hunt") App.renderMonsters();
      }, 1000);
      App.updateCharacterUI(App.state.character);
      App.renderMonsters();
      App.renderActivityDisplay();
      App.showNotification("Wyruszasz na polowanie!", "success");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.stopHunt = async function () {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/hunt/stop", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.character = data.character || App.state.character;
      App.fixServerTimestamps(App.state.character);
      App.updateCharacterUI(App.state.character);
      App.renderMonsters();
      App.renderActivityDisplay();
      App.showNotification("Zatrzymano polowanie.", "default");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.renderGuardView = function () {
    const char = App.state.character;
    const activity = char ? char.activity : null;
    const isGuard = activity && activity.type === "guard";
    const activeView = document.getElementById("guard-active-view");
    const setupView = document.getElementById("guard-setup-view");
    if (activeView) activeView.classList.toggle("hidden", !isGuard);
    if (setupView) setupView.classList.toggle("hidden", isGuard);
    if (isGuard) {
      const endTime = activity.guardEndTime;
      const startTime = activity.guardStartTime;
      const paidHours = activity.paidHours || 0;
      const guardRateBase = 10 + ((char.level || 1) - 1) * 2;
      const guardRate =
        char.skills && char.skills.straznik ? guardRateBase * 2 : guardRateBase;
      const earned = paidHours * guardRate;
      const earnedEl = document.getElementById("guard-earned");
      if (earnedEl) earnedEl.textContent = earned;
      App.startGuardCountdownSection(
        endTime,
        startTime,
        activity.guardDurationHours || 1,
      );
    } else {
      App.selectGuardHours(App.state.selectedGuardHours || 1);
    }
  };

  App.startGuardCountdownSection = function (endTime, startTime, totalHours) {
    if (App.state.guardSectionInterval)
      clearInterval(App.state.guardSectionInterval);
    function update() {
      const now = Date.now();
      const secsLeft = Math.max(0, Math.floor((endTime - now) / 1000));
      const hh = Math.floor(secsLeft / 3600);
      const mm = Math.floor((secsLeft % 3600) / 60);
      const ss = secsLeft % 60;
      const pad = (n) => String(n).padStart(2, "0");
      const timeEl = document.getElementById("guard-time-display");
      if (timeEl) timeEl.textContent = pad(hh) + ":" + pad(mm) + ":" + pad(ss);
      const total = totalHours * 3600;
      const elapsed = Math.max(0, (now - startTime) / 1000);
      const pct = Math.min(100, Math.round((elapsed / total) * 100));
      const progEl = document.getElementById("guard-progress-fill");
      if (progEl) progEl.style.width = pct + "%";
      if (secsLeft === 0) clearInterval(App.state.guardSectionInterval);
    }
    update();
    App.state.guardSectionInterval = setInterval(update, 1000);
  };

  App.selectGuardHours = function (h) {
    App.state.selectedGuardHours = h;
    document.querySelectorAll(".hour-btn").forEach((btn) => {
      btn.classList.toggle(
        "selected",
        parseInt(btn.getAttribute("data-h")) === h,
      );
    });
    const lbl = document.getElementById("guard-hrs-label");
    const tot = document.getElementById("guard-total-gold");
    const rateEl = document.getElementById("guard-rate");
    const char = App.state.character;
    const guardRateBase = char ? 10 + ((char.level || 1) - 1) * 2 : 10;
    const guardRate =
      char && char.skills && char.skills.straznik
        ? guardRateBase * 2
        : guardRateBase;
    if (lbl) lbl.textContent = h;
    if (rateEl) rateEl.textContent = guardRate;
    if (tot) tot.textContent = h * guardRate;
  };

  App.startGuard = function () {
    if (App.state.inMine) {
      App.showConfirm(
        "Opuścić kopalnię?",
        "Rozpoczęcie warty wymaga wyjścia z kopalni. Kontynuować?",
        function () {
          App.mineGame.leave();
          App.doStartGuard();
        },
      );
      return;
    }
    const char = App.state.character;
    if (char && char.activity && char.activity.type) {
      const labels = {
        brewing: "warzenie mikstury",
        hunting: "polowanie",
        foraging: "zbieractwo",
      };
      const actLabel = labels[char.activity.type];
      if (actLabel) {
        const extra =
          char.activity.type === "brewing" ? " Stracisz zużyte składniki!" : "";
        App.showConfirm(
          "Przerwać aktywność?",
          "Rozpoczęcie warty przerwie aktualną " +
            actLabel +
            "." +
            extra +
            " Kontynuować?",
          function () {
            App.doStartGuard();
          },
        );
        return;
      }
    }
    App.doStartGuard();
  };

  App.doStartGuard = async function () {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/guard/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ hours: App.state.selectedGuardHours }),
      });
      const data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.activity && App.state.character)
        App.state.character.activity = data.activity;
      App.updateCharacterUI(App.state.character);
      App.renderGuardView();
      App.renderActivityDisplay();
      App.showNotification("Rozpoczęto wartę!", "success");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.stopGuard = async function () {
    const token = localStorage.getItem("mg_token");
    try {
      const checkRes = await fetch("/api/game/guard/check-stop", {
        headers: { Authorization: "Bearer " + token },
      });
      const checkData = await checkRes.json();
      if (checkData.hasPartialHour) {
        App.showConfirm(
          "Przerwać wartę?",
          "Nie przepracowałeś pełnej godziny. Stracisz wynagrodzenie za ostatnią niepełną godzinę. Czy na pewno chcesz zakończyć wartę?",
          () => App.doStopGuard(token, true),
        );
      } else {
        App.doStopGuard(token, false);
      }
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.doStopGuard = async function (token, confirm) {
    try {
      const res = await fetch("/api/game/guard/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ confirm }),
      });
      const data = await res.json();
      if (data.requireConfirm) return;
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.character && App.state.character) {
        App.state.character = data.character;
        App.fixServerTimestamps(App.state.character);
      } else if (App.state.character) {
        App.state.character.activity = { type: null };
        App.state.character.gold = data.character
          ? data.character.gold
          : App.state.character.gold;
      }
      App.updateCharacterUI(App.state.character);
      if (App.state.guardInterval) clearInterval(App.state.guardInterval);
      if (App.state.guardSectionInterval)
        clearInterval(App.state.guardSectionInterval);
      App.renderGuardView();
      App.renderActivityDisplay();
      App.showNotification(
        "Warta zakończona. Otrzymano " + (data.goldEarned || 0) + " złota.",
        "success",
      );
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.renderQuests = async function () {
    const container = document.getElementById("quest-container");
    if (!container) return;
    const token = localStorage.getItem("mg_token");
    try {
      const [qRes, gqRes, dqRes, mqRes, aqRes] = await Promise.all([
        fetch("/api/game/quests", {
          headers: { Authorization: "Bearer " + token },
        }),
        fetch("/api/game/guard-quest", {
          headers: { Authorization: "Bearer " + token },
        }),
        fetch("/api/game/daily-quest", {
          headers: { Authorization: "Bearer " + token },
        }),
        fetch("/api/game/mine-quest", {
          headers: { Authorization: "Bearer " + token },
        }),
        fetch("/api/game/arena-quest", {
          headers: { Authorization: "Bearer " + token },
        }),
      ]);
      if (!qRes.ok) return;
      const data = await qRes.json();
      if (dqRes.ok) {
        const dqData = await dqRes.json();
        if (App.state.character)
          App.state.character.dailyQuest = dqData.dailyQuest;
      }
      const q = data.quest;
      App.state.cachedQuest = q;
      let regularHtml;
      if (!q) {
        regularHtml =
          '<div class="all-quests-done">✦ Ukończyłeś wszystkie dostępne zadania w Khorinis! ✦</div>';
      } else {
        const req = q.requirement;
        const prog = data.progress || {};
        let current = 0,
          needed = 1;
        if (req.type === "hunt") {
          current = prog.huntKills || 0;
          needed = req.count;
        } else if (req.type === "loot") {
          current = prog.lootCount || 0;
          needed = req.count;
        }
        const pct = Math.min(100, Math.round((current / needed) * 100));
        const complete = data.isComplete;
        const typeLabel = req.type === "hunt" ? "hunt" : "loot";
        regularHtml =
          '<div class="quest-box' +
          (complete ? " quest-done-glow" : "") +
          '">' +
          '<span class="quest-type-badge ' +
          typeLabel +
          '">' +
          (req.type === "hunt" ? "Polowanie" : "Zbiórka") +
          "</span>" +
          '<div class="quest-title">' +
          q.title +
          "</div>" +
          '<div class="quest-desc">' +
          q.description +
          "</div>" +
          '<div class="quest-progress-bar"><div class="quest-progress-fill" id="quest-prog-fill" style="width:' +
          pct +
          '%"></div></div>' +
          '<div class="quest-progress-text" id="quest-prog-text">' +
          current +
          " / " +
          needed +
          "</div>" +
          '<div class="quest-reward"><span class="quest-reward-label">Nagroda:</span> <span class="quest-reward-val">+' +
          q.reward.exp +
          ' EXP</span> <span class="quest-reward-val" style="color:var(--gold)">+' +
          q.reward.gold +
          " złota</span></div>" +
          '<button class="btn btn-primary" id="quest-claim-btn" style="max-width:200px;margin-top:12px' +
          (complete ? "" : ";display:none") +
          '" onclick="App.claimQuest()">Odbierz nagrodę</button>' +
          '<div style="margin-top:8px;color:var(--text3);font-size:0.78rem">Ukończone: ' +
          data.completedCount +
          " / " +
          data.totalQuests +
          "</div>" +
          "</div>";
      }
      const gqData = gqRes.ok ? await gqRes.json() : null;
      const mqData = mqRes.ok ? await mqRes.json() : null;
      const aqData = aqRes.ok ? await aqRes.json() : null;
      container.innerHTML =
        regularHtml +
        App.buildGuardQuestHtml(gqData) +
        App.buildMineQuestHtml(mqData) +
        App.buildArenaQuestHtml(aqData) +
        App.buildDailyQuestHtml();
    } catch (e) {}
  };

  App.buildMineQuestHtml = function (data) {
    if (!data) return "";
    const q = data.quest;
    const char = App.state.character;
    const dynExp = data.dynamicExp || (char ? char.level * 2 : 2);
    const dynGold = data.dynamicGold || (char ? char.level * 3 : 3);
    let inner;
    if (!q) {
      inner =
        '<div class="all-quests-done" style="font-size:0.85rem">✦ Ukończyłeś wszystkie 100 zadań kopalni! ✦</div>';
    } else {
      const items = (q.requirement && q.requirement.items) || [];
      const complete = data.isComplete;
      const prog = data.progress || (char && char.mineQuestProgress) || {};
      const itemRows = items
        .map(function (r) {
          const has = prog[r.itemId] || 0;
          const done = has >= r.count;
          return (
            '<span style="color:' +
            (done ? "#7ec87e" : "var(--text3)") +
            ';margin-right:10px">' +
            (done ? "✓ " : "") +
            r.count +
            "x " +
            esc(_oreItemName(r.itemId)) +
            " (" +
            Math.min(has, r.count) +
            "/" +
            r.count +
            ")" +
            "</span>"
          );
        })
        .join("");
      inner =
        '<div class="quest-desc">' +
        esc(q.description) +
        "</div>" +
        '<div style="margin:8px 0 4px;font-size:0.85rem">' +
        itemRows +
        "</div>" +
        '<div class="quest-reward"><span class="quest-reward-label">Nagroda:</span> <span class="quest-reward-val">+' +
        dynExp +
        ' EXP</span> <span class="quest-reward-val" style="color:var(--gold)">+' +
        dynGold +
        " złota</span></div>" +
        (complete
          ? '<button class="btn btn-primary" style="max-width:200px;margin-top:12px" onclick="App.claimMineQuest()">Odbierz nagrodę</button>'
          : "") +
        '<div style="margin-top:8px;color:var(--text3);font-size:0.78rem">Ukończone: ' +
        data.completedCount +
        " / " +
        data.totalQuests +
        "</div>";
    }
    const glow = data.isComplete ? " quest-done-glow" : "";
    return (
      '<div class="quest-box' +
      glow +
      '" style="margin-top:16px">' +
      '<span class="quest-type-badge mine">Kopalnia</span>' +
      '<div class="quest-title">' +
      (q ? esc(q.title) : "Zadania kopalni") +
      "</div>" +
      inner +
      "</div>"
    );
  };

  function _oreItemName(itemId) {
    var NAMES = {
      brylka_rudy: "Bryłka rudy",
      brylka_zlota: "Bryłka złota",
      brylka_siarki: "Bryłka siarki",
      brylka_wegla: "Bryłka węgla",
    };
    return NAMES[itemId] || itemId;
  }

  App.claimMineQuest = async function () {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/mine-quest/claim", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.character = data.character || App.state.character;
      App.fixServerTimestamps(App.state.character);
      App.updateCharacterUI(App.state.character);
      App.renderQuests();
      App.showNotification(
        "Nagroda odebrana! +" +
          data.reward.exp +
          " EXP, +" +
          data.reward.gold +
          " złota",
        "success",
      );
      if (data.levelUps && data.levelUps > 0)
        App.showNotification(
          "Awans na poziom " + App.state.character.level + "!",
          "levelup",
        );
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.buildDailyQuestHtml = function () {
    const char = App.state.character;
    const dq = char && char.dailyQuest;
    let inner;
    if (!dq) {
      inner =
        '<div style="color:var(--text3);font-size:0.85rem">Ładowanie...</div>';
    } else if (dq.claimedDate) {
      inner =
        '<div class="dq-done-msg">✓ Zadanie ukończone! Nowe zadanie o północy:</div>' +
        '<div class="dq-countdown" id="dq-timer">' +
        App.formatDuration(App.msUntilMidnight()) +
        "</div>";
    } else {
      const expReward = char.level * 20;
      const goldReward = char.level * 7;
      const pct =
        dq.required > 0
          ? Math.min(100, Math.round(((dq.progress || 0) / dq.required) * 100))
          : 0;
      inner =
        '<div class="quest-desc">' +
        esc(dq.desc) +
        "</div>" +
        '<div class="quest-progress-bar"><div class="quest-progress-fill dq-fill" id="dq-prog-fill" style="width:' +
        pct +
        '%"></div></div>' +
        '<div class="quest-progress-text" id="dq-prog-text">' +
        (dq.progress || 0) +
        " / " +
        dq.required +
        "</div>" +
        '<div class="quest-reward"><span class="quest-reward-label">Nagroda:</span> <span class="quest-reward-val">+' +
        expReward +
        ' EXP</span> <span class="quest-reward-val" style="color:var(--gold)">+' +
        goldReward +
        " złota</span></div>" +
        (dq.completed
          ? '<button class="btn btn-primary" style="max-width:200px;margin-top:12px" onclick="App.claimDailyQuest()">Odbierz nagrodę</button>'
          : "");
    }
    const glow =
      dq && dq.completed && !dq.claimedDate ? " quest-done-glow" : "";
    return (
      '<div class="quest-box' +
      glow +
      '" style="margin-top:16px">' +
      '<span class="quest-type-badge daily">Dzienne</span>' +
      '<div class="quest-title">Zadanie Dzienne</div>' +
      inner +
      "</div>"
    );
  };

  App.buildGuardQuestHtml = function (data) {
    if (!data) return "";
    const q = data.quest;
    let inner;
    if (!q) {
      inner =
        '<div class="all-quests-done" style="font-size:0.85rem">✦ Ukończyłeś wszystkie zadania wartownicze! ✦</div>';
    } else {
      const prog = data.progress || {};
      const current = prog.guardHours || 0;
      const needed = q.requirement.hours;
      const pct = Math.min(100, Math.round((current / needed) * 100));
      const complete = data.isComplete;
      inner =
        '<div class="quest-desc">' +
        esc(q.description) +
        "</div>" +
        '<div class="quest-progress-bar"><div class="quest-progress-fill gq-fill" id="gq-prog-fill" style="width:' +
        pct +
        '%"></div></div>' +
        '<div class="quest-progress-text" id="gq-prog-text">' +
        current +
        " / " +
        needed +
        " godz.</div>" +
        '<div class="quest-reward"><span class="quest-reward-label">Nagroda:</span> <span class="quest-reward-val">+' +
        q.reward.exp +
        ' EXP</span> <span class="quest-reward-val" style="color:var(--gold)">+' +
        q.reward.gold +
        " złota</span></div>" +
        (complete
          ? '<button class="btn btn-primary" id="gq-claim-btn" style="max-width:200px;margin-top:12px" onclick="App.claimGuardQuest()">Odbierz nagrodę</button>'
          : "") +
        '<div style="margin-top:8px;color:var(--text3);font-size:0.78rem">Ukończone: ' +
        data.completedCount +
        " / " +
        data.totalQuests +
        "</div>";
    }
    App.state.cachedGuardQuest = data && data.quest ? data : null;
    const glow = data && data.isComplete ? " quest-done-glow" : "";
    return (
      '<div class="quest-box' +
      glow +
      '" style="margin-top:16px">' +
      '<span class="quest-type-badge guard">Warta</span>' +
      '<div class="quest-title">' +
      (q ? q.title : "Służba w Koszarach") +
      "</div>" +
      inner +
      "</div>"
    );
  };

  App.updateQuestProgressUI = function () {
    const char = App.state.character;
    const q = App.state.cachedQuest;
    if (!char || !q) return;
    const req = q.requirement;
    const prog = char.questProgress || {};
    let current = 0,
      needed = 1;
    if (req.type === "hunt") {
      current = prog.huntKills || 0;
      needed = req.count;
    } else if (req.type === "loot") {
      current = prog.lootCount || 0;
      needed = req.count;
    }
    const pct = Math.min(100, Math.round((current / needed) * 100));
    var fill = document.getElementById("quest-prog-fill");
    var text = document.getElementById("quest-prog-text");
    var btn = document.getElementById("quest-claim-btn");
    var box = document.querySelector(".quest-box");
    if (fill) fill.style.width = pct + "%";
    if (text) text.textContent = current + " / " + needed;
    if (btn) btn.style.display = current >= needed ? "" : "none";
    if (box) {
      if (current >= needed) box.classList.add("quest-done-glow");
      else box.classList.remove("quest-done-glow");
    }
  };

  App.updateGuardQuestProgressUI = function () {
    const char = App.state.character;
    const gqData = App.state.cachedGuardQuest;
    if (!char || !gqData || !gqData.quest) return;
    const prog = char.guardQuestProgress || {};
    const needed = gqData.quest.requirement.hours;
    const current = Math.min(prog.guardHours || 0, needed);
    const pct = Math.min(100, Math.round((current / needed) * 100));
    var fill = document.getElementById("gq-prog-fill");
    var text = document.getElementById("gq-prog-text");
    if (fill) fill.style.width = pct + "%";
    if (text) text.textContent = current + " / " + needed + " godz.";
    if (current >= needed && App.state.currentSection === "quests")
      App.renderQuests();
  };

  App.updateDailyQuestUI = function () {
    const char = App.state.character;
    const dq = char && char.dailyQuest;
    if (!dq) return;
    if (dq.completed) {
      App.renderQuests();
      return;
    }
    const pct =
      dq.required > 0
        ? Math.min(100, Math.round(((dq.progress || 0) / dq.required) * 100))
        : 0;
    var fill = document.getElementById("dq-prog-fill");
    var text = document.getElementById("dq-prog-text");
    if (fill) fill.style.width = pct + "%";
    if (text) text.textContent = (dq.progress || 0) + " / " + dq.required;
  };

  App.claimDailyQuest = async function () {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/daily-quest/claim", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.character) {
        App.state.character = data.character;
        App.fixServerTimestamps(App.state.character);
      }
      if (App.state.character && App.state.character.dailyQuest) {
        App.state.character.dailyQuest.claimedDate = App.todayDateStr();
      }
      App.updateCharacterUI(App.state.character);
      App.renderQuests();
      App.showNotification(
        "Nagroda odebrana! +" +
          data.expReward +
          " EXP, +" +
          data.goldReward +
          " złota",
        "success",
      );
      if (data.levelUps && data.levelUps > 0)
        App.showNotification(
          "Awans na poziom " + App.state.character.level + "!",
          "levelup",
        );
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.claimQuest = async function () {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/quest/claim", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.character = data.character || App.state.character;
      App.fixServerTimestamps(App.state.character);
      App.updateCharacterUI(App.state.character);
      App.renderQuests();
      App.showNotification("Nagroda odebrana!", "success");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.claimGuardQuest = async function () {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/guard-quest/claim", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.character = data.character || App.state.character;
      App.fixServerTimestamps(App.state.character);
      App.updateCharacterUI(App.state.character);
      App.renderQuests();
      App.showNotification(
        "Nagroda odebrana! +" +
          data.reward.exp +
          " EXP, +" +
          data.reward.gold +
          " złota",
        "success",
      );
      if (data.levelUps && data.levelUps > 0)
        App.showNotification(
          "Awans na poziom " + App.state.character.level + "!",
          "levelup",
        );
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.renderShop = function () {
    if (!App.state.gameData) return;
    const weapons = App.state.gameData.weapons || [];
    const armors = App.state.gameData.armors || [];
    const char = App.state.character;
    const gold = char ? char.gold || 0 : 0;

    const sellAllDiv = document.getElementById("shop-sell-all");
    if (sellAllDiv && char) {
      const gd = App.state.gameData;
      const farmingIds = new Set(
        Object.keys(App.SEED_DEFINITIONS).concat(
          Object.values(App.SEED_DEFINITIONS).map(function (s) {
            return s.yieldItemId;
          }),
          Object.keys(App.POTION_RECIPES || {}),
        ),
      );
      const SHOP_NOSELL = App.CRAFT_NOSELL;
      let sellableValue = 0;
      let sellableCount = 0;
      (char.inventory || []).forEach((item) => {
        if (
          item.itemId === char.equippedWeapon ||
          item.itemId === char.equippedArmor ||
          item.itemId === char.equippedRing ||
          item.itemId === char.equippedAmulet ||
          item.itemId === char.equippedBelt
        )
          return;
        if (farmingIds.has(item.itemId)) return;
        if (SHOP_NOSELL.has(item.itemId)) return;
        const isWpn = (gd.weapons || []).some((w) => w.id === item.itemId);
        const isArm = (gd.armors || []).some((a) => a.id === item.itemId);
        if (isWpn || isArm) return;
        const mat = gd.items ? gd.items[item.itemId] : null;
        if (!mat || mat.noSell || mat.price <= 0) return;
        const matPrice =
          char.skills && char.skills.negocjator
            ? Math.ceil(mat.price * 1.05)
            : mat.price;
        sellableValue += matPrice * (item.quantity || 1);
        sellableCount++;
      });
      if (sellableCount > 0) {
        sellAllDiv.innerHTML =
          '<div class="sell-all-bar"><span>Możesz sprzedać <strong>' +
          sellableCount +
          "</strong> rodzaj" +
          (sellableCount === 1 ? "" : "ów") +
          ' przedmiotów za łącznie <strong style="color:var(--gold)">' +
          sellableValue +
          ' złota</strong></span><button class="btn btn-sm btn-primary" onclick="App.sellAll()">Sprzedaj wszystko</button></div>';
      } else {
        sellAllDiv.innerHTML =
          '<div class="sell-all-bar" style="color:var(--text3);font-size:0.8rem">Brak przedmiotów do sprzedania.</div>';
      }
    }

    const wDiv = document.getElementById("shop-weapons");
    const aDiv = document.getElementById("shop-armors");
    if (wDiv) {
      wDiv.innerHTML = weapons
        .map((w) => {
          const spBase = Math.floor(w.price * 0.4);
          const sp =
            char && char.skills && char.skills.negocjator
              ? Math.ceil(spBase * 1.05)
              : spBase;
          const owned =
            char &&
            char.inventory &&
            char.inventory.some((i) => i.itemId === w.id);
          const equipped = char && char.equippedWeapon === w.id;
          return (
            '<div class="shop-item">' +
            '<span class="shop-item-name">' +
            w.name +
            (equipped
              ? ' <small style="color:var(--gold2)">[założona]</small>'
              : "") +
            "</span>" +
            '<span class="shop-item-stat">⚔ ' +
            w.damage +
            "</span>" +
            '<span class="shop-item-price">' +
            w.price +
            " zł</span>" +
            '<span class="shop-item-sell">(' +
            sp +
            " zł)</span>" +
            '<button class="btn btn-sm ' +
            (gold < w.price ? 'btn-secondary" disabled' : 'btn-primary"') +
            " onclick=\"App.buyItem('" +
            w.id +
            "','weapon')\">Kup</button>" +
            "</div>"
          );
        })
        .join("");
    }
    if (aDiv) {
      aDiv.innerHTML = armors
        .map((a) => {
          const spBase = Math.floor(a.price * 0.4);
          const sp =
            char && char.skills && char.skills.negocjator
              ? Math.ceil(spBase * 1.05)
              : spBase;
          const equipped = char && char.equippedArmor === a.id;
          return (
            '<div class="shop-item">' +
            '<span class="shop-item-name">' +
            a.name +
            (equipped
              ? ' <small style="color:var(--gold2)">[założony]</small>'
              : "") +
            "</span>" +
            '<span class="shop-item-stat">🛡 ' +
            a.defense +
            "</span>" +
            '<span class="shop-item-price">' +
            a.price +
            " zł</span>" +
            '<span class="shop-item-sell">(' +
            sp +
            " zł)</span>" +
            '<button class="btn btn-sm ' +
            (gold < a.price ? 'btn-secondary" disabled' : 'btn-primary"') +
            " onclick=\"App.buyItem('" +
            a.id +
            "','armor')\">Kup</button>" +
            "</div>"
          );
        })
        .join("");
    }
  };

  App.sellAll = async function () {
    const char = App.state.character;
    const gd = App.state.gameData;
    const excludeIds = new Set(
      Object.keys(App.SEED_DEFINITIONS).concat(
        Object.values(App.SEED_DEFINITIONS).map(function (s) {
          return s.yieldItemId;
        }),
        Object.keys(App.POTION_RECIPES || {}),
      ),
    );
    const ORE_IDS_SELL = App.CRAFT_NOSELL;
    let totalVal = 0;
    if (char && gd) {
      (char.inventory || []).forEach((item) => {
        if (
          item.itemId === char.equippedWeapon ||
          item.itemId === char.equippedArmor ||
          item.itemId === char.equippedRing ||
          item.itemId === char.equippedAmulet ||
          item.itemId === char.equippedBelt
        )
          return;
        if (excludeIds.has(item.itemId)) return;
        if (ORE_IDS_SELL.has(item.itemId)) return;
        if (App.getWeaponById(item.itemId) || App.getArmorById(item.itemId))
          return;
        const mat = gd.items ? gd.items[item.itemId] : null;
        if (!mat || mat.price <= 0) return;
        const matPrice =
          char && char.skills && char.skills.negocjator
            ? Math.ceil(mat.price * 1.05)
            : mat.price;
        totalVal += matPrice * (item.quantity || 1);
      });
    }
    if (
      !(await App.showConfirmAsync(
        "Sprzedaj wszystko",
        "Czy na pewno chcesz sprzedać wszystkie przedmioty za łącznie " +
          totalVal +
          " złota?",
      ))
    )
      return;
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/shop/sell-all", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
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
      App.renderShop();
      App.renderBag();
      if (data.earned > 0) {
        App.showNotification(
          "Sprzedano wszystko za " + data.earned + " złota!",
          "success",
        );
      } else {
        App.showNotification("Nie ma nic do sprzedania.", "default");
      }
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.buyItem = async function (id, type) {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/shop/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ itemId: id, type }),
      });
      const data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.character = data.character || App.state.character;
      App.fixServerTimestamps(App.state.character);
      App.updateCharacterUI(App.state.character);
      App.renderShop();
      App.showNotification("Zakupiono przedmiot!", "success");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.renderBag = function () {
    const char = App.state.character;
    if (!char) return;
    const statsGrid = document.getElementById("char-stats-grid");
    if (statsGrid) {
      var mLvl = char.miningLevel || 1;
      var mXp = char.miningXp || 0;
      var _mxt = [0, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14];
      var mXpN =
        mLvl >= 1 && mLvl <= 10
          ? _mxt[mLvl]
          : Math.floor(14 * Math.pow(1.18, mLvl - 10));
      statsGrid.innerHTML =
        '<div class="stat-card"><div class="sc-val">' +
        (char.level || 1) +
        '</div><div class="sc-label">Poziom</div></div>' +
        '<div class="stat-card"><div class="sc-val">' +
        (char.exp || 0) +
        '</div><div class="sc-label">EXP</div></div>' +
        '<div class="stat-card"><div class="sc-val" style="color:#e57373">' +
        (char.damage || 1) +
        '</div><div class="sc-label">Obrażenia</div></div>' +
        '<div class="stat-card"><div class="sc-val" style="color:#64b5f6">' +
        (char.defense || 0) +
        '</div><div class="sc-label">Obrona</div></div>' +
        '<div class="stat-card"><div class="sc-val" style="color:#c8a84b">Poz. ' +
        mLvl +
        '</div><div class="sc-label">Wydobywanie</div></div>' +
        '<div class="stat-card"><div class="sc-val" style="color:#c8a84b">' +
        mXp +
        "/" +
        mXpN +
        '</div><div class="sc-label">EXP (wydobycie)</div></div>';
    }
    const eqRow = document.getElementById("equipped-row");
    if (eqRow) {
      const wpn = char.equippedWeapon
        ? App.getWeaponById(char.equippedWeapon)
        : null;
      const arm = char.equippedArmor
        ? App.getArmorById(char.equippedArmor)
        : null;
      eqRow.innerHTML =
        '<div class="equipped-slot"><div class="slot-label">Broń</div><div class="slot-val">' +
        (wpn ? wpn.name : "Gołe pięści") +
        "</div>" +
        (wpn
          ? '<button class="btn btn-xs btn-secondary" onclick="App.unequipItem(\'weapon\')" style="margin-top:5px">Zdejmij</button>'
          : "") +
        "</div>" +
        '<div class="equipped-slot"><div class="slot-label">Pancerz</div><div class="slot-val">' +
        (arm ? arm.name : "Brak") +
        "</div>" +
        (arm
          ? '<button class="btn btn-xs btn-secondary" onclick="App.unequipItem(\'armor\')" style="margin-top:5px">Zdejmij</button>'
          : "") +
        "</div>";
    }
    const eqRingRow = document.getElementById("equipped-ring-row");
    if (eqRingRow) {
      const rng = char.equippedRing ? App.getRingById(char.equippedRing) : null;
      const rngName = rng ? rng.name : char.equippedRing || null;
      eqRingRow.innerHTML =
        '<div class="equipped-slot"><div class="slot-label">Pierścień</div><div class="slot-val">' +
        (rngName || "Brak") +
        "</div>" +
        (char.equippedRing
          ? '<button class="btn btn-xs btn-secondary" onclick="App.unequipRing()" style="margin-top:5px">Zdejmij</button>'
          : "") +
        (rng && rng.damageBonus
          ? '<div class="slot-bonus">+' + rng.damageBonus + " Obrażenia</div>"
          : "") +
        "</div>";
    }
    const eqAmuletRow = document.getElementById("equipped-amulet-row");
    if (eqAmuletRow) {
      const aml = char.equippedAmulet
        ? App.getAmuletById(char.equippedAmulet)
        : null;
      const amlName = aml ? aml.name : char.equippedAmulet || null;
      eqAmuletRow.innerHTML =
        '<div class="equipped-slot"><div class="slot-label">Amulet</div><div class="slot-val">' +
        (amlName || "Brak") +
        "</div>" +
        (char.equippedAmulet
          ? '<button class="btn btn-xs btn-secondary" onclick="App.unequipAmulet()" style="margin-top:5px">Zdejmij</button>'
          : "") +
        (aml && aml.damageBonus
          ? '<div class="slot-bonus">+' + aml.damageBonus + " Obrażenia</div>"
          : "") +
        "</div>";
    }
    const eqBeltRow = document.getElementById("equipped-belt-row");
    if (eqBeltRow) {
      const blt = char.equippedBelt ? App.getBeltById(char.equippedBelt) : null;
      const bltName = blt ? blt.name : char.equippedBelt || null;
      eqBeltRow.innerHTML =
        '<div class="equipped-slot"><div class="slot-label">Pas</div><div class="slot-val">' +
        (bltName || "Brak") +
        "</div>" +
        (char.equippedBelt
          ? '<button class="btn btn-xs btn-secondary" onclick="App.unequipBelt()" style="margin-top:5px">Zdejmij</button>'
          : "") +
        (blt && blt.damageBonus
          ? '<div class="slot-bonus">+' + blt.damageBonus + " Obrażenia</div>"
          : "") +
        "</div>";
    }
    const invGrid = document.getElementById("inventory-grid");
    if (!invGrid) return;
    const inv = char.inventory || [];

    const bagSellAll = document.getElementById("bag-sell-all");
    if (bagSellAll) {
      const gd = App.state.gameData;
      if (gd && inv.length > 0) {
        const excludeIds = new Set(
          Object.keys(App.SEED_DEFINITIONS).concat(
            Object.values(App.SEED_DEFINITIONS).map(function (s) {
              return s.yieldItemId;
            }),
            Object.keys(App.POTION_RECIPES || {}),
          ),
        );
        const ORE_IDS_BAG = App.CRAFT_NOSELL;
        let sellableValue = 0;
        let sellableCount = 0;
        inv.forEach(function (item) {
          if (
            item.itemId === char.equippedWeapon ||
            item.itemId === char.equippedArmor ||
            item.itemId === char.equippedRing ||
            item.itemId === char.equippedAmulet ||
            item.itemId === char.equippedBelt
          )
            return;
          if (excludeIds.has(item.itemId)) return;
          if (ORE_IDS_BAG.has(item.itemId)) return;
          if (
            (gd.weapons || []).some(function (w) {
              return w.id === item.itemId;
            })
          )
            return;
          if (
            (gd.armors || []).some(function (a) {
              return a.id === item.itemId;
            })
          )
            return;
          const mat = gd.items ? gd.items[item.itemId] : null;
          if (!mat || mat.price <= 0) return;
          const matPrice =
            char.skills && char.skills.negocjator
              ? Math.ceil(mat.price * 1.05)
              : mat.price;
          sellableValue += matPrice * (item.quantity || 1);
          sellableCount++;
        });
        if (sellableCount > 0) {
          bagSellAll.innerHTML =
            '<div class="sell-all-bar"><span>Możesz sprzedać <strong>' +
            sellableCount +
            "</strong> rodzaj" +
            (sellableCount === 1 ? "" : "ów") +
            ' przedmiotów za łącznie <strong style="color:var(--gold)">' +
            sellableValue +
            ' złota</strong></span><button class="btn btn-sm btn-primary" onclick="App.sellAll()">Sprzedaj wszystko</button></div>';
        } else {
          bagSellAll.innerHTML =
            '<div class="sell-all-bar" style="color:var(--text3);font-size:0.8rem">Brak materiałów do sprzedania.</div>';
        }
      } else {
        bagSellAll.innerHTML = "";
      }
    }

    if (inv.length === 0) {
      invGrid.innerHTML = '<div class="inv-empty">Plecak jest pusty.</div>';
      return;
    }
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
    invGrid.innerHTML = inv
      .map((item) => {
        const wpn = App.getWeaponById(item.itemId);
        const arm = App.getArmorById(item.itemId);
        const rng = App.getRingById(item.itemId);
        const aml = App.getAmuletById(item.itemId);
        const blt = App.getBeltById(item.itemId);
        const mat =
          App.state.gameData && App.state.gameData.items
            ? App.state.gameData.items[item.itemId]
            : null;
        const name = wpn
          ? wpn.name
          : arm
            ? arm.name
            : rng
              ? rng.name
              : aml
                ? aml.name
                : blt
                  ? blt.name
                  : mat
                    ? mat.name
                    : item.itemId;
        const equippedW = char.equippedWeapon === item.itemId;
        const equippedA = char.equippedArmor === item.itemId;
        const equippedR = char.equippedRing === item.itemId;
        const equippedAm = char.equippedAmulet === item.itemId;
        const equippedBl = char.equippedBelt === item.itemId;
        const isEquipped =
          equippedW || equippedA || equippedR || equippedAm || equippedBl;
        const canEquipWA = !!(wpn || arm);
        const canEquipRing = !!rng;
        const canEquipAmulet = !!aml;
        const canEquipBelt = !!blt;
        const isPotion = !!(
          App.POTION_RECIPES && App.POTION_RECIPES[item.itemId]
        );
        const isNoSell = NOSELL_IDS.has(item.itemId);
        const sellPBase = isNoSell
          ? 0
          : wpn
            ? Math.floor(wpn.price * 0.4)
            : arm
              ? Math.floor(arm.price * 0.4)
              : mat
                ? mat.price
                : 0;
        const sellP =
          sellPBase > 0 && char.skills && char.skills.negocjator
            ? Math.ceil(sellPBase * 1.05)
            : sellPBase;
        const safeId = item.itemId.replace(/[^a-zA-Z0-9]/g, "_");
        const maxQty = item.quantity || 1;
        const bonusLabel =
          rng && rng.damageBonus
            ? '<span class="inv-ring-bonus"> +' +
              rng.damageBonus +
              " dmg</span>"
            : aml && aml.damageBonus
              ? '<span class="inv-ring-bonus"> +' +
                aml.damageBonus +
                " dmg</span>"
              : blt && blt.damageBonus
                ? '<span class="inv-ring-bonus"> +' +
                  blt.damageBonus +
                  " dmg</span>"
                : "";
        return (
          '<div class="inv-item' +
          (isEquipped ? " equipped" : "") +
          '">' +
          (isEquipped ? '<span class="inv-item-badge">Na sobie</span>' : "") +
          '<div class="inv-item-name">' +
          name +
          bonusLabel +
          "</div>" +
          '<div class="inv-item-qty">x' +
          maxQty +
          "</div>" +
          '<div class="inv-item-actions">' +
          (canEquipWA && !isEquipped
            ? '<button class="btn btn-xs btn-primary" onclick="App.equipItem(\'' +
              item.itemId +
              "')\">Załóż</button>"
            : "") +
          (canEquipRing && !equippedR
            ? '<button class="btn btn-xs btn-primary" onclick="App.equipRing(\'' +
              item.itemId +
              "')\">Załóż</button>"
            : "") +
          (canEquipAmulet && !equippedAm
            ? '<button class="btn btn-xs btn-primary" onclick="App.equipAmulet(\'' +
              item.itemId +
              "')\">Załóż</button>"
            : "") +
          (canEquipBelt && !equippedBl
            ? '<button class="btn btn-xs btn-primary" onclick="App.equipBelt(\'' +
              item.itemId +
              "')\">Załóż</button>"
            : "") +
          (isPotion
            ? '<button class="btn btn-xs btn-primary" onclick="App.usePotion(\'' +
              item.itemId +
              "')\">Użyj</button>"
            : "") +
          (!isPotion && !isNoSell && sellP > 0
            ? '<input type="number" id="sq-' +
              safeId +
              '" value="1" min="1" max="' +
              maxQty +
              '" style="width:48px;padding:2px 4px;font-size:0.75rem;background:var(--bg2);border:1px solid var(--border);border-radius:3px;color:var(--text);text-align:center">'
            : "") +
          (!isPotion && !isNoSell && sellP > 0
            ? '<button class="btn btn-xs btn-secondary" onclick="App.sellItem(\'' +
              item.itemId +
              "')\">Sprzedaj (" +
              sellP +
              " zł/szt)</button>"
            : "") +
          (isPotion && sellP > 0
            ? '<button class="btn btn-xs btn-secondary" onclick="App.sellItem(\'' +
              item.itemId +
              "')\">Sprzedaj (" +
              sellP +
              " zł)</button>"
            : "") +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  };

  App.todayDateStr = function () {
    return new Date().toLocaleDateString("sv-SE", {
      timeZone: "Europe/Warsaw",
    });
  };

  App.msUntilMidnight = function () {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Warsaw",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).formatToParts(new Date());
    var h = parseInt(
      parts.find(function (p) {
        return p.type === "hour";
      }).value,
    );
    var m = parseInt(
      parts.find(function (p) {
        return p.type === "minute";
      }).value,
    );
    var s = parseInt(
      parts.find(function (p) {
        return p.type === "second";
      }).value,
    );
    if (h === 24) h = 0;
    return (86400 - (h * 3600 + m * 60 + s)) * 1000;
  };

  App.fixServerTimestamps = function (char) {
    if (!char) return;
    var a = char.activity;
    if (a && a.type === "brewing" && typeof a.remainingMs === "number") {
      a.brewEndTime = Date.now() + a.remainingMs;
    }
    if (a && a.type === "guard" && typeof a.remainingMs === "number") {
      a.guardEndTime = Date.now() + a.remainingMs;
      a.guardStartTime = a.guardEndTime - (a.guardDurationHours || 1) * 3600000;
    }
    var hp = char.activeEffects && char.activeEffects.hunterPotion;
    if (hp && typeof hp.remainingMs === "number") {
      hp.expiresAt = Date.now() + hp.remainingMs;
    }
    var mp = char.activeEffects && char.activeEffects.minerPotion;
    if (mp && typeof mp.remainingMs === "number") {
      mp.expiresAt = Date.now() + mp.remainingMs;
    }
    var as = char.arenaState;
    if (as && as.active && as.nextBattleAt && as.serverNow) {
      var arenaRemaining = as.nextBattleAt - as.serverNow;
      as.nextBattleAt = Date.now() + Math.max(0, arenaRemaining);
      delete as.serverNow;
    }
  };

  App.DAILY_REWARDS_POOL = [
    { label: "50 złota", icon: "💰" },
    { label: "100 złota", icon: "💰" },
    { label: "250 złota", icon: "💰" },
    { label: "500 złota", icon: "💰" },
    { label: "1000 złota", icon: "💰" },
    { label: "1× Mikstura Łowcy", icon: "⚔" },
    { label: "1× Mikstura Wartownika", icon: "🛡" },
    { label: "1× Mikstura Wzrostu", icon: "🌿" },
    { label: "1× Mikstura Kopacza", icon: "⛏" },
    { label: "5× Nasiona bagiennego ziela", icon: "🌱" },
    { label: "5× Nasiona jagód", icon: "🌱" },
    { label: "5× Nasiona czarnego ziela", icon: "🌱" },
    { label: "3× Czarne ziele", icon: "🍃" },
    { label: "3× Jagoda", icon: "🍃" },
    { label: "3× Bagienne ziele", icon: "🍃" },
    { label: "5× Bryłka rudy", icon: "⛏" },
    { label: "5× Bryłka siarki", icon: "⛏" },
    { label: "5× Bryłka węgla", icon: "⛏" },
    { label: "5× Bryłka złota", icon: "⛏" },
  ];

  App.renderDailyReward = function () {
    var container = document.getElementById("daily-container");
    if (!container) return;
    var char = App.state.character;
    if (!char) return;
    var canClaim = !!char.dailyRewardAvailable;
    var poolHtml = App.DAILY_REWARDS_POOL.map(function (r) {
      return '<span class="dr-pool-item">' + r.icon + " " + r.label + "</span>";
    }).join("");
    var btnHtml = canClaim
      ? '<button class="btn dr-claim-btn" onclick="App.claimDailyReward()">✨ Odbierz nagrodę dzienną</button>'
      : '<button class="btn dr-claim-btn dr-claim-disabled" disabled>✨ Odbierz nagrodę dzienną</button>' +
        '<div class="dr-countdown">Następna nagroda o północy: <strong id="dr-timer">' +
        App.formatDuration(App.msUntilMidnight()) +
        "</strong></div>";
    container.innerHTML =
      '<div class="daily-reward-box">' +
      '<div class="dr-chest' +
      (canClaim ? "" : " dr-chest-done") +
      '">🎁</div>' +
      '<div class="dr-title">Nagroda dzienna</div>' +
      '<div class="dr-subtitle">Wracaj każdego dnia po nagrodę!<br>Losuj jedną z ' +
      App.DAILY_REWARDS_POOL.length +
      " możliwych nagród.</div>" +
      btnHtml +
      '<div class="dr-pool-wrap"><div class="dr-pool-label">Pula nagród:</div><div class="dr-pool">' +
      poolHtml +
      "</div></div>" +
      "</div>";
  };

  App.claimDailyReward = async function () {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/daily-reward", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.character) {
        App.state.character = data.character;
        App.fixServerTimestamps(App.state.character);
      }
      if (App.state.character) App.state.character.dailyRewardAvailable = false;
      App.updateCharacterUI(App.state.character);
      App.renderDailyReward();
      App.showNotification(
        "Odebrano nagrodę: " + data.reward.label + "!",
        "success",
      );
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.renderOptions = function () {
    var container = document.getElementById("options-container");
    if (!container) return;
    var gifEnabled = App.getGifMonsters();
    var char = App.state.character;
    var login = char ? char.login || "" : "";
    var nameChangeUsed = char ? !!char.nameChangeUsed : false;
    container.innerHTML =
      '<div class="panel-box"><div class="panel-box-body">' +
      '<div class="options-group">' +
      '<div class="options-group-title">Konto</div>' +
      '<div class="option-row" style="align-items:center">' +
      '<div class="option-info">' +
      '<div class="option-name">Login konta</div>' +
      '<div class="option-desc">Twój login używany do logowania. Nie jest widoczny dla innych graczy.</div>' +
      "</div>" +
      "<span style=\"font-family:'Cinzel',serif;color:var(--gold);font-size:0.9rem;white-space:nowrap\">" +
      esc(login) +
      "</span>" +
      "</div>" +
      "</div>" +
      '<div class="options-group" style="margin-top:16px">' +
      '<div class="options-group-title">Zmiana hasła</div>' +
      '<div class="option-desc" style="margin-bottom:10px">Możesz zmienić hasło do swojego konta w dowolnym momencie.</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;max-width:320px">' +
      '<input type="password" id="opt-cur-pass" placeholder="Obecne hasło" autocomplete="current-password" style="background:var(--bg3);border:1px solid var(--border);border-radius:3px;color:var(--text);padding:8px 12px;font-size:0.85rem">' +
      '<input type="password" id="opt-new-pass" placeholder="Nowe hasło (min 6 znaków)" autocomplete="new-password" style="background:var(--bg3);border:1px solid var(--border);border-radius:3px;color:var(--text);padding:8px 12px;font-size:0.85rem">' +
      '<input type="password" id="opt-new-pass2" placeholder="Powtórz nowe hasło" autocomplete="new-password" style="background:var(--bg3);border:1px solid var(--border);border-radius:3px;color:var(--text);padding:8px 12px;font-size:0.85rem">' +
      '<button class="btn btn-secondary btn-sm" onclick="App.changePassword()" style="width:auto;align-self:flex-start">Zmień hasło</button>' +
      '<div id="opt-pass-msg" style="font-size:0.8rem;min-height:18px"></div>' +
      "</div>" +
      "</div>" +
      '<div class="options-group" style="margin-top:16px">' +
      '<div class="options-group-title">Zmiana nazwy postaci</div>' +
      (nameChangeUsed
        ? '<div class="option-desc" style="color:var(--text3)">Jednorazowa zmiana nicku postaci została już wykorzystana.</div>'
        : '<div class="option-desc" style="margin-bottom:10px">Możesz <strong>jednorazowo</strong> zmienić nazwę swojej postaci. Zmiana jest nieodwracalna — zastanów się dobrze. Zmienia się wyłącznie nazwa postaci, nie login konta.</div>' +
          '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;max-width:400px">' +
          '<input type="text" id="opt-new-name" placeholder="Nowa nazwa postaci" maxlength="25" autocomplete="off" style="flex:1;min-width:150px;background:var(--bg3);border:1px solid var(--border);border-radius:3px;color:var(--text);padding:8px 12px;font-size:0.85rem">' +
          '<button class="btn btn-danger btn-sm" onclick="App.changeName()" style="width:auto;white-space:nowrap">Zmień nick (jednorazowo)</button>' +
          "</div>" +
          '<div id="opt-name-msg" style="font-size:0.8rem;min-height:18px;margin-top:6px"></div>') +
      "</div>" +
      '<div class="options-group" style="margin-top:16px">' +
      '<div class="options-group-title">Opcje gry</div>' +
      '<div class="option-row">' +
      '<div class="option-info">' +
      '<div class="option-name">Nowe grafiki potworów</div>' +
      '<div class="option-desc">Animowane grafiki potworów zamiast dotychczasowych ikon.</div>' +
      "</div>" +
      '<label class="toggle-switch">' +
      '<input type="checkbox" id="toggle-gif-monsters"' +
      (gifEnabled ? " checked" : "") +
      ' onchange="App.setGifMonsters(this.checked)">' +
      '<span class="toggle-slider"></span>' +
      "</label>" +
      "</div>" +
      "</div>" +
      (function () {
        var lines = App.getChatLines();
        return (
          '<div class="options-group" style="margin-top:16px">' +
          '<div class="options-group-title">Opcje chatu</div>' +
          '<div class="option-row">' +
          '<div class="option-info">' +
          '<div class="option-name">Liczba linii czatu</div>' +
          '<div class="option-desc">Wysokość okna czatu karczmy. Ustawienie jest zapamiętywane na tym urządzeniu.</div>' +
          "</div>" +
          '<div style="display:flex;align-items:center;gap:8px;flex-shrink:0">' +
          '<input type="range" class="music-vol-slider" style="width:120px" min="5" max="30" value="' +
          lines +
          '" oninput="App.setChatLines(this.value)">' +
          '<span id="chat-lines-label" class="music-vol-pct" style="min-width:44px;text-align:right">' +
          lines +
          " linii</span>" +
          "</div>" +
          "</div>" +
          "</div>"
        );
      })() +
      (function () {
        var _sv = localStorage.getItem("mg_music_vol");
        var vol = Math.round(
          (_sv !== null && !isNaN(parseFloat(_sv)) ? parseFloat(_sv) : 0.2) *
            100,
        );
        var playing = App.music.isPlaying();
        return (
          '<div class="options-group" style="margin-top:16px">' +
          '<div class="options-group-title">Muzyka</div>' +
          '<div class="option-desc" style="margin-bottom:12px">Muzyka w tle — Wyspa Khorinis. Zmiana głośności jest zapamiętywana.</div>' +
          '<div class="music-controls">' +
          '<button id="music-play-btn" class="btn btn-secondary btn-sm music-btn" onclick="App.music.isPlaying() ? App.music.pause() : App.music.play()">' +
          (playing ? "⏸ Pauza" : "▶ Odtwórz") +
          "</button>" +
          '<button class="btn btn-secondary btn-sm music-btn" onclick="App.music.stop()">⏹ Stop</button>' +
          "</div>" +
          '<div class="music-vol-row">' +
          '<span class="music-vol-label-txt">Głośność</span>' +
          '<input type="range" id="music-vol-slider" class="music-vol-slider" min="0" max="100" value="' +
          vol +
          '" oninput="App.music.setVolume(this.value/100)">' +
          '<span id="music-vol-label" class="music-vol-pct">' +
          vol +
          "%</span>" +
          "</div>" +
          "</div>"
        );
      })() +
      "</div></div>";
  };

  App.changePassword = async function () {
    var cur = document.getElementById("opt-cur-pass");
    var np = document.getElementById("opt-new-pass");
    var np2 = document.getElementById("opt-new-pass2");
    var msg = document.getElementById("opt-pass-msg");
    if (!cur || !np || !np2 || !msg) return;
    msg.style.color = "var(--red2)";
    if (!cur.value) {
      msg.textContent = "Podaj obecne hasło.";
      return;
    }
    if (np.value.length < 6) {
      msg.textContent = "Nowe hasło musi mieć min 6 znaków.";
      return;
    }
    if (np.value !== np2.value) {
      msg.textContent = "Hasła nie są identyczne.";
      return;
    }
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          currentPassword: cur.value,
          newPassword: np.value,
        }),
      });
      var data = await res.json();
      if (!res.ok) {
        msg.textContent = data.error || "Błąd.";
        return;
      }
      msg.style.color = "var(--green2)";
      msg.textContent = "Hasło zmienione pomyślnie.";
      cur.value = "";
      np.value = "";
      np2.value = "";
    } catch (e) {
      msg.textContent = "Błąd połączenia.";
    }
  };

  App.changeName = async function () {
    var inp = document.getElementById("opt-new-name");
    var msg = document.getElementById("opt-name-msg");
    if (!inp || !msg) return;
    msg.style.color = "var(--red2)";
    var newName = inp.value.trim();
    if (!newName) {
      msg.textContent = "Podaj nową nazwę.";
      return;
    }
    if (
      !confirm(
        'Czy na pewno chcesz zmienić nick postaci na "' +
          newName +
          '"? Ta operacja jest jednorazowa i nieodwracalna.',
      )
    )
      return;
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/change-name", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ name: newName }),
      });
      var data = await res.json();
      if (!res.ok) {
        msg.textContent = data.error || "Błąd.";
        return;
      }
      App.state.character = data.character || App.state.character;
      App.fixServerTimestamps(App.state.character);
      App.updateCharacterUI(App.state.character);
      App.showNotification("Nick postaci zmieniony na: " + newName, "success");
      App.renderOptions();
    } catch (e) {
      msg.textContent = "Błąd połączenia.";
    }
  };

  App.getWeaponById = function (id) {
    if (!App.state.gameData || !App.state.gameData.weapons) return null;
    return App.state.gameData.weapons.find((w) => w.id === id) || null;
  };

  App.getArmorById = function (id) {
    if (!App.state.gameData || !App.state.gameData.armors) return null;
    return App.state.gameData.armors.find((a) => a.id === id) || null;
  };

  App.getRingById = function (id) {
    if (!App.state.gameData || !App.state.gameData.rings) return null;
    return App.state.gameData.rings.find((r) => r.id === id) || null;
  };

  App.getAmuletById = function (id) {
    if (!App.state.gameData || !App.state.gameData.amulets) return null;
    return App.state.gameData.amulets.find((a) => a.id === id) || null;
  };

  App.getBeltById = function (id) {
    if (!App.state.gameData || !App.state.gameData.belts) return null;
    return App.state.gameData.belts.find((b) => b.id === id) || null;
  };

  App.equipItem = async function (itemId) {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/equip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ itemId }),
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
      App.showNotification("Założono przedmiot.", "success");
      App.state.titlesData = null;
      if (App.state.socket) App.state.socket.emit("titles_get");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.unequipItem = async function (type) {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/unequip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ type }),
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
      App.showNotification("Zdjęto przedmiot.", "default");
      App.state.titlesData = null;
      if (App.state.socket) App.state.socket.emit("titles_get");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.equipRing = async function (itemId) {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/equip-ring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ itemId }),
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
      App.showNotification("Założono pierścień.", "success");
      App.state.titlesData = null;
      if (App.state.socket) App.state.socket.emit("titles_get");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.unequipRing = async function () {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/unequip-ring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
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
      App.showNotification("Zdjęto pierścień.", "default");
      App.state.titlesData = null;
      if (App.state.socket) App.state.socket.emit("titles_get");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.equipAmulet = async function (itemId) {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/equip-amulet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ itemId }),
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
      App.showNotification("Założono amulet.", "success");
      App.state.titlesData = null;
      if (App.state.socket) App.state.socket.emit("titles_get");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.unequipAmulet = async function () {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/unequip-amulet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
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
      App.showNotification("Zdjęto amulet.", "default");
      App.state.titlesData = null;
      if (App.state.socket) App.state.socket.emit("titles_get");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.equipBelt = async function (itemId) {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/equip-belt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ itemId }),
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
      App.showNotification("Założono pas.", "success");
      App.state.titlesData = null;
      if (App.state.socket) App.state.socket.emit("titles_get");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.unequipBelt = async function () {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/unequip-belt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
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
      App.showNotification("Zdjęto pas.", "default");
      App.state.titlesData = null;
      if (App.state.socket) App.state.socket.emit("titles_get");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.sellItem = async function (itemId) {
    const char = App.state.character;
    if (!char) return;
    const safeId = itemId.replace(/[^a-zA-Z0-9]/g, "_");
    const inputEl = document.getElementById("sq-" + safeId);
    const invItem = (char.inventory || []).find((x) => x.itemId === itemId);
    if (!invItem) return;
    const maxQty = invItem.quantity || 1;
    let qty = inputEl
      ? Math.max(1, Math.min(parseInt(inputEl.value) || 1, maxQty))
      : 1;
    const wpn = App.getWeaponById(itemId);
    const arm = App.getArmorById(itemId);
    const mat =
      App.state.gameData && App.state.gameData.items
        ? App.state.gameData.items[itemId]
        : null;
    const name = wpn ? wpn.name : arm ? arm.name : mat ? mat.name : itemId;
    const sellP = wpn
      ? Math.floor(wpn.price * 0.4)
      : arm
        ? Math.floor(arm.price * 0.4)
        : mat
          ? mat.price
          : 0;
    const total = sellP * qty;
    if (
      !(await App.showConfirmAsync(
        "Sprzedaj przedmiot",
        "Czy na pewno chcesz sprzedać " +
          qty +
          "x " +
          name +
          " za " +
          total +
          " złota?",
      ))
    )
      return;
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
  };

  App.renderTitles = function () {
    var socket = App.state.socket;
    if (socket) socket.emit("titles_get");
    App._renderTitlesUI();
  };

  App._renderTitlesUI = function () {
    var container = document.getElementById("titles-container");
    if (!container) return;
    var char = App.state.character;
    if (!char) {
      container.innerHTML =
        '<div style="color:var(--text3)">Brak danych postaci.</div>';
      return;
    }
    if (!App.state.titlesData) {
      container.innerHTML =
        '<div style="color:var(--text3);padding:16px">Ładowanie…</div>';
      return;
    }
    var td = App.state.titlesData;
    var equipped = char.equippedTitle || null;
    var unlocked = td.unlocked || [];
    var all = td.all || [];
    var now = Date.now();
    var cooldownLeft = Math.max(
      0,
      Math.ceil(((App.state._titleCooldownExpiry || 0) - now) / 1000),
    );

    var CATEGORIES = [
      {
        label: "⛏ Tytuły górnicze",
        ids: ["kopacz", "kret", "szkodnik", "nadzorca_kopalni"],
      },
      {
        label: "⚔ Tytuły poziomowe",
        ids: ["bezimienny", "cien", "straznik", "magnat"],
      },
      {
        label: "🏟 Tytuły areny",
        ids: ["nowicjusz", "straznik_swiatynny", "guru"],
      },
      {
        label: "✨ Tytuły umiejętności",
        ids: ["adept", "uczony", "mag_ognia", "arcymag_ognia"],
      },
      {
        label: "👥 Tytuły wybrane przez społeczność",
        ids: ["cwel", "gej", "wrzod", "piecowy"],
      },
      {
        label: "🏕 Tytuły obozowe — Obóz na Bagnie",
        ids: ["swir_z_sekty", "zbud_sie", "wyznawca_sniacego"],
      },
      {
        label: "🏕 Tytuły obozowe — Nowy Obóz",
        ids: ["zbieracz", "ryzowy_ksiaze", "mag_wody"],
      },
      {
        label: "🏕 Tytuły obozowe — Stary Obóz",
        ids: ["gosc_spod_bramy", "in_extremo", "gomez"],
      },
    ];

    var REQ_LABELS = {
      kopacz: "Wydobycie Poz. 10",
      kret: "Wydobycie Poz. 20",
      szkodnik: "Wydobycie Poz. 30",
      nadzorca_kopalni: "Wydobycie Poz. 40",
      bezimienny: "Postać Poz. 20",
      cien: "Postać Poz. 50",
      straznik: "Postać Poz. 80",
      magnat: "Postać Poz. 100",
      nowicjusz: "Siła areny > 100",
      straznik_swiatynny: "Siła areny > 300",
      guru: "Siła areny > 600",
      adept: "2 nauczone umiejętności",
      uczony: "4 nauczone umiejętności",
      mag_ognia: "6 nauczonych umiejętności",
      arcymag_ognia: "8 nauczonych umiejętności",
      cwel: "Dostępny dla każdego",
      gej: "Dostępny dla każdego",
      wrzod: "Dostępny dla każdego",
      piecowy: "Dostępny dla każdego",
      swir_z_sekty: "10 Rep. — Obóz na Bagnie",
      zbud_sie: "25 Rep. — Obóz na Bagnie",
      wyznawca_sniacego: "50 Rep. — Obóz na Bagnie",
      zbieracz: "10 Rep. — Nowy Obóz",
      ryzowy_ksiaze: "25 Rep. — Nowy Obóz",
      mag_wody: "50 Rep. — Nowy Obóz",
      gosc_spod_bramy: "10 Rep. — Stary Obóz",
      in_extremo: "25 Rep. — Stary Obóz",
      gomez: "50 Rep. — Stary Obóz",
    };

    var cooldownHtml =
      cooldownLeft > 0
        ? '<div class="titles-cooldown">⏳ Następna zmiana tytułu za <strong>' +
          cooldownLeft +
          "</strong> sekund" +
          (cooldownLeft === 1 ? "ę" : "y") +
          "</div>"
        : "";

    var equippedHtml = equipped
      ? '<div class="titles-equipped-bar">Aktywny tytuł: <span class="titles-equipped-name">' +
        esc(_getTitleNameClient(all, equipped)) +
        '</span> <button class="btn btn-secondary titles-remove-btn" onclick="App.doSetTitle(null)" ' +
        (cooldownLeft > 0 ? "disabled" : "") +
        ">Zdejmij tytuł</button></div>"
      : '<div class="titles-equipped-bar">Aktywny tytuł: <span style="color:var(--text3)">brak</span></div>';

    var categoriesHtml = CATEGORIES.map(function (cat) {
      var rows = cat.ids
        .map(function (tid) {
          var tDef = all.find(function (x) {
            return x.id === tid;
          });
          if (!tDef) return "";
          var isUnlocked = unlocked.indexOf(tid) !== -1;
          var isEquipped = equipped === tid;
          var rowClass = isEquipped
            ? "titles-row titles-row-equipped"
            : isUnlocked
              ? "titles-row titles-row-unlocked"
              : "titles-row titles-row-locked";
          var statusHtml = isEquipped
            ? '<span class="titles-status titles-status-equipped">✓ Aktywny</span>'
            : isUnlocked
              ? '<span class="titles-status titles-status-unlocked">Odblokowany</span>'
              : '<span class="titles-status titles-status-locked">🔒 ' +
                (REQ_LABELS[tid] || "") +
                "</span>";
          var btnHtml =
            isUnlocked && !isEquipped
              ? '<button class="btn btn-primary titles-select-btn" onclick="App.doSetTitle(\'' +
                tid +
                "')\" " +
                (cooldownLeft > 0 ? "disabled" : "") +
                ">Wybierz</button>"
              : "";
          return (
            '<div class="' +
            rowClass +
            '">' +
            '<div class="titles-row-name">' +
            esc(tDef.name) +
            "</div>" +
            '<div class="titles-row-req">' +
            statusHtml +
            "</div>" +
            btnHtml +
            "</div>"
          );
        })
        .join("");
      return (
        '<div class="titles-category"><div class="titles-category-label">' +
        cat.label +
        "</div>" +
        rows +
        "</div>"
      );
    }).join("");

    container.innerHTML =
      equippedHtml +
      cooldownHtml +
      '<div class="titles-list">' +
      categoriesHtml +
      "</div>";

    if (cooldownLeft > 0) {
      if (App.state._titleCooldownTimer)
        clearTimeout(App.state._titleCooldownTimer);
      App.state._titleCooldownTimer = setTimeout(
        function () {
          if (App.state.currentSection === "titles") App._renderTitlesUI();
        },
        cooldownLeft * 1000 + 100,
      );
    }
  };

  function _getTitleNameClient(all, titleId) {
    var t = (all || []).find(function (x) {
      return x.id === titleId;
    });
    return t ? t.name : titleId;
  }

  App.doSetTitle = function (titleId) {
    var socket = App.state.socket;
    if (!socket) return;
    socket.emit("title_set", { titleId: titleId });
  };

  App.setRankTab = function (tab) {
    App.state.rankTab = tab;
    var btnGen = document.getElementById("rank-tab-btn-general");
    var btnMine = document.getElementById("rank-tab-btn-mine");
    var btnArena = document.getElementById("rank-tab-btn-arena");
    var panelGen = document.getElementById("rank-panel-general");
    var panelMine = document.getElementById("rank-panel-mine");
    var panelArena = document.getElementById("rank-panel-arena");
    if (btnGen) btnGen.classList.toggle("active", tab === "general");
    if (btnMine) btnMine.classList.toggle("active", tab === "mine");
    if (btnArena) btnArena.classList.toggle("active", tab === "arena");
    if (panelGen) panelGen.classList.toggle("hidden", tab !== "general");
    if (panelMine) panelMine.classList.toggle("hidden", tab !== "mine");
    if (panelArena) panelArena.classList.toggle("hidden", tab !== "arena");
    if (tab === "general") App.renderGeneralRanking(true);
    else if (tab === "mine") App.renderMineRanking(true);
    else App.renderArenaRanking(true);
  };

  App.renderRanking = async function (resetPage) {
    if (App.state.rankTab === "mine") {
      App.renderMineRanking(resetPage);
    } else if (App.state.rankTab === "arena") {
      App.renderArenaRanking(resetPage);
    } else {
      App.renderGeneralRanking(resetPage);
    }
  };

  App.renderGeneralRanking = async function (resetPage) {
    const tbody = document.getElementById("ranking-tbody");
    if (!tbody) return;
    try {
      const res = await fetch("/api/game/ranking");
      if (!res.ok) return;
      App.state.rankingData = await res.json();
      if (resetPage) App.state.rankingPage = 1;
      const totalPages = Math.max(
        1,
        Math.ceil(App.state.rankingData.length / 20),
      );
      if (App.state.rankingPage > totalPages)
        App.state.rankingPage = totalPages;
      App.renderRankingPage();
    } catch (e) {}
  };

  App.renderRankingPage = function () {
    const tbody = document.getElementById("ranking-tbody");
    if (!tbody) return;
    const data = App.state.rankingData;
    const page = App.state.rankingPage;
    const perPage = 20;
    const totalPages = Math.max(1, Math.ceil(data.length / perPage));
    const start = (page - 1) * perPage;
    const end = Math.min(start + perPage, data.length);

    tbody.innerHTML = data
      .slice(start, end)
      .map(function (p, i) {
        var gi = start + i;
        var isMine = App.state.character && p.name === App.state.character.name;
        var act =
          p.activityType === "hunting"
            ? "hunting"
            : p.activityType === "guard"
              ? "guard"
              : p.activityType === "foraging"
                ? "foraging"
                : p.activityType === "brewing"
                  ? "brewing"
                  : p.activityType === "mine"
                    ? "mine"
                    : p.activityType === "arena"
                      ? "arena"
                      : "null";
        var actLabel =
          p.activityType === "hunting"
            ? "Polowanie"
            : p.activityType === "guard"
              ? "Warta"
              : p.activityType === "foraging"
                ? "Zbieractwo"
                : p.activityType === "brewing"
                  ? "Warzenie"
                  : p.activityType === "mine"
                    ? "Kopalnia"
                    : p.activityType === "arena"
                      ? "Arena"
                      : "Bezczynny";
        var rClass =
          gi === 0 ? "rank-1" : gi === 1 ? "rank-2" : gi === 2 ? "rank-3" : "";
        return (
          '<tr class="' +
          rClass +
          (isMine ? " rank-mine" : "") +
          '" style="' +
          (isMine ? "background:rgba(200,168,75,0.08)" : "") +
          '">' +
          '<td class="rank-num">' +
          (gi + 1) +
          "</td>" +
          '<td><strong style="color:var(--gold)">' +
          esc(p.name) +
          "</strong></td>" +
          "<td>" +
          p.level +
          "</td>" +
          "<td>" +
          p.exp +
          "</td>" +
          '<td style="color:var(--gold)">' +
          p.gold +
          "</td>" +
          '<td style="font-size:0.78rem">' +
          p.equippedWeaponName +
          "</td>" +
          '<td style="font-size:0.78rem">' +
          p.equippedArmorName +
          "</td>" +
          '<td style="font-size:0.78rem">' +
          (p.equippedRingName || "Brak") +
          "</td>" +
          '<td style="font-size:0.78rem">' +
          (p.equippedAmuletName || "Brak") +
          "</td>" +
          '<td style="font-size:0.78rem">' +
          (p.equippedBeltName || "Brak") +
          "</td>" +
          '<td><span class="activity-dot ' +
          act +
          '"></span>' +
          actLabel +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    var paginEl = document.getElementById("ranking-pagination");
    if (!paginEl) return;
    if (totalPages <= 1) {
      paginEl.innerHTML = "";
      return;
    }

    var myIdx = App.state.character
      ? data.findIndex(function (p) {
          return p.name === App.state.character.name;
        })
      : -1;
    var myPage = myIdx >= 0 ? Math.floor(myIdx / perPage) + 1 : -1;
    var jumpBtn =
      myPage > 0 && myPage !== page
        ? '<button class="rank-page-btn rank-jump-btn" onclick="App.rankJumpToMe()">⚔ Moja poz. #' +
          (myIdx + 1) +
          "</button>"
        : "";

    paginEl.innerHTML =
      '<button class="rank-page-btn" onclick="App.rankPage(-1)"' +
      (page <= 1 ? " disabled" : "") +
      ">← Poprzednia</button>" +
      '<span class="rank-page-info">Strona ' +
      page +
      " / " +
      totalPages +
      " &nbsp;·&nbsp; " +
      data.length +
      " graczy</span>" +
      '<button class="rank-page-btn" onclick="App.rankPage(1)"' +
      (page >= totalPages ? " disabled" : "") +
      ">Następna →</button>" +
      jumpBtn;
  };

  App.rankPage = function (delta) {
    var total = Math.max(1, Math.ceil(App.state.rankingData.length / 20));
    App.state.rankingPage = Math.max(
      1,
      Math.min(total, App.state.rankingPage + delta),
    );
    App.renderRankingPage();
  };

  App.rankJumpToMe = function () {
    var char = App.state.character;
    if (!char) return;
    var idx = App.state.rankingData.findIndex(function (p) {
      return p.name === char.name;
    });
    if (idx < 0) return;
    App.state.rankingPage = Math.floor(idx / 20) + 1;
    App.renderRankingPage();
  };

  App.renderMineRanking = async function (resetPage) {
    const tbody = document.getElementById("mine-ranking-tbody");
    if (!tbody) return;
    try {
      const res = await fetch("/api/game/ranking/mine");
      if (!res.ok) return;
      App.state.mineRankingData = await res.json();
      if (resetPage) App.state.mineRankingPage = 1;
      const totalPages = Math.max(
        1,
        Math.ceil(App.state.mineRankingData.length / 20),
      );
      if (App.state.mineRankingPage > totalPages)
        App.state.mineRankingPage = totalPages;
      App.renderMineRankingPage();
    } catch (e) {}
  };

  App.renderMineRankingPage = function () {
    const tbody = document.getElementById("mine-ranking-tbody");
    if (!tbody) return;
    const data = App.state.mineRankingData;
    const page = App.state.mineRankingPage;
    const perPage = 20;
    const totalPages = Math.max(1, Math.ceil(data.length / perPage));
    const start = (page - 1) * perPage;
    const end = Math.min(start + perPage, data.length);

    tbody.innerHTML = data
      .slice(start, end)
      .map(function (p, i) {
        var gi = start + i;
        var isMine = App.state.character && p.name === App.state.character.name;
        var rClass =
          gi === 0 ? "rank-1" : gi === 1 ? "rank-2" : gi === 2 ? "rank-3" : "";
        var actHtml = p.isInMine
          ? '<span class="activity-dot mine"></span>W kopalni'
          : '<span style="color:var(--text3)">Poza kopalnią</span>';
        return (
          '<tr class="' +
          rClass +
          (isMine ? " rank-mine" : "") +
          '" style="' +
          (isMine ? "background:rgba(233,30,140,0.06)" : "") +
          '">' +
          '<td class="rank-num">' +
          (gi + 1) +
          "</td>" +
          '<td><strong style="color:var(--gold)">' +
          esc(p.name) +
          "</strong></td>" +
          '<td><strong style="color:#e91e8c">' +
          p.miningLevel +
          "</strong></td>" +
          '<td style="color:var(--text3)">' +
          p.miningXp +
          "</td>" +
          "<td>" +
          actHtml +
          "</td>" +
          "</tr>"
        );
      })
      .join("");

    var paginEl = document.getElementById("mine-ranking-pagination");
    if (!paginEl) return;
    if (totalPages <= 1) {
      paginEl.innerHTML = "";
      return;
    }

    var myIdx = App.state.character
      ? data.findIndex(function (p) {
          return p.name === App.state.character.name;
        })
      : -1;
    var myPage = myIdx >= 0 ? Math.floor(myIdx / perPage) + 1 : -1;
    var jumpBtn =
      myPage > 0 && myPage !== page
        ? '<button class="rank-page-btn rank-jump-btn" onclick="App.rankMineJumpToMe()">⛏ Moja poz. #' +
          (myIdx + 1) +
          "</button>"
        : "";

    paginEl.innerHTML =
      '<button class="rank-page-btn" onclick="App.rankMinePage(-1)"' +
      (page <= 1 ? " disabled" : "") +
      ">← Poprzednia</button>" +
      '<span class="rank-page-info">Strona ' +
      page +
      " / " +
      totalPages +
      " &nbsp;·&nbsp; " +
      data.length +
      " graczy</span>" +
      '<button class="rank-page-btn" onclick="App.rankMinePage(1)"' +
      (page >= totalPages ? " disabled" : "") +
      ">Następna →</button>" +
      jumpBtn;
  };

  App.rankMinePage = function (delta) {
    var total = Math.max(1, Math.ceil(App.state.mineRankingData.length / 20));
    App.state.mineRankingPage = Math.max(
      1,
      Math.min(total, App.state.mineRankingPage + delta),
    );
    App.renderMineRankingPage();
  };

  App.rankMineJumpToMe = function () {
    var char = App.state.character;
    if (!char) return;
    var idx = App.state.mineRankingData.findIndex(function (p) {
      return p.name === char.name;
    });
    if (idx < 0) return;
    App.state.mineRankingPage = Math.floor(idx / 20) + 1;
    App.renderMineRankingPage();
  };

  App.renderArenaRanking = async function (resetPage) {
    var tbody = document.getElementById("arena-ranking-tbody");
    if (!tbody) return;
    try {
      var res = await fetch("/api/game/ranking/arena");
      if (!res.ok) return;
      App.state.arenaRankingData = await res.json();
      if (resetPage) App.state.arenaRankingPage = 1;
      var totalPages = Math.max(
        1,
        Math.ceil(App.state.arenaRankingData.length / 20),
      );
      if (App.state.arenaRankingPage > totalPages)
        App.state.arenaRankingPage = totalPages;
      App.renderArenaRankingPage();
    } catch (e) {}
  };

  App.renderArenaRankingPage = function () {
    var tbody = document.getElementById("arena-ranking-tbody");
    if (!tbody) return;
    var data = App.state.arenaRankingData;
    var page = App.state.arenaRankingPage;
    var perPage = 20;
    var totalPages = Math.max(1, Math.ceil(data.length / perPage));
    var start = (page - 1) * perPage;
    var end = Math.min(start + perPage, data.length);
    var myName = App.state.character && App.state.character.name;

    if (!data.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:16px">Nikt jeszcze nie walczył na arenie.</td></tr>';
    } else {
      tbody.innerHTML = data
        .slice(start, end)
        .map(function (p, i) {
          var gi = start + i;
          var isMine = p.name === myName;
          var rClass =
            gi === 0
              ? "rank-1"
              : gi === 1
                ? "rank-2"
                : gi === 2
                  ? "rank-3"
                  : "";
          var actHtml = p.isInArena
            ? '<span class="activity-dot arena"></span>Na arenie'
            : '<span style="color:var(--text3)">Poza areną</span>';
          return (
            '<tr class="' +
            rClass +
            (isMine ? " rank-mine" : "") +
            '" style="' +
            (isMine ? "background:rgba(255,150,50,0.08)" : "") +
            '">' +
            '<td class="rank-num">' +
            (gi + 1) +
            "</td>" +
            '<td><strong style="color:var(--gold)">' +
            esc(p.name) +
            "</strong></td>" +
            '<td style="color:#ff9a3c"><strong>#' +
            p.highestOpponent +
            "</strong></td>" +
            '<td style="color:var(--text2)">' +
            p.totalDefeated +
            "</td>" +
            "<td>" +
            actHtml +
            "</td>" +
            "</tr>"
          );
        })
        .join("");
    }

    var paginEl = document.getElementById("arena-ranking-pagination");
    if (!paginEl) return;
    if (totalPages <= 1) {
      paginEl.innerHTML = "";
      return;
    }

    var myIdx = myName
      ? data.findIndex(function (p) {
          return p.name === myName;
        })
      : -1;
    var myPage = myIdx >= 0 ? Math.floor(myIdx / perPage) + 1 : -1;
    var jumpBtn =
      myPage > 0 && myPage !== page
        ? '<button class="rank-page-btn rank-jump-btn" onclick="App.rankArenaJumpToMe()">🏟 Moja poz. #' +
          (myIdx + 1) +
          "</button>"
        : "";

    paginEl.innerHTML =
      '<button class="rank-page-btn" onclick="App.rankArenaPage(-1)"' +
      (page <= 1 ? " disabled" : "") +
      ">← Poprzednia</button>" +
      '<span class="rank-page-info">Strona ' +
      page +
      " / " +
      totalPages +
      " &nbsp;·&nbsp; " +
      data.length +
      " graczy</span>" +
      '<button class="rank-page-btn" onclick="App.rankArenaPage(1)"' +
      (page >= totalPages ? " disabled" : "") +
      ">Następna →</button>" +
      jumpBtn;
  };

  App.rankArenaPage = function (delta) {
    var total = Math.max(1, Math.ceil(App.state.arenaRankingData.length / 20));
    App.state.arenaRankingPage = Math.max(
      1,
      Math.min(total, App.state.arenaRankingPage + delta),
    );
    App.renderArenaRankingPage();
  };

  App.rankArenaJumpToMe = function () {
    var char = App.state.character;
    if (!char) return;
    var idx = App.state.arenaRankingData.findIndex(function (p) {
      return p.name === char.name;
    });
    if (idx < 0) return;
    App.state.arenaRankingPage = Math.floor(idx / 20) + 1;
    App.renderArenaRankingPage();
  };

  App.renderArena = async function () {
    var container = document.getElementById("arena-container");
    if (!container) return;
    var char = App.state.character;
    var as = char && char.arenaState;
    var now = Date.now();

    if (as && as.active) {
      App._renderArenaActive(container, as, char);
      return;
    }

    var cooldownUntil = as && as.cooldownUntil ? as.cooldownUntil : 0;
    var cdRem = Math.max(0, cooldownUntil - now);

    if (cdRem > 0) {
      container.innerHTML =
        '<div class="arena-box">' +
        '<div class="arena-title">🏟 Arena Khorinis</div>' +
        '<div class="arena-cooldown-screen">' +
        '<div class="arena-cd-icon">😴</div>' +
        '<div class="arena-cd-title">Musisz odpocząć po walce</div>' +
        '<div class="arena-cd-sub">Możesz wrócić za:</div>' +
        '<div class="arena-cd-time" id="arena-cd-timer">' +
        App.formatDuration(cdRem) +
        "</div>" +
        (as && as.lastRunHighest > 0
          ? '<div class="arena-cd-result">Ostatni wynik: dotarłeś do przeciwnika <strong style="color:var(--gold)">#' +
            as.lastRunHighest +
            "</strong></div>"
          : "") +
        "</div>" +
        "</div>";
      return;
    }

    var highestOpponent = as && as.highestOpponent ? as.highestOpponent : 0;
    var totalDefeated = as && as.totalDefeated ? as.totalDefeated : 0;
    var statsHtml =
      highestOpponent > 0
        ? '<div class="arena-stats-row"><span>Najsilniejszy pokonany:</span> <strong style="color:var(--gold)">#' +
          highestOpponent +
          "</strong></div>" +
          '<div class="arena-stats-row"><span>Łącznie pokonanych:</span> <strong>' +
          totalDefeated +
          "</strong></div>"
        : '<div class="arena-stats-row" style="color:var(--text3)">Nie walczyłeś jeszcze na arenie.</div>';

    container.innerHTML =
      '<div class="arena-box">' +
      '<div class="arena-title">🏟 Arena Khorinis</div>' +
      '<div class="arena-desc">' +
      "<p>Arena czeka na kolejnego śmiałka...</p>" +
      "<p>Walcz przez kolejnych przeciwników — po każdym pokonanym zbierasz nagrodę. Gdy polegniesz, wychodzisz z tym co zebrałeś.</p>" +
      "<p>Możesz zamknąć grę i wrócić na wynik.</p>" +
      "</div>" +
      '<div class="arena-player-stats">' +
      statsHtml +
      "</div>" +
      '<div class="arena-warning">⚠ Po wejściu na arenę nie będziesz mógł wrócić przez <strong>5 godzin</strong>.<br>Wszelkie aktywności zostaną przerwane.</div>' +
      '<button class="btn btn-primary arena-enter-btn" onclick="App.enterArena()">Wejdź na arenę</button>' +
      "</div>";
  };

  App._renderArenaActive = function (container, as, char) {
    var now = Date.now();
    var opp = as.currentOpponentData;
    var log = as.battleLog || [];
    var pool = as.rewardPool || { gold: 0, items: [] };
    var nextRem = as.nextBattleAt ? Math.max(0, as.nextBattleAt - now) : 0;

    var oppHtml = opp
      ? '<div class="arena-opponent-card">' +
        '<div class="arena-opp-num">Przeciwnik #' +
        (as.currentOpponent + 1) +
        " z 100</div>" +
        '<div class="arena-opp-name">' +
        esc(opp.name) +
        "</div>" +
        '<div class="arena-opp-stats">' +
        '<span class="arena-stat-pill red">⚔ Atak: ' +
        opp.attack +
        "</span>" +
        '<span class="arena-stat-pill blue">🛡 Obrona: ' +
        opp.defense +
        "</span>" +
        '<span class="arena-stat-pill gold">Łączna siła: ' +
        (opp.attack + opp.defense) +
        "</span>" +
        "</div>" +
        "</div>"
      : "";

    var playerDmg = char ? char.damage || 1 : 1;
    var playerDef = char ? char.defense || 0 : 0;
    var playerScore = playerDmg + playerDef;

    var playerHtml =
      '<div class="arena-player-card">' +
      '<div class="arena-opp-num">Twoje statystyki</div>' +
      '<div class="arena-opp-name">' +
      esc((char && char.name) || "Bohater") +
      "</div>" +
      '<div class="arena-opp-stats">' +
      '<span class="arena-stat-pill red">⚔ Obrażenia: ' +
      playerDmg +
      "</span>" +
      '<span class="arena-stat-pill blue">🛡 Obrona: ' +
      playerDef +
      "</span>" +
      '<span class="arena-stat-pill gold">Łączna siła: ' +
      playerScore +
      "</span>" +
      "</div>" +
      "</div>";

    var nextHtml =
      '<div class="arena-next-battle">' +
      "<span>Następna walka za: </span>" +
      '<strong id="arena-next-timer">' +
      (nextRem > 0 ? App.formatDuration(nextRem) : "Lada moment...") +
      "</strong>" +
      "</div>";

    var logRows = log
      .slice()
      .reverse()
      .map(function (entry) {
        var cls = entry.win ? "arena-log-win" : "arena-log-lose";
        var icon = entry.win ? "✓" : "✗";
        return (
          '<div class="arena-log-row ' +
          cls +
          '">' +
          '<span class="arena-log-icon">' +
          icon +
          "</span>" +
          '<span class="arena-log-opp">#' +
          entry.oppNumber +
          " " +
          esc(entry.oppName) +
          "</span>" +
          '<span class="arena-log-score">(' +
          entry.playerScore +
          " vs " +
          entry.oppScore +
          ")</span>" +
          (entry.win && entry.reward
            ? '<span class="arena-log-gold">+' +
              entry.reward.gold +
              " zł</span>"
            : "") +
          "</div>"
        );
      })
      .join("");

    var itemNames = {
      nasiona_jagod: "Nasiona jagód",
      nasiona_bagiennego_ziela: "Nasiona bagiennego ziela",
      nasiona_czarnego_ziela: "Nasiona czarnego ziela",
      jagoda: "Jagoda",
      bagienne_ziele: "Bagienne ziele",
      czarne_ziele: "Czarne ziele",
      mikstura_lowcy: "Mikstura Łowcy",
      mikstura_wartownika: "Mikstura Wartownika",
      mikstura_wzrostu: "Mikstura Wzrostu",
      mikstura_kopacza: "Mikstura Kopacza",
      brylka_rudy: "Bryłka rudy",
      brylka_zlota: "Bryłka złota",
      brylka_siarki: "Bryłka siarki",
      brylka_wegla: "Bryłka węgla",
    };
    var poolItemsHtml = pool.items
      .map(function (it) {
        return (
          '<span class="arena-pool-item">' +
          (itemNames[it.itemId] || it.itemId) +
          " ×" +
          it.qty +
          "</span>"
        );
      })
      .join("");
    var poolHtml =
      '<div class="arena-pool">' +
      '<div class="arena-pool-title">📦 Zebrana pula nagród</div>' +
      '<div class="arena-pool-gold">💰 Złoto: <strong style="color:var(--gold)">' +
      pool.gold +
      "</strong></div>" +
      (poolItemsHtml
        ? '<div class="arena-pool-items">' + poolItemsHtml + "</div>"
        : "") +
      "</div>";

    container.innerHTML =
      '<div class="arena-box arena-active">' +
      '<div class="arena-title">⚔ Walka na Arenie Khorinis</div>' +
      '<div class="arena-battle-scene">' +
      playerHtml +
      '<div class="arena-vs">VS</div>' +
      oppHtml +
      "</div>" +
      nextHtml +
      poolHtml +
      '<div class="arena-log-box">' +
      '<div class="arena-log-title">📜 Dziennik walk</div>' +
      (logRows ||
        '<div style="color:var(--text3);font-size:0.83rem">Pierwsza walka za chwilę...</div>') +
      "</div>" +
      "</div>";
  };

  App.enterArena = async function () {
    var char = App.state.character;
    if (!char) return;
    var hasActivity = (char.activity && char.activity.type) || App.state.inMine;
    var as = char.arenaState;
    if (as && as.active) {
      App.showNotification("Już jesteś na arenie!", "error");
      return;
    }
    if (hasActivity) {
      var actLabels = {
        hunting: "Polowanie",
        guard: "Warta",
        brewing: "Warzenie",
        foraging: "Zbieractwo",
        mine: "Kopalnia",
        mining: "Wydobycie",
      };
      var actType =
        (char.activity && char.activity.type) ||
        (App.state.inMine ? "mining" : "");
      var actName = actLabels[actType] || actType;
      var actExtra =
        actType === "brewing"
          ? " Stracisz wszystkie składniki z kolejki warzenia."
          : "";
      var ok = await App.showConfirmAsync(
        "Wejść na arenę?",
        "Masz aktywną aktywność: " +
          actName +
          ". Wejście na arenę ją przerwie." +
          actExtra +
          " Czy na pewno chcesz kontynuować?",
      );
      if (!ok) return;
    }
    if (App.state.inMine) App.mineGame.leave();
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/arena/enter", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (char && data.arenaState) {
        char.arenaState = data.arenaState;
        var sNow = data.arenaState.serverNow || Date.now();
        var rem = data.arenaState.nextBattleAt
          ? data.arenaState.nextBattleAt - sNow
          : 5000;
        char.arenaState.nextBattleAt = Date.now() + Math.max(0, rem);
      }
      if (char) char.activity = { type: null };
      App.renderArena();
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.onArenaBattleResult = function (data) {
    var char = App.state.character;
    if (char && char.arenaState) {
      char.arenaState.battleLog = char.arenaState.battleLog || [];
      char.arenaState.battleLog.push({
        oppIdx: data.oppIdx,
        oppNumber: data.oppNumber,
        oppName: data.oppName,
        win: data.win,
        playerScore: data.playerScore,
        oppScore: data.oppScore,
        reward: data.reward,
        timestamp: data.timestamp,
      });
      if (char.arenaState.battleLog.length > 20)
        char.arenaState.battleLog.shift();
      if (data.rewardPool) char.arenaState.rewardPool = data.rewardPool;
      if (data.win) {
        char.arenaState.currentOpponent = data.oppIdx + 1;
        if (data.nextOpponent)
          char.arenaState.currentOpponentData = data.nextOpponent;
        char.arenaState.nextBattleAt = Date.now() + 5000;
      }
    }
    if (data.win) {
      App.showNotification(
        "✓ Pokonałeś #" +
          data.oppNumber +
          " " +
          data.oppName +
          "! +" +
          (data.reward ? data.reward.gold : 0) +
          " zł",
        "success",
      );
    } else {
      App.showNotification(
        "✗ Poległeś w walce z #" + data.oppNumber + " " + data.oppName + ".",
        "error",
      );
    }
    if (App.state.currentSection === "arena") App.renderArena();
  };

  App.onArenaFinished = function (data) {
    var char = App.state.character;
    if (char && char.arenaState) {
      char.arenaState.active = false;
      char.arenaState.cooldownUntil = data.cooldownUntil;
      char.arenaState.lastRunHighest = data.highestOpponent;
      char.arenaState.rewardPool = { gold: 0, items: [] };
    }
    if (char && data.gold !== undefined) char.gold = data.gold;
    if (char && data.inventory !== undefined) char.inventory = data.inventory;
    if (char) App.updateCharacterUI(char);
    var itemNames = {
      nasiona_jagod: "Nasiona jagód",
      nasiona_bagiennego_ziela: "Nasiona bagiennego ziela",
      nasiona_czarnego_ziela: "Nasiona czarnego ziela",
      jagoda: "Jagoda",
      bagienne_ziele: "Bagienne ziele",
      czarne_ziele: "Czarne ziele",
      mikstura_lowcy: "Mikstura Łowcy",
      mikstura_wartownika: "Mikstura Wartownika",
      mikstura_wzrostu: "Mikstura Wzrostu",
      mikstura_kopacza: "Mikstura Kopacza",
      brylka_rudy: "Bryłka rudy",
      brylka_zlota: "Bryłka złota",
      brylka_siarki: "Bryłka siarki",
      brylka_wegla: "Bryłka węgla",
    };
    var pool = data.finalPool || { gold: 0, items: [] };
    var poolItemsHtml = (pool.items || [])
      .map(function (it) {
        return (
          '<span class="arena-pool-item">' +
          (itemNames[it.itemId] || it.itemId) +
          " ×" +
          it.qty +
          "</span>"
        );
      })
      .join("");
    var msg =
      data.reason === "completed"
        ? "🏆 Ukończyłeś całą arenę! Niesamowite!"
        : "💀 Poległeś na arenie. Dotarłeś do przeciwnika #" +
          data.highestOpponent +
          ".";
    App.showNotification(
      msg,
      data.reason === "completed" ? "success" : "error",
    );

    var container = document.getElementById("arena-container");
    if (container) {
      container.innerHTML =
        '<div class="arena-box">' +
        '<div class="arena-title">' +
        (data.reason === "completed"
          ? "🏆 Arena ukończona!"
          : "💀 Poległeś na arenie") +
        "</div>" +
        '<div class="arena-summary">' +
        '<div class="arena-summary-row">Najwyższy pokonany przeciwnik: <strong style="color:var(--gold)">#' +
        data.highestOpponent +
        "</strong></div>" +
        '<div class="arena-summary-row">Zebrane złoto: <strong style="color:var(--gold)">' +
        pool.gold +
        "</strong></div>" +
        (poolItemsHtml
          ? '<div class="arena-summary-row">Przedmioty: <div class="arena-pool-items" style="margin-top:4px">' +
            poolItemsHtml +
            "</div></div>"
          : "") +
        '<div class="arena-summary-row" style="color:var(--text3);font-size:0.83rem">Nagrody zostały dodane do Twojego ekwipunku.</div>' +
        "</div>" +
        '<div class="arena-cooldown-screen" style="margin-top:16px">' +
        '<div class="arena-cd-sub">Następne wejście za:</div>' +
        '<div class="arena-cd-time" id="arena-cd-timer">' +
        App.formatDuration(
          Math.max(0, (data.cooldownUntil || 0) - Date.now()),
        ) +
        "</div>" +
        "</div>" +
        "</div>";
    }
    if (char) App.updateCharacterUI(char);
  };

  App.buildArenaQuestHtml = function (data) {
    if (!data) return "";
    var q = data.quest;
    var char = App.state.character;
    var dynExp = data.dynamicExp || (char ? char.level * 2 : 2);
    var dynGold = data.dynamicGold || (char ? char.level * 3 : 3);
    var inner;
    if (!q) {
      inner =
        '<div class="all-quests-done" style="font-size:0.85rem">✦ Ukończyłeś wszystkie 100 zadań areny! ✦</div>';
    } else {
      var highest = data.highestOpponent || 0;
      var needed =
        q.requirement && q.requirement.opponentNumber
          ? q.requirement.opponentNumber
          : 1;
      var complete = data.isComplete;
      var pct = Math.min(100, Math.round((highest / needed) * 100));
      inner =
        '<div class="quest-desc">' +
        esc(q.description || q.title) +
        "</div>" +
        '<div class="quest-progress-bar" style="margin:8px 0 4px"><div class="quest-progress-fill" style="width:' +
        pct +
        '%"></div></div>' +
        '<div style="font-size:0.82rem;color:var(--text3);margin-bottom:4px">Najsilniejszy pokonany: <strong>#' +
        highest +
        "</strong> / wymagany: <strong>#" +
        needed +
        "</strong></div>" +
        '<div class="quest-reward"><span class="quest-reward-label">Nagroda:</span> <span class="quest-reward-val">+' +
        dynExp +
        ' EXP</span> <span class="quest-reward-val" style="color:var(--gold)">+' +
        dynGold +
        " złota</span></div>" +
        (complete
          ? '<button class="btn btn-primary" style="max-width:200px;margin-top:12px" onclick="App.claimArenaQuest()">Odbierz nagrodę</button>'
          : "") +
        '<div style="margin-top:8px;color:var(--text3);font-size:0.78rem">Ukończone: ' +
        data.completedCount +
        " / " +
        data.totalQuests +
        "</div>";
    }
    var glow = data.isComplete ? " quest-done-glow" : "";
    return (
      '<div class="quest-box' +
      glow +
      '" style="margin-top:16px">' +
      '<span class="quest-type-badge arena">Arena</span>' +
      '<div class="quest-title">' +
      (q ? esc(q.title) : "Zadania areny") +
      "</div>" +
      inner +
      "</div>"
    );
  };

  App.claimArenaQuest = async function () {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/arena-quest/claim", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.character = data.character || App.state.character;
      App.fixServerTimestamps(App.state.character);
      App.updateCharacterUI(App.state.character);
      App.renderQuests();
      App.showNotification(
        "Nagroda odebrana! +" +
          data.reward.exp +
          " EXP, +" +
          data.reward.gold +
          " złota",
        "success",
      );
      if (data.levelUps && data.levelUps > 0)
        App.showNotification(
          "Awans na poziom " + App.state.character.level + "!",
          "levelup",
        );
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.showNews = async function () {
    try {
      var res = await fetch("/api/game/news");
      if (!res.ok) return;
      var data = await res.json();
      var modal = document.getElementById("news-modal");
      var textEl = document.getElementById("news-modal-text");
      var dateEl = document.getElementById("news-modal-date");
      if (!modal || !textEl) return;
      textEl.textContent = data.text || "Brak aktualności.";
      if (data.updatedAt && dateEl) {
        var d = new Date(data.updatedAt);
        dateEl.textContent =
          "Ostatnia aktualizacja: " + d.toLocaleString("pl-PL");
      } else if (dateEl) {
        dateEl.textContent = "";
      }
      modal.classList.remove("hidden");
    } catch (e) {}
  };

  App.closeNewsModal = function () {
    var modal = document.getElementById("news-modal");
    if (modal) modal.classList.add("hidden");
  };

  App.KRONIKA_FILTERS = [
    {
      id: "levelup",
      label: "⬆ Awanse",
      test: function (m) {
        return /osiągnął poziom|poziom Wydobywania/.test(m);
      },
    },
    {
      id: "newplayer",
      label: "👤 Nowi gracze",
      test: function (m) {
        return /stanął u wrót|przybył do Khorinis i jest gotów|zmienił swój nick/.test(
          m,
        );
      },
    },
    {
      id: "activity",
      label: "⚔ Aktywności",
      test: function (m) {
        return /wyruszył na polowanie|stanął na warcie|wyruszył na zbieractwo|zakończył zbieractwo|zakończył służbę|rozpoczął warzenie|ukończył warzenie|udał się do|skrzynię w kopalni/.test(
          m,
        );
      },
    },
    {
      id: "quest",
      label: "📜 Zadania",
      test: function (m) {
        return /ukończył zadanie/.test(m);
      },
    },
    {
      id: "arena",
      label: "🏟 Arena",
      test: function (m) {
        return /Arenę Khorinis|Arenie Khorinis|pokonał wszystkich 100/.test(m);
      },
    },
    {
      id: "shop",
      label: "🛒 Handel i rzemiosło",
      test: function (m) {
        return /nabył|wytworzył|nauczył się umiejętności|Miksturę|kupił działkę|odebrał/.test(
          m,
        );
      },
    },
    {
      id: "crime",
      label: "🗡 Przestępczość",
      test: function (m) {
        return /okradł|próbował okraść|wygrał.*Karczmarza|włamał się|włamać do Górnego|wtrącony do więzienia/.test(
          m,
        );
      },
    },
  ];

  App._classifyFeedEvent = function (msg) {
    for (var i = 0; i < App.KRONIKA_FILTERS.length; i++) {
      if (App.KRONIKA_FILTERS[i].test(msg)) return App.KRONIKA_FILTERS[i].id;
    }
    return "other";
  };

  App._getKronikaFilterState = function () {
    try {
      var stored = localStorage.getItem("kronika_filters");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    var def = {};
    App.KRONIKA_FILTERS.forEach(function (f) {
      def[f.id] = true;
    });
    return def;
  };

  App.applyKronikaFilters = function () {
    var state = App._getKronikaFilterState();
    var feed = document.getElementById("world-feed-body");
    if (!feed) return;
    Array.from(feed.querySelectorAll(".feed-event")).forEach(function (el) {
      var cat = el.getAttribute("data-category") || "other";
      el.style.display = cat === "other" || state[cat] !== false ? "" : "none";
    });
  };

  App.toggleKronikaFilters = function () {
    var panel = document.getElementById("kronika-filter-panel");
    var btn = document.getElementById("kronika-filter-btn");
    if (!panel) return;
    var opening = panel.classList.contains("hidden");
    panel.classList.toggle("hidden");
    if (btn) btn.classList.toggle("kronika-filter-active", opening);
  };

  App._renderKronikaFilterPanel = function () {
    var panel = document.getElementById("kronika-filter-panel");
    if (!panel) return;
    var state = App._getKronikaFilterState();
    var html = '<div class="kronika-filter-grid">';
    App.KRONIKA_FILTERS.forEach(function (f) {
      var checked = state[f.id] !== false;
      html +=
        '<label class="kronika-filter-item">' +
        '<input type="checkbox"' +
        (checked ? " checked" : "") +
        " onchange=\"App._onKronikaFilterChange('" +
        f.id +
        "',this.checked)\">" +
        esc(f.label) +
        "</label>";
    });
    html += "</div>";
    panel.innerHTML = html;
  };

  App._onKronikaFilterChange = function (id, checked) {
    try {
      var state = App._getKronikaFilterState();
      state[id] = checked;
      localStorage.setItem("kronika_filters", JSON.stringify(state));
    } catch (e) {}
    App.applyKronikaFilters();
  };

  App.addFeedEvent = function (ev) {
    const feed = document.getElementById("world-feed-body");
    if (!feed) return;
    const d = new Date(ev.timestamp || ev.time || Date.now());
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const msg = ev.message || ev.msg || "";
    const cat = App._classifyFeedEvent(msg);
    const state = App._getKronikaFilterState();
    const el = document.createElement("div");
    el.className = "feed-event";
    el.setAttribute("data-category", cat);
    if (cat !== "other" && state[cat] === false) el.style.display = "none";
    el.innerHTML =
      '<div class="feed-time">' + hh + ":" + mm + "</div>" + esc(msg);
    feed.insertBefore(el, feed.firstChild);
    while (feed.children.length > 30) feed.removeChild(feed.lastChild);
  };

  App.showNotification = function (msg, type) {
    const container = document.getElementById("notifications");
    if (!container) return;
    const el = document.createElement("div");
    el.className =
      "notification " +
      (type === "success"
        ? "success"
        : type === "error"
          ? "error"
          : type === "levelup"
            ? "levelup"
            : "");
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(function () {
      el.classList.add("out");
      setTimeout(() => el.remove(), 350);
    }, 4000);
  };

  App.showOfflineSummary = function (events) {
    if (!events || events.length === 0) return;
    const box = document.getElementById("offline-summary-box");
    if (!box) return;
    const items = events
      .map((ev) => {
        let icon = "📋",
          msg = "";
        if (ev.type === "hunt") {
          icon = "⚔";
          msg =
            "Zabiłeś " +
            esc(ev.kills) +
            "x " +
            esc(ev.monsterName || "potwora") +
            ", zdobywając " +
            esc(ev.expGained) +
            " EXP.";
        } else if (ev.type === "levelup") {
          icon = "★";
          msg = "Awansowałeś na poziom " + esc(ev.level) + "!";
        } else if (ev.type === "guard") {
          icon = "🛡";
          msg =
            "Przepracowałeś " +
            esc(ev.hours) +
            " godz. na warcie, zdobywając " +
            esc(ev.gold) +
            " złota.";
        } else if (ev.type === "foraging") {
          icon = "🍃";
          msg =
            "Ukończyłeś " +
            esc(ev.cycles) +
            " cykli zbieractwa, znajdując " +
            esc(ev.found ? ev.found.length : 0) +
            " przedmiotów.";
        } else if (ev.type === "brew") {
          icon = "⚗";
          msg =
            "Uwarzone podczas nieobecności: " +
            esc(ev.potionName || ev.potionId) +
            "!";
        } else if (ev.type === "mining") {
          var _mn = {
            ore: "rudy",
            gold: "złota",
            sulphur: "siarki",
            coal: "węgla",
            iron: "żelaza",
            black_ore: "czarnej rudy",
          };
          icon = "⛏";
          msg =
            "Wydobyto " +
            esc(ev.found) +
            " bryłk" +
            (ev.found === 1 ? "ę" : "i") +
            " " +
            (_mn[ev.materialType] || ev.materialType) +
            " podczas nieobecności.";
        } else if (ev.type === "arena") {
          icon = "🏟";
          var arenaRes =
            ev.reason === "completed"
              ? "Ukończyłeś całą arenę!"
              : "Poległeś na arenie (przeciwnik #" +
                esc(ev.highestOpponent) +
                ").";
          var arenaItems = (ev.items || [])
            .map(function (it) {
              return it.qty + "x " + esc(it.itemId);
            })
            .join(", ");
          msg =
            arenaRes +
            " Nagrody: " +
            esc(ev.gold) +
            " złota" +
            (arenaItems ? ", " + arenaItems : "") +
            ".";
        } else {
          msg = esc(ev.message || "");
        }
        return (
          '<div class="offline-event"><span class="ev-icon">' +
          icon +
          "</span><span>" +
          msg +
          "</span></div>"
        );
      })
      .join("");
    box.innerHTML =
      '<div class="offline-summary"><h4>☽ Co wydarzyło się podczas Twojej nieobecności:</h4>' +
      items +
      '<button id="btn-close-offline" class="btn btn-sm btn-secondary" style="margin-top:12px" onclick="App.closeOfflineSummary()">Zamknij</button></div>';
    box.classList.remove("hidden");
  };

  App.showConfirm = function (title, msg, onOk, onCancel) {
    const modal = document.getElementById("confirm-modal");
    if (!modal) {
      if (confirm(msg)) onOk();
      else if (onCancel) onCancel();
      return;
    }
    const titleEl = document.getElementById("confirm-title");
    const msgEl = document.getElementById("confirm-msg");
    const okBtn = document.getElementById("confirm-ok");
    const cancelBtn = document.getElementById("confirm-cancel");
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = msg;
    modal.classList.remove("hidden");
    const doOk = function () {
      modal.classList.add("hidden");
      if (okBtn) okBtn.removeEventListener("click", doOk);
      if (cancelBtn) cancelBtn.removeEventListener("click", doCancel);
      onOk();
    };
    const doCancel = function () {
      modal.classList.add("hidden");
      if (okBtn) okBtn.removeEventListener("click", doOk);
      if (cancelBtn) cancelBtn.removeEventListener("click", doCancel);
      if (onCancel) onCancel();
    };
    if (okBtn) okBtn.addEventListener("click", doOk);
    if (cancelBtn) cancelBtn.addEventListener("click", doCancel);
  };

  App.showConfirmAsync = function (title, msg) {
    return new Promise(function (resolve) {
      App.showConfirm(
        title,
        msg,
        function () {
          resolve(true);
        },
        function () {
          resolve(false);
        },
      );
    });
  };

  App.closeOfflineSummary = function () {
    const box = document.getElementById("offline-summary-box");
    if (box) box.classList.add("hidden");
  };

  App.formatDuration = function (ms) {
    if (ms <= 0) return "0s";
    var totalSecs = Math.ceil(ms / 1000);
    var h = Math.floor(totalSecs / 3600);
    var m = Math.floor((totalSecs % 3600) / 60);
    var s = totalSecs % 60;
    if (h > 0) return h + "h" + (m > 0 ? " " + m + "min" : "");
    if (totalSecs < 120) return totalSecs + "s";
    return m + "min" + (s > 0 ? " " + s + "s" : "");
  };

  App.renderFarm = async function () {
    var container = document.getElementById("farm-container");
    if (!container) return;
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/farm", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) return;
      var data = await res.json();
      if (!data.owned) {
        var char = App.state.character;
        var gold = char ? char.gold || 0 : 0;
        container.innerHTML =
          '<div class="farm-buy-box">' +
          '<div class="farm-buy-icon">🌱</div>' +
          '<div class="farm-buy-title">Kup działkę rolną</div>' +
          '<div class="farm-buy-desc">Zakup działkę 3×3 w okolicach Khorinis. Siej nasiona i zbieraj plony — uprawa działa niezależnie od polowania i warty.</div>' +
          '<div class="farm-buy-price">Koszt: <strong style="color:var(--gold)">300 złota</strong> (masz: ' +
          gold +
          " zł)</div>" +
          '<button class="btn btn-primary" style="max-width:240px;margin-top:12px"' +
          (gold < 300 ? " disabled" : "") +
          ' onclick="App.buyFarm()">Kup działkę (300 zł)</button>' +
          "</div>";
        return;
      }
      App.state.farmPlots = data.plots;
      App.state.farmFetchTime = Date.now();
      App.renderFarmGrid();
    } catch (e) {}
  };

  App.renderFarmGrid = function () {
    var container = document.getElementById("farm-container");
    if (!container || !App.state.farmPlots) return;
    var elapsed = Date.now() - (App.state.farmFetchTime || Date.now());
    var readyCount = 0;
    var gridHtml = '<div class="farm-grid">';
    App.state.farmPlots.forEach(function (plot, i) {
      var state = plot.state;
      var remainingMs = plot.remainingMs || 0;
      var progress = plot.progress || 0;
      if (state === "growing") {
        remainingMs = Math.max(0, remainingMs - elapsed);
        if (remainingMs <= 0) {
          state = "ready";
        } else {
          var growthMs = App.SEED_DEFINITIONS[plot.seedId]
            ? App.SEED_DEFINITIONS[plot.seedId].growthMs
            : 3600000;
          progress = 1 - remainingMs / growthMs;
        }
      }
      if (state === "ready") readyCount++;
      gridHtml += App.renderPlotCell(
        {
          state: state,
          remainingMs: remainingMs,
          progress: progress,
          seedId: plot.seedId,
          yieldItemId: plot.yieldItemId,
        },
        i,
      );
    });
    gridHtml += "</div>";
    if (readyCount >= 2) {
      gridHtml +=
        '<div style="margin-top:10px;text-align:center"><button class="btn btn-primary btn-sm" onclick="App.harvestAll()">🌾 Zbierz wszystko (' +
        readyCount +
        ")</button></div>";
    }
    container.innerHTML = gridHtml;
  };

  App.renderPlotCell = function (plot, idx) {
    if (plot.state === "empty") {
      return (
        '<div class="farm-plot empty" onclick="App.showSeedSelector(' +
        idx +
        ')">' +
        '<div class="plot-icon">＋</div>' +
        '<div class="plot-label">Wolna</div>' +
        "</div>"
      );
    } else if (plot.state === "growing") {
      var pct = Math.round((plot.progress || 0) * 100);
      var remaining = App.formatDuration(plot.remainingMs || 0);
      var seedDef = App.SEED_DEFINITIONS[plot.seedId] || {};
      return (
        '<div class="farm-plot growing">' +
        '<div class="plot-icon">🌿</div>' +
        '<div class="plot-label">' +
        (seedDef.name || plot.seedId) +
        "</div>" +
        '<div class="plot-progress"><div class="plot-progress-fill" style="width:' +
        pct +
        '%"></div></div>' +
        '<div class="plot-time">' +
        remaining +
        "</div>" +
        "</div>"
      );
    } else {
      var seedDef2 = App.SEED_DEFINITIONS[plot.seedId] || {};
      var yieldName = seedDef2.yieldName || plot.yieldItemId || "Plon";
      return (
        '<div class="farm-plot ready">' +
        '<div class="plot-icon">🌻</div>' +
        '<div class="plot-label">' +
        yieldName +
        "</div>" +
        '<button class="plot-harvest-btn" onclick="App.harvestPlot(' +
        idx +
        ')">Zbierz</button>' +
        "</div>"
      );
    }
  };

  App.buyFarm = async function () {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/farm/buy", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.character) {
        App.state.character = data.character;
        App.fixServerTimestamps(App.state.character);
        App.updateCharacterUI(App.state.character);
      }
      App.showNotification("Kupiono działkę rolną!", "success");
      App.state.farmPlots = data.plots;
      App.state.farmFetchTime = Date.now();
      App.renderFarmGrid();
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.showSeedSelector = function (plotIdx) {
    var char = App.state.character;
    if (!char) return;
    App.state.selectedSeedPlotIndex = plotIdx;
    var modal = document.getElementById("seed-modal");
    var listEl = document.getElementById("seed-modal-list");
    if (!modal || !listEl) return;
    var inventory = char.inventory || [];
    var seedIds = Object.keys(App.SEED_DEFINITIONS);
    var html = "";
    var hasSeeds = false;
    seedIds.forEach(function (seedId) {
      var invItem = inventory.find(function (i) {
        return i.itemId === seedId;
      });
      if (invItem) {
        hasSeeds = true;
        var def = App.SEED_DEFINITIONS[seedId];
        html +=
          '<div class="seed-option" onclick="App.confirmSow(\'' +
          seedId +
          "'," +
          plotIdx +
          ')">' +
          '<div class="seed-name">' +
          def.name +
          "</div>" +
          '<div class="seed-info">Czas wzrostu: ' +
          App.formatDuration(def.growthMs) +
          " → <strong>" +
          def.yieldName +
          "</strong></div>" +
          '<div class="seed-qty">W plecaku: x' +
          invItem.quantity +
          "</div>" +
          "</div>";
      }
    });
    if (!hasSeeds) {
      html =
        '<div style="color:var(--text3);font-size:0.85rem;padding:10px 0">Nie masz żadnych nasion.<br>Wyrusz na Zbieractwo, aby je znaleźć.</div>';
    }
    listEl.innerHTML = html;
    modal.classList.remove("hidden");
  };

  App.closeSeedModal = function () {
    var modal = document.getElementById("seed-modal");
    if (modal) modal.classList.add("hidden");
    App.state.selectedSeedPlotIndex = null;
  };

  App.confirmSow = async function (seedId, plotIdx) {
    App.closeSeedModal();
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/farm/sow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ plotIndex: plotIdx, seedId: seedId }),
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.inventory && App.state.character)
        App.state.character.inventory = data.inventory;
      if (data.plots) {
        App.state.farmPlots = data.plots;
        App.state.farmFetchTime = Date.now();
      }
      if (
        data.dailyQuestUpdate &&
        App.state.character &&
        App.state.character.dailyQuest
      ) {
        App.state.character.dailyQuest.progress =
          data.dailyQuestUpdate.progress;
        App.state.character.dailyQuest.completed =
          data.dailyQuestUpdate.completed;
        if (App.state.currentSection === "quests") App.updateDailyQuestUI();
      }
      App.showNotification("Zasiano nasiona!", "success");
      App.renderFarmGrid();
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.harvestPlot = async function (plotIdx) {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/farm/harvest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ plotIndex: plotIdx }),
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.inventory && App.state.character)
        App.state.character.inventory = data.inventory;
      if (data.plots) {
        App.state.farmPlots = data.plots;
        App.state.farmFetchTime = Date.now();
      }
      var gd = App.state.gameData;
      var itemName =
        gd && gd.items && gd.items[data.harvested]
          ? gd.items[data.harvested].name
          : data.harvested || "plon";
      App.showNotification("Zebrano: " + itemName + "!", "success");
      App.renderFarmGrid();
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.harvestAll = async function () {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/farm/harvest-all", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.inventory && App.state.character)
        App.state.character.inventory = data.inventory;
      if (data.plots) {
        App.state.farmPlots = data.plots;
        App.state.farmFetchTime = Date.now();
      }
      var names = (data.harvested || [])
        .map(function (h) {
          return h.qty + "x " + h.name;
        })
        .join(", ");
      App.showNotification("Zebrano: " + names, "success");
      App.renderFarmGrid();
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.renderForagingView = function () {
    var container = document.getElementById("foraging-container");
    if (!container) return;
    var char = App.state.character;
    var activity = char ? char.activity || {} : {};
    var isForaging = activity.type === "foraging";
    if (isForaging) {
      var elapsed = App.state.foragingLocalCycleStart
        ? Date.now() - App.state.foragingLocalCycleStart
        : 0;
      var pct = Math.min(100, Math.round((elapsed / 60000) * 100));
      var remaining = Math.max(0, 60000 - elapsed);
      container.innerHTML =
        '<div class="foraging-active-box">' +
        '<div class="foraging-active-header">' +
        '<div class="foraging-icon">🍃</div>' +
        "<div>" +
        '<div class="foraging-title">Zbierasz w lasach Khorinis</div>' +
        '<div class="foraging-subtitle">Następne znalezisko za: <strong>' +
        App.formatDuration(remaining) +
        "</strong></div>" +
        "</div>" +
        "</div>" +
        '<div class="foraging-cycle-bar"><div class="foraging-cycle-fill" style="width:' +
        pct +
        '%"></div></div>' +
        '<div class="foraging-stats">' +
        "<span>Cykle: <strong>" +
        (activity.totalCycles || 0) +
        "</strong></span>" +
        "<span>Znaleziska: <strong>" +
        (activity.totalFound || 0) +
        "</strong></span>" +
        "</div>" +
        '<button class="btn btn-danger btn-sm" style="margin-top:16px" onclick="App.stopForaging()">Zakończ zbieractwo</button>' +
        "</div>";
    } else {
      container.innerHTML =
        '<div class="foraging-idle-box">' +
        '<div class="foraging-icon">🍃</div>' +
        '<div class="foraging-title">Zbieractwo w lasach</div>' +
        '<div class="foraging-desc">Wyrusz do lasów Khorinis w poszukiwaniu ziół i nasion. Co 60 sekund możesz znaleźć cenne nasiona, które posiejesz na swojej działce.<br><br><strong style="color:var(--gold2)">Uwaga:</strong> Zbieractwo przerywa aktywne polowanie lub wartę!</div>' +
        '<div class="foraging-drops-info">' +
        '<div class="foraging-drop-item"><span class="foraging-drop-chance">10%</span> Nasiona jagód</div>' +
        '<div class="foraging-drop-item"><span class="foraging-drop-chance">5%</span> Nasiona bagiennego ziela</div>' +
        '<div class="foraging-drop-item"><span class="foraging-drop-chance">3%</span> Nasiona czarnego ziela</div>' +
        "</div>" +
        '<button class="btn btn-primary" style="max-width:240px;margin-top:16px" onclick="App.startForaging()">Wyrusz na zbieractwo</button>' +
        "</div>";
    }
  };

  App.startForaging = function () {
    if (App.state.inMine) {
      App.showConfirm(
        "Opuścić kopalnię?",
        "Rozpoczęcie zbieractwa wymaga wyjścia z kopalni. Kontynuować?",
        function () {
          App.mineGame.leave();
          App.doStartForaging();
        },
      );
      return;
    }
    var char = App.state.character;
    if (char && char.activity && char.activity.type) {
      var labels = {
        hunting: "polowanie",
        guard: "wartę",
        brewing: "warzenie mikstury",
      };
      var actLabel = labels[char.activity.type];
      if (actLabel) {
        var extra =
          char.activity.type === "brewing" ? " Stracisz zużyte składniki!" : "";
        App.showConfirm(
          "Przerwać aktywność?",
          "Rozpoczęcie zbieractwa przerwie aktualną " +
            actLabel +
            "." +
            extra +
            " Kontynuować?",
          function () {
            App.doStartForaging();
          },
        );
        return;
      }
    }
    App.doStartForaging();
  };

  App.doStartForaging = async function () {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/foraging/start", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.character) {
        App.state.character = data.character;
        App.fixServerTimestamps(App.state.character);
      } else if (data.activity && App.state.character) {
        App.state.character.activity = data.activity;
      }
      App.state.foragingLocalCycleStart = Date.now();
      App.updateCharacterUI(App.state.character);
      App.renderActivityDisplay();
      App.renderForagingView();
      if (App.state.currentSection === "guard") App.renderGuardView();
      App.showNotification("Wyruszasz na zbieractwo!", "success");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.stopForaging = async function () {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/foraging/stop", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.character) {
        App.state.character = data.character;
        App.fixServerTimestamps(App.state.character);
      }
      App.state.foragingLocalCycleStart = null;
      App.updateCharacterUI(App.state.character);
      App.renderActivityDisplay();
      App.renderForagingView();
      var stats = data.stats || {};
      App.showNotification(
        "Zakończono zbieractwo. Cykli: " +
          (stats.totalCycles || 0) +
          ", znalezisk: " +
          (stats.totalFound || 0) +
          ".",
        "default",
      );
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.onBrewComplete = function (data) {
    var char = App.state.character;
    if (!char) return;
    char.activity = data.activity || { type: null };
    App.fixServerTimestamps(char);
    var existing = (char.inventory || []).find(function (x) {
      return x.itemId === data.potionId;
    });
    if (existing) existing.quantity++;
    else {
      char.inventory = char.inventory || [];
      char.inventory.push({ itemId: data.potionId, quantity: 1 });
    }
    if (data.dailyQuestUpdate && char.dailyQuest) {
      char.dailyQuest.progress = data.dailyQuestUpdate.progress;
      char.dailyQuest.completed = data.dailyQuestUpdate.completed;
      if (App.state.currentSection === "quests") App.updateDailyQuestUI();
    }
    App.updateCharacterUI(char);
    App.renderActivityDisplay();
    if (App.state.currentSection === "alchemy") App.renderAlchemy();
    if (App.state.currentSection === "bag") App.renderBag();
    var nextMsg =
      char.activity && char.activity.type === "brewing"
        ? " Rozpoczęto kolejne warzenie."
        : "";
    App.showNotification(
      "Mikstura uwarzona: " +
        esc(data.potionName || data.potionId) +
        "!" +
        nextMsg,
      "success",
    );
  };

  App.onEffectExpired = function (data) {
    var char = App.state.character;
    if (!char) return;
    if (data.effectType === "hunterPotion" && char.activeEffects) {
      delete char.activeEffects.hunterPotion;
      App.showNotification("Efekt Mikstury Łowcy wygasł.", "default");
      if (App.state.currentSection === "alchemy") App.renderAlchemy();
    }
    if (data.effectType === "minerPotion" && char.activeEffects) {
      delete char.activeEffects.minerPotion;
      var mPill = document.getElementById("m-effect-pill");
      if (mPill) mPill.style.display = "none";
      App.showNotification("Efekt Mikstury Kopacza wygasł.", "default");
      if (App.state.currentSection === "alchemy") App.renderAlchemy();
      if (App.state.inMine) App.mineGame.refreshSkillInfo();
    }
  };

  App.setCraftTab = function (tab) {
    App.state.craftTab = tab;
    App.renderCrafting();
  };

  App.renderCrafting = function () {
    var container = document.getElementById("crafting-container");
    if (!container) return;
    var char = App.state.character;
    if (!char) {
      container.innerHTML =
        '<div style="color:var(--text3)">Brak danych postaci.</div>';
      return;
    }
    var recipes = App.state.craftingRecipes || [];
    var gd = App.state.gameData;
    var items = gd ? gd.items || {} : {};
    var rings = gd ? gd.rings || [] : [];
    var amulets = gd ? gd.amulets || [] : [];
    var belts = gd ? gd.belts || [] : [];
    var tab = App.state.craftTab || "materials";

    var ringIds = new Set(
      rings.map(function (r) {
        return r.id;
      }),
    );
    var amuletIds = new Set(
      amulets.map(function (a) {
        return a.id;
      }),
    );
    var beltIds = new Set(
      belts.map(function (b) {
        return b.id;
      }),
    );

    function recipeTab(recipe) {
      var outId = recipe.outputs[0] && recipe.outputs[0].itemId;
      if (ringIds.has(outId)) return "rings";
      if (amuletIds.has(outId)) return "amulets";
      if (beltIds.has(outId)) return "belts";
      return "materials";
    }

    function getItemName(itemId) {
      var r = rings.find(function (x) {
        return x.id === itemId;
      });
      if (r) return r.name;
      var a = amulets.find(function (x) {
        return x.id === itemId;
      });
      if (a) return a.name;
      var b = belts.find(function (x) {
        return x.id === itemId;
      });
      if (b) return b.name;
      return (items[itemId] && items[itemId].name) || itemId;
    }

    function getQty(itemId) {
      var inv = (char.inventory || []).find(function (x) {
        return x.itemId === itemId;
      });
      return inv ? inv.quantity : 0;
    }

    var TABS = [
      { id: "materials", label: "🪨 Materiały" },
      { id: "rings", label: "💍 Pierścienie" },
      { id: "amulets", label: "📿 Amulety" },
      { id: "belts", label: "🪢 Pasy" },
    ];

    var html = '<div class="rank-tab-bar" style="margin-bottom:12px">';
    TABS.forEach(function (t) {
      html +=
        '<button class="rank-tab-btn' +
        (tab === t.id ? " active" : "") +
        '" onclick="App.setCraftTab(\'' +
        t.id +
        "')\">" +
        t.label +
        "</button>";
    });
    html += "</div>";

    var filtered = recipes.filter(function (r) {
      return recipeTab(r) === tab;
    });

    if (filtered.length === 0) {
      html +=
        '<div class="crafting-empty">Brak przepisów w tej kategorii.</div>';
      container.innerHTML = html;
      return;
    }

    html += '<div class="crafting-list">';
    filtered.forEach(function (recipe) {
      var canCraft = recipe.inputs.every(function (inp) {
        return getQty(inp.itemId) >= inp.quantity;
      });
      html +=
        '<div class="crafting-recipe' +
        (canCraft ? "" : " crafting-recipe-disabled") +
        '">';
      html +=
        '<div class="crafting-recipe-name">' + esc(recipe.name) + "</div>";
      html += '<div class="crafting-recipe-body">';
      html += '<div class="crafting-inputs">';
      recipe.inputs.forEach(function (inp) {
        var have = getQty(inp.itemId);
        var enough = have >= inp.quantity;
        html +=
          '<div class="crafting-mat' +
          (enough ? "" : " crafting-mat-missing") +
          '">';
        html +=
          '<span class="crafting-mat-name">' +
          esc(getItemName(inp.itemId)) +
          "</span>";
        html +=
          '<span class="crafting-mat-qty">' +
          have +
          "/" +
          inp.quantity +
          "</span>";
        html += "</div>";
      });
      html += "</div>";
      html += '<div class="crafting-arrow">→</div>';
      html += '<div class="crafting-outputs">';
      recipe.outputs.forEach(function (out) {
        var outRing = rings.find(function (r) {
          return r.id === out.itemId;
        });
        var outAmulet = amulets.find(function (a) {
          return a.id === out.itemId;
        });
        var outBelt = belts.find(function (b) {
          return b.id === out.itemId;
        });
        var outBonus =
          outRing && outRing.damageBonus
            ? outRing.damageBonus
            : outAmulet && outAmulet.damageBonus
              ? outAmulet.damageBonus
              : outBelt && outBelt.damageBonus
                ? outBelt.damageBonus
                : 0;
        var owned = getQty(out.itemId);
        html += '<div class="crafting-mat">';
        html +=
          '<span class="crafting-mat-name">' +
          esc(getItemName(out.itemId)) +
          "</span>";
        html +=
          '<span class="crafting-mat-qty">x' +
          out.quantity +
          (owned > 0
            ? ' <span style="color:var(--text3)">(masz: ' + owned + ")</span>"
            : "") +
          "</span>";
        html += "</div>";
        if (outBonus) {
          html +=
            '<div style="font-size:0.75rem;color:#e57373;margin-top:2px">+' +
            outBonus +
            " do Obrażeń</div>";
        }
      });
      html += "</div>";
      html += "</div>";
      if (canCraft) {
        html +=
          '<button class="btn btn-primary btn-sm" onclick="App.confirmCraftItem(\'' +
          esc(recipe.id) +
          "','" +
          esc(recipe.name) +
          "')\">Wytworz</button>";
      } else {
        html +=
          '<button class="btn btn-secondary btn-sm" disabled>Brak surowców</button>';
      }
      html += "</div>";
    });
    html += "</div>";
    container.innerHTML = html;
  };

  App.confirmCraftItem = function (recipeId, recipeName) {
    App.showConfirm(
      "Wytworzyć przedmiot?",
      "Czy na pewno chcesz wytworzyć: " +
        recipeName +
        "?\nZużyte surowce zostaną usunięte z ekwipunku.",
      function () {
        App.craftItem(recipeId);
      },
    );
  };

  App.craftItem = async function (recipeId) {
    const token = localStorage.getItem("mg_token");
    try {
      const res = await fetch("/api/game/crafting/craft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ recipeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.character = data.character || App.state.character;
      App.fixServerTimestamps(App.state.character);
      App.updateCharacterUI(App.state.character);
      App.renderCrafting();
      App.showNotification(
        "Wytworzono: " + (data.crafted || "przedmiot") + "!",
        "success",
      );
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.renderAlchemy = function () {
    var container = document.getElementById("alchemy-container");
    if (!container) return;
    var char = App.state.character;
    if (!char) return;
    var gd = App.state.gameData;
    var items = gd ? gd.items || {} : {};
    var isBrewing = !!(char.activity && char.activity.type === "brewing");
    var html = "";

    html +=
      '<div class="alchemy-lore">' +
      "<p><em>Constantino </em> stoi w wejściu pracowni z ponurą miną, lepiej robić swoje i nie zawracać mu głowy.</p>" +
      "</div>";

    if (char.activeEffects && char.activeEffects.hunterPotion) {
      var effRem = Math.max(
        0,
        char.activeEffects.hunterPotion.expiresAt - Date.now(),
      );
      html +=
        '<div class="alchemy-active-effect">' +
        '<span class="alchemy-effect-icon">⚔</span>' +
        "<span>Mikstura Łowcy aktywna — wygasa za <strong>" +
        App.formatDuration(effRem) +
        "</strong></span>" +
        "</div>";
    }
    if (char.activeEffects && char.activeEffects.minerPotion) {
      var mpRem = Math.max(
        0,
        char.activeEffects.minerPotion.expiresAt - Date.now(),
      );
      html +=
        '<div class="alchemy-active-effect">' +
        '<span class="alchemy-effect-icon">⛏</span>' +
        "<span>Mikstura Kopacza aktywna — wygasa za <strong>" +
        App.formatDuration(mpRem) +
        "</strong></span>" +
        "</div>";
    }

    if (isBrewing) {
      var bRec = App.POTION_RECIPES[char.activity.potionId];
      var bMs = bRec ? bRec.brewMs : 1;
      var bRem = Math.max(0, (char.activity.brewEndTime || 0) - Date.now());
      var bPct = Math.min(100, Math.round((1 - bRem / bMs) * 100));
      var bQueue = char.activity.brewQueue || [];
      var totalQueueMs = bRem;
      for (var qi = 0; qi < bQueue.length; qi++) {
        var qRec = App.POTION_RECIPES[bQueue[qi].potionId];
        if (qRec) totalQueueMs += qRec.brewMs;
      }
      var queueHtml = "";
      for (var qi2 = 0; qi2 < bQueue.length; qi2++) {
        var qRec2 = App.POTION_RECIPES[bQueue[qi2].potionId];
        queueHtml +=
          '<div class="brew-queue-item">' +
          '<span class="brew-queue-name">' +
          esc(qRec2 ? qRec2.name : bQueue[qi2].potionId) +
          "</span>" +
          '<span class="brew-queue-time">(' +
          App.formatDuration(qRec2 ? qRec2.brewMs : 0) +
          ")</span>" +
          '<button class="brew-queue-remove" onclick="App.removeFromBrewQueue(' +
          qi2 +
          ')">×</button>' +
          "</div>";
      }
      html +=
        '<div class="alchemy-brewing-active">' +
        '<div class="alchemy-brewing-title">⚗ Warzysz: ' +
        esc(bRec ? bRec.name : char.activity.potionId) +
        "</div>" +
        '<div class="alchemy-progress-bar"><div class="alchemy-progress-fill" id="alchemy-brew-fill" style="width:' +
        bPct +
        '%"></div></div>' +
        '<div class="alchemy-brewing-time">Gotowe za: <span id="alchemy-brew-remaining">' +
        App.formatDuration(bRem) +
        "</span></div>" +
        (bQueue.length > 0
          ? '<div class="brew-queue-section">' +
            '<div class="brew-queue-label">Kolejka (' +
            bQueue.length +
            "):</div>" +
            queueHtml +
            '<div class="brew-queue-total">Wszystko gotowe za: ' +
            App.formatDuration(totalQueueMs) +
            "</div>" +
            "</div>"
          : "") +
        "</div>";
    }

    html += '<div class="alchemy-recipes">';
    for (var pid in App.POTION_RECIPES) {
      html += App.renderPotionCard(pid, char, items, isBrewing);
    }
    html += "</div>";
    container.innerHTML = html;
  };

  App.renderPotionCard = function (potionId, char, items, isBrewing) {
    var recipe = App.POTION_RECIPES[potionId];
    if (!recipe) return "";
    var hasIngredients = true;
    var ingsHtml = "";
    for (var itemId in recipe.recipe) {
      var needed = recipe.recipe[itemId];
      var inv = (char.inventory || []).find(function (x) {
        return x.itemId === itemId;
      });
      var have = inv ? inv.quantity : 0;
      var ok = have >= needed;
      if (!ok) hasIngredients = false;
      var iName = items[itemId] ? items[itemId].name : itemId;
      ingsHtml +=
        '<div class="alchemy-ingredient' +
        (ok ? "" : " missing") +
        '">' +
        '<span class="ing-name">' +
        esc(iName) +
        "</span>" +
        '<span class="ing-qty">' +
        have +
        " / " +
        needed +
        "</span>" +
        "</div>";
    }
    var queueFull = isBrewing && (char.activity.brewQueue || []).length >= 10;
    var canAct = hasIngredients && !queueFull;
    var effectHint = "";
    if (recipe.effectType === "hunterPotion")
      effectHint =
        "Efekt: Natychmiastowe zabijanie przez " +
        App.formatDuration(recipe.effectDurationMs) +
        ". Działa podczas polowania.";
    else if (recipe.effectType === "guardPotion")
      effectHint =
        "Efekt: Natychmiastowe złoto i postęp zadania za 4 godziny warty.";
    else if (recipe.effectType === "growthPotion")
      effectHint =
        "Efekt: Wszystkie zasiane zioła na działce natychmiast dojrzewają.";
    else if (recipe.effectType === "minerPotion")
      effectHint =
        "Efekt: +10% szansy wydobycia w kopalni przez " +
        App.formatDuration(recipe.effectDurationMs) +
        ".";
    var btnLabel = isBrewing
      ? queueFull
        ? "Kolejka pełna"
        : "Dodaj do kolejki"
      : "Uwarz";
    return (
      '<div class="alchemy-recipe-card">' +
      '<div class="alchemy-recipe-header">' +
      '<div class="alchemy-recipe-name">' +
      esc(recipe.name) +
      "</div>" +
      '<div class="alchemy-recipe-time">⏳ ' +
      App.formatDuration(recipe.brewMs) +
      "</div>" +
      "</div>" +
      '<div class="alchemy-recipe-desc">' +
      esc(recipe.description) +
      "</div>" +
      '<div class="alchemy-effect-desc">' +
      esc(effectHint) +
      "</div>" +
      '<div class="alchemy-ingredients"><div class="alchemy-ing-label">Składniki:</div>' +
      ingsHtml +
      "</div>" +
      '<button class="btn btn-sm btn-primary" ' +
      (canAct
        ? "onclick=\"App.startBrewing('" + potionId + "')\""
        : "disabled") +
      ">" +
      btnLabel +
      "</button>" +
      "</div>"
    );
  };

  App.startBrewing = async function (potionId) {
    var char = App.state.character;
    if (!char) return;
    if (App.state.inMine) {
      App.showConfirm(
        "Opuścić kopalnię?",
        "Rozpoczęcie warzenia wymaga wyjścia z kopalni. Kontynuować?",
        function () {
          App.mineGame.leave();
          App.doStartBrewing(potionId);
        },
      );
      return;
    }
    if (
      char.activity &&
      char.activity.type &&
      char.activity.type !== "brewing"
    ) {
      var labels = {
        hunting: "polowanie",
        guard: "wartę",
        foraging: "zbieractwo",
      };
      var actLabel = labels[char.activity.type] || "aktywność";
      App.showConfirm(
        "Przerwać aktywność?",
        "Rozpoczęcie warzenia przerwie aktualną " + actLabel + ". Kontynuować?",
        function () {
          App.doStartBrewing(potionId);
        },
      );
      return;
    }
    App.doStartBrewing(potionId);
  };

  App.doStartBrewing = async function (potionId) {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/alchemy/brew", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ potionId }),
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.character) App.state.character = data.character;
      App.fixServerTimestamps(App.state.character);
      App.updateCharacterUI(App.state.character);
      App.renderActivityDisplay();
      App.renderAlchemy();
      var rec = App.POTION_RECIPES[potionId];
      var msg = data.queued ? "Dodano do kolejki: " : "Rozpoczęto warzenie: ";
      App.showNotification(msg + (rec ? rec.name : potionId) + "!", "success");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.removeFromBrewQueue = async function (idx) {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/alchemy/queue/" + idx, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.character) App.state.character = data.character;
      App.fixServerTimestamps(App.state.character);
      App.updateCharacterUI(App.state.character);
      App.renderAlchemy();
      App.showNotification("Usunięto z kolejki.", "default");
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  App.usePotion = async function (potionId) {
    var recipe = App.POTION_RECIPES[potionId];
    if (!recipe) return;
    if (
      !(await App.showConfirmAsync(
        "Użyj mikstury",
        "Czy na pewno chcesz użyć: " + recipe.name + "?",
      ))
    )
      return;
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/game/alchemy/use-potion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ potionId }),
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      if (data.character) {
        App.state.character = data.character;
        App.fixServerTimestamps(App.state.character);
        App.updateCharacterUI(App.state.character);
        App.renderBag();
        if (App.state.currentSection === "alchemy") App.renderAlchemy();
        if (App.state.currentSection === "farm") App.renderFarm();
      }
      var effect = data.effect || {};
      if (effect.type === "hunterPotion")
        App.showNotification(
          "Mikstura Łowcy aktywna! Pozostało: " +
            App.formatDuration(Math.max(0, effect.expiresAt - Date.now())),
          "levelup",
        );
      else if (effect.type === "guardPotion")
        App.showNotification(
          "Otrzymano " + effect.goldEarned + " złota za 4h warty!",
          "success",
        );
      else if (effect.type === "growthPotion")
        App.showNotification("Wszystkie zioła na działce dojrzały!", "success");
      else if (effect.type === "minerPotion") {
        App.showNotification(
          "Mikstura Kopacza aktywna! Pozostało: " +
            App.formatDuration(Math.max(0, effect.expiresAt - Date.now())),
          "levelup",
        );
        if (App.state.inMine) App.mineGame.refreshSkillInfo();
      }
    } catch (e) {
      App.showNotification("Błąd połączenia", "error");
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    const loginBtn = document.getElementById("btn-do-login");
    if (loginBtn) loginBtn.addEventListener("click", App.doLogin);
    const regBtn = document.getElementById("btn-do-register");
    if (regBtn) regBtn.addEventListener("click", App.doRegister);
    const createBtn = document.getElementById("btn-create-char");
    if (createBtn) createBtn.addEventListener("click", App.createCharacter);
    const xardasBtn = document.getElementById("btn-xardas-next");
    if (xardasBtn) xardasBtn.addEventListener("click", App.xardasNext);
    const logoutBtn = document.getElementById("btn-logout");
    if (logoutBtn) logoutBtn.addEventListener("click", App.logout);
    const tabLogin = document.getElementById("tab-login");
    if (tabLogin)
      tabLogin.addEventListener("click", () => App.switchAuthTab("login"));
    const tabReg = document.getElementById("tab-register");
    if (tabReg)
      tabReg.addEventListener("click", () => App.switchAuthTab("register"));
    const closeOffline = document.getElementById("btn-close-offline");
    if (closeOffline)
      closeOffline.addEventListener("click", App.closeOfflineSummary);
  });

  App.makeTavernCharSvg = function (hairColor, shirtColor, pantsColor) {
    function safeColor(c) {
      if (typeof c !== "string") return "#888888";
      return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : "#888888";
    }
    var h = safeColor(hairColor);
    var s = safeColor(shirtColor);
    var p = safeColor(pantsColor);
    var skin = "#e8c49a";
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 36" width="24" height="40">' +
      '<ellipse cx="10" cy="5" rx="5" ry="4" fill="' +
      h +
      '"/>' +
      '<ellipse cx="10" cy="8" rx="4.5" ry="5" fill="' +
      skin +
      '"/>' +
      '<rect x="5" y="13" width="10" height="9" rx="1" fill="' +
      s +
      '"/>' +
      '<rect x="2" y="13" width="3" height="7" rx="1" fill="' +
      s +
      '"/>' +
      '<rect x="15" y="13" width="3" height="7" rx="1" fill="' +
      s +
      '"/>' +
      '<rect x="5" y="22" width="4" height="10" rx="1" fill="' +
      p +
      '"/>' +
      '<rect x="11" y="22" width="4" height="10" rx="1" fill="' +
      p +
      '"/>' +
      "</svg>"
    );
  };

  App.initTavernChat = function () {
    var chatEl = document.getElementById("tavern-chat-messages");
    if (chatEl) {
      App.applyChatLines();
      chatEl.addEventListener("scroll", function () {
        App.state.tavernChatAutoScroll =
          chatEl.scrollTop + chatEl.clientHeight >= chatEl.scrollHeight - 20;
      });
    }
    var inp = document.getElementById("tavern-msg-input");
    if (inp) {
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter") App.tavernSendMessage();
      });
    }
    App._applyTavernChatVisibility();
    document.addEventListener("visibilitychange", function () {
      if (
        document.visibilityState === "visible" &&
        App.state.tavernChatAutoScroll
      ) {
        var el = document.getElementById("tavern-chat-messages");
        if (el) el.scrollTop = el.scrollHeight;
      }
    });
  };

  App._applyTavernChatVisibility = function () {
    var hidden = localStorage.getItem("mg_chat_hidden") === "1";
    var msgs = document.getElementById("tavern-chat-messages");
    var inputRow = document.getElementById("tavern-chat-input-row");
    var btn = document.getElementById("tavern-chat-toggle");
    if (msgs) msgs.style.display = hidden ? "none" : "";
    if (inputRow) inputRow.style.display = hidden ? "none" : "";
    if (btn) btn.textContent = hidden ? "Pokaż chat" : "Ukryj chat";
  };

  App.toggleTavernChat = function () {
    var hidden = localStorage.getItem("mg_chat_hidden") === "1";
    localStorage.setItem("mg_chat_hidden", hidden ? "0" : "1");
    App._applyTavernChatVisibility();
  };

  App.renderTavernMessages = function () {
    var chatEl = document.getElementById("tavern-chat-messages");
    if (!chatEl) return;
    var msgs = App.state.tavernMessages;
    if (!msgs.length) {
      chatEl.innerHTML =
        '<div style="color:var(--text3);font-size:0.8rem;padding:6px 0">Brak wiadomości.</div>';
      return;
    }
    var ranks = App.state.tavernRanks || {};
    chatEl.innerHTML = msgs
      .map(function (m) {
        if (m.type === "dice") {
          return (
            '<div class="tav-msg-line tav-dice-line">' +
            '<span class="tav-time">[' +
            esc(m.time) +
            "]</span>" +
            ' 🎲 <span class="tav-dice-name">' +
            esc(m.charName) +
            "</span>" +
            '<span class="tav-dice-label"> wyrzucił </span>' +
            '<span class="tav-dice-result">' +
            esc(String(m.roll)) +
            "</span>" +
            '<span class="tav-dice-label"> na kości</span>' +
            "</div>"
          );
        }
        var rankColor =
          m.rankColor ||
          (ranks[m.userId] && ranks[m.userId].color) ||
          m.campColor ||
          App._getCampColorForUser(m.userId) ||
          null;
        var nameStyle = rankColor
          ? ' style="color:' + esc(rankColor) + '"'
          : "";
        var titleHtml = m.title
          ? '<span class="tav-title">(' + esc(m.title) + ")</span> "
          : "";
        var cmdStar = App._isCommander(m.userId)
          ? '<span class="tav-commander-star">⭐</span>'
          : "";
        return (
          '<div class="tav-msg-line">' +
          '<span class="tav-time">[' +
          esc(m.time) +
          "]</span> " +
          titleHtml +
          cmdStar +
          '<span class="tav-name"' +
          nameStyle +
          ">" +
          esc(m.charName) +
          "</span>" +
          '<span class="tav-sep">:</span> ' +
          '<span class="tav-text">' +
          esc(m.text) +
          "</span>" +
          "</div>"
        );
      })
      .join("");
    if (App.state.tavernChatAutoScroll) {
      chatEl.scrollTop = chatEl.scrollHeight;
    }
  };

  App.renderTavern = function () {
    App.renderTavernMessages();
  };

  App.tavernSendMessage = function () {
    var inp = document.getElementById("tavern-msg-input");
    if (!inp) return;
    var text = inp.value.trim();
    if (!text) return;
    if (App.state.socket) {
      App.state.socket.emit("tavern_chat", { text: text });
    }
    inp.value = "";
  };

  App.tavernRollDice = function () {
    var btn = document.getElementById("tavern-dice-btn");
    if (!App.state.socket) return;
    App.state.socket.emit("tavern_dice_roll");
    if (btn) {
      btn.disabled = true;
      var secs = 30;
      btn.textContent = "🎲 " + secs + "s";
      var iv = setInterval(function () {
        secs--;
        if (secs <= 0) {
          clearInterval(iv);
          btn.disabled = false;
          btn.textContent = "🎲 Kość";
        } else {
          btn.textContent = "🎲 " + secs + "s";
        }
      }, 1000);
    }
  };

  App.onTavernState = function (data) {
    App.state.tavernMessages = data.messages || [];
    App.state.tavernRanks = data.ranks || {};
    App.state.tavernChatAutoScroll = true;
    App.renderTavernMessages();
  };

  App.onTavernMessage = function (data) {
    if (!data || !data.msg) return;
    App.state.tavernMessages.push(data.msg);
    if (App.state.tavernMessages.length > 300) {
      App.state.tavernMessages = App.state.tavernMessages.slice(-300);
    }
    var chatEl = document.getElementById("tavern-chat-messages");
    if (!chatEl) {
      App.renderTavernMessages();
      return;
    }
    var wasAtBottom =
      chatEl.scrollTop + chatEl.clientHeight >= chatEl.scrollHeight - 10;
    var m = data.msg;
    var line = document.createElement("div");
    if (m.type === "dice") {
      line.className = "tav-msg-line tav-dice-line";
      line.innerHTML =
        '<span class="tav-time">[' +
        esc(m.time) +
        "]</span>" +
        ' 🎲 <span class="tav-dice-name">' +
        esc(m.charName) +
        "</span>" +
        '<span class="tav-dice-label"> wyrzucił </span>' +
        '<span class="tav-dice-result">' +
        esc(String(m.roll)) +
        "</span>" +
        '<span class="tav-dice-label"> na kości</span>';
    } else {
      var rankColor =
        m.rankColor ||
        (App.state.tavernRanks &&
          App.state.tavernRanks[m.userId] &&
          App.state.tavernRanks[m.userId].color) ||
        m.campColor ||
        App._getCampColorForUser(m.userId) ||
        null;
      var nameStyle = rankColor ? ' style="color:' + esc(rankColor) + '"' : "";
      var titleHtml = m.title
        ? '<span class="tav-title">(' + esc(m.title) + ")</span> "
        : "";
      line.className = "tav-msg-line";
      line.innerHTML =
        '<span class="tav-time">[' +
        esc(m.time) +
        "]</span> " +
        titleHtml +
        '<span class="tav-name"' +
        nameStyle +
        ">" +
        esc(m.charName) +
        "</span>" +
        '<span class="tav-sep">:</span> ' +
        '<span class="tav-text">' +
        esc(m.text) +
        "</span>";
    }
    chatEl.appendChild(line);
    if (wasAtBottom) chatEl.scrollTop = chatEl.scrollHeight;
  };

  App.onTavernMessageDeleted = function (data) {
    if (!data || !data.id) return;
    App.state.tavernMessages = App.state.tavernMessages.filter(function (m) {
      return m.id !== data.id;
    });
    App.renderTavernMessages();
  };

  App.onTavernMuted = function (data) {
    var until = data && data.until;
    var msg;
    if (until === null || until === undefined) {
      msg = "Zostałeś permanentnie wyciszony w karczmie przez moderatora.";
    } else {
      var d = new Date(until);
      msg =
        "Zostałeś wyciszony w karczmie do: " +
        d.toLocaleTimeString("pl-PL") +
        ".";
    }
    App.showNotification(msg, "error");
  };

  App.applyImprisonmentLockdown = function () {
    var navBtns = document.querySelectorAll(".nav-btn");
    navBtns.forEach(function (btn) {
      if (btn.id !== "nav-prison") btn.style.display = "none";
    });
    App.showSection("prison");
  };

  App.renderPrison = function () {
    var el = document.getElementById("section-prison");
    if (!el) return;
    fetch("/api/world/prison", {
      headers: {
        Authorization: "Bearer " + (localStorage.getItem("mg_token") || ""),
      },
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        App.state.prisonData = data.prisoners || [];
        App.renderPrisonGrid();
      })
      .catch(function () {
        App.renderPrisonGrid();
      });
    if (App.state.socket) App.state.socket.emit("prison_view");
  };

  App.renderPrisonGrid = function () {
    var el = document.getElementById("section-prison");
    if (!el) return;

    var html =
      '<div class="prison-header"><h2 class="prison-title">⛓ Więzienie w koszarach Khorinis</h2>' +
      '<p class="prison-subtitle">Skazańcy odbywający karę za przewinienia wobec Khorinis</p></div>';

    html += '<div class="prison-grid" id="prison-grid">';

    var prisoners = App.state.prisonData || [];
    if (!prisoners.length) {
      html += '<div class="prison-empty">Więzienie jest puste.</div>';
    } else {
      prisoners.forEach(function (p) {
        var timeStr;
        if (p.remainingMs === null) {
          timeStr = "Dożywocie";
        } else {
          timeStr = App.formatDuration(p.remainingMs);
        }
        html +=
          '<div class="prison-cell">' +
          App.makeTavernCharSvg(p.hairColor, p.shirtColor, p.pantsColor) +
          '<div class="prison-cell-name">' +
          esc(p.charName) +
          "</div>" +
          '<div class="prison-cell-time">Odsiadka: <strong>' +
          timeStr +
          "</strong></div>" +
          (p.reason
            ? '<div class="prison-cell-reason">' + esc(p.reason) + "</div>"
            : "") +
          "</div>";
      });
    }
    html += "</div>";
    html += '<div class="prison-observers" id="prison-observers-box"></div>';

    el.innerHTML = html;
    App.renderPrisonObservers();
    App.startPrisonCountdowns();
  };

  App.renderPrisonObservers = function () {
    var box = document.getElementById("prison-observers-box");
    if (!box) return;
    var obs = App.state.prisonObservers || [];
    if (!obs.length) {
      box.innerHTML = "";
      return;
    }
    box.innerHTML =
      '<div class="prison-obs-line">Osoby, które właśnie obserwują więźniów: <span class="prison-obs-names">' +
      obs.map(esc).join(", ") +
      "</span></div>";
  };

  App.startPrisonCountdowns = function () {
    if (App._prisonInterval) clearInterval(App._prisonInterval);
    App._prisonInterval = setInterval(function () {
      if (App.state.currentSection !== "prison") {
        clearInterval(App._prisonInterval);
        App._prisonInterval = null;
        return;
      }
      var grid = document.getElementById("prison-grid");
      if (!grid) return;
      var cells = grid.querySelectorAll(".prison-cell");
      var prisoners = App.state.prisonData || [];
      cells.forEach(function (cell, i) {
        var p = prisoners[i];
        if (!p) return;
        var timeEl = cell.querySelector(".prison-cell-time strong");
        if (!timeEl) return;
        if (p.remainingMs === null) {
          timeEl.textContent = "Dożywocie";
          return;
        }
        p.remainingMs = Math.max(0, p.remainingMs - 1000);
        timeEl.textContent = App.formatDuration(p.remainingMs);
      });
    }, 1000);
  };

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
        headers: {
          Authorization: "Bearer " + localStorage.getItem("mg_token"),
        },
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

  App.openTicket = async function (ticketId) {
    const container = document.getElementById("tickets-container");
    if (!container) return;
    container.innerHTML =
      '<div style="color:var(--text3);padding:12px">Ładowanie zgłoszenia...</div>';
    try {
      const r = await fetch("/api/game/tickets/" + ticketId, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("mg_token"),
        },
      });
      const data = await r.json();
      if (!r.ok) {
        container.innerHTML =
          '<div class="auth-error">' +
          esc(data.error || "Błąd serwera") +
          "</div>";
        return;
      }
      const ticket = data.ticket || data;
      const isClosed = ticket.status === "closed";
      const statusClass = isClosed
        ? "ticket-status-closed"
        : "ticket-status-open";
      const statusLabel = isClosed ? "Zamknięte" : "Otwarte";
      let html =
        '<button class="btn btn-secondary btn-sm" onclick="App.renderTickets()" style="margin-bottom:12px">← Wróć do listy</button>';
      html += '<div class="ticket-detail">';
      html +=
        '<div class="ticket-detail-header"><span class="ticket-item-subject">' +
        esc(ticket.subject) +
        '</span><span class="' +
        statusClass +
        '">' +
        statusLabel +
        "</span></div>";
      html += '<div class="ticket-messages">';
      (ticket.messages || []).forEach(function (msg) {
        const isAdmin = msg.from === "admin";
        const isSystem = msg.isSystem;
        const msgClass = isSystem
          ? "ticket-msg ticket-msg-system"
          : isAdmin
            ? "ticket-msg ticket-msg-admin"
            : "ticket-msg ticket-msg-player";
        const date = new Date(msg.timestamp).toLocaleString("pl-PL");
        html += '<div class="' + msgClass + '">';
        if (!isSystem) {
          html +=
            '<div class="ticket-msg-sender">' +
            esc(msg.senderName || msg.from) +
            ' <span class="ticket-msg-time">' +
            date +
            "</span></div>";
        }
        html += '<div class="ticket-msg-text">' + esc(msg.text) + "</div>";
        html += "</div>";
      });
      html += "</div>";
      if (!isClosed) {
        html +=
          '<div class="ticket-reply-form">' +
          '<textarea id="ticket-reply-input" maxlength="1000" placeholder="Wpisz odpowiedź..." class="ticket-textarea" rows="4"></textarea>' +
          '<button class="btn btn-primary" style="margin-top:8px" onclick="App.sendTicketMessage(\'' +
          esc(ticketId) +
          "')\">Wyślij odpowiedź</button>" +
          "</div>";
      }
      html += "</div>";
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML =
        '<div class="auth-error">Błąd połączenia z serwerem.</div>';
    }
  };

  App.sendTicket = async function () {
    const subjectEl = document.getElementById("ticket-subject-input");
    const bodyEl = document.getElementById("ticket-body-input");
    const subject = subjectEl ? subjectEl.value.trim() : "";
    const text = bodyEl ? bodyEl.value.trim() : "";
    if (!subject) {
      App.showNotification("Podaj temat zgłoszenia.", "error");
      return;
    }
    if (!text) {
      App.showNotification("Napisz treść zgłoszenia.", "error");
      return;
    }
    try {
      const r = await fetch("/api/game/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("mg_token"),
        },
        body: JSON.stringify({ subject, message: text }),
      });
      const data = await r.json();
      if (!r.ok) {
        App.showNotification(
          data.error || "Błąd wysyłania zgłoszenia.",
          "error",
        );
        return;
      }
      App.showNotification("Zgłoszenie wysłane!", "success");
      App.renderTickets();
    } catch (e) {
      App.showNotification("Błąd połączenia z serwerem.", "error");
    }
  };

  App.sendTicketMessage = async function (ticketId) {
    const input = document.getElementById("ticket-reply-input");
    if (!input) return;
    const text = input.value.trim();
    if (!text) {
      App.showNotification("Wpisz treść wiadomości.", "error");
      return;
    }
    try {
      const r = await fetch("/api/game/tickets/" + ticketId + "/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("mg_token"),
        },
        body: JSON.stringify({ message: text }),
      });
      const data = await r.json();
      if (!r.ok) {
        App.showNotification(
          data.error || "Błąd wysyłania wiadomości.",
          "error",
        );
        return;
      }
      App.openTicket(ticketId);
    } catch (e) {
      App.showNotification("Błąd połączenia z serwerem.", "error");
    }
  };

  App.onTicketUpdate = function () {
    App.state.ticketUnread = true;
    const navBtn = document.getElementById("nav-tickets");
    if (navBtn) navBtn.classList.add("ticket-unread");
    if (App.state.currentSection === "tickets") App.renderTickets();
  };

  App.SKILLS_DEF = {
    negocjator: {
      id: "negocjator",
      name: "Negocjator",
      lpCost: 30,
      goldCost: 6000,
      description:
        "Twoje zdolności negocjacyjne sprawiają, że Kupiec płaci ci o 5% więcej za każdy sprzedany przedmiot. Efekt stały, działa automatycznie.",
    },
    tropiciel: {
      id: "tropiciel",
      name: "Tropiciel",
      lpCost: 30,
      goldCost: 7000,
      description:
        "Nauczyłeś się przewidywać ruchy bestii Khorinis. Czas oczekiwania na kolejnego potwora podczas polowania skraca się o 1,5 sekundy.",
    },
    rolnik: {
      id: "rolnik",
      name: "Farmer",
      lpCost: 20,
      goldCost: 4000,
      description:
        "Twoja działka powiększa się o 3 dodatkowe kratki uprawne, pozwalając hodować więcej ziół jednocześnie.",
    },
    nadzorca_kopalni: {
      id: "nadzorca_kopalni",
      name: "Nadzorca Kopalni",
      lpCost: 40,
      goldCost: 8000,
      description:
        "Zarządzasz pracą kopalni i zbierasz urobek z całej zmiany. Co 10 godzin możesz odebrać 10 bryłek każdego surowca (ruda, węgiel, siarka, złoto).",
    },
    straznik: {
      id: "straznik",
      name: "Strażnik",
      lpCost: 10,
      goldCost: 2000,
      description:
        "Twoje doświadczenie bojowe i nieskazitelna reputacja pozwalają ci negocjować podwójną stawkę za każdą godzinę warty.",
    },
    kieszonkowiec: {
      id: "kieszonkowiec",
      name: "Kradzież kieszonkowa",
      lpCost: 10,
      goldCost: 2000,
      description:
        "Znasz mroczne zaułki Khorinis i wiesz gdzie szukać Gildii Złodziei. Możesz okradać innych mieszkańców miasta.",
    },
    przezorny: {
      id: "przezorny",
      name: "Przezorny",
      lpCost: 30,
      goldCost: 5000,
      description:
        "Twoja czujność i ostrożność sprawiają, że złodzieje omijają cię szerokim łukiem. Nikt nigdy nie będzie mógł cię okraść.",
    },
    otwieranie_zamkow: {
      id: "otwieranie_zamkow",
      name: "Otwieranie zamków",
      lpCost: 5,
      goldCost: 1000,
      description:
        "Znasz sekrety mechanizmów zamkowych. Możesz włamywać się do zamożnych domostw Górnego Miasta Khorinis.",
    },
  };

  App.renderSkills = function () {
    const container = document.getElementById("skills-container");
    if (!container) return;
    const char = App.state.character;
    if (!char) return;
    const skills = char.skills || {};
    const lp = char.learningPoints || 0;
    let html =
      '<div class="skills-lp-info">Dostępne Punkty Nauki: <strong>' +
      lp +
      "</strong></div>";
    html += '<div class="skills-grid">';
    for (const sid in App.SKILLS_DEF) {
      const sk = App.SKILLS_DEF[sid];
      const owned = !!skills[sid];
      const canAfford = lp >= sk.lpCost && (char.gold || 0) >= sk.goldCost;
      html +=
        '<div class="skill-card' + (owned ? " skill-card-owned" : "") + '">';
      html +=
        '<div class="skill-card-header"><span class="skill-name">' +
        esc(sk.name) +
        "</span>";
      if (owned) html += '<span class="skill-owned-badge">✓ Posiadasz</span>';
      html += "</div>";
      html += '<div class="skill-desc">' + esc(sk.description) + "</div>";
      html +=
        '<div class="skill-cost"><span class="skill-cost-lp">📖 ' +
        sk.lpCost +
        ' PN</span><span class="skill-cost-gold">◈ ' +
        sk.goldCost +
        " złota</span></div>";
      if (!owned) {
        html +=
          '<button class="btn btn-primary btn-sm skill-buy-btn" ' +
          (canAfford ? "" : "disabled") +
          " onclick=\"App.confirmBuySkill('" +
          sid +
          "')\">" +
          (canAfford ? "Naucz się" : "Za mało zasobów") +
          "</button>";
      }
      html += "</div>";
    }
    html += "</div>";

    const learnedCount = Object.keys(skills).filter(function (k) {
      return skills[k];
    }).length;
    if (learnedCount > 0) {
      const resetCount = char.skillResetCount || 0;
      const costLabel =
        resetCount === 0 ? "Darmowy (1. reset)" : "15 000 złota";
      html +=
        '<div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);text-align:center">';
      html +=
        '<button class="btn btn-danger btn-sm" onclick="App.openSkillResetModal()">⚠ Zresetuj umiejętności (' +
        costLabel +
        ")</button>";
      html += "</div>";
    }

    container.innerHTML = html;
  };

  App.openSkillResetModal = function () {
    const char = App.state.character;
    if (!char) return;
    const skills = char.skills || {};
    const resetCount = char.skillResetCount || 0;
    const isFree = resetCount === 0;
    const learnedIds = Object.keys(skills).filter(function (k) {
      return skills[k] && App.SKILLS_DEF[k];
    });
    const totalLp = learnedIds.reduce(function (sum, id) {
      return sum + (App.SKILLS_DEF[id].lpCost || 0);
    }, 0);

    let listHtml =
      '<ul style="margin:10px 0 14px;padding-left:18px;color:var(--text2);font-size:0.88rem">';
    learnedIds.forEach(function (id) {
      const sk = App.SKILLS_DEF[id];
      listHtml +=
        "<li>" +
        esc(sk.name) +
        ' <span style="color:var(--text3)">(' +
        sk.lpCost +
        " PN)</span></li>";
    });
    listHtml += "</ul>";

    let costHtml;
    if (isFree) {
      costHtml =
        '<div style="color:#81c784;font-size:0.88rem;margin-bottom:6px">✓ Pierwszy reset jest <strong>darmowy</strong>.</div>';
    } else {
      const gold = char.gold || 0;
      const enough = gold >= 15000;
      costHtml =
        '<div style="color:' +
        (enough ? "var(--text2)" : "#e57373") +
        ';font-size:0.88rem;margin-bottom:6px">' +
        "Koszt: <strong>15 000 złota</strong> (masz: " +
        gold +
        " zł)" +
        (enough ? "" : " — <strong>za mało złota!</strong>") +
        "</div>";
    }

    const body = document.getElementById("skill-reset-modal-body");
    if (body) {
      body.innerHTML =
        '<p style="color:var(--text2);font-size:0.9rem;margin-bottom:8px">Zostaną usunięte następujące umiejętności:</p>' +
        listHtml +
        '<div style="color:var(--gold2);font-size:0.9rem;margin-bottom:10px">Zwrot: <strong>' +
        totalLp +
        " Punktów Nauki</strong></div>" +
        costHtml +
        '<p style="color:#e57373;font-size:0.82rem">Uwaga: złoto wydane na naukę umiejętności <strong>nie jest zwracane</strong>.</p>';
    }

    const modal = document.getElementById("skill-reset-modal");
    const okBtn = document.getElementById("skill-reset-ok");
    const cancelBtn = document.getElementById("skill-reset-cancel");
    if (!modal || !okBtn || !cancelBtn) return;

    const canReset = isFree || (char.gold || 0) >= 15000;
    okBtn.disabled = !canReset;

    modal.classList.remove("hidden");

    const doOk = function () {
      modal.classList.add("hidden");
      okBtn.removeEventListener("click", doOk);
      cancelBtn.removeEventListener("click", doCancel);
      App.resetSkills();
    };
    const doCancel = function () {
      modal.classList.add("hidden");
      okBtn.removeEventListener("click", doOk);
      cancelBtn.removeEventListener("click", doCancel);
    };
    okBtn.addEventListener("click", doOk);
    cancelBtn.addEventListener("click", doCancel);
  };

  App.resetSkills = async function () {
    try {
      const r = await fetch("/api/game/skills/reset", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("mg_token"),
        },
      });
      const data = await r.json();
      if (!r.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.character = data.character;
      App.fixServerTimestamps(App.state.character);
      App.updateCharacterUI(App.state.character);
      App.renderSkills();
      if (App.state.currentSection === "farm") App.renderFarm();
      App.showNotification(
        "Umiejętności zresetowane. Zwrócono " +
          data.returnedLp +
          " Punktów Nauki.",
        "levelup",
      );
      App.state.titlesData = null;
      if (App.state.socket) App.state.socket.emit("titles_get");
    } catch (e) {
      App.showNotification("Błąd połączenia z serwerem.", "error");
    }
  };

  App.renderThievesGuild = async function () {
    const container = document.getElementById("thieves-guild-content");
    if (!container) return;
    const char = App.state.character;
    if (!char) return;

    const hasPickpocket = !!(char.skills && char.skills.kieszonkowiec);
    const hasLockpick = !!(char.skills && char.skills.otwieranie_zamkow);

    if (!hasPickpocket && !hasLockpick) {
      container.innerHTML =
        '<div style="color:var(--text3);text-align:center;padding:20px">Ładowanie...</div>';
      var noSkillVictimLog = [];
      try {
        var nsr = await fetch("/api/game/thieves-guild", {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("mg_token"),
          },
        });
        var nsd = await nsr.json();
        if (nsr.ok && nsd.victimLog) noSkillVictimLog = nsd.victimLog;
      } catch (e) {}
      var noSkillLogHtml = "";
      if (noSkillVictimLog.length) {
        noSkillLogHtml =
          '<div style="border-top:1px solid var(--border);margin-top:24px;padding-top:20px"><div class="thieves-log-title">🗡 Kto mnie napadał</div><div class="thieves-log">';
        noSkillVictimLog.forEach(function (entry) {
          var d = new Date(entry.timestamp);
          var ts =
            d.toLocaleDateString("pl") +
            " " +
            d.toLocaleTimeString("pl", { hour: "2-digit", minute: "2-digit" });
          var cls = entry.success ? "thieves-log-fail" : "thieves-log-success";
          var icon = entry.success ? "✗" : "⚡";
          var desc = entry.success
            ? "<strong>" +
              esc(entry.otherName) +
              "</strong> okradł cię na <strong>" +
              entry.gold +
              " złota</strong>"
            : "<strong>" +
              esc(entry.otherName) +
              "</strong> próbował cię okraść — uciekłeś";
          noSkillLogHtml +=
            '<div class="thieves-log-row ' +
            cls +
            '"><span class="thieves-log-icon">' +
            icon +
            '</span><span class="thieves-log-time">' +
            ts +
            '</span><span class="thieves-log-desc">' +
            desc +
            "</span></div>";
        });
        noSkillLogHtml += "</div></div>";
      }
      container.innerHTML =
        '<div class="panel-box">' +
        '<div class="panel-box-body" style="padding:40px 20px">' +
        '<div style="text-align:center">' +
        '<div style="font-size:2.5rem;margin-bottom:16px">🗡</div>' +
        "<div style=\"font-size:1.1rem;color:var(--text);margin-bottom:8px;font-family:'Cinzel',serif\">Nieznane mroki Khorinis</div>" +
        '<div style="color:var(--text3);font-size:0.9rem;max-width:380px;margin:0 auto;line-height:1.6">Nie masz pojęcia gdzie znajduje się Gildia Złodziei i nic tu po Tobie.<br><br>Może umiejętność <strong style="color:var(--gold)">Kradzież kieszonkowa</strong> lub <strong style="color:var(--gold)">Otwieranie zamków</strong> coś zmieni...</div>' +
        "</div>" +
        noSkillLogHtml +
        "</div>" +
        "</div>";
      return;
    }

    container.innerHTML =
      '<div style="color:var(--text3);text-align:center;padding:20px">Ładowanie...</div>';

    let data;
    try {
      const r = await fetch("/api/game/thieves-guild", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("mg_token"),
        },
      });
      data = await r.json();
      if (!r.ok) {
        container.innerHTML =
          '<div class="panel-box"><div class="panel-box-body" style="color:var(--error);padding:20px">' +
          esc(data.error || "Błąd") +
          "</div></div>";
        return;
      }
    } catch (e) {
      container.innerHTML =
        '<div class="panel-box"><div class="panel-box-body" style="color:var(--error);padding:20px">Błąd połączenia.</div></div>';
      return;
    }

    var burglaryHtml = "";
    if (hasLockpick) {
      var burglaryRemaining = data.burglaryRemaining || 0;
      burglaryHtml =
        '<div class="thieves-targets-title">🔓 Włamanie do Górnego Miasta</div>';
      if (burglaryRemaining > 0) {
        var bRem = App._thievesFormatCd(burglaryRemaining);
        burglaryHtml +=
          '<div class="thieves-cooldown">' +
          '<div class="thieves-cd-icon">⏳</div>' +
          '<div class="thieves-cd-title">Straż jest czujna</div>' +
          '<div class="thieves-cd-msg">Za dużo aktywności w Górnym Mieście. Następna próba za:</div>' +
          '<div class="thieves-cd-timer" id="burglary-cd-display">' +
          bRem +
          "</div>" +
          "</div>";
        App._burglaryCdUntil = data.burglaryUntil;
        App._startBurglaryCdTick();
      } else {
        burglaryHtml +=
          '<div class="thieves-burglary-box">' +
          '<div class="thieves-burglary-desc">Znasz sekretne wejście do Górnego Miasta. Możesz spróbować okraść zamożne domostwo.<br><span style="color:var(--text3);font-size:0.82rem">Szansa na sukces: 50% &bull; Nagroda: złoto + Złote Puchary &bull; Cooldown: 5 godzin</span></div>' +
          '<button class="btn btn-danger btn-sm" id="burglary-btn" onclick="App.attemptBurglary()">🔓 Włam się do Górnego Miasta</button>' +
          "</div>";
      }
    }

    var targetsHtml = "";
    if (hasPickpocket) {
      var cooldown = data.cooldownRemaining || 0;
      var targets = data.targets || [];
      if (hasLockpick) {
        targetsHtml =
          '<div class="thieves-targets-title" style="margin-top:20px">🗡 Kradzież kieszonkowa</div>';
      }
      if (cooldown > 0) {
        var rem = App._thievesFormatCd(cooldown);
        targetsHtml +=
          '<div class="thieves-cooldown">' +
          '<div class="thieves-cd-icon">⏳</div>' +
          '<div class="thieves-cd-title">Zbyt ryzykownie</div>' +
          '<div class="thieves-cd-msg">Straż jest teraz czujna. Następna próba możliwa za:</div>' +
          '<div class="thieves-cd-timer" id="thieves-cd-display">' +
          rem +
          "</div>" +
          "</div>";
        App._thievesCdUntil = data.cooldownUntil;
        App._startThievesCdTick();
      } else if (!targets.length) {
        targetsHtml +=
          '<div class="thieves-empty"><div style="font-size:1.5rem">🔍</div><div>Nie znaleziono odpowiednich celów w Khorinis.<br><small style="color:var(--text3)">Szukasz graczy powyżej poziomu 10 posiadających co najmniej 2000 złota.</small></div></div>';
      } else {
        if (!hasLockpick)
          targetsHtml += '<div class="thieves-targets-title">Wybierz cel</div>';
        targetsHtml += '<div class="thieves-targets">';
        targets.forEach(function (t) {
          targetsHtml +=
            '<div class="thieves-target-card">' +
            '<div class="thieves-target-info">' +
            '<span class="thieves-target-name">⚔ ' +
            esc(t.name) +
            "</span>" +
            '<span class="thieves-target-level">Poziom ' +
            t.level +
            "</span>" +
            "</div>" +
            '<button class="btn btn-danger btn-sm thieves-rob-btn" onclick="App.attemptRob(\'' +
            esc(t.userId) +
            "','" +
            esc(t.name) +
            "')\">" +
            "🗡 Okradnij" +
            "</button>" +
            "</div>";
        });
        targetsHtml += "</div>";
      }
    }

    var logHtml = "";
    var burglaryLog = data.burglaryLog || [];
    var robberyLog = data.robberyLog || [];

    if (hasLockpick && burglaryLog.length) {
      logHtml +=
        '<div class="thieves-log-title">📜 Historia włamań</div><div class="thieves-log">';
      burglaryLog.forEach(function (entry) {
        var d = new Date(entry.timestamp);
        var ts =
          d.toLocaleDateString("pl") +
          " " +
          d.toLocaleTimeString("pl", { hour: "2-digit", minute: "2-digit" });
        var cls = entry.success ? "thieves-log-success" : "thieves-log-fail";
        var icon = entry.success ? "✓" : "✗";
        var cups = entry.cups || 0;
        var desc = entry.success
          ? "Włamanie udane — zdobyłeś <strong>" +
            entry.gold +
            " złota</strong>" +
            (cups > 0
              ? " i " + cups + " Złot" + (cups === 1 ? "y Puchar" : "e Puchary")
              : "")
          : "Włamanie nieudane — ledwo uszedłeś z życiem";
        logHtml +=
          '<div class="thieves-log-row ' +
          cls +
          '"><span class="thieves-log-icon">' +
          icon +
          '</span><span class="thieves-log-time">' +
          ts +
          '</span><span class="thieves-log-desc">' +
          desc +
          "</span></div>";
      });
      logHtml += "</div>";
    }

    var victimLog = data.victimLog || [];
    if (!hasPickpocket && victimLog.length) {
      if (logHtml) logHtml += '<div style="margin-top:16px"></div>';
      logHtml +=
        '<div class="thieves-log-title">🗡 Kto mnie napadał</div><div class="thieves-log">';
      victimLog.forEach(function (entry) {
        var d = new Date(entry.timestamp);
        var ts =
          d.toLocaleDateString("pl") +
          " " +
          d.toLocaleTimeString("pl", { hour: "2-digit", minute: "2-digit" });
        var cls = entry.success ? "thieves-log-fail" : "thieves-log-success";
        var icon = entry.success ? "✗" : "⚡";
        var desc = entry.success
          ? "<strong>" +
            esc(entry.otherName) +
            "</strong> okradł cię na <strong>" +
            entry.gold +
            " złota</strong>"
          : "<strong>" +
            esc(entry.otherName) +
            "</strong> próbował cię okraść — uciekłeś";
        logHtml +=
          '<div class="thieves-log-row ' +
          cls +
          '"><span class="thieves-log-icon">' +
          icon +
          '</span><span class="thieves-log-time">' +
          ts +
          '</span><span class="thieves-log-desc">' +
          desc +
          "</span></div>";
      });
      logHtml += "</div>";
    }

    if (hasPickpocket && robberyLog.length) {
      if (logHtml) logHtml += '<div style="margin-top:16px"></div>';
      logHtml +=
        '<div class="thieves-log-title">📜 Historia kradzieży</div><div class="thieves-log">';
      robberyLog.forEach(function (entry) {
        var d = new Date(entry.timestamp);
        var ts =
          d.toLocaleDateString("pl") +
          " " +
          d.toLocaleTimeString("pl", { hour: "2-digit", minute: "2-digit" });
        var isRobber = entry.role === "robber";
        var cls = entry.success ? "thieves-log-success" : "thieves-log-fail";
        var icon = entry.success ? "✓" : "✗";
        var desc = isRobber
          ? entry.success
            ? "Okradłeś <strong>" +
              esc(entry.otherName) +
              "</strong> na <strong>" +
              entry.gold +
              " złota</strong>"
            : "Próbowałeś okraść <strong>" +
              esc(entry.otherName) +
              "</strong> — ucieczka się nie powiodła"
          : entry.success
            ? "<strong>" +
              esc(entry.otherName) +
              "</strong> okradł cię na <strong>" +
              entry.gold +
              " złota</strong>"
            : "<strong>" +
              esc(entry.otherName) +
              "</strong> próbował cię okraść — udało ci się uciec";
        logHtml +=
          '<div class="thieves-log-row ' +
          cls +
          '"><span class="thieves-log-icon">' +
          icon +
          '</span><span class="thieves-log-time">' +
          ts +
          '</span><span class="thieves-log-desc">' +
          desc +
          "</span></div>";
      });
      logHtml += "</div>";
    }

    container.innerHTML =
      '<div class="panel-box">' +
      '<div class="thieves-guild-header">' +
      '<div class="thieves-guild-emblem">🗡</div>' +
      "<div>" +
      '<div class="thieves-guild-name">Gildia Złodziei Khorinis</div>' +
      '<div class="thieves-guild-sub">Działaj w cieniu. Ryzyko jest częścią gry.</div>' +
      "</div>" +
      "</div>" +
      '<div class="panel-box-body">' +
      '<div class="thieves-split">' +
      '<div class="thieves-left">' +
      burglaryHtml +
      targetsHtml +
      "</div>" +
      '<div class="thieves-right">' +
      (logHtml ||
        '<div class="thieves-empty"><div style="font-size:1.2rem">📜</div><div>Brak historii.</div></div>') +
      "</div>" +
      "</div>" +
      "</div>" +
      "</div>";
  };

  App._thievesCdUntil = null;
  App._thievesCdInterval = null;

  App._thievesFormatCd = function (ms) {
    var s = Math.ceil(ms / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    var pad = function (n) {
      return String(n).padStart(2, "0");
    };
    return pad(h) + ":" + pad(m) + ":" + pad(sec);
  };

  App._startThievesCdTick = function () {
    if (App._thievesCdInterval) clearInterval(App._thievesCdInterval);
    App._thievesCdInterval = setInterval(function () {
      var el = document.getElementById("thieves-cd-display");
      if (!el) {
        clearInterval(App._thievesCdInterval);
        App._thievesCdInterval = null;
        return;
      }
      var rem = App._thievesCdUntil
        ? Math.max(0, App._thievesCdUntil - Date.now())
        : 0;
      el.textContent = App._thievesFormatCd(rem);
      if (rem <= 0) {
        clearInterval(App._thievesCdInterval);
        App._thievesCdInterval = null;
        if (App.state.currentSection === "thieves") App.renderThievesGuild();
      }
    }, 1000);
  };

  App._burglaryCdUntil = null;
  App._burglaryCdInterval = null;

  App._startBurglaryCdTick = function () {
    if (App._burglaryCdInterval) clearInterval(App._burglaryCdInterval);
    App._burglaryCdInterval = setInterval(function () {
      var el = document.getElementById("burglary-cd-display");
      if (!el) {
        clearInterval(App._burglaryCdInterval);
        App._burglaryCdInterval = null;
        return;
      }
      var rem = App._burglaryCdUntil
        ? Math.max(0, App._burglaryCdUntil - Date.now())
        : 0;
      el.textContent = App._thievesFormatCd(rem);
      if (rem <= 0) {
        clearInterval(App._burglaryCdInterval);
        App._burglaryCdInterval = null;
        if (App.state.currentSection === "thieves") App.renderThievesGuild();
      }
    }, 1000);
  };

  App.attemptBurglary = async function () {
    var char = App.state.character;
    var msg =
      "50% szans na sukces. Niezależnie od wyniku — następna próba możliwa dopiero za 5 godzin.";
    if (
      char &&
      char.activity &&
      char.activity.type &&
      char.activity.type !== "null"
    ) {
      var actNames = {
        hunting: "Polowanie",
        guard: "Warta",
        brewing: "Warzenie mikstur",
        foraging: "Zbieractwo",
      };
      var actName = actNames[char.activity.type] || char.activity.type;
      msg +=
        "\n\nMasz aktywną aktywność: " + actName + ". Włamanie ją przerwie.";
      if (char.activity.type === "brewing")
        msg += " Stracisz wszystkie składniki z kolejki warzenia.";
    }
    var ok = await App.showConfirmAsync("Włamać się do Górnego Miasta?", msg);
    if (!ok) return;
    App._doBurglary();
  };

  App._doBurglary = async function () {
    var btn = document.getElementById("burglary-btn");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "...";
    }
    try {
      var r = await fetch("/api/game/burglary", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("mg_token"),
        },
      });
      var data = await r.json();
      if (!r.ok) {
        App.showNotification(data.error || "Błąd", "error");
        if (btn) {
          btn.disabled = false;
          btn.textContent = "🔓 Włam się do Górnego Miasta";
        }
        return;
      }
      if (data.character) {
        App.state.character = data.character;
        App.fixServerTimestamps(App.state.character);
        App.updateCharacterUI(App.state.character);
      }
      App.renderThievesGuild();
      if (data.success) {
        var cups = data.cups || 0;
        var cupsStr =
          cups > 0
            ? " i " + cups + " Złot" + (cups === 1 ? "y Puchar" : "e Puchary")
            : "";
        App.showNotification(
          "Włamanie udane! Zdobyłeś " + data.gold + " złota" + cupsStr + ".",
          "success",
        );
      } else {
        App.showNotification(
          "Włamanie nieudane. Ledwo uszedłeś z życiem.",
          "error",
        );
      }
    } catch (e) {
      App.showNotification("Błąd połączenia.", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "🔓 Włam się do Górnego Miasta";
      }
    }
  };

  App.attemptRob = function (targetId, targetName) {
    App.showConfirm(
      "Okraść " + targetName + "?",
      "50% szans na sukces.\nNiezależnie od wyniku — następna próba możliwa dopiero za 3 godziny.",
      function () {
        App._doRob(targetId, targetName);
      },
    );
  };

  App._doRob = async function (targetId, targetName) {
    const btn = document.querySelector(
      '.thieves-rob-btn[onclick*="' + targetId + '"]',
    );
    if (btn) {
      btn.disabled = true;
      btn.textContent = "...";
    }
    try {
      const r = await fetch("/api/game/thieves-guild/rob", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("mg_token"),
        },
        body: JSON.stringify({ targetId }),
      });
      const data = await r.json();
      if (!r.ok) {
        App.showNotification(data.error || "Błąd", "error");
        if (btn) {
          btn.disabled = false;
          btn.textContent = "🗡 Okradnij";
        }
        return;
      }
      if (data.success) {
        if (App.state.character && data.gold !== undefined)
          App.state.character.gold = data.gold;
        App.updateCharacterUI(App.state.character);
        App.showNotification(
          "Sukces! Okradłeś " + esc(data.robbedName) + " na 1000 złota!",
          "levelup",
        );
      } else {
        App.showNotification(
          "Nieudana próba. " + esc(data.robbedName) + " uciekł w tłumie.",
          "error",
        );
      }
      setTimeout(function () {
        if (App.state.currentSection === "thieves") App.renderThievesGuild();
      }, 800);
    } catch (e) {
      App.showNotification("Błąd połączenia z serwerem.", "error");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "🗡 Okradnij";
      }
    }
  };

  App.confirmBuySkill = function (skillId) {
    const sk = App.SKILLS_DEF[skillId];
    if (!sk) return;
    App.showConfirm(
      "Nauka umiejętności",
      'Czy na pewno chcesz nauczyć się "' +
        sk.name +
        '"?\nKoszt: ' +
        sk.lpCost +
        " Punktów Nauki + " +
        sk.goldCost +
        " złota.\nTego nie można cofnąć.",
      function () {
        App.buySkill(skillId);
      },
    );
  };

  App.buySkill = async function (skillId) {
    try {
      const r = await fetch("/api/game/skills/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("mg_token"),
        },
        body: JSON.stringify({ skillId }),
      });
      const data = await r.json();
      if (!r.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.character = data.character;
      App.updateCharacterUI(data.character);
      App.renderSkills();
      if (App.state.currentSection === "farm") App.renderFarm();
      if (App.state.currentSection === "guard") App.renderGuardView();
      if (App.state.currentSection === "shop") App.renderShop();
      App.showNotification(
        "Nauczyłeś się: " + App.SKILLS_DEF[skillId].name + "!",
        "levelup",
      );
      App.state.titlesData = null;
      if (App.state.socket) App.state.socket.emit("titles_get");
    } catch (e) {
      App.showNotification("Błąd połączenia z serwerem.", "error");
    }
  };

  App.claimMineLoot = async function () {
    try {
      const r = await fetch("/api/game/skills/mine-loot", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("mg_token"),
        },
      });
      const data = await r.json();
      if (!r.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.character = data.character;
      App.updateCharacterUI(data.character);
      App.renderMineLootBtn();
      App.showNotification(
        "Odebrano urobek: 10× ruda, węgiel, siarka, złoto!",
        "success",
      );
      if (App.state.currentSection === "bag") App.renderBag();
    } catch (e) {
      App.showNotification("Błąd połączenia z serwerem.", "error");
    }
  };

  App.renderMineLootBtn = function () {
    const el = document.getElementById("mine-loot-btn-wrap");
    if (!el) return;
    const char = App.state.character;
    if (!char || !char.skills || !char.skills.nadzorca_kopalni) {
      el.innerHTML = "";
      return;
    }
    const now = Date.now();
    const cooldown = 10 * 60 * 60 * 1000;
    const last = char.lastMineLootAt || 0;
    const diff = now - last;
    const ready = diff >= cooldown;
    const remMs = Math.max(0, cooldown - diff);
    const h = Math.floor(remMs / 3600000);
    const m = Math.floor((remMs % 3600000) / 60000);
    const cdText = ready
      ? ""
      : '<div class="mine-loot-cd">Dostępne za: ' + h + "h " + m + "min</div>";
    el.innerHTML =
      '<div class="mine-loot-wrap"><div class="mine-loot-title">⛏ Urobek Nadzorcy</div><button class="mine-loot-btn" ' +
      (ready ? "" : "disabled") +
      ' onclick="App.claimMineLoot()">' +
      (ready ? "Odbierz urobek (10× każdy surowiec)" : "Urobek niedostępny") +
      "</button>" +
      cdText +
      "</div>";
  };

  App.toggleKronika = function () {
    const body = document.getElementById("world-feed-body");
    const btn = document.getElementById("kronika-toggle-btn");
    if (!body || !btn) return;
    const hidden = body.style.display === "none";
    body.style.display = hidden ? "" : "none";
    btn.textContent = hidden ? "Ukryj" : "Pokaż";
    try {
      localStorage.setItem("kronika_hidden", hidden ? "0" : "1");
    } catch (e) {}
  };

  App.hazardState = {
    phase: "idle",
    betAmount: 0,
    positions: [0, 1, 2],
    pickedCup: null,
    correctCup: null,
    won: null,
    locked: false,
  };

  App.renderHazard = function () {
    const char = App.state.character;
    const cnt = document.getElementById("hazard-content");
    if (!cnt || !char) return;
    const hs = App.hazardState;
    const phase = hs.phase;

    const speech =
      phase === "idle"
        ? '"Hej, przybyszu! Chcesz zagrać w kubeczki? Postaw złoto, a ja zamieszam... znajdź kulkę, a podwoję twoją stawkę!"'
        : phase === "shuffling"
          ? '"Obserwuj pilnie... teraz zaczynam mieszać kubeczki!"'
          : phase === "picking"
            ? '"I co? Gdzie teraz jest kulka według ciebie? No, wskaż kubek!"'
            : phase === "revealing"
              ? '"Sprawdźmy razem... odsłaniamy..."'
              : hs.won
                ? '"Brawo, brawo! Dobry z ciebie obserwator! Trzymaj swój zarobek — na razie!"'
                : '"Ha Ha Ha! Tym razem Karczmarz wygrywa! Może następnym razem, przybyszu!"';

    const SLOT = [10, 120, 230];
    let cupsHtml = "";
    if (phase === "shuffling" || phase === "picking") {
      cupsHtml = '<div class="hazard-cups-row" id="hazard-cups-row">';
      for (let i = 0; i < 3; i++) {
        const left = SLOT[hs.positions[i]];
        const pickable = phase === "picking";
        cupsHtml +=
          '<div class="hazard-cup-wrapper" id="hazard-cup-' +
          i +
          '" style="left:' +
          left +
          'px">' +
          '<div class="hazard-cup-body' +
          (pickable ? " pickable" : "") +
          '" id="hazard-cup-body-' +
          i +
          '"' +
          (pickable ? ' onclick="App.pickCup(' + i + ')"' : "") +
          "></div>" +
          '<div class="hazard-ball" id="hazard-ball-' +
          i +
          '"></div>' +
          "</div>";
      }
      cupsHtml += "</div>";
    }

    let betHtml = "";
    if (phase === "idle") {
      betHtml =
        '<div class="hazard-bet-area">' +
        '<div class="hazard-bet-label">Wybierz stawkę:</div>' +
        '<div class="hazard-quick-bets">' +
        [500, 1000, 2000, 3000, 5000]
          .map(function (v) {
            var dis = char.gold < v;
            return (
              '<button class="hazard-quick-btn' +
              (dis ? " hqb-disabled" : "") +
              '"' +
              (dis ? " disabled" : ' onclick="App.hazardSetBet(' + v + ')"') +
              ">" +
              v +
              "</button>"
            );
          })
          .join("") +
        "</div>" +
        '<div class="hazard-input-row">' +
        '<input type="number" id="hazard-amount" class="hazard-amount-input" min="500" max="5000" ' +
        'value="' +
        Math.min(500, char.gold) +
        '" placeholder="500–5000">' +
        '<span class="hazard-currency">złota</span>' +
        "</div>" +
        '<button class="btn btn-primary hazard-start-btn" onclick="App.startGamble()">🎲 Zagraj!</button>' +
        '<div class="hazard-hint">Minimalna stawka: 500 · Maksymalna: 5 000 złota za jedno zagranie</div>' +
        "</div>";
    }

    var phaseMsg = "";
    if (phase === "shuffling") {
      phaseMsg =
        '<div class="hazard-phase-msg shuffling">Obserwuj kubeczki...</div>';
    } else if (phase === "picking") {
      phaseMsg = '<div class="hazard-phase-msg picking">👆 Wskaż kubek!</div>';
    }
    if (phase === "shuffling" || phase === "picking") {
      phaseMsg +=
        '<div class="hazard-bet-disp">Stawka: <strong>' +
        hs.betAmount +
        " złota</strong></div>";
    }

    var resultHtml = "";
    if (phase === "result") {
      var slotNames = ["lewym", "środkowym", "prawym"];
      var correctSlot = hs.positions[hs.correctCup];
      resultHtml =
        '<div class="hazard-result-wrap">' +
        '<div class="hazard-result-badge ' +
        (hs.won ? "win" : "loss") +
        '">' +
        (hs.won
          ? "🏆 WYGRAŁEŚ +" + hs.betAmount + " złota!"
          : "💸 PRZEGRAŁEŚ −" + hs.betAmount + " złota") +
        "</div>" +
        '<div class="hazard-result-detail">' +
        (hs.won
          ? "Doskonała obserwacja! Kula była pod wybranym kubkiem."
          : "Kula była pod " + slotNames[correctSlot] + " kubkiem.") +
        "</div>" +
        '<div class="hazard-result-gold">💰 Twoje złoto: <strong>' +
        char.gold +
        "</strong></div>" +
        '<button class="btn btn-primary" style="margin-top:14px" onclick="App.resetGamble()">Zagraj ponownie</button>' +
        "</div>";
    }

    cnt.innerHTML =
      '<div class="hazard-section">' +
      '<div class="hazard-innkeeper">' +
      '<div class="hazard-inn-icon">🍺</div>' +
      '<div class="hazard-inn-bubble">' +
      speech +
      "</div>" +
      "</div>" +
      '<div class="hazard-stats-bar">💰 Złoto: <strong>' +
      char.gold +
      "</strong></div>" +
      betHtml +
      phaseMsg +
      cupsHtml +
      resultHtml +
      "</div>";
  };

  App.startGamble = async function () {
    var char = App.state.character;
    var el = document.getElementById("hazard-amount");
    var amount = parseInt(el ? el.value : 0, 10);
    if (!Number.isInteger(amount) || amount < 500 || amount > 5000) {
      App.showNotification("Stawka musi wynosić od 500 do 5000 złota", "error");
      return;
    }
    if (!char || char.gold < amount) {
      App.showNotification("Za mało złota!", "error");
      return;
    }
    App.hazardState.betAmount = amount;
    App.hazardState.phase = "shuffling";
    App.hazardState.positions = [0, 1, 2];
    App.hazardState.pickedCup = null;
    App.hazardState.won = null;
    App.hazardState.locked = false;
    App.renderHazard();
    await App._hazardShuffle();
    App.hazardState.phase = "picking";
    App.renderHazard();
  };

  App._hazardShuffle = async function () {
    var delays = [350, 320, 290, 270, 260, 255, 250, 250, 270];
    for (var step = 0; step < delays.length; step++) {
      var a = Math.floor(Math.random() * 3);
      var b;
      do {
        b = Math.floor(Math.random() * 3);
      } while (b === a);
      var pa = App.hazardState.positions[a];
      var pb = App.hazardState.positions[b];
      App.hazardState.positions[a] = pb;
      App.hazardState.positions[b] = pa;
      App._applyCupPositions();
      await App._hazardSleep(delays[step]);
    }
    await App._hazardSleep(380);
  };

  App._applyCupPositions = function () {
    var SLOT = [10, 120, 230];
    for (var i = 0; i < 3; i++) {
      var el = document.getElementById("hazard-cup-" + i);
      if (el) el.style.left = SLOT[App.hazardState.positions[i]] + "px";
    }
  };

  App._hazardSleep = function (ms) {
    return new Promise(function (r) {
      setTimeout(r, ms);
    });
  };

  App.pickCup = async function (cupIndex) {
    var hs = App.hazardState;
    if (hs.phase !== "picking" || hs.locked) return;
    hs.locked = true;
    hs.pickedCup = cupIndex;

    document.querySelectorAll(".hazard-cup-body").forEach(function (el) {
      el.classList.remove("pickable");
      el.onclick = null;
    });
    var chosenBody = document.getElementById("hazard-cup-body-" + cupIndex);
    if (chosenBody) chosenBody.classList.add("chosen");

    var token = localStorage.getItem("mg_token");
    var data;
    try {
      var res = await fetch("/api/game/gamble", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ amount: hs.betAmount, pickedCup: cupIndex }),
      });
      data = await res.json();
      if (!res.ok) {
        hs.locked = false;
        hs.phase = "idle";
        App.renderHazard();
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
    } catch (e) {
      hs.locked = false;
      hs.phase = "idle";
      App.renderHazard();
      App.showNotification("Błąd połączenia", "error");
      return;
    }

    hs.won = data.win;
    hs.correctCup = data.correctCup;
    if (data.character) {
      App.state.character = data.character;
      App.updateCharacterUI(data.character);
    }
    hs.phase = "revealing";

    var phaseMsgEl = document.querySelector(".hazard-phase-msg");
    if (phaseMsgEl) phaseMsgEl.textContent = "Odsłaniamy...";

    var ballEl = document.getElementById("hazard-ball-" + data.correctCup);
    if (ballEl) ballEl.style.display = "block";

    await App._hazardSleep(350);

    var chosenBodyEl = document.getElementById("hazard-cup-body-" + cupIndex);
    if (chosenBodyEl) chosenBodyEl.classList.add("lifted");

    await App._hazardSleep(950);

    if (!data.win && data.correctCup !== cupIndex) {
      var correctBodyEl = document.getElementById(
        "hazard-cup-body-" + data.correctCup,
      );
      if (correctBodyEl) correctBodyEl.classList.add("lifted");
      await App._hazardSleep(950);
    }

    hs.phase = "result";
    App.renderHazard();
  };

  App.hazardSetBet = function (amount) {
    var el = document.getElementById("hazard-amount");
    if (el) el.value = amount;
  };

  App.resetGamble = function () {
    App.hazardState = {
      phase: "idle",
      betAmount: 0,
      positions: [0, 1, 2],
      pickedCup: null,
      correctCup: null,
      won: null,
      locked: false,
    };
    App.renderHazard();
  };

  App._prefetchCampState = async function () {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/camps/state", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) return;
      var data = await res.json();
      App.state.campData = data.camps;
      App.state.myCampId = data.myCampId || null;
      App.renderTavernMessages();
      if (App.state.myCampId) App._checkMonstrumBlink();
    } catch (e) {}
  };

  App._checkMonstrumBlink = async function () {
    var myCampId = App.state.myCampId;
    if (!myCampId) return;
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/monstrum/state", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) return;
      var json = await res.json();
      App.state.monstrumData = json.state;
      var cs = json.state && json.state[myCampId];
      if (cs && cs.state === "joining" && App.state.currentSection !== "camp") {
        App.state.campMonsterBlink = true;
        var btn = document.getElementById("nav-camp");
        if (btn) btn.classList.add("ticket-unread");
      }
    } catch (e) {}
  };

  App._getCampColorForUser = function (userId) {
    var cd = App.state.campData;
    if (!cd) return null;
    for (var id in cd) {
      var camp = cd[id];
      if (
        camp &&
        camp.members &&
        camp.members.some(function (m) {
          return m.userId === userId;
        })
      ) {
        return camp.color || null;
      }
    }
    return null;
  };

  App._isCommander = function (userId) {
    var cd = App.state.campData;
    if (!cd) return false;
    for (var id in cd) {
      var camp = cd[id];
      if (camp && camp.commander && camp.commander.userId === userId)
        return true;
    }
    return false;
  };

  App.renderCamp = async function () {
    var container = document.getElementById("camp-container");
    if (!container) return;
    var token = localStorage.getItem("mg_token");
    var char = App.state.character;
    if (!char) {
      container.innerHTML =
        '<div class="panel-box"><div class="panel-box-body" style="color:var(--text3)">Ładowanie...</div></div>';
      return;
    }
    container.innerHTML =
      '<div class="panel-box"><div class="panel-box-body" style="color:var(--text3)">Ładowanie danych obozów...</div></div>';
    try {
      var res = await fetch("/api/camps/state", {
        headers: { Authorization: "Bearer " + token },
      });
      if (!res.ok) {
        container.innerHTML =
          '<div class="panel-box"><div class="panel-box-body" style="color:#e05555">Błąd ładowania obozów.</div></div>';
        return;
      }
      var data = await res.json();
      App.state.campData = data.camps;
      App.state.myCampId = data.myCampId || null;
      App._renderCampUI(container, data);
      App.renderTavernMessages();
    } catch (e) {
      container.innerHTML =
        '<div class="panel-box"><div class="panel-box-body" style="color:#e05555">Błąd połączenia.</div></div>';
    }
  };

  App._renderCampUI = function (container, data) {
    var myCampId = data.myCampId || App.state.myCampId;
    var camps = data.camps || App.state.campData || {};
    var char = App.state.character;
    var html = "";
    if (!myCampId) {
      html += '<div class="panel-box"><div class="panel-box-body">';
      html +=
        "<div style=\"font-family:'Cinzel',serif;color:var(--gold);font-size:1rem;margin-bottom:10px\">Obozy Khorinis</div>";
      html +=
        '<div style="color:var(--text2);font-size:0.87rem;margin-bottom:6px">Wybierz swój obóz. <strong style="color:#e0b84b">Decyzja jest nieodwracalna — nie możesz zmienić obozu.</strong></div>';
      if ((char.level || 1) < 15) {
        html +=
          '<div style="color:#e05555;font-size:0.84rem;margin-bottom:14px">⚠ Wymagany poziom 15. Jesteś na poziomie ' +
          esc(String(char.level || 1)) +
          ".</div>";
      } else {
        html +=
          '<div style="color:var(--text3);font-size:0.83rem;margin-bottom:14px">Wymagany poziom: 15</div>';
      }
      html +=
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-top:4px">';
      var CAMP_IDS = ["swamp", "old", "new"];
      for (var ci = 0; ci < CAMP_IDS.length; ci++) {
        var cid = CAMP_IDS[ci];
        var camp = camps[cid];
        if (!camp) continue;
        var borderColor = camp.color || "#888";
        var canJoin = (char.level || 1) >= 15;
        html +=
          '<div style="background:var(--panel2);border:1px solid ' +
          esc(borderColor) +
          ";border-left:4px solid " +
          esc(borderColor) +
          ';border-radius:4px;padding:16px">';
        html +=
          "<div style=\"font-family:'Cinzel',serif;color:" +
          esc(borderColor) +
          ';font-size:0.95rem;margin-bottom:8px">' +
          esc(camp.name) +
          "</div>";
        html +=
          '<div style="color:var(--text3);font-size:0.82rem;margin-bottom:12px">' +
          esc(String(camp.memberCount || 0)) +
          " członków</div>";
        if (camp.commander) {
          html +=
            '<div style="font-size:0.82rem;color:var(--text2);margin-bottom:10px">Dowódca: <span style="color:var(--gold)">' +
            esc(camp.commander.charName) +
            "</span></div>";
        }
        if (canJoin) {
          html +=
            '<button class="btn btn-primary btn-sm" onclick="App.joinCamp(\'' +
            esc(cid) +
            '\')" style="font-size:0.82rem;padding:6px 16px">Dołącz</button>';
        }
        html += "</div>";
      }
      html += "</div></div></div>";
    } else {
      var myCamp = camps[myCampId];
      if (!myCamp) {
        container.innerHTML =
          '<div class="panel-box"><div class="panel-box-body" style="color:#e05555">Błąd danych obozu.</div></div>';
        return;
      }
      var myColor = myCamp.color || "#888";
      html +=
        '<div style="background:var(--panel2);border:1px solid ' +
        esc(myColor) +
        ";border-left:5px solid " +
        esc(myColor) +
        ';border-radius:4px;padding:14px 18px;margin-bottom:14px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">';
      html +=
        "<div style=\"font-family:'Cinzel',serif;color:" +
        esc(myColor) +
        ';font-size:1.05rem">' +
        esc(myCamp.name) +
        "</div>";
      if (myCamp.commander) {
        var termLeft = "";
        if (myCamp.commanderTermEndsAt) {
          var hoursLeft = Math.max(
            0,
            Math.ceil((myCamp.commanderTermEndsAt - Date.now()) / 3600000),
          );
          termLeft =
            ' <span style="color:var(--text3);font-size:0.78rem">(pozostało: ' +
            hoursLeft +
            "h)</span>";
        }
        html +=
          '<div style="font-size:0.85rem;color:var(--text2)">Dowódca: <span style="color:var(--gold)">' +
          esc(myCamp.commander.charName) +
          "</span>" +
          termLeft +
          "</div>";
      } else if (myCamp.voting && myCamp.voting.active) {
        var votingLeft = myCamp.voting.endsAt
          ? Math.max(
              0,
              Math.ceil((myCamp.voting.endsAt - Date.now()) / 3600000),
            )
          : 0;
        html +=
          '<div style="font-size:0.85rem;color:#e0b84b">⚙ Głosowanie trwa (jeszcze ' +
          votingLeft +
          "h)</div>";
      } else {
        html +=
          '<div style="font-size:0.85rem;color:var(--text3)">Brak dowódcy</div>';
      }
      html += "</div>";
      var activeTab = App.state.campTab || "members";
      html +=
        '<div style="display:flex;gap:4px;margin-bottom:12px;justify-content:center;flex-wrap:wrap">';
      var TABS = [
        ["members", "Członkowie"],
        ["voting", "Głosowanie"],
        ["bonus", "Bonusy"],
        ["monstrum", "⚔ Monstrum"],
      ];
      for (var ti = 0; ti < TABS.length; ti++) {
        var tId = TABS[ti][0],
          tLabel = TABS[ti][1];
        var isActive = activeTab === tId;
        var tabExtra = "";
        if (tId === "monstrum" && App.state.campMonsterBlink)
          tabExtra =
            ' style="font-size:0.83rem;padding:5px 0;width:110px;animation:ticket-blink 1s ease-in-out infinite"';
        else tabExtra = ' style="font-size:0.83rem;padding:5px 0;width:110px"';
        html +=
          '<button class="btn btn-' +
          (isActive ? "primary" : "secondary") +
          ' btn-sm" onclick="App.setCampTab(\'' +
          tId +
          "')\"" +
          tabExtra +
          ">" +
          tLabel +
          "</button>";
      }
      html += "</div>";
      html += '<div id="camp-tab-inner">';
      html += App._renderCampTabContent(activeTab, myCamp, myCampId, char);
      html += "</div>";
    }
    container.innerHTML = html;
    if (myCampId && activeTab === "monstrum") {
      var innerEl = document.getElementById("camp-tab-inner");
      if (innerEl) App._fetchAndRenderMonstrum(innerEl, myCampId);
    }
  };

  App._renderCampTabContent = function (tab, camp, myCampId, char) {
    var myUserId = char && char.userId;
    if (tab === "members") {
      var html = '<div class="panel-box"><div class="panel-box-body">';
      if (!camp.members || camp.members.length === 0) {
        html +=
          '<div style="color:var(--text3);font-size:0.86rem">Brak członków.</div>';
      } else {
        html +=
          '<table style="width:100%;border-collapse:collapse;font-size:0.85rem">';
        html += "<thead><tr>";
        html +=
          '<th style="text-align:left;padding:4px 8px;color:var(--text3);font-weight:normal;border-bottom:1px solid var(--border)">#</th>';
        html +=
          '<th style="text-align:left;padding:4px 8px;color:var(--text3);font-weight:normal;border-bottom:1px solid var(--border)">Postać</th>';
        html +=
          '<th style="text-align:right;padding:4px 8px;color:var(--text3);font-weight:normal;border-bottom:1px solid var(--border)">Poz.</th>';
        html +=
          '<th style="text-align:right;padding:4px 8px;color:var(--text3);font-weight:normal;border-bottom:1px solid var(--border)" title="Reputacja zdobyta przez pokonywanie potworów obozu">Rep.</th>';
        html += "</tr></thead>";
        html += "<tbody>";
        for (var i = 0; i < camp.members.length; i++) {
          var m = camp.members[i];
          var nameColor = m.isCommander ? "var(--gold)" : "var(--text)";
          var commanderBadge = m.isCommander
            ? ' <span style="font-size:0.72rem;color:var(--gold);background:rgba(200,168,75,0.12);padding:1px 5px;border-radius:2px;border:1px solid rgba(200,168,75,0.3)">Dowódca</span>'
            : "";
          var meBadge =
            m.userId === myUserId
              ? ' <span style="font-size:0.72rem;color:var(--text3)">(ty)</span>'
              : "";
          html += '<tr style="border-bottom:1px solid var(--border2)">';
          html +=
            '<td style="padding:5px 8px;color:var(--text3)">' +
            (i + 1) +
            "</td>";
          html +=
            '<td style="padding:5px 8px;color:' +
            esc(nameColor) +
            '">' +
            esc(m.charName) +
            commanderBadge +
            meBadge +
            "</td>";
          html +=
            '<td style="padding:5px 8px;text-align:right;color:var(--text2)">' +
            esc(String(m.level || 1)) +
            "</td>";
          html +=
            '<td style="padding:5px 8px;text-align:right;color:var(--text3)">' +
            esc(String(m.campReputation || 0)) +
            "</td>";
          html += "</tr>";
        }
        html += "</tbody></table>";
      }
      html += "</div></div>";
      return html;
    }
    if (tab === "voting") {
      var html = '<div class="panel-box"><div class="panel-box-body">';
      var voting = camp.voting || {};
      if (voting.active && voting.endsAt && Date.now() < voting.endsAt) {
        var hoursLeft = Math.max(
          0,
          Math.ceil((voting.endsAt - Date.now()) / 3600000),
        );
        html +=
          '<div style="color:#e0b84b;margin-bottom:12px;font-size:0.87rem">⚙ Głosowanie aktywne — kończy się za ' +
          hoursLeft +
          "h.</div>";
        var voteCounts = voting.voteCounts || {};
        var members = camp.members || [];
        if (members.length > 0) {
          html +=
            '<div style="font-size:0.85rem;color:var(--text2);margin-bottom:8px">Kandydaci:</div>';
          for (var mi = 0; mi < members.length; mi++) {
            var m = members[mi];
            var vCount = voteCounts[m.userId] ? voteCounts[m.userId].count : 0;
            var isMyVote = voting.myVote === m.userId;
            var voteBtn = "";
            if (camp.canVote && !isMyVote) {
              voteBtn =
                ' <button class="btn btn-secondary btn-sm" onclick="App.campVote(\'' +
                esc(m.userId) +
                '\')" style="font-size:0.78rem;padding:3px 10px">Zagłosuj</button>';
            } else if (isMyVote) {
              voteBtn =
                ' <span style="font-size:0.78rem;color:var(--gold)">✓ Twój głos</span>';
            }
            html +=
              '<div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid var(--border2)">';
            html +=
              '<span style="color:var(--text);font-size:0.85rem;flex:1">' +
              esc(m.charName) +
              (m.isCommander
                ? ' <span style="font-size:0.72rem;color:var(--gold)">(Dowódca)</span>'
                : "") +
              "</span>";
            html +=
              '<span style="color:var(--text3);font-size:0.82rem">' +
              vCount +
              " głos" +
              (vCount === 1 ? "" : "ów") +
              "</span>";
            html += voteBtn;
            html += "</div>";
          }
        }
        if (!camp.canVote && !voting.myVote) {
          var lastVote = camp.lastVoteAt || null;
          if (lastVote) {
            var nextVoteH = Math.ceil(
              (7 * 24 * 3600000 - (Date.now() - lastVote)) / 3600000,
            );
            html +=
              '<div style="color:var(--text3);font-size:0.82rem;margin-top:10px">Następne głosowanie za ' +
              Math.max(0, nextVoteH) +
              "h.</div>";
          } else {
            html +=
              '<div style="color:var(--text3);font-size:0.82rem;margin-top:10px">Wyczerpałeś już głos w tej turze.</div>';
          }
        }
      } else if (camp.commander && camp.commanderTermEndsAt) {
        var termLeftH = Math.max(
          0,
          Math.ceil((camp.commanderTermEndsAt - Date.now()) / 3600000),
        );
        html +=
          '<div style="color:var(--text2);font-size:0.87rem;margin-bottom:8px">Trwa kadencja dowódcy <span style="color:var(--gold)">' +
          esc(camp.commander.charName) +
          "</span>.</div>";
        html +=
          '<div style="color:var(--text3);font-size:0.83rem">Kolejne głosowanie za: <span style="color:var(--text2)">' +
          termLeftH +
          "h</span></div>";
      } else {
        html +=
          '<div style="color:var(--text3);font-size:0.86rem">Głosowanie nie jest aktualnie aktywne.</div>';
      }
      html += "</div></div>";
      return html;
    }
    if (tab === "bonus") {
      var html = '<div class="panel-box"><div class="panel-box-body">';
      var isCommander = camp.commander && camp.commander.userId === myUserId;
      var BONUSES = [
        {
          id: "xp10",
          name: "+10% EXP z polowania",
          desc: "Wszyscy członkowie obozu zdobywają 10% więcej doświadczenia z polowania.",
        },
        {
          id: "dmg10",
          name: "+10 obrażeń w walce",
          desc: "Wszyscy członkowie zadają o 10 więcej obrażeń podczas polowania.",
        },
        {
          id: "guard30",
          name: "+30% złota z warty",
          desc: "Wszyscy członkowie zarabiają 30% więcej złota podczas warty.",
        },
        {
          id: "brew5",
          name: "Warzenie w 5 minut",
          desc: "Wszystkie mikstury warzone przez członków zajmują tylko 5 minut.",
        },
      ];
      if (camp.bonus) {
        var activeBonusDef = null;
        for (var bi = 0; bi < BONUSES.length; bi++) {
          if (BONUSES[bi].id === camp.bonus.type) {
            activeBonusDef = BONUSES[bi];
            break;
          }
        }
        html +=
          '<div style="background:rgba(74,143,74,0.1);border:1px solid #3a7d44;border-radius:4px;padding:12px;margin-bottom:14px">';
        html +=
          '<div style="color:#4ab04a;font-size:0.9rem;margin-bottom:4px">✓ Aktywny bonus:</div>';
        html +=
          '<div style="color:var(--text);font-size:0.88rem;font-weight:600">' +
          esc(activeBonusDef ? activeBonusDef.name : camp.bonus.type) +
          "</div>";
        if (activeBonusDef)
          html +=
            '<div style="color:var(--text3);font-size:0.82rem;margin-top:4px">' +
            esc(activeBonusDef.desc) +
            "</div>";
        html += "</div>";
      } else {
        if (isCommander) {
          html +=
            '<div style="color:var(--text2);font-size:0.86rem;margin-bottom:12px">Jesteś dowódcą. Wybierz bonus dla swojego obozu:</div>';
          for (var bi = 0; bi < BONUSES.length; bi++) {
            var b = BONUSES[bi];
            html +=
              '<div style="background:var(--panel2);border:1px solid var(--border);border-radius:4px;padding:10px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;flex-wrap:wrap">';
            html +=
              '<div style="flex:1;min-width:160px"><div style="color:var(--text);font-size:0.87rem;font-weight:600">' +
              esc(b.name) +
              '</div><div style="color:var(--text3);font-size:0.8rem;margin-top:2px">' +
              esc(b.desc) +
              "</div></div>";
            html +=
              '<button class="btn btn-primary btn-sm" onclick="App.campSetBonus(\'' +
              esc(b.id) +
              '\')" style="font-size:0.82rem;padding:5px 14px">Aktywuj</button>';
            html += "</div>";
          }
        } else {
          html +=
            '<div style="color:var(--text3);font-size:0.86rem;margin-bottom:10px">Brak aktywnego bonusu. Dowódca może wybrać bonus na czas kadencji.</div>';
          html +=
            '<div style="font-size:0.84rem;color:var(--text2);margin-top:8px">Dostępne bonusy:</div>';
          for (var bi = 0; bi < BONUSES.length; bi++) {
            var b = BONUSES[bi];
            html +=
              '<div style="padding:7px 0;border-bottom:1px solid var(--border2)">';
            html +=
              '<div style="color:var(--text);font-size:0.85rem">' +
              esc(b.name) +
              "</div>";
            html +=
              '<div style="color:var(--text3);font-size:0.8rem">' +
              esc(b.desc) +
              "</div>";
            html += "</div>";
          }
        }
      }
      html += "</div></div>";
      return html;
    }
    return "";
  };

  App.setCampTab = function (tab) {
    if (App.state._monstrumTimer) {
      clearInterval(App.state._monstrumTimer);
      App.state._monstrumTimer = null;
    }
    App.state.campTab = tab;
    if (tab === "monstrum") {
      App.state.campMonsterBlink = false;
      var campBtn = document.getElementById("nav-camp");
      if (campBtn) campBtn.classList.remove("ticket-unread");
    }
    var container = document.getElementById("camp-tab-inner");
    if (!container) {
      App.renderCamp();
      return;
    }
    var myCampId = App.state.myCampId;
    var camps = App.state.campData;
    if (!myCampId || !camps) return;
    var myCamp = camps[myCampId];
    if (!myCamp) return;
    if (tab === "monstrum") {
      App._fetchAndRenderMonstrum(container, myCampId);
    } else {
      container.innerHTML = App._renderCampTabContent(
        tab,
        myCamp,
        myCampId,
        App.state.character,
      );
    }
  };

  App.joinCamp = async function (campId) {
    var CAMP_NAMES = {
      swamp: "Obóz na Bagnie",
      old: "Stary Obóz",
      new: "Nowy Obóz",
    };
    var campDisplayName = CAMP_NAMES[campId] || campId;
    if (
      !confirm(
        "Dołączyć do " + campDisplayName + "? Tej decyzji nie można cofnąć!",
      )
    )
      return;
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/camps/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ campId: campId }),
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.campData = data.camps;
      App.state.myCampId = data.myCampId;
      App.showNotification("Dołączyłeś do obozu!", "success");
      App.renderCamp();
    } catch (e) {
      App.showNotification("Błąd połączenia.", "error");
    }
  };

  App.campVote = async function (candidateUserId) {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/camps/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ candidateUserId: candidateUserId }),
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.campData = data.camps;
      App.showNotification("Głos oddany!", "success");
      App.setCampTab("voting");
    } catch (e) {
      App.showNotification("Błąd połączenia.", "error");
    }
  };

  App.campSetBonus = async function (bonusType) {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/camps/bonus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ bonusType: bonusType }),
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.campData = data.camps;
      App.showNotification("Bonus aktywowany!", "success");
      App.setCampTab("bonus");
    } catch (e) {
      App.showNotification("Błąd połączenia.", "error");
    }
  };

  App._MONSTRUM_ITEM_NAMES = {
    mikstura_lowcy: "Mikstura Łowcy",
    mikstura_wartownika: "Mikstura Wartownika",
    mikstura_wzrostu: "Mikstura Wzrostu",
    mikstura_kopacza: "Mikstura Kopacza",
    brylka_rudy: "Bryłka Rudy",
    brylka_zlota: "Bryłka Złota",
    brylka_siarki: "Bryłka Siarki",
    brylka_wegla: "Bryłka Węgla",
  };

  App._monstrumFmtCountdown = function (ms) {
    if (ms <= 0) return "00:00";
    var totalSec = Math.floor(ms / 1000);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    if (h > 0)
      return (
        h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0")
      );
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  };

  App._fetchAndRenderMonstrum = async function (container, myCampId) {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/monstrum/state", {
        headers: { Authorization: "Bearer " + token },
      });
      var data = await res.json();
      if (res.ok) App.state.monstrumData = data.state;
    } catch (e) {}
    App._renderMonstrumInContainer(container, myCampId);
    App._startMonstrumTimer(myCampId);
  };

  App._refreshMonstrumTab = function () {
    if (App.state.campTab !== "monstrum") return;
    var container = document.getElementById("camp-tab-inner");
    if (!container) return;
    var myCampId = App.state.myCampId;
    if (!myCampId) return;
    App._renderMonstrumInContainer(container, myCampId);
    App._startMonstrumTimer(myCampId);
  };

  App._startMonstrumTimer = function (myCampId) {
    if (App.state._monstrumTimer) {
      clearInterval(App.state._monstrumTimer);
      App.state._monstrumTimer = null;
    }
    App.state._monstrumTimer = setInterval(function () {
      if (
        App.state.campTab !== "monstrum" ||
        App.state.currentSection !== "camp"
      ) {
        clearInterval(App.state._monstrumTimer);
        App.state._monstrumTimer = null;
        return;
      }
      var cd =
        App.state.monstrumData && myCampId && App.state.monstrumData[myCampId];
      if (!cd) return;
      var now = Date.now();
      if (cd.state === "joining" && cd.joinWindowEndsAt) {
        var el = document.getElementById("monstrum-join-countdown");
        if (el) {
          var rem = cd.joinWindowEndsAt - now;
          if (rem <= 0) {
            App._refreshMonstrumTab();
            return;
          }
          el.textContent = App._monstrumFmtCountdown(rem);
        }
        var groupStr = (cd.participants || []).reduce(function (s, p) {
          return s + (p.strength || 0);
        }, 0);
        var gsEl = document.getElementById("monstrum-group-strength-val");
        if (gsEl) gsEl.textContent = groupStr.toLocaleString();
        var barEl = document.getElementById("monstrum-strength-bar-fill");
        if (barEl && cd.monster) {
          var pct = Math.min(
            100,
            Math.round((groupStr / cd.monster.strength) * 100),
          );
          barEl.style.width = pct + "%";
          barEl.style.background =
            pct >= 100 ? "var(--green2)" : "var(--gold2)";
        }
        var cntEl = document.getElementById("monstrum-participant-count");
        if (cntEl) cntEl.textContent = (cd.participants || []).length;
      } else if (cd.state === "idle" && cd.nextSpawnAt) {
        var el = document.getElementById("monstrum-spawn-countdown");
        if (el)
          el.textContent = App._monstrumFmtCountdown(cd.nextSpawnAt - now);
      }
    }, 1000);
  };

  App._renderMonstrumInContainer = function (container, myCampId) {
    var cd = App.state.monstrumData && App.state.monstrumData[myCampId];
    var myUserId = App.state.character && App.state.character.userId;
    var now = Date.now();
    var html = '<div class="panel-box"><div class="panel-box-body">';

    if (!cd) {
      html +=
        '<div style="color:var(--text3);font-size:0.86rem">Ładowanie...</div>';
      html += "</div></div>";
      container.innerHTML = html;
      return;
    }

    if (cd.state === "joining" && cd.monster) {
      var rem = Math.max(0, cd.joinWindowEndsAt - now);
      var groupStrength = (cd.participants || []).reduce(function (s, p) {
        return s + (p.strength || 0);
      }, 0);
      var alreadyIn = (cd.participants || []).some(function (p) {
        return p.userId === myUserId;
      });
      var pct =
        cd.monster.strength > 0
          ? Math.min(
              100,
              Math.round((groupStrength / cd.monster.strength) * 100),
            )
          : 0;
      var barColor = pct >= 100 ? "var(--green2)" : "var(--gold2)";

      html +=
        '<div style="background:rgba(224,74,74,0.08);border:1px solid rgba(224,74,74,0.3);border-radius:4px;padding:14px;margin-bottom:14px">';
      html +=
        "<div style=\"font-family:'Cinzel',serif;color:#e04a4a;font-size:0.95rem;margin-bottom:10px\">⚠ Potwór w pobliżu!</div>";
      html +=
        '<div style="font-size:1.05rem;color:var(--text);font-weight:600;margin-bottom:4px">' +
        esc(cd.monster.name) +
        "</div>";
      html +=
        '<div style="font-size:0.85rem;color:var(--text3);margin-bottom:12px">Siła potwora: <span style="color:#e04a4a;font-weight:600">' +
        cd.monster.strength.toLocaleString() +
        "</span></div>";
      html +=
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">';
      html +=
        '<div style="font-size:0.82rem;color:var(--text3)">Czas na dołączenie:</div>';
      html +=
        '<div id="monstrum-join-countdown" style="font-family:\'Cinzel\',serif;color:var(--gold);font-size:1rem;font-weight:700">' +
        App._monstrumFmtCountdown(rem) +
        "</div>";
      html += "</div>";
      if (!alreadyIn) {
        html +=
          '<button class="btn btn-primary" onclick="App.campJoinFight()" style="margin-bottom:14px;font-size:0.9rem;padding:8px 24px">⚔ Dołącz do walki</button>';
      } else {
        html +=
          '<div style="color:var(--green2);font-size:0.87rem;margin-bottom:14px">✓ Jesteś w grupie — czekaj na walkę!</div>';
      }
      html += "</div>";

      html += '<div style="margin-bottom:12px">';
      html +=
        '<div style="font-size:0.82rem;color:var(--text3);margin-bottom:6px">Siła grupy vs. potwór:</div>';
      html +=
        '<div style="background:var(--bg3);border-radius:3px;height:10px;overflow:hidden;margin-bottom:4px">';
      html +=
        '<div id="monstrum-strength-bar-fill" style="height:100%;width:' +
        pct +
        "%;background:" +
        barColor +
        ';transition:width 0.5s"></div>';
      html += "</div>";
      html +=
        '<div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text3)">';
      html +=
        '<span>Łączna siła: <strong id="monstrum-group-strength-val" style="color:var(--text2)">' +
        groupStrength.toLocaleString() +
        "</strong></span>";
      html +=
        '<span>Potrzeba: <strong style="color:#e04a4a">' +
        cd.monster.strength.toLocaleString() +
        "</strong></span>";
      html += "</div></div>";

      html += '<div style="margin-top:12px">';
      html +=
        '<div style="font-size:0.84rem;color:var(--text3);margin-bottom:8px">Grupa śmiałków (<span id="monstrum-participant-count">' +
        (cd.participants || []).length +
        "</span> os.):</div>";
      if ((cd.participants || []).length === 0) {
        html +=
          '<div style="color:var(--text3);font-size:0.82rem;font-style:italic">Nikt jeszcze nie dołączył...</div>';
      } else {
        html +=
          '<table style="width:100%;border-collapse:collapse;font-size:0.83rem">';
        html += "<thead><tr>";
        html +=
          '<th style="text-align:left;padding:3px 8px;color:var(--text3);font-weight:normal;border-bottom:1px solid var(--border)">Postać</th>';
        html +=
          '<th style="text-align:right;padding:3px 8px;color:var(--text3);font-weight:normal;border-bottom:1px solid var(--border)">Poz.</th>';
        html +=
          '<th style="text-align:right;padding:3px 8px;color:var(--text3);font-weight:normal;border-bottom:1px solid var(--border)" title="Obrażenia + Obrona">Siła</th>';
        html += "</tr></thead><tbody>";
        for (var pi = 0; pi < cd.participants.length; pi++) {
          var p = cd.participants[pi];
          var isMe = p.userId === myUserId;
          html += '<tr style="border-bottom:1px solid var(--border2)">';
          html +=
            '<td style="padding:4px 8px;color:' +
            (isMe ? "var(--gold)" : "var(--text)") +
            '">' +
            esc(p.charName) +
            (isMe
              ? ' <span style="font-size:0.72rem;color:var(--text3)">(ty)</span>'
              : "") +
            "</td>";
          html +=
            '<td style="padding:4px 8px;text-align:right;color:var(--text2)">' +
            (p.level || 1) +
            "</td>";
          html +=
            '<td style="padding:4px 8px;text-align:right;color:var(--text3)">' +
            (p.strength || 0) +
            "</td>";
          html += "</tr>";
        }
        html += "</tbody></table>";
      }
      html += "</div>";
    } else {
      html +=
        '<div style="font-size:0.82rem;color:var(--text3);margin-bottom:6px">Spokój... na razie.</div>';
      if (cd.nextSpawnAt && cd.nextSpawnAt > now) {
        html +=
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">';
        html +=
          '<span style="font-size:0.83rem;color:var(--text3)">Następny potwór za:</span>';
        html +=
          '<span id="monstrum-spawn-countdown" style="font-family:\'Cinzel\',serif;color:var(--gold);font-weight:700">' +
          App._monstrumFmtCountdown(cd.nextSpawnAt - now) +
          "</span>";
        html += "</div>";
      }
      if (cd.lastResult) {
        var lr = cd.lastResult;
        var lrColor = lr.won ? "var(--green2)" : "#e04a4a";
        var lrIcon = lr.won ? "✓" : "✗";
        html +=
          '<div style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:10px 12px;margin-top:4px">';
        html +=
          '<div style="font-size:0.78rem;color:var(--text3);margin-bottom:4px">Ostatnia walka:</div>';
        html +=
          '<div style="font-size:0.87rem;color:var(--text);margin-bottom:4px">' +
          esc(lr.monster ? lr.monster.name : "?") +
          "</div>";
        html +=
          '<div style="font-size:0.82rem;display:flex;gap:14px;flex-wrap:wrap">';
        html +=
          '<span style="color:' +
          lrColor +
          '">' +
          lrIcon +
          " " +
          (lr.won ? "Wygrana" : "Przegrana") +
          "</span>";
        html +=
          '<span style="color:var(--text3)">Siła grupy: ' +
          (lr.groupStrength || 0).toLocaleString() +
          "</span>";
        html +=
          '<span style="color:var(--text3)">Gracze: ' +
          (lr.participantCount || 0) +
          "</span>";
        html += "</div></div>";
      }
    }

    html +=
      '<div style="margin-top:16px;border-top:1px solid var(--border2);padding-top:10px">';
    html +=
      '<div style="font-size:0.78rem;color:var(--text3);margin-bottom:4px">Nagrody za zwycięstwo:</div>';
    html += '<div style="font-size:0.8rem;color:var(--text3);line-height:1.7">';
    html += "⚔ EXP: poziom × 5 &nbsp;|&nbsp; 💰 Złoto: poziom × 4<br>";
    html += "🧪 1× losowa mikstura &nbsp;|&nbsp; ⛏ 2× losowy surowiec<br>";
    html += "⭐ +1 Reputacja w obozie (tytuły)";
    html += "</div></div>";

    html += "</div></div>";
    container.innerHTML = html;
  };

  App.campJoinFight = async function () {
    var token = localStorage.getItem("mg_token");
    try {
      var res = await fetch("/api/monstrum/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      });
      var data = await res.json();
      if (!res.ok) {
        App.showNotification(data.error || "Błąd", "error");
        return;
      }
      App.state.monstrumData = data.state;
      App._refreshMonstrumTab();
      App.showNotification("Dołączyłeś do grupy!", "success");
    } catch (e) {
      App.showNotification("Błąd połączenia.", "error");
    }
  };

  App._showMonstrumRewardPopup = function (data) {
    var ITEM_NAMES = App._MONSTRUM_ITEM_NAMES;
    var overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px";
    var box = document.createElement("div");
    box.style.cssText =
      "background:var(--panel);border:1px solid var(--border);border-radius:6px;max-width:360px;width:100%;padding:22px 24px;text-align:center";
    if (data.won) {
      var items = (data.rewards && data.rewards.items) || [];
      var itemsHtml = items
        .map(function (id) {
          return ITEM_NAMES[id] || id;
        })
        .join(", ");
      box.innerHTML =
        "<div style=\"font-family:'Cinzel',serif;color:var(--gold);font-size:1.1rem;margin-bottom:12px\">⚔ Zwycięstwo!</div>" +
        '<div style="color:var(--text2);font-size:0.9rem;margin-bottom:16px">Twoja grupa pokonała <strong>' +
        esc(data.monsterName) +
        "</strong>!</div>" +
        '<div style="background:var(--bg3);border-radius:4px;padding:12px;text-align:left;margin-bottom:16px;font-size:0.85rem">' +
        '<div style="color:var(--text3);margin-bottom:6px">Nagrody:</div>' +
        '<div style="color:var(--text2);line-height:1.9">' +
        "💰 +" +
        (data.rewards ? data.rewards.gold : 0) +
        " złota<br>" +
        "✨ +" +
        (data.rewards ? data.rewards.exp : 0) +
        " EXP<br>" +
        "⭐ +1 Reputacja<br>" +
        "🎒 " +
        esc(itemsHtml) +
        "</div></div>" +
        '<button class="btn btn-primary btn-sm" onclick="this.closest(\'div[style*=fixed]\').remove()">OK</button>';
    } else {
      box.innerHTML =
        "<div style=\"font-family:'Cinzel',serif;color:#e04a4a;font-size:1.1rem;margin-bottom:12px\">💀 Porażka</div>" +
        '<div style="color:var(--text2);font-size:0.9rem;margin-bottom:16px">Wasza grupa poległa w walce z <strong>' +
        esc(data.monsterName) +
        "</strong>.</div>" +
        '<div style="color:var(--text3);font-size:0.83rem;margin-bottom:16px">Żadnych nagród. Następny potwór pojawi się za 2 godziny.</div>' +
        '<button class="btn btn-secondary btn-sm" onclick="this.closest(\'div[style*=fixed]\').remove()">Zamknij</button>';
    }
    overlay.appendChild(box);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.remove();
    });
    document.body.appendChild(overlay);
  };

  App.initKronika = function () {
    try {
      const hidden = localStorage.getItem("kronika_hidden") === "1";
      const body = document.getElementById("world-feed-body");
      const btn = document.getElementById("kronika-toggle-btn");
      if (hidden && body && btn) {
        body.style.display = "none";
        btn.textContent = "Pokaż";
      }
    } catch (e) {}
    App._renderKronikaFilterPanel();
  };

  return App;
})();

App.init();
