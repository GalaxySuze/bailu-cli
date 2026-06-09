/**
 * @fileoverview src/v2/commands/goal/launchd.js · escapeXml 单元测试
 *
 * escapeXml 是渲染 plist 模板的关键防线，必须覆盖 XML 五个特殊字符。
 * 一旦失守，路径里只要带 & < > " ' 任意一个，plutil -lint 就会挂。
 */

const { escapeXml } = require('../../src/v2/commands/goal/launchd');

describe('launchd escapeXml', () => {
  test('转义 & < > " \'', () => {
    expect(escapeXml('a & b')).toBe('a &amp; b');
    expect(escapeXml('a < b')).toBe('a &lt; b');
    expect(escapeXml('a > b')).toBe('a &gt; b');
    expect(escapeXml('a " b')).toBe('a &quot; b');
    expect(escapeXml("a ' b")).toBe('a &apos; b');
  });

  test('普通字符串不变', () => {
    expect(escapeXml('/Users/me/projects/foo')).toBe('/Users/me/projects/foo');
  });

  test('空字符串保留为空', () => {
    expect(escapeXml('')).toBe('');
  });

  test('& 必须先转义，避免 &lt; 被二次转义成 &amp;lt;', () => {
    // 错误顺序：先转 < 再转 & 会得到 &amp;lt;
    // 正确顺序：先转 & 再转 < 会得到 &amp; &lt;
    const result = escapeXml('<&>');
    expect(result).toBe('&lt;&amp;&gt;');
    // 关键回归：&amp;lt; 是错误结果
    expect(result).not.toContain('&amp;lt;');
  });

  test('非字符串输入会被 String 转换', () => {
    expect(escapeXml(123)).toBe('123');
    expect(escapeXml(null)).toBe('null');
    expect(escapeXml(undefined)).toBe('undefined');
  });

  test('真实路径场景：含空格的目录', () => {
    expect(escapeXml('/Users/me/with space/runner.sh')).toBe(
      '/Users/me/with space/runner.sh'
    );
  });

  test('真实路径场景：含 & 的目录（典型 plist 崩盘场景）', () => {
    expect(escapeXml('/Users/me/projects/foo & bar')).toBe(
      '/Users/me/projects/foo &amp; bar'
    );
  });
});
