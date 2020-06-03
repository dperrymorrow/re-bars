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
                  {{ on "click" "toggleDone" id done }}
                  {{ isChecked done }}
                />
                {{#if done }}
                  <s>{{ name }}</s>
                {{else}}
                  <strong>{{ name }}</strong>
                {{/if}}
              </label>

              <div class="actions">
                <button {{ on "click" "deleteTodo" id }}>
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
    isChecked: val => (val ? "checked" : ""),
  },

  methods: {
    updateTitle(event) {
      this.data.header.title = event.target.value;
    },

    updateDescription(event) {
      this.data.header.description = event.target.value;
    },

    addItem(event) {
      event.preventDefault();
      const $input = this.$refs().newName;

      this.data.todos.push({
        id: new Date().getTime(),
        name: $input.value,
      });

      $input.value = "";
    },

    findTodo(id) {
      return this.data.todos.findIndex(item => item.id === parseInt(id));
    },

    deleteTodo(event, id) {
      const index = this.methods.findTodo(id);
      this.data.todos.splice(index, 1);
    },

    toggleDone(event, id, done) {
      const todo = this.data.todos[this.methods.findTodo(id)];
      todo.done = !done;
    },

    toggleCreate(event) {
      event.preventDefault();
      this.data.adding = !this.data.adding;
    },
  },
};
