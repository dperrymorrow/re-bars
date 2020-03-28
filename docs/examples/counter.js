export default {
  template: /*html*/ `
    <h3>
      Button have been clicked
        {{#watch "clicked" }}
          <span>{{ clicked }}</span>
        {{/watch}}
        {{ pluralize "time" }}
      <button {{ method "step" }}>Click Me</button>
    </h3>
  `,

  name: "counter",

  data() {
    return { clicked: 0 };
  },

  helpers: {
    pluralize(val, { data }) {
      return data.root.clicked == 1 ? val : `${val}s`;
    },
  },

  methods: {
    step() {
      this.clicked++;
    },
  },
};
