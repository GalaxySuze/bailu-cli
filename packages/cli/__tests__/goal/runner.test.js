/**
 * @fileoverview goal-runner.sh 决策表端到端测试
 *
 * 测试策略：
 *  - 不真的调用 Claude（设 BAILU_GOAL_DRY_RUN=1）
 *  - 用临时 BAILU_GOAL_HOME 隔离 runner 状态
 *  - 用临时项目目录隔离 .goal/
 *  - 对每个状态构造 state.json，跑 runner.sh，断言日志关键字
 *
 * 覆盖：
 *  - COMPLETED / BLOCKED / FAILED_NEEDS_HUMAN / TOKEN_LOW / CONTEXT_NEEDS_COMPACT 都立即退出
 *  - INIT / RUNNABLE / VERIFYING / REVIEW_NEEDED 都进入"准备调用 Claude"分支
 *  - RUNNING + lastStartedAt 缺失 → 自动恢复 RUNNABLE
 *  - RUNNING + lastStartedAt 超时 → 自动恢复 RUNNABLE
 *  - RUNNING + lastStartedAt 未超时 → 跳过本次
 *  - 未知状态 → 跳过本次
 *  - 陈旧锁能被清理（pid 不存在的锁）
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const RUNNER = path.resolve(
  __dirname,
  '..',
  '..',
  'assets',
  'goal',
  'goal-runner.sh'
);

/**
 * 跑一次 runner.sh
 * @returns {{stdout: string, stderr: string, status: number|null, output: string}}
 */
function runRunner({ projectDir, runnerHome, extra = {} }) {
  const env = {
    ...process.env,
    BAILU_GOAL_PROJECT: projectDir,
    BAILU_GOAL_HOME: runnerHome,
    BAILU_GOAL_DRY_RUN: '1',
    BAILU_GOAL_TIMEOUT: '30',
    CLAUDE_BIN: 'definitely-not-installed-binary-for-test',
    ...extra
  };
  const result = spawnSync('bash', [RUNNER], { env, encoding: 'utf8' });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status,
    output: (result.stdout || '') + (result.stderr || '')
  };
}

/**
 * 写一个最小可用的 state.json
 */
async function writeState(projectDir, patch = {}) {
  const file = path.join(projectDir, '.goal', 'state.json');
  await fs.ensureDir(path.dirname(file));
  const base = {
    version: 1,
    status: 'INIT',
    agent: 'claude',
    round: 0,
    lastStartedAt: null,
    lastFinishedAt: null,
    consecutiveFailures: 0,
    lastVerification: 'UNKNOWN',
    nextAction: 'continue_goal',
    notes: '',
    updatedAt: new Date().toISOString()
  };
  await fs.writeJson(file, { ...base, ...patch }, { spaces: 2 });
}

async function readState(projectDir) {
  return fs.readJson(path.join(projectDir, '.goal', 'state.json'));
}

describe('goal-runner.sh 决策表', () => {
  const created = [];

  async function mkSetup() {
    const project = await fs.mkdtemp(path.join(os.tmpdir(), 'bailu-runner-proj-'));
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'bailu-runner-home-'));
    created.push({ project, home });
    return { project, home };
  }

  afterAll(async () => {
    for (const { project, home } of created) {
      await fs.remove(project).catch(() => {});
      await fs.remove(home).catch(() => {});
    }
  });

  test('runner 文件存在且可执行', async () => {
    const st = await fs.stat(RUNNER);
    expect(st.isFile()).toBe(true);
    expect((st.mode & 0o100) !== 0).toBe(true);
  });

  test('BAILU_GOAL_PROJECT 未设置时报错并退出 1', () => {
    const result = spawnSync('bash', [RUNNER], {
      env: {
        ...process.env,
        BAILU_GOAL_PROJECT: '',
        BAILU_GOAL_HOME: '/tmp/nonexistent',
        BAILU_GOAL_DRY_RUN: '1'
      },
      encoding: 'utf8'
    });
    expect(result.status).toBe(1);
    const out = (result.stdout || '') + (result.stderr || '');
    expect(out).toMatch(/BAILU_GOAL_PROJECT/);
  });

  test('.goal/ 不存在时报错并退出 1', async () => {
    const { project, home } = await mkSetup();
    const r = runRunner({ projectDir: project, runnerHome: home });
    expect(r.status).toBe(1);
    expect(r.output).toMatch(/\.goal\/ 目录不存在/);
  });

  test('COMPLETED 立即退出 0，不进入 Claude 分支', async () => {
    const { project, home } = await mkSetup();
    await writeState(project, { status: 'COMPLETED' });
    const r = runRunner({ projectDir: project, runnerHome: home });
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/目标已完成/);
    expect(r.output).not.toMatch(/准备调用 Claude/);
  });

  test.each([
    ['BLOCKED', /BLOCKED/],
    ['FAILED_NEEDS_HUMAN', /FAILED_NEEDS_HUMAN/],
    ['TOKEN_LOW', /TOKEN_LOW/],
    ['CONTEXT_NEEDS_COMPACT', /CONTEXT_NEEDS_COMPACT/]
  ])('%s 立即跳过', async (status, pattern) => {
    const { project, home } = await mkSetup();
    await writeState(project, { status });
    const r = runRunner({ projectDir: project, runnerHome: home });
    expect(r.status).toBe(0);
    expect(r.output).toMatch(pattern);
    expect(r.output).not.toMatch(/准备调用 Claude/);
  });

  test.each(['INIT', 'RUNNABLE', 'VERIFYING', 'REVIEW_NEEDED'])(
    '%s 进入"准备调用 Claude"分支（DRY_RUN 不真执行）',
    async (status) => {
      const { project, home } = await mkSetup();
      await writeState(project, { status });
      const r = runRunner({ projectDir: project, runnerHome: home });
      expect(r.status).toBe(0);
      expect(r.output).toMatch(/准备调用 Claude/);
      expect(r.output).toMatch(/DRY_RUN/);
    }
  );

  test('未知状态跳过', async () => {
    const { project, home } = await mkSetup();
    await writeState(project, { status: 'BANANA' });
    const r = runRunner({ projectDir: project, runnerHome: home });
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/未知状态/);
  });
});

