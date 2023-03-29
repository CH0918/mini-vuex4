import { reactive, watch } from 'vue';
import { storeKey } from './injectKey';
import ModuleCollection from './module/module-collection';
import { forEachValue, isPromise } from './utils';

function getNestedState(state, path) {
  return path.reduce((state, key) => state[key], state);
}
function installModule(store, rootState, path, module) {
  // 是否是根节点
  const isRoot = !path.length;
  // 获取命名空间
  // [bCount,cCount]
  const namespaced = store._modules.getNamespaced(path);
  if (!isRoot) {
    let parentState = path
      .slice(0, -1)
      .reduce((state, key) => state[key], rootState);
    parentState[path[path.length - 1]] = module.state;
  }
  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child);
  });

  module.forEachGetters((getter, key) => {
    store._wrapperGetter[namespaced + key] = () => {
      return getter(getNestedState(store.state, path));
    };
  });

  module.forEachMutations((mutation, key) => {
    const entry =
      store._mutations[namespaced + key] ||
      (store._mutations[namespaced + key] = []);
    entry.push((payload) => {
      mutation.call(store, getNestedState(store.state, path), payload);
    });
  });

  // action 执行完之后会返回一个promise
  module.forEachActions((action, key) => {
    const entry =
      store._actions[namespaced + key] ||
      (store._actions[namespaced + key] = []);
    entry.push((payload) => {
      const res = action.call(store, store, payload);
      if (!isPromise(res)) {
        return Promise.resolve(res);
      }
      return res;
    });
  });
}

function resetStoreModule(store, state) {
  store._state = reactive({ data: state });

  const wrapperGetters = store._wrapperGetter;
  store.getters = {};
  forEachValue(wrapperGetters, (getter, key) => {
    Object.defineProperty(store.getters, key, {
      get: getter,
    });
  });

  // 如果开启了严格模式，监控数据，数据变化的话取检测下store._commiting状态
  // 根据这个状态来判断mutation中的方法是同步还是异步
  // 之所以能这么做主要是利用了js是单线程的原理
  if (store.strict) {
    enableStrictMode(store);
  }
}

function enableStrictMode(store) {
  watch(
    () => store._state.data,
    () => {
      // 只有在mutation中提交更改的数据store._commiting才是true
      console.assert(
        store._commiting,
        '[vuex] do not mutate vuex store state outside mutation handler'
      );
    },
    { deep: true, flush: 'sync' }
  );
}
export default class Store {
  _withCommit(fn) {
    const originCommiting = this._commiting;
    this._commiting = true;
    fn();
    this._commiting = originCommiting;
  }
  constructor(options) {
    // {state, getters, mutations, actions, modules}
    // 格式化数据 变成一个树形结构：{root: {raw: {}, _children: {}, state:{}}
    const store = this;
    store._modules = new ModuleCollection(options);
    store._wrapperGetter = Object.create(null);
    store._mutations = Object.create(null);
    store._actions = Object.create(null);

    // 是否开启严格模式 默认是false  不允许直接修改状态，mutation不允许异步
    // 怎么知道是在mutation中代码是不是同步？还有怎么知道直接修改了数据不是通过mutation呢？
    // 在mutation之前添加一个状态，_commiting = true
    this._commiting = false;
    // 调用mutation -> 会更改状态，watch监控这个状态，如果当前状态变化的时候_commiting === true,则是同步更改
    // mutation调用之后把_commiting = false

    // 总结下就是：只有通过mutation更改数据的情况下,_commiting状态才是true，其他都是false，非法更改数据
    store.strict = options.strict || false;

    // 定义状态
    const state = store._modules.root.state;
    // 把树形结构中的_children里面的state全部拿出来放到root节点下面的state:{aCount: {count:1}, bCount: {count: 1, cCount: {count: 1}}}
    installModule(store, state, [], store._modules.root);

    // state放到store上
    resetStoreModule(store, state);
  }
  get state() {
    return this._state.data;
  }
  // 这里用箭头函数是因为用户在使用dispatch({commit}, payload)这样解构出来使用
  // 这样会导致commit方法内部的this指向发生变化
  commit = (type, payload) => {
    const entries = this._mutations[type] || [];
    this._withCommit(() => {
      entries.forEach((handle) => {
        handle(payload);
      });
    });
  };
  dispatch = (type, payload) => {
    const entries = this._actions[type] || [];
    return Promise.all(entries.map((handle) => handle(payload)));
  };
  install(app, injectKey) {
    // 兼容旧版本写法
    app.config.globalProperties.$store = this;
    app.provide(injectKey || storeKey, this);
  }

  // 格式化数据
  // root = {
  //   _raw: rootModule,
  //   state: rootModule.state,
  //   _children: {
  //     aCount: {
  //       _raw: aModule,
  //       state: aModule.state,
  //       _children: { },
  //     },
  //     bCount: {
  //       _raw: bModule,
  //       state: bModule.state,
  //       _children: {},
  //     },
  //   },
  // };
}
