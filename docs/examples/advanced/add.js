export default {
  template: /*html*/ `
  <div>
    {{#watch }}
      {{#if isAdding }}
        <form>
          <input type="text" {{ ref "newName" }} placeholder="the new todo" >
          <button {{ on "click" "addItem" }}>Add todo</button>
          <button {{ on "click" "toggleAdd" }}>Cancel</button>
        </form>
      {{ else }}
        <button {{ on "click" "toggleAdd" }}>Add another</button>
      {{/if}}
    {{/watch}}
  </div>`,

  data: {
    isAdding: false,
  },

  methods: {
    toggleAdd({ event, methods }) {
      event.preventDefault();
      this.isAdding = !this.isAdding;
    },

    addItem({ event, methods, $refs }) {
      event.preventDefault();
      const $input = $refs().newName;

      this.todos.push({
        name: $input.value,
        id: new Date().getTime(),
        done: false,
        updated: new Date().toLocaleString(),
      });

      this.filters.filterBy = null;
      $input.value = "";
      $input.focus();

      methods.sort();
      methods.saveLocal();
    },
  },
};
