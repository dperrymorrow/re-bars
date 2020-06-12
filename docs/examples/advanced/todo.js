export default {
  template: /*html*/ `
    <li {{ ref todo.id }} {{ on "keyup" "saveIfEnter" }}>
      {{#watch (buildPath "todos" @index "*") tag="div" class="todo" }}

        {{#if todo.isEditing }}
          <input type="text"
            value="{{ todo.name }}"
            {{ ref "editInput" }}
            {{ on "input" "updateText" }}
          />
          <button {{ on "click" "closeEdit" }}>done</button>
        {{ else }}

          <label>
            <input type="checkbox" {{ isChecked }} {{ on "click" "toggleDone" }} />
            {{#if todo.done }}
              <s>{{ todo.name }}</s>
            {{else}}
              <strong>{{ todo.name }}</strong>
            {{/if}}
          </label>

          <div class="actions">
            <span class="date">{{ timeAgo }}</span>
            <button {{ on "click" "remove" }}>delete</button>
            <button {{ on "click" "edit" }}>edit</button>
          </div>
        {{/if}}
      {{/watch}}
    </li>
  `,

  helpers: {
    isChecked() {
      return this.todo.done ? "checked" : "";
    },
    timeAgo() {
      return window.moment(this.todo.updated).fromNow();
    },
  },

  methods: {
    remove({ methods, rootData }) {
      const index = rootData.todos.findIndex(todo => todo.id === this.id);
      rootData.todos.splice(index, 1);
      methods.saveLocal();
    },

    saveIfEnter({ event, methods }) {
      if (event.code === "Enter") methods.closeEdit();
    },

    updateText({ event, methods }) {
      this.todo.name = event.target.value;
      this.updatedAt = new Date().toLocaleString();
      methods.saveLocal();
    },

    closeEdit() {
      delete this.todo.isEditing;
    },

    edit({ rootData }) {
      this.todo.isEditing = true;
    },

    toggleDone({ methods }) {
      this.todo.done = !this.todo.done;
      methods.sort();
      methods.saveLocal();
    },
  },
};
