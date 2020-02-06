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

  /* eslint-disable no-console */

  const colors = {
    orange: "#ffc934",
    orangeDark: "#d38809",
    grey: "#073042",
    white: "#FFF",
    red: "#e95233",
    redDark: "#b74129",
    green: "#02d479",
    greenDark: "#0ea760",
    black: "#000000",
  };

  const emoj = {
    error: "💥",
    warn: "⚠️",
    log: "💬",
  };

  const styles = {
    msg: `background: ${colors.black}; color: ${colors.white}; font-weight: bold;`,
    warn: [
      `background: ${colors.orangeDark}; color:${colors.black}; font-weight: bold;`,
      `background: ${colors.orange}; color:${colors.black}; font-weight: bold;`,
    ],
    error: [
      `background: ${colors.redDark}; color:${colors.black}; font-weight: bold;`,
      `background: ${colors.red}; color:${colors.black}; font-weight: bold;`,
    ],
    log: [
      `background: ${colors.greenDark}; color:${colors.black}; font-weight: bold;`,
      `background: ${colors.green}; color:${colors.black}; font-weight: bold;`,
    ],
  };

  function Logger(labels = "MSG") {
    const prefix = Array.isArray(labels) ? labels : [labels];

    const _render = (msg, msgType, data) => {
      msg = `${emoj[msgType]} ${msg}`;

      const message = prefix
        .slice(0, 2)
        .concat([msg])
        .map(str => `%c ${str} `)
        .join("");

      const colors = [styles[msgType][0]];
      if (prefix.length > 1) colors.push(styles[msgType][1]);
      colors.push(styles.msg);

      const args = [message].concat(colors);

      const method = data === null ? console.log : console.groupCollapsed;
      method(...args);
      if (data) {
        console.log(data);
        console.groupEnd();
      }
    };

    return {
      warn: (msg, data = null) => _render(msg, "warn", data),
      error: (msg, data = null) => _render(msg, "error", data),
      log: (msg, data = null) => _render(msg, "log", data),
    };
  }

  const msg = Logger("utils");

  var Utils = {
    watchId(options) {
      return `reactive-key-${options.loc.start.column}${options.loc.start.line}${options.loc.end.column}${options.loc.end.line}`;
    },

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
        if (!(key in pointer)) msg.warn(`${path} was not found in object`, obj);
        if (index + 1 === arr.length) pointer[key] = value;
        return pointer[key];
      }, obj);
    },
  };

  const msg$1 = Logger("Event Handlers");

  function EventHandlers({ $root, methods, proxyData }) {
    return {
      add($container) {
        $container.querySelectorAll("[data-vbars-handler]").forEach($el => {
          const [eventStr, ...rest] = JSON.parse($el.dataset.vbarsHandler);
          const [eventType, methodName] = eventStr.split(":");
          let [listener, ...augs] = eventType.split(".");

          if (!(methodName in methods)) {
            msg$1.warn(`${methodName} not in event methods`, methods);
            return;
          }

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

  const msg$2 = Logger("V-DOM");

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
        // has been deleted
        if (!$v) $e.remove();
        else if (!$v.isEqualNode($e)) {
          // needs replaced, has changed
          const $updated = Utils.swapNodes($v, $e);
          Events.add($updated);
        }
      });
      // this is items that were added via push
      Utils.keyedChildren($vNode).forEach($e => {
        const $real = $realNode.querySelector(`[data-key="${$e.dataset.key}"]`);
        if (!$real) {
          const $newNode = Utils.addChild($realNode, $e);
          Events.add($newNode);
        }
      });
    }

    function patch($target, path) {
      render();

      Array.from($el.querySelectorAll("[data-vbars-watch]"))
        .filter($node => path.startsWith($node.dataset.vbarsWatch))
        .forEach($vNode => {
          const $real = $target.querySelector(`#${$vNode.getAttribute("id")}`);
          if (Utils.isKeyedNode($vNode)) {
            msg$2.log(`comparing keyed arrays ${path}`, $vNode);
            _compareKeys($vNode, $real);
          } else {
            $real.innerHTML = $vNode.innerHTML;
            msg$2.log(`patching ${path}`, $vNode);
            Events.add($real);
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
    register(instance, proxyData) {
      instance.registerHelper("watch", (path, options) => {
        const id = Utils.watchId(options);
        // wrapping in span can mess with layout, should probally have a attr helper instead of a block helper
        return `<span id="${id}" data-vbars-watch="${path}">${options.fn(proxyData)}</span>`;
      });

      instance.registerHelper("handler", function() {
        const args = Array.from(arguments);
        args.splice(-1, 1);
        return new instance.SafeString(`data-vbars-handler='${JSON.stringify(args)}'`);
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
          <li data-key="{{ id }}">
            {{#if done }}
              <input type="checkbox" checked {{ handler "click:toggleDone" id }}/>
              <s>{{ name }}</s>
            {{else}}
              <input type="checkbox" {{ handler "click:toggleDone" id }})"/>
              <strong>{{ name }}</strong>
            {{/if}}
            <p>{{ description }}</p>
            <button {{ handler "click:deleteToDo" id }}>X</button>
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
            <button class="push" {{ handler "click.prevent:addItem" }}>Add todo</button>
            <button class="cancel" {{ handler "click:toggleCreate" }}>Cancel</button>
          </label>
        </div>
      {{else}}
        <button class="add" {{ handler "click:toggleCreate" }}>Add another</button>
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
