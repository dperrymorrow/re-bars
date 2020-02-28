export default {
  template: /*html*/ `
  {{#watch todo }}
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
  {{/watch}}
  `,

  name: "Todo",

  methods: {
    deleteToDo({ data }) {
      data.todos.splice(data.index, 1);
    },

    toggleDone({ data }) {
      data.todo.done = !data.todo.done;
    },
  },
};
