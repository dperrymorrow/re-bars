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

  refs: {
    clicker({ $el, $app, $refs, data }) {
      $el.addEventListener("click", () => {
        data.clicked++;
      });
    },
  },
};
