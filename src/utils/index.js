let counter = 1;

import Dom from "./dom.js";
const { fetch } = window;

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

  loadTemplate: file =>
    fetch(file)
      .then(res => res.text())
      .catch(err => {
        throw new Error(err);
      }),

  nextTick: () =>
    new Promise(resolve => {
      setTimeout(resolve, 0);
    }),

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

  registerHelpers({ instance, helpers, scope }) {
    const utils = this;
    Object.entries(helpers).forEach(([name, fn]) =>
      instance.registerHelper(name, function(...args) {
        const context = utils.buildContext(this, scope);
        return fn.call(this, context, ...args);
      })
    );
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
