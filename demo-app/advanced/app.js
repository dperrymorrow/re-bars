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
      <button {{ disabledIf null }} {{ method "filter" null }}>Show All</button>
    {{/watch}}

    <ul>
      {{#watch "filter,todos.length" }}
        {{#each todos as | todo | }}
          {{#watch todo "done" }}
            {{#ifShowTodo todo }}
              {{ component "Todo" todo=todo todos=@root.todos }}
            {{/ifShowTodo}}
          {{/watch}}
        {{/each}}
      {{/watch}}
    </ul>

    {{ component "Add" todos=todos uiState=uiState }}
  `,

  name: "DemoApp",

  data: {
    filter: null,
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
    disabledIf: (filter, { data }) => (data.root.filter === filter ? "disabled" : ""),

    ifShowTodo(todo, { fn, inverse, data }) {
      let shouldRender = true;
      if (data.root.filter)
        shouldRender = data.root.filter === "completed" ? todo.done : !todo.done;
      return shouldRender ? fn(todo) : inverse(todo);
    },
  },

  components: { Add, Todo },

  methods: {
    filter: ({ data }, event, filter) => (data.filter = filter),

    showAdd({ data }, event) {
      console.log(arguments);
      event.preventDefault();
      data.uiState.adding = true;
    },
  },
};
