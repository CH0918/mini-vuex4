import { reactive } from 'vue';
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
  console.log('namespaced = ', namespaced);
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
}
export default class Store {
  constructor(options) {
    // {state, getters, mutations, actions, modules}
    // 格式化数据 变成一个树形结构：{root: {raw: {}, _children: {}, state:{}}
    const store = this;
    store._modules = new ModuleCollection(options);
    store._wrapperGetter = Object.create(null);
    store._mutations = Object.create(null);
    store._actions = Object.create(null);

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
    entries.forEach((handle) => {
      handle(payload);
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
