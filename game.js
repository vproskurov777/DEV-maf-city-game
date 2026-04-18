const DEBUG = true;

const TEAM_NAMES = [
  "Клан Воронів",   // 1 → фіолетовий
  "Клан Тигрів",    // 2 → червоний
  "Клан Левів",     // 3 → помаранчевий
  "Клан Акул",      // 4 → голубий
  "Клан Вовків",    // 5 → білий
  "Клан Змій"       // 6 → зелений
];

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

const state = {
  teams: [],
  territories: [],
  deck: [],

  selectedTerritoryId: null,

  currentAction: null, // null | "attack" | "defense"
  actionSourceTerritoryId: null,
  actionTargetTerritoryId: null,

  selectedCardsForAction: [],

  plannedAttacks: [],
  plannedDefenses: [],

  currentRound: 1,
  currentPhase: "morning"
};

function createDeck() {
  const deck = [];

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }

  return deck;
}

function shuffleArray(array) {
  const newArray = [...array];

  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }

  return newArray;
}

function createTeams() {
  return TEAM_NAMES.map((name, index) => ({
    id: index + 1,
    name,
    cards: [],
    territoryIds: [],
    bonusPoints: 0
  }));
}

function drawCards(deck, count) {
  return {
    drawnCards: deck.slice(0, count),
    remainingDeck: deck.slice(count)
  };
}

function dealStartingCards(teams, deck) {
  let currentDeck = [...deck];

  for (const team of teams) {
    const { drawnCards, remainingDeck } = drawCards(currentDeck, 8);
    team.cards = drawnCards;
    currentDeck = remainingDeck;
  }

  return currentDeck;
}

function createTerritoriesFromMap() {
  return GAME_MAP.map(territory => ({
    ...territory,
    neighbors: [...territory.neighbors],
    isDefended: false
  }));
}

function assignStartingTerritories(teams, territories) {
  const startOrder = [
    "Вест-Сайд",
    "Айронхил",
    "Твінс",
    "Саузгейт",
    "Фейрмонт",
    "Хайленд"
  ];

  startOrder.forEach((territoryName, index) => {
    const team = teams[index];
    const territory = territories.find(item => item.name === territoryName);

    if (!territory) return;

    territory.ownerId = team.id;
    team.territoryIds.push(territory.id);
  });
}

function formatCard(card) {
  return `${card.rank}${card.suit}`;
}

function getTerritoryTypeLabel(type) {
  switch (type) {
    case TERRITORY_TYPES.START:
      return "Стартова";
    case TERRITORY_TYPES.BONUS_POINTS:
      return "+0.5 бала";
    case TERRITORY_TYPES.EXCHANGE:
      return "Обмін";
    case TERRITORY_TYPES.RESOURCE:
      return "1 ресурс";
    case TERRITORY_TYPES.EMPTY:
      return "Без бонусу";
    default:
      return "Невідомо";
  }
}

function getOwnerName(ownerId) {
  if (!ownerId) return "Немає";

  const team = state.teams.find(item => item.id === ownerId);
  return team ? team.name : "Невідомо";
}

function getTerritoryById(id) {
  return state.territories.find(territory => territory.id === id) || null;
}

function getNeighborNames(territory) {
  if (!territory.neighbors.length) {
    return "Поки не задані";
  }

  return territory.neighbors
    .map(neighborId => {
      const neighbor = getTerritoryById(neighborId);
      return neighbor ? neighbor.name : `ID ${neighborId}`;
    })
    .join(", ");
}

function getAvailableAttackTargets(fromTerritoryId) {
  const fromTerritory = getTerritoryById(fromTerritoryId);

  if (!fromTerritory || !fromTerritory.ownerId) {
    return [];
  }

  return fromTerritory.neighbors
    .map(id => getTerritoryById(id))
    .filter(Boolean)
    .filter(target => target.ownerId !== fromTerritory.ownerId);
}

function isOwnTerritory(territory) {
  return Boolean(territory && territory.ownerId);
}

function isEnemyOrNeutralTerritory(sourceTerritory, targetTerritory) {
  if (!sourceTerritory || !targetTerritory) {
    return false;
  }

  return targetTerritory.ownerId !== sourceTerritory.ownerId;
}

function isAvailableAttackTarget(territoryId) {
  if (!state.attackMode || !state.attackFromTerritoryId) {
    return false;
  }

  const targets = getAvailableAttackTargets(state.attackFromTerritoryId);
  return targets.some(target => target.id === territoryId);
}

function resetAttackState() {
  state.attackMode = false;
  state.attackFromTerritoryId = null;
  state.attackTargetTerritoryId = null;
}

