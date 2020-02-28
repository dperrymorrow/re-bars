export default {
  template: /*html*/ `
    <li>
      <label>
        <input type="checkbox" {{ isChecked todo.done }} {{ method "toggleDone" }} />
        {{#if todo.done }}
          <s>{{ todo.name }}</s>
        {{else}}
          <strong>{{ todo.name }}</strong>
        {{/if}}
      </label>
      <p>{{ todo.description }}</p>
      <button {{ method "deleteToDo" }}>X</button>
    </li>
  `,

  name: "Todo",

  helpers: {
    isChecked(context, val) {
      return val ? "checked" : "";
    },
  },

  methods: {
    deleteToDo({ data }) {
      const index = data.todos.findIndex(item => item.id === data.todo.id);
      data.todos.splice(index, 1);
    },

    toggleDone({ data }) {
      data.todo.done = !data.todo.done;
    },
  },
};
