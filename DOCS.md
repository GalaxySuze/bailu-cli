# 文档部署指南

本文档介绍如何部署白鹿工作流文档站点。

## 本地开发

### 安装依赖

```bash
cd /Users/kangkang/Code/AIAgent/bailu-cli
npm install
```

### 启动开发服务器

```bash
npm run docs:dev
```

访问 `http://localhost:5173` 查看文档。

### 构建文档

```bash
npm run docs:build
```

构建产物在 `docs/.vitepress/dist` 目录。

### 预览构建结果

```bash
npm run docs:preview
```

## 部署到 GitHub Pages

### 第一步：启用 GitHub Pages

1. 进入 GitHub 仓库设置：`https://github.com/vickzhang/bailu-cli/settings`
2. 找到 **Pages** 选项
3. 在 **Source** 中选择 **GitHub Actions**

### 第二步：推送代码

```bash
git add .
git commit -m "feat: 添加 VitePress 文档站点"
git push origin main
```

### 第三步：查看部署状态

1. 进入 GitHub 仓库的 **Actions** 页面
2. 找到 **Deploy Docs** workflow
3. 等待部署完成

### 第四步：访问文档

部署完成后，访问：

```
https://vickzhang.github.io/bailu-cli/
```

## 自定义域名

如果你有自己的域名，可以配置自定义域名：

### 第一步：添加 CNAME 文件

在 `docs/public/` 目录下创建 `CNAME` 文件：

```
docs.bailu.dev
```

### 第二步：配置 DNS

在你的域名提供商处添加 CNAME 记录：

```
docs.bailu.dev  →  vickzhang.github.io
```

### 第三步：更新 GitHub 设置

1. 进入 GitHub 仓库设置的 **Pages** 页面
2. 在 **Custom domain** 中输入你的域名
3. 勾选 **Enforce HTTPS**

## 文档结构

```
docs/
├── .vitepress/
│   └── config.js          # VitePress 配置
├── index.md               # 首页
├── guide/                 # 指南
│   ├── index.md           # 项目简介
│   ├── getting-started.md # 快速开始
│   └── ...
├── api/                   # API 参考
│   ├── index.md           # 命令概览
│   └── ...
└── package.json           # 文档依赖
```

## 添加新页面

### 第一步：创建 Markdown 文件

在 `docs/guide/` 或 `docs/api/` 目录下创建 `.md` 文件。

### 第二步：更新侧边栏

编辑 `docs/.vitepress/config.js`，在 `sidebar` 中添加新页面。

### 第三步：提交更改

```bash
git add docs/
git commit -m "docs: 添加新页面"
git push origin main
```

GitHub Actions 会自动重新部署文档。

## 常见问题

### Q: 文档更新后没有自动部署？

A: 检查以下几点：
1. 确认 GitHub Actions 已启用
2. 确认推送的分支是 `main`
3. 确认修改的文件在 `docs/` 目录下

### Q: 如何在本地预览构建后的文档？

A: 运行以下命令：

```bash
npm run docs:build
npm run docs:preview
```

### Q: 如何添加搜索功能？

A: VitePress 内置了搜索功能，只需在 `config.js` 中配置 `search` 选项即可。当前配置已启用本地搜索。
