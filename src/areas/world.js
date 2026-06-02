export const worldRoutes = Object.freeze([
  {
    from: { area: "castle", portal: "castleGate" },
    to: { area: "kingdom", node: "castleRoom", portal: "castleStair" },
    label: "Kingdom"
  },
  {
    from: { area: "kingdom", portal: "castleStair" },
    to: { area: "castle", node: "castleGate", portal: "castleGate" },
    label: "Castle"
  },
  {
    from: { area: "kingdom", portal: "forestEdge" },
    to: { area: "forest", node: "forestEntrance", portal: "entrance" },
    label: "Enter Forest"
  },
  {
    from: { area: "forest", portal: "entrance" },
    to: { area: "kingdom", node: "forestEdge", portal: "forestEdge" },
    label: "Back to Kingdom"
  }
]);

export function routeForPortal(areaId, portalId) {
  return worldRoutes.find((route) => route.from.area === areaId && route.from.portal === portalId) || null;
}
