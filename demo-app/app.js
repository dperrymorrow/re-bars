// import ReactiveHandlebars from "./lib/index.js";

window.demoApp = Vbars.create({
  template: /*html*/ `
    <!-- the reactive template we are demo-ing -->
      {{#watch 'header'}}
        <h1>
          {{ header.title }}
          <small>{{ header.description }}</small>
        </h1>
      {{/watch}}

      <label>
        Edit Title:
        <input value="{{ header.title }}" data-bind="header.title"/>
      </label>

      <label>
        Edit Description:
        <input value="{{ header.description }}" data-bind="header.description"/>
      </label>


    <hr />

    <ul>
      {{#watch 'todos'}}
        {{#each todos}}
        <!-- check if children have a data-key and if so patch that instead of replace -->
          <li data-key="{{ name }}">
            {{#if done }}
              <input type="checkbox" checked data-handler="click:toggleDone"/>
              <s>{{ name }}</s>
            {{else}}
              <input type="checkbox" data-handler="click:toggleDone"/>
              <strong>{{ name }}</strong>
            {{/if}}
            <p>{{ description }}</p>
            <button data-handler="click:deleteToDo">X</button>
          </li>
        {{/each}}
      {{/watch}}
    </ul>

    <hr/>

    {{#watch 'uiState'}}
      {{#if uiState.adding }}
        <div class="row">
          <label>
            <input type="text" id="new-todo-label" placeholder="the new todo" />
            <button class="push" data-handler="click.prevent:addItem">Add todo</button>
            <button class="cancel" data-handler="click.prevent:toggleCreate">Cancel</button>
          </label>
        </div>
      {{else}}
        <button class="add" data-handler="click:toggleCreate">Add another</button>
      {{/if}}
    {{/watch}}
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
      },
      {
        done: true,
        name: "Paint the House",
        description: "buy the paint and then pain the house",
      },
    ],
  },

  eventHandlers: {
    deleteToDo({ event, data }) {
      const name = event.target.parentNode.dataset.key;
      const index = data.todos.findIndex(item => item.name === name);
      data.todos.splice(index, 1);
    },

    addItem({ data, $container }) {
      const $input = $container.querySelector("#new-todo-label");
      data.todos.push({
        done: false,
        name: $input.value,
      });
      $input.value = "";
      $input.focus();
    },

    toggleDone({ event, data }) {
      const name = event.target.parentNode.dataset.key;
      const task = data.todos.find(item => item.name === name);
      task.done = !task.done;
    },

    toggleCreate({ data }) {
      data.uiState.adding = !data.uiState.adding;
    },
  },
});
