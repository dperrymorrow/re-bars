export default {
  template: /*html*/ `
    <div>
      {{#watch "editing" tag="div" class="todo" }}
        {{#if editing}}
          <input type="text" {{ bound "todo.name" }}/>
          <button {{ method "save" }}>save</button>
        {{ else }}
          <label>
            {{#watch "todo.done" }}
              <input type="checkbox" {{ isChecked todo.done }} {{ method "toggleDone" }} />
              {{#if todo.done }}
                <s>{{ todo.name }}</s>
              {{else}}
                <strong>{{ todo.name }}</strong>
              {{/if}}
            {{/watch}}
          </label>

          <div class="actions">
            <button {{ method "remove" }}>delete</button>
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

  hooks: {
    created() {
      this.data.todo = this.$props.todo;
    },
  },

  helpers: {
    isChecked: val => (val ? "checked" : ""),
  },

  methods: {
    remove() {
      this.$props.deleteTodo(this.data.todo);
    },

    save() {
      this.data.editing = false;
    },

    toggleEditing() {
      this.data.editing = !this.data.editing;
    },

    toggleDone() {
      this.data.todo.done = !this.data.todo.done;
    },
  },
};
