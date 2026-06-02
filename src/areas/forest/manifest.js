import { makeLessons, makeQuestTemplates } from "../lesson-helpers.js";

export const forestVocabularyProfile = Object.freeze({
  id: "cambridge-a2-flyers",
  label: "Cambridge A2 Flyers",
  levelLabel: "Cambridge Flyers",
  rewardCoins: 2000,
  note: "Forest fantasy scenes use longer Flyers-style sentences with richer story words."
});

const reward = { coins: 2000, vocab: 3, expression: 3, kindness: 2 };
const q = (prompt, answer, choices, words, questionType = "sentence-choice") => ({ prompt, answer, choices, words, questionType, reward });
const flyersQuestions = ({ character, place, object, problem, action, result }) => [
  q(`Pick the sentence that explains the ${place} problem.`, `${character} cannot find the ${object} because ${problem}.`, [`${character} cannot find the ${object} because ${problem}.`, `${character} cannot eat the ${object} because it is a castle.`, `${character} cannot wear the river because it is noisy.`, `${character} cannot read the mountain before breakfast.`], [character, object, "because", ...problem.split(" ")]),
  q(`Pick the best helpful sentence.`, `Lumi should ${action} before the path gets dark.`, [`Lumi should ${action} before the path gets dark.`, `Lumi should hide the path under her shoe.`, `Lumi should shout until the trees run away.`, `Lumi should cook the moon before it rains.`], ["should", action, "before", "path", "dark"]),
  q(`Pick the sentence about what happened next.`, `After Lumi helps, ${result}.`, [`After Lumi helps, ${result}.`, "After Lumi helps, the castle drinks a book.", "After Lumi helps, the basket becomes angry.", "After Lumi helps, every tree forgets the road."], ["after", "helps", ...result.split(" ")]),
  q(`Pick the careful forest sentence.`, `If we listen carefully, we can hear the forest answer.`, ["If we listen carefully, we can hear the forest answer.", "If we run loudly, the answer becomes a shoe.", "If the river sleeps, the basket can fly.", "If the wolf reads maps, bread gets taller."], ["if", "listen", "carefully", "answer"]),
  q(`Pick the story question.`, `Why does ${character} need Lumi's help?`, [`Why does ${character} need Lumi's help?`, `Why does ${character} sell the castle?`, `Where does ${character} eat a thundercloud?`, `When does ${character} become a teacup?`], ["why", character, "need", "help"], "question-choice")
];

const forestLessonPlaces = [
  { id: "elfGlade", theme: "elf glade", title: "Help in the Elf Glade", opening: "The elf glade glows with tiny blue flowers.", ending: "The elf song guides the forest path.", questions: flyersQuestions({ character: "the elf", place: "glade", object: "silver bell", problem: "the flowers are too bright", action: "follow the quiet music", result: "the silver bell rings softly" }) },
  { id: "dwarfCottage", theme: "dwarf workshop", title: "Help at the Dwarf Cottage", opening: "Pip the dwarf warms a small workshop fire.", ending: "The cottage tools are safe and tidy.", questions: flyersQuestions({ character: "the dwarf", place: "cottage", object: "wooden wheel", problem: "it rolled behind the table", action: "look behind the workbench", result: "the wooden wheel turns again" }) },
  { id: "stoneGolemPass", theme: "stone golem pass", title: "Help at Stone Golem Pass", opening: "A friendly stone golem blocks the old path.", ending: "The golem smiles and opens the pass.", questions: flyersQuestions({ character: "the golem", place: "pass", object: "missing stone", problem: "moss covers the sign", action: "clean the old sign", result: "the mountain pass opens" }) },
  { id: "halflingVillage", theme: "halfling village", title: "Help in Halfling Village", opening: "Small round doors peek from the hill.", ending: "The village picnic can begin.", questions: flyersQuestions({ character: "the halfling", place: "village", object: "picnic basket", problem: "it is beside the wrong door", action: "check each round door", result: "the picnic basket is found" }) },
  { id: "wizardHut", theme: "wizard hut", title: "Help at the Wizard Hut", opening: "A purple roof curls above the wizard's herbs.", ending: "The glowing herb jar is safe.", questions: flyersQuestions({ character: "the wizard", place: "hut", object: "blue herb jar", problem: "the shelf is too high", action: "move the little ladder", result: "the blue herb jar shines" }) },
  { id: "redHoodPath", theme: "red riding hood path", title: "Help on Red Riding Hood Path", opening: "A red hood rests near a basket on the path.", ending: "The forest path is clear again.", questions: flyersQuestions({ character: "the girl", place: "path", object: "basket", problem: "leaves cover the handle", action: "brush away the leaves", result: "the basket is ready" }) },
  { id: "threePigsCottage", theme: "three pigs cottage", title: "Help at the Three Pigs Cottage", opening: "Three tiny cottages stand under warm trees.", ending: "The three cottages are tidy.", questions: flyersQuestions({ character: "the piglet", place: "cottage", object: "straw roof", problem: "the wind moved some straw", action: "tie the roof gently", result: "the straw roof stays still" }) },
  { id: "treeSpiritGrove", theme: "tree spirit grove", title: "Help in the Tree Spirit Grove", opening: "The ancient tree spirit blinks with blue lights.", ending: "The grove glows softly.", questions: flyersQuestions({ character: "the spirit", place: "grove", object: "moon seed", problem: "it fell near the roots", action: "place the seed in moonlight", result: "the moon seed begins to glow" }) }
];

