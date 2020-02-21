export default {
  template: /*html*/ `
  {{# watch "todo.*" }}
    <li>
     <div >
      <label for="{{ todo.id }}">
        <input id="{{ todo.id }}" type="checkbox" {{ isChecked todo.done }} {{ method "click" "toggleDone" }}/>
        {{#if todo.done }}
          <s>{{ todo.name }}</s>
        {{else}}
          <strong>{{ todo.name }}</strong>
        {{/if}}
      </label>
      <p>{{ todo.description }}</p>
      <button {{ method "click" "deleteToDo" }}>X</button>
      </div>
    </li>
  {{/watch}}
  `,

  name: "Todo",

  data: {
    todo: null,
  },

  hooks: {
    created({ props, data }) {
      data.todo = props.todo;
    },
  },

  methods: {
    deleteToDo({ props, parentData }) {
      parentData.todos.splice(props.index, 1);
    },

    toggleDone({ data }) {
      data.todo.done = !data.todo.done;
    },
  },
};
