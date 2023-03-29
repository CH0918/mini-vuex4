import { createStore } from '@/vuex';
export default createStore({
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
          console.log('payload====', payload);
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
