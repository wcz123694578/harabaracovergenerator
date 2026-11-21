# Harabara Cover Generator

Tracker / Chiptune 曲目封面生成器。基于原生 HTML、CSS、JavaScript，可直接部署到 GitHub Pages。

**在线地址：** https://wcz123694578.github.io/harabaracovergenerator/

## 功能

- 实时预览深蓝底、浅黄色主标题、蓝绿色副标题的经典文字封面
- 自定义主标题、副标题、颜色和文字位置、宽度及行间距
- 预设分辨率、自定义宽高、锁定宽高比
- 按画布实际分辨率导出 PNG
- 尝试加载在线 / 本机 Harabara，支持导入本地 TTF、OTF、WOFF 和 WOFF2

## 项目结构

```text
.
├── index.html              # 页面结构
├── assets/
│   ├── css/site.css        # ASP.NET 默认模板风格的界面样式
│   └── js/app.js           # Canvas 绘制和页面交互
├── scripts/check.mjs       # 零依赖的静态检查
├── .github/workflows/check.yml
└── package.json
```

## 本地使用

直接在浏览器中打开 `index.html`，或者在仓库根目录启动静态文件服务器：

```bash
python -m http.server 8000
```

访问 http://localhost:8000/ 。

项目不需要 Node.js 构建，也不需要下载 npm 依赖。开发时可选用 Node.js 运行基础检查：

```bash
npm run check
```

## GitHub Pages 部署

仓库 `Settings → Pages → Build and deployment` 选择 `Deploy from a branch`，分支为 `main`，目录为 `/(root)`。之后更新 main 分支会由 Pages 自动部署。

## 字体说明

本仓库**不分发 Harabara 字体文件**。网页尝试从在线来源加载 Harabara；在线资源不可用时可尝试本机字体或在页面导入你自行取得且有权使用的字体文件。无法加载时会明确显示回退字体。字体许可由字体提供方决定。
