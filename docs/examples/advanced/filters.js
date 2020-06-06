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
          <option value="name">Sort by Name</option>
          <option value="updated">Sort by Updated at</option>
        </select>

        <select {{ on "change" "sortDir" }}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
  `,

  helpers: {
    disabledIf: (val, { data }) => (data.root.filters.filterBy === val ? "disabled" : ""),
  },

  data: {
    filters: {
      filterBy: null,
      sortBy: "name",
      sortDir: "asc",
    },
  },

  methods: {
    sortBy(event, val) {
      this.data.filters.sortBy = val;
    },

    sortDir(event) {
      this.data.filters.sortDir = event.currentTarget.value;
    },

    filterBy(event, state) {
      this.data.filters.filterBy = state;
    },
  },
};
