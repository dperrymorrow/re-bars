export default {
  template: /*html*/ `
  <div id="memory">
    {{#watch usage }}
      <div>Used: {{ usage.used }}</div>
      <div>Max: {{ usage.max }}</div>
    {{/watch}}
    <button {{ method "updateStorage" }} >update</button>
  </div>
  `,

  name: "memory",

  data: {
    usage: { used: 0, max: 0 },
  },

  methods: {
    updateStorage({ data }) {
      data.usage.used = performance.memory.usedJSHeapSize.toLocaleString();
      data.usage.max = performance.memory.jsHeapSizeLimit.toLocaleString();
    },
  },

  hooks: {
    attached({ methods }) {
      methods.updateStorage(...arguments);
    },
  },
};
