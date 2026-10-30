// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ from: vi.fn(), user: null as null | { id: string } }));
vi.mock("@/features/auth/components/auth-provider/auth-provider.client", () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock("@/shared/lib/supabase-browser", () => ({ createClient: () => ({ from: mocks.from }) }));
vi.mock("@/features/auth/components/login-sheet/login-sheet", () => ({ LoginSheet: () => null }));
import { EpisodeReactions } from "./episode-reactions";

const result = (data: unknown, error: unknown = null) => {
  const chain = {
    select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(async () => ({ data, error })),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve),
  };
  chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain);
  return chain;
};

beforeEach(() => { mocks.from.mockReset(); mocks.user = null; });

it("shows a failed read and retries instead of reporting an empty rating list", async () => {
  mocks.from.mockReturnValueOnce(result(null, { message: "Unavailable" }))
    .mockReturnValueOnce(result([{ reaction_key: "5" }]));
  render(<EpisodeReactions episodeId="700-s1-e1" />);
  expect((await screen.findByRole("alert")).textContent).toContain("Não foi possível carregar");
  expect(screen.queryByRole("button", { name: "Avaliar com 5 de 5 estrelas" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect(await screen.findByText("5.0")).toBeTruthy();
});

it("does not enable rating writes when the user's own rating cannot be read", async () => {
  mocks.user = { id: "account-a" };
  mocks.from.mockReturnValueOnce(result([{ reaction_key: "4" }]))
    .mockReturnValueOnce(result(null, { message: "Session unavailable" }));
  render(<EpisodeReactions episodeId="700-s1-e1" />);
  await screen.findByRole("alert");
  expect(screen.queryByRole("button", { name: "Avaliar com 4 de 5 estrelas" })).toBeNull();
});
