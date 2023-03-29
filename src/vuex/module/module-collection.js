import Module from './module';
import { forEachValue } from '../utils';
export default class ModuleCollection {
  constructor(rootModule) {
    this.root = null;
    this.register(rootModule, []);
  }
  register(rawModule, path) {
    console.log('path= ', path);
    const newModule = new Module(rawModule);
    if (path.length === 0) {
      this.root = newModule;
    } else {
      // 将子模块添加到父模块中
      const parent = path.slice(0, -1).reduce((module, key) => {
        return module.getChild(key);
      }, this.root);
      parent.addChild(path[path.length - 1], newModule);
    }

    if (rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(rawChildModule, path.concat(key));
      });
    }
  }
}
