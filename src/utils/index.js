let counter = 1;

import Dom from "./dom.js";
// import Msg from "../msg.js";

export default {
  dom: Dom,

  // stringify(obj, indent = 2) {
  //   const parser = (key, val) => (typeof val === "function" ? val + "" : val);
  //   return JSON.stringify(obj, parser, indent);
  // },

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

  intersects: (obj1, obj2) => Object.keys(obj2).filter(key => key in obj1),

  registerHelpers(instance, helpers) {
    Object.entries(helpers).forEach(([name, fn]) => instance.registerHelper(name, fn));
  },

  registerPartials(instance, scope, partials) {
    Object.entries(partials).forEach(([name, partial]) => {
      instance.registerPartial(name, partial.template);

      ["methods", "partials", "data"].forEach(key => {
        if (!(key in partial)) return;
        const collide = this.intersects(scope[key], partial[key]);
        if (collide.length) instance.log(2, `ReBars: partial ${name} has conflicting ${key} keys`, collide);
      });

      if (partial.data) Object.assign(partial.data, scope.data);
      if (partial.methods) Object.assign(scope.methods, partial.methods);
      if (partial.helpers) this.registerHelpers(instance, partial.helpers);
    });
  },

  bind(obj, scope, ...args) {
    return Object.keys(obj).reduce(
      (bound, key) => {
        bound[key] = bound[key].bind(scope, ...args);
        return bound;
      },
      { ...obj }
    );
  },

  shouldRender(path, watchPaths) {
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

  // getKey(obj, path) {
  //   return path.split(".").reduce((pointer, key) => {
  //     if (!(key in pointer)) Msg.fail(`${path} was not found in object`, obj);
  //     return pointer[key];
  //   }, obj);
  // },
  //
  // hasKey(obj, path) {
  //   // cannot traverse it if wildcards are used
  //   if (path.includes("*")) return true;
  //   try {
  //     this.getKey(obj, path);
  //     return true;
  //   } catch (err) {
  //     return false;
  //   }
  // },
  //
  // setKey(obj, path, val) {
  //   const arr = path.split(".");
  //   arr.reduce((pointer, key, index) => {
  //     if (!(key in pointer)) Msg.fail(`${path} was not found in object!`, obj);
  //     if (index + 1 === arr.length) pointer[key] = val;
  //     return pointer[key];
  //   }, obj);
  // },
};
