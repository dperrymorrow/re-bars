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

    {{#watch "filter,todos.*" tag="ul"}}
      {{#each todos as | todo | }}
        {{#ifShowTodo todo }}
          <li {{ ref todo.id }}>
            {{
              component "Todo"
              todo=todo
              index=@index
              deleteTodo=@root.methods.deleteTodo
            }}
          </li>
        {{/ifShowTodo}}
      {{/each}}
    {{/watch}}

    {{
      component "AddTodo"
      addTodo=methods.addTodo
    }}

  <div>
  `,

  name: "DemoApp",

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
          name: "Apples",
          id: 33,
        },
        {
          done: true,
          name: "Blueberries",
          id: 22,
        },

        {
          done: false,
          name: "Cherries",
          id: 26,
        },

        {
          done: true,
          name: "Grapes",
          id: 29,
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

    addTodo(todo) {
      this.data.todos.push({ ...todo });
      this.data.filter = null;
    },

    findIndex(todo) {
      return this.data.todos.findIndex(t => t.id === todo.id);
    },

    deleteTodo(todo) {
      this.data.todos.splice(this.methods.findIndex(todo), 1);
    },

    showAdd(event) {
      event.preventDefault();
      this.data.uiState.adding = true;
    },
  },
};
