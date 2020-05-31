let counter = 1;

import Dom from "./dom.js";
import Msg from "../msg.js";

export default {
  dom: Dom,

  stringify(obj, indent = 2) {
    const parser = (key, val) => (typeof val === "function" ? val + "" : val);
    return JSON.stringify(obj, parser, indent);
  },

  debounce(callback, wait = 0, immediate = false) {
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

  isProp(target) {
    if (typeof target === "string" && target.startsWith("$props")) return true;
    else if (typeof target === "object" && target.ReBarsPath && target.ReBarsPath.startsWith("$props")) return true;
    return false;
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

  getKey(obj, path) {
    return path.split(".").reduce((pointer, key) => {
      if (!(key in pointer)) Msg.fail(`${path} was not found in object`, obj);
      return pointer[key];
    }, obj);
  },

  hasKey(obj, path) {
    // cannot traverse it if wildcards are used
    if (path.includes("*")) return true;
    try {
      this.getKey(obj, path);
      return true;
    } catch (err) {
      return false;
    }
  },

  setKey(obj, path, val) {
    const arr = path.split(".");
    arr.reduce((pointer, key, index) => {
      if (!(key in pointer)) Msg.fail(`${path} was not found in object!`, obj);
      if (index + 1 === arr.length) pointer[key] = val;
      return pointer[key];
    }, obj);
  },
};
