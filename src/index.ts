import fs, { constants } from "node:fs/promises";
import { ERR_GT_MAX_SAFE_INTEGER, ERR_LT_ZERO, ERR_LT_CURR_SIZE } from "./error";

export interface SparseOptions {
    /**
     * @default true
     */
    safe?: boolean;
    /**
     * By default, the mode is only set when creating a file, unless overwriteMode is specified.
     * @default 0o644
     */
    mode?: number;
    /**
     * When the overwrite mode is allowed, the mode will be set even if the file exists.
     * @default false
     */
    overwriteMode?: boolean;
}

export const createSparse = async (filepath: string, size: number, options?: SparseOptions): Promise<void> => {
    const mode = options?.mode || 0o644;
    const fh = await open(filepath, mode);

    const curState = await fs.stat(filepath);
    if (options?.safe !== false) {
        if (size < 0) {
            await fh.close();
            throw new Error(ERR_LT_ZERO);
        }

        if (curState.size > size) {
            await fh.close();
            throw new Error(ERR_LT_CURR_SIZE);
        }

        if (size > Number.MAX_SAFE_INTEGER) {
            await fh.close();
            throw new Error(ERR_GT_MAX_SAFE_INTEGER);
        }

        if (curState.size === size) {
            if (options?.overwriteMode) {
                await fh.chmod(mode);
            }
            await fh.close();
            return;
        }
    } else {
        if (size <= 0) {
            size = 0;
        } else if (size > Number.MAX_SAFE_INTEGER) {
            size = Number.MAX_SAFE_INTEGER;
        }
    }

    await fh.truncate(size);
    if (options?.overwriteMode) {
        await fh.chmod(mode);
    }
    await fh.sync();
    await fh.close();
};

export const resizeSparse = createSparse;

export const physicalFileSize = async (filepath: string): Promise<number> => {
    const state = await fs.stat(filepath);
    // No state.blocks * state.blksize.
    // See: https://www.gnu.org/software/libc/manual/html_node/Attribute-Meanings.html#index-struct-stat
    return state.blocks * 512;
};

/**
 * If the file already exists,
 * we need to use the `rs+` flag to avoid obtaining incorrect file information, such as file size.
 * See: https://nodejs.org/api/fs.html#fs_file_system_flags
 */
const open = async (filepath: string, mode: number): Promise<fs.FileHandle> => {
    let fh: fs.FileHandle;
    try {
        await fs.access(filepath, constants.F_OK);
        fh = await fs.open(filepath, "rs+", mode);
    } catch (_error) {
        fh = await fs.open(filepath, "w+", mode);
    }

    await fh.datasync();
    return fh;
};
