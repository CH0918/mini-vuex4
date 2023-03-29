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
      console.log(commit);
      setTimeout(() => {
        commit('add', payload);
      });
    },
  },
  modules: {},
});
