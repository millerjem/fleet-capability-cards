import {
  CapabilityCard,
  SettingsCard,
  ApprovalCard,
  C2IProfileCard,
  type C2ICard,
} from "../dist/index.js";
const card: C2ICard = {
  schemaVersion: 1,
  name: "demo",
  requestUID: "r",
  title: "Demo",
  profileVersion: "1",
  phase: "Ready",
  digest: "sha",
  settings: [],
};
const components = [
  <CapabilityCard
    name="Kite"
    platform="Drone"
    cluster="demo"
    profileVersion="1"
  />,
  <SettingsCard
    fields={[]}
    onSubmit={async (values) => {
      Object.keys(values);
    }}
  />,
  <ApprovalCard
    requestUID="r"
    planDigest="sha"
    onApprove={async (identity) => {
      identity.requestUID;
    }}
  />,
  <C2IProfileCard card={card} />,
];
void components;
