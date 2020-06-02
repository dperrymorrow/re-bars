export default {
  template: /*html*/ `
    <h3>
      Button have been clicked
      {{#watch}}
        {{ clicked }}
      {{/watch}}

      <button rbs-method="click:incriment">
        Click Me
      </button>
    </h3>
  `,

  data: { clicked: 0 },

  trace: true,

  methods: {
    incriment() {
      this.data.clicked++;
    },
  },
};
