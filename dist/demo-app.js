(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.DemoApp = factory());
}(this, (function () { 'use strict';

  function buildProxy(raw, callback, tree = []) {
    return new Proxy(raw, {
      get: function(target, prop) {
        const value = Reflect.get(...arguments);
        if (value !== null && typeof value === "object" && prop !== "methods")
          return buildProxy(value, callback, tree.concat(prop));
        else return value;
      },

      set: function(target, prop) {
        const ret = Reflect.set(...arguments);
        callback({ path: tree.concat(prop).join(".") });
        return ret;
      },

      deleteProperty: function(target, prop) {
        const ret = Reflect.deleteProperty(...arguments);
        callback({ path: tree.concat(prop).join(".") });
        return ret;
      },
    });
  }

  var Utils = {
    isKeyedNode($node) {
      if ($node.children.length)
        return Array.from($node.children).every($child => $child.dataset.key);
      return false;
    },

    keyedChildren($node) {
      return Array.from($node.children).filter($e => $e.dataset.key);
    },

    swapNodes($source, $target) {
      const $clone = $source.cloneNode(true);
      $target.parentNode.replaceChild($clone, $target);
      return $clone;
    },

    addChild($container, $child) {
      const $clone = $child.cloneNode(true);
      $container.appendChild($clone);
      return $clone;
    },

    setKey(obj, path, value) {
      const arr = path.split(".");
      arr.reduce((pointer, key, index) => {
        if (!(key in pointer)) throw new Error(`${path} was not found in object`, obj);
        if (index + 1 === arr.length) pointer[key] = value;
        return pointer[key];
      }, obj);
    },
  };

  function EventHandlers({ $root, methods, proxyData }) {
    return {
      add($container) {
        $container.querySelectorAll("[data-vbars-handler]").forEach($el => {
          const [eventStr, ...rest] = JSON.parse($el.dataset.vbarsHandler);
          const [eventType, methodName] = eventStr.split(":");
          let [listener, ...augs] = eventType.split(".");

          if (!(methodName in methods))
            throw new Error(
              `"${methodName}" not in Vbars component's methods. Availible methods: ${Object.keys(
              methods
            ).join(", ")}`
            );

          // gonna have to store this to remove them when patching
          $el.addEventListener(listener, event => {
            if (augs.includes("prevent")) {
              event.stopPropagation();
              event.preventDefault();
            }
            methods[methodName]({ event, data: proxyData, $root, $container }, ...rest);
          });
          delete $el.dataset.vbarsHandler;
        });

        $container.querySelectorAll("[data-vbars-bind]").forEach($el => {
          $el.addEventListener("input", $event => {
            Utils.setKey(proxyData, $el.dataset.vbarsBind, $event.currentTarget.value);
          });
        });
      },
    };
  }

  function VDom({ $root, templateFn, proxyData }) {
    const $el = document.createElement("div");
    const Events = EventHandlers(...arguments);
    const render = () => ($el.innerHTML = templateFn(proxyData));

    function replace() {
      render();
      $root.innerHTML = $el.innerHTML;
      Events.add($root);
    }

    function _compareKeys($vNode, $realNode) {
      Utils.keyedChildren($realNode).forEach($e => {
        const $v = $vNode.querySelector(`[data-key="${$e.dataset.key}"]`);
        if (!$v) $e.remove();
        else if (!$v.isEqualNode($e)) Events.add(Utils.swapNodes($v, $e));
      });
      // this is items that were added via push
      Utils.keyedChildren($vNode).forEach($e => {
        const $real = $realNode.querySelector(`[data-key="${$e.dataset.key}"]`);
        if (!$real) Events.add(Utils.addChild($realNode, $e));
      });
    }

    function patch($target, path) {
      render();

      Array.from($el.querySelectorAll("[data-vbars-watch]"))
        .filter($e => path.startsWith($e.dataset.vbarsWatch))
        .forEach($vNode => {
          const $real = $target.querySelector(`[data-vbars-id="${$vNode.dataset.vbarsId}"]`);
          if (Utils.isKeyedNode($vNode)) {
            console.log(`comparing keyed arrays ${path}`, $vNode);
            _compareKeys($vNode, $real);
          } else {
            console.log(`patching ${path}`, $vNode);
            Events.add(Utils.swapNodes($vNode, $real));
          }
        });
    }

    return {
      $el,
      render,
      replace,
      patch,
    };
  }

  var Helpers = {
    register(instance) {
      instance.registerHelper("watch", (path, options) => {
        const identifier = `${options.loc.start.column}${options.loc.start.line}${options.loc.end.column}${options.loc.end.line}`;
        return new instance.SafeString(`data-vbars-id="${identifier}" data-vbars-watch="${path}"`);
      });

      instance.registerHelper("handler", function() {
        const args = Array.from(arguments);
        args.splice(-1, 1);
        return new instance.SafeString(`data-vbars-handler='${JSON.stringify(args)}'`);
      });

      instance.registerHelper("isChecked", function(val) {
        return new instance.SafeString(val ? "checked" : "");
      });
    },
  };

  var Vbars = {
    create({ template, data: rawData, methods = {} }) {
      let $root, vDom;

      const instance = window.Handlebars.create();
      const proxyData = buildProxy(rawData, ({ path }) => vDom.patch($root, path));
      Helpers.register(instance, proxyData);
      const templateFn = instance.compile(template);

      return {
        instance,
        data: proxyData,
        render($target) {
          $root = $target;
          vDom = VDom({ $root, templateFn, proxyData, methods });
          vDom.replace();
        },
      };
    },
  };

  var app = Vbars.create({
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
        <li data-key="{{ id }}">
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

  return app;

})));
