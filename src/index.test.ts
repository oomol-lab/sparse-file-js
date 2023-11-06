import { describe, it, beforeEach, expect } from "vitest";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
import { createSparse, physicalFileSize, resizeSparse } from ".";
import { ERR_GT_MAX_SAFE_INTEGER, ERR_LT_CURR_SIZE, ERR_LT_ZERO } from "./error";

interface TestContext {
    cwd: string;
    file: string;
}

beforeEach<TestContext>(async (ctx) => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "sparse-file-"));
    ctx.cwd = tmpDir;
    ctx.file = path.join(tmpDir, Math.random().toString(36).slice(-6));

    return async () => {
        await fs.rm(tmpDir, {
            recursive: true,
            force: true,
        });
    };
});

describe.concurrent("create sparse with safe mode", () => {
    it<TestContext>("should be true with default", async (ctx) => {
        await expect(createSparse(ctx.file, -1)).rejects.toThrow(ERR_LT_ZERO);
    });

    it<TestContext>("should throw error when size < 0", async (ctx) => {
        await expect(createSparse(ctx.file, -2)).rejects.toThrow(ERR_LT_ZERO);
    });

    it<TestContext>("should throw error when filesize > pass size param", async (ctx) => {
        {
            const fh = await fs.open(ctx.file, "w");
            await fh.writeFile(Buffer.alloc(2));
            await fh.sync();
            await fh.close();
        }

        await expect(createSparse(ctx.file, 1)).rejects.toThrow(ERR_LT_CURR_SIZE);
    });

    it<TestContext>("should throw error when size > Number.MAX_SAFE_INTEGER", async (ctx) => {
        await expect(createSparse(ctx.file, Number.MAX_SAFE_INTEGER + 1)).rejects.toThrow(ERR_GT_MAX_SAFE_INTEGER);
    });

    it<TestContext>("do nothing when filesize == pass size param", async (ctx) => {
        {
            const fh = await fs.open(ctx.file, "w");
            await fh.writeFile(Buffer.alloc(3));
            await fh.sync();
            await fh.close();
        }

        await expect(createSparse(ctx.file, 3)).resolves.toBeUndefined();
    });
});

describe("create sparse without safe mode", () => {
    it<TestContext>("should set size to 0 when size <= 0", async (ctx) => {
        {
            const fh = await fs.open(ctx.file, "w");
            await fh.writeFile(Buffer.alloc(4096));
            await fh.sync();
            await fh.close();
        }

        await expect(fs.stat(ctx.file)).resolves.toMatchObject({
            size: 4096,
        });

        await createSparse(ctx.file, -1, {
            safe: false,
        });

        await expect(fs.stat(ctx.file)).resolves.toMatchObject({
            size: 0,
        });
    });

    it<TestContext>("should set size to Number.MAX_SAFE_INTEGER when size > Number.MAX_SAFE_INTEGER", async (ctx) => {
        {
            const fh = await fs.open(ctx.file, "w");
            await fh.writeFile(Buffer.alloc(1));
            await fh.sync();
            await fh.close();
        }

        await expect(fs.stat(ctx.file)).resolves.toMatchObject({
            size: 1,
        });

        await createSparse(ctx.file, Number.MAX_SAFE_INTEGER + 1, {
            safe: false,
        });

        await expect(fs.stat(ctx.file)).resolves.toMatchObject({
            size: Number.MAX_SAFE_INTEGER,
        });
    });
});

it.concurrent<TestContext>("create sparse with custom mode", async (ctx) => {
    await createSparse(ctx.file, 1, {
        mode: 0o600,
    });

    const stat = await fs.stat(ctx.file);

    expect(stat.mode & 0o777).eq(0o600);
});

describe.concurrent("physical file size", () => {
    it<TestContext>("should return 0 when file is empty sparsefile", async (ctx) => {
        // 10KB
        await createSparse(ctx.file, 1024 * 10);
        expect(await physicalFileSize(ctx.file)).eq(0);
    });

    it<TestContext>("should return 0 when file is empty sparsefile", async (ctx) => {
        const fh = await fs.open(ctx.file, "w");
        const { blksize } = await fh.stat();
        await fh.write(Buffer.alloc(1));
        await fh.sync();
        await fh.close();

        // 8KB
        await resizeSparse(ctx.file, 1024 * 4 * 2);

        // If the actual size is less than 4096, then it is considered as 4096.
        expect(await physicalFileSize(ctx.file)).eq(blksize);
    });
});

