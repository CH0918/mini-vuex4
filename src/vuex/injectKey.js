import { inject } from 'vue';
export const storeKey = 'store';
export function useStore(injectKey = storeKey) {
  // useStore 返回一个store
  // store里面有state getters...
  return inject(injectKey);
}
