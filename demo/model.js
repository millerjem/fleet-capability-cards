export const profiles = [
  {
    id: 1,
    name: "Basic sensing",
    description:
      "Baseline observation services with local telemetry and object presence.",
    version: "1.0.0",
    capabilities: ["Object presence", "Local telemetry"],
    components: [
      { name: "Presence service", version: "1.0.0" },
      { name: "Telemetry exporter", version: "1.2.0" },
    ],
  },
  {
    id: 2,
    name: "Enhanced sensing",
    description:
      "Adds smoke classification and expanded observation coverage to the baseline stack.",
    version: "2.0.0",
    capabilities: ["Smoke classification", "Expanded coverage"],
    components: [
      { name: "Smoke classifier", version: "2.0.0" },
      { name: "Sensor adapter", version: "1.4.0" },
    ],
  },
  {
    id: 3,
    name: "Multisensor awareness",
    description:
      "Combines sensing services with thermal anomaly classification for a wider operating picture.",
    version: "3.0.0",
    capabilities: ["Thermal anomalies", "Multisensor fusion"],
    components: [
      { name: "Thermal runtime", version: "3.0.0" },
      { name: "Sensor fusion", version: "2.1.0" },
    ],
  },
];
export const steps = [
  "Prepare profile",
  "Download components",
  "Deploy services",
  "Verify capabilities",
];
export function initialState() {
  return {
    selected: "kite",
    sequence: 0,
    sites: [
      {
        id: "rover",
        name: "Rover 01",
        platform: "Ground team",
        cluster: "vertex-ground-demo",
        installed: 1,
        settings: { speed: "5", mode: "waypoint", reporting: "true" },
      },
      {
        id: "kite",
        name: "Kite 02",
        platform: "Uncrewed platform",
        cluster: "vertex-drone-demo",
        installed: 1,
        settings: { speed: "25", mode: "loiter", reporting: "true" },
      },
      {
        id: "atlas",
        name: "Atlas 03",
        platform: "Aircraft",
        cluster: "vertex-air-demo",
        installed: 2,
        settings: { speed: "35", mode: "loiter", reporting: "true" },
      },
    ],
    events: [],
  };
}
export function reducer(state, action) {
  if (action.type === "SELECT") return { ...state, selected: action.id };
  if (action.type === "RESET") return initialState();
  const index = state.sites.findIndex((s) => s.id === action.siteId);
  if (index < 0) return state;
  const site = state.sites[index],
    next = { ...site };
  let event;
  if (action.type === "REQUEST") {
    if (site.pending || site.rollout) return state;
    const sequence = state.sequence + 1;
    next.pending = {
      requestUID: `demo-request-${sequence}`,
      planDigest: `demo-plan-${site.id}-${sequence}`,
      kind: action.kind,
      target: action.target,
      settings: action.settings,
      changes: action.changes,
    };
    event = {
      title: "Update requested",
      description: `${site.name} · Awaiting review and approval`,
    };
  } else if (action.type === "APPROVE" || action.type === "REJECT") {
    if (
      !site.pending ||
      site.pending.requestUID !== action.requestUID ||
      site.pending.planDigest !== action.planDigest
    )
      return state;
    if (action.type === "APPROVE") {
      next.rollout = { ...site.pending, progress: 0 };
      event = {
        title: "Reviewed plan approved",
        description: `${site.name} · Simulated rollout started`,
      };
    } else
      event = {
        title: "Update rejected",
        description: `${site.name} · Installed configuration retained`,
      };
    next.pending = null;
  } else if (action.type === "TICK") {
    if (!site.rollout) return state;
    const progress = site.rollout.progress + 20;
    if (progress >= 100) {
      if (site.rollout.kind === "profile") next.installed = site.rollout.target;
      else next.settings = site.rollout.settings;
      next.rollout = null;
      next.verified = true;
      event = {
        title: "Capabilities verified",
        description: `${site.name} · Simulated configuration is now installed`,
      };
    } else next.rollout = { ...site.rollout, progress };
  } else return state;
  const sites = state.sites.map((s, i) => (i === index ? next : s));
  return {
    ...state,
    sites,
    sequence: action.type === "REQUEST" ? state.sequence + 1 : state.sequence,
    events: event
      ? [
          {
            ...event,
            id: `event-${state.events.length + 1}`,
            timestamp: action.timestamp || new Date().toISOString(),
          },
          ...state.events,
        ]
      : state.events,
  };
}
