# bailu init

初始化白鹿工作流配置。

## 用法

```bash
bailu init [options]
```

## 选项

| 选项 | 说明 |
|------|------|
| `-f, --force` | 强制覆盖现有配置 |

## 示例

```bash
# 初始化配置
bailu init

# 强制覆盖
bailu init --force
```

## 执行内容

初始化命令会：
1. 创建 `~/.bailu/` 配置目录
2. 创建默认工作流配置
3. 检测已安装的 AI 工具
