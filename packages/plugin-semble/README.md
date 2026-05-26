# @vickzhang/bailu-plugin-semble

> 白鹿工作流插件 - Semble 语义代码搜索引擎

## 🎯 这是什么

Semble 是一个**语义代码搜索引擎**，让你能够：

- 🔍 **语义搜索**：用自然语言描述，找到相关代码
- ⚡ **极快响应**：索引 ~250ms，查询 ~1.5ms
- 💰 **节省 Token**：比 grep+read 节省 98% token
- 🖥️ **零依赖**：CPU 运行，无需 GPU/API key

## 📦 安装

```bash
# 安装插件
bailu plugin install semble

# 或者直接 pip 安装
pip install semble
```

## 🚀 使用

### 创建索引

```bash
# 在项目根目录创建索引
bailu index .

# 指定输出路径
bailu index . -o cached_index
```

### 语义搜索

```bash
# 自然语言搜索
bailu search "认证流程"
bailu search "数据库连接池的实现"
bailu search "save_pretrained"

# 指定返回数量
bailu search "认证" --top-k 10

# 搜索文档
bailu search "部署指南" --content docs

# 搜索配置文件
bailu search "数据库端口" --content config

# 使用已创建的索引（更快）
bailu search "认证" --index cached_index
```

### 查找相关代码

```bash
# 查找与某行代码相关的实现
bailu find-related src/auth.py 42
```

## 📋 适用场景

| 场景 | 说明 |
|------|------|
| 🔍 代码查找 | "这个功能在哪里实现的？" |
| 📖 代码理解 | "这个函数是干嘛的？" |
| 🧭 快速定位 | 找到某个逻辑的精确位置 |
| 💰 Token 优化 | 减少 AI 对话中的 token 消耗 |

## ✅ 优点

- **比 grep 节省 98% token**：只返回相关代码片段
- **毫秒级响应**：索引 ~250ms，查询 ~1.5ms
- **CPU 运行**：无需 GPU，无需 API key
- **零外部依赖**：纯 Python 实现
- **支持自然语言**：不用记住精确关键词

## ⚠️ 注意事项

- 需要 Python 3.10+ 环境
- 索引不会自动更新，代码变更后需重新索引
- 适合语义搜索，精确字符串匹配用 grep 更好

## 🔗 相关链接

- [Semble GitHub](https://github.com/MinishLab/semble)
- [白鹿工作流文档](https://github.com/vickzhang/bailu-cli)

## 📄 许可证

MIT
