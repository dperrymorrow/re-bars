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
      // this is the scope of the template
      // here it is a string inside of the each loop
      rootData.favorite = `${this.toUpperCase()}!! is my favorite food`;
    },

    isFavorite({ event, $refs, $nextTick, rootData, methods }) {
      // here we call another method, and the scope remains the same
      methods.display();
    },
  },
};