function renderTeams(teams) {
  return `
    <div class="teams-list">
      ${teams.map(team => {
        const cardsHtml = team.cards.map(formatCard).join(", ");
        const territoriesHtml = team.territoryIds.join(", ") || "немає";

        return `
          <div class="team-card">
            <h3>${team.name}</h3>
            <p><strong>Карти:</strong> ${cardsHtml}</p>
            <p><strong>Території:</strong> ${territoriesHtml}</p>
            <p><strong>Додаткові бали:</strong> ${team.bonusPoints}</p>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderLegend() {
  return `
    <div class="legend">
      <div class="legend-item"><div class="legend-color owner-1"></div><span>Фіолетові</span></div>
      <div class="legend-item"><div class="legend-color owner-2"></div><span>Червоні</span></div>
      <div class="legend-item"><div class="legend-color owner-3"></div><span>Помаранчеві</span></div>
      <div class="legend-item"><div class="legend-color owner-4"></div><span>Блакитні</span></div>
      <div class="legend-item"><div class="legend-color owner-5"></div><span>Білі</span></div>
      <div class="legend-item"><div class="legend-color owner-6"></div><span>Зелені</span></div>
    </div>
  `;
}

function renderControls() {
  return `
    <div class="controls">
      <button class="control-button" id="enableAttackButton">Режим атаки</button>
      <button class="control-button secondary" id="cancelAttackButton">Скасувати атаку</button>
    </div>
  `;
}

function renderMap(territories, selectedTerritoryId) {
  return `
    <div class="map-wrapper">
      <div class="real-map" id="realMap">
        ${DEBUG ? `<div class="debug-coords" id="coordsBox">X: 0% | Y: 0%</div>` : ""}

        ${territories.map(territory => {
          const ownerClass = territory.ownerId ? `owner-${territory.ownerId}` : "owner-none";
          const selectedClass = territory.id === selectedTerritoryId ? "selected" : "";

          const attackAvailableClass =
            state.currentAction === "attack" &&
            state.actionSourceTerritoryId &&
            getAvailableAttackTargets(state.actionSourceTerritoryId).some(item => item.id === territory.id)
              ? "attack-available"
              : "";

          const attackSourceClass =
            state.currentAction === "attack" && territory.id === state.actionSourceTerritoryId
              ? "attack-source"
              : "";

          const defenseSourceClass =
            state.currentAction === "defense" && territory.id === state.actionSourceTerritoryId
              ? "defended"
              : "";

          return `
            <div
              class="territory-label ${ownerClass} ${selectedClass} ${attackAvailableClass} ${attackSourceClass} ${defenseSourceClass}"
              style="left: ${territory.x}%; top: ${territory.y}%;"
              title="${territory.name} | ${getTerritoryTypeLabel(territory.type)}"
              data-territory-id="${territory.id}"
            >
              ${territory.name}
            </div>
          `;
        }).join("")}
      </div>
    </div>
    ${renderLegend()}
  `;
}

function renderSelectedTerritoryInfo(selectedTerritoryId) {
  if (!selectedTerritoryId) {
    return `
      <div class="info-panel">
        <h3>Інформація про територію</h3>
        <p>Натисни на територію на карті, щоб побачити її дані.</p>
      </div>
    `;
  }

  const territory = getTerritoryById(selectedTerritoryId);

  if (!territory) {
    return `
      <div class="info-panel">
        <h3>Інформація про територію</h3>
        <p>Територію не знайдено.</p>
      </div>
    `;
  }

  return `
    <div class="info-panel">
      <h3>${territory.name}</h3>
      <p><strong>Тип:</strong> ${getTerritoryTypeLabel(territory.type)}</p>
      <p><strong>Власник:</strong> ${getOwnerName(territory.ownerId)}</p>
      <p><strong>Захист:</strong> ${
        state.plannedDefenses.some(item => item.territoryId === territory.id)
          ? "Заплановано"
          : "Немає"
      }</p>

      ${renderTerritoryActionMenu()}
    </div>
  `;
}

function renderAttackPanel() {
  if (state.currentAction !== "attack") {
    return `
      <div class="attack-panel">
        <h3>Атака</h3>
        <p>Щоб почати атаку, вибери свою територію і натисни “Атакувати”.</p>
      </div>
    `;
  }

  const source = getTerritoryById(state.actionSourceTerritoryId);
  const target = getTerritoryById(state.actionTargetTerritoryId);

  return `
    <div class="attack-panel">
      <h3>Атака</h3>
      <p><strong>Звідки:</strong> ${source ? source.name : "—"}</p>
      <p><strong>Куди:</strong> ${target ? target.name : "не вибрано"}</p>
      <p>Наступним кроком тут буде вибір карт для атаки.</p>
    </div>
  `;
}

function renderDefensePanel() {
  if (state.currentAction !== "defense") {
    return `
      <div class="defense-panel">
        <h3>Захист</h3>
        <p>Щоб поставити захист, вибери свою територію і натисни “Захистити”.</p>
      </div>
    `;
  }

  const source = getTerritoryById(state.actionSourceTerritoryId);

  return `
    <div class="defense-panel">
      <h3>Захист</h3>
      <p><strong>Територія:</strong> ${source ? source.name : "—"}</p>
      <p>Наступним кроком тут буде вибір карт для захисту.</p>
    </div>
  `;
}

function renderTerritoriesList(territories) {
  return `
    <div class="territories-grid">
      ${territories.map(territory => `
        <div class="territory-card">
          <h4>${territory.name}</h4>
          <p><strong>ID:</strong> ${territory.id}</p>
          <p><strong>Тип:</strong> ${getTerritoryTypeLabel(territory.type)}</p>
          <p><strong>Власник:</strong> ${getOwnerName(territory.ownerId)}</p>
          <p><strong>Позиція:</strong> X=${territory.x}%, Y=${territory.y}%</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderGame() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="section">
      <h2>Карта</h2>

      <div class="map-layout">
        <div>
          ${renderMap(state.territories, state.selectedTerritoryId)}
        </div>

        <div class="side-panels">
          <div>
            ${renderSelectedTerritoryInfo(state.selectedTerritoryId)}
          </div>

          <div>
            ${renderAttackPanel()}
          </div>

          <div>
            ${renderDefensePanel()}
          </div>
        </div>
      </div>
    </div>
  `;

  attachTerritoryEvents();
  attachControlEvents();
}

function attachTerritoryEvents() {
  const territoryElements = document.querySelectorAll("[data-territory-id]");

  territoryElements.forEach(element => {
    element.addEventListener("click", () => {
      const territoryId = Number(element.dataset.territoryId);
      const territory = getTerritoryById(territoryId);

      state.selectedTerritoryId = territoryId;

      if (
        state.currentAction === "attack" &&
        state.actionSourceTerritoryId &&
        territoryId !== state.actionSourceTerritoryId
      ) {
        const availableTargets = getAvailableAttackTargets(state.actionSourceTerritoryId);

        const isValidTarget = availableTargets.some(item => item.id === territoryId);

        if (isValidTarget) {
          state.actionTargetTerritoryId = territoryId;
        }
      }

      renderGame();
    });
  });

  if (typeof DEBUG !== "undefined" && DEBUG) {
    const mapElement = document.getElementById("realMap");
    const coordsBox = document.getElementById("coordsBox");

    if (!mapElement || !coordsBox) return;

    mapElement.addEventListener("mousemove", (e) => {
      const rect = mapElement.getBoundingClientRect();

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      coordsBox.textContent = `X: ${x.toFixed(1)}% | Y: ${y.toFixed(1)}%`;
    });
  }
}

function attachControlEvents() {
  const attackActionButton = document.getElementById("attackActionButton");
  const defenseActionButton = document.getElementById("defenseActionButton");
  const cancelActionButton = document.getElementById("cancelActionButton");

  if (attackActionButton) {
    attackActionButton.addEventListener("click", () => {
      if (!state.selectedTerritoryId) {
        return;
      }

      const territory = getTerritoryById(state.selectedTerritoryId);

      if (!territory || !isOwnTerritory(territory)) {
        return;
      }

      state.currentAction = "attack";
      state.actionSourceTerritoryId = territory.id;
      state.actionTargetTerritoryId = null;
      state.selectedCardsForAction = [];

      renderGame();
    });
  }

  if (defenseActionButton) {
    defenseActionButton.addEventListener("click", () => {
      if (!state.selectedTerritoryId) {
        return;
      }

      const territory = getTerritoryById(state.selectedTerritoryId);

      if (!territory || !isOwnTerritory(territory)) {
        return;
      }

      state.currentAction = "defense";
      state.actionSourceTerritoryId = territory.id;
      state.actionTargetTerritoryId = null;
      state.selectedCardsForAction = [];

      renderGame();
    });
  }

  if (cancelActionButton) {
    cancelActionButton.addEventListener("click", () => {
      resetCurrentAction();
      renderGame();
    });
  }
}

function initGame() {
  state.deck = shuffleArray(createDeck());
  state.teams = createTeams();
  state.deck = dealStartingCards(state.teams, state.deck);
  state.territories = createTerritoriesFromMap();

  assignStartingTerritories(state.teams, state.territories);

  renderGame();
}

function resetCurrentAction() {
  state.currentAction = null;
  state.actionSourceTerritoryId = null;
  state.actionTargetTerritoryId = null;
  state.selectedCardsForAction = [];
}

function renderTerritoryActionMenu() {
  if (!state.selectedTerritoryId) {
    return "";
  }

  const territory = getTerritoryById(state.selectedTerritoryId);

  if (!territory || !isOwnTerritory(territory)) {
    return "";
  }

  return `
    <div class="territory-action-menu">
      <button class="control-button" id="attackActionButton">Атакувати</button>
      <button class="control-button secondary" id="defenseActionButton">Захистити</button>
      <button class="control-button secondary" id="cancelActionButton">Скасувати</button>
    </div>
  `;
}

initGame();