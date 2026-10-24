// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from "vitest";
import { compressAvatar } from "./compress-avatar";

const revokeObjectURL = vi.fn();
let encoded: Blob;

beforeEach(() => {
  encoded = new Blob(["image"], { type: "image/webp" });
  revokeObjectURL.mockClear();
  vi.stubGlobal("URL", { createObjectURL: () => "blob:fixture", revokeObjectURL });
  vi.stubGlobal("Image", class {
    width = 800;
    height = 400;
    onload?: () => void;
    set src(_value: string) { this.onload?.(); }
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(encoded));
});

it("converts a selected image into a bounded WebP avatar", async () => {
  const result = await compressAvatar(new File(["original"], "avatar.jpg", { type: "image/jpeg" }));
  expect(result).toBe(encoded);
  expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.82);
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:fixture");
});

it("rejects a browser encoder fallback instead of labelling PNG as WebP", async () => {
  encoded = new Blob(["png"], { type: "image/png" });
  await expect(compressAvatar(new File(["original"], "avatar.png"))).rejects.toThrow("WebP");
});

it("rejects a compressed avatar larger than the bucket limit", async () => {
  encoded = new Blob([new Uint8Array(1024 * 1024 + 1)], { type: "image/webp" });
  await expect(compressAvatar(new File(["original"], "avatar.jpg"))).rejects.toThrow("1 MB");
});
