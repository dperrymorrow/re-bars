export default {
  template: /*html*/ `
    {{#watch "name" tag="h3"}}
      {{ name }}
    {{/watch}}
    <input type="text" value="{{ name }}" {{ bind input="name" }}>
  `,
  data: {
    name: "David",
  },
};
