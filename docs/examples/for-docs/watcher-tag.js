export default {
  template: /*html*/ `
    {{#watch "name" tag="h3"}}
      {{ name }}
    {{/watch}}

    <input type="text" value="{{ name }}" {{ on input="saveName" }}>
  `,
  data: {
    name: "David",
  },
  methods: {
    saveName({ event }) {
      this.name = event.target.value;
    },
  },
};
