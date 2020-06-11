export default {
  template: /*html*/ `
  <div>
    <div class="header-container">
      <h1>
        {{#watch}}
          <span>{{ header.title }}</span>
          <small>{{ header.description }}</small>
        {{/watch}}
      </h1>

      <label>
        Title:
        <input
          type="text"
          value="{{ header.title }}"
          {{ on "input" "updateTitle" }}
        />
      </label>

      <label>
        Description:
        <input
          type="text"
          value="{{ header.description }}"
          {{ on "input" "updateDescription" }}
        />
      </label>
    </div>

    <ul class="simple">
      {{#watch "todos.*" }}
        {{#each todos }}
          <li {{ ref id }}>
            <div class="todo">
              <label>
                <input
                  type="checkbox"
                  {{ on "click" "toggleDone" }}
                  {{ isChecked }}
                />
                {{#if done }}
                  <s>{{ name }}</s>
                {{else}}
                  <strong>{{ name }}</strong>
                {{/if}}
              </label>

              <div class="actions">
                <button {{ on "click" "deleteTodo" }}>
                  delete
                </button>
              </div>
            </div>
          </li>
        {{/each}}
      {{/watch}}
    </ul>

    {{#watch}}
      {{#if adding }}
        <form>
          <input type="text" {{ ref "newName" }} placeholder="the new todo" />
          <button {{ on "click" "addItem" }}>Add todo</button>
          <button {{ on "click" "toggleCreate" }}>Cancel</button>
        </form>
      {{else}}
        <button {{ on "click" "toggleCreate" }}>Add another</button>
      {{/if}}
    {{/watch}}
  </div>
  `,

  trace: true,

  data: {
    adding: false,
    header: {
      title: "Todos",
      description: "some things that need done",
    },
    todos: [
      {
        done: false,
        name: "Grocery Shopping",
        id: 22,
      },
      {
        done: true,
        name: "Paint the House",
        id: 44,
      },
    ],
  },

  helpers: {
    isChecked() {
      return this.done ? "checked" : "";
    },
  },

  methods: {
    updateTitle({ event }) {
      this.header.title = event.target.value;
    },

    updateDescription({ event }) {
      this.header.description = event.target.value;
    },

    addItem({ $refs, event }) {
      event.preventDefault();
      const $input = $refs().newName;

      this.todos.push({
        id: new Date().getTime(),
        done: false,
        name: $input.value,
      });

      $input.value = "";
    },

    findTodo({ rootData }, id) {
      return rootData.todos.find(item => item.id === parseInt(id));
    },

    deleteTodo({ rootData }) {
      const index = rootData.todos.findIndex(t => t.id === this.id);
      rootData.todos.splice(index, 1);
    },

    toggleDone({ event, methods }) {
      const todo = methods.findTodo(this.id);
      todo.done = !this.done;
    },

    toggleCreate({ event }) {
      event.preventDefault();
      this.adding = !this.adding;
    },
  },
};
