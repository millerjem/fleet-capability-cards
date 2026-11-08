import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ApprovalCard,
  SettingsCard,
  ProfileCard,
  RolloutCard,
  C2IProfileCard,
  normalizeC2ICard,
  safeURL,
} from "../src/index.js";
import { initialState, reducer } from "../demo/model.js";
const fields = [
  {
    name: "replicas",
    label: "Replicas",
    format: "number",
    required: true,
    min: 1,
    max: 10,
    value: "2",
  },
];
const c2i = {
  schemaVersion: 1,
  name: "app",
  requestUID: "r1",
  title: "Application",
  profileVersion: "1.0.0",
  phase: "PendingApproval",
  digest: "sha-one",
  settings: fields,
  actions: { approve: true },
};
describe("reviewed approval", () => {
  it("requires review and passes the exact reviewed identity", async () => {
    const user = userEvent.setup(),
      onApprove = vi.fn();
    render(
      <ApprovalCard
        requestUID="r1"
        planDigest="sha-one"
        onApprove={onApprove}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Approve reviewed plan" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    await user.click(
      screen.getByRole("button", { name: "Approve reviewed plan" }),
    );
    expect(onApprove).toHaveBeenCalledWith({
      requestUID: "r1",
      planDigest: "sha-one",
    });
    expect(screen.getByRole("button")).toBeDisabled();
  });
  it("invalidates confirmation when the reviewed digest changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ApprovalCard
        requestUID="r1"
        planDigest="sha-one"
        onApprove={() => {}}
      />,
    );
    await user.click(screen.getByRole("checkbox"));
    rerender(
      <ApprovalCard
        requestUID="r1"
        planDigest="sha-two"
        onApprove={() => {}}
      />,
    );
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button")).toBeDisabled();
  });
  it("prevents duplicate approval while a callback is pending", async () => {
    const user = userEvent.setup();
    let finish;
    const onApprove = vi.fn(
      () =>
        new Promise((r) => {
          finish = r;
        }),
    );
    render(
      <ApprovalCard requestUID="r1" planDigest="sha" onApprove={onApprove} />,
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toBeDisabled();
    expect(onApprove).toHaveBeenCalledTimes(1);
    finish();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Approve reviewed plan" }),
      ).toBeDisabled(),
    );
  });
  it("reports a callback failure and allows review again", async () => {
    const user = userEvent.setup();
    render(
      <ApprovalCard
        requestUID="r1"
        planDigest="sha"
        onApprove={async () => {
          throw new Error("private backend details");
        }}
      />,
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Action failed");
    expect(
      screen.queryByText("private backend details"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button")).toBeEnabled();
  });
});
describe("settings", () => {
  it("validates limits and submits string values only after editing", async () => {
    const user = userEvent.setup(),
      onSubmit = vi.fn();
    render(<SettingsCard fields={fields} onSubmit={onSubmit} />);
    const input = screen.getByRole("textbox", { name: "Replicas" });
    expect(screen.getByRole("button")).toBeDisabled();
    await user.clear(input);
    await user.type(input, "99");
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("alert")).toHaveTextContent("Maximum: 10");
    expect(onSubmit).not.toHaveBeenCalled();
    await user.clear(input);
    await user.type(input, "3");
    await user.click(screen.getByRole("button"));
    expect(onSubmit).toHaveBeenCalledWith({ replicas: "3" });
  });
  it("resets drafts when the backend revision changes", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SettingsCard fields={fields} revision="a" />);
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "4");
    rerender(<SettingsCard fields={fields} revision="b" />);
    expect(screen.getByRole("textbox")).toHaveValue("2");
  });
  it("prevents editing and submitting when disabled", () => {
    render(<SettingsCard fields={fields} onSubmit={() => {}} disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
describe("C2I and safe presentation", () => {
  it("hides reviewer actions unless explicitly enabled", () => {
    render(<C2IProfileCard card={c2i} onApprove={() => {}} />);
    expect(
      screen.queryByRole("button", { name: "Approve reviewed plan" }),
    ).not.toBeInTheDocument();
  });
  it("blocks old plan approval while the form has staged edits", async () => {
    const user = userEvent.setup();
    render(
      <C2IProfileCard
        card={c2i}
        canApprove
        onApprove={() => {}}
        onRequest={() => {}}
      />,
    );
    await user.click(screen.getByRole("checkbox"));
    expect(
      screen.getByRole("button", { name: "Approve reviewed plan" }),
    ).toBeEnabled();
    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "4");
    expect(
      screen.getByRole("button", { name: "Approve reviewed plan" }),
    ).toBeDisabled();
  });
  it("filters sensitive fields and rejects unknown card schemas", () => {
    expect(
      normalizeC2ICard({
        ...c2i,
        settings: [
          ...fields,
          { name: "api_key", value: "not-a-real-key" },
          { name: "value", isSensitive: true, value: "not-a-real-key" },
        ],
      }).settings,
    ).toHaveLength(1);
    expect(() => normalizeC2ICard({ ...c2i, schemaVersion: 2 })).toThrow();
  });
  it("rejects executable and credential-bearing links", () => {
    expect(safeURL("javascript:alert(1)")).toBeUndefined();
    expect(safeURL("https://user:password@example.test")).toBeUndefined();
    render(
      <ProfileCard
        name="Profile"
        version="1"
        description="Example"
        reviewURL="javascript:alert(1)"
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
  it("never displays complete progress before verification", () => {
    const { rerender } = render(
      <RolloutCard progress={100} status="Applying" />,
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "99",
    );
    rerender(<RolloutCard progress={100} status="Ready" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });
});
describe("demo verification semantics", () => {
  it("keeps installed capabilities unchanged until rollout verification", () => {
    let s = initialState();
    s = reducer(s, {
      type: "REQUEST",
      siteId: "kite",
      kind: "profile",
      target: 3,
      changes: [],
    });
    const identity = s.sites[1].pending;
    s = reducer(s, { type: "APPROVE", siteId: "kite", ...identity });
    expect(s.sites[1].installed).toBe(1);
    for (let i = 0; i < 4; i++)
      s = reducer(s, { type: "TICK", siteId: "kite" });
    expect(s.sites[1].installed).toBe(1);
    s = reducer(s, { type: "TICK", siteId: "kite" });
    expect(s.sites[1].installed).toBe(3);
  });
  it("ignores stale approval identity and duplicate requests", () => {
    let s = reducer(initialState(), {
      type: "REQUEST",
      siteId: "kite",
      kind: "profile",
      target: 2,
      changes: [],
    });
    const before = s;
    s = reducer(s, {
      type: "APPROVE",
      siteId: "kite",
      requestUID: "stale",
      planDigest: "wrong",
    });
    expect(s).toBe(before);
    expect(
      reducer(s, {
        type: "REQUEST",
        siteId: "kite",
        kind: "profile",
        target: 3,
      }),
    ).toBe(s);
  });
});
