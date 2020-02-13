import Vbars from "../../src/index.js";
import AddComponent from "./add-component.js";

export default Vbars.component({
  template: /*html*/ `
    <div>
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
          {{ AddComponent }}
        {{else}}
          <button class="add" {{ showAdd "click" }}>Add another</button>
        {{/if}}
      </div>
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
        description: "buy the paint and then paint the house",
        id: 44,
      },
    ],
  },

  components: {
    AddComponent,
  },

  methods: {
    deleteToDo({ data }, index) {
      data.todos.splice(index, 1);
    },

    toggleDone({ data }, id, done) {
      data.todos.find(item => item.id === id).done = !done;
    },

    showAdd({ event, data }) {
      event.preventDefault();
      data.uiState.adding = true;
    },
  },
});
