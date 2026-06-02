export const castleArea = Object.freeze({
  id: "castle",
  label: "Castle",
  view: "home",
  mapImage: "assets/castle-map2.webp?v=20260601-optimized-assets",
  imageSize: { width: 1312, height: 1199 },
  nodes: {
    princessRoom: { id: "princessRoom", label: "Princess Room", x: 40.7, y: 56.5 },
    kingRoom: { id: "kingRoom", label: "King Room", x: 50.2, y: 31.5 },
    queenRoom: { id: "queenRoom", label: "Queen Room", x: 30.2, y: 52.8 },
    castleGate: { id: "castleGate", label: "Castle Gate", x: 40.7, y: 79.8 }
  },
  locations: [
    { id: "princessRoom", area: "castle", node: "princessRoom", label: "Princess Room", icon: "🚪", npcClass: "npc-none", npc: "Lumi", scene: "scene-princess-room", kind: "room", hint: "Enter Lumi's room for dress-up, shoes, accessories, and room treasures." },
    { id: "kingRoom", area: "castle", node: "kingRoom", label: "King Room", icon: "👑", npcClass: "npc-none", npc: "Royal Guard", scene: "scene-princess-room", kind: "future", hint: "The king's room is reserved for a future story." },
    { id: "queenRoom", area: "castle", node: "queenRoom", label: "Queen Room", icon: "💐", npcClass: "npc-none", npc: "Royal Guard", scene: "scene-princess-room", kind: "future", hint: "The queen's room will open in a future chapter." },
    { id: "castleGate", area: "castle", node: "castleGate", label: "Castle Gate", icon: "🏰", npcClass: "npc-garden", npc: "Gate Guard", scene: "scene-garden", kind: "gate", markerStyle: "portal", portalId: "castleGate", hint: "Go out to the kingdom travel map." }
  ],
  defaultNode: "princessRoom",
  enabled: true
});

export const castleSceneConfigs = Object.freeze({
  princessRoom: { scene: "scene-princess-room", npcClass: "npc-none", npc: "Lumi", travelAction: "Enter", travelLine: "Lumi's room is ready for dress-up and room treasures." },
  kingRoom: { scene: "scene-princess-room", npcClass: "npc-none", npc: "Royal Guard", travelAction: "Preview", travelLine: "The king's room is reserved for a later story." },
  queenRoom: { scene: "scene-princess-room", npcClass: "npc-none", npc: "Royal Guard", travelAction: "Preview", travelLine: "The queen's room will open in a later chapter." },
  castleGate: { scene: "scene-garden", npcClass: "npc-garden", npc: "Gate Guard", travelAction: "Travel", travelLine: "The castle gate leads back to the kingdom map." }
});
