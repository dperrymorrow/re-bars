export default {
  template: /*html*/ `
  <form>
    {{#watch "newTodo.name" }}
      <h1>{{ newTodo.name }}</h1>
    {{/watch}}

    {{#watch "newTodo.id" }}
      <input type="text" name="name" value="{{ newTodo.name }}" {{ bind "newTodo.name" }} placeholder="the new todo" />
      <textarea name="description" value="{{ newTodo.description }}" {{ bind "newTodo.description" }}></textarea>
    {{/watch}}
    
    <button class="push" {{ method "addItem" }}>Add todo</button>
    <button class="cancel" {{ method "cancel" }}>Cancel</button>
  </form>
`,

  name: "AddComponent",

  data: {
    newTodo: {
      name: "",
      description: "",
      id: null,
    },
  },

  methods: {
    cancel({ data }, event) {
      event.preventDefault();
      data.uiState.adding = false;
    },

    addItem({ data }, event) {
      event.preventDefault();
      data.newTodo.id = new Date().getTime();
      data.todos.push({ ...data.newTodo });

      data.newTodo.name = "";
      data.newTodo.description = "";
      data.newTodo.id = null;
    },
  },
};
