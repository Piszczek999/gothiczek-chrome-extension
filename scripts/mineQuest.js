Ext.initMineQuest = function () {
  hookFunction(App.mineGame, "_doEnter", Ext.connect);
  hookFunction(App.mineGame, "leave", Ext.disconnect);
};

Ext.connect = function () {
  Ext.renderMineQuest();

  socket.on("mine_result", () => Ext.updateMineQuest());
};

Ext.disconnect = function () {
  socket.off("mine_result");
};

Ext.renderMineQuest = function () {
  if (!App.state.inMine) return;

  const controls = document.querySelector("#mine-game-root > div");
  if (!controls) {
    App.showNotification("Nie można znaleźć panelu kontrolnego w kopalni.");
    return;
  }

  const questPanel = document.createElement("div");
  questPanel.id = "mine-quest-container";
  questPanel.className = "vein-priority-panel";

  const index = 3; // insert at position 3

  if (index >= controls.children.length) {
    controls.appendChild(questPanel);
  } else {
    controls.insertBefore(questPanel, controls.children[index]);
  }

  Ext.updateMineQuest();
};

Ext.updateMineQuest = async function () {
  const questPanel = document.getElementById("mine-quest-container");
  try {
    const mqRes = await fetch("/api/game/mine-quest", {
      headers: { Authorization: "Bearer " + token },
    });

    const mqData = mqRes.ok ? await mqRes.json() : null;
    questPanel.innerHTML = Ext.buildMineQuestHtml(mqData);
  } catch (e) {
    console.trace();
    App.showNotification("Błąd połączenia", "error");
  }
};

Ext.claimMineQuest = async function () {
  try {
    const res = await fetch("/api/game/mine-quest/claim", {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
    });
    const data = await res.json();
    if (!res.ok) {
      console.trace();
      App.showNotification(data.error || "Błąd", "error");
      return;
    }
    App.state.character = data.character || App.state.character;
    App.fixServerTimestamps(App.state.character);
    App.updateCharacterUI(App.state.character);
    updateMineQuest();
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
    console.trace();
    App.showNotification("Błąd połączenia", "error");
  }
};

Ext.buildMineQuestHtml = function (data) {
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
          _oreItemName(r.itemId) +
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
      q.description +
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
        ? '<button class="btn btn-primary" style="max-width:200px;margin-top:12px" onclick="Ext.claimMineQuest()">Odbierz nagrodę</button>'
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
    (q ? q.title : "Zadania kopalni") +
    "</div>" +
    inner +
    "</div>"
  );
};
