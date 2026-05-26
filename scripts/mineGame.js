// ─── Socket setup ────────────────────────────────────────────────────────────

function connectSocketHandlers() {
  if (!App?.state?.socket) {
    console.log("Socket not ready, retrying mine game socket setup...");
    setTimeout(connectSocketHandlers, 100);
    return;
  }
  const { socket } = App.state;
  socket.on("mine_state", onMineState);
  socket.on("mine_vein_update", onVeinUpdate);
  socket.on("mine_vein_spawned", onVeinSpawned);
  console.log("Connected mine game socket handlers.");
}
connectSocketHandlers();

// ─── State ────────────────────────────────────────────────────────────────────
let mineGameInitialized = false;
let isWaiting = false;

let SPEED = 140;
const VIRT_W = 800;
const VIRT_H = 500;

let autoMining = false;
let loopTimerId = null;
let lastTickTime = 0;

let veinPriority = ["sulphur", "gold", "ore", "coal"];

const VEIN_LABELS = {
  sulphur: "złoże siarki",
  gold: "złoże złota",
  ore: "złoże rudy",
  coal: "złoże węgla",
};

// ─── Socket event handlers ────────────────────────────────────────────────────

function onMineState(data) {
  App.state.mine = data;
  mineGameInitialized = true;
}

function onVeinUpdate({ veinId, depleted, newCharges }) {
  const { veins } = App.state.mine;
  if (depleted) {
    App.state.mine.veins = veins.filter((v) => v.id !== veinId);
    if (getPlayer().miningVeinId === veinId) {
      App.showNotification("Złoże zostało wyczerpane.");
    }
    return;
  }
  const vein = veins.find((v) => v.id === veinId);
  if (vein) vein.charges = newCharges;
}

