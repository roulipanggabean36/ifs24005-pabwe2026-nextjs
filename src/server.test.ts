import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "events";

const mocks = vi.hoisted(() => ({
  spawn: vi.fn(),
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  spawn: mocks.spawn,
  default: { spawn: mocks.spawn },
}));
vi.mock("node:fs", () => ({
  existsSync: mocks.existsSync,
  readFileSync: mocks.readFileSync,
  default: { existsSync: mocks.existsSync, readFileSync: mocks.readFileSync },
}));
const fakeCreateRequire = () => ({ resolve: (id: string) => `/resolved/${id}` });
vi.mock("node:module", () => ({
  createRequire: fakeCreateRequire,
  default: { createRequire: fakeCreateRequire },
}));

class FakeProc extends EventEmitter {
  kill = vi.fn();
}

function setFiles(files: Record<string, string>) {
  mocks.existsSync.mockImplementation((p: string) =>
    Object.keys(files).some((name) => p.endsWith(name))
  );
  mocks.readFileSync.mockImplementation((p: string) => {
    const key = Object.keys(files).find((name) => p.endsWith(name));
    return files[key as string];
  });
}

async function boot(argv: string[] = []) {
  const proc = new FakeProc();
  mocks.spawn.mockReturnValue(proc);
  const original = process.argv;
  process.argv = ["bun", "server.ts", ...argv];
  vi.resetModules();
  await import("./server");
  process.argv = original;
  return proc;
}

describe("server launcher", () => {
  const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("APP_PORT", "");
    setFiles({});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.removeAllListeners("SIGINT");
    process.removeAllListeners("SIGTERM");
  });

  it("tanpa env dan tanpa berkas: mode dev di port 3000", async () => {
    await boot();

    const [, args, options] = mocks.spawn.mock.calls[0];
    expect(args).toEqual(["/resolved/next/dist/bin/next", "dev", "-p", "3000"]);
    expect(options.stdio).toBe("inherit");
    expect(options.env.APP_PORT).toBe("3000");
  });

  it("membaca APP_PORT dari .env, mengabaikan komentar, baris kosong, dan baris tanpa '='", async () => {
    setFiles({
      ".env": '# komentar\n\nTANPA_SAMA\nAPP_PORT="4000"\r\nNEXT_PUBLIC_X=1\n',
    });
    await boot(["start"]);

    const [, args, options] = mocks.spawn.mock.calls[0];
    expect(args.slice(1)).toEqual(["start", "-p", "4000"]);
    expect(options.env.NEXT_PUBLIC_X).toBe("1");
  });

  it("memakai .env.example sebagai cadangan, dan .env menimpanya", async () => {
    setFiles({ ".env.example": "APP_PORT=5000\n" });
    await boot();
    expect(mocks.spawn.mock.calls[0][1]).toContain("5000");

    vi.clearAllMocks();
    setFiles({ ".env.example": "APP_PORT=5000\n", ".env": "APP_PORT=6000\n" });
    await boot();
    expect(mocks.spawn.mock.calls[0][1]).toContain("6000");
  });

  it("variabel environment proses lebih diutamakan daripada berkas", async () => {
    vi.stubEnv("APP_PORT", "7000");
    setFiles({ ".env": "APP_PORT=6000\n" });
    await boot();

    expect(mocks.spawn.mock.calls[0][1]).toContain("7000");
  });

  it("argumen selain 'start' menjalankan mode dev", async () => {
    await boot(["apa-saja"]);
    expect(mocks.spawn.mock.calls[0][1][1]).toBe("dev");
  });

  it("SIGINT dan SIGTERM meneruskan sinyal ke proses anak lalu keluar", async () => {
    const proc = await boot();

    process.emit("SIGINT");
    expect(proc.kill).toHaveBeenCalledWith("SIGINT");
    process.emit("SIGTERM");
    expect(proc.kill).toHaveBeenCalledWith("SIGTERM");
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it("meneruskan kode keluar proses anak; null menjadi 0", async () => {
    const proc = await boot();

    proc.emit("exit", 3);
    expect(exitSpy).toHaveBeenLastCalledWith(3);
    proc.emit("exit", null);
    expect(exitSpy).toHaveBeenLastCalledWith(0);
  });
});
