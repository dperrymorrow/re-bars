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
          {{ on input="updateTitle" }}
        />
      </label>

      <label>
        Description:
        <input
          type="text"
          value="{{ header.description }}"
          {{ on input="updateDescription" }}
        />
      </label>
    </div>

    <ul class="simple">
      {{#watch "todos.length" }}
        {{#each todos }}
          {{#watch (concat "todos." @index ".done") tag="li" }}
            <div class="todo">
              <label>
                <input
                  type="checkbox"
                  {{ on @index click="toggleDone" }}
                  {{ isChecked }}
                />
                {{#if done }}
                  <s>{{ name }}</s>
                {{else}}
                  <strong>{{ name }}</strong>
                {{/if}}
              </label>

              <div class="actions">
                <button {{ on @index click="deleteTodo" }}>
                  delete
                </button>
              </div>
            </div>
          {{/watch}}
        {{/each}}
      {{/watch}}
    </ul>

    {{#watch}}
      {{#if adding }}
        <form>
          <input type="text" {{ ref "newName" }} placeholder="the new todo" />
          <button {{ on click="addItem" }}>Add todo</button>
          <button {{ on click="toggleCreate" }}>Cancel</button>
        </form>
      {{else}}
        <button {{ on click="toggleCreate" }}>Add another</button>
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
      },
      {
        done: true,
        name: "Paint the House",
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
        done: false,
        name: $input.value,
      });

      $input.value = "";
    },

    deleteTodo({ rootData }, index) {
      rootData.todos.splice(index, 1);
    },

    toggleDone({ rootData }, index) {
      rootData.todos[index].done = !this.done;
    },

    toggleCreate({ event }) {
      event.preventDefault();
      this.adding = !this.adding;
    },
  },
};
