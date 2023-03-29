<template>
  <div class="wrap">
    count: {{ count }}

    doubleCount: {{ doubleCount }}
    <hr />
    同步改变值：
    <button @click="add">同步改变+1</button>
    <hr />
    异步改变值：
    <button @click="asyncAdd">异步改变+1</button>
    <hr />
    a模块：count： {{ aCount }}
    <button @click="$store.commit('aCount/add', 1)">改a</button>
    <hr />
    b模块：count：{{ bCount }}
    <button @click="$store.commit('bCount/add', 1)">改b</button>
    <hr />
    b模块下的c： {{ cCount }}
    <button @click="$store.commit('bCount/cCount/add', 1)">改c</button>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from '@/vuex';
export default {
  name: 'App',
  setup() {
    const store = useStore();
    const add = () => {
      store.commit('add', 1);
    };
    const asyncAdd = () => {
      store.dispatch('asyncAdd', 1).then(() => {});
    };
    return {
      count: computed(() => store.state.count),
      doubleCount: computed(() => store.getters.doubleCount),
      add,
      asyncAdd,
      aCount: computed(() => store.state.aCount.count),
      bCount: computed(() => store.state.bCount.count),
      cCount: computed(() => store.state.bCount.cCount.count),
    };
  },
};
</script>

<style></style>
