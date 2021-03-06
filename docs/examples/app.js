const { ReBars } = window;
let counter = 3;

export default {
  template: ReBars.load("./app.hbs"),

  trace: true,

  data: {
    adding: false,
    header: {
      title: "Todos",
      description: "some things that need done",
    },
    todos: [
      {
        id: 1,
        done: false,
        name: "Grocery Shopping",
      },
      {
        id: 2,
        done: true,
        name: "Paint the House",
      },
    ],
  },

  methods: {
    addItem({ $refs, event }) {
      event.preventDefault();
      const $input = $refs().newName;

      this.todos.push({
        done: false,
        id: counter++,
        name: $input.value,
      });

      $input.value = "";
    },

    deleteTodo({ rootData }) {
      const index = rootData.todos.findIndex(todo => todo.id === this.id);
      rootData.todos.splice(index, 1);
    },

    toggleDone() {
      this.done = !this.done;
    },

    toggleCreate({ event }) {
      event.preventDefault();
      this.adding = !this.adding;
    },
  },
};