export const forestArea = Object.freeze({
  id: "forest",
  label: "Forest",
  view: "map",
  mapImage: "assets/areas/forest-map-wide.png?v=20260603-region-vocab",
  imageSize: { width: 1774, height: 887 },
  vocabularyProfile: forestVocabularyProfile,
  nodes: {
    forestEntrance: { id: "forestEntrance", label: "Kingdom Path", x: 9, y: 61, links: ["elfGlade", "redHoodPath"] },
    elfGlade: { id: "elfGlade", label: "Elf Glade", x: 23, y: 25, links: ["forestEntrance", "dwarfCottage", "halflingVillage"] },
    dwarfCottage: { id: "dwarfCottage", label: "Dwarf Cottage", x: 44, y: 24, links: ["elfGlade", "stoneGolemPass", "halflingVillage"] },
    stoneGolemPass: { id: "stoneGolemPass", label: "Stone Golem Pass", x: 65, y: 26, links: ["dwarfCottage", "wizardHut"] },
    halflingVillage: { id: "halflingVillage", label: "Halfling Village", x: 34, y: 50, links: ["elfGlade", "dwarfCottage", "redHoodPath", "threePigsCottage"] },
    wizardHut: { id: "wizardHut", label: "Wizard Hut", x: 66, y: 51, links: ["stoneGolemPass", "treeSpiritGrove", "threePigsCottage"] },
    redHoodPath: { id: "redHoodPath", label: "Red Riding Hood Path", x: 21, y: 79, links: ["forestEntrance", "halflingVillage", "threePigsCottage"] },
    threePigsCottage: { id: "threePigsCottage", label: "Three Pigs Cottage", x: 49, y: 80, links: ["redHoodPath", "halflingVillage", "wizardHut", "treeSpiritGrove"] },
    treeSpiritGrove: { id: "treeSpiritGrove", label: "Tree Spirit Grove", x: 82, y: 78, links: ["wizardHut", "threePigsCottage"] }
  },
  locations: [
    { id: "forestExit", area: "forest", node: "forestEntrance", label: "Kingdom Path", icon: "↩", npcClass: "npc-none", npc: "Forest Sign", kind: "gate", markerStyle: "portal", portalId: "entrance", hint: "The path returns to the kingdom town." },
    { id: "elfGlade", area: "forest", node: "elfGlade", label: "Elf Glade", icon: "🧝", npcClass: "npc-none", npc: "Elia", scene: "scene-forest-elf-glade", hint: "The elf glade glows with tiny flowers." },
    { id: "dwarfCottage", area: "forest", node: "dwarfCottage", label: "Dwarf Cottage", icon: "🛖", npcClass: "npc-dwarf", npc: "Pip", scene: "scene-forest-dwarf-cottage", kind: "shop", shopCategories: ["outer"], defaultCategory: "outer", hint: "Pip keeps handmade forest outerwear in a warm cottage." },
    { id: "stoneGolemPass", area: "forest", node: "stoneGolemPass", label: "Stone Golem Pass", icon: "🪨", npcClass: "npc-none", npc: "Goro", scene: "scene-forest-golem-pass", hint: "A friendly stone golem watches the mountain pass." },
    { id: "halflingVillage", area: "forest", node: "halflingVillage", label: "Halfling Village", icon: "🏘", npcClass: "npc-none", npc: "Penny", scene: "scene-forest-halfling-village", hint: "Small round doors peek from the hill." },
    { id: "wizardHut", area: "forest", node: "wizardHut", label: "Wizard Hut", icon: "🪄", npcClass: "npc-none", npc: "Wiz Beryl", scene: "scene-forest-wizard-hut", hint: "A purple roof curls above jars and herbs." },
    { id: "redHoodPath", area: "forest", node: "redHoodPath", label: "Red Riding Hood Path", icon: "🧺", npcClass: "npc-none", npc: "Ruby", scene: "scene-forest-red-hood-path", hint: "A red hood and basket wait on the forest path." },
    { id: "threePigsCottage", area: "forest", node: "threePigsCottage", label: "Three Pigs Cottage", icon: "🐷", npcClass: "npc-none", npc: "Pippo", scene: "scene-forest-three-pigs", hint: "Three small cottages stand under warm trees." },
    { id: "treeSpiritGrove", area: "forest", node: "treeSpiritGrove", label: "Tree Spirit Grove", icon: "✨", npcClass: "npc-tree-spirit", npc: "Sylvie", scene: "scene-forest-tree-spirit-grove", hint: "A gentle tree spirit listens to children practicing English." }
  ],
  actors: [
    { id: "forest-river-glow", type: "water", x: 92, y: 50, w: 13, h: 70, z: 1, phase: 1.1 },
    { id: "forest-firefly-a", type: "glow", x: 23, y: 25, w: 8, h: 8, z: 3, phase: 0.2 },
    { id: "forest-firefly-b", type: "glow", x: 82, y: 78, w: 7, h: 7, z: 3, phase: 1.1 },
    { id: "forest-bird", type: "bird", x: 54, y: 20, w: 4, h: 2, z: 4, phase: 0.6 }
  ],
  defaultNode: "forestEntrance",
  enabled: true
});

