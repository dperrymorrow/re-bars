import Add from "./add.js";
import Todo from "./todo.js";

export default {
  template: /*html*/ `
  <div>
    <div class="header-container">
      {{#watch "header.*" tag="h1" }}
        <span>{{ header.title }}</span>
        <small>{{ header.description }}</small>
      {{/watch}}

      <label>
        Title:
        <input type="text" {{ bound "header.title" }}/>
      </label>

      <label>
        Description:
        <input type="text" {{ bound "header.description" }}/>
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

    {{ component "AddTodo" todos=todos }}
  <div>
  `,

  name: "DemoApp",

  watchers: {
    "todos.length"() {
      this.data.filter = null;
    },
  },

  data() {
    return {
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
    };
  },

  helpers: {
    disabledIf: (filter, { data }) => (data.root.filter === filter ? "disabled" : ""),

    ifShowTodo(todo, { fn, inverse, data }) {
      let shouldRender = true;
      if (data.root.filter) shouldRender = data.root.filter === "completed" ? todo.done : !todo.done;
      return shouldRender ? fn(todo) : inverse(todo);
    },
  },

  components: [Add, Todo],

  methods: {
    filter(event, filter) {
      this.data.filter = filter;
    },

    showAdd(event) {
      event.preventDefault();
      this.data.uiState.adding = true;
    },
  },
};
