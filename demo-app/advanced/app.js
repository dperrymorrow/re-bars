import Add from "./add.js";
import Todo from "./todo.js";
import Memory from "./memory.js";

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
          {{ component "Todo" index=@index todo=. todos=@root.todos }}
        {{/each}}
      </ul>
    {{/watch}}


    {{#watch "uiState.adding" }}
       <div>
         {{#if uiState.adding }}
           {{ component "Add" todos=todos uiState=uiState }}
         {{else}}
           <button class="add" {{ method "click" "showAdd" }}>Add another</button>
         {{/if}}
       </div>
    {{/watch}}

    {{ component "Memory" }}
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
      },
      {
        done: true,
        name: "Paint the House",
        description: "buy the paint and then paint the house",
      },
    ],
  },

  components: {
    Add,
    Todo,
    Memory,
  },

  watchers: {
    "todos.*"({ data }) {
      data.completed = data.todos.filter(item => item.done);
      data.active = data.todos.filter(item => !item.done);
    },
  },

  methods: {
    showAdd({ data }, event) {
      event.preventDefault();
      data.uiState.adding = true;
    },
  },
};
