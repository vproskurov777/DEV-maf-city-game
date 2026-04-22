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

  attackDraft: {
    sourceTerritoryId: null,
    targetTerritoryId: null,
    selectedCardIds: []
  },

  defenseDraft: {
    territoryId: null,
    selectedCardIds: []
  },

  plannedAttacks: [],
  plannedDefenses: [],

  actionStep: null,

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
            state.attackDraft.sourceTerritoryId &&
            getAvailableAttackTargets(state.attackDraft.sourceTerritoryId).some(item => item.id === territory.id)
              ? "attack-available"
              : "";

          const attackSourceClass =
            state.attackDraft.sourceTerritoryId === territory.id ? "attack-source" : "";

            const attackTargetClass =
            state.attackDraft.targetTerritoryId === territory.id ? "attack-target" : "";

          const defensePlannedClass =
            getPlannedDefenseForTerritory(territory.id) ? "defended" : "";

          return `
            <div
              class="territory-label ${ownerClass} ${selectedClass} ${attackSourceClass} ${attackTargetClass} ${attackAvailableClass} ${defensePlannedClass}"
              style="left: ${territory.x}%; top: ${territory.y}%;"
              title="${territory.name} | ${getTerritoryTypeLabel(territory.type)}"
              data-territory-id="${territory.id}"
            >
              ${territory.name}
            </div>
          `;
        }).join("")}

        ${renderTerritoryContextMenu()}

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

  const plannedDefense = getPlannedDefenseForTerritory(territory.id);

  return `
    <div class="info-panel">
      <h3>${territory.name}</h3>
      <p><strong>Тип:</strong> ${getTerritoryTypeLabel(territory.type)}</p>
      <p><strong>Власник:</strong> ${getOwnerName(territory.ownerId)}</p>
      <p><strong>Захист:</strong> ${plannedDefense ? "Заплановано" : "Немає"}</p>
    </div>
  `;
}

function renderTerritoryContextMenu() {
  if (!state.selectedTerritoryId) {
    return "";
  }

  const territory = getTerritoryById(state.selectedTerritoryId);

  if (!territory || !isOwnTerritory(territory)) {
    return "";
  }

  const isAttackSource = state.attackDraft.sourceTerritoryId === territory.id;
  const isDefenseSource = state.defenseDraft.territoryId === territory.id;

  // 1. Початковий стан: показуємо дві кнопки
  if (!isAttackSource && !isDefenseSource) {
    return `
      <div
        class="territory-context-menu"
        style="left: calc(${territory.x}% - 10px); top: calc(${territory.y}% + 32px);"
      >
        <button class="control-button attack" id="attackActionButton">Атака</button>
        <button class="control-button defense" id="defenseActionButton">Захист</button>
      </div>
    `;
  }

  // 2. Режим атаки: вибір цілі
  if (isAttackSource && state.actionStep === "chooseTarget") {
    return `
      <div
        class="territory-context-menu"
        style="left: calc(${territory.x}% - 10px); top: calc(${territory.y}% + 32px);"
      >
        <span style="color: white; font-weight: bold;">Виберіть територію для атаки</span>
        <button class="control-button secondary" id="cancelAttackDraftButton">Скасувати</button>
      </div>
    `;
  }

  // 3. Режим атаки: ціль вибрана
  if (
    isAttackSource &&
    state.actionStep === "confirmAttackTarget" &&
    state.attackDraft.targetTerritoryId
  ) {
    const target = getTerritoryById(state.attackDraft.targetTerritoryId);

    return `
      <div
        class="territory-context-menu"
        style="left: calc(${territory.x}% - 10px); top: calc(${territory.y}% + 32px);"
      >
        <div style="color: white; font-weight: bold; width: 100%;">
          Атакуємо ${territory.name} → ${target ? target.name : "?"}
        </div>
        <button class="control-button" id="confirmAttackTargetButton">Підтвердити</button>
        <button class="control-button secondary" id="cancelAttackDraftButton">Скасувати</button>
      </div>
    `;
  }

  // 4. Режим атаки: вибір карт
  if (isAttackSource && state.actionStep === "chooseAttackCards") {
    return `
      <div
        class="territory-context-menu"
        style="left: calc(${territory.x}% - 10px); top: calc(${territory.y}% + 32px);"
      >
        <button class="control-button" id="openAttackCardsButton">Вибір карт</button>
        <button class="control-button secondary" id="cancelAttackDraftButton">Скасувати</button>
      </div>
    `;
  }

  // 5. Режим захисту: вибір карт
  if (isDefenseSource && state.actionStep === "chooseDefenseCards") {
    return `
      <div
        class="territory-context-menu"
        style="left: calc(${territory.x}% - 10px); top: calc(${territory.y}% + 32px);"
      >
        <button class="control-button defense" id="openDefenseCardsButton">Вибір карт</button>
        <button class="control-button danger" id="cancelDefenseDraftButton">Скасувати</button>
      </div>
    `;
  }

  return "";
}

