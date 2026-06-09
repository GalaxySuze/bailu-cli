/**
 * @fileoverview src/v2/goal/paths.js 单元测试
 *
 * 覆盖：
 *  - getGoalDir / getGoalPaths 路径拼接
 *  - getRunnerHome 指向 ~/.bailu-goal
 *  - getRunnerPaths 包含所有约定字段
 *  - getLaunchdPaths 的 sha1 label 唯一性与确定性
 *  - 不同 cwd 产生不同 launchd label
 *  - getAssetsGoalDir 指向 assets/goal
 */

const path = require('path');
const os = require('os');

const {
  getGoalDir,
  getGoalPaths,
  getRunnerHome,
  getRunnerPaths,
  getLaunchdPaths,
  getAssetsGoalDir
} = require('../../src/v2/goal/paths');

describe('goal/paths getGoalDir', () => {
  test('默认用 process.cwd', () => {
    const result = getGoalDir();
    expect(result).toBe(path.join(process.cwd(), '.goal'));
  });

  test('传入自定义 cwd', () => {
    const result = getGoalDir('/tmp/my-proj');
    expect(result).toBe('/tmp/my-proj/.goal');
  });
});

describe('goal/paths getGoalPaths', () => {
  test('返回全部 7 个约定路径', () => {
    const p = getGoalPaths('/tmp/proj');
    const expectedKeys = [
      'dir',
      'current',
      'state',
      'progress',
      'blockers',
      'verification',
      'handoff',
      'snapshots'
    ];
    expect(Object.keys(p).sort()).toEqual(expectedKeys.sort());
  });

  test('所有路径以 .goal/ 为前缀', () => {
    const p = getGoalPaths('/tmp/proj');
    Object.values(p).forEach((v) => {
      expect(v).toContain('.goal');
    });
  });
});

describe('goal/paths getRunnerHome', () => {
  test('指向 ~/.bailu-goal', () => {
    expect(getRunnerHome()).toBe(path.join(os.homedir(), '.bailu-goal'));
  });
});

describe('goal/paths getRunnerPaths', () => {
  test('包含所有约定字段', () => {
    const p = getRunnerPaths();
    const expectedKeys = [
      'home',
      'runnerSh',
      'runnerLog',
      'lastClaudeOutput',
      'launchdOut',
      'launchdErr',
      'lock'
    ];
    expect(Object.keys(p).sort()).toEqual(expectedKeys.sort());
  });

  test('所有路径以 runner home 为前缀', () => {
    const p = getRunnerPaths();
    Object.values(p).forEach((v) => {
      expect(v.startsWith(getRunnerHome())).toBe(true);
    });
  });
});

describe('goal/paths getLaunchdPaths', () => {
  test('label 格式为 com.bailu.goal-runner.<8hex>', () => {
    const { label } = getLaunchdPaths('/tmp/proj');
    expect(label).toMatch(/^com\.bailu\.goal-runner\.[0-9a-f]{8}$/);
  });

  test('确定性：相同 cwd 产生相同 label', () => {
    const a = getLaunchdPaths('/tmp/proj');
    const b = getLaunchdPaths('/tmp/proj');
    expect(a.label).toBe(b.label);
  });

  test('不同 cwd 产生不同 label', () => {
    const a = getLaunchdPaths('/tmp/proj-a');
    const b = getLaunchdPaths('/tmp/proj-b');
    expect(a.label).not.toBe(b.label);
  });

  test('plistPath 在 ~/Library/LaunchAgents/ 下', () => {
    const { plistPath } = getLaunchdPaths('/tmp/proj');
    expect(plistPath).toContain('Library/LaunchAgents');
    expect(plistPath).toMatch(/\.plist$/);
  });
});

describe('goal/paths getAssetsGoalDir', () => {
  test('路径以 assets/goal 结尾', () => {
    const dir = getAssetsGoalDir();
    expect(dir).toMatch(/assets[/\\]goal$/);
  });
});
