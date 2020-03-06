import Add from "./add.js";
import Todo from "./todo.js";
import Filters from "./filters.js";

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

    {{ component "filters" filters=filters }}

    {{#watch "filters.*,todos.*" tag="ul"}}
      {{#each filteredTodos as | todo | }}
        <li {{ ref todo.id }}>
          {{
            component "Todo"
            todo=todo
            index=@index
            deleteTodo=@root.methods.deleteTodo
          }}
        </li>
      {{/each}}
    {{/watch}}

    {{
      component "AddTodo"
      addTodo=methods.addTodo
    }}

    {{ debug . }}
  <div>
  `,

  name: "DemoApp",

  data() {
    return {
      filteredTodos() {
        let list = this.todos.concat();
        if (this.filters.state === "incomplete") list = this.todos.filter(t => !t.done);
        else if (this.filters.state === "completed") list = this.todos.filter(t => t.done);

        return list.sort((a, b) => {
          if (this.filters.sortBy === "name") return a.name.localeCompare(b.name);
          else new Date(a.updated) - new Date(b.updated);
        });
      },
      filters: {
        state: null,
        sortBy: "name",
      },
      header: {
        title: "Todos",
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
    };
  },

  components: [Add, Todo, Filters],

  methods: {
    addTodo(todo) {
      this.data.todos.push({ ...todo });
      this.data.filters.state = null;
    },

    deleteTodo(event, index) {
      this.data.todos.splice(index, 1);
    },

    showAdd(event) {
      event.preventDefault();
      this.data.uiState.adding = true;
    },
  },
};
