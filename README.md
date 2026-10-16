# Family Menu · 家常一桌

Preference-aware meal planning with local browser storage.

根据就餐人数、食材、口味与近期用餐记录生成一桌家常菜。

**技术栈 / Stack:** React · TypeScript · Vite · Dexie / IndexedDB · Vitest

<img src="public/icons/app-icon-256.png" width="88" alt="Application icon">

## 能做什么

- 加权生成整桌菜单，支持整桌重抽、单道替换、加菜和删菜。
- 管理菜品、食材、家庭成员、偏好及菜单预设。
- 数据保存在 IndexedDB，提供桌面浏览器与 Windows 独立窗口入口。

## 安装与运行

Node.js 22.12+ 或兼容的较新版本。

```powershell
npm ci
npm run dev -- --port 4173
```

浏览器打开 http://127.0.0.1:4173/ 。首次运行填入示例数据；真实用餐历史保存在浏览器中，不在仓库内。Windows 独立窗口入口：

```powershell
powershell -NoProfile -File scripts/启动家常一桌.ps1 -Install
```

## 验证

```powershell
npm test
npm run typecheck
npm run build
npm run e2e
```

端到端测试需要本机 Chrome。

命令结果与验收范围见 [VALIDATION.md](VALIDATION.md)。这些检查不能替代目标机器上的原生桌面验收。

## 发布范围

[公开源码说明](PUBLICATION.md) · [全部作品](https://github.com/YUANYZ-cell)
