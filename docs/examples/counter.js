export default {
  template: /*html*/ `
    <div>
      <h3>
        Button have been clicked
          {{#watch "clicked" }}
            <span>{{ clicked }}</span>
          {{/watch}}
        times
      </h3>
      <button {{ method "step" }}>Click Me</button>
    </div>
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
