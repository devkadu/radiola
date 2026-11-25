// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const nextLinkMock = vi.hoisted(() =>
  vi.fn(({ children, href }: ComponentProps<"a"> & { prefetch?: boolean | null }) => (
    <a href={String(href)}>{children}</a>
  )),
);

vi.mock("next/link", () => ({ default: nextLinkMock }));

import Link from "./link";

const collectSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(fullPath);
    if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\.(ts|tsx)$/.test(entry.name)) return [];
    return [fullPath];
  });
};

beforeEach(() => {
  nextLinkMock.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("shared Link wrapper", () => {
  it("disables automatic prefetching by default", () => {
    render(<Link href="/series/teste">Teste</Link>);

    expect(screen.getByRole("link", { name: "Teste" }).getAttribute("href")).toBe("/series/teste");
    expect(nextLinkMock).toHaveBeenCalledTimes(1);
    expect(nextLinkMock.mock.calls[0][0]).toMatchObject({
      href: "/series/teste",
      prefetch: false,
    });
  });

  it("forwards explicit prefetch overrides", () => {
    render(
      <>
        <Link href="/series/a" prefetch={true}>
          Ativado
        </Link>
        <Link href="/series/b" prefetch={null}>
          Padrao
        </Link>
      </>,
    );

    expect(nextLinkMock).toHaveBeenCalledTimes(2);
    expect(nextLinkMock.mock.calls[0][0]).toMatchObject({ href: "/series/a", prefetch: true });
    expect(nextLinkMock.mock.calls[1][0]).toMatchObject({ href: "/series/b", prefetch: null });
  });

  it("ensures non-test files under src/ do not import next/link directly", () => {
    const srcRoot = join(process.cwd(), "src");
    const wrapperPath = join(srcRoot, "shared", "components", "link", "link.tsx");
    const directImports = collectSourceFiles(srcRoot)
      .filter((filePath) => filePath !== wrapperPath)
      .filter((filePath) => /from\s+["']next\/link["']/.test(readFileSync(filePath, "utf8")))
      .map((filePath) => relative(process.cwd(), filePath));

    expect(directImports).toEqual([]);
  });
});
