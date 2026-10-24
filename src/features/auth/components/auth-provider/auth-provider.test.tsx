// @vitest-environment jsdom
import type { User } from "@supabase/supabase-js";
import { QueryClient,QueryClientProvider } from "@tanstack/react-query";
import { act,cleanup,fireEvent,render,screen,waitFor } from "@testing-library/react";
import { afterEach,expect,it,vi } from "vitest";
import { AuthProvider,useAuth } from "./auth-provider.client";

const auth = vi.hoisted(() => ({
  callback: null as null | ((event: string, session: { user: User } | null) => void),
  getUser: vi.fn(), getSession: vi.fn(), signOut: vi.fn(), unsubscribe: vi.fn(),
}));
vi.mock("@/shared/lib/supabase-browser", () => ({ createClient: () => ({ auth: {
  getUser: auth.getUser, getSession: auth.getSession, signOut: auth.signOut,
  onAuthStateChange: (callback: typeof auth.callback) => {
    auth.callback = callback;
    return { data: { subscription: { unsubscribe: auth.unsubscribe } } };
  },
} }) }));
afterEach(cleanup);
function Consumer() { const { user, loading } = useAuth(); return <p>{loading ? "loading" : user?.id ?? "anonymous"}</p>; }

it("discards the previous account's private cache on account switch and logout", async () => {
  const first = { id: "account-a" } as User;
  auth.getUser.mockResolvedValue({ data: { user: first }, error: null });
  const client = new QueryClient();
  const rendered = render(<QueryClientProvider client={client}><AuthProvider><Consumer /></AuthProvider></QueryClientProvider>);
  await screen.findByText("account-a");
  client.setQueryData(["profile", "account-a", "lists"], [{ name: "private" }]);
  act(() => auth.callback?.("SIGNED_IN", { user: { id: "account-b" } as User }));
  await screen.findByText("account-b");
  expect(client.getQueryData(["profile", "account-a", "lists"])).toBeUndefined();
  client.setQueryData(["profile", "account-b", "lists"], [{ name: "private-b" }]);
  act(() => auth.callback?.("SIGNED_OUT", null));
  await screen.findByText("anonymous");
  expect(client.getQueryCache().getAll()).toHaveLength(0);
  rendered.unmount();
  expect(auth.unsubscribe).toHaveBeenCalled();
});

it("ignores a late initial getUser response after a logout event", async () => {
  let finish!: (value: { data: { user: User }; error: null }) => void;
  auth.getUser.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<QueryClientProvider client={new QueryClient()}><AuthProvider><Consumer /></AuthProvider></QueryClientProvider>);
  act(() => auth.callback?.("SIGNED_OUT", null));
  act(() => finish({ data: { user: { id: "stale" } as User }, error: null }));
  await waitFor(() => expect(screen.getByText("anonymous")).toBeTruthy());
  expect(screen.queryByText("stale")).toBeNull();
});

const SignOutConsumer = () => {
  const { user, signOut } = useAuth();
  return <><p>{user?.id ?? "anonymous"}</p><button onClick={() => { void signOut().catch(() => {}); }}>Sair</button></>;
};

it("clears private cache and reports a global logout failure after local session removal", async () => {
  auth.getUser.mockResolvedValue({ data: { user: { id: "account-a" } }, error: null });
  auth.signOut.mockResolvedValue({ error: new Error("Global logout unavailable") });
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  const client = new QueryClient();
  render(<QueryClientProvider client={client}><AuthProvider><SignOutConsumer /></AuthProvider></QueryClientProvider>);
  await screen.findByText("account-a");
  client.setQueryData(["profile", "account-a", "lists"], [{ name: "private" }]);
  fireEvent.click(screen.getByRole("button", { name: "Sair" }));
  await screen.findByText("anonymous");
  expect(client.getQueryCache().getAll()).toHaveLength(0);
  expect(screen.getByRole("alert").textContent).toContain("Não foi possível confirmar a saída nos demais.");
});

it("retains the account when a failed logout leaves its local session active", async () => {
  auth.getUser.mockResolvedValue({ data: { user: { id: "account-a" } }, error: null });
  auth.signOut.mockResolvedValue({ error: new Error("Session failure") });
  auth.getSession.mockResolvedValue({ data: { session: { user: { id: "account-a" } } }, error: null });
  render(<QueryClientProvider client={new QueryClient()}><AuthProvider><SignOutConsumer /></AuthProvider></QueryClientProvider>);
  await screen.findByText("account-a");
  const calls = auth.getSession.mock.calls.length;
  fireEvent.click(screen.getByRole("button", { name: "Sair" }));
  await waitFor(() => expect(auth.getSession.mock.calls.length).toBe(calls + 1));
  expect(screen.getByText("account-a")).toBeTruthy();
  expect(screen.queryByText("anonymous")).toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
});
