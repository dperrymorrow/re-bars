import Vbars from "../src/index.js";

export default Vbars.create({
  template: /*html*/ `
    <!-- the reactive template we are demo-ing -->
    <h1 {{ watch "header" }}>
      {{ header.title }}
      <small>{{ header.description }}</small>
    </h1>

    <label>
      Edit Title:
      <input value="{{ header.title }}" data-bind="header.title"/>
    </label>

    <label>
      Edit Description:
      <input value="{{ header.description }}" data-bind="header.description"/>
    </label>

    <hr />

    <ul {{ watch "todos" }}>
      {{#each todos}}
      <!-- check if children have a data-key and if so patch that instead of replace -->
        <li {{ keyed id }}>
          <input type="checkbox" {{ isChecked done }} {{ handler "click:toggleDone" id }}/>
          {{#if done }}
            <s>{{ name }}</s>
          {{else}}
            <strong>{{ name }}</strong>
          {{/if}}
          <p>{{ description }}</p>
          <button {{ handler "click:deleteToDo" id }}>X</button>
        </li>
      {{/each}}
    </ul>

    <hr/>

    <div {{ watch "uiState" }}>
      {{#if uiState.adding }}
        <div class="row">
          <label>
            <input type="text" id="new-todo-label" placeholder="the new todo" />
            <button class="push" {{ handler "click.prevent:addItem" }}>Add todo</button>
            <button class="cancel" {{ handler "click:toggleCreate" }}>Cancel</button>
          </label>
        </div>
      {{else}}
        <button class="add" {{ handler "click:toggleCreate" }}>Add another</button>
      {{/if}}
    </div>
  `,

  data: {
    uiState: {
      adding: false,
    },
    header: {
      title: "This is my list of things to do",
      description: "just general items that need done around the house",
    },
    todos: [
      {
        done: false,
        name: "Grocery Shopping",
        description: "get the milk, eggs and bread",
        id: 22,
      },
      {
        done: true,
        name: "Paint the House",
        description: "buy the paint and then pain the house",
        id: 44,
      },
    ],
  },

  methods: {
    deleteToDo({ data }, id) {
      const index = data.todos.findIndex(item => item.id === id);
      data.todos.splice(index, 1);
    },

    addItem({ data, $container }) {
      const $input = $container.querySelector("#new-todo-label");
      data.todos.push({
        done: false,
        name: $input.value,
        id: new Date().getTime(),
      });
      $input.value = "";
      $input.focus();
    },

    toggleDone({ data }, id) {
      const task = data.todos.find(item => item.id === id);
      task.done = !task.done;
    },

    toggleCreate({ data }) {
      data.uiState.adding = !data.uiState.adding;
    },
  },
});
