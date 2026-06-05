# 常见问题

## 安装问题

### Q: 安装时报错 "command not found: bailu"

**原因**：npm 全局安装路径未添加到 PATH 环境变量。

**解决方案**：

```bash
# 查看 npm 全局安装路径
npm config get prefix

# 将路径添加到 PATH（以 ~/.nvm 为例）
export PATH="$HOME/.nvm/versions/node/v23.5.0/bin:$PATH"

# 永久生效，添加到 ~/.zshrc 或 ~/.bashrc
echo 'export PATH="$HOME/.nvm/versions/node/v23.5.0/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Q: 安装时报错 "EACCES: permission denied"

**原因**：没有全局安装权限。

**解决方案**：

```bash
# 方案一：使用 npx
npx @vickzhang/bailu-cli init

# 方案二：修改 npm 全局安装目录
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Q: Node.js 版本过低

**原因**：白鹿工作流需要 Node.js 18.0.0 或更高版本。

**解决方案**：

```bash
# 使用 nvm 升级 Node.js
nvm install 20
nvm use 20

# 或者使用 n
n lts
```

## 配置问题

### Q: 配置文件在哪里？

白鹿工作流的配置存储在 `~/.bailu/` 目录：

```
~/.bailu/
├── config/              # 配置文件
│   ├── base.yaml        # 基础配置
│   └── workflows/       # 工作流配置
├── projects.json        # 项目配置
└── publish.json         # 发布配置
```

### Q: 如何重置配置？

```bash
# 备份现有配置
mv ~/.bailu ~/.bailu.backup

# 重新初始化
bailu init
```

### Q: 如何迁移配置到新电脑？

```bash
# 在旧电脑上
bailu sync push

# 在新电脑上
bailu init
bailu sync pull
```

## 工作流问题

### Q: 安装工作流后没有生效

**原因**：可能需要重启 AI 工具。

**解决方案**：

1. 重启 Claude Code 或其他 AI 工具
2. 检查组件是否正确安装：
   ```bash
   bailu status
   ```

### Q: 如何卸载工作流？

```bash
# 卸载开发工作流
bailu workflow uninstall dev

# 跳过确认
bailu workflow uninstall dev --clean
```

### Q: 工作流安装失败

**原因**：可能是权限问题或路径不存在。

**解决方案**：

```bash
# 检查权限
ls -la ~/.claude/

# 检查路径
bailu status

# 强制重新安装
bailu workflow install dev --force
```

## WebUI 问题

### Q: WebUI 无法访问

**原因**：端口被占用或防火墙阻止。

**解决方案**：

```bash
# 检查端口占用
lsof -i :3000

# 使用其他端口
bailu serve --port 8080

# 允许局域网访问
bailu serve --host 0.0.0.0
```

### Q: WebUI 显示空白

**原因**：可能是浏览器缓存问题。

**解决方案**：

1. 清除浏览器缓存
2. 使用无痕模式访问
3. 检查控制台错误信息

## 同步问题

### Q: 同步时报错 "git not found"

**原因**：未安装 Git 或 Git 不在 PATH 中。

**解决方案**：

```bash
# 安装 Git
# macOS
brew install git

# Ubuntu
sudo apt install git

# 验证安装
git --version
```

### Q: 同步时出现冲突

**原因**：本地和远程配置不一致。

**解决方案**：

```bash
# 查看冲突
bailu sync pull

# 手动解决冲突后
git add .
git commit -m "resolve: 配置冲突"
bailu sync push
```

## 其他问题

### Q: 如何更新白鹿工作流？

```bash
npm update -g @vickzhang/bailu-cli

# 验证版本
bailu -v
```

### Q: 如何卸载白鹿工作流？

```bash
npm uninstall -g @vickzhang/bailu-cli

# 删除配置（可选）
rm -rf ~/.bailu
```

### Q: 如何获取帮助？

```bash
# 查看帮助
bailu --help

# 查看命令帮助
bailu workflow --help

# 打开文档
bailu docs
```

### Q: 如何报告问题？

在 GitHub 上提交 Issue：
- 仓库地址：https://github.com/vickzhang/bailu-cli
- 请包含错误信息和复现步骤
