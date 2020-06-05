export default {
  template: /*html*/ `
    <li {{ ref todo.id }}>
      {{#watch "editingId" tag="div" class="todo" }}
        {{#isEditing todo.id }}
          <input type="text" {{ on "input" "updateText" todo.id }} />
          <button {{ on "click" "closeEdit" }}>done</button>
        {{ else }}
          <label>
            <input type="checkbox" {{ isChecked todo.done }} {{ on "click" "toggleDone" todo.id }} />
            {{#if todo.done }}
              <s>{{ todo.name }}</s>
            {{else}}
              <strong>{{ todo.name }}</strong>
            {{/if}}
          </label>

          <div class="actions">
            <span class="date">{{ timeAgo todo.updated }}</span>
            <button {{ on "click" "remove" todo.id }}>delete</button>
            <button {{ on "click" "edit" todo.id }}>edit</button>
          </div>
        {{/isEditing}}
      {{/watch}}
    </li>
  `,

  helpers: {
    isEditing(val, { data, fn, inverse }) {
      return val === data.root.editingId ? fn(this) : inverse(this);
    },
    isChecked: val => (val ? "checked" : ""),
    timeAgo: val => window.moment(val).fromNow(),
  },

  methods: {
    findIndex(id) {
      return this.data.todos.findIndex(todo => todo.id === id);
    },

    findTodo(id) {
      return this.data.todos[this.methods.findIndex(id)];
    },

    remove(event, id) {
      const index = this.methods.findIndex(id);
      this.data.todos.splice(index, 1);
    },

    updateText(event, id) {
      const todo = this.methods.findTodo(id);
      todo.name = event.target.value;
      todo.updatedAt = new Date().toLocaleString();
    },

    closeEdit(event) {
      this.data.editingId = null;
    },

    edit(event, id) {
      this.data.editingId = id;
    },

    toggleDone(event, id) {
      const todo = this.methods.findTodo(id);
      todo.done = !todo.done;
    },
  },
};
