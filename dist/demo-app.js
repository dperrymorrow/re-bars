(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.DemoApp = factory());
}(this, (function () { 'use strict';

  var Utils = {
    isKeyedNode($node) {
      return $node.children.length
        ? Array.from($node.children).every($child => $child.dataset.vbarsKey)
        : false;
    },

    keyedChildren($node) {
      return Array.from($node.children).filter($e => $e.dataset.vbarsKey);
    },

    randomId: () =>
      "_" +
      Math.random()
        .toString(36)
        .substr(2, 9),

    setKey(obj, path, value) {
      const arr = path.split(".");
      arr.reduce((pointer, key, index) => {
        if (!(key in pointer)) throw new Error(`${path} was not found in object`, obj);
        if (index + 1 === arr.length) pointer[key] = value;
        return pointer[key];
      }, obj);
    },
  };

  function VDom({ id, templateFn, proxyData }) {
    const $el = document.createElement("div");
    const render = () => ($el.innerHTML = templateFn(proxyData));

    function _swapNodes($source, $target) {
      const $clone = $source.cloneNode(true);
      $target.parentNode.replaceChild($clone, $target);
    }

    function _addChild($container, $child) {
      const $clone = $child.cloneNode(true);
      $container.appendChild($clone);
    }

    function _compareKeys($vNode, $realNode) {
      console.groupCollapsed("comparing keyed children");
      console.log("real parent", $realNode);
      console.log("virtual parent", $vNode);

      Utils.keyedChildren($realNode).forEach($e => {
        const $v = $vNode.querySelector(`[data-vbars-key="${$e.dataset.vbarsKey}"]`);
        if (!$v) {
          console.log("removing keyed node", $e);
          $e.remove();
        } else if (!$v.isEqualNode($e)) {
          console.log("swapping real", $e);
          console.log("with virual", $v);
          _swapNodes($v, $e);
        }
      });
      // this is items that were added via push
      Utils.keyedChildren($vNode).forEach($v => {
        const $e = $realNode.querySelector(`[data-vbars-key="${$v.dataset.vbarsKey}"]`);
        if (!$e) {
          console.log("could not find real node, adding", $v);
          _addChild($realNode, $v);
        }
      });

      console.groupEnd();
    }

    function patch(path) {
      const $target = document.getElementById(id);
      console.groupCollapsed(`vDOM patching ${path}`);
      render();

      Array.from($el.querySelectorAll("[data-vbars-watch]"))
        .filter($e => path.startsWith($e.dataset.vbarsWatch))
        .forEach($vNode => {
          const $real = $target.querySelector(`[data-vbars-id="${$vNode.dataset.vbarsId}"]`);
          if (Utils.isKeyedNode($vNode)) {
            _compareKeys($vNode, $real);
          } else {
            console.log("replacing", $real);
            console.log("with", $vNode);
            _swapNodes($vNode, $real);
          }
        });

      console.groupEnd();
    }

    return {
      $el,
      render,
      patch,
    };
  }

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

  var Helpers = {
    register({ id, instance, methods, components, proxyData }) {
      window.vbars = window.vbars || { handlers: {} };
      window.vbars.handlers[id] = {
        bind: (event, path) => Utils.setKey(proxyData, path, event.currentTarget.value),
      };
      // we can garbage collect here...

      function _handler() {
        const [eventType, ...args] = arguments;
        const opts = args.splice(-1, 1);

        if (args.some(arg => arg !== null && typeof arg === "object"))
          throw new Error(
            `must only pass primitives as argument to a handler. ${JSON.stringify(args, null, 2)}`
          );

        const handler = { methodName: opts[0].name, eventType, args };
        return new instance.SafeString(
          `on${eventType}="vbars.handlers.${id}.${handler.methodName}(${args.join(",")})"`
        );
      }

      const _findRefs = () => {
        return Array.from(document.getElementById(id)).reduce((obj, $el) => {
          obj[$el.dataset.vbarsRef] = $el;
          return obj;
        }, {});
      };

      const _addData = pairs => {
        return new instance.SafeString(
          Object.keys(pairs)
            .map(key => `data-vbars-${key}='${pairs[key]}'`)
            .join(" ")
        );
      };

      instance.registerHelper("watch", (path, options) => {
        const id = `${options.loc.start.column}${options.loc.start.line}${options.loc.end.column}${options.loc.end.line}`;
        return _addData({ id, watch: path });
      });

      Object.keys(components).forEach(name => {
        instance.registerHelper(name, function() {
          return new instance.SafeString(components[name].render());
        });
      });

      instance.registerHelper("keyed", val => _addData({ key: val }));
      instance.registerHelper("isChecked", val => (val ? "checked" : ""));
      instance.registerHelper("ref", key => _addData({ ref: key }));
      instance.registerHelper(
        "bind",
        path => new instance.SafeString(`oninput="vbars.handlers.${id}.bind(event, '${path}')"`)
      );

      // should throw an error if there is collision of method and comoponent name
      Object.keys(methods).forEach(key => {
        window.vbars.handlers[id][key] = function() {
          return methods[key].call(
            methods,
            { data: proxyData, $refs: _findRefs(), event },
            ...arguments
          );
        };
        instance.registerHelper(key, _handler);
      });
    },
  };

  var Vbars = {
    create({
      template,
      data: rawData,
      components = {},
      methods = {},
      Handlebars = window.Handlebars,
    }) {
      if (!Handlebars) throw new Error("Vbars need Handlebars in order to run!");

      const id = Utils.randomId();
      const instance = Handlebars.create();
      const proxyData = buildProxy(rawData, ({ path }) => vDom.patch(path));

      Helpers.register({ id, instance, methods, components, proxyData });

      const templateFn = instance.compile(`<span id="${id}">${template}</span>`);
      const vDom = VDom({ id, templateFn, proxyData, methods });

      return {
        VbarsComponent: true,
        instance,
        id,
        data: proxyData,
        render() {
          return templateFn(proxyData);
        },
      };
    },
  };

  var SubComponent = Vbars.create({
    template: /*html*/ `
  <textarea {{ bind "display" }}>{{ display }}</textarea>
  <p {{ watch "display" }}>{{ display }}</p>
`,

    data: {
      display: "sup this is a sub component",
    },
  });

  var app = Vbars.create({
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
          <button class="push" {{ addItem "click" }}>Add todo</button>
          <button class="cancel" {{ toggleCreate "click" uiState.adding }}>Cancel</button>
        </form>
      {{else}}
        <button class="add" {{ toggleCreate "click" uiState.adding }}>Add another</button>
      {{/if}}

      {{ SubComponent }}
    </div>
  `,

    components: {
      SubComponent,
    },

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

      toggleCreate({ event, data }, adding) {
        event.preventDefault();
        data.uiState.adding = !adding;
      },
    },
  });

  return app;

})));
