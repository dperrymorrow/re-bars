import Add from "./add.js";
import Todo from "./todo.js";

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

    {{#watch "filter" }}
      <button {{ disabledIf "completed" }} {{ method "filter" "completed" }}>Show Completed</button>
      <button {{ disabledIf "incomplete" }} {{ method "filter" "incomplete" }}>Show Incompleted</button>
      <button {{ disabledIf null }} {{ method "clearFilter" }}>Show All</button>
    {{/watch}}

    <ul>
      {{#watch "filter,todos.length" }}
        {{#watchEach todos }}
          {{#ifShowTodo . }}
            {{ component "Todo" todo=. todos=@root.todos }}
          {{/ifShowTodo}}
        {{/watchEach}}
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
  `,

  name: "DemoApp",

  data: {
    filter: null,
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
        id: 33,
      },
      {
        done: true,
        name: "Paint the House",
        description: "buy the paint and then paint the house",
        id: 22,
      },
    ],
  },
  helpers: {
    disabledIf({ data }, filter) {
      return data.filter === filter ? "disabled" : "";
    },

    ifShowTodo({ data }, todo, options) {
      let shouldRender = true;
      if (data.filter) shouldRender = data.filter === "completed" ? todo.done : !todo.done;
      return shouldRender ? options.fn(todo) : options.inverse(todo);
    },
  },

  components: { Add, Todo },

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
