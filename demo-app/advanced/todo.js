export default {
  template: /*html*/ `
  {{# watch "todo.*" }}
    <li>
     <div >
      <label>
        <input type="checkbox" {{ isChecked todo.done }} {{ method "click" "toggleDone" }}/>
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
    deleteToDo({ props }) {
      props.todos.splice(props.index, 1);
    },

    toggleDone({ data }) {
      data.todo.done = !data.todo.done;
    },
  },
};
