// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ProfileQuickActions } from "./profile-quick-actions";

const auth = vi.hoisted(() => ({
  user: { id: "fixture" } as { id: string } | null,
  signOut: vi.fn(),
}));
const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("@/features/auth/components/auth-provider/auth-provider.client", () => ({
  useAuth: () => auth,
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next/link", () => ({ default: (props: ComponentProps<"a">) => <a {...props} /> }));

beforeEach(() => {
  vi.useFakeTimers();
  auth.user = { id: "fixture" };
  auth.signOut.mockResolvedValue(undefined);
  // jsdom does not implement PointerEvent; retain the coordinates and primary pointer flag.
  class TestPointerEvent extends MouseEvent {
    isPrimary: boolean;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.isPrimary = init.isPrimary ?? true;
    }
  }
  vi.stubGlobal("PointerEvent", TestPointerEvent);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const setup = () => {
  render(
    <ProfileQuickActions active={false}>
      <span>Perfil</span>
    </ProfileQuickActions>,
  );
  return screen.getByRole("link", { name: "Perfil" });
};

// Observe cancellation before preventing jsdom from following the link.
const clickWasPrevented = (link: HTMLElement) => {
  let prevented = false;
  document.addEventListener(
    "click",
    (event) => {
      prevented = event.defaultPrevented;
      event.preventDefault();
    },
    { once: true },
  );
  fireEvent.click(link, { detail: 1 });
  return prevented;
};

const hold = (link: HTMLElement) => {
  fireEvent.pointerDown(link, { button: 0, clientX: 20, clientY: 20 });
  act(() => vi.advanceTimersByTime(500));
  fireEvent.pointerUp(link);
};

it("preserves profile navigation on a short tap and cancels its timer", () => {
  const link = setup();
  expect(link.getAttribute("href")).toBe("/perfil");
  fireEvent.pointerDown(link, { button: 0 });
  act(() => vi.advanceTimersByTime(200));
  fireEvent.pointerUp(link);
  expect(clickWasPrevented(link)).toBe(false);
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.queryByRole("menu")).toBeNull();
});

it("opens actions after a hold, suppresses release navigation, and allows the next short tap", () => {
  const link = setup();
  hold(link);
  expect(screen.getByRole("menu")).toBeTruthy();
  expect(screen.getByRole("menuitem", { name: "Minha lista" }).getAttribute("href")).toBe(
    "/perfil#minha-lista",
  );
  expect(clickWasPrevented(link)).toBe(true);
  fireEvent.pointerDown(link, { button: 0 });
  fireEvent.pointerUp(link);
  expect(clickWasPrevented(link)).toBe(false);
  expect(screen.queryByRole("menu")).toBeNull();
});

it.each(["move", "cancel", "leave"])("cancels the hold on pointer %s", (kind) => {
  const link = setup();
  fireEvent.pointerDown(link, { button: 0, clientX: 20, clientY: 20 });
  if (kind === "move") fireEvent.pointerMove(link, { clientX: 20, clientY: 40 });
  if (kind === "cancel") fireEvent.pointerCancel(link);
  if (kind === "leave") fireEvent.pointerLeave(link);
  act(() => vi.advanceTimersByTime(1000));
  expect(screen.queryByRole("menu")).toBeNull();
  if (kind !== "leave") expect(clickWasPrevented(link)).toBe(true);
});

it("supports keyboard navigation, Escape, and outside dismissal", () => {
  const link = setup();
  fireEvent.keyDown(link, { key: "ArrowDown" });
  const list = screen.getByRole("menuitem", { name: "Minha lista" });
  const signOut = screen.getByRole("menuitem", { name: "Sair" });
  expect(document.activeElement).toBe(list);
  fireEvent.keyDown(list, { key: "ArrowDown" });
  expect(document.activeElement).toBe(signOut);
  fireEvent.keyDown(signOut, { key: "ArrowDown" });
  expect(document.activeElement).toBe(list);
  fireEvent.keyDown(list, { key: "Escape" });
  expect(screen.queryByRole("menu")).toBeNull();
  expect(document.activeElement).toBe(link);
  hold(link);
  fireEvent.pointerDown(document.body);
  expect(screen.queryByRole("menu")).toBeNull();
});

it("keeps actions available on logout failure and redirects after a successful retry", async () => {
  auth.signOut.mockRejectedValueOnce(new Error("Session failure"));
  hold(setup());
  await act(async () => fireEvent.click(screen.getByRole("menuitem", { name: "Sair" })));
  expect(screen.getByRole("alert").textContent).toContain("Não foi possível sair");
  expect(router.push).not.toHaveBeenCalled();
  await act(async () => fireEvent.click(screen.getByRole("menuitem", { name: "Sair" })));
  expect(auth.signOut).toHaveBeenCalledTimes(2);
  expect(router.push).toHaveBeenCalledWith("/");
  expect(router.refresh).toHaveBeenCalledOnce();
});

it("prevents duplicate logout requests while awaiting the session", async () => {
  let finish!: () => void;
  auth.signOut.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  hold(setup());
  fireEvent.click(screen.getByRole("menuitem", { name: "Sair" }));
  const pending = screen.getByRole("menuitem", { name: "Saindo…" }) as HTMLButtonElement;
  expect(pending.disabled).toBe(true);
  fireEvent.click(pending);
  expect(auth.signOut).toHaveBeenCalledOnce();
  await act(async () => finish());
});

it("keeps the profile link available without showing private actions to visitors", () => {
  auth.user = null;
  const link = setup();
  hold(link);
  fireEvent.contextMenu(link);
  expect(screen.queryByRole("menu")).toBeNull();
  expect(clickWasPrevented(link)).toBe(false);
});
