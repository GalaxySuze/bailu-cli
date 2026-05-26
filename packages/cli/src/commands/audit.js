/**
 * 安全审计命令
 */

const chalk = require('chalk');
const Table = require('cli-table3');
const boxen = require('boxen');
const AuditManager = require('../audit/manager');

const manager = new AuditManager();

/**
 * 执行完整审计
 */
async function audit() {
  console.log('');
  console.log(chalk.cyan('🦌 白鹿工作流 - 安全审计'));
  console.log('');

  try {
    const results = await manager.audit();
    const trustLevel = manager.getTrustLevel(results.trustScore);

    // 显示信任分数
    const scoreColor = trustLevel.color === 'green' ? chalk.green :
                       trustLevel.color === 'yellow' ? chalk.yellow :
                       chalk.red;

    const scoreBox = boxen(
      chalk.white(`信任分数: ${scoreColor(results.trustScore)}/100`) + '\n' +
      chalk.white(`等级: ${scoreColor(trustLevel.label)}`),
      {
        padding: { top: 0, bottom: 0, left: 2, right: 2 },
        margin: { top: 0, bottom: 1, left: 0, right: 0 },
        borderStyle: 'round',
        borderColor: trustLevel.color
      }
    );

    console.log(scoreBox);

    // 显示统计摘要
    console.log(chalk.yellow.bold('📊 统计摘要'));
    console.log('');
    console.log(chalk.white(`  总组件数: ${results.summary.total}`));
    console.log(chalk.green(`  通过: ${results.summary.passed}`));
    console.log(chalk.red(`  高风险: ${results.summary.high}`));
    console.log(chalk.yellow(`  中风险: ${results.summary.medium}`));
    console.log(chalk.gray(`  低风险: ${results.summary.low}`));
    console.log('');

    // 显示详细发现
    if (results.summary.high > 0 || results.summary.medium > 0) {
      console.log(chalk.yellow.bold('⚠️  发现问题'));
      console.log('');

      for (const [type, component] of Object.entries(results.components)) {
        if (component.findings.length > 0) {
          console.log(chalk.white.bold(`${type}:`));
          
          const table = new Table({
            head: [
              chalk.cyan('文件'),
              chalk.cyan('规则'),
              chalk.cyan('严重性'),
              chalk.cyan('行号')
            ],
            style: { head: [], border: ['gray'] },
            chars: {
              'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
              'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
              'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
              'right': '│', 'right-mid': '┤'
            }
          });

          for (const finding of component.findings) {
            const severityColor = finding.severity === 'high' ? chalk.red :
                                  finding.severity === 'medium' ? chalk.yellow :
                                  chalk.gray;

            table.push([
              chalk.gray(finding.file),
              chalk.white(finding.ruleName),
              severityColor(finding.severity),
              chalk.gray(finding.lines ? finding.lines.join(', ') : '-')
            ]);
          }

          console.log(table.toString());
          console.log('');
        }
      }
    } else {
      console.log(chalk.green('✅ 未发现安全问题'));
      console.log('');
    }

  } catch (error) {
    console.error(chalk.red(`❌ 审计失败: ${error.message}`));
  }
}

/**
 * 审计单个组件
 * @param {string} type - 组件类型
 * @param {string} name - 组件名称
 */
async function auditComponent(type, name) {
  console.log('');
  console.log(chalk.cyan(`🦌 审计组件: ${type}/${name}`));
  console.log('');

  try {
    const result = await manager.auditComponent(type, name);
    const trustLevel = manager.getTrustLevel(result.trustScore);

    console.log(chalk.white(`信任分数: ${result.trustScore}/100 (${trustLevel.label})`));
    console.log('');

    if (result.findings.length === 0) {
      console.log(chalk.green('✅ 未发现安全问题'));
    } else {
      console.log(chalk.yellow.bold('⚠️  发现问题:'));
      console.log('');

      for (const finding of result.findings) {
        const severityColor = finding.severity === 'high' ? chalk.red :
                              finding.severity === 'medium' ? chalk.yellow :
                              chalk.gray;

        console.log(chalk.white(`  ${finding.ruleName}`));
        console.log(chalk.gray(`    严重性: ${severityColor(finding.severity)}`));
        console.log(chalk.gray(`    描述: ${finding.description}`));
        if (finding.lines) {
          console.log(chalk.gray(`    行号: ${finding.lines.join(', ')}`));
        }
        console.log('');
      }
    }
  } catch (error) {
    console.error(chalk.red(`❌ 审计失败: ${error.message}`));
  }
}

module.exports = { audit, auditComponent };
