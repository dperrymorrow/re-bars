export default {
  template: /*html*/ `
  <div>
    {{#watch "isAdding" }}
      {{#if isAdding }}
        <form>
          {{#watch "newName" }}
            <h1>{{ newName }}</h1>
            <input type="text" {{ bound "newName" }} placeholder="the new todo" />
          {{/watch}}

          <button class="push" {{ method "addItem" }}>Add todo</button>
          <button class="cancel" {{ method "toggleAdd" }}>Cancel</button>
        </form>
      {{ else }}
        <button class="add" {{ method "toggleAdd" }}>Add another</button>
      {{/if}}
    {{/watch}}
  </div>
  `,

  name: "AddTodo",

  data() {
    return {
      isAdding: false,
      hasError: false,
      newName: "",
    };
  },

  methods: {
    toggleAdd(event) {
      event.preventDefault();
      this.data.isAdding = !this.data.isAdding;
    },

    addItem(event) {
      event.preventDefault();
      this.methods.addTodo(this.data.newName);
      this.data.newName = "";
    },
  },
};
