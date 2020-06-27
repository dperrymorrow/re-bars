export default {
  template: /*html*/ `
    <strong>
      Button have been clicked
      {{#watch}}
        {{ clicked }}
      {{/watch}}
      times
    </strong>

    <button {{ on click="step" }}>Click Me</button>
  `,

  data: { clicked: 0 },

  methods: {
    step() {
      this.clicked++;
    },
  },
};
