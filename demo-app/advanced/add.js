export default {
  template: /*html*/ `
  <div>
    {{#watch "isAdding" }}
      {{#if isAdding }}
        <form>
          {{#watch "newTodo.name" }}
            <h1>{{ newTodo.name }}</h1>
          {{/watch}}

          {{#watch newTodo }}
            <input type="text" {{ bound "newTodo.name" }} placeholder="the new todo" />
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
      newTodo: {
        name: "",
        id: null,
      },
    };
  },

  methods: {
    toggleAdd(event) {
      event.preventDefault();
      this.data.isAdding = !this.data.isAdding;
    },

    addItem(event) {
      event.preventDefault();
      this.data.newTodo.id = new Date().getTime();
      this.data.todos.push({ ...this.data.newTodo });
      this.data.newTodo.name = "";
      this.data.newTodo.id = null;
    },
  },
};
