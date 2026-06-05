import { makeLessons, makeQuestTemplates } from "../lesson-helpers.js";

const npcImage = (name) => `assets/areas/forest/characters/${name}.webp?v=20260605-npc-r2`;
const sceneArt = (src, options = {}) => ({ sceneArt: { src, tone: "forest", ...options } });
const forestAtlasArt = (position) => sceneArt("assets/scenes/forest-scenes-atlas.png?v=20260603-region-vocab", {
  atlas: "forest-scenes",
  position,
  size: "800% 100%"
});
const forestShopArt = (name) => sceneArt(`assets/areas/forest/scenes/${name}.webp?v=20260604-issues56-60`, { tone: "shop" });
const forestPathArt = sceneArt("assets/scenes/forest-path.webp?v=20260602-forest-art");

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
  mapImage: "assets/areas/forest/map-pure.webp?v=20260605-forest-map-r2",
  imageSize: { width: 1448, height: 1086 },
  vocabularyProfile: forestVocabularyProfile,
  nodes: {
    forestEntrance: { id: "forestEntrance", label: "Kingdom Path", x: 87, y: 82, links: ["treeSpiritGrove", "wizardHut", "threePigsCottage"] },
    elfGlade: { id: "elfGlade", label: "Elf Glade", x: 31, y: 28, links: ["dwarfCottage", "fairyAtelier", "halflingVillage"] },
    fairyAtelier: { id: "fairyAtelier", label: "Fairy Atelier", x: 38, y: 38, links: ["elfGlade", "halflingVillage", "wizardHut"] },
    dwarfCottage: { id: "dwarfCottage", label: "Dwarf Cottage", x: 18, y: 48, links: ["elfGlade", "stoneGolemPass", "halflingVillage"] },
    stoneGolemPass: { id: "stoneGolemPass", label: "Stone Golem Pass", x: 44, y: 18, links: ["dwarfCottage", "wizardHut", "elfGlade"] },
    halflingVillage: { id: "halflingVillage", label: "Halfling Village", x: 50, y: 58, links: ["elfGlade", "dwarfCottage", "fairyAtelier", "redHoodPath", "threePigsCottage"] },
    wizardHut: { id: "wizardHut", label: "Wizard Hut", x: 63, y: 44, links: ["stoneGolemPass", "treeSpiritGrove", "threePigsCottage", "fairyAtelier"] },
    redHoodPath: { id: "redHoodPath", label: "Red Riding Hood Path", x: 14, y: 84, links: ["halflingVillage", "threePigsCottage"] },
    threePigsCottage: { id: "threePigsCottage", label: "Three Pigs Cottage", x: 57, y: 78, links: ["redHoodPath", "halflingVillage", "wizardHut", "treeSpiritGrove", "forestEntrance"] },
    treeSpiritGrove: { id: "treeSpiritGrove", label: "Tree Spirit Grove", x: 78, y: 43, links: ["wizardHut", "threePigsCottage", "forestEntrance"] }
  },
  locations: [
    { id: "forestExit", area: "forest", node: "forestEntrance", label: "Kingdom Path", icon: "↩", npcClass: "npc-none", npc: "Forest Sign", kind: "gate", markerStyle: "portal", portalId: "entrance", hint: "The path returns to the kingdom town." },
    { id: "elfGlade", area: "forest", node: "elfGlade", label: "Elf Glade", icon: "🧝", npc: "Elia", scene: "scene-forest-elf-glade", npcImage: npcImage("elia"), hint: "The elf glade glows with tiny flowers." },
    { id: "fairyAtelier", area: "forest", node: "fairyAtelier", label: "Fairy Atelier", icon: "👗", npc: "Faye", scene: "scene-forest-fairy-atelier", npcImage: npcImage("fairy-atelier"), kind: "shop", shopCategories: ["dresses", "accessories"], defaultCategory: "dresses", hint: "Faye sells fairy dresses and accessories in the glade." },
    { id: "dwarfCottage", area: "forest", node: "dwarfCottage", label: "Dwarf Cottage", icon: "🛖", npc: "Pip", scene: "scene-forest-dwarf-cottage", npcImage: npcImage("pip"), kind: "shop", shopCategories: ["outerwear", "shoes"], defaultCategory: "outerwear", hint: "Pip keeps handmade forest outerwear and shoes in a warm cottage." },
    { id: "stoneGolemPass", area: "forest", node: "stoneGolemPass", label: "Stone Golem Pass", icon: "🪨", npc: "Goro", scene: "scene-forest-golem-pass", npcImage: npcImage("goro"), hint: "A friendly stone golem watches the mountain pass." },
    { id: "halflingVillage", area: "forest", node: "halflingVillage", label: "Halfling Village", icon: "🏘", npc: "Penny", scene: "scene-forest-halfling-village", npcImage: npcImage("penny"), hint: "Small round doors peek from the hill." },
    { id: "wizardHut", area: "forest", node: "wizardHut", label: "Wizard Hut", icon: "🪄", npc: "Wiz Beryl", scene: "scene-forest-wizard-hut", npcImage: npcImage("wiz-beryl"), hint: "A purple roof curls above jars and herbs." },
    { id: "redHoodPath", area: "forest", node: "redHoodPath", label: "Red Riding Hood Path", icon: "🧺", npc: "Ruby", scene: "scene-forest-red-hood-path", npcImage: npcImage("ruby"), hint: "A red hood and basket wait on the forest path." },
    { id: "threePigsCottage", area: "forest", node: "threePigsCottage", label: "Three Pigs Cottage", icon: "🐷", npc: "Pippo", scene: "scene-forest-three-pigs", npcImage: npcImage("pippo"), hint: "Three small cottages stand under warm trees." },
    { id: "treeSpiritGrove", area: "forest", node: "treeSpiritGrove", label: "Tree Spirit Grove", icon: "✨", npc: "Sylvie", scene: "scene-forest-tree-spirit-grove", npcImage: npcImage("sylvie"), hint: "A gentle tree spirit listens to children practicing English." }
  ],
  actors: [
    { id: "forest-river-glow", type: "water", x: 70, y: 78, w: 28, h: 18, z: 1, phase: 1.1 },
    { id: "forest-firefly-a", type: "glow", x: 31, y: 28, w: 8, h: 8, z: 3, phase: 0.2 },
    { id: "forest-firefly-b", type: "glow", x: 78, y: 43, w: 7, h: 7, z: 3, phase: 1.1 },
    { id: "forest-bird", type: "bird", x: 52, y: 19, w: 4, h: 2, z: 4, phase: 0.6 }
  ],
  defaultNode: "forestEntrance",
  enabled: true
});

