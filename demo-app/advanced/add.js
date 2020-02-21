export default {
  template: /*html*/ `
  <form>
    <h1>{{ props.title }}</h1>
    <input type="text" name="name" {{ ref "newName" }} placeholder="the new todo" />
    <textarea name="description" {{ ref "newDescrip" }}></textarea>
    <button class="push" {{ method "click" "addItem" }}>Add todo</button>
    <button class="cancel" {{ method "click" "cancel" }}>Cancel</button>
  </form>
`,

  name: "AddComponent",

  methods: {
    cancel({ event, props }) {
      event.preventDefault();
      props.uiState.adding = false;
    },

    addItem({ $refs, event, props }) {
      event.preventDefault();

      props.todos.push({
        name: $refs.newName.value,
        description: $refs.newDescrip.value,
      });

      $refs.newName.value = $refs.newDescrip.value = "";
    },
  },
};
