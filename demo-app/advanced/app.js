import Add from "./add.js";
import Todo from "./todo.js";

export default {
  template: /*html*/ `
  <div>
    <div class="header-container">
      {{#watch "header.*" tag="h1" }}
        {{ header.title }}
        <small>{{ header.description }}</small>
      {{/watch}}

      <label>
        Title:
        <input type="text" {{ bind "header.title" "title" }}/>
      </label>

      <label>
        Description:
        <input type="text" {{ bind "header.description" "descrip" }}/>
      </label>
    </div>

    {{#watch "filter" tag="div" class="filters" }}
      <button {{ disabledIf "completed" }} {{ method "filter" "completed" }}>Show Completed</button>
      <button {{ disabledIf "incomplete" }} {{ method "filter" "incomplete" }}>Show Incompleted</button>
      <button {{ disabledIf null }} {{ method "filter" null }}>Show All</button>
    {{/watch}}

    {{#watch "filter,todos.length" tag="ul"}}
      {{#each todos as | todo | }}
        {{#watch todo "done" tag="li" }}
          {{#ifShowTodo todo }}
            {{ component "Todo" todo=todo todos=@root.todos }}
          {{/ifShowTodo}}
        {{/watch}}
      {{/each}}
    {{/watch}}

    {{ component "Add" todos=todos uiState=uiState }}
  <div>
  `,

  name: "DemoApp",

  data: {
    filter: null,
    header: {
      title: "Todos",
      description: "Some things that need done",
    },
    todos: [
      {
        done: false,
        name: "Grocery Shopping",
        id: 33,
      },
      {
        done: true,
        name: "Paint the House",
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