export const forestSceneConfigs = Object.freeze({
  forestExit: { scene: "scene-forest-path", npcClass: "npc-none", npc: "Forest Sign", travelAction: "Back to Kingdom", travelLine: "The path returns to the kingdom town." },
  elfGlade: { scene: "scene-forest-elf-glade", npcClass: "npc-none", npc: "Elia", travelAction: "Visit", travelLine: "Elia the elf listens to the glowing flowers." },
  dwarfCottage: { scene: "scene-forest-dwarf-cottage", npcClass: "npc-dwarf", npc: "Pip", travelAction: "Shop", travelLine: "Pip has handmade forest treasures ready for Lumi.", shopGreeting: "Welcome to the dwarf cottage. Pick a gentle forest treasure." },
  stoneGolemPass: { scene: "scene-forest-golem-pass", npcClass: "npc-none", npc: "Goro", travelAction: "Visit", travelLine: "Goro the stone golem blocks the old pass with a friendly smile." },
  halflingVillage: { scene: "scene-forest-halfling-village", npcClass: "npc-none", npc: "Penny", travelAction: "Visit", travelLine: "Penny waves from a round green door." },
  wizardHut: { scene: "scene-forest-wizard-hut", npcClass: "npc-none", npc: "Wiz Beryl", travelAction: "Visit", travelLine: "Wiz Beryl is sorting jars under the purple roof." },
  redHoodPath: { scene: "scene-forest-red-hood-path", npcClass: "npc-none", npc: "Ruby", travelAction: "Visit", travelLine: "Ruby checks her basket on the forest path." },
  threePigsCottage: { scene: "scene-forest-three-pigs", npcClass: "npc-none", npc: "Pippo", travelAction: "Visit", travelLine: "Pippo looks at three tiny cottages." },
  treeSpiritGrove: { scene: "scene-forest-tree-spirit-grove", npcClass: "npc-tree-spirit", npc: "Sylvie", travelAction: "Visit", travelLine: "Sylvie the tree spirit smiles from the branches." }
});

export const forestQuestTemplates = makeQuestTemplates(forestLessonPlaces);
export const forestLessons = makeLessons("forest", forestVocabularyProfile, forestLessonPlaces);