export const forestSceneConfigs = Object.freeze({
  forestExit: { ...forestPathArt, scene: "scene-forest-path", npcClass: "npc-none", npc: "Forest Sign", travelAction: "Back to Kingdom", travelLine: "The path returns to the kingdom town." },
  elfGlade: { ...forestAtlasArt("0% 50%"), scene: "scene-forest-elf-glade", npc: "Elia", npcImage: npcImage("elia"), travelAction: "Visit", travelLine: "Elia the elf listens to the glowing flowers." },
  fairyAtelier: { ...forestShopArt("fairy-atelier"), scene: "scene-forest-fairy-atelier", npc: "Faye", npcImage: npcImage("fairy-atelier"), travelAction: "Shop", travelLine: "Faye has fairy dresses and accessories in the glade.", shopGreeting: "Welcome to the Fairy Atelier. Pick dresses or accessories." },
  dwarfCottage: { ...forestAtlasArt("14.285% 50%"), scene: "scene-forest-dwarf-cottage", npc: "Pip", npcImage: npcImage("pip"), travelAction: "Shop", travelLine: "Pip has handmade forest outerwear and shoes ready for Lumi.", shopGreeting: "Welcome to the Dwarf Cottage. Pick outerwear or shoes." },
  stoneGolemPass: { ...forestAtlasArt("28.571% 50%"), scene: "scene-forest-golem-pass", npc: "Goro", npcImage: npcImage("goro"), travelAction: "Visit", travelLine: "Goro the stone golem blocks the old pass with a friendly smile." },
  halflingVillage: { ...forestAtlasArt("42.857% 50%"), scene: "scene-forest-halfling-village", npc: "Penny", npcImage: npcImage("penny"), travelAction: "Visit", travelLine: "Penny waves from a round green door." },
  wizardHut: { ...forestAtlasArt("57.143% 50%"), scene: "scene-forest-wizard-hut", npc: "Wiz Beryl", npcImage: npcImage("wiz-beryl"), travelAction: "Visit", travelLine: "Wiz Beryl is sorting jars under the purple roof." },
  redHoodPath: { ...forestAtlasArt("71.429% 50%"), scene: "scene-forest-red-hood-path", npc: "Ruby", npcImage: npcImage("ruby"), travelAction: "Visit", travelLine: "Ruby checks her basket on the forest path." },
  threePigsCottage: { ...forestAtlasArt("85.714% 50%"), scene: "scene-forest-three-pigs", npc: "Pippo", npcImage: npcImage("pippo"), travelAction: "Visit", travelLine: "Pippo looks at three tiny cottages." },
  treeSpiritGrove: { ...forestAtlasArt("100% 50%"), scene: "scene-forest-tree-spirit-grove", npc: "Sylvie", npcImage: npcImage("sylvie"), travelAction: "Visit", travelLine: "Sylvie the tree spirit smiles from the branches." }
});

export const forestQuestTemplates = makeQuestTemplates(forestLessonPlaces);
export const forestLessons = makeLessons("forest", forestVocabularyProfile, forestLessonPlaces);
