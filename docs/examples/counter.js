export default {
  template: /*html*/ `
    <h3>
      Button have been clicked
        {{#watch}}
          <span>{{ clicked }}</span>
        {{/watch}}
      <button ref="clicker">Click Me</button>
    </h3>
  `,

  data: { clicked: 0 },

  methods: {
    incriment() {
      this.data.clicked++;
    },
  },

  refs: {
    clicker($el, status) {
      if (status === "attached") $el.addEventListener("click", this.methods.incriment);
      else $el.removeEventListener("click", this.methods.incriment);
    },
  },
};
