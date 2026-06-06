export const worldMap = Object.freeze({
  id: "world",
  label: "Kingdom World Map",
  mapImage: "content-base/world/assets/world-map.webp?v=20260606-issue66-map-contract-r1",
  imageSize: { width: 1024, height: 1536 },
  destinations: [
    {
      id: "castle",
      label: "Castle",
      area: "castle",
      entryNode: "castleGate",
      icon: "🏰",
      x: 51,
      y: 32,
      enabled: true,
      hint: "Return to the blue-roof Luminara Castle."
    },
    {
      id: "urban",
      label: "Urban",
      area: "urban",
      entryNode: "castleRoom",
      icon: "🏘",
      x: 50,
      y: 52,
      enabled: true,
      hint: "Visit the walled town, harbor, shops, school, and garden."
    },
    {
      id: "rural",
      label: "Rural",
      area: "rural",
      entryNode: "ruralEntrance",
      icon: "🌾",
      x: 78,
      y: 48,
      enabled: true,
      hint: "Go to the farms, mill, forest work paths, fishing shore, and mine."
    },
    {
      id: "wild",
      label: "Wild",
      area: "wild",
      entryNode: "wildEntrance",
      icon: "🌲",
      x: 24,
      y: 43,
      enabled: true,
      hint: "Enter the mountain forest, river paths, and fairy tale woods."
    },
    {
      id: "ocean",
      label: "Ocean",
      area: "ocean",
      entryNode: "",
      icon: "⚓",
      x: 49,
      y: 78,
      enabled: false,
      hint: "Ocean travel is planned for a later content package."
    }
  ]
});

