/**
 * 凭据管理工具模块
 *
 * 职责：
 * 1. 从 ~/.bailu/auth.json 读取/写入 Base64 编码的 GitLab 凭据
 * 2. 生成临时 GIT_ASKPASS 脚本，让 git clone 从该脚本读取凭据
 *    （凭据不出现在任何 URL 或 git 日志中）
 * 3. 缺失凭据时交互式提示输入，并询问是否保存
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const readline = require('readline');

const BAILU_HOME = path.join(os.homedir(), '.bailu');
const AUTH_FILE = path.join(BAILU_HOME, 'auth.json');

/**
 * 从 auth.json 读取已保存的凭据
 * @returns {Promise<{username: string, password: string} | null>}
 */
async function loadCredentials() {
  if (!await fs.pathExists(AUTH_FILE)) {
    return null;
  }

  try {
    const data = await fs.readJson(AUTH_FILE);
    if (!data.username || !data.password) {
      return null;
    }
    // Base64 解码
    return {
      username: Buffer.from(data.username, 'base64').toString('utf8'),
      password: Buffer.from(data.password, 'base64').toString('utf8')
    };
  } catch {
    return null;
  }
}

/**
 * 将凭据 Base64 编码后保存到 auth.json
 * @param {string} username - GitLab 用户名
 * @param {string} password - GitLab 密码
 */
async function saveCredentials(username, password) {
  await fs.ensureDir(BAILU_HOME);
  await fs.writeJson(AUTH_FILE, {
    username: Buffer.from(username, 'utf8').toString('base64'),
    password: Buffer.from(password, 'utf8').toString('base64')
  }, { spaces: 2 });
  // 限制文件权限，仅当前用户可读（Unix 系统）
  if (process.platform !== 'win32') {
    await fs.chmod(AUTH_FILE, 0o600);
  }
}

/**
 * 从终端交互式读取一行输入
 * @param {string} prompt - 提示文字
 * @param {boolean} silent - 是否隐藏输入（用于密码）
 * @returns {Promise<string>}
 */
function readLine(prompt, silent = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: silent ? null : process.stdout,
      terminal: true
    });

    if (silent) {
      // 手动写提示，不通过 rl（避免 output:null 时报错）
      process.stdout.write(prompt);
      let input = '';

      // 关闭 stdin 的 echo
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }

      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const onData = (char) => {
        if (char === '\n' || char === '\r' || char === '') {
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          rl.close();
          resolve(input);
        } else if (char === '') {
          // 退格键
          input = input.slice(0, -1);
        } else {
          input += char;
        }
      };

      process.stdin.on('data', onData);
    } else {
      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    }
  });
}

/**
 * 交互式提示用户输入 GitLab 凭据
 * @returns {Promise<{username: string, password: string}>}
 */
async function promptCredentials() {
  console.log('');
  console.log('🔐 需要 GitLab 账号凭据来访问仓库');
  console.log('   （凭据仅用于 git clone，不会出现在日志中）');
  console.log('');

  const username = await readLine('   用户名: ');
  const password = await readLine('   密码:   ', true);

  return { username, password };
}

/**
 * 询问用户是否保存凭据
 * @returns {Promise<boolean>}
 */
async function askToSave() {
  const answer = await readLine('   是否保存凭据以便下次使用？(y/N): ');
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

/**
 * 获取凭据：优先读取已保存的，没有则交互提示
 * 如果是交互输入的，询问是否保存
 * @returns {Promise<{username: string, password: string}>}
 */
async function getCredentials() {
  const saved = await loadCredentials();
  if (saved) {
    return saved;
  }

  // 没有保存的凭据，提示输入
  const creds = await promptCredentials();

  const shouldSave = await askToSave();
  if (shouldSave) {
    await saveCredentials(creds.username, creds.password);
    console.log('   ✅ 凭据已保存到 ~/.bailu/auth.json');
  }
  console.log('');

  return creds;
}

/**
 * 创建临时 GIT_ASKPASS 脚本
 *
 * git 在需要认证时会调用 GIT_ASKPASS 指向的脚本，
 * 脚本根据 git 传入的提示文字（"Username" 或 "Password"）
 * 返回对应的值，整个过程凭据不出现在 URL 中。
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{scriptPath: string, cleanup: Function}>}
 *   scriptPath: 脚本路径（传给 GIT_ASKPASS 环境变量）
 *   cleanup: 调用后删除临时脚本
 */
async function createAskPassScript(username, password) {
  const tmpDir = os.tmpdir();
  const scriptName = `bailu-askpass-${Date.now()}`;

  let scriptPath;
  let scriptContent;

  if (process.platform === 'win32') {
    // Windows：生成 .bat 脚本
    scriptPath = path.join(tmpDir, `${scriptName}.bat`);
    scriptContent = [
      '@echo off',
      // git 传入的提示文字作为第一个参数 %1
      `echo %1 | findstr /i "username" >nul && echo ${username} && exit /b`,
      `echo ${password}`,
    ].join('\r\n');
  } else {
    // Unix/macOS：生成 shell 脚本
    // 用 case 匹配 git 的提示关键词（大小写不敏感）
    scriptPath = path.join(tmpDir, scriptName);
    scriptContent = [
      '#!/bin/sh',
      'case "$1" in',
      `  *[Uu]sername*) echo ${shellEscape(username)} ;;`,
      `  *[Pp]assword*) echo ${shellEscape(password)} ;;`,
      'esac',
    ].join('\n');
  }

  await fs.writeFile(scriptPath, scriptContent, { encoding: 'utf8', mode: 0o700 });

  const cleanup = async () => {
    await fs.remove(scriptPath).catch(() => {});
  };

  return { scriptPath, cleanup };
}

/**
 * 对 shell 单引号进行转义
 * 用于将变量安全地嵌入 shell 脚本（不使用双引号，避免展开）
 * @param {string} str
 * @returns {string}
 */
function shellEscape(str) {
  // 将字符串用单引号包裹，并对内部的单引号做 '\'' 转义
  return `'${str.replace(/'/g, "'\\''")}'`;
}

/**
 * 清除已保存的凭据
 */
async function clearCredentials() {
  if (await fs.pathExists(AUTH_FILE)) {
    await fs.remove(AUTH_FILE);
  }
}

module.exports = {
  loadCredentials,
  saveCredentials,
  promptCredentials,
  getCredentials,
  createAskPassScript,
  clearCredentials
};
