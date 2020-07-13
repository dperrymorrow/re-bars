export default {
  template: /*html*/ `
    {{#watch "friends.length" tag="h3" }}
      my friends: {{ allMyFriends }}
    {{/watch}}

    <input type="text" {{ ref "input" }}>
    <button {{ on click="add" }}>Add</button>
  `,

  data: {
    allMyFriends() {
      return this.friends.join(", ");
    },

    friends: ["Mike", "David", "Todd", "Keith"],
  },

  methods: {
    add({ rootData, $refs }) {
      const $input = $refs().input;
      rootData.friends.push($input.value);
      $input.value = "";
    },
  },
};
