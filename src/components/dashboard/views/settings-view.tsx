"use client";

import { useEffect, useState, type FormEvent } from "react";
import useSWR from "swr";
import { Check, Cloud, KeyRound, Lock, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FieldError, Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ClientApiError } from "@/lib/client";
import { ALL_PERMISSIONS, AWS_REGIONS, ROLE_PERMISSIONS } from "@/lib/constants";
import { connectionSchema, profileSchema } from "@/lib/validation";
import { cn, formatRelativeTime, initials } from "@/lib/utils";
import type { Connection, Role, UserProfile } from "@/types/api";
import { ErrorState, PageHeader } from "../common";

type Errors = Record<string, string | undefined>;

function collectErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Errors = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}

export function SettingsView() {
  const profile = useSWR<{ user: UserProfile }>("/api/profile");
  const role = profile.data?.user.role;

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile, budget, cloud connections and access." />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          {profile.error ? (
            <ErrorState message={profile.error.message} onRetry={() => profile.mutate()} />
          ) : profile.data ? (
            <ProfileCard user={profile.data.user} onSaved={(user) => profile.mutate({ user }, { revalidate: false })} />
          ) : (
            <Skeleton className="h-[420px] rounded-2xl" />
          )}
          <ConnectionsCard canManage={role === "OWNER" || role === "ADMIN"} />
        </div>
        <div>{role ? <RolesCard role={role} /> : <Skeleton className="h-[520px] rounded-2xl" />}</div>
      </div>
    </>
  );
}

