export default {
  template: /*html*/ `
    <div class="filters">
      {{#watch "filters.state" tag="div" }}
        <button {{ disabledIf "completed" }} {{ method "filterBy" "completed" }}>Show Completed</button>
        <button {{ disabledIf "incomplete" }} {{ method "filterBy" "incomplete" }}>Show Incompleted</button>
        <button {{ disabledIf null }} {{ method "filterBy" null }}>Show All</button>
      {{/watch}}

      {{#watch filters tag="div" }}
        <select {{ bound "filters.sortBy" }}>
          <option {{ selectedIf filters.sortBy "name" }} value="name">Sort by Name</option>
          <option {{ selectedIf filters.sortBy "updated" }} value="updated">Sort by Updated at</option>
        </select>
        
        <select {{ bound "filters.sortDir" }}>
          <option {{ selectedIf filters.sortDir "asc" }} value="asc">Ascending</option>
          <option {{ selectedIf filters.sortDir "desc" }} value="desc">Descending</option>
        </select>
      {{/watch}}
    </div>
  `,

  name: "filters",

  helpers: {
    selectedIf: (current, option) => (current === option ? "selected" : ""),
    disabledIf: (state, { data }) => (data.root.filters.state === state ? "disabled" : ""),
  },

  methods: {
    filterBy(event, state) {
      this.data.filters.state = state;
    },
  },
};
