/**
 * gradient-string 兼容性包装器
 *
 * gradient-string v3.x 是 ESM-only 模块，无法在 CommonJS 中直接 require()
 * 此模块通过异步动态 import() 加载 ESM 模块，并导出兼容的同步代理对象
 *
 * 使用方式（与原来完全一致）：
 *   const gradient = require('../utils/gradient');
 *   console.log(gradient.pastel('Hello'));
 *   console.log(gradient.pastel.multiline(banner));
 */

/**
 * 创建 gradient-string 方法的代理
 * 将异步方法包装为同步调用，同时支持 .multiline 链式调用
 *
 * @returns {object} 代理对象，支持 .pastel(), .cristal() 等所有 gradient-string 方法
 */
function createGradientProxy() {
  const state = { _instance: null };

  return new Proxy(state, {
    get(target, prop) {
      // 排除内部属性
      if (prop === '_instance') return target._instance;

      /**
       * 返回一个同时可调用和可访问 .multiline 的函数
       */
      const fn = (...args) => {
        if (!target._instance) {
          // 如果还未加载完成，返回纯文本作为降级方案
          return args.join(' ');
        }
        const method = target._instance[prop];
        if (typeof method === 'function') {
          return method(...args);
        }
        return args.join(' ');
      };

      /**
       * 支持 gradient.pastel.multiline(text) 这种链式调用
       */
      fn.multiline = (...args) => {
        if (!target._instance) {
          return args.join('\n');
        }
        const gradientFn = target._instance[prop];
        if (gradientFn && typeof gradientFn.multiline === 'function') {
          return gradientFn.multiline(...args);
        }
        return args.join('\n');
      };

      return fn;
    }
  });
}

const gradient = createGradientProxy();

/**
 * 异步初始化：动态 import gradient-string ESM 模块
 * 加载完成后自动替换代理的内部实例
 */
import('gradient-string').then(module => {
  gradient._instance = module.default || module;
}).catch(() => {
  // 加载失败时保持降级模式（返回纯文本）
});

module.exports = gradient;
