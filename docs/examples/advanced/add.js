export default {
  template: /*html*/ `
  <div>
    {{#watch "isAdding" }}
      {{#if isAdding }}
        <form>
          {{#watch}}
            <h3>{{ newName }}</h3>
            <input type="text" {{ ref "newName" }} placeholder="the new todo" />
          {{/watch}}

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
    toggleAdd(event) {
      event.preventDefault();
      this.data.isAdding = !this.data.isAdding;
    },

    addItem(event) {
      event.preventDefault();
      const $input = this.$refs().newName;
      this.data.todos.push({
        name: $input.value,
        id: new Date().getTime(),
        updated: new Date().toLocaleString(),
      });

      this.data.filters.filterBy = null;
      $input.value = "";
      $input.focus();
    },
  },
};
