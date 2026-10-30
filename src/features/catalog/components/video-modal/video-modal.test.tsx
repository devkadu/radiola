// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { VideoPlayButton } from "./video-modal";

it("connects to YouTube only after the user explicitly loads the player", () => {
  const { container } = render(<VideoPlayButton youtubeKey="fixture-video" title="Trailer de teste" />);
  expect(container.querySelector("iframe")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Assistir trailer" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(container.querySelector("iframe")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Carregar vídeo do YouTube" }));
  expect(container.querySelector("iframe")?.src).toMatch(/^https:\/\/www.youtube-nocookie.com\/embed\//);
  fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
  fireEvent.click(screen.getByRole("button", { name: "Assistir trailer" }));
  expect(container.querySelector("iframe")).toBeNull();
});