function renderAttackPanel() {
  const source = getTerritoryById(state.attackDraft.sourceTerritoryId);
  const target = getTerritoryById(state.attackDraft.targetTerritoryId);

  return `
    <div class="attack-panel">
      <h3>Атака</h3>
      <p><strong>Звідки:</strong> ${source ? source.name : "не вибрано"}</p>
      <p><strong>Куди:</strong> ${target ? target.name : "не вибрано"}</p>

      <div class="controls" style="justify-content: flex-start; margin-bottom: 0; margin-top: 12px;">
        <button class="control-button" id="confirmAttackDraftButton">Підтвердити атаку</button>
        <button class="control-button secondary" id="cancelAttackDraftButton">Скасувати атаку</button>
      </div>

      <div style="margin-top: 14px;">
        <p><strong>Заплановані атаки:</strong></p>
        ${
          state.plannedAttacks.length
            ? `<ul style="margin: 8px 0 0 18px; padding: 0;">
                ${state.plannedAttacks.map((attack, index) => {
                  const from = getTerritoryById(attack.sourceTerritoryId);
                  const to = getTerritoryById(attack.targetTerritoryId);
                  return `
                    <li>
                      ${from?.name || "?"} → ${to?.name || "?"}
                      <button class="control-button secondary remove-attack-button" data-attack-index="${index}" style="margin-left: 8px; padding: 4px 8px;">
                        Скасувати
                      </button>
                    </li>
                  `;
                }).join("")}
              </ul>`
            : `<p>Ще немає</p>`
        }
      </div>
    </div>
  `;
}

