import Add from "./add.js";
import Todo from "./todo.js";
import Filters from "./filters.js";

export default {
  template: /*html*/ `
  <div>
    <div class="header-container">
      {{#watch tag="h1" }}
        <span>{{ header.title }}</span>
        <small>{{ header.description }}</small>
      {{/watch}}

      <label>
        Title:
        <input type="text" />
      </label>

      <label>
        Description:
        <input type="text" />
      </label>
    </div>

    {{#watch}}

    {{/watch}}

    {{#watch "filters.*" "todos.*" tag="ul"}}
      {{#each filteredTodos as | todo | }}
        <li rbs-ref="{{ todo.id }}">

        </li>
      {{/each}}
    {{/watch}}


  <div>
  `,

  data: {
    filteredTodos() {
      let list = this.data.todos.concat();
      if (this.data.filters.state === "incomplete") list = this.data.todos.filter(t => !t.done);
      else if (this.data.filters.state === "completed") list = this.data.todos.filter(t => t.done);

      const sorted = list.sort((a, b) => {
        if (this.data.filters.sortBy === "name") return a.name.localeCompare(b.name);
        else return new Date(a.updated).getTime() - new Date(b.updated).getTime();
      });

      return this.data.filters.sortDir === "asc" ? sorted : sorted.reverse();
    },

    filters: {
      state: null,
      sortBy: "name",
      sortDir: "asc",
    },
    header: {
      title: "ReBars Todos",
      description: "Some things that need done",
    },
    todos: [
      {
        done: false,
        name: "Wash the car",
        updated: "3/1/2020, 12:37:10 PM",
        id: 21,
      },
      {
        done: true,
        name: "Shopping for groceries",
        updated: "2/27/2020, 2:37:10 PM",
        id: 22,
      },

      {
        done: false,
        name: "Code some Javascript",
        updated: "1/27/2020, 9:37:10 AM",
        id: 23,
      },

      {
        done: true,
        name: "Go for a run",
        updated: "1/15/2020, 10:37:10 PM",
        id: 24,
      },
    ],
  },

  methods: {
    addTodo(todo) {
      this.data.todos.push(todo);
      this.data.filters.state = null;
    },

    saveTodo(todo) {
      const index = this.data.todos.findIndex(t => t.id === todo.id);
      this.data.todos[index] = todo;
    },

    deleteTodo(todo) {
      const index = this.data.todos.findIndex(t => t.id === todo.id);
      this.data.todos.splice(index, 1);
    },

    showAdd(event) {
      event.preventDefault();
      this.data.uiState.adding = true;
    },
  },
};
