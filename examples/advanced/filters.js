export default {
  template: /*html*/ `
    <div class="filters">
      {{#watch "$props.filters.state" tag="div" }}
        <button {{ disabledIf "completed" }} {{ method "filterBy" "completed" }}>Show Completed</button>
        <button {{ disabledIf "incomplete" }} {{ method "filterBy" "incomplete" }}>Show Incompleted</button>
        <button {{ disabledIf null }} {{ method "filterBy" null }}>Show All</button>
      {{/watch}}

      {{#watch "$props.filters.sortBy,$props.filters.sortDir" tag="div" }}
        <select {{ bound "$props.filters.sortBy" }}>
          <option {{ selectedIf $props.filters.sortBy "name" }} value="name">Sort by Name</option>
          <option {{ selectedIf $props.filters.sortBy "updated" }} value="updated">Sort by Updated at</option>
        </select>

        <select {{ bound "$props.filters.sortDir" }}>
          <option {{ selectedIf $props.filters.sortDir "asc" }} value="asc">Ascending</option>
          <option {{ selectedIf $props.filters.sortDir "desc" }} value="desc">Descending</option>
        </select>
      {{/watch}}
    </div>
  `,

  name: "filters",

  helpers: {
    selectedIf: (current, option) => (current === option ? "selected" : ""),
    disabledIf: (state, { data }) => (data.root.$props.filters.state === state ? "disabled" : ""),
  },

  methods: {
    filterBy(event, state) {
      this.$props.filters.state = state;
    },
  },
};
