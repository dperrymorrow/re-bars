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
      {{#watch "filter" }}
        {{#each todos}}
          {{ component "Todo" index=@index todo=. todos=@root.todos  }}
        {{/each}}
      {{/watch}}
    </ul>

    {{#watch "uiState.adding" }}
      <div>
       {{#if uiState.adding }}
         {{ component "Add" todos=todos uiState=uiState }}
       {{else}}
         <button class="add" {{ method "showAdd:click" }}>Add another</button>
       {{/if}}
      </div>
    {{/watch}}

    {{ component "Memory" }}
    {{ debug . }}
  `,

  name: "DemoApp",

  data: {
    filter: null,
    // filterSet: null,
    uiState: {
      adding: false,
    },
    header: {
      title: "This is my list of things to do",
      description: "just general items that need done around the house",
    },
    completed: [],
    incomplete: [],
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

  components: { Add, Todo, Memory },

  watchers: {
    "todos.*"({ data }) {
      data.completed = data.todos.filter(item => item.done);
      data.incomplete = data.todos.filter(item => !item.done);
    },
  },
  // need to pass in methods here to make easier to work with
  hooks: {
    created({ data }) {
      data.completed = data.todos.filter(item => item.done);
      data.incomplete = data.todos.filter(item => !item.done);
      data.filterSet = data.todos;
    },
  },

  methods: {
    filter({ data }, event, filter) {
      event.stopPropagation();

      data.filter = filter;
      // data.filterSet = data.todos;
      //
      // if (filter === "completed") data.filterSet = data.completed;
      // if (filter === "incomplete") data.filterSet = data.incomplete;
    },

    clearFilter: ({ data }) => (data.filter = null),

    showAdd({ data }, event) {
      console.log(arguments);
      event.preventDefault();
      data.uiState.adding = true;
    },
  },
};
