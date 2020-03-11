export default {
  template: /*html*/ `
    <div>
    {{#watch name }}
      <h1>{{ name.first }}</h1>
    {{/watch}}
    <p>{{ fullName }}</p>
    <button class="change-name" {{ method "changeName" }}></button>
  </div>
  `,
  data() {
    return {
      fullName() {
        return `${this.name.first}, ${this.name.last}`;
      },
      name: { first: "David", last: "Morrow" },
    };
  },
  methods: {
    changeName(event, newName) {
      this.data.name.first = newName;
    },
  },
  name: "test",
};