describe('goal-runner.sh RUNNING stale 自动恢复', () => {
  const created = [];
  async function mkSetup() {
    const project = await fs.mkdtemp(path.join(os.tmpdir(), 'bailu-runner-stale-'));
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'bailu-runner-home-'));
    created.push({ project, home });
    return { project, home };
  }
  afterAll(async () => {
    for (const { project, home } of created) {
      await fs.remove(project).catch(() => {});
      await fs.remove(home).catch(() => {});
    }
  });

  async function writeRunning(project, lastStartedAt) {
    await writeState(project, { status: 'RUNNING', lastStartedAt });
  }

  test('RUNNING + lastStartedAt 缺失 → 恢复 RUNNABLE', async () => {
    const { project, home } = await mkSetup();
    await writeRunning(project, null);
    const r = runRunner({ projectDir: project, runnerHome: home });
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/RUNNING stale.*lastStartedAt 缺失/);
    const after = await readState(project);
    expect(after.status).toBe('RUNNABLE');
    expect(after.notes).toMatch(/自动恢复/);
  });

  test('RUNNING + lastStartedAt 超过 timeout*2 → 恢复 RUNNABLE', async () => {
    const { project, home } = await mkSetup();
    // timeout=30, 阈值=60s, 这里设 2 小时前
    const twoHoursAgo = new Date(Date.now() - 7200 * 1000).toISOString();
    await writeRunning(project, twoHoursAgo);
    const r = runRunner({ projectDir: project, runnerHome: home });
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/RUNNING 已持续.*阈值/);
    const after = await readState(project);
    expect(after.status).toBe('RUNNABLE');
  });

  test('RUNNING + lastStartedAt 未超时 → 跳过本次（保持 RUNNING）', async () => {
    const { project, home } = await mkSetup();
    const fiveSecondsAgo = new Date(Date.now() - 5 * 1000).toISOString();
    await writeRunning(project, fiveSecondsAgo);
    const r = runRunner({ projectDir: project, runnerHome: home });
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/未达 stale 阈值/);
    expect(r.output).not.toMatch(/准备调用 Claude/);
    const after = await readState(project);
    expect(after.status).toBe('RUNNING');
  });
});

describe('goal-runner.sh 锁文件', () => {
  const created = [];
  async function mkSetup() {
    const project = await fs.mkdtemp(path.join(os.tmpdir(), 'bailu-runner-lock-'));
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'bailu-runner-home-'));
    created.push({ project, home });
    return { project, home };
  }
  afterAll(async () => {
    for (const { project, home } of created) {
      await fs.remove(project).catch(() => {});
      await fs.remove(home).catch(() => {});
    }
  });

  test('陈旧锁（pid 已死）应被清理并继续执行', async () => {
    const { project, home } = await mkSetup();
    await writeState(project, { status: 'INIT' });

    // 提前造一个 lock 目录，pid 写成肯定不存在的进程号
    const lockDir = path.join(home, 'goal-runner.lock');
    await fs.ensureDir(lockDir);
    await fs.writeFile(path.join(lockDir, 'pid'), '999999');

    const r = runRunner({ projectDir: project, runnerHome: home });
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/检测到陈旧锁/);
    expect(r.output).toMatch(/准备调用 Claude/);
  });

  test('活锁（pid 仍存活）应跳过本次唤醒', async () => {
    const { project, home } = await mkSetup();
    await writeState(project, { status: 'INIT' });

    // 用当前进程 PID（一定存活）占锁
    const lockDir = path.join(home, 'goal-runner.lock');
    await fs.ensureDir(lockDir);
    await fs.writeFile(path.join(lockDir, 'pid'), String(process.pid));

    const r = runRunner({ projectDir: project, runnerHome: home });
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/SKIP.*已有 runner/);
    expect(r.output).not.toMatch(/准备调用 Claude/);
  });
});