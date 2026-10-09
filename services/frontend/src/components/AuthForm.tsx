"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/store/auth";

// Kept from the earlier phase; Phase B reconnects it to the storefront navigation.
export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { login, register } = useAuth();
  const [f, setF] = useState({ fullName: "", email: "", password: "", role: "customer" as "customer" | "admin", adminCode: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (mode === "login") await login(f.email, f.password);
      else await register({ email: f.email, password: f.password, fullName: f.fullName, role: f.role, adminCode: f.role === "admin" ? f.adminCode : undefined });
      router.push("/");
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-12 max-w-sm space-y-4 rounded-card border border-line bg-surface p-6 shadow-card">
      <h1 className="text-2xl font-semibold">{mode === "login" ? "Log in" : "Create account"}</h1>
      {mode === "register" && <div><label className="label" htmlFor="fullName">Full name</label><input id="fullName" className="input" required value={f.fullName} onChange={set("fullName")} /></div>}
      <div><label className="label" htmlFor="email">Email</label><input id="email" className="input" type="email" required value={f.email} onChange={set("email")} /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" className="input" type="password" required minLength={mode === "register" ? 8 : 1} value={f.password} onChange={set("password")} /></div>
      {mode === "register" && (
        <>
          <div><label className="label" htmlFor="role">Account type</label><select id="role" className="input" value={f.role} onChange={set("role")}><option value="customer">Customer</option><option value="admin">Admin</option></select></div>
          {f.role === "admin" && <div><label className="label" htmlFor="adminCode">Admin registration code</label><input id="adminCode" className="input" value={f.adminCode} onChange={set("adminCode")} /></div>}
        </>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button disabled={busy} className="btn-primary w-full">{busy ? "Please wait…" : mode === "login" ? "Log in" : "Register"}</button>
      <p className="text-center text-sm text-ink-soft">
        {mode === "login" ? <>No account? <Link className="underline" href="/register">Register</Link></> : <>Have an account? <Link className="underline" href="/login">Log in</Link></>}
      </p>
    </form>
  );
}
