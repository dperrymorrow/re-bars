export default {
  template: /*html*/ `
    <label>
      {{#watch}}
        <input type="checkbox" {{ isChecked }} {{ on input="toggle" }}>
      {{/watch}}
      Is On
    </label>
    <button {{ on click="toggle" }}>Toggle</button>
  `,

  data: {
    isOn: false,
  },

  methods: {
    toggle() {
      this.isOn = !this.isOn;
    },
  },

  helpers: {
    isChecked() {
      if (this.isOn) return "checked";
    },
  },
};
