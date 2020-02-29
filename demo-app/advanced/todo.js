export default {
  template: /*html*/ `
    <li>
      {{#watch "editing" }}
        {{#if editing}}
          <input type="text" value="{{ todo.name }}" {{ bind "todo.name" }}/>
          <button {{ method "toggleEditing" }}>save</button>
        {{ else }}
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
          <button {{ method "toggleEditing" }}>edit</button>
        {{/if}}
      {{/watch}}
    </li>
  `,

  name: "Todo",

  data: {
    editing: false,
  },

  helpers: {
    isChecked: val => (val ? "checked" : ""),
  },

  methods: {
    deleteToDo({ data }) {
      const index = data.todos.findIndex(item => item.id === data.todo.id);
      data.todos.splice(index, 1);
    },

    toggleEditing({ data }) {
      data.editing = !data.editing;
    },

    toggleDone({ data }) {
      data.todo.done = !data.todo.done;
    },
  },
};
