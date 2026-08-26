# LINGXI CODE CLI — 多平台离线版本打包指南

> 本文档介绍如何为 **LINGXI CODE CLI** 企业内网离线版本进行多平台打包。

---

## 目录

- [通用前置条件](#通用前置条件)
- [一、Windows 10 x64 系统](#一windows-10-x64-系统)
- [二、麒麟 ARM64 系统](#二麒麟-arm64-系统)
- [三、麒麟 x64 系统](#三麒麟-x64-系统)
- [四、麒麟 x64 系统（baseline 版）](#四麒麟-x64-系统baseline-版)

---

## 通用前置条件

在开始打包之前，请确保已完成以下准备：

1. **下载完整的 GitHub 工程文件**，其中包含已编译好的企业内网离线版 LINGXI CODE CLI 主程序。
2. 根据目标平台，可修改 `<project-root>/artifacts/<platform>/attached/*` 目录下的配置文件和插件。

---

## 一、Windows 10 x64 系统

| 项目 | 说明 |
| :--- | :--- |
| **可定制文件** | `<project-root>/artifacts/win10-x64/attached/*` |
| **打包脚本** | `./script/build-win10-x64-release-package.ps1` |
| **输出版本** | `<project-root>/artifacts/win10-x64/release/*` |

### 操作步骤

1. 下载完整的 GitHub 工程文件。
2. 按需修改 `artifacts/win10-x64/attached/` 目录下的配置文件与插件。
3. 使用 **Windows PowerShell** 进入 `<project-root>` 目录，运行以下命令：

   ```powershell
   ./script/build-win10-x64-release-package.ps1
   ```

---

## 二、麒麟 ARM64 系统

| 项目 | 说明 |
| :--- | :--- |
| **可定制文件** | `<project-root>/artifacts/kylin-arm64/attached/*` |
| **打包脚本** | `./script/build-kylin-arm64-release-package.ps1` |
| **输出版本** | `<project-root>/artifacts/kylin-arm64/release/*` |

### 操作步骤

1. 下载完整的 GitHub 工程文件。
2. 按需修改 `artifacts/kylin-arm64/attached/` 目录下的配置文件与插件。
3. 使用 **Windows PowerShell** 进入 `<project-root>` 目录，运行以下命令：

   ```powershell
   ./script/build-kylin-arm64-release-package.ps1
   ```

---

## 三、麒麟 x64 系统

| 项目 | 说明 |
| :--- | :--- |
| **可定制文件** | `<project-root>/artifacts/kylin-x64/attached/*` |
| **打包脚本** | `./script/build-kylin-x64-release-package.ps1` |
| **输出版本** | `<project-root>/artifacts/kylin-x64/release/*` |

### 操作步骤

1. 下载完整的 GitHub 工程文件。
2. 按需修改 `artifacts/kylin-x64/attached/` 目录下的配置文件与插件。
3. 使用 **Windows PowerShell** 进入 `<project-root>` 目录，运行以下命令：

   ```powershell
   ./script/build-kylin-x64-release-package.ps1
   ```

---

## 四、麒麟 x64 系统（baseline 版）

> **baseline 版**不使用 AVX2 指令（仅要求 SSE2），适用于部分虚拟机环境：
> CPUID 暴露 avx2 但 XCR0 未启用 AVX2 执行状态，标准版运行报
> `Illegal instruction` 崩溃的机器。普通物理机请使用第三节的标准版，性能更优。

| 项目 | 说明 |
| :--- | :--- |
| **可定制文件** | `<project-root>/artifacts/kylin-x64-baseline/attached/*` |
| **编译脚本**（前置） | `./script/build-kylin-x64-baseline.sh`（WSL2 运行） |
| **打包脚本** | `./script/build-kylin-x64-baseline-release-package.ps1` |
| **输出版本** | `<project-root>/artifacts/kylin-x64-baseline/release/*` |

### 操作步骤

1. 下载完整的 GitHub 工程文件。
2. 在 **WSL2** 中进入 `<project-root>` 目录，编译 baseline 二进制（产物位于
   `packages/opencode/dist/opencode-linux-x64-baseline/bin/opencode`）：

   ```bash
   ./script/build-kylin-x64-baseline.sh
   ```

3. 按需修改 `artifacts/kylin-x64-baseline/attached/` 目录下的配置文件与插件。
4. 使用 **Windows PowerShell** 进入 `<project-root>` 目录，运行以下命令：

   ```powershell
   ./script/build-kylin-x64-baseline-release-package.ps1
   ```

---

## 平台选择说明

| 场景 | 推荐版本 |
| :--- | :--- |
| 普通物理机 / 正常虚拟机 | 标准版（第一节至第三节） |
| 虚拟机上运行标准版报 `Illegal instruction` 崩溃 | baseline 版（第四节） |

---

## 平台速查表

| 平台 | 架构 | 版本 | 可定制文件路径 | 编译脚本 | 打包脚本 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Windows 10 | x64 | 标准 | `artifacts/win10-x64/attached/` | `build-win-x64.ps1` | `build-win10-x64-release-package.ps1` |
| 麒麟 | ARM64 | 标准 | `artifacts/kylin-arm64/attached/` | `build-kylin-arm64.sh` | `build-kylin-arm64-release-package.ps1` |
| 麒麟 | x64 | 标准 | `artifacts/kylin-x64/attached/` | `build-kylin-x64.sh` | `build-kylin-x64-release-package.ps1` |
| 麒麟 | x64 | baseline（无 AVX2） | `artifacts/kylin-x64-baseline/attached/` | `build-kylin-x64-baseline.sh` | `build-kylin-x64-baseline-release-package.ps1` |
