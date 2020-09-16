const { ReBars } = window;

export default {
  template: ReBars.load("./app.hbs"),

  trace: false,

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
      console.log(index, rootData.todos, this.done);
      rootData.todos[index].done = !this.done;
    },

    toggleCreate({ event }) {
      event.preventDefault();
      this.adding = !this.adding;
    },
  },
};
