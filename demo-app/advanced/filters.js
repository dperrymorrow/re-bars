export default {
  template: /*html*/ `
    <div>
      {{#watch "filters" class="filters" }}
        <div>
          <button {{ disabledIf "completed" }} {{ method "filterBy" "completed" }}>Show Completed</button>
          <button {{ disabledIf "incomplete" }} {{ method "filterBy" "incomplete" }}>Show Incompleted</button>
          <button {{ disabledIf null }} {{ method "filterBy" null }}>Show All</button>
        </div>

        <select {{ method "sortBy:change" }}>
          <option {{ selectedIf "name" }} value="name">Sort by Name</option>
          <option {{ selectedIf "updated" }} value="updated">Sort by Updated at</option>
        </select>

      {{/watch}}
    </div>
  `,

  name: "filters",

  helpers: {
    selectedIf: (field, { data }) => (data.root.filters.sortyBy === field ? "selected" : ""),
    disabledIf: (state, { data }) => (data.root.filters.state === state ? "disabled" : ""),
  },

  methods: {
    sortBy(event) {
      this.data.filters.sortBy = event.target.value;
    },

    filterBy(event, state) {
      this.data.filters.state = state;
    },
  },
};
