/**
 * @fileoverview src/v2/goal/state.js 单元测试
 *
 * 覆盖：
 *  - STATUS 枚举完整性 & 不可变
 *  - STATUS_LABEL 与 STATUS 一一对应
 *  - createInitialState 默认值与可配置项
 *  - readState / writeState / patchState 在临时目录下的读写一致性
 *  - patchState 的合并语义与 updatedAt 自动刷新
 *  - readState 在 state.json 不存在 / 损坏时的行为
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const {
  STATUS,
  STATUS_LABEL,
  createInitialState,
  readState,
  writeState,
  patchState
} = require('../../src/v2/goal/state');

/**
 * 创建一个临时项目目录，并预先建好 .goal/
 * @returns {Promise<string>} 临时目录绝对路径
 */
async function makeTmpProject() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bailu-state-test-'));
  await fs.ensureDir(path.join(dir, '.goal'));
  return dir;
}

describe('goal/state STATUS 枚举', () => {
  test('包含所有 10 个状态', () => {
    const expected = [
      'INIT',
      'RUNNABLE',
      'RUNNING',
      'TOKEN_LOW',
      'CONTEXT_NEEDS_COMPACT',
      'BLOCKED',
      'VERIFYING',
      'REVIEW_NEEDED',
      'COMPLETED',
      'FAILED_NEEDS_HUMAN'
    ];
    expect(Object.keys(STATUS).sort()).toEqual(expected.sort());
  });

  test('每个状态值与 key 字符串一致（避免错位）', () => {
    Object.entries(STATUS).forEach(([key, value]) => {
      expect(value).toBe(key);
    });
  });

  test('STATUS 被 Object.freeze 锁定', () => {
    expect(() => {
      'use strict';
      STATUS.FOO = 'BAR';
    }).toThrow();
  });

  test('STATUS_LABEL 覆盖 STATUS 的全部 key', () => {
    Object.keys(STATUS).forEach((k) => {
      expect(STATUS_LABEL[k]).toEqual(expect.any(String));
      expect(STATUS_LABEL[k].length).toBeGreaterThan(0);
    });
  });
});

describe('goal/state createInitialState', () => {
  test('默认 agent 是 claude', () => {
    const s = createInitialState();
    expect(s.agent).toBe('claude');
  });

  test('可指定 agent', () => {
    const s = createInitialState({ agent: 'codex' });
    expect(s.agent).toBe('codex');
  });

  test('初始状态是 INIT，round 是 0，计数器为 0', () => {
    const s = createInitialState();
    expect(s.status).toBe(STATUS.INIT);
    expect(s.round).toBe(0);
    expect(s.consecutiveFailures).toBe(0);
    expect(s.lastStartedAt).toBeNull();
    expect(s.lastFinishedAt).toBeNull();
  });

  test('updatedAt 是合法 ISO 时间', () => {
    const s = createInitialState();
    expect(Number.isFinite(Date.parse(s.updatedAt))).toBe(true);
  });

  test('包含 schema 字段（前向兼容）', () => {
    const s = createInitialState();
    expect(s.$schema).toMatch(/goal-state/);
    expect(s.version).toBe(1);
  });
});

describe('goal/state read/write/patch', () => {
  /** @type {string} */
  let cwd;

  beforeEach(async () => {
    cwd = await makeTmpProject();
  });

  afterEach(async () => {
    await fs.remove(cwd);
  });

  test('readState 在文件不存在时返回 null', async () => {
    const got = await readState(cwd);
    expect(got).toBeNull();
  });

  test('readState 在 state.json 损坏时抛错', async () => {
    await fs.writeFile(path.join(cwd, '.goal', 'state.json'), '{ this is not json');
    await expect(readState(cwd)).rejects.toThrow(/解析失败/);
  });

  test('writeState 写入后 readState 能读回相同内容（updatedAt 除外）', async () => {
    const s = createInitialState();
    await writeState(s, cwd);
    const got = await readState(cwd);
    expect(got.status).toBe(s.status);
    expect(got.agent).toBe(s.agent);
    expect(got.round).toBe(s.round);
    // writeState 会刷 updatedAt，所以两者不一定全等
    expect(got.updatedAt).toEqual(expect.any(String));
  });

  test('writeState 每次都会刷新 updatedAt', async () => {
    const s = createInitialState();
    await writeState(s, cwd);
    const first = await readState(cwd);
    // 等 5ms 保证时间戳不同
    await new Promise((r) => setTimeout(r, 5));
    await writeState(s, cwd);
    const second = await readState(cwd);
    expect(Date.parse(second.updatedAt)).toBeGreaterThanOrEqual(
      Date.parse(first.updatedAt)
    );
  });

  test('patchState 合并而非覆盖', async () => {
    await writeState(createInitialState(), cwd);
    const next = await patchState({ status: STATUS.RUNNABLE, round: 3 }, cwd);

    expect(next.status).toBe(STATUS.RUNNABLE);
    expect(next.round).toBe(3);
    // 未变字段保留
    expect(next.agent).toBe('claude');
    expect(next.consecutiveFailures).toBe(0);
  });

  test('patchState 在 state.json 不存在时基于 createInitialState 兜底', async () => {
    const next = await patchState({ status: STATUS.BLOCKED }, cwd);
    expect(next.status).toBe(STATUS.BLOCKED);
    expect(next.agent).toBe('claude'); // 来自 createInitialState 默认
  });

  test('patchState 返回值与磁盘内容一致', async () => {
    await writeState(createInitialState(), cwd);
    const returned = await patchState({ notes: 'hello' }, cwd);
    const fromDisk = await readState(cwd);
    expect(fromDisk.notes).toBe(returned.notes);
    expect(fromDisk.updatedAt).toBe(returned.updatedAt);
  });
});
