import Vbars from "../../src/index.js";

export default Vbars.component({
  template: /*html*/ `
  <form>
    <input type="text" name="name" {{ ref "newName" }} placeholder="the new todo" />
    <textarea name="description" {{ ref "newDescrip" }}></textarea>
    <button class="push" {{ addItem "click" }}>Add todo</button>
    <button class="cancel" {{ cancel "click" }}>Cancel</button>
  </form>
`,

  methods: {
    cancel({ event, parent }) {
      event.preventDefault();
      parent.uiState.adding = false;
    },

    addItem({ $refs, event, parent }) {
      event.preventDefault();

      parent.todos.push({
        id: new Date().getTime(),
        name: $refs.newName.value,
        description: $refs.newDescrip.value,
      });

      $refs.newName.value = $refs.newDescrip.value = "";
    },
  },
});