function ProfileCard({ user, onSaved }: { user: UserProfile; onSaved: (u: UserProfile) => void }) {
  const [form, setForm] = useState({ name: user.name, company: user.company ?? "", jobTitle: user.jobTitle ?? "", monthlyBudget: String(user.monthlyBudget) });
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const dirty =
    form.name !== user.name || form.company !== (user.company ?? "") || form.jobTitle !== (user.jobTitle ?? "") || Number(form.monthlyBudget) !== user.monthlyBudget;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function save(e: FormEvent) {
    e.preventDefault();
    const parsed = profileSchema.safeParse(form);
    if (!parsed.success) return setErrors(collectErrors(parsed.error.issues));
    setSaving(true);
    try {
      const { user: updated } = await apiFetch<{ user: UserProfile }>("/api/profile", { method: "PATCH", json: parsed.data });
      onSaved(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ClientApiError ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Profile & budget</CardTitle>
          <CardDescription>Your personal details and the monthly budget used for alerts and forecasts.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-lg font-semibold text-white">{initials(user.name)}</span>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-zinc-500">{user.email}</p>
            <p className="mt-1 text-xs text-zinc-400">Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
          </div>
        </div>
        <form onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" value={form.name} onChange={set("name")} invalid={!!errors.name} />
            <FieldError message={errors.name} />
          </div>
          <div>
            <Label htmlFor="p-email">Email</Label>
            <Input id="p-email" value={user.email} disabled />
          </div>
          <div>
            <Label htmlFor="p-company">Company</Label>
            <Input id="p-company" value={form.company} onChange={set("company")} />
          </div>
          <div>
            <Label htmlFor="p-title">Job title</Label>
            <Input id="p-title" value={form.jobTitle} onChange={set("jobTitle")} placeholder="e.g. DevOps Engineer" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="p-budget">Monthly budget (USD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">$</span>
              <Input id="p-budget" type="number" min={100} step={100} value={form.monthlyBudget} onChange={set("monthlyBudget")} invalid={!!errors.monthlyBudget} className="pl-7" />
            </div>
            <FieldError message={errors.monthlyBudget} />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="submit" loading={saving} disabled={!dirty}>
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ConnectionsCard({ canManage }: { canManage: boolean }) {
  const { data, error, mutate } = useSWR<{ connections: Connection[] }>("/api/connections");
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hash === "#connections") document.getElementById("connections")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  async function remove(c: Connection) {
    if (!window.confirm(`Disconnect "${c.name}" (${c.accountId})?`)) return;
    setRemoving(c.id);
    try {
      await apiFetch(`/api/connections/${c.id}`, { method: "DELETE" });
      await mutate();
      toast.success(`${c.name} disconnected`);
    } catch (e) {
      toast.error(e instanceof ClientApiError ? e.message : "Could not disconnect");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <Card id="connections" className="scroll-mt-24">
      <CardHeader>
        <div>
          <CardTitle>Cloud provider connections</CardTitle>
          <CardDescription>Read-only cross-account IAM roles used to import billing and utilisation data.</CardDescription>
        </div>
        <Button size="sm" variant="brand" onClick={() => setOpen(true)} disabled={!canManage} title={canManage ? undefined : "Requires Owner or Admin role"}>
          <Plus className="h-3.5 w-3.5" /> Connect AWS account
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <ErrorState message={error.message} onRetry={() => mutate()} />}
        {!data && !error && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        {data?.connections.length === 0 && <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-white/10">No cloud accounts connected yet.</p>}
        {data?.connections.map((c) => (
          <div key={c.id} className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-white/[0.08] sm:flex-row sm:items-center">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-[11px] font-bold text-white">AWS</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{c.name}</p>
                <Badge tone={c.status === "CONNECTED" ? "success" : c.status === "PENDING" ? "warning" : "danger"}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" /> {c.status.toLowerCase()}
                </Badge>
              </div>
              <p className="mt-0.5 truncate font-mono text-xs text-zinc-500" title={c.roleArn}>
                {c.roleArn}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {c.region}
                {c.accessKeyHint && ` · key ${c.accessKeyHint}`}
                {c.lastSyncedAt && ` · synced ${formatRelativeTime(c.lastSyncedAt)}`}
              </p>
            </div>
            {canManage && (
              <Button variant="ghost" size="sm" onClick={() => remove(c)} loading={removing === c.id} aria-label={`Disconnect ${c.name}`}>
                {removing !== c.id && <Trash2 className="h-3.5 w-3.5" />} Disconnect
              </Button>
            )}
          </div>
        ))}
      </CardContent>
      {open && <ConnectModal open onClose={() => setOpen(false)} onConnected={() => mutate()} />}
    </Card>
  );
}

const emptyConn = { name: "", roleArn: "", externalId: "", accessKeyId: "", region: "us-east-1" as (typeof AWS_REGIONS)[number] };

function ConnectModal({ open, onClose, onConnected }: { open: boolean; onClose: () => void; onConnected: () => void }) {
  const [form, setForm] = useState(() => ({ ...emptyConn, externalId: `cp-${crypto.randomUUID().slice(0, 12)}` }));
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined, form: undefined }));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = connectionSchema.safeParse(form);
    if (!parsed.success) return setErrors(collectErrors(parsed.error.issues));
    setLoading(true);
    try {
      await apiFetch("/api/connections", { method: "POST", json: parsed.data });
      toast.success("AWS account connected. Importing 180 days of cost history…");
      onConnected();
      onClose();
    } catch (err) {
      setErrors({ form: err instanceof ClientApiError ? err.message : "Connection failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Connect an AWS account" description="CloudPulse assumes a read-only IAM role in your account using STS.">
      <ol className="mb-5 space-y-2 rounded-xl bg-zinc-50 p-4 text-xs text-zinc-600 dark:bg-white/[0.03] dark:text-zinc-400">
        <li className="flex gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-brand-500" />
          <span>
            Create an IAM role with the <code className="font-mono">ReadOnlyAccess</code> and <code className="font-mono">AWSBillingReadOnlyAccess</code> policies.
          </span>
        </li>
        <li className="flex gap-2">
          <KeyRound className="h-4 w-4 shrink-0 text-brand-500" />
          <span>
            Trust account <code className="font-mono">914725803612</code> with the External ID below.
          </span>
        </li>
      </ol>
      <form onSubmit={submit} noValidate className="space-y-4">
        {errors.form && (
          <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {errors.form}
          </div>
        )}
        <div>
          <Label htmlFor="c-name">Connection name</Label>
          <Input id="c-name" value={form.name} onChange={set("name")} invalid={!!errors.name} placeholder="Production" />
          <FieldError message={errors.name} />
        </div>
        <div>
          <Label htmlFor="c-arn">IAM Role ARN</Label>
          <Input id="c-arn" value={form.roleArn} onChange={set("roleArn")} invalid={!!errors.roleArn} placeholder="arn:aws:iam::123456789012:role/CloudPulseReadOnly" className="font-mono text-xs" />
          <FieldError message={errors.roleArn} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="c-ext">External ID</Label>
            <Input id="c-ext" value={form.externalId} onChange={set("externalId")} invalid={!!errors.externalId} className="font-mono text-xs" />
            <FieldError message={errors.externalId} />
          </div>
          <div>
            <Label htmlFor="c-region">Default region</Label>
            <Select id="c-region" value={form.region} onChange={set("region")}>
              {AWS_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="c-key">
            Access Key ID <span className="text-zinc-400">(optional, legacy)</span>
          </Label>
          <Input id="c-key" value={form.accessKeyId} onChange={set("accessKeyId")} invalid={!!errors.accessKeyId} placeholder="AKIAXXXXXXXXXXXXXXXX" className="font-mono text-xs" autoComplete="off" />
          <FieldError message={errors.accessKeyId} />
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-zinc-500">
            <Lock className="h-3 w-3" /> Only a masked hint is stored. Role-based access is recommended.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" loading={loading}>
            {!loading && <Cloud className="h-4 w-4" />} {loading ? "Verifying role…" : "Connect account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RolesCard({ role }: { role: Role }) {
  const current = ROLE_PERMISSIONS[role];
  return (
    <Card className="xl:sticky xl:top-24">
      <CardHeader>
        <div>
          <CardTitle>Role & permissions</CardTitle>
          <CardDescription>Role-based access control for this workspace.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-500/20 dark:bg-brand-500/[0.06]">
          <p className="text-xs text-zinc-500">Your role</p>
          <p className="mt-0.5 text-lg font-semibold">{current.label}</p>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{current.description}</p>
        </div>
        <ul className="mt-5 space-y-2.5">
          {ALL_PERMISSIONS.map((p) => {
            const granted = (current.permissions as readonly string[]).includes(p);
            return (
              <li key={p} className="flex items-center gap-2.5 text-sm">
                <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", granted ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400" : "bg-zinc-100 text-zinc-400 dark:bg-white/[0.06]")}>
                  {granted ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </span>
                <span className={granted ? "" : "text-zinc-400 line-through"}>{p}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 border-t border-zinc-100 pt-5 dark:border-white/[0.06]">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">All roles</p>
          <div className="mt-3 space-y-2">
            {(Object.keys(ROLE_PERMISSIONS) as Role[]).map((r) => (
              <div key={r} className={cn("flex items-center justify-between rounded-lg px-3 py-2 text-sm", r === role ? "bg-zinc-100 dark:bg-white/[0.06]" : "")}>
                <span className="font-medium">{ROLE_PERMISSIONS[r].label}</span>
                <span className="text-xs text-zinc-500">{ROLE_PERMISSIONS[r].permissions.length} permissions</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
