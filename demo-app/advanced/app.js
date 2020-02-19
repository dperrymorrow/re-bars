import AddComponent from "./add.js";
import TodoComponent from "./todo.js";

export default {
  template: /*html*/ `
    <div>
      {{#watch "header.*" }}
        <h1>
          {{ header.title }}
          <small>{{ header.description }}</small>
        </h1>
      {{/watch}}

       <label>
         Edit Title:
         <input value="{{ header.title }}" {{ bind "header.title" }}/>
       </label>

       <label>
         Edit Description:
         <input value="{{ header.description }}" {{ bind "header.description" }}/>
       </label>

       <hr />

      {{#watch "todos.length" }}
        <ul>
          {{#each todos}}
            {{ TodoComponent index=@index id=id }}
          {{/each}}
        </ul>
      {{/watch}}


       {{#watch "uiState.adding" }}
         <div>
           {{#if uiState.adding }}
             {{ AddComponent }}
           {{else}}
             <button class="add" {{ showAdd "click" }}>Add another</button>
           {{/if}}
         </div>
       {{/watch}}
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
    TodoComponent,
  },

  methods: {
    showAdd({ event, data }) {
      event.preventDefault();
      data.uiState.adding = true;
    },
  },
};
