export default {
  template: /*html*/ `
    <div>
      {{#watch "editing" tag="div" class="todo" }}
        {{#if editing}}
          <input type="text" value="{{ $props.todo.name }}" ref="nameInput"/>
          <button {{ method "save" }}>save</button>
        {{ else }}
          <label>
            <input type="checkbox" {{ isChecked $props.todo.done }} {{ method "toggleDone" }} />
            {{#if $props.todo.done }}
              <s>{{ $props.todo.name }}</s>
            {{else}}
              <strong>{{ $props.todo.name }}</strong>
            {{/if}}
          </label>

          <div class="actions">
            <span class="date">{{ timeAgo todo.updated }}</span>
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

  helpers: {
    isChecked: val => (val ? "checked" : ""),
    timeAgo: val => {
      return window.moment(val).fromNow();
    },
  },

  methods: {
    save() {
      this.$props.todo.name = this.$refs().nameInput.value;
      this.$props.todo.updated = new Date().toLocaleString();
      this.editing = false;
    },

    remove() {
      this.$props.deleteTodo(this.$props.todo.id);
    },

    toggleEditing() {
      this.editing = !this.editing;
    },

    toggleDone() {
      this.$props.todo.done = !this.$props.todo.done;
    },
  },
};
