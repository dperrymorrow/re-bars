export default {
  template: /*html*/ `
    <div class="filters">
      <div>
        {{#watch "filters.filterBy" }}
          <button {{ disabledIf "completed" }} {{ on "click" "filterBy" "completed" }}>Show Completed</button>
          <button {{ disabledIf "incomplete" }} {{ on "click" "filterBy" "incomplete" }}>Show Incompleted</button>
          <button {{ disabledIf null }} {{ on "click" "filterBy" null }}>Show All</button>
        {{/watch}}
      </div>

      <div>
        <select {{ on "change" "sortBy" }}>
          <option {{ selectedSort "name" }} value="name">Sort by Name</option>
          <option {{ selectedSort "updated" }} value="updated">Sort by Updated at</option>
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

  methods: {
    sortBy({ methods, event }) {
      this.filters.sortBy = event.target.value;
      methods.sort();
    },

    sort({ methods }) {
      this.todos.sort((a, b) => {
        if (this.filters.sortBy === "name") return a.name.localeCompare(b.name);
        else return new Date(a.updated).getTime() - new Date(b.updated).getTime();
      });

      if (this.filters.sortDir === "desc") this.todos.reverse();
      methods.saveLocal();
    },

    sortDir({ event, methods }) {
      this.filters.sortDir = event.currentTarget.value;
      methods.sort();
    },

    filterBy({ methods }, filterBy) {
      this.filters.filterBy = filterBy;
      methods.saveLocal();
    },
  },
};
