export default {
  template: /*html*/ `
  <div>
    {{#watch "header.*" tag="h1" }}
      <h1 >
        {{ header.title }}
        <small>{{ header.description }}</small>
      </h1>
    {{/watch}}

    <label>
      Title:
      <input value="{{ header.title }}" {{ bind "header.title" }}/>
    </label>

    <label>
      Description:
      <input value="{{ header.description }}" {{ bind "header.description" }}/>
    </label>

    {{#watch "todos.length" tag="ul" }}
      {{#each todos }}
        {{#watch . tag="li" }}
          <label>
            <input type="checkbox" {{ isChecked done }} {{ method "toggleDone" id done }}/>
            {{#if done }}
              <s>{{ name }}</s>
            {{else}}
              <strong>{{ name }}</strong>
            {{/if}}
          </label>
          <button {{ method "deleteToDo" @index }}>X</button>
        {{/watch}}
      {{/each}}
    {{/watch}}

    {{#watch "uiState.adding" }}
      {{#if uiState.adding }}
        <form>
          <input type="text" name="name" {{ ref "newName" }} placeholder="the new todo" />
          <button class="push" {{ method "addItem" }}>Add todo</button>
          <button class="cancel" {{ method "toggleCreate" uiState.adding }}>Cancel</button>
        </form>
      {{else}}
        <button class="add" {{ method "toggleCreate" uiState.adding }}>Add another</button>
      {{/if}}
    {{/watch}}
  </div>
  `,

  data: {
    uiState: {
      adding: false,
    },
    header: {
      title: "Todos",
      description: "some things that need done",
    },
    todos: [
      {
        done: false,
        name: "Grocery Shopping",
        id: 22,
      },
      {
        done: true,
        name: "Paint the House",
        id: 44,
      },
    ],
  },

  name: "DemoApp",

  helpers: {
    isChecked: val => (val ? "checked" : ""),
  },

  methods: {
    deleteToDo({ data }, event, index) {
      data.todos.splice(index, 1);
    },

    addItem({ $refs, data }, event) {
      event.preventDefault();

      data.todos.push({
        id: new Date().getTime(),
        name: $refs.newName.value,
      });

      $refs.newName.value = "";
    },

    toggleDone({ data }, event, id, done) {
      data.todos.find(item => item.id === id).done = !done;
    },

    toggleCreate({ data }, event, adding) {
      event.preventDefault();
      data.uiState.adding = !adding;
    },
  },
};
