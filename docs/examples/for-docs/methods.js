export default {
  template: /*html*/ `
    {{#each foods as | food | }}
      <button {{ on click="isFavorite" }}>{{ food }}</button>
    {{/each}}

    {{#watch}}
      {{ favorite }}
    {{/watch}}
  `,

  data: {
    favorite: null,
    foods: ["pizza", "cake", "donuts"],
  },

  methods: {
    display({ rootData }) {
      rootData.favorite = `${this.toUpperCase()}!! is my favorite food`;
    },

    isFavorite({ event, $refs, $nextTick, rootData, methods }) {
      methods.display();
    },
  },
};
