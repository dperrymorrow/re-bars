export default {
  template: /*html*/ `
  {{# watch "todo.*" }}
    <li>
     <div >
      <label for="{{ props.id }}">
        <input id="{{ props.id }}" type="checkbox" {{ isChecked todo.done }} {{ toggleDone "click" }}/>
        {{#if todo.done }}
          <s>{{ todo.name }}</s>
        {{else}}
          <strong>{{ todo.name }}</strong>
        {{/if}}
      </label>
      <p>{{ todo.description }}</p>
      <button {{ deleteToDo "click" }}>X</button>
      <!-- {{debug . }} -->
      </div>
    </li>
  {{/watch}}
  `,

  data: {
    todo: null,
  },

  hooks: {
    created({ props, data, parentData }) {
      data.todo = parentData.todos.find(item => item.id === props.id);
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
