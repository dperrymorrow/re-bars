export default {
  template: /*html*/ `
  <div>
    {{#watch "isAdding" }}
      {{#if isAdding }}
        <form>
          {{#watch}}
            <h3>{{ newName }}</h3>
            <input type="text" {{ bound "newName" }} placeholder="the new todo" />
          {{/watch}}

          <button class="push" {{ method "addItem" }}>Add todo</button>
          <button class="cancel" {{ method "toggleAdd" }}>Cancel</button>
        </form>
      {{ else }}
        <button class="add" {{ method "toggleAdd" }}>Add another</button>
      {{/if}}
    {{/watch}}
  </div>
  `,

  name: "AddTodo",

  data() {
    return {
      isAdding: false,
      newName: "",
    };
  },

  methods: {
    toggleAdd(event) {
      event.preventDefault();
      this.isAdding = !this.isAdding;
    },

    addItem(event) {
      event.preventDefault();

      this.$emit("addTodo", {
        name: this.newName,
        id: new Date().getTime(),
        updated: new Date().toLocaleString(),
      });

      this.newName = "";
    },
  },
};