function onVeinSpawned(data) {
  App.state.mine.veins.push(data.vein);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPlayer() {
  return App.state.mine.players.find((p) => p.socketId === App.state.socket.id);
}

function getNextVein() {
  const { veins } = App.state.mine;
  for (const type of veinPriority) {
    const vein = veins.find((v) => v.materialType === type);
    if (vein) return vein;
  }
  return veins[0] ?? null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ─── Auto-mine loop ───────────────────────────────────────────────────────────

function startAutoMining() {
  automining = true;
  stopAutoMining();
  _loop(performance.now());
}

function stopAutoMining() {
  if (loopTimerId !== null) {
    clearTimeout(loopTimerId);
    loopTimerId = null;
  }
}

function _loop(now) {
  if (!autoMining) {
    stopAutoMining();
    return;
  }

  const dt = Math.min((now - lastTickTime) / 1000, 0.1);
  lastTickTime = now;

  try {
    _autoMineTick(dt);
  } catch (err) {
    console.error("[AutoMine] tick error:", err);
  }

  loopTimerId = setTimeout(() => _loop(performance.now()), 1000 / 60);
}

function _autoMineTick(dt) {
  if (!mineGameInitialized) {
    return;
  }
  const me = getPlayer();
  const vein = getNextVein();

  if (!me || !vein) {
    App.showNotification("Nie można znaleźć gracza lub złoża.");
    return;
  }

  if (!me.miningVeinId) {
    _moveOrMine(me, vein, dt);
  } else if (vein.id !== me.miningVeinId && !isWaiting) {
    isWaiting = true;
    setTimeout(
      () => {
        isWaiting = false;
        _cancelMining(me);
      },
      2000 + Math.random() * 2000,
    );
  }
}

function _moveOrMine(me, vein, dt) {
  if (isWaiting) return;
  const dist = Math.hypot(me.x - vein.x, me.y - vein.y);

  if (dist <= 20) {
    App.state.socket.emit("mine_start_mining", { veinId: vein.id });
    me.miningVeinId = vein.id;
    return;
  }

  let dx = Math.sign(vein.x - me.x);
  let dy = Math.sign(vein.y - me.y);

  // Stop axis movement when close enough on that axis
  if (Math.abs(me.x - vein.x) <= 10) dx = 0;
  if (Math.abs(me.y - vein.y) <= 10) dy = 0;

  if (dx === 0 && dy === 0) return;

  const len = Math.hypot(dx, dy);
  me.x = Math.round(clamp(me.x + (dx / len) * SPEED * dt, 8, VIRT_W - 8));
  me.y = Math.round(clamp(me.y + (dy / len) * SPEED * dt, 8, VIRT_H - 8));

  App.state.socket.emit("mine_move", { x: me.x, y: me.y });
}

function _cancelMining(me) {
  App.state.socket.emit("mine_cancel_mining");
  me.miningVeinId = null;
}

// ─── UI: Auto-mine button ─────────────────────────────────────────────────────

function renderAutoMineButton() {
  if (!App.state.inMine) return;

  const actionsDiv = document.querySelector(
    "#mine-game-root > div > div.mine-mobile-controls > div.mine-action-btns",
  );
  if (!actionsDiv) {
    App.showNotification("Nie można znaleźć panelu akcji w kopalni.");
    return;
  }

  const button = document.createElement("button");
  button.className = "btn btn-primary mine-action-btn";
  button.textContent = "Auto Mine";

  button.addEventListener("click", () => {
    autoMining = !autoMining;
    button.textContent = autoMining ? "Stop Auto Mine" : "Auto Mine";
    button.classList.toggle("active", autoMining);

    if (autoMining) {
      startAutoMining();
    }
  });

  actionsDiv.appendChild(button);
}

// ─── UI: Priority panel ───────────────────────────────────────────────────────

function addPriorityPanel() {
  if (!App.state.inMine) return;

  const controls = document.querySelector(
    "#mine-game-root > div > div.mine-mobile-controls",
  );
  if (!controls) {
    App.showNotification("Nie można znaleźć panelu kontrolnego w kopalni.");
    return;
  }

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
  if (!list) {
    App.showNotification("Nie można znaleźć listy priorytetów.");
    return;
  }

  list.innerHTML = "";

  veinPriority.forEach((type, index) => {
    const li = _createPriorityItem(type, index);
    list.appendChild(li);
  });
}

function _createPriorityItem(type, index) {
  const li = document.createElement("li");
  li.className = "vein-priority-item";
  li.dataset.type = type;
  li.draggable = true;

  const rank = Object.assign(document.createElement("span"), {
    className: "vein-rank",
    textContent: index + 1,
  });

  const name = Object.assign(document.createElement("span"), {
    className: "vein-name",
    textContent: VEIN_LABELS[type] ?? type,
  });

  li.append(rank, name);
  _attachDragHandlers(li);
  return li;
}

// ─── Drag-and-drop ────────────────────────────────────────────────────────────

function _attachDragHandlers(item) {
  const getList = () => document.getElementById("vein-priority-list");

  item.addEventListener("dragstart", (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.dataset.type);
    setTimeout(() => (item.style.opacity = "0.4"), 0);
  });

  item.addEventListener("dragend", () => {
    item.style.opacity = "";
    getList()
      .querySelectorAll("li")
      .forEach((li) => (li.style.outline = ""));
    _syncPriorityFromDOM();
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
    const list = getList();
    const srcEl = list.querySelector(`[data-type="${srcType}"]`);
    if (!srcEl || srcEl === item) return;

    const items = [...list.children];
    const srcIdx = items.indexOf(srcEl);
    const dstIdx = items.indexOf(item);

    list.insertBefore(srcEl, srcIdx < dstIdx ? item.nextSibling : item);
  });
}

function _syncPriorityFromDOM() {
  const list = document.getElementById("vein-priority-list");
  if (!list) return;

  const domOrder = [...list.querySelectorAll("li")].map(
    (li) => li.dataset.type,
  );
  veinPriority.sort((a, b) => domOrder.indexOf(a) - domOrder.indexOf(b));

  list.querySelectorAll(".vein-rank").forEach((el, i) => {
    el.textContent = i + 1;
  });
}
