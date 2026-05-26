function connectSocketHandlers() {
  if (!App?.state?.socket) {
    setTimeout(connectSocketHandlers, 100);
    return;
  }
  App.state.socket.on("mine_state", onMineState);
  App.state.socket.on("mine_vein_update", onVeinUpdate);
  App.state.socket.on("mine_vein_spawned", onVeinSpawned);
}
connectSocketHandlers();

let autoMining = false;
let rafId;

let veinPriority = ["sulphur", "gold", "ore", "coal"];
let veinMap = {
  sulphur: "złoże siarki",
  gold: "złoże złota",
  ore: "złoże rudy",
  coal: "złoże węgla",
};

function onMineState(data) {
  App.state.mine = data;
}

function getPlayer() {
  return App.state.mine.players.find((p) => p.socketId === App.state.socket.id);
}

function onVeinUpdate(data) {
  const state = App.state.mine;
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

function onVeinSpawned(data) {
  App.state.mine.veins.push(data.vein);
}

function addPriorityPanel() {
  const controls = document.querySelector(
    "#mine-game-root > div > div.mine-mobile-controls",
  );
  if (!App.state.inMine) return;

  const panel = document.createElement("div");
  panel.id = "vein-priority-panel";
  panel.className = "vein-priority-panel";

  panel.innerHTML = `
    <div class="vein-priority-title">Priorytet kopania</div>
    <ul id="vein-priority-list" class="vein-priority-list"></ul>
  `;

  controls.appendChild(panel);

  renderPriorityList();
}

function renderPriorityList() {
  const list = document.getElementById("vein-priority-list");
  if (!list) return;
  list.innerHTML = "";

  veinPriority.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "vein-priority-item";
    li.dataset.type = entry;
    li.draggable = true;

    const rank = document.createElement("span");
    rank.className = "vein-rank";
    rank.textContent = index + 1;

    const name = document.createElement("span");
    name.className = "vein-name";
    name.textContent = veinMap[entry] || entry;

    li.append(rank, name);
    attachDragHandlers(li);
    list.appendChild(li);
  });
}

function attachDragHandlers(item) {
  const list = () => document.getElementById("vein-priority-list");

  item.addEventListener("dragstart", (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.dataset.type);
    setTimeout(() => (item.style.opacity = "0.4"), 0);
  });

  item.addEventListener("dragend", () => {
    item.style.opacity = "";
    list()
      .querySelectorAll("li")
      .forEach((li) => (li.style.outline = ""));
    syncPriorityFromDOM();
  });

  item.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    item.style.outline = "1.5px solid #1D9E75";
  });

  item.addEventListener("dragleave", () => {
    item.style.outline = "";
  });

  item.addEventListener("drop", (e) => {
    e.preventDefault();
    const srcType = e.dataTransfer.getData("text/plain");
    const srcEl = list().querySelector(`[data-type="${srcType}"]`);
    if (srcEl && srcEl !== item) {
      const items = [...list().children];
      const si = items.indexOf(srcEl);
      const di = items.indexOf(item);
      si < di
        ? list().insertBefore(srcEl, item.nextSibling)
        : list().insertBefore(srcEl, item);
    }
  });
}

function syncPriorityFromDOM() {
  const list = document.getElementById("vein-priority-list");
  if (!list) return;

  const domOrder = [...list.querySelectorAll("li")].map(
    (li) => li.dataset.type,
  );

  veinPriority.sort((a, b) => domOrder.indexOf(a) - domOrder.indexOf(b));

  // Update rank numbers
  list.querySelectorAll(".vein-rank").forEach((el, i) => {
    el.textContent = i + 1;
  });
}

function getNextVein() {
  const state = App.state.mine;
  for (const entry of veinPriority) {
    const vein = state.veins.find((v) => v.materialType === entry);
    if (vein) return vein;
  }
  // Fallback: any vein
  return state.veins[0] ?? null;
}

function renderAutoMineButton() {
  const actionsDiv = document.querySelector(
    "#mine-game-root > div > div.mine-mobile-controls > div.mine-action-btns",
  );
  if (!App.state.inMine) return;

  const button = document.createElement("button");
  button.textContent = "Auto Mine";
  button.className = "btn btn-primary mine-action-btn";
  button.addEventListener("click", () => {
    autoMining = !autoMining;
    button.textContent = autoMining ? "Stop Auto Mine" : "Auto Mine";
    if (autoMining) {
      startAutoMining();
    }
  });

  actionsDiv.appendChild(button);
}

function startAutoMining() {
  if (rafId) clearTimeout(rafId);
  _loop(performance.now());
}

let SPEED = 140;
let VIRT_W = 800;
let VIRT_H = 500;
function _autoMine(dt) {
  const me = getPlayer();
  if (!me.miningVeinId) {
    const vein = getNextVein();

    if (Math.hypot(me.x - vein.x, me.y - vein.y) > 20) {
      let dx = 0;
      let dy = 0;
      if (me.y > vein.y && Math.abs(me.y - vein.y) > 10) dy -= 1;
      if (me.y < vein.y && Math.abs(me.y - vein.y) > 10) dy += 1;
      if (me.x > vein.x && Math.abs(me.x - vein.x) > 10) dx -= 1;
      if (me.x < vein.x && Math.abs(me.x - vein.x) > 10) dx += 1;
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
      App.state.socket.emit("mine_move", { x: me.x, y: me.y });
    } else {
      console.log("Starting mining");
      App.state.socket.emit("mine_start_mining", { veinId: vein.id });
      me.miningVeinId = vein.id;
    }
  } else {
    const vein = getNextVein();
    if (vein.id !== me.miningVeinId) {
      App.state.socket.emit("mine_cancel_mining");
      me.miningVeinId = null;
    }
  }
}

let lastTickTime = 0;
function _loop(now) {
  if (!autoMining) {
    if (rafId) clearTimeout(rafId);
    return;
  }

  var dt = Math.min((now - lastTickTime) / 1000, 0.1);
  lastTickTime = now;
  _autoMine(dt);
  rafId = setTimeout(() => _loop(performance.now()), 1000 / 60); // ~60 fps
}

function renderAutoMinePriority() {
  const priorityDiv = document.querySelector(
    "#mine-game-root > div > div.mine-mobile-controls > div.mine-priority",
  );
  if (!App.state.inMine) return;

  const button = document.createElement("button");
  button.textContent = "Prioritize Rich Veins";
  button.className = "btn btn-secondary mine-action-btn";
  let prioritizeRich = false;
  button.addEventListener("click", () => {
    prioritizeRich = !prioritizeRich;
    button.textContent = prioritizeRich
      ? "Stop Prioritizing Rich Veins"
      : "Prioritize Rich Veins";
  });
  priorityDiv.appendChild(button);
}
