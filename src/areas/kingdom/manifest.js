export const kingdomArea = Object.freeze({
  id: "kingdom",
  label: "Kingdom",
  view: "map",
  mapImage: "assets/kingdom-map2.webp?v=20260601-optimized-assets",
  imageSize: { width: 1672, height: 941 },
  nodes: {
    castleRoom: { id: "castleRoom", label: "Castle Stairway", x: 49.4, y: 37.4, links: ["garden", "market", "farm", "forestEdge"] },
    forestEdge: { id: "forestEdge", label: "Forest Path", x: 10.6, y: 18.4, links: ["castleRoom", "farm"] },
    garden: { id: "garden", label: "Castle Garden", x: 49.7, y: 52.8, links: ["castleRoom", "market"] },
    market: { id: "market", label: "Market Square", x: 28.0, y: 61.6, links: ["garden", "boutique", "shoeShop", "harbor", "port"] },
    boutique: { id: "boutique", label: "Dress Boutique", x: 64.0, y: 59.0, links: ["market", "shoeShop", "accessoryShop", "farm"] },
    shoeShop: { id: "shoeShop", label: "Shoe Shop", x: 67.5, y: 65.0, links: ["market", "harbor", "boutique"] },
    accessoryShop: { id: "accessoryShop", label: "Accessory Shop", x: 74.2, y: 61.1, links: ["boutique", "farm"] },
    farm: { id: "farm", label: "Sunny Farm", x: 87.0, y: 19.8, links: ["castleRoom", "forestEdge", "accessoryShop", "boutique"] },
    harbor: { id: "harbor", label: "Fish Shop", x: 35.6, y: 63.0, links: ["market", "shoeShop", "port"] },
    port: { id: "port", label: "Harbor Port", x: 40.8, y: 87.6, links: ["market", "harbor", "lighthouse"] },
    lighthouse: { id: "lighthouse", label: "Lighthouse", x: 77.3, y: 78.2, links: ["port"] }
  },
  locations: [
    { id: "luminaraCastle", area: "kingdom", node: "castleRoom", label: "Luminara Castle", icon: "🏰", npcClass: "npc-none", npc: "Gate Guard", kind: "gate", markerStyle: "portal", portalId: "castleStair", hint: "Climb the purple castle stairway back inside." },
    { id: "forestEdge", area: "kingdom", node: "forestEdge", label: "Forest Path", icon: "🌲", npcClass: "npc-none", npc: "Forest Sign", kind: "gate", markerStyle: "portal", portalId: "forestEdge", hint: "A leafy path leads into the forest." },
    { id: "port", area: "kingdom", node: "port", label: "Harbor Port", icon: "⚓", npcClass: "npc-none", npc: "Dock Guide", scene: "scene-harbor", hint: "The docks are ready for boats and sea trips." },
    { id: "garden", area: "kingdom", node: "garden", label: "Castle Garden", icon: "🌷", npcClass: "npc-garden", npc: "Mira", scene: "scene-garden", hint: "The garden is quiet. A small cat may be hiding near the roses." },
    { id: "market", area: "kingdom", node: "market", label: "Market Square", icon: "🥖", npcClass: "npc-market", npc: "Auntie Pom", scene: "scene-market", kind: "shop", shopCategories: ["room"], defaultCategory: "room", hint: "The market has warm bread on one side and cozy room treasures on the other." },
    { id: "harbor", area: "kingdom", node: "harbor", label: "Fish Shop", icon: "🐟", npcClass: "npc-harbor", npc: "Nami", scene: "scene-harbor", hint: "The fish shop has fresh fish for dinner." },
    { id: "boutique", area: "kingdom", node: "boutique", label: "Dress Boutique", icon: "👗", npcClass: "npc-boutique", npc: "Rena", scene: "scene-boutique", kind: "shop", shopCategories: ["hairstyle", "top", "bottom", "dress", "outer"], defaultCategory: "dress", hint: "Rena's boutique has dresses, tops, skirts, hairstyles, and outerwear for doll play." },
    { id: "shoeShop", area: "kingdom", node: "shoeShop", label: "Shoe Shop", icon: "👞", npcClass: "npc-shoes", npc: "Mina", scene: "scene-shoes", kind: "shop", shopCategories: ["shoes"], defaultCategory: "shoes", hint: "Mina shows shoes for long walks." },
    { id: "accessoryShop", area: "kingdom", node: "accessoryShop", label: "Accessory Shop", icon: "🎀", npcClass: "npc-accessory", npc: "Lili", scene: "scene-accessory", kind: "shop", shopCategories: ["accessory"], defaultCategory: "accessory", hint: "Lili sells crowns, ribbons, glasses, masks, necklaces, and bags." },
    { id: "farm", area: "kingdom", node: "farm", label: "Sunny Farm", icon: "🐄", npcClass: "npc-farm", npc: "Theo", scene: "scene-farm", hint: "The farm is busy. Theo is brushing the big cow." },
    { id: "lighthouse", area: "kingdom", node: "lighthouse", label: "Lighthouse", icon: "🗼", npcClass: "npc-lighthouse", npc: "Captain Sol", scene: "scene-lighthouse", hint: "The lighthouse watches the sea before ships sail." }
  ],
  actors: [
    { id: "river-flow", type: "water", src: "assets/map-layers/river-flow.webp", x: 14.6, y: 29.5, w: 11.5, h: 39.0, z: 2, phase: 0.3 },
    { id: "harbor-flow", type: "water", src: "assets/map-layers/harbor-flow.webp", x: 41.5, y: 86.8, w: 33.5, h: 23.6, z: 2, phase: 1.1 },
    { id: "ocean-flow", type: "water", src: "assets/map-layers/ocean-flow.webp", x: 91.2, y: 56.5, w: 19.0, h: 48.0, z: 2, phase: 1.8 },
    { id: "harbor-ship-large", type: "ship", src: "assets/map-layers/harbor-ship-large.webp", x: 42.7, y: 89.0, w: 14.8, h: 14.0, z: 3, phase: 0.2 },
    { id: "harbor-ship-small", type: "ship", src: "assets/map-layers/harbor-ship-small.webp", x: 31.2, y: 91.2, w: 4.6, h: 7.1, z: 3, phase: 1.4 },
    { id: "lighthouse-boat", type: "ship", src: "assets/map-layers/lighthouse-boat.webp", x: 55.6, y: 92.7, w: 4.8, h: 7.1, z: 3, phase: 2.0 },
    { id: "castle-flag", type: "flag", src: "assets/map-layers/castle-flag.webp", x: 49.7, y: 3.4, w: 3.4, h: 5.1, anchorX: 0.5, anchorY: 0.95, z: 6 },
    { id: "farm-windmill", type: "windmill", src: "assets/map-layers/windmill-blades.webp", x: 89.5, y: 20.4, w: 4.8, h: 8.6, z: 4 },
    { id: "forest-lantern", type: "glow", x: 10.6, y: 18.4, w: 10, h: 10, z: 1, phase: 0.8 },
    { id: "lighthouse-glow", type: "glow", x: 78.7, y: 75.4, w: 12, h: 12, z: 1 },
    { id: "sea-bird-a", type: "bird", x: 42.8, y: 86.5, w: 3.4, h: 1.5, z: 5, phase: 0.4 },
    { id: "sea-bird-b", type: "bird", x: 65.0, y: 84.6, w: 3.0, h: 1.3, z: 5, phase: 1.6 }
  ],
  defaultNode: "garden",
  enabled: true
});

