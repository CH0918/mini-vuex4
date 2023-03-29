import { createStore } from '@/vuex';
export default createStore({
  // 开启严格模式，不允许用户直接修改state的值，必须通过commit修改
  strict: true,
  state: {
    count: 1,
  },
  getters: {
    doubleCount(state) {
      return state.count * 2;
    },
  },
  mutations: {
    add(state, payload) {
      state.count += payload;
    },
  },
  actions: {
    asyncAdd({ commit }, payload) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          commit('add', payload);
        });
        resolve();
      });
    },
  },
  modules: {
    aCount: {
      namespaced: true,
      state: {
        count: 1,
      },
      mutations: {
        add(state, payload) {
          state.count += payload;
        },
      },
    },
    bCount: {
      namespaced: true,
      state: {
        count: 1,
      },
      mutations: {
        add(state, payload) {
          state.count += payload;
        },
      },
      modules: {
        cCount: {
          namespaced: true,
          state: {
            count: 1,
          },
          mutations: {
            add(state, payload) {
              state.count += payload;
            },
          },
        },
      },
    },
  },
});
