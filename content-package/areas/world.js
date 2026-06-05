export const worldRoutes = Object.freeze([
  {
    from: { area: "castle", portal: "castleGate" },
    to: { area: "urban", node: "castleRoom", portal: "castleStair" },
    label: "Urban"
  },
  {
    from: { area: "urban", portal: "castleStair" },
    to: { area: "castle", node: "castleGate", portal: "castleGate" },
    label: "Castle"
  },
  {
    from: { area: "urban", portal: "wildEdge" },
    to: { area: "wild", node: "wildEntrance", portal: "entrance" },
    label: "Enter Wild"
  },
  {
    from: { area: "urban", portal: "ruralGate" },
    to: { area: "rural", node: "ruralEntrance", portal: "entrance" },
    label: "Enter Rural"
  },
  {
    from: { area: "wild", portal: "entrance" },
    to: { area: "urban", node: "wildEdge", portal: "wildEdge" },
    label: "Back to Urban"
  },
  {
    from: { area: "rural", portal: "entrance" },
    to: { area: "urban", node: "ruralGate", portal: "ruralGate" },
    label: "Back to Urban"
  }
]);

export function routeForPortal(areaId, portalId) {
  return worldRoutes.find((route) => route.from.area === areaId && route.from.portal === portalId) || null;
}
