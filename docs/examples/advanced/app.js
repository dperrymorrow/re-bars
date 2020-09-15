const { ReBars } = window;

export default {
  template: ReBars.load("./templates/app.hbs"),
  trace: true,

  data: {
    header: {
      title: "ReBars Todos",
      description: "Some things that need done",
    },
    isAdding: false,
    filters: {
      filterBy: null,
      sortBy: "name",
    },
    todos: [
      {
        done: false,
        display: true,
        name: "Code some Javascript",
        updated: "1/27/2020, 9:37:10 AM",
      },
      {
        done: false,
        display: true,
        name: "Wash the car",
        updated: "3/1/2020, 12:37:10 PM",
      },
      {
        done: true,
        display: true,
        name: "Shopping for groceries",
        updated: "2/27/2020, 2:37:10 PM",
      },

      {
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
    isChecked() {
      return this.todo.done ? "checked" : "";
    },

    selectedSort(context, val) {
      return this.filters.sortBy === val ? "selected" : "";
    },

    selectedDir(context, val) {
      return this.filters.sortDir === val ? "selected" : "";
    },

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

    sortBy({ event }) {
      this.filters.sortBy = event.target.value;
    },

    filterBy(context, filterBy) {
      this.filters.filterBy = filterBy;
    },

    updateTitle({ event, methods }) {
      this.header.title = event.target.value;
    },

    updateDescription({ event, methods }) {
      this.header.description = event.target.value;
    },

    async toggleAdd({ $nextTick, event, methods, $refs }) {
      event.preventDefault();
      this.isAdding = !this.isAdding;

      await $nextTick();
      const $input = $refs().newName;
      if ($input) $input.focus();
    },

    addItem({ event, methods, $refs }) {
      event.preventDefault();
      const $input = $refs().newName;

      this.todos.push({
        name: $input.value,
        display: true,
        done: false,
        updated: new Date().toLocaleString(),
      });

      this.filters.filterBy = null;
      $input.value = "";
      $input.focus();
    },

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

    toggleDone() {
      this.todo.done = !this.todo.done;
    },
  },
};
