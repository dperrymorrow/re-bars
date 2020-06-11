import Add from "./add.js";
import Todo from "./todo.js";
import Filters from "./filters.js";

const storageKey = "rebars-todo";
const store = window.localStorage.getItem(storageKey);
const existingData = store ? JSON.parse(store) : null;

export default {
  template: /*html*/ `
    <div class="header-container">
      {{#watch tag="h1" }}
        <span>{{ header.title }}</span>
        <small>{{ header.description }}</small>
      {{/watch}}

      <label>
        Title:
        <input type="text" value="{{ header.title }}" {{ on "input" "updateTitle" }} />
      </label>

      <label>
        Description:
        <input type="text" value="{{ header.description }}" {{ on "input" "updateDescription" }} />
      </label>
    </div>

    {{> Filters }}

    {{#watch "filters.*" "todos.length" "todos.*.done" tag="ul"}}
      {{#each todos as | todo | }}
        {{#notFilteredOut }}
          {{> Todo todo=todo }}
        {{/notFilteredOut}}
      {{/each}}
    {{/watch}}

    {{> Add }}
  `,

  trace: true,

  helpers: {
    notFilteredOut({ data, fn, inverse }) {
      const filter = data.root.filters.filterBy;
      if (!filter) return fn(this);
      else if (filter === "incomplete") return this.done ? inverse(this) : fn(this);
      else if (filter == "completed") return this.done ? fn(this) : inverse(this);
    },
  },

  data: existingData || {
    header: {
      title: "ReBars Todos",
      description: "Some things that need done",
    },

    isAdding: false,

    filters: {
      filterBy: null,
      sortBy: "completed",
      sortDir: "asc",
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

  partials: {
    Todo,
    Filters,
    Add,
  },

  methods: {
    saveLocal({ rootData }) {
      window.localStorage.setItem(storageKey, JSON.stringify(rootData));
    },

    updateTitle({ event, methods }) {
      this.header.title = event.target.value;
      methods.saveLocal();
    },

    updateDescription({ event, methods }) {
      this.header.description = event.target.value;
      methods.saveLocal();
    },
  },
};
