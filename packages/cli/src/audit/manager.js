/**
 * 安全审计管理器
 * 
 * 审计工作流配置的安全性
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const CLAUDE_HOME = path.join(os.homedir(), '.claude');

/**
 * 安全审计规则
 */
const AUDIT_RULES = {
  // 命令注入风险
  commandInjection: {
    name: '命令注入',
    severity: 'high',
    description: '检测潜在的命令注入风险',
    patterns: [
      /\$\(.*\)/g,
      /`.*`/g,
      /exec\s*\(/gi,
      /eval\s*\(/gi,
      /spawn\s*\(/gi,
      /system\s*\(/gi
    ]
  },
  
  // 敏感信息泄露
  sensitiveInfo: {
    name: '敏感信息',
    severity: 'high',
    description: '检测可能的敏感信息泄露',
    patterns: [
      /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
      /secret\s*[:=]\s*['"][^'"]+['"]/gi,
      /password\s*[:=]\s*['"][^'"]+['"]/gi,
      /token\s*[:=]\s*['"][^'"]+['"]/gi,
      /private[_-]?key/gi
    ]
  },
  
  // 文件路径遍历
  pathTraversal: {
    name: '路径遍历',
    severity: 'medium',
    description: '检测潜在的路径遍历风险',
    patterns: [
      /\.\.\//g,
      /\.\.\\\\/g,
      /\/etc\/passwd/gi,
      /\/etc\/shadow/gi
    ]
  },
  
  // 网络请求
  networkAccess: {
    name: '网络访问',
    severity: 'low',
    description: '检测网络请求',
    patterns: [
      /https?:\/\//g,
      /fetch\s*\(/gi,
      /axios/gi,
      /request\s*\(/gi
    ]
  },
  
  // 文件系统操作
  fileSystem: {
    name: '文件系统',
    severity: 'low',
    description: '检测文件系统操作',
    patterns: [
      /fs\./g,
      /readFile/gi,
      /writeFile/gi,
      /unlink/gi,
      /rmdir/gi,
      /mkdir/gi
    ]
  }
};

/**
 * 安全审计管理器类
 */
class AuditManager {
  constructor() {
    this.componentsDir = CLAUDE_HOME;
  }

  /**
   * 执行完整审计
   * @returns {Promise<Object>} 审计结果
   */
  async audit() {
    const results = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        high: 0,
        medium: 0,
        low: 0,
        passed: 0
      },
      components: {}
    };

    // 审计 Skills
    const skillsResults = await this.auditDirectory('skills');
    results.components.skills = skillsResults;

    // 审计 Commands
    const commandsResults = await this.auditDirectory('commands');
    results.components.commands = commandsResults;

    // 审计 Agents
    const agentsResults = await this.auditDirectory('agents');
    results.components.agents = agentsResults;

    // 审计 Hooks
    const hooksResults = await this.auditDirectory('hooks');
    results.components.hooks = hooksResults;

    // 汇总统计
    for (const component of Object.values(results.components)) {
      results.summary.total += component.total;
      results.summary.high += component.high;
      results.summary.medium += component.medium;
      results.summary.low += component.low;
      results.summary.passed += component.passed;
    }

    // 计算信任分数
    results.trustScore = this.calculateTrustScore(results.summary);

    return results;
  }

  /**
   * 审计目录
   * @param {string} dirName - 目录名
   * @returns {Promise<Object>} 审计结果
   */
  async auditDirectory(dirName) {
    const dirPath = path.join(this.componentsDir, dirName);
    const results = {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
      passed: 0,
      findings: []
    };

    if (!await fs.pathExists(dirPath)) {
      return results;
    }

    const files = await this.getFiles(dirPath);
    results.total = files.length;

    for (const file of files) {
      const fileFindings = await this.auditFile(file);
      
      if (fileFindings.length === 0) {
        results.passed++;
      } else {
        for (const finding of fileFindings) {
          results.findings.push({
            file: path.relative(this.componentsDir, file),
            ...finding
          });

          switch (finding.severity) {
            case 'high':
              results.high++;
              break;
            case 'medium':
              results.medium++;
              break;
            case 'low':
              results.low++;
              break;
          }
        }
      }
    }

    return results;
  }

  /**
   * 审计单个文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Array>} 发现的问题
   */
  async auditFile(filePath) {
    const findings = [];
    
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      for (const [ruleId, rule] of Object.entries(AUDIT_RULES)) {
        for (const pattern of rule.patterns) {
          const matches = content.match(pattern);
          
          if (matches) {
            findings.push({
              rule: ruleId,
              ruleName: rule.name,
              severity: rule.severity,
              description: rule.description,
              matches: matches.length,
              lines: this.findLineNumbers(content, pattern)
            });
          }
        }
      }
    } catch (error) {
      findings.push({
        rule: 'readError',
        ruleName: '读取错误',
        severity: 'medium',
        description: `无法读取文件: ${error.message}`
      });
    }

    return findings;
  }

  /**
   * 获取目录下的所有文件
   * @param {string} dirPath - 目录路径
   * @returns {Promise<Array>} 文件列表
   */
  async getFiles(dirPath) {
    const files = [];
    
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        try {
          const itemPath = path.join(dirPath, item);
          const stat = await fs.stat(itemPath);
          
          if (stat.isDirectory()) {
            const subFiles = await this.getFiles(itemPath);
            files.push(...subFiles);
          } else {
            files.push(itemPath);
          }
        } catch (error) {
          // 跳过无法访问的文件
          continue;
        }
      }
    } catch (error) {
      // 目录不存在或无法访问
    }
    
    return files;
  }

  /**
   * 查找行号
   * @param {string} content - 文件内容
   * @param {RegExp} pattern - 匹配模式
   * @returns {Array} 行号列表
   */
  findLineNumbers(content, pattern) {
    const lines = content.split('\n');
    const lineNumbers = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        lineNumbers.push(i + 1);
      }
      pattern.lastIndex = 0;
    }
    
    return lineNumbers;
  }

  /**
   * 计算信任分数
   * @param {Object} summary - 统计信息
   * @returns {number} 信任分数 (0-100)
   */
  calculateTrustScore(summary) {
    if (summary.total === 0) {
      return 100;
    }

    // 计算扣分
    let deductions = 0;
    deductions += summary.high * 20;
    deductions += summary.medium * 10;
    deductions += summary.low * 2;

    // 计算基础分
    const baseScore = (summary.passed / summary.total) * 100;
    
    // 最终分数
    const score = Math.max(0, baseScore - deductions);
    
    return Math.round(score);
  }

  /**
   * 获取信任等级
   * @param {number} score - 信任分数
   * @returns {Object} 等级信息
   */
  getTrustLevel(score) {
    if (score >= 80) {
      return { level: 'safe', label: '安全', color: 'green' };
    } else if (score >= 60) {
      return { level: 'low-risk', label: '低风险', color: 'yellow' };
    } else {
      return { level: 'needs-review', label: '需要审查', color: 'red' };
    }
  }

  /**
   * 审计单个组件
   * @param {string} type - 组件类型
   * @param {string} name - 组件名称
   * @returns {Promise<Object>} 审计结果
   */
  async auditComponent(type, name) {
    const filePath = path.join(this.componentsDir, type, name);
    
    if (!await fs.pathExists(filePath)) {
      throw new Error(`组件不存在: ${type}/${name}`);
    }

    const findings = await this.auditFile(filePath);
    const high = findings.filter(f => f.severity === 'high').length;
    const medium = findings.filter(f => f.severity === 'medium').length;
    const low = findings.filter(f => f.severity === 'low').length;

    return {
      component: `${type}/${name}`,
      findings,
      summary: {
        high,
        medium,
        low,
        total: findings.length
      },
      trustScore: findings.length === 0 ? 100 : Math.max(0, 100 - (high * 20 + medium * 10 + low * 2))
    };
  }

  /**
   * 生成审计报告
   * @param {Object} results - 审计结果
   * @returns {string} 报告内容
   */
  generateReport(results) {
    const lines = [];
    const trustLevel = this.getTrustLevel(results.trustScore);

    lines.push('# 白鹿工作流安全审计报告');
    lines.push('');
    lines.push(`**审计时间**: ${results.timestamp}`);
    lines.push(`**信任分数**: ${results.trustScore}/100 (${trustLevel.label})`);
    lines.push('');
    lines.push('## 统计摘要');
    lines.push('');
    lines.push(`- 总组件数: ${results.summary.total}`);
    lines.push(`- 通过: ${results.summary.passed}`);
    lines.push(`- 高风险: ${results.summary.high}`);
    lines.push(`- 中风险: ${results.summary.medium}`);
    lines.push(`- 低风险: ${results.summary.low}`);
    lines.push('');

    // 详细发现
    for (const [type, component] of Object.entries(results.components)) {
      if (component.findings.length > 0) {
        lines.push(`## ${type}`);
        lines.push('');
        
        for (const finding of component.findings) {
          lines.push(`### ${finding.file}`);
          lines.push(`- **规则**: ${finding.ruleName}`);
          lines.push(`- **严重性**: ${finding.severity}`);
          lines.push(`- **描述**: ${finding.description}`);
          if (finding.lines) {
            lines.push(`- **行号**: ${finding.lines.join(', ')}`);
          }
          lines.push('');
        }
      }
    }

    return lines.join('\n');
  }
}

module.exports = AuditManager;
