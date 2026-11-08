import React, { useEffect, useId, useMemo, useState } from "react";
import {
  normalizeC2ICard,
  safeURL,
  sameSettings,
  settingsValues,
  validateFields,
} from "./model.js";
const phaseLabels = {
  PendingApproval: "Awaiting approval",
  SubmissionUncertain: "Needs review",
  Ready: "Verified",
  Applying: "Installing",
  Blocked: "Blocked",
  Rejected: "Rejected",
  Available: "Available",
  Installed: "Installed",
  Drifted: "Configuration changed",
  Submitting: "Submitting",
};
export function StatusBadge({ status = "Available" }) {
  return (
    <span className={`fc-badge fc-status-${status.toLowerCase()}`}>
      {phaseLabels[status] || status}
    </span>
  );
}
function Frame({
  title,
  eyebrow,
  subtitle,
  status,
  children,
  className = "",
  actions,
}) {
  const id = useId();
  return (
    <article className={`fc-card ${className}`} aria-labelledby={id}>
      <header className="fc-card-head">
        <div>
          {eyebrow && <p className="fc-eyebrow">{eyebrow}</p>}
          <h3 id={id}>{title}</h3>
          {subtitle && <p className="fc-subtitle">{subtitle}</p>}
        </div>
        {status && <StatusBadge status={status} />}
      </header>
      {children}
      {actions && <footer className="fc-actions">{actions}</footer>}
    </article>
  );
}
function Action({ onAction, children, disabled = false, secondary = false }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <button
        className={`fc-button ${secondary ? "fc-secondary" : ""}`}
        type="button"
        disabled={disabled || busy}
        onClick={async () => {
          setError("");
          setBusy(true);
          try {
            await onAction?.();
          } catch {
            setError(
              "Action failed. Refresh the current state before trying again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Working…" : children}
      </button>
      {error && (
        <p className="fc-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
export function CapabilityCard({
  name,
  platform,
  cluster,
  profileVersion,
  status = "Ready",
  capabilities = [],
  selected = false,
  onSelect,
  metrics = [],
}) {
  return (
    <Frame
      title={name}
      eyebrow={platform}
      subtitle={cluster}
      status={status}
      className={selected ? "fc-selected" : ""}
      actions={
        onSelect && (
          <Action secondary onAction={onSelect}>
            {selected ? "Selected platform" : "Inspect platform"}
          </Action>
        )
      }
    >
      <p className="fc-version">
        Profile <strong>{profileVersion}</strong>
      </p>
      <div className="fc-chips">
        {capabilities.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      {metrics.length > 0 && (
        <dl className="fc-metrics">
          {metrics.map((m) => (
            <div key={m.label}>
              <dt>{m.label}</dt>
              <dd>{m.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Frame>
  );
}
export function ProfileCard({
  name,
  description,
  version,
  status = "Available",
  capabilities = [],
  components = [],
  onRequest,
  disabled = false,
  reviewURL,
}) {
  const href = safeURL(reviewURL);
  return (
    <Frame
      title={name}
      eyebrow={`Profile ${version}`}
      status={status}
      actions={
        <>
          {onRequest && (
            <Action
              onAction={onRequest}
              disabled={
                disabled ||
                !["Available", "Rejected", "Drifted"].includes(status)
              }
            >
              Request enhancement
            </Action>
          )}
          {href && (
            <a
              className="fc-link"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              Review in VerteX
            </a>
          )}
        </>
      }
    >
      <p className="fc-description">{description}</p>
      <div className="fc-chips">
        {capabilities.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      {components.length > 0 && (
        <ul className="fc-components">
          {components.map((c) => (
            <li key={c.name}>
              <span>{c.name}</span>
              <code>{c.version}</code>
            </li>
          ))}
        </ul>
      )}
    </Frame>
  );
}
export function SettingsCard({
  title = "Deployment settings",
  fields,
  revision,
  onSubmit,
  disabled = false,
  onDirtyChange,
}) {
  const initial = useMemo(() => settingsValues(fields), [fields]);
  const fingerprint = JSON.stringify(initial);
  const [values, setValues] = useState(initial),
    [errors, setErrors] = useState({}),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const id = useId();
  useEffect(() => {
    setValues(initial);
    setErrors({});
    setMessage("");
  }, [fingerprint, revision]);
  const dirty = !sameSettings(initial, values);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  return (
    <Frame title={title} eyebrow="Profile variables">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (disabled || busy || !onSubmit) return;
          const next = validateFields(fields, values);
          setErrors(next);
          setMessage("");
          if (Object.keys(next).length) return;
          setBusy(true);
          try {
            await onSubmit({ ...values });
            setMessage(
              "Settings request created. Review and approval are required.",
            );
          } catch {
            setMessage(
              "Request failed. Refresh the current state before trying again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="fc-fields">
          {fields.map((f, i) => {
            const fieldId = `${id}-${i}`,
              hintId = `${fieldId}-hint`,
              errorId = `${fieldId}-error`;
            const common = {
              id: fieldId,
              name: f.name,
              value: values[f.name] ?? "",
              disabled: disabled || busy || f.readOnly,
              onChange: (e) => {
                setValues((v) => ({ ...v, [f.name]: e.target.value }));
                setMessage("");
              },
              "aria-required": f.required || undefined,
              "aria-invalid": !!errors[f.name],
              "aria-describedby":
                [f.description && hintId, errors[f.name] && errorId]
                  .filter(Boolean)
                  .join(" ") || undefined,
            };
            return (
              <div key={f.name} className="fc-field">
                <label htmlFor={fieldId}>
                  {f.label || f.name}
                  {f.required && <span aria-hidden="true"> *</span>}
                </label>
                {f.options?.length ? (
                  <select {...common}>
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label || o.value}
                      </option>
                    ))}
                  </select>
                ) : f.format === "boolean" ? (
                  <select {...common}>
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                ) : (
                  <input
                    {...common}
                    type="text"
                    inputMode={f.format === "number" ? "decimal" : undefined}
                  />
                )}{" "}
                {f.description && <small id={hintId}>{f.description}</small>}
                {errors[f.name] && (
                  <span className="fc-error" id={errorId} role="alert">
                    {errors[f.name]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {onSubmit && (
          <button
            className="fc-button"
            type="submit"
            disabled={disabled || busy || !dirty}
          >
            {busy ? "Requesting…" : "Request settings update"}
          </button>
        )}
        <p className="fc-helper">
          {dirty
            ? "Changes are staged. The running configuration stays unchanged until approval."
            : "Edit a value to stage a settings request."}
        </p>
        {message && (
          <p
            className={
              message.startsWith("Request failed") ? "fc-error" : "fc-helper"
            }
            role="status"
          >
            {message}
          </p>
        )}
      </form>
    </Frame>
  );
}
export function ApprovalCard({
  title = "Review requested update",
  requestUID,
  planDigest,
  changes = [],
  status = "PendingApproval",
  onApprove,
  onReject,
  disabled = false,
  reviewURL,
}) {
  const [confirmed, setConfirmed] = useState(false),
    [decision, setDecision] = useState(null);
  const id = useId();
  useEffect(() => {
    setConfirmed(false);
    setDecision(null);
  }, [requestUID, planDigest, status]);
  const href = safeURL(reviewURL),
    pending = status === "PendingApproval";
  const decide = async (fn) => {
    if (!confirmed || !pending || !requestUID || !planDigest) return;
    setDecision("pending");
    try {
      await fn({ requestUID, planDigest });
      setDecision("recorded");
    } catch (e) {
      setDecision(null);
      throw e;
    }
  };
  return (
    <Frame
      title={title}
      eyebrow="Approval gate"
      status={status}
      actions={
        <>
          {onApprove && (
            <Action
              onAction={() => decide(onApprove)}
              disabled={
                disabled ||
                !confirmed ||
                !pending ||
                !!decision ||
                !requestUID ||
                !planDigest
              }
            >
              Approve reviewed plan
            </Action>
          )}
          {onReject && (
            <Action
              secondary
              onAction={() => decide(onReject)}
              disabled={
                disabled ||
                !confirmed ||
                !pending ||
                !!decision ||
                !requestUID ||
                !planDigest
              }
            >
              Reject update
            </Action>
          )}
          {href && (
            <a
              className="fc-link"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              Review in VerteX
            </a>
          )}
        </>
      }
    >
      <div className="fc-change-list">
        {changes.map((c) => (
          <div className="fc-change" key={c.label}>
            <strong>{c.label}</strong>
            <div>
              <del>{String(c.before ?? "Not set")}</del>
              <span aria-hidden="true"> → </span>
              <ins>{String(c.after ?? "Not set")}</ins>
            </div>
          </div>
        ))}
      </div>
      <details className="fc-review">
        <summary>Request identity and plan digest</summary>
        <p>
          Request <code>{requestUID}</code>
        </p>
        <code>{planDigest}</code>
      </details>
      {pending && (
        <label className="fc-confirm" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={confirmed}
            disabled={disabled || !!decision}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I reviewed the target, settings and profile changes.
        </label>
      )}
      {decision === "recorded" && (
        <p role="status" className="fc-helper">
          Decision submitted. Waiting for updated status.
        </p>
      )}
    </Frame>
  );
}
export function RolloutCard({
  title = "Profile rollout",
  status = "Applying",
  progress = 0,
  steps = [],
  activeStep = 0,
  message,
}) {
  const pct = Number.isFinite(progress)
    ? Math.min(status === "Ready" ? 100 : 99, Math.max(0, Math.round(progress)))
    : 0;
  return (
    <Frame title={title} eyebrow="Deployment verification" status={status}>
      <div className="fc-rollout-top">
        <strong>
          {status === "Ready" ? 100 : pct}
          <small>%</small>
        </strong>
        <p>{message || "Capabilities change only after verification."}</p>
      </div>
      <div
        className="fc-progress"
        role="progressbar"
        aria-label={`${title} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={status === "Ready" ? 100 : pct}
      >
        <span style={{ width: `${status === "Ready" ? 100 : pct}%` }} />
      </div>
      <ol className="fc-steps">
        {steps.map((step, i) => (
          <li
            key={step}
            className={
              status === "Ready" || i < activeStep
                ? "fc-step-done"
                : i === activeStep
                  ? "fc-step-active"
                  : ""
            }
            aria-current={
              status !== "Ready" && i === activeStep ? "step" : undefined
            }
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {step}
          </li>
        ))}
      </ol>
    </Frame>
  );
}
export function ActivityCard({ title = "Recent activity", events = [] }) {
  return (
    <Frame title={title} eyebrow="Change history">
      {events.length ? (
        <ol className="fc-activity">
          {events.map((e) => (
            <li key={e.id}>
              <span className="fc-activity-dot" />
              <div>
                <strong>{e.title}</strong>
                {e.description && <p>{e.description}</p>}
                <time dateTime={e.timestamp}>{e.timestamp}</time>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="fc-helper">No activity yet.</p>
      )}
    </Frame>
  );
}
export function C2IProfileCard({
  card,
  onRequest,
  onApprove,
  onReject,
  canApprove = false,
  disabled = false,
}) {
  const c = normalizeC2ICard(card),
    [dirty, setDirty] = useState(false);
  const submitted = ["Submitting", "Applying", "SubmissionUncertain"].includes(
    c.phase,
  );
  return (
    <div className="fc-stack">
      <Frame
        title={c.title}
        eyebrow={`VerteX profile ${c.profileVersion}`}
        status={c.phase}
      >
        <p className="fc-description">{c.message}</p>
      </Frame>
      <SettingsCard
        fields={c.settings}
        revision={c.digest}
        disabled={disabled || submitted}
        onDirtyChange={setDirty}
        onSubmit={
          onRequest &&
          ((settings) =>
            onRequest({ name: c.name, requestUID: c.requestUID, settings }))
        }
      />
      {c.phase === "PendingApproval" && (
        <ApprovalCard
          requestUID={c.requestUID}
          planDigest={c.digest}
          status={c.phase}
          changes={Object.entries(c.review?.requestedSettings || {}).map(
            ([label, after]) => ({
              label,
              before: "Review baseline in VerteX",
              after,
            }),
          )}
          reviewURL={c.vertexURL}
          onApprove={canApprove && c.actions?.approve ? onApprove : undefined}
          onReject={canApprove ? onReject : undefined}
          disabled={disabled || dirty}
        />
      )}
    </div>
  );
}
