export default {
  /*html*/
  template: `
  <div id="memory">
    {{#watch usage }}
      {{ usage.used }}
    {{/watch}}
  </div>
  `,

  name: "memory",

  data: {
    usage: { used: 0 },
  },

  methods: {
    updateStorage({ data }) {
      data.usage.used = performance.memory.usedJSHeapSize.toLocaleString();
    },
  },

  hooks: {
    attached({ methods }) {
      methods.updateStorage(...arguments);
      setInterval(() => {
        methods.updateStorage(...arguments);
      }, 5000);
    },
  },
};
