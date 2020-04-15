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

    {{#watch "filters.*,todos.length,todos.*.done" tag="ul"}}
      {{#each filteredTodos as | todo | }}
        <li ref="{{ todo.id }}">
          {{
            component "Todo"
            todo=todo
            index=@index
            deleteTodo=@root.$methods.deleteTodo
          }}
        </li>
      {{/each}}
    {{/watch}}

    {{
      component "AddTodo"
      addTodo=$methods.addTodo
    }}
  <div>
  `,

  name: "DemoApp",

  data() {
    return {
      filteredTodos() {
        let list = this.todos.concat();
        if (this.filters.state === "incomplete") list = this.todos.filter(t => !t.done);
        else if (this.filters.state === "completed") list = this.todos.filter(t => t.done);

        const sorted = list.sort((a, b) => {
          if (this.filters.sortBy === "name") return a.name.localeCompare(b.name);
          else return new Date(a.updated).getTime() - new Date(b.updated).getTime();
        });

        return this.filters.sortDir === "asc" ? sorted : sorted.reverse();
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
    };
  },

  components: [Add, Todo, Filters],

  methods: {
    addTodo(name) {
      this.todos.push({ name, id: new Date().getTime(), updated: new Date().toLocaleString() });
      this.filters.state = null;
    },

    deleteTodo(id) {
      const index = this.todos.findIndex(t => t.id === id);
      this.todos.splice(index, 1);
    },

    showAdd(event) {
      event.preventDefault();
      this.uiState.adding = true;
    },
  },
};
