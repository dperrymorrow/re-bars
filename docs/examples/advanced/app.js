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
        <input type="text" value="{{ header.title }}" {{ on "input" "updateTitle" }} />
      </label>

      <label>
        Description:
        <input type="text" value="{{ header.description }}" {{ on "input" "updateDescription" }} />
      </label>
    </div>

    {{> Filters }}

    {{#watch "filters.*" "todos.length" tag="ul"}}
      {{#each filteredTodos as | todo | }}
        {{> Todo todo=todo }}
      {{/each}}
    {{/watch}}

    {{> Add }}
  <div>
  `,

  trace: true,

  data: {
    header: {
      title: "ReBars Todos",
      description: "Some things that need done",
    },
    editingId: null,
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
    updateTitle(event) {
      this.data.header.title = event.target.value;
    },

    updateDescription(event) {
      this.data.header.description = event.target.value;
    },
  },
};
