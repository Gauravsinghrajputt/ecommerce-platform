import { create } from "zustand";
import { api, setAccessToken, setRefreshHandler } from "@/lib/http";
import type { User } from "@/lib/types";

type AuthPayload = { data: { accessToken: string; user: User } };

interface AuthState {
  user: User | null;
  ready: boolean; // true once the initial silent refresh has finished
  bootstrap: () => Promise<void>;
  refresh: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; fullName: string; role: "customer" | "admin"; adminCode?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

// Refresh tokens ROTATE (single use). Concurrent refreshes must share one request or the 2nd would look like token reuse.
let inflight: Promise<boolean> | null = null;

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  ready: false,

  refresh() {
    inflight ??= api<AuthPayload>("/auth/refresh", { method: "POST" }, false)
      .then(({ data }) => { setAccessToken(data.accessToken); set({ user: data.user }); return true; })
      .catch(() => { setAccessToken(null); set({ user: null }); return false; })
      .finally(() => { inflight = null; });
    return inflight;
  },

  async bootstrap() {
    if (get().ready) return;
    await get().refresh(); // silently restores the session from the refresh cookie
    set({ ready: true });
  },

  async login(email, password) {
    const { data } = await api<AuthPayload>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, false);
    setAccessToken(data.accessToken);
    set({ user: data.user });
  },

  async register(input) {
    await api("/auth/register", { method: "POST", body: JSON.stringify(input) }, false);
    await get().login(input.email, input.password);
  },

  async logout() {
    await api("/auth/logout", { method: "POST" }, false).catch(() => undefined);
    setAccessToken(null);
    set({ user: null });
  },
}));

setRefreshHandler(() => useAuth.getState().refresh());
