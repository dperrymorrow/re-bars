const { ReBars } = window;
let counter = 5;

export default {
  template: ReBars.load("./templates/app.hbs"),
  trace: true,

  data: {
    header: {
      title: "ReBars Todos",
      description: "Some things that need done",
    },
    isAdding: false,
    newName: "",
    filters: {
      filterBy: null,
      sortBy: "name",
    },
    todos: [
      {
        id: 1,
        done: false,
        display: true,
        name: "Code some Javascript",
        updated: "1/27/2020, 9:37:10 AM",
      },
      {
        id: 2,
        done: false,
        display: true,
        name: "Wash the car",
        updated: "3/1/2020, 12:37:10 PM",
      },
      {
        id: 3,
        done: true,
        display: true,
        name: "Shopping for groceries",
        updated: "2/27/2020, 2:37:10 PM",
      },

      {
        id: 4,
        done: true,
        display: true,
        name: "Go for a run",
        updated: "1/15/2020, 10:37:10 PM",
      },
    ],
  },

  watch: {
    "filters.sortBy"() {
      const { sortBy } = this.filters;
      this.todos = this.todos.sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        else return new Date(a.updated).getTime() - new Date(b.updated).getTime();
      });
    },

    "filters.filterBy"({ methods }) {
      methods.filter();
    },

    "todos(.*).done"({ methods }) {
      methods.filter();
    },
  },

  helpers: {
    disabledIf(context, val) {
      return this.filters.filterBy === val ? "disabled" : "";
    },
  },

  partials: {
    Todo: ReBars.load("./templates/todo.hbs"),
    Filters: ReBars.load("./templates/filters.hbs"),
    Add: ReBars.load("./templates/add.hbs"),
  },

  methods: {
    filter() {
      const filtering = this.filters.filterBy;
      this.todos.forEach(todo => {
        if (filtering === "incomplete") todo.display = todo.done === false;
        else if (filtering === "completed") todo.display = todo.done === true;
        else todo.display = true;
      });
    },

    async toggleAdd({ $nextTick, event, $refs }) {
      event.preventDefault();
      this.isAdding = !this.isAdding;
      // we have to wait for the render to take place
      await $nextTick();
      const $input = $refs().newName;
      if ($input) $input.focus();
    },

    async addItem({ event, $refs, $nextTick }) {
      event.preventDefault();

      this.todos.push({
        name: this.newName,
        display: true,
        done: false,
        id: counter++,
        updated: new Date().toLocaleString(),
      });

      this.filters.filterBy = null;
      this.newName = "";
      await $nextTick();
      $refs().newName.focus();
    },

    remove({ methods, rootData }) {
      const index = rootData.todos.findIndex(todo => todo.id === this.id);
      rootData.todos.splice(index, 1);
    },

    toggleEdit() {
      this.todo.isEditing = !this.todo.isEditing;
    },

    toggleDone() {
      this.todo.done = !this.todo.done;
    },
  },
};
