# 白鹿工作流初始化

执行白鹿工作流初始化流程。

## 品牌信息

- **名称**：白鹿（Bailu）
- **前缀**：bailu:
- **命令**：/bailu-init
- **寓意**：林深见鹿——在复杂的代码森林中，发现优雅的解决方案

## 执行流程

### 步骤1：执行原生初始化

1. 检测当前目录是否是项目目录
2. 如果已有 CLAUDE.md，备份并询问是否覆盖
3. 执行原生初始化逻辑：
   - 扫描项目文件
   - 分析技术栈（package.json、composer.json等）
   - 生成基础 CLAUDE.md

### 步骤2：叠加白鹿工作流配置

1. 在 CLAUDE.md 开头添加工作流配置引用：
   ```markdown
   ## 白鹿工作流配置
   
   @~/.ai-workflow/config.yaml
   ```

2. 添加工作流路由规则

3. 创建 .claude/rules/ 目录结构

### 步骤3：验证配置完整性

1. 检查 CLAUDE.md 是否正确引用工作流配置
2. 检查 .claude/rules/ 是否创建
3. 显示初始化完成信息

## 使用方式

```
/bailu-init
```

## 模板来源

- 全局模板：`~/.ai-workflow/templates/`
- 工作流配置：`~/.ai-workflow/config.yaml`