export const kingdomSceneConfigs = Object.freeze({
  luminaraCastle: { scene: "scene-garden", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "Castle", travelLine: "Return to Lumi's room for dress-up time." },
  forestEdge: { scene: "scene-forest-path", npcClass: "npc-none", npc: "Forest Sign", travelAction: "Enter Forest", travelLine: "The leafy path leads to a quiet forest map." },
  castleRoom: { scene: "scene-garden", npcClass: "npc-garden", npc: "Lumi", travelAction: "Room", travelLine: "Return to Lumi's room for dress-up time." },
  garden: { scene: "scene-garden", npcClass: "npc-garden", npc: "Mira", travelAction: "Visit", travelLine: "Mira is watching the roses and a shy garden cat." },
  market: { scene: "scene-market", npcClass: "npc-market", npc: "Auntie Pom", travelAction: "Shop", travelLine: "Auntie Pom's market stall has warm bread and a tiny room-treasures corner.", shopGreeting: "Welcome to the room-treasures stall. Pick something cozy for Lumi's room." },
  harbor: { scene: "scene-harbor", npcClass: "npc-harbor", npc: "Nami", travelAction: "Visit", travelLine: "Nami is waiting by the bright harbor boats." },
  port: { scene: "scene-harbor", npcClass: "npc-none", npc: "Dock Guide", travelAction: "Visit", travelLine: "Boats arrive at the harbor port for sea trips and dock visits." },
  boutique: { scene: "scene-boutique", npcClass: "npc-boutique", npc: "Rena", travelAction: "Shop", travelLine: "Rena has dresses, tops, skirts, hairstyles, and outerwear ready for a bright day.", shopGreeting: "Welcome, Princess. Paper-doll outfits are ready for a bright day." },
  shoeShop: { scene: "scene-shoes", npcClass: "npc-shoes", npc: "Mina", travelAction: "Shop", travelLine: "Mina has walking shoes for Lumi's next trip.", shopGreeting: "Hello, Princess. Try shoes for the road." },
  accessoryShop: { scene: "scene-accessory", npcClass: "npc-accessory", npc: "Lili", travelAction: "Shop", travelLine: "Lili has ribbons, crowns, glasses, masks, necklaces, and bags.", shopGreeting: "Good day, Princess. Pick a crown, ribbon, glasses, mask, necklace, or bag." },
  farm: { scene: "scene-farm", npcClass: "npc-farm", npc: "Theo", travelAction: "Visit", travelLine: "Theo is caring for the animals at Sunny Farm." },
  lighthouse: { scene: "scene-lighthouse", npcClass: "npc-lighthouse", npc: "Captain Sol", travelAction: "Visit", travelLine: "Captain Sol checks the sea from the lighthouse." }
});
