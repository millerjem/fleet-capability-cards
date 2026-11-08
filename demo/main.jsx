import React, { useEffect, useMemo, useReducer, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CapabilityCard,
  ProfileCard,
  SettingsCard,
  ApprovalCard,
  RolloutCard,
  ActivityCard,
  C2IProfileCard,
} from "@millerjem/fleet-capability-cards";
import "@millerjem/fleet-capability-cards/styles.css";
import { initialState, profiles, reducer, steps } from "./model.js";
import "./style.css";
function App() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState),
    [view, setView] = useState("Profiles"),
    [light, setLight] = useState(false),
    [reviewer, setReviewer] = useState(true);
  const site = state.sites.find((s) => s.id === state.selected),
    installed = profiles.find((p) => p.id === site.installed),
    busy = !!(site.pending || site.rollout);
  useEffect(() => {
    const timer = setInterval(() => {
      for (const s of state.sites)
        if (s.rollout) dispatch({ type: "TICK", siteId: s.id });
    }, 750);
    return () => clearInterval(timer);
  }, [state.sites]);
  const fields = useMemo(
    () => [
      {
        name: "speed",
        label: "Ground speed (mph)",
        format: "number",
        min: 0,
        max: 100,
        required: true,
        value: site.settings.speed,
        description: "Synthetic platform movement.",
      },
      {
        name: "mode",
        label: "Navigation mode",
        value: site.settings.mode,
        options: [
          { value: "loiter", label: "Circular loiter" },
          { value: "waypoint", label: "Waypoint patrol" },
          { value: "heading", label: "Hold heading" },
        ],
      },
      {
        name: "reporting",
        label: "Telemetry reporting",
        format: "boolean",
        value: site.settings.reporting,
      },
    ],
    [site.id, site.settings],
  );
  const submit = (settings) =>
    dispatch({
      type: "REQUEST",
      siteId: site.id,
      kind: "settings",
      settings,
      changes: Object.entries(settings)
        .filter(([k, v]) => v !== site.settings[k])
        .map(([k, after]) => ({
          label: fields.find((f) => f.name === k)?.label || k,
          before: site.settings[k],
          after,
        })),
    });
  const approve = (identity) =>
    dispatch({ type: "APPROVE", siteId: site.id, ...identity });
  const reject = (identity) =>
    dispatch({ type: "REJECT", siteId: site.id, ...identity });
  const active = state.sites.filter((s) => s.rollout).length,
    pending = state.sites.filter((s) => s.pending).length;
  const c2i = {
    schemaVersion: 1,
    name: "application-config-demo",
    requestUID: "fixture-request",
    title: "Application services",
    profileVersion: "1.0.0",
    phase: "PendingApproval",
    message:
      "Synthetic C2I card JSON, rendered directly through the React adapter.",
    digest: "fixture-plan-not-valid-for-real-approval",
    settings: [
      {
        name: "application_replicas",
        label: "Application replicas",
        format: "number",
        value: "3",
      },
    ],
    review: { requestedSettings: { application_replicas: "3" } },
    actions: { approve: true },
  };
  const [adapterEvent, setAdapterEvent] = useState(
    "Use the card to inspect its callback payload.",
  );
  return (
    <div
      className={`demo-shell ${light ? "demo-light" : ""}`}
      data-fc-theme={light ? "light" : "dark"}
    >
      <header className="demo-header">
        <a
          className="demo-wordmark"
          href="https://github.com/millerjem/fleet-capability-cards"
          target="_blank"
          rel="noreferrer"
        >
          fleet<span>/</span>cards
        </a>
        <span className="demo-header-label">React component library</span>
        <div className="demo-header-actions">
          <button onClick={() => setLight((x) => !x)}>
            {light ? "Dark theme" : "Light theme"}
          </button>
          <a
            href="https://github.com/millerjem/fleet-capability-cards#readme"
            target="_blank"
            rel="noreferrer"
          >
            Documentation <span aria-hidden="true">↗</span>
          </a>
        </div>
      </header>
      <main>
        <section className="demo-intro">
          <div>
            <p className="demo-kicker">Capabilities, under control</p>
            <h1>
              Fleet capability explorer<span>.</span>
            </h1>
            <p>Discover capabilities. Review changes. Verify deployment.</p>
          </div>
          <div className="demo-synthetic">
            <span />
            Interactive demo · Synthetic data
          </div>
        </section>
        <section className="demo-summary" aria-label="Fleet summary">
          <div>
            <span>CONNECTED PLATFORMS</span>
            <strong>
              03<small>Demo fleet</small>
            </strong>
          </div>
          <div>
            <span>AWAITING APPROVAL</span>
            <strong>
              {String(pending).padStart(2, "0")}
              <small>Human review required</small>
            </strong>
          </div>
          <div>
            <span>ACTIVE ROLLOUTS</span>
            <strong>
              {String(active).padStart(2, "0")}
              <small>
                {active
                  ? "Verification in progress"
                  : "All platforms available"}
              </small>
            </strong>
          </div>
        </section>
        <div className="demo-section-label">
          <h2>Your platforms</h2>
          <span>Select a platform to explore its profiles</span>
        </div>
        <section className="demo-platforms" aria-label="Platforms">
          {state.sites.map((s) => (
            <CapabilityCard
              key={s.id}
              name={s.name}
              platform={s.platform}
              cluster={s.cluster}
              profileVersion={
                profiles.find((p) => p.id === s.installed).version
              }
              status={
                s.rollout ? "Applying" : s.pending ? "PendingApproval" : "Ready"
              }
              selected={s.id === site.id}
              onSelect={() => dispatch({ type: "SELECT", id: s.id })}
              capabilities={
                profiles.find((p) => p.id === s.installed).capabilities
              }
              metrics={[
                { label: "Speed", value: `${s.settings.speed} mph` },
                { label: "Sensing", value: `Level ${s.installed}` },
                {
                  label: "Telemetry",
                  value: s.settings.reporting === "true" ? "Enabled" : "Paused",
                },
              ]}
            />
          ))}
        </section>
        <div className="demo-workspace">
          <section className="demo-main-panel">
            <div className="demo-section-label">
              <div>
                <p className="demo-kicker">{site.name} / Profile controls</p>
                <h2>Build the next capability</h2>
              </div>
              <button
                className="demo-reset"
                onClick={() => dispatch({ type: "RESET" })}
              >
                Reset demo
              </button>
            </div>
            <nav className="demo-tabs" aria-label="Explorer views">
              {["Profiles", "Settings", "Activity", "C2I adapter"].map((v) => (
                <button
                  aria-pressed={view === v}
                  key={v}
                  onClick={() => setView(v)}
                >
                  {v}
                </button>
              ))}
            </nav>
            {view === "Profiles" && (
              <>
                <div className="demo-profile-grid">
                  {profiles.map((p) => (
                    <ProfileCard
                      key={p.id}
                      name={p.name}
                      version={p.version}
                      description={p.description}
                      capabilities={p.capabilities}
                      components={p.components}
                      status={
                        p.id === site.installed
                          ? "Installed"
                          : p.id < site.installed
                            ? "Installed"
                            : site.pending?.target === p.id
                              ? "PendingApproval"
                              : "Available"
                      }
                      disabled={busy || p.id <= site.installed}
                      onRequest={
                        p.id > site.installed
                          ? () =>
                              dispatch({
                                type: "REQUEST",
                                siteId: site.id,
                                kind: "profile",
                                target: p.id,
                                changes: [
                                  {
                                    label: "Sensing profile",
                                    before: installed.name,
                                    after: p.name,
                                  },
                                  {
                                    label: "Profile version",
                                    before: installed.version,
                                    after: p.version,
                                  },
                                ],
                              })
                          : undefined
                      }
                    />
                  ))}
                </div>
                <p className="demo-note">
                  Installed capabilities remain active until the approved
                  rollout passes verification.
                </p>
              </>
            )}
            {view === "Settings" && (
              <SettingsCard
                fields={fields}
                revision={site.id}
                onSubmit={submit}
                disabled={busy}
              />
            )}
            {view === "Activity" && <ActivityCard events={state.events} />}
            {view === "C2I adapter" && (
              <>
                <C2IProfileCard
                  card={c2i}
                  canApprove={reviewer}
                  onRequest={(d) =>
                    setAdapterEvent(
                      JSON.stringify({ event: "request", ...d }, null, 2),
                    )
                  }
                  onApprove={(d) =>
                    setAdapterEvent(
                      JSON.stringify({ event: "approve", ...d }, null, 2),
                    )
                  }
                  onReject={(d) =>
                    setAdapterEvent(
                      JSON.stringify({ event: "reject", ...d }, null, 2),
                    )
                  }
                />
                <pre className="demo-code" role="status">
                  {adapterEvent}
                </pre>
              </>
            )}
          </section>
          <aside>
            <div className="demo-section-label">
              <h2>Review & deploy</h2>
              <label className="demo-reviewer">
                <input
                  type="checkbox"
                  checked={reviewer}
                  onChange={(e) => setReviewer(e.target.checked)}
                />
                Reviewer controls
              </label>
            </div>
            {site.pending ? (
              <ApprovalCard
                title={`${site.name} update`}
                requestUID={site.pending.requestUID}
                planDigest={site.pending.planDigest}
                changes={site.pending.changes}
                onApprove={reviewer ? approve : undefined}
                onReject={reviewer ? reject : undefined}
              />
            ) : site.rollout ? (
              <RolloutCard
                title={`${site.name} rollout`}
                progress={site.rollout.progress}
                steps={steps}
                activeStep={Math.min(3, Math.floor(site.rollout.progress / 25))}
                message="Simulated deployment. Awaiting capability verification."
              />
            ) : (
              <div className="demo-empty">
                <div className="demo-empty-mark" aria-hidden="true">
                  01 / 02 / 03
                </div>
                <h3>
                  {site.verified
                    ? "Capabilities verified"
                    : "A deliberate path to change"}
                </h3>
                <p>
                  {site.verified
                    ? "The approved configuration is installed in this simulation. Request another capability to continue."
                    : "Request a profile or settings change, review the proposed update, then approve deployment."}
                </p>
                <ol>
                  <li>Request a change</li>
                  <li>Review and approve</li>
                  <li>Verify the rollout</li>
                </ol>
              </div>
            )}
            <div className="demo-aside-note">
              <span className="demo-kicker">Built for your application</span>
              <p>
                Controlled React components. Bring your own authentication and
                backend.
              </p>
              <code>
                npm install ./millerjem-fleet-capability-cards-0.1.0.tgz
              </code>
            </div>
          </aside>
        </div>
      </main>
      <footer className="demo-footer">
        <span>
          Community library · Inspired by the fleet capability explorer
        </span>
        <span>All approvals and deployments on this page are simulated.</span>
      </footer>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
