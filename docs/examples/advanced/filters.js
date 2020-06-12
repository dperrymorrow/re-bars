export default {
  template: /*html*/ `
    <div class="filters">
      <div>
        {{#watch "filters.filterBy" }}
          <button {{ disabledIf "completed" }} {{ on "click" "filterBy" "completed" }}>Show Only Completed</button>
          <button {{ disabledIf "incomplete" }} {{ on "click" "filterBy" "incomplete" }}>Show Only Incompleted</button>
          <button {{ disabledIf null }} {{ on "click" "filterBy" null }}>Show All</button>
        {{/watch}}
      </div>

      <div>
        <select {{ on "change" "sortBy" }}>
          <option {{ selectedSort "name" }} value="name">Sort by Name</option>
          <option {{ selectedSort "updated" }} value="updated">Sort by Updated at</option>
          <option {{ selectedSort "completed" }} value="completed">Sort by Completed</option>
        </select>

        <select {{ on "change" "sortDir" }}>
          <option {{ selectedDir "asc" }} value="asc">Ascending</option>
          <option {{ selectedDir "desc" }} value="desc">Descending</option>
        </select>
      </div>
    </div>
  `,

  helpers: {
    selectedSort(val) {
      return this.filters.sortBy === val ? "selected" : "";
    },

    selectedDir(val) {
      return this.filters.sortDir === val ? "selected" : "";
    },

    disabledIf(val) {
      return this.filters.filterBy === val ? "disabled" : "";
    },
  },

  data: {
    filteredTodos() {
      const { filterBy, sortBy, sortDir } = this.data.filters;

      const filtered = this.data.todos.filter(todo => {
        if (filterBy === "incomplete") return !todo.done;
        if (filterBy === "completed") return todo.done;
        return true;
      });

      filtered.sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        else if (sortBy === "completed") return a.done - b.done;
        else return new Date(a.updated).getTime() - new Date(b.updated).getTime();
      });

      if (sortDir === "desc") filtered.reverse();

      return filtered;
    },

    filters: {
      filterBy: null,
      sortBy: "completed",
      sortDir: "asc",
    },
  },

  methods: {
    sortBy({ methods, event }) {
      this.filters.sortBy = event.target.value;
    },

    sortDir({ event, methods }) {
      this.filters.sortDir = event.currentTarget.value;
    },

    filterBy({ methods }, filterBy) {
      this.filters.filterBy = filterBy;
    },
  },
};
