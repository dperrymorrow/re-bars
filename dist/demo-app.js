(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.DemoApp = factory());
}(this, (function () { 'use strict';

  var app = {
    template: /*html*/ `
  <div>
    <div class="header-container">
      <h1>
        {{#watch header }}
          <span>{{ header.title }}</span>
          <small>{{ header.description }}</small>
        {{/watch}}
      </h1>

      <label>
        Title:
        <input type="text" {{ bound "header.title" }}/>
      </label>

      <label>
        Description:
        <input type="text" {{ bound "header.description" }}/>
      </label>
    </div>

    <ul class="simple">
      {{#watch "todos.*" }}
        {{#each todos }}
          <li {{ ref id }}>
            <div class="todo">
              <label>
                <input type="checkbox" {{ isChecked done }} {{ method "toggleDone" id }} />
                {{#if done }}
                  <s>{{ name }}</s>
                {{else}}
                  <strong>{{ name }}</strong>
                {{/if}}
              </label>

              <div class="actions">
                <button {{ method "deleteTodo" id }}>delete</button>
              </div>
            </div>
          </li>
        {{/each}}
      {{/watch}}
    </ul>

    {{#watch "adding" }}
      {{#if adding }}
        <form>
          <input type="text" name="name" {{ ref "newName" }} placeholder="the new todo" />
          <button class="push" {{ method "addItem" }}>Add todo</button>
          <button class="cancel" {{ method "toggleCreate" }}>Cancel</button>
        </form>
      {{else}}
        <button class="add" {{ method "toggleCreate" }}>Add another</button>
      {{/if}}
    {{/watch}}
  </div>
  `,

    data() {
      return {
        adding: false,
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
      };
    },

    name: "DemoApp",

    helpers: {
      isChecked: val => (val ? "checked" : ""),
    },

    methods: {
      addItem(event) {
        event.preventDefault();
        const $input = this.$refs().newName;

        this.data.todos.push({
          id: new Date().getTime(),
          name: $input.value,
        });

        $input.value = "";
      },

      deleteTodo(event, id) {
        const index = this.data.todos.findIndex(todo => todo.id === id);
        this.data.todos.splice(index, 1);
      },

      toggleDone(event, id) {
        const todo = this.data.todos.find(todo => todo.id === id);
        todo.done = !todo.done;
      },

      toggleCreate(event) {
        event.preventDefault();
        this.data.adding = !this.data.adding;
      },
    },
  };

  return app;

})));
