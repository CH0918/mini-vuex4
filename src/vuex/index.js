import { provide, inject, reactive } from 'vue';

export function forEachValue(obj, fn) {
  Object.keys(obj).forEach((key) => fn(obj[key], key));
}

export function createStore(options) {
  return new Store(options);
}
const storeKey = 'store';
export function useStore(injectKey = storeKey) {
  // useStore 返回一个store
  // store里面有state getters...
  return inject(injectKey);
}
export class Store {
  constructor(options) {
    // options: state getters mutations actions modules
    const store = this;
    store._state = reactive({ data: options.state });

    // 处理getters
    const _getters = options.getters;
    store.getters = {};
    forEachValue(_getters, (fn, key) => {
      Object.defineProperty(store.getters, key, {
        get: () => fn(store.state),
      });
    });

    // 处理mutations   mutations: {add(payload) {}}
    // 使用：commit('mutationKey', payload)
    const _mutations = options.mutations;
    store._mutations = Object.create(null);
    forEachValue(_mutations, (mutation, key) => {
      store._mutations[key] = (payload) => {
        mutation.call(store, store.state, payload);
      };
    });

    // 处理actions actions: {asyncAdd({commit}, payload) => {}}
    // 使用：dispatch('actionsKey', payload)
    const _actions = options.actions;
    store._actions = Object.create(null);
    forEachValue(_actions, (action, key) => {
      store._actions[key] = (payload) => {
        action.call(store, store, payload);
      };
    });
  }
  get state() {
    return this._state.data;
  }
  // 这里用箭头函数是因为用户在使用dispatch({commit}, payload)这样解构出来使用
  // 这样会导致commit方法内部的this指向发生变化
  commit = (type, payload) => {
    this._mutations[type](payload);
  };
  dispatch = (type, payload) => {
    this._actions[type](payload);
  };
  install(app, injectKey) {
    // 兼容旧版本写法
    app.config.globalProperties.$store = this;
    app.provide(injectKey || storeKey, this);
  }
}
