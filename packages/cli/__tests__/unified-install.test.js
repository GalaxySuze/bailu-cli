/**
 * unified-install.js 测试用例
 *
 * 测试统一安装命令的核心功能：
 * 1. 参数解析（resolveTargets）
 * 2. 工作流自动拉取逻辑
 * 3. 安装流程
 */

const { resolveTargets, identifyArg } = require('../src/commands/unified-install');

// 模拟 getAllTools
jest.mock('../src/config/tools', () => ({
  getAllTools: () => ({
    claude: { name: 'Claude', emoji: '🤖', getUserDir: () => '/tmp/claude' },
    codex: { name: 'Codex', emoji: '🔧', getUserDir: () => '/tmp/codex' },
    trae: { name: 'Trae', emoji: '🚀', getUserDir: () => '/tmp/trae' },
    qoder: { name: 'Qoder', emoji: '🎯', getUserDir: () => '/tmp/qoder' },
    hanako: { name: 'Hanako', emoji: '🦌', getUserDir: () => '/tmp/hanako' }
  }),
  getInstalledToolKeys: () => ['claude', 'codex']
}));

describe('unified-install', () => {
  describe('identifyArg', () => {
    test('应识别已知工作流名称', () => {
      expect(identifyArg('dev')).toBe('workflow');
      expect(identifyArg('base')).toBe('workflow');
      expect(identifyArg('ops')).toBe('workflow');
    });

    test('应识别已知工具名称', () => {
      expect(identifyArg('claude')).toBe('tool');
      expect(identifyArg('codex')).toBe('tool');
      expect(identifyArg('trae')).toBe('tool');
      expect(identifyArg('qoder')).toBe('tool');
      expect(identifyArg('hanako')).toBe('tool');
    });

    test('应将未知参数标记为 unknown', () => {
      expect(identifyArg('unknown')).toBe('unknown');
      expect(identifyArg('myworkflow')).toBe('unknown');
    });
  });

  describe('resolveTargets', () => {
    test('无参数时应返回 null（表示所有）', () => {
      const result = resolveTargets(undefined, undefined, {});
      expect(result.workflows).toBeNull();
      expect(result.tools).toBeNull();
    });

    test('单个工作流参数应返回该工作流', () => {
      const result = resolveTargets('dev', undefined, {});
      expect(result.workflows).toEqual(['dev']);
      expect(result.tools).toBeNull();
    });

    test('单个工具参数应返回该工具', () => {
      const result = resolveTargets('codex', undefined, {});
      expect(result.workflows).toBeNull();
      expect(result.tools).toEqual(['codex']);
    });

    test('工作流和工具参数应正确解析', () => {
      const result = resolveTargets('dev', 'codex', {});
      expect(result.workflows).toEqual(['dev']);
      expect(result.tools).toEqual(['codex']);
    });

    test('工具和工作流参数顺序相反时应正确解析', () => {
      const result = resolveTargets('codex', 'dev', {});
      expect(result.workflows).toEqual(['dev']);
      expect(result.tools).toEqual(['codex']);
    });

    test('--agent 选项应覆盖工具参数', () => {
      const result = resolveTargets('dev', undefined, { agent: 'codex' });
      expect(result.workflows).toEqual(['dev']);
      expect(result.tools).toEqual(['codex']);
    });

    test('--to 选项应覆盖工具参数', () => {
      const result = resolveTargets('dev', undefined, { to: 'codex' });
      expect(result.workflows).toEqual(['dev']);
      expect(result.tools).toEqual(['codex']);
    });

    test('--agent 选项应覆盖第二个位置参数', () => {
      const result = resolveTargets('dev', 'trae', { agent: 'codex' });
      expect(result.workflows).toEqual(['dev']);
      expect(result.tools).toEqual(['codex']);
    });
  });
});
