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

  helpers: {
    isChecked(context, val) {
      return val ? "checked" : "";
    },
  },

  methods: {
    deleteToDo({ data, props }) {},

    toggleDone({ data }) {
      data.todo.done = !data.todo.done;
    },
  },
};