function renderDefensePanel() {
  const territory = getTerritoryById(state.defenseDraft.territoryId);

  return `
    <div class="defense-panel">
      <h3>Захист</h3>
      <p><strong>Територія:</strong> ${territory ? territory.name : "не вибрано"}</p>

      <div class="controls" style="justify-content: flex-start; margin-bottom: 0; margin-top: 12px;">
        <button class="control-button success" id="confirmDefenseDraftButton">Підтвердити захист</button>
        <button class="control-button danger" id="cancelDefenseDraftButton">Скасувати захист</button>
      </div>

      <div style="margin-top: 14px;">
        <p><strong>Заплановані захисти:</strong></p>
        ${
          state.plannedDefenses.length
            ? `<ul style="margin: 8px 0 0 18px; padding: 0;">
                ${state.plannedDefenses.map((defense, index) => {
                  const territory = getTerritoryById(defense.territoryId);
                  return `
                    <li>
                      ${territory?.name || "?"}
                      <button class="control-button secondary remove-defense-button" data-defense-index="${index}" style="margin-left: 8px; padding: 4px 8px;">
                        Скасувати
                      </button>
                    </li>
                  `;
                }).join("")}
              </ul>`
            : `<p>Ще немає</p>`
        }
      </div>
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
            ${renderTerritoryPlansPanel(state.selectedTerritoryId)}
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
      state.selectedTerritoryId = territoryId;

      if (state.attackDraft.sourceTerritoryId && state.actionStep === "chooseTarget") {
        const availableTargets = getAvailableAttackTargets(state.attackDraft.sourceTerritoryId);
        const isValidTarget = availableTargets.some(item => item.id === territoryId);

        if (
          territoryId !== state.attackDraft.sourceTerritoryId &&
          isValidTarget
        ) {
          state.attackDraft.targetTerritoryId = territoryId;
          state.actionStep = "confirmAttackTarget";
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

  const cancelAttackDraftButton = document.getElementById("cancelAttackDraftButton");
  const cancelDefenseDraftButton = document.getElementById("cancelDefenseDraftButton");

  const confirmAttackTargetButton = document.getElementById("confirmAttackTargetButton");
  const openAttackCardsButton = document.getElementById("openAttackCardsButton");
  const openDefenseCardsButton = document.getElementById("openDefenseCardsButton");

  const removeAttackButtons = document.querySelectorAll(".remove-attack-button");
  const removeDefenseButtons = document.querySelectorAll(".remove-defense-button");
  const removeDefenseByTerritoryButtons = document.querySelectorAll(".remove-defense-by-territory-button");

  if (attackActionButton) {
    attackActionButton.addEventListener("click", () => {
      if (!state.selectedTerritoryId) return;

      const territory = getTerritoryById(state.selectedTerritoryId);
      if (!territory || !isOwnTerritory(territory)) return;

      resetAttackDraft();
      resetDefenseDraft();

      state.attackDraft.sourceTerritoryId = territory.id;
      state.actionStep = "chooseTarget";

      renderGame();
    });
  }

  if (defenseActionButton) {
    defenseActionButton.addEventListener("click", () => {
      if (!state.selectedTerritoryId) return;

      const territory = getTerritoryById(state.selectedTerritoryId);
      if (!territory || !isOwnTerritory(territory)) return;

      resetAttackDraft();
      resetDefenseDraft();

      state.defenseDraft.territoryId = territory.id;
      state.actionStep = "chooseDefenseCards";

      renderGame();
    });
  }

  if (confirmAttackTargetButton) {
    confirmAttackTargetButton.addEventListener("click", () => {
      if (!state.attackDraft.sourceTerritoryId || !state.attackDraft.targetTerritoryId) return;

      state.actionStep = "chooseAttackCards";
      renderGame();
    });
  }

  if (openAttackCardsButton) {
    openAttackCardsButton.addEventListener("click", () => {
      alert("Наступний крок — тут буде список карт для атаки.");
    });
  }

  if (openDefenseCardsButton) {
    openDefenseCardsButton.addEventListener("click", () => {
      alert("Наступний крок — тут буде список карт для захисту.");
    });
  }

  if (cancelAttackDraftButton) {
    cancelAttackDraftButton.addEventListener("click", () => {
      resetAttackDraft();
      state.actionStep = null;
      renderGame();
    });
  }

  if (cancelDefenseDraftButton) {
    cancelDefenseDraftButton.addEventListener("click", () => {
      resetDefenseDraft();
      state.actionStep = null;
      renderGame();
    });
  }

  removeAttackButtons.forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.attackIndex);
      state.plannedAttacks.splice(index, 1);
      renderGame();
    });
  });

  removeDefenseButtons.forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.defenseIndex);
      state.plannedDefenses.splice(index, 1);
      renderGame();
    });
  });

  removeDefenseByTerritoryButtons.forEach(button => {
    button.addEventListener("click", () => {
      const territoryId = Number(button.dataset.territoryId);
      state.plannedDefenses = state.plannedDefenses.filter(
        item => item.territoryId !== territoryId
      );
      renderGame();
    });
  });
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
    const incomingAttacks = territory ? getPlannedAttacksToTerritory(territory.id) : [];

    if (!territory || incomingAttacks.length === 0) {
      return "";
    }

    return `
      <div class="territory-action-menu">
        <div class="attack-panel" style="width: 100%;">
          <h3>Заплановані атаки</h3>
          <ul style="margin: 8px 0 0 18px; padding: 0;">
            ${incomingAttacks.map((attack, index) => {
              const source = getTerritoryById(attack.sourceTerritoryId);
              const cardsText = attack.cards?.length ? attack.cards.join(", ") : "карти не вибрані";
              return `<li>${source?.name || "?"} → ${territory.name} | ${cardsText}</li>`;
            }).join("")}
          </ul>
        </div>
      </div>
    `;
  }

  return `
    <div class="territory-action-menu">
      <button class="control-button" id="attackActionButton">Атакувати</button>
      <button class="control-button secondary" id="defenseActionButton">Захистити</button>
    </div>
  `;
}

function getPlannedDefenseForTerritory(territoryId) {
  return state.plannedDefenses.find(item => item.territoryId === territoryId) || null;
}

function getPlannedAttacksFromTerritory(territoryId) {
  return state.plannedAttacks.filter(item => item.sourceTerritoryId === territoryId);
}

function getPlannedAttacksToTerritory(territoryId) {
  return state.plannedAttacks.filter(item => item.targetTerritoryId === territoryId);
}

function resetAttackDraft() {
  state.attackDraft = {
    sourceTerritoryId: null,
    targetTerritoryId: null,
    selectedCardIds: []
  };
}

function resetDefenseDraft() {
  state.defenseDraft = {
    territoryId: null,
    selectedCardIds: []
  };
}

function renderTerritoryPlansPanel(selectedTerritoryId) {
  if (!selectedTerritoryId) {
    return `
      <div class="attack-panel">
        <h3>Дії по території</h3>
        <p>Вибери територію, щоб побачити заплановані дії.</p>
      </div>
    `;
  }

  const territory = getTerritoryById(selectedTerritoryId);

  if (!territory) {
    return `
      <div class="attack-panel">
        <h3>Дії по території</h3>
        <p>Територію не знайдено.</p>
      </div>
    `;
  }

  const plannedDefense = getPlannedDefenseForTerritory(territory.id);
  const outgoingAttacks = getPlannedAttacksFromTerritory(territory.id);
  const incomingAttacks = getPlannedAttacksToTerritory(territory.id);

  return `
    <div class="attack-panel">
      <h3>Дії по території</h3>

      <div style="margin-top: 12px;">
        <p><strong>Захист:</strong></p>
        ${
          plannedDefense
            ? `
              <div style="margin-top: 8px;">
                <span>${territory.name}</span>
                <button
                  class="control-button secondary remove-defense-by-territory-button"
                  data-territory-id="${territory.id}"
                  style="margin-left: 8px; padding: 4px 8px;"
                >
                  Скасувати
                </button>
              </div>
            `
            : `<p>Немає</p>`
        }
      </div>

      <div style="margin-top: 16px;">
        <p><strong>Атаки з території:</strong></p>
        ${
          outgoingAttacks.length
            ? `
              <ul style="margin: 8px 0 0 18px; padding: 0;">
                ${outgoingAttacks.map(attack => {
                  const target = getTerritoryById(attack.targetTerritoryId);
                  const attackIndex = state.plannedAttacks.findIndex(item =>
                    item.sourceTerritoryId === attack.sourceTerritoryId &&
                    item.targetTerritoryId === attack.targetTerritoryId
                  );

                  return `
                    <li>
                      ${territory.name} → ${target?.name || "?"}
                      <button
                        class="control-button secondary remove-attack-button"
                        data-attack-index="${attackIndex}"
                        style="margin-left: 8px; padding: 4px 8px;"
                      >
                        Скасувати
                      </button>
                    </li>
                  `;
                }).join("")}
              </ul>
            `
            : `<p>Немає</p>`
        }
      </div>

      <div style="margin-top: 16px;">
        <p><strong>Атаки на територію:</strong></p>
        ${
          incomingAttacks.length
            ? `
              <ul style="margin: 8px 0 0 18px; padding: 0;">
                ${incomingAttacks.map(attack => {
                  const source = getTerritoryById(attack.sourceTerritoryId);
                  const attackIndex = state.plannedAttacks.findIndex(item =>
                    item.sourceTerritoryId === attack.sourceTerritoryId &&
                    item.targetTerritoryId === attack.targetTerritoryId
                  );

                  return `
                    <li>
                      ${source?.name || "?"} → ${territory.name}
                      <button
                        class="control-button secondary remove-attack-button"
                        data-attack-index="${attackIndex}"
                        style="margin-left: 8px; padding: 4px 8px;"
                      >
                        Скасувати
                      </button>
                    </li>
                  `;
                }).join("")}
              </ul>
            `
            : `<p>Немає</p>`
        }
      </div>
    </div>
  `;
}

initGame();