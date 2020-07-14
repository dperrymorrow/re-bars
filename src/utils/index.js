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

  buildContext(scope, { $app, data, methods }) {
    const context = {
      $app,
      $nextTick: this.nextTick,
      $refs: this.dom.findRefs.bind(null, $app),
      rootData: data,
    };
    context.methods = this.bind(methods, scope, context);
    return context;
  },

  intersects: (obj1, obj2) => Object.keys(obj2).filter(key => key in obj1),

  registerHelpers({ instance, helpers, scope }) {
    const utils = this;
    Object.entries(helpers).forEach(([name, fn]) =>
      instance.registerHelper(name, function(...args) {
        const context = utils.buildContext(this, scope);
        return fn.call(this, context, ...args);
      })
    );
  },

  registerPartials({ instance, scope, partials }) {
    Object.entries(partials).forEach(([name, partial]) => {
      instance.registerPartial(name, partial.template);

      ["methods", "partials", "data"].forEach(key => {
        if (!(key in partial)) return;
        const collide = this.intersects(scope[key], partial[key]);
        if (collide.length) instance.log(2, `ReBars: partial ${name} has conflicting ${key} keys`, collide);
      });

      if (partial.data) Object.assign(scope.data, partial.data);
      if (partial.methods) Object.assign(scope.methods, partial.methods);
      if (partial.helpers) this.registerHelpers({ instance, helpers: partial.helpers, scope });
    });
  },

  bind(obj, scope, ...args) {
    return Object.keys(obj).reduce((bound, key) => {
      bound[key] = obj[key].bind(scope, ...args);
      return bound;
    }, {});
  },

  shouldRender: (changed, watching) => changed.some(change => watching.some(watch => change.match(watch))),
  randomId: () => counter++,
};
