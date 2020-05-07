export default {
  template: /*html*/ `
    <h3>
      Button have been clicked
        {{#watch}}
          <span>{{ clicked }}</span>
          Clicked {{ clicked }} times
        {{/watch}}
      <button {{ method "step" }}>Click Me</button>
    </h3>
  `,
  name: "counter",
  data() {
    return { clicked: 0 };
  },
  methods: {
    step() {
      this.clicked++;
    },
  },
};
