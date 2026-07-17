export const worldMap = Object.freeze({
  id: "world",
  label: "Kingdom World Map",
  mapImage: "content-base/world/assets/world-map.webp?v=20260621-world-map-1536-square-r1",
  imageSize: { width: 1536, height: 1536 },
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
      x: 47,
      y: 53.9,
      enabled: true,
      hint: "Visit the walled town, harbor, shops, school, and garden."
    },
    {
      id: "rural",
      label: "Rural",
      area: "rural",
      entryNode: "ruralEntrance",
      icon: "🌾",
      x: 68.4,
      y: 39.4,
      enabled: true,
      hint: "Go to the farms, mill, forest work paths, fishing shore, and mine."
    },
    {
      id: "wild",
      label: "Wild",
      area: "wild",
      entryNode: "wildEntrance",
      icon: "🌲",
      x: 30.2,
      y: 38.6,
      enabled: true,
      hint: "Enter the mountain forest, river paths, and fairy tale woods."
    },
    {
      id: "ocean",
      label: "Ocean",
      area: "ocean",
      entryNode: "",
      icon: "⚓",
      x: 38.9,
      y: 72.6,
      enabled: false,
      hint: "Ocean travel is planned for a later content package."
    }
  ]
});

