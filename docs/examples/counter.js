export default {
  template: /*html*/ `
    <h3>
      Button have been clicked
        {{#watch}}
          <span>{{ clicked }}</span>
        {{/watch}}
      <button method="click:incriment">Click Me</button>
    </h3>
  `,

  data: { clicked: 0 },

  methods: {
    incriment() {
      this.data.clicked++;
    },
  },
};
