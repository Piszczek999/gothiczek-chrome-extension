function addExpPerHourToMonsters() {
  const monsters = document.getElementById("monsters-grid");

  [...monsters.children].forEach((element, i) => {
    const monStats = element.querySelector(".mon-stats");

    const stat = document.createElement("span");
    stat.className = "mon-stat";

    const monsterInfo = App.state.gameData.monsters[i];

    const inner = document.createElement("span");
    inner.textContent = `Exp na godzinę: ${getExpPerHour(i).toFixed(2)}`;

    stat.appendChild(inner);

    monStats.appendChild(stat);
  });
}

function getExpPerHour(monsterId) {
  const monsterInfo = App.state.gameData.monsters[monsterId];
  const characterInfo = App.state.character;

  const huntTime = getHuntTime(monsterInfo.hp, characterInfo.damage);
  const expPerKill = monsterInfo.exp;
  return (3600 / huntTime) * expPerKill;
}

function getHuntTime(monsterHp, characterDamage) {
  return Math.ceil(monsterHp / characterDamage) * 1.5 + 6.5;
}

function getAvgGoldPerKill(monsterId) {
  const monsterInfo = App.state.gameData.monsters[monsterId];
  let sum = 0;
  monsterInfo.drops.forEach((drop) => {
    const itemInfo = App.state.gameData.items[drop.itemId];
    sum += itemInfo.price * drop.chance;
  });
  return sum;
}

function getGoldPerHour(monsterId) {
  const monsterInfo = App.state.gameData.monsters[monsterId];
  const characterInfo = App.state.character;

  const huntTime = getHuntTime(monsterInfo.hp, characterInfo.damage);
  const goldPerKill = getAvgGoldPerKill(monsterId);
  return (3600 / huntTime) * goldPerKill;
}

function addGoldPerHourToMonsters() {
  const monsters = document.getElementById("monsters-grid");

  [...monsters.children].forEach((element, i) => {
    const monStats = element.querySelector(".mon-stats");
    const stat = document.createElement("span");
    stat.className = "mon-stat";
    const monsterInfo = App.state.gameData.monsters[i];
    const inner = document.createElement("span");
    inner.textContent = `Złoto na godzinę: ${getGoldPerHour(i).toFixed(2)}`;
    stat.appendChild(inner);
    monStats.appendChild(stat);
  });
}
