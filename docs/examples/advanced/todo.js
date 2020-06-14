export default {
  template: /*html*/ `
    <li {{ ref todo.id }}>
      <div class="todo">
        {{#if todo.isEditing }}
          <input type="text" {{ ref "editInput" }} value="{{ todo.name }}" {{ on keydown="saveOnEnter" }}>
          <button {{ on click="save" }}>done</button>
        {{ else }}
          <label>
            <input type="checkbox" {{ isChecked }} {{ on click="toggleDone" }} />
            {{#if todo.done }}
              <s>{{ todo.name }}</s>
            {{else}}
              <strong>{{ todo.name }}</strong>
            {{/if}}
          </label>

          <div class="actions">
            <span class="date">{{ timeAgo }}</span>
            <button {{ on click="remove" }}>delete</button>
            <button {{ on click="edit" }}>edit</button>
          </div>
        {{/if}}
      </div>
    </li>
  `,

  helpers: {
    isChecked() {
      return this.todo.done ? "checked" : "";
    },
    timeAgo() {
      return this.updated;
      // window.moment(this.todo.updated).fromNow();
    },
  },

  methods: {
    remove({ methods, rootData }) {
      const index = rootData.todos.findIndex(todo => todo.id === this.id);
      rootData.todos.splice(index, 1);
    },

    saveOnEnter({ event, methods }) {
      if (event.code == "Enter") methods.save();
    },

    save({ event, $refs }) {
      event.preventDefault();
      this.todo.name = $refs().editInput.value;
      this.todo.isEditing = false;
    },

    edit() {
      this.todo.isEditing = true;
    },

    toggleDone({ methods }) {
      this.todo.done = !this.todo.done;
    },
  },
};
