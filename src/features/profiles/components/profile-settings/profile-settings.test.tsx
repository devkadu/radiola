// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useProfileSettings } from "../../hooks/use-profile-settings";
import { ProfileSettings } from "./profile-settings";

const mocks = vi.hoisted(() => ({ refresh: vi.fn(), refreshUser: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/features/auth/components/auth-provider/auth-provider.client", () => ({
  useAuth: () => ({ refreshUser: mocks.refreshUser }),
}));

const initial = {
  profile_public: false, notify_replies: false, notify_weekly: false, notify_premiere: false,
};
const Editor = () => {
  const settings = useProfileSettings(initial, "usuario-878d225e5050");
  return <>
    <p>Olá, {settings.username}</p>
    <ProfileSettings
      username={settings.username}
      settings={settings}
      avatar={{ fileRef: createRef<HTMLInputElement>(), avatarUrl: null, uploading: false, error: "", handleFileChange: vi.fn() }}
      onBack={vi.fn()}
      onSignOut={vi.fn()}
      signingOut={false}
    />
  </>;
};
const setup = () => render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}>
    <Editor />
  </QueryClientProvider>,
);
const enterNick = (username: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: "Nick (nome de usuário)" }), { target: { value: username } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar nick" }));
};

beforeEach(() => {
  mocks.refreshUser.mockResolvedValue(undefined);
});
afterEach(cleanup);

it("saves the nick, updates the displayed identity and refreshes the greeting data", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetch);
  setup();
  enterNick("  Kadu_123  ");
  await screen.findByText("Nick atualizado!");
  expect(screen.getByText("Olá, Kadu_123")).toBeTruthy();
  expect(fetch).toHaveBeenCalledWith("/api/profile/settings", expect.objectContaining({
    method: "PATCH", body: JSON.stringify({ username: "Kadu_123" }),
  }));
  expect(mocks.refreshUser).toHaveBeenCalled();
  expect(mocks.refresh).toHaveBeenCalled();
});

it("validates a nick locally and keeps the current identity", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  setup();
  enterNick("nome com espaço");
  expect(screen.getByRole("alert").textContent).toContain("Use apenas letras");
  expect(screen.getByText("Olá, usuario-878d225e5050")).toBeTruthy();
  expect(fetch).not.toHaveBeenCalled();
});

it("shows a conflicting nick and allows a successful retry", async () => {
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json({ error: "Este nick já está em uso. Escolha outro." }, { status: 409 }))
    .mockResolvedValueOnce(Response.json({ ok: true }));
  vi.stubGlobal("fetch", fetch);
  setup();
  enterNick("ocupado");
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Este nick já está em uso"));
  expect(screen.getByText("Olá, usuario-878d225e5050")).toBeTruthy();
  expect(screen.queryByText("Nick atualizado!")).toBeNull();
  enterNick("disponivel");
  await screen.findByText("Nick atualizado!");
  expect(screen.getByText("Olá, disponivel")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});

it("does not report a failed save when refreshing an already saved nick fails", async () => {
  mocks.refreshUser.mockRejectedValue(new Error("Offline"));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ok: true })));
  setup();
  enterNick("novo-nick");
  await screen.findByText("Nick atualizado!");
  expect(screen.getByText("Olá, novo-nick")).toBeTruthy();
  expect(screen.queryByRole("alert")).toBeNull();
});
