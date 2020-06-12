let counter = 1;

import Dom from "./dom.js";

export default {
  dom: Dom,

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

  nextTick() {
    return new Promise(resolve => {
      setTimeout(resolve, 0);
    });
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

      if (partial.data) Object.assign(scope.data, partial.data);
      if (partial.methods) Object.assign(scope.methods, partial.methods);
      if (partial.helpers) this.registerHelpers(instance, partial.helpers);
    });
  },

  bind(obj, scope, ...args) {
    return Object.keys(obj).reduce((bound, key) => {
      bound[key] = obj[key].bind(scope, ...args);
      return bound;
    }, {});
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
};
