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

    <button {{ method "filter" "completed" }}>Show Completed</button>
    <button {{ method "filter" "incomplete" }}>Show Incompleted</button>
    <button {{ method "clearFilter" }}>Show All</button>

    <ul>
      {{#watch "filter,todos.length" }}
        {{#each filtered }}
          {{ component "Todo" todo=. }}
        {{/each}}
      {{/watch}}
    </ul>

    {{#watch "uiState.adding" }}
      <div>
       {{#if uiState.adding }}
         {{ component "Add" todos=todos uiState=uiState }}
       {{else}}
         <button class="add" {{ method "showAdd" }}>Add another</button>
       {{/if}}
      </div>
    {{/watch}}

    {{ component "Memory" }}
    {{ debug . }}
  `,

  name: "DemoApp",

  data: {
    filter: null,

    filtered() {
      if (this.filter === "completed") return this.todos.filter(item => item.done);
      if (this.filter === "incomplete") return this.todos.filter(item => !item.done);
      return this.todos;
    },

    uiState: {
      adding: false,
    },
    header: {
      title: "This is my list of things to do",
      description: "just general items that need done around the house",
    },
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
  helpers: {
    // disableActive({instance, data}, filter){
    //
    // }
  },

  components: { Add, Todo, Memory },

  methods: {
    filter: ({ data }, event, filter) => (data.filter = filter),
    clearFilter: ({ data }) => (data.filter = null),

    showAdd({ data }, event) {
      console.log(arguments);
      event.preventDefault();
      data.uiState.adding = true;
    },
  },
};
