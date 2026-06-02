import { makeLessons, makeQuestTemplates } from "../lesson-helpers.js";

export const castleVocabularyProfile = Object.freeze({
  id: "dolch-220",
  label: "Dolch Sight Words",
  levelLabel: "Dolch Sight Words 220",
  rewardCoins: 20,
  note: "Castle rooms use short sight-word sentences for the earliest readers."
});

const reward = { coins: 20, vocab: 1, expression: 1 };
const q = (prompt, answer, choices, words, questionType = "sentence-choice") => ({ prompt, answer, choices, words, questionType, reward });

const castleLessonPlaces = [
  {
    id: "kingHall",
    theme: "royal hall",
    title: "Help in the King's Hall",
    opening: "The king smiles. A small job is here.",
    ending: "Good work. The hall is bright.",
    questions: [
      q("Pick the sentence for the king.", "The king is here.", ["The king is here.", "The fish is here.", "We go down.", "It is red."], ["the", "is", "here", "king"]),
      q("Pick what Lumi can see.", "I see the crown.", ["I see the crown.", "I eat the crown.", "Go to sleep.", "The cow can run."], ["I", "see", "the", "crown"]),
      q("Pick the polite help sentence.", "Can I help?", ["Can I help?", "Can I jump?", "I am away.", "They are blue."], ["can", "I", "help"]),
      q("Pick the sentence about the hall.", "This hall is big.", ["This hall is big.", "This hall is wet.", "My hat can swim.", "She has a fish."], ["this", "is", "big", "hall"]),
      q("Pick the happy sentence.", "We can go now.", ["We can go now.", "We can eat now.", "They are not here.", "Look at my shoe."], ["we", "can", "go", "now"])
    ]
  },
  {
    id: "queenStudy",
    theme: "study room",
    title: "Help in the Queen's Study",
    opening: "The queen has a book and a note.",
    ending: "The study is neat now.",
    questions: [
      q("Pick the sentence about the book.", "I have a book.", ["I have a book.", "I have a cow.", "You run fast.", "It is under me."], ["I", "have", "a", "book"]),
      q("Pick what the queen can do.", "She can read.", ["She can read.", "She can fly.", "He can jump.", "We see red."], ["she", "can", "read"]),
      q("Pick the sentence about the desk.", "The desk is clean.", ["The desk is clean.", "The desk is blue.", "A dog is clean.", "I go up."], ["the", "is", "clean", "desk"]),
      q("Pick the kind sentence.", "This is for you.", ["This is for you.", "This is away.", "They came fast.", "I am under it."], ["this", "is", "for", "you"]),
      q("Pick the sentence about flowers.", "I see pretty flowers.", ["I see pretty flowers.", "I eat pretty flowers.", "The shoe is pretty.", "Go by the tree."], ["I", "see", "pretty", "flowers"])
    ]
  },
  {
    id: "castleKitchen",
    theme: "kitchen",
    title: "Help in the Castle Kitchen",
    opening: "The cook needs a short English word.",
    ending: "The warm soup is ready.",
    questions: [
      q("Pick the sentence about soup.", "The soup is hot.", ["The soup is hot.", "The soup is little.", "The tree is hot.", "I see a king."], ["the", "is", "hot", "soup"]),
      q("Pick what Lumi wants.", "I want some bread.", ["I want some bread.", "I want some rain.", "You want my shoe.", "They go away."], ["I", "want", "some", "bread"]),
      q("Pick the sentence about water.", "Please get water.", ["Please get water.", "Please get a crown.", "Water can read.", "She is not here."], ["please", "get", "water"]),
      q("Pick the sentence about the table.", "Put it on the table.", ["Put it on the table.", "Put it in the sky.", "I am the table.", "We came down."], ["put", "it", "on", "the", "table"]),
      q("Pick the safe kitchen sentence.", "Do not run.", ["Do not run.", "Do not read.", "The cow is hot.", "My book can run."], ["do", "not", "run"])
    ]
  },
  {
    id: "knightsRoom",
    theme: "knights room",
    title: "Help in the Knights' Room",
    opening: "The knight waves from the practice room.",
    ending: "The practice room is safe.",
    questions: [
      q("Pick the sentence about the knight.", "He can help.", ["He can help.", "He can sleep.", "She can eat.", "It is yellow."], ["he", "can", "help"]),
      q("Pick the sentence about the shield.", "The shield is round.", ["The shield is round.", "The shield is wet.", "My fish is round.", "We like soup."], ["the", "is", "round", "shield"]),
      q("Pick the action sentence.", "Stand by me.", ["Stand by me.", "Run by me.", "Eat by me.", "Read by me."], ["stand", "by", "me"]),
      q("Pick the sentence about a flag.", "Look at the flag.", ["Look at the flag.", "Look at the soup.", "The flag can eat.", "I am not big."], ["look", "at", "the", "flag"]),
      q("Pick the kind sentence.", "We are ready.", ["We are ready.", "We are little.", "They are under.", "You see bread."], ["we", "are", "ready"])
    ]
  },
  {
    id: "maidsRoom",
    theme: "maids room",
    title: "Help in the Maid's Room",
    opening: "The maid is folding clean cloth.",
    ending: "The room is tidy now.",
    questions: [
      q("Pick the sentence about the room.", "The room is clean.", ["The room is clean.", "The room is red.", "The fish is clean.", "I go out."], ["the", "is", "clean", "room"]),
      q("Pick the sentence about cloth.", "This cloth is white.", ["This cloth is white.", "This cloth can jump.", "The king is white.", "We eat it."], ["this", "is", "white", "cloth"]),
      q("Pick what Lumi can do.", "I can fold it.", ["I can fold it.", "I can fly it.", "You can eat it.", "She can run it."], ["I", "can", "fold", "it"]),
      q("Pick the sentence about a basket.", "Put it in the basket.", ["Put it in the basket.", "Put it in the sea.", "The basket is hot.", "My basket can read."], ["put", "it", "in", "the", "basket"]),
      q("Pick the thank-you sentence.", "Thank you for help.", ["Thank you for help.", "Thank you for fish.", "They are not you.", "Go up and away."], ["thank", "you", "for", "help"])
    ]
  }
];

