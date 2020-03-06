export default {
  template: /*html*/ `
    <div>
      {{#watch "editing" tag="div" class="todo" }}
        {{#if editing}}
          <input type="text" value="{{ todo.name }}" {{ ref "nameInput" }}/>
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
            <button {{ method "deleteTodo" index }}>delete</button>
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
    save() {
      this.data.todo.name = this.$refs().nameInput.value;
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
