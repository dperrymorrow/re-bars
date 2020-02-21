import AddComponent from "./add.js";
import TodoComponent from "./todo.js";

export default {
  template: /*html*/ `
    {{#watch "header.*" }}
      <h1>
        {{ header.title }}
        <small>{{ header.description }}</small>
      </h1>
    {{/watch}}

    <label>
      Edit Title:
      <input value="{{ header.title }}" {{ bind "header.title" }}/>
    </label>

    <label>
      Edit Description:
      <input value="{{ header.description }}" {{ bind "header.description" }}/>
    </label>

    <hr />

    {{#watch "todos.length" }}
      <ul>
        {{#each todos}}
          {{ component "TodoComponent" index=@index todo=. }}
        {{/each}}
      </ul>
    {{/watch}}
    {{#watch "todos.*" }}
      {{ debug . }}
    {{/watch}}

    {{#watch "uiState.adding" }}
       <div>
         {{#if uiState.adding }}
           {{ component "AddComponent" }}
         {{else}}
           <button class="add" {{ method "click" "showAdd" }}>Add another</button>
         {{/if}}
       </div>
    {{/watch}}
  `,

  name: "DemoApp",

  data: {
    uiState: {
      adding: false,
    },
    header: {
      title: "This is my list of things to do",
      description: "just general items that need done around the house",
    },
    completed: [],
    active: [],
    todos: [
      {
        done: false,
        name: "Grocery Shopping",
        description: "get the milk, eggs and bread",
        id: 22,
      },
      {
        done: true,
        name: "Paint the House",
        description: "buy the paint and then paint the house",
        id: 44,
      },
    ],
  },

  components: {
    AddComponent,
    TodoComponent,
  },

  watchers: {
    "todos.*"({ data }) {
      data.completed = data.todos.filter(item => item.done);
      data.active = data.todos.filter(item => !item.done);
    },
  },

  methods: {
    showAdd({ event, data }) {
      event.preventDefault();
      data.uiState.adding = true;
    },
  },
};
