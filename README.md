---
project: cockpit-ui
type: ssot
owner: governance-team
last_updated: 2026-09-06
---
# Cockpit UI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Contributing](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Security](https://img.shields.io/badge/security-policy-blue.svg)](SECURITY.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-runtime-black.svg)](https://bun.sh/)

    > L3/X · cockpit 挂载的 Web 控制台 UI
    > Metadata SSOT: [`../../docs/project-registry.yaml`](../../docs/project-registry.yaml)

    ## What It Owns

    cockpit 挂载的 Web 控制台 UI.

    ## Quick Start

    ```bash
bun install
bun run dev      # start dev server
bun run build    # typecheck + production build
bun run preview  # preview production build
bun run test     # baseline: typecheck + unit + build + preview + e2e
bun run test:unit
bun run test:e2e
bun run typecheck
    ```

    ## Key Surfaces

    - `src/`
- `src/lib/`
- vite.config.*
- `package.json`

    ## Documentation

    - Developer guide: [`AGENTS.md`](AGENTS.md)
    - AI context loader: [`CLAUDE.md`](CLAUDE.md) when present
    - Workspace architecture: [`../../ARCHITECTURE.md`](../../ARCHITECTURE.md)
    - Layer placement: [`../../LAYER-INDEX.md`](../../LAYER-INDEX.md)

    ## SSOT Rules

    Runtime facts, counts, ports, health, and generated inventories are intentionally not maintained here. Use the workspace registries and project source as the truth.
## Project Governance

- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [License](LICENSE)
- [Code of Conduct](CODE_OF_CONDUCT.md)
---

## 项目状态 (动态数据)

| 指标 | 权威读源 | 说明 |
|------|----------|------|
| 版本 | `pyproject.toml` → `[project.version]` | 以 pyproject.toml 为准 |
| 测试数 | `pytest --collect-only -q` | 动态计数 |
| 代码行数 | `find src -name "*.py" \| wc -l` | 以实际文件为准 |
| 源文件数 | `find src -name "*.py" \| wc -l` | 以实际文件为准 |
| 测试文件数 | `find tests -name "*.py" \| wc -l` | 以实际文件为准 |

> **doc-ssot 契约**: 上表中的所有数字均为易变事实, 不在本文件硬编码. 运行权威读源命令获取实时值.
> 模板: `.omo/standards/readme-template.md` | 检测: `bin/gac/check-readme-hardcoded.py`

