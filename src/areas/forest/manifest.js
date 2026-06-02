export const forestArea = Object.freeze({
  id: "forest",
  label: "Forest",
  view: "map",
  mapImage: "src/areas/forest/assets/forest-map.svg",
  imageSize: { width: 1200, height: 900 },
  nodes: {
    forestEntrance: { id: "forestEntrance", label: "Forest Entrance", x: 12, y: 77, links: ["cave", "dwarfCottage"] },
    cave: { id: "cave", label: "Cave", x: 26, y: 58, links: ["forestEntrance", "dwarfCottage", "treeSpirit"] },
    dwarfCottage: { id: "dwarfCottage", label: "Dwarf Cottage", x: 48, y: 62, links: ["forestEntrance", "cave", "treeSpirit", "mountainPeak"] },
    treeSpirit: { id: "treeSpirit", label: "Tree Spirit Tree", x: 63, y: 36, links: ["cave", "dwarfCottage", "mountainPeak"] },
    mountainPeak: { id: "mountainPeak", label: "Mountain Peak", x: 80, y: 22, links: ["dwarfCottage", "treeSpirit"] }
  },
  locations: [
    { id: "forestExit", area: "forest", node: "forestEntrance", label: "Kingdom Path", icon: "↩", npcClass: "npc-none", npc: "Forest Sign", kind: "gate", markerStyle: "portal", portalId: "entrance", hint: "The path returns to the kingdom town." },
    { id: "cave", area: "forest", node: "cave", label: "Cave", icon: "🕯", npcClass: "npc-cave-guide", npc: "Cave Guide", scene: "scene-forest-cave", hint: "A quiet cave glows with tiny learning lights." },
    { id: "dwarfCottage", area: "forest", node: "dwarfCottage", label: "Dwarf Cottage", icon: "🛖", npcClass: "npc-dwarf", npc: "Pip", scene: "scene-dwarf-cottage", kind: "shop", shopCategories: ["accessory"], defaultCategory: "accessory", hint: "Pip keeps handmade forest treasures in a warm cottage." },
    { id: "mountainPeak", area: "forest", node: "mountainPeak", label: "Mountain Peak", icon: "⛰", npcClass: "npc-mountain-guide", npc: "Alto", scene: "scene-mountain-peak", hint: "The mountain peak has a clear view over the treetops." },
    { id: "treeSpirit", area: "forest", node: "treeSpirit", label: "Tree Spirit Tree", icon: "✨", npcClass: "npc-tree-spirit", npc: "Sylvie", scene: "scene-tree-spirit", hint: "A gentle tree spirit listens to children practicing English." }
  ],
  actors: [
    { id: "forest-firefly-a", type: "glow", x: 36, y: 45, w: 8, h: 8, z: 3, phase: 0.2 },
    { id: "forest-firefly-b", type: "glow", x: 66, y: 30, w: 7, h: 7, z: 3, phase: 1.1 },
    { id: "forest-bird", type: "bird", x: 54, y: 20, w: 4, h: 2, z: 4, phase: 0.6 }
  ],
  defaultNode: "forestEntrance",
  enabled: true
});

export const forestSceneConfigs = Object.freeze({
  forestExit: { scene: "scene-forest-path", npcClass: "npc-none", npc: "Forest Sign", travelAction: "Back to Kingdom", travelLine: "The path returns to the kingdom town." },
  cave: { scene: "scene-forest-cave", npcClass: "npc-cave-guide", npc: "Cave Guide", travelAction: "Visit", travelLine: "The cave lights are soft. The guide is waiting for one short English sentence." },
  dwarfCottage: { scene: "scene-dwarf-cottage", npcClass: "npc-dwarf", npc: "Pip", travelAction: "Shop", travelLine: "Pip has handmade forest treasures ready for Lumi.", shopGreeting: "Welcome to the dwarf cottage. Pick a gentle forest treasure." },
  mountainPeak: { scene: "scene-mountain-peak", npcClass: "npc-mountain-guide", npc: "Alto", travelAction: "Visit", travelLine: "Alto points to the bright sky above the trees." },
  treeSpirit: { scene: "scene-tree-spirit", npcClass: "npc-tree-spirit", npc: "Sylvie", travelAction: "Visit", travelLine: "Sylvie the tree spirit smiles from the branches." }
});

export const forestQuestTemplates = Object.freeze([
  { id: "forestCaveLight", place: "cave", title: "Light the cave lantern", opening: "Hello, Princess! The cave is dark, but the lantern is small.", ending: "The lantern is bright now. The cave feels safe." },
  { id: "forestTreeSong", place: "treeSpirit", title: "Listen to the tree spirit", opening: "Hello, little friend. The tree is tall and green.", ending: "The tree spirit hums softly. Thank you for listening." },
  { id: "forestPeakSky", place: "mountainPeak", title: "Look from the mountain peak", opening: "Good day, Princess! The sky is clear from here.", ending: "You saw the bright sky. The forest path is easy to follow." },
  { id: "forestCottageGift", place: "dwarfCottage", title: "Choose a forest gift", opening: "Welcome, Princess! This cloak is green.", ending: "The forest gift is ready for Lumi." }
]);

export const forestLessons = Object.freeze([
  { id: "forest-cave-light-100", place: "cave", tier: 100, prompt: "Pick the sentence about the cave.", answer: "The cave is dark.", choices: ["The cave is dark.", "The fish is pink.", "I eat a shoe.", "The dress is sunny."], words: ["cave", "dark"], reward: { vocab: 1, kindness: 1 } },
  { id: "forest-tree-green-100", place: "treeSpirit", tier: 100, prompt: "Pick the sentence about the tree.", answer: "The tree is green.", choices: ["The tree is green.", "The boat is green.", "I want bread.", "The crown is cloudy."], words: ["tree", "green"], reward: { vocab: 1, expression: 1 } },
  { id: "forest-peak-sky-100", place: "mountainPeak", tier: 100, prompt: "Pick the sentence about the sky.", answer: "The sky is clear.", choices: ["The sky is clear.", "The cow is clear.", "I see a fish.", "The shoes are bread."], words: ["sky", "clear"], reward: { vocab: 1, expression: 1 } },
  { id: "forest-cottage-cloak-100", place: "dwarfCottage", tier: 100, prompt: "Pick the sentence about the cloak.", answer: "The cloak is green.", choices: ["The cloak is green.", "The cave is bread.", "I eat a crown.", "The sea is a shoe."], words: ["cloak", "green"], reward: { vocab: 1, expression: 1 } }
]);
