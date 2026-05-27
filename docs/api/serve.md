# bailu serve

启动 WebUI 管理界面。

## 用法

```bash
bailu serve [options]
```

## 选项

| 选项 | 说明 |
|------|------|
| `-p, --port <port>` | 指定端口（默认 3000） |
| `-H, --host <host>` | 指定主机（默认 localhost） |

## 示例

```bash
# 启动 WebUI
bailu serve

# 指定端口
bailu serve --port 8080

# 局域网访问
bailu serve --host 0.0.0.0
```

## 功能页面

- 工作区：系统概览
- 工作流：管理工作流
- 组件：查看组件
- AI 工具：管理工具配置
- 项目管理：管理项目
- 安全审计：安全检查
