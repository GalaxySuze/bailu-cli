# 安装与配置

## 环境要求

| 依赖 | 最低版本 | 说明 |
|------|----------|------|
| Node.js | **18.0.0** 及以上 | 运行时环境 |
| npm | 随 Node.js 附带 | 包管理器 |
| Git | 任意版本 | 团队同步功能需要 |

验证 Node.js 版本：

```bash
node --version
# 应输出 v18.x.x 或更高版本
```

## 全局安装

```bash
npm install -g @vickzhang/bailu-cli
```

安装完成后，`bailu` 命令将全局可用。

## 验证安装

```bash
# 方法一：查看版本号
bailu -v
# 输出：1.1.0

# 方法二：直接运行（显示 TUI 仪表盘）
bailu
```

若能看到渐变色的 ASCII Art Banner 和仪表盘界面，则安装成功。

## 更新到最新版本

```bash
npm update -g @vickzhang/bailu-cli

# 更新后验证版本
bailu -v
```

## 卸载

```bash
npm uninstall -g @vickzhang/bailu-cli
```

## 配置目录

白鹿工作流的配置存储在 `~/.bailu/` 目录下：

```
~/.bailu/
├── config/
│   ├── base.yaml           # 基础配置
│   └── workflows/          # 工作流配置
│       ├── dev-workflow.yaml
│       └── ops-workflow.yaml
├── plugins/
│   └── installed.json      # 已安装插件
├── projects.json           # 项目配置
└── publish.json            # 发布配置
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `BAILU_HOME` | 配置目录路径 | `~/.bailu` |
| `BAILU_DEV` | 开发模式 | `false` |
