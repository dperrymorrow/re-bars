export default {
  template: /*html*/ `
  <form>
    <h1>{{ props.title }}</h1>
    <input type="text" name="name" {{ ref "newName" }} placeholder="the new todo" />
    <textarea name="description" {{ ref "newDescrip" }}></textarea>
    <button class="push" {{ addItem "click" }}>Add todo</button>
    <button class="cancel" {{ cancel "click" }}>Cancel</button>
  </form>
`,
  methods: {
    cancel({ event, parentData }) {
      event.preventDefault();
      parentData.uiState.adding = false;
    },

    addItem({ $refs, event, parentData }) {
      event.preventDefault();

      parentData.todos.push({
        id: new Date().getTime(),
        name: $refs.newName.value,
        description: $refs.newDescrip.value,
      });

      $refs.newName.value = $refs.newDescrip.value = "";
    },
  },
};
