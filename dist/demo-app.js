(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.DemoApp = factory());
}(this, (function () { 'use strict';

  var app = {
    template: /*html*/ `
    {{#watch "header.*" }}
      <h1 >
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
        {{#watchEach todos }}
          <li>
            <label for="{{ id }}">
              <input id="{{ id }}" type="checkbox" {{ isChecked done }} {{ method "click" "toggleDone" id done }}/>
              {{#if done }}
                <s>{{ name }}</s>
              {{else}}
                <strong>{{ name }}</strong>
              {{/if}}
            </label>
            <p>{{ description }}</p>
            <button {{ method "click" "deleteToDo" @index }}>X</button>
          </li>
        {{/watchEach}}
      </ul>
    {{/watch}}

    <hr/>

    {{#watch "uiState.adding" }}
      {{#if uiState.adding }}
        <form>
          <input type="text" name="name" {{ ref "newName" }} placeholder="the new todo" />
          <textarea name="description" {{ ref "newDescrip" }}></textarea>
          <button class="push" {{ method "click" "addItem" }}>Add todo</button>
          <button class="cancel" {{ method "click" "toggleCreate" uiState.adding }}>Cancel</button>
        </form>
      {{else}}
        <button class="add" {{ method "click" "toggleCreate" uiState.adding }}>Add another</button>
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

    name: "DemoApp",

    methods: {
      deleteToDo({ data }, index) {
        data.todos.splice(index, 1);
      },

      addItem({ $refs, data, event }) {
        event.preventDefault();

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

      toggleCreate({ event, data }, adding) {
        event.preventDefault();
        data.uiState.adding = !adding;
      },
    },
  };

  return app;

})));
