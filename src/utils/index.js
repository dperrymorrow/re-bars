let counter = 1;

import Dom from "./dom.js";
import Msg from "../msg.js";

export default {
  dom: Dom,

  deleteOrphans(appId, compId) {
    const cStore = this.getStorage(appId, compId);
    const appStore = this.getStorage(appId);

    Object.keys(appStore.inst).forEach(cId => {
      if (!this.dom.findComponent(cId)) delete appStore.inst[cId];
    });
    Object.keys(cStore.renders).forEach(key => {
      if (!this.dom.findWatcher(key)) delete cStore.renders[key];
    });
  },

  bindAll(scope, collection) {
    return Object.entries(collection).reduce((bound, [name, method]) => {
      bound[name] = method.bind(scope);
      return bound;
    }, {});
  },

  debounce(callback, wait, immediate = false) {
    let timeout = null;

    return function() {
      const callNow = immediate && !timeout;
      const next = () => callback.apply(this, arguments);

      clearTimeout(timeout);
      timeout = setTimeout(next, wait);

      if (callNow) {
        next();
      }
    };
  },

  makeParams(args) {
    return args.map(param => {
      if (["[event]"].includes(param)) return param.replace("[", "").replace("]", "");
      if (param !== null && typeof param === "object")
        throw new Error(
          `component:${name} must only pass primitives as argument to a handler. \n${JSON.stringify(param, null, 2)}`
        );
      if (typeof param === "string") return `'${param}'`;
      if (param === null) return `${param}`;
      return param;
    });
  },

  getStorage(appId, cId) {
    return cId
      ? this.findByPath(window.ReBars, `apps.${appId}.inst.${cId}`)
      : this.findByPath(window.ReBars, `apps.${appId}`);
  },

  findByPath: (data, path) => {
    try {
      return path.split(".").reduce((pointer, seg) => pointer[seg], data);
    } catch (err) {
      Msg.fail("badPath", { path }, data);
    }
  },

  shouldRender(path, watch) {
    const watchPaths = Array.isArray(watch) ? watch : [watch];
    return watchPaths.some(watchPath => {
      if (path === watchPath || watchPath === ".*") return true;

      const pathSegs = path.split(".");
      const watchSegs = watchPath.split(".");

      return watchSegs.every((seg, index) => {
        if (seg === pathSegs[index] || seg === "*") return true;
        return false;
      });
    });
  },

  randomId: () => `rbs${counter++}`,

  setKey(obj, path, val) {
    const arr = path.split(".");
    arr.reduce((pointer, key, index) => {
      if (!(key in pointer)) Msg.fail("badPath", { path }, obj);
      if (index + 1 === arr.length) pointer[key] = val;
      return pointer[key];
    }, obj);
  },
};
