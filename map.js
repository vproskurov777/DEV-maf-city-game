const TERRITORY_TYPES = {
  START: "start",
  BONUS_POINTS: "bonus_points",
  EXCHANGE: "exchange",
  RESOURCE: "resource",
  EMPTY: "empty"
};

const GAME_MAP = [
  {
    id: 1,
    name: "Вест-Сайд",
    type: TERRITORY_TYPES.START,
    ownerId: null,
    neighbors: [2, 8, 9],
    x: 21.2,
    y: 23.9
  },
  {
    id: 2,
    name: "Ярвік",
    type: TERRITORY_TYPES.RESOURCE,
    ownerId: null,
    neighbors: [1, 3, 7, 9],
    x: 18.6,
    y: 31.3
  },
  {
    id: 3,
    name: "Брайтон",
    type: TERRITORY_TYPES.RESOURCE,
    ownerId: null,
    neighbors: [2, 4, 7],
    x: 16.4,
    y: 39.5
  },
  {
    id: 4,
    name: "Айронхил",
    type: TERRITORY_TYPES.START,
    ownerId: null,
    neighbors: [3, 5, 6],
    x: 16.2,
    y: 53.1
  },
  {
    id: 5,
    name: "Даунтаун",
    type: TERRITORY_TYPES.RESOURCE,
    ownerId: null,
    neighbors: [4, 6, 18],
    x: 17.4,
    y: 64.9
  },
  {
    id: 6,
    name: "Індейл",
    type: TERRITORY_TYPES.EXCHANGE,
    ownerId: null,
    neighbors: [4, 5, 7, 17],
    x:26.9,
    y: 56.5
  },
  {
    id: 7,
    name: "Бруклін",
    type: TERRITORY_TYPES.EMPTY,
    ownerId: null,
    neighbors: [2, 3, 6, 8, 15],
    x: 28.5,
    y: 44.3
  },
  {
    id: 8,
    name: "Окмір",
    type: TERRITORY_TYPES.EXCHANGE,
    ownerId: null,
    neighbors: [1, 7, 9, 10, 14, 15],
    x: 35.2,
    y: 34.9
  },
  {
    id: 9,
    name: "Хайтс",
    type: TERRITORY_TYPES.RESOURCE,
    ownerId: null,
    neighbors: [1, 2, 8, 10],
    x: 31,
    y: 22.1
  },
  {
    id: 10,
    name: "Грейрок",
    type: TERRITORY_TYPES.RESOURCE,
    ownerId: null,
    neighbors: [9, 11, 13, 14],
    x: 37.9,
    y: 16.1
  },
  {
    id: 11,
    name: "Твінс",
    type: TERRITORY_TYPES.START,
    ownerId: null,
    neighbors: [10, 12, 13],
    x: 47.7,
    y: 16.3
  },
  {
    id: 12,
    name: "Нортбрідж",
    type: TERRITORY_TYPES.RESOURCE,
    ownerId: null,
    neighbors: [11, 13, 23, 29],
    x: 58.8,
    y: 15.8
  },
  {
    id: 13,
    name: "Ріверсайд",
    type: TERRITORY_TYPES.EXCHANGE,
    ownerId: null,
    neighbors: [10, 11, 12, 14, 23],
    x: 52/1,
    y: 25.9
  },
  {
    id: 14,
    name: "Ліберті",
    type: TERRITORY_TYPES.EMPTY,
    ownerId: null,
    neighbors: [8, 10, 13, 15],
    x: 43.7,
    y: 36.3
  },
  {
    id: 15,
    name: "Мідтаун",
    type: TERRITORY_TYPES.BONUS_POINTS,
    ownerId: null,
    neighbors: [7, 8, 14, 16, 21],
    x: 39.7,
    y: 50.8
  },
  {
    id: 16,
    name: "Харбор",
    type: TERRITORY_TYPES.EXCHANGE,
    ownerId: null,
    neighbors: [15, 17, 19, 20, 21],
    x: 41.1,
    y: 65.3
  },
  {
    id: 17,
    name: "Сохо",
    type: TERRITORY_TYPES.EMPTY,
    ownerId: null,
    neighbors: [6, 16, 18, 19],
    x: 32.7,
    y: 67.9
  },
  {
    id: 18,
    name: "Торвік",
    type: TERRITORY_TYPES.RESOURCE,
    ownerId: null,
    neighbors: [5, 17, 19],
    x: 29.1,
    y: 76.9
  },
  {
    id: 19,
    name: "Саузгейт",
    type: TERRITORY_TYPES.START,
    ownerId: null,
    neighbors: [16, 17, 18, 20],
    x: 42.8,
    y: 81.7
  },
  {
    id: 20,
    name: "Грінвей",
    type: TERRITORY_TYPES.RESOURCE,
    ownerId: null,
    neighbors: [16, 19, 21, 24],
    x: 52.7,
    y: 76.5
  },
  {
    id: 21,
    name: "Ешпарк",
    type: TERRITORY_TYPES.EMPTY,
    ownerId: null,
    neighbors: [15, 16, 20, 22, 24],
    x: 52.2,
    y: 58
  },
  {
    id: 22,
    name: "Хілфорд",
    type: TERRITORY_TYPES.EXCHANGE,
    ownerId: null,
    neighbors: [21, 23, 24, 25, 28],
    x: 58.4,
    y: 44.6
  },
  {
    id: 23,
    name: "Фелброк",
    type: TERRITORY_TYPES.BONUS_POINTS,
    ownerId: null,
    neighbors: [12, 13, 22, 28, 29],
    x: 63,
    y: 35.9
  },
  {
    id: 24,
    name: "Саузбрідж",
    type: TERRITORY_TYPES.RESOURCE,
    ownerId: null,
    neighbors: [20, 21, 22, 25, 26],
    x: 63.1,
    y: 63.8
  },
  {
    id: 25,
    name: "Фейрмонт",
    type: TERRITORY_TYPES.START,
    ownerId: null,
    neighbors: [22, 24, 26],
    x: 74.4,
    y: 63.9
  },
  {
    id: 26,
    name: "Іст-Таун",
    type: TERRITORY_TYPES.RESOURCE,
    ownerId: null,
    neighbors: [24, 25, 27, 28],
    x: 78,
    y: 48.8
  },
  {
    id: 27,
    name: "Кросбі",
    type: TERRITORY_TYPES.RESOURCE,
    ownerId: null,
    neighbors: [26, 28, 29, 30],
    x: 83.2,
    y: 35.5
  },
  {
    id: 28,
    name: "Гарлем",
    type: TERRITORY_TYPES.EXCHANGE,
    ownerId: null,
    neighbors: [22, 23, 26, 27, 29, 30],
    x: 77,
    y: 31.3
  },
  {
    id: 29,
    name: "Бейсайд",
    type: TERRITORY_TYPES.RESOURCE,
    ownerId: null,
    neighbors: [12, 23, 27, 28, 30],
    x: 71.4,
    y: 20.7
  },
  {
    id: 30,
    name: "Хайленд",
    type: TERRITORY_TYPES.START,
    ownerId: null,
    neighbors: [27, 28, 29],
    x: 81.7,
    y: 16.2
  }
];