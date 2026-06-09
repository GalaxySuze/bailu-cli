/**
 * @fileoverview bailu goal init 端到端测试
 *
 * 覆盖：
 *  - init 后 .goal/ 目录与 6 个约定文件都存在
 *  - state.json 是合法 JSON 且 status 是 INIT
 *  - 模板文件非空且内容看起来是模板（含中文注释引导）
 *  - 不会动 .gitignore（关键不变量）
 *  - 已存在时默认保留（不传 yes 时 confirm 默认 false 会被走到，
 *    为避免在测试里真起 prompt，这里只测 --yes 强制覆盖路径）
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const { runGoalInit } = require('../../src/v2/commands/goal/init');

/**
 * 在临时目录里跑 init
 * @param {Object} [options]
 * @returns {Promise<string>} 临时目录路径
 */
async function runInTmpDir(options = { yes: true }) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bailu-init-test-'));
  const originalCwd = process.cwd();
  process.chdir(dir);
  try {
    // 静默 console，init 会打很多 chalk 输出
    const noop = () => {};
    const origLog = console.log;
    console.log = noop;
    try {
      await runGoalInit(options);
    } finally {
      console.log = origLog;
    }
  } finally {
    process.chdir(originalCwd);
  }
  return dir;
}

describe('goal init 端到端', () => {
  /** @type {string[]} 用于 afterAll 清理 */
  const created = [];

  afterAll(async () => {
    for (const d of created) {
      await fs.remove(d).catch(() => {});
    }
  });

  test('init 后 .goal/ 与 6 个约定文件全部存在', async () => {
    const dir = await runInTmpDir();
    created.push(dir);

    const goalDir = path.join(dir, '.goal');
    expect(await fs.pathExists(goalDir)).toBe(true);

    const expected = [
      'current.md',
      'progress.md',
      'blockers.md',
      'verification.log',
      'handoff.md',
      'state.json'
    ];
    for (const f of expected) {
      const p = path.join(goalDir, f);
      expect(await fs.pathExists(p)).toBe(true);
    }
  });

  test('init 后 snapshots/ 子目录存在（供未来快照用）', async () => {
    const dir = await runInTmpDir();
    created.push(dir);
    expect(await fs.pathExists(path.join(dir, '.goal', 'snapshots'))).toBe(true);
  });

  test('state.json 是合法 JSON 且 status=INIT', async () => {
    const dir = await runInTmpDir();
    created.push(dir);
    const state = await fs.readJson(path.join(dir, '.goal', 'state.json'));
    expect(state.status).toBe('INIT');
    expect(state.agent).toBe('claude');
    expect(state.round).toBe(0);
    expect(state.lastStartedAt).toBeNull();
    expect(Number.isFinite(Date.parse(state.updatedAt))).toBe(true);
  });

  test('current.md 是模板（含中文注释引导，且非空）', async () => {
    const dir = await runInTmpDir();
    created.push(dir);
    const content = await fs.readFile(path.join(dir, '.goal', 'current.md'), 'utf8');
    expect(content.length).toBeGreaterThan(0);
    // 模板应有 HTML 注释作为填写引导
    expect(content).toMatch(/<!--[\s\S]*-->/);
  });

  test('progress.md / blockers.md / handoff.md 至少都非空', async () => {
    const dir = await runInTmpDir();
    created.push(dir);
    for (const f of ['progress.md', 'blockers.md', 'handoff.md']) {
      const content = await fs.readFile(path.join(dir, '.goal', f), 'utf8');
      expect(content.length).toBeGreaterThan(0);
    }
  });

  test('init 不会创建或修改 .gitignore（不变量）', async () => {
    const dir = await runInTmpDir();
    created.push(dir);
    expect(await fs.pathExists(path.join(dir, '.gitignore'))).toBe(false);
  });

  test('init 两次（第二次 force=true）会重新写入 state.json', async () => {
    const dir = await runInTmpDir();
    created.push(dir);
    const statePath = path.join(dir, '.goal', 'state.json');

    // 把状态手动改成 RUNNABLE
    const s = await fs.readJson(statePath);
    s.status = 'RUNNABLE';
    s.round = 99;
    await fs.writeJson(statePath, s);

    // 再 init 一次，force 覆盖
    const originalCwd = process.cwd();
    process.chdir(dir);
    try {
      const noop = () => {};
      const origLog = console.log;
      console.log = noop;
      try {
        await runGoalInit({ force: true });
      } finally {
        console.log = origLog;
      }
    } finally {
      process.chdir(originalCwd);
    }

    const after = await fs.readJson(statePath);
    expect(after.status).toBe('INIT');
    expect(after.round).toBe(0);
  });
});
