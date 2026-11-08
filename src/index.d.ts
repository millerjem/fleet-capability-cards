import type { ReactElement } from "react";
export type Status =
  | "Available"
  | "Installed"
  | "PendingApproval"
  | "Submitting"
  | "Applying"
  | "Ready"
  | "SubmissionUncertain"
  | "Blocked"
  | "Rejected"
  | "Drifted"
  | (string & {});
export type AsyncAction<T = void> = (value: T) => void | Promise<void>;
export interface SettingField {
  name: string;
  label?: string;
  value?: string;
  format?: string;
  required?: boolean;
  min?: number;
  max?: number;
  description?: string;
  readOnly?: boolean;
  isSensitive?: boolean;
  hidden?: boolean;
  immutable?: boolean;
  options?: { value: string; label?: string }[];
}
export interface Change {
  label: string;
  before?: string | number | boolean;
  after?: string | number | boolean;
}
export interface ApprovalIdentity {
  requestUID: string;
  planDigest: string;
}
export interface ActivityEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
}
export interface CapabilityCardProps {
  name: string;
  platform: string;
  cluster: string;
  profileVersion: string;
  status?: Status;
  capabilities?: string[];
  selected?: boolean;
  onSelect?: () => void | Promise<void>;
  metrics?: { label: string; value: string | number }[];
}
export interface ProfileCardProps {
  name: string;
  description: string;
  version: string;
  status?: Status;
  capabilities?: string[];
  components?: { name: string; version: string }[];
  onRequest?: () => void | Promise<void>;
  disabled?: boolean;
  reviewURL?: string;
}
export interface SettingsCardProps {
  title?: string;
  fields: SettingField[];
  revision?: string;
  onSubmit?: AsyncAction<Record<string, string>>;
  disabled?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}
export interface ApprovalCardProps {
  title?: string;
  requestUID: string;
  planDigest: string;
  changes?: Change[];
  status?: Status;
  onApprove?: AsyncAction<ApprovalIdentity>;
  onReject?: AsyncAction<ApprovalIdentity>;
  disabled?: boolean;
  reviewURL?: string;
}
export interface RolloutCardProps {
  title?: string;
  status?: Status;
  progress?: number;
  steps?: string[];
  activeStep?: number;
  message?: string;
}
export interface ActivityCardProps {
  title?: string;
  events?: ActivityEvent[];
}
export interface C2ICard {
  schemaVersion: 1;
  name: string;
  requestUID: string;
  title: string;
  profileVersion: string;
  phase: Status;
  message?: string;
  digest: string;
  settings: SettingField[];
  review?: {
    requestedSettings?: Record<string, string>;
    [key: string]: unknown;
  };
  vertexURL?: string;
  actions?: { request?: boolean; approve?: boolean };
}
export interface C2IRequest {
  name: string;
  requestUID: string;
  settings: Record<string, string>;
}
export interface C2IProfileCardProps {
  card: C2ICard;
  onRequest?: AsyncAction<C2IRequest>;
  onApprove?: AsyncAction<ApprovalIdentity>;
  onReject?: AsyncAction<ApprovalIdentity>;
  canApprove?: boolean;
  disabled?: boolean;
}
export function CapabilityCard(props: CapabilityCardProps): ReactElement;
export function ProfileCard(props: ProfileCardProps): ReactElement;
export function SettingsCard(props: SettingsCardProps): ReactElement;
export function ApprovalCard(props: ApprovalCardProps): ReactElement;
export function RolloutCard(props: RolloutCardProps): ReactElement;
export function ActivityCard(props: ActivityCardProps): ReactElement;
export function C2IProfileCard(props: C2IProfileCardProps): ReactElement;
export function StatusBadge(props: { status?: Status }): ReactElement;
export function normalizeC2ICard(card: C2ICard): C2ICard;
export function safeURL(value?: string): string | undefined;
