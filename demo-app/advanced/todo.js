export default {
  template: /*html*/ `
    <div>
      {{#watch "editing" tag="div" class="todo" }}
        {{#if editing}}
          <input type="text" {{ bound "todo.name" }}/>
          <button {{ method "toggleEditing" }}>save</button>
        {{ else }}
          <label>
            <input type="checkbox" {{ isChecked todo.done }} {{ method "toggleDone" }} />
            {{#if todo.done }}
              <s>{{ todo.name }}</s>
            {{else}}
              <strong>{{ todo.name }}</strong>
            {{/if}}
          </label>

          <div class="actions">
            <button {{ method "deleteToDo" }}>delete</button>
            <button {{ method "toggleEditing" }}>edit</button>
          </div>
        {{/if}}
      {{/watch}}
    </div>
  `,

  name: "Todo",

  data() {
    return { editing: false };
  },

  helpers: {
    isChecked: val => (val ? "checked" : ""),
  },

  methods: {
    deleteToDo() {
      const index = this.data.todos.findIndex(item => item.id === this.data.todo.id);
      this.data.todos.splice(index, 1);
    },

    toggleEditing() {
      this.data.editing = !this.data.editing;
    },

    toggleDone() {
      this.data.todo.done = !this.data.todo.done;
    },
  },
};
