# 白鹿 CLI 开发环境说明

## 命令分类

### 用户命令（所有人都能用）

- `bailu init` - 初始化配置中心
- `bailu status` - 查看状态
- `bailu workflow` - 工作流管理
- `bailu tool` - 工具管理
- `bailu config` - 打开配置目录

### 开发者命令（仅你使用）

- `bailu publish` - 发布npm包

## 使用方式

### 普通用户

```bash
# 安装
npm install -g @vickzhang/bailu-cli

# 使用
bailu init
bailu status
bailu workflow list
```

### 开发者（你）

```bash
# 方式1：使用dev.sh脚本
cd ~/bailu-monorepo
./dev.sh publish --dry-run
./dev.sh publish

# 方式2：设置环境变量
BAILU_DEV=true bailu publish --dry-run
BAILU_DEV=true bailu publish
```

## 发布流程

```bash
# 1. 预览发布内容
./dev.sh publish --dry-run

# 2. 登录npm
npm login --registry https://registry.npmjs.org

# 3. 发布
./dev.sh publish
```

## 配置文件

### 发布配置

`~/.bailu/publish.json`：

```json
{
  "packages": {
    "@vickzhang/bailu-cli": {
      "publish": true,
      "description": "白鹿工作流 CLI 核心"
    },
    "@vickzhang/bailu-workflow-dev": {
      "publish": true,
      "description": "开发工作流（团队使用）"
    },
    "@vickzhang/bailu-workflow-ops": {
      "publish": false,
      "description": "运营工作流（个人使用，不分发）"
    }
  }
}
```

## 目录结构

```
~/bailu-monorepo/
├── packages/
│   ├── cli/
│   │   ├── bin/bailu.js          # CLI入口
│   │   ├── src/
│   │   │   ├── commands/         # 用户命令（打包到npm）
│   │   │   ├── dev/              # 开发命令（不打包）
│   │   │   └── utils/            # 工具函数
│   │   └── package.json
│   ├── workflow-dev/
│   └── workflow-ops/
├── dev.sh                          # 开发环境启动脚本
└── publish.json                    # 发布配置
```

## 注意事项

1. **publish命令不会打包到npm**：`package.json` 的 `files` 字段只包含 `src/commands/`，不包含 `src/dev/`
2. **普通用户看不到publish命令**：只有设置 `BAILU_DEV=true` 或使用 `dev.sh` 才能使用
3. **发布配置在 `~/.bailu/publish.json`**：控制哪些包可以发布
