# @oomol-lab/sparse-file

[![github license]](https://github.com/oomol-lab/sparse-file-js/blob/main/LICENSE) [![coveralls]](https://coveralls.io/github/oomol-lab/sparse-file-js) [![npm bundle size]](https://www.npmjs.com/package/@oomol-lab/sparse-file) [![github release]](https://github.com/oomol-lab/sparse-file-js/releases/latest)

Create / Resize sparse file

## Features

* Support Linux / MacOS
* Default Safe Mode
* Not Affected By System Cache
* Get Physical Size(the space that a file takes up on disk)
* 100% Code Coverage
* 0 Dependency

## Install

```bash
# npm
npm install @oomol-lab/sparse-file
# yarn
yarn add @oomol-lab/sparse-file
# pnpm
pnpm add @oomol-lab/sparse-file
```

## API

### createSparse(filepath: string, size: number, options?: SparseOptions): Promise\<void\>

* `filepath`: string - Sparse file paths to create/resize
* `size`: number - Sparse file size
* `options?.safe`: boolean - Safe mode, default: true
* `options?.mode`: number - File mode, default: 0o644

In safe mode, an error will occur if the size is less than 0 or greater than `Number.MAX_SAFE_INTEGER`. Additionally, it will be rejected if the passed size is larger than the current file size.

In non-safe mode, a size less than 0 will be reset to 0, and a size greater than `Number.MAX_SAFE_INTEGER` will be reset to `Number.MAX_SAFE_INTEGER`.

### resizeSparse(filepath: string, size: number, options?: SparseOptions): Promise\<void\>

alias to: `createSparse`

### physicalFileSize(filepath: string): Promise\<number\>

* `filepath`: string - File paths

Return the actual occupied size of the file on the physical hard drive.

[github license]: https://img.shields.io/github/license/oomol-lab/sparse-file-js?style=flat-square&color=9cf
[coveralls]: https://img.shields.io/coverallsCoverage/github/oomol-lab/sparse-file-js?branch=main&style=flat-square&color=9cf
[npm bundle size]: https://img.shields.io/bundlephobia/minzip/%40oomol-lab/sparse-file?style=flat-square&color=9cf
[github release]: https://img.shields.io/github/v/release/oomol-lab/sparse-file-js?style=flat-square&color=9cf
