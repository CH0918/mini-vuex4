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
  </div>
</template>

<script>
import { computed } from 'vue';
import { useStore } from '@/vuex';
export default {
  name: 'App',
  setup() {
    const store = useStore();
    console.log('============', store);
    const add = () => {
      store.commit('add', 1);
    };
    const asyncAdd = () => {
      store.dispatch('asyncAdd', 1);
    };
    return {
      count: computed(() => store.state.count),
      doubleCount: computed(() => store.getters.doubleCount),
      add,
      asyncAdd,
    };
  },
};
</script>

<style></style>
