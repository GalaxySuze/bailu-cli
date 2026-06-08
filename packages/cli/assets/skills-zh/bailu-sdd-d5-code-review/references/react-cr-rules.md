# React / TypeScript Code Review 规范

## 命名规范

- 组件名：大驼峰（OrderListPage）
- 函数/变量：小驼峰（getOrderList）
- 常量：全大写下划线（MAX_PAGE_SIZE）
- 自定义 Hook：use 前缀（useOrderList）
- 事件处理函数：handle 前缀（handleExportClick）
- 文件名与组件名一致（OrderListPage.tsx）

## 组件设计

- 单个组件不超过 200 行，超出应拆分子组件
- 组件只做 UI 渲染和用户交互，业务逻辑抽到自定义 Hook 或 Service 层
- props 必须有 TypeScript 类型定义，不使用 any
- 纯展示组件使用 React.memo 包裹，防止无效重渲染

## Hooks 规范

- 不在条件语句、循环或嵌套函数中调用 Hook
- useEffect 的依赖数组必须完整，不允许 // eslint-disable-next-line
- useEffect 有副作用（订阅、定时器）必须返回清理函数
- 复杂状态逻辑使用 useReducer 替代多个 useState

## 状态管理

- 组件内部状态用 useState，跨组件状态用全局状态管理（Redux/Zustand/Context）
- 不在组件中直接修改 state，必须通过 setState
- 异步状态（loading/error/data）统一管理，不分散在多个 useState

## 异步处理

- 所有 async/await 必须有 try-catch 处理错误
- 接口请求必须有 loading 状态和错误提示
- 组件卸载后不再执行异步回调（使用 AbortController 或 isMounted 标志）

## 性能

- 列表渲染必须有唯一稳定的 key，不使用数组 index 作为 key（除非列表不会变化）
- 大列表使用虚拟列表（react-virtual/react-window）
- 避免在 render 中定义新对象/函数，使用 useMemo/useCallback
- 图片使用懒加载，路由使用 React.lazy + Suspense

## 安全

- 禁止使用 dangerouslySetInnerHTML，若必须使用必须对内容做 DOMPurify 过滤
- 不在前端存储敏感信息（token 存 httpOnly cookie，不存 localStorage）
- 外部链接使用 target="_blank" 时必须加 rel="noopener noreferrer"

## 可维护性

- 删除 console.log、注释掉的代码
- 魔法字符串/数字定义为常量或枚举
- 接口请求封装到统一的 API 层，不在组件中直接调用 axios/fetch
- 样式使用 CSS Modules 或 styled-components，不内联大量样式对象