export const castleArea = Object.freeze({
  id: "castle",
  label: "Castle",
  view: "home",
  mapImage: "assets/castle-map2.webp?v=20260601-optimized-assets",
  imageSize: { width: 1312, height: 1199 },
  vocabularyProfile: castleVocabularyProfile,
  nodes: {
    princessRoom: { id: "princessRoom", label: "Princess Room", x: 40.7, y: 56.5, links: ["kingHall", "queenStudy", "castleKitchen", "knightsRoom", "maidsRoom", "castleGate"] },
    kingHall: { id: "kingHall", label: "King's Hall", x: 50.2, y: 31.5, links: ["princessRoom", "queenStudy", "knightsRoom"] },
    queenStudy: { id: "queenStudy", label: "Queen's Study", x: 30.2, y: 52.8, links: ["princessRoom", "kingHall", "maidsRoom"] },
    castleKitchen: { id: "castleKitchen", label: "Kitchen", x: 62.0, y: 57.0, links: ["princessRoom", "maidsRoom"] },
    knightsRoom: { id: "knightsRoom", label: "Knights' Room", x: 62.5, y: 42.5, links: ["kingHall", "princessRoom"] },
    maidsRoom: { id: "maidsRoom", label: "Maid's Room", x: 27.0, y: 67.0, links: ["queenStudy", "castleKitchen", "princessRoom"] },
    castleGate: { id: "castleGate", label: "Castle Gate", x: 40.7, y: 79.8, links: ["princessRoom"] }
  },
  locations: [
    { id: "princessRoom", area: "castle", node: "princessRoom", label: "Princess Room", icon: "🚪", npcClass: "npc-none", npc: "Lumi", scene: "scene-princess-room", kind: "room", hint: "Enter Lumi's room for hair, clothes, outerwear, shoes, and accessories." },
    { id: "kingHall", area: "castle", node: "kingHall", label: "King's Hall", icon: "👑", npcClass: "npc-none", npc: "King Rowan", scene: "scene-castle-king-hall", hint: "King Rowan needs very short English words in the hall." },
    { id: "queenStudy", area: "castle", node: "queenStudy", label: "Queen's Study", icon: "📖", npcClass: "npc-none", npc: "Queen Mira", scene: "scene-castle-queen-study", hint: "Queen Mira is reading in her quiet study." },
    { id: "castleKitchen", area: "castle", node: "castleKitchen", label: "Kitchen", icon: "🍲", npcClass: "npc-none", npc: "Cook Panna", scene: "scene-castle-kitchen", hint: "Cook Panna is making warm soup in the kitchen." },
    { id: "knightsRoom", area: "castle", node: "knightsRoom", label: "Knights' Room", icon: "🛡", npcClass: "npc-none", npc: "Knight Theo", scene: "scene-castle-knights-room", hint: "Knight Theo practices safe, kind words." },
    { id: "maidsRoom", area: "castle", node: "maidsRoom", label: "Maid's Room", icon: "🧺", npcClass: "npc-none", npc: "Maid Lala", scene: "scene-castle-maids-room", hint: "Maid Lala keeps the linens clean and tidy." },
    { id: "castleGate", area: "castle", node: "castleGate", label: "Castle Gate", icon: "🏰", npcClass: "npc-garden", npc: "Gate Guard", scene: "scene-garden", kind: "gate", markerStyle: "portal", portalId: "castleGate", hint: "Go out to the kingdom travel map." }
  ],
  defaultNode: "princessRoom",
  enabled: true
});

export const castleSceneConfigs = Object.freeze({
  princessRoom: { scene: "scene-princess-room", npcClass: "npc-none", npc: "Lumi", travelAction: "Enter", travelLine: "Lumi's room is ready for hair, clothes, outerwear, shoes, and accessories." },
  kingHall: { scene: "scene-castle-king-hall", npcClass: "npc-none", npc: "King Rowan", travelAction: "Visit", travelLine: "King Rowan is waiting in the bright royal hall." },
  queenStudy: { scene: "scene-castle-queen-study", npcClass: "npc-none", npc: "Queen Mira", travelAction: "Visit", travelLine: "Queen Mira has opened her study book." },
  castleKitchen: { scene: "scene-castle-kitchen", npcClass: "npc-none", npc: "Cook Panna", travelAction: "Visit", travelLine: "Cook Panna stirs warm soup for the castle." },
  knightsRoom: { scene: "scene-castle-knights-room", npcClass: "npc-none", npc: "Knight Theo", travelAction: "Visit", travelLine: "Knight Theo is checking the shields." },
  maidsRoom: { scene: "scene-castle-maids-room", npcClass: "npc-none", npc: "Maid Lala", travelAction: "Visit", travelLine: "Maid Lala is folding soft white cloth." },
  castleGate: { scene: "scene-garden", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "Travel", travelLine: "The castle gate leads back to the kingdom map." }
});

export const castleQuestTemplates = makeQuestTemplates(castleLessonPlaces);
export const castleLessons = makeLessons("castle", castleVocabularyProfile, castleLessonPlaces);
