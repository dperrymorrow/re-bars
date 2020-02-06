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
      <input value="{{ header.title }}" {{ bind "header.title" }}/>
    </label>

    <label>
      Edit Description:
      <input value="{{ header.description }}" {{ bind "header.description" }}/>
    </label>

    <hr />

    <ul {{ watch "todos" }}>
      {{#each todos}}
      <!-- check if children have a data-key and if so patch that instead of replace -->
        <li {{ keyed id }}>
          <label for="{{ id }}">
            <input id="{{ id }}" type="checkbox" {{ isChecked done }} {{ toggleDone "click" id done }}/>
            {{#if done }}
              <s>{{ name }}</s>
            {{else}}
              <strong>{{ name }}</strong>
            {{/if}}
          </label>
          <p>{{ description }}</p>
          <button {{ deleteToDo "click" @index }}>X</button>
        </li>
      {{/each}}
    </ul>

    <hr/>

    <div {{ watch "uiState" }}>
      {{#if uiState.adding }}
        <form>
          <input type="text" name="name" {{ ref "newName" }} placeholder="the new todo" />
          <textarea name="description" {{ ref "newDescrip" }}></textarea>
          <button class="push" {{ addItem "click.prevent" }}>Add todo</button>
          <button class="cancel" {{ toggleCreate "click.prevent" uiState.adding }}>Cancel</button>
        </form>
      {{else}}
        <button class="add" {{ toggleCreate "click" uiState.adding }}>Add another</button>
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
    deleteToDo({ data }, index) {
      data.todos.splice(index, 1);
    },

    addItem({ $refs, data }) {
      data.todos.push({
        id: new Date().getTime(),
        name: $refs.newName.value,
        description: $refs.newDescrip.value,
      });

      $refs.newName.value = $refs.newDescrip.value = "";
    },

    toggleDone({ data }, id, done) {
      data.todos.find(item => item.id === id).done = !done;
    },

    toggleCreate({ data }, adding) {
      data.uiState.adding = !adding;
    },
  },
});
