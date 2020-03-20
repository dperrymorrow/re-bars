export default {
  template: /*html*/ `
    <ul class="main-nav">
      {{#watch "currentHash" }}
        {{#each pages as |page| }}
          <li>
            <a class="{{ active page.path }}" href="{{ page.path }}">{{ page.label }}</a>
            {{#if page.pages }}
              <ul>
                {{#each page.pages as |subPage| }}
                  <li>
                    <a class="{{ active subPage.path }}" href="{{ page.path }}{{ subPage.path }}">
                      {{ subPage.label }}
                    </a>
                  </li>
                {{/each}}
              </ul>
            {{/if}}
          </li>
        {{/each}}
      {{/watch}}
    </ul>
  `,

  name: "nav",

  helpers: {
    active: val => (window.location.hash === val || window.location.pathname.split("/").pop() === val ? "active" : ""),
  },

  hooks: {
    created() {
      if (window.location.hash) this.$methods.hashChange();
      window.addEventListener("hashchange", () => {
        this.$methods.hashChange();
      });
    },
  },

  methods: {
    hashChange() {
      this.currentHash = window.location.hash.replace("#", "");
    },
  },

  data() {
    return {
      currentHash: "application",
      pages: [
        {
          label: "ReBars Introduction",
          path: "index.html",
        },
        {
          label: "A ReBars Application",
          path: "application.html",
        },
        {
          label: "A ReBars Component",
          path: "component.html",
          pages: [
            { label: "Template", path: "#template" },
            { label: "Name", path: "#name" },
            { label: "Date", path: "#data" },
            { label: "Methods", path: "#methods" },
          ],
        },
        {
          label: "ReBars Helpers",
          path: "helpers.html",
          pages: [
            { label: "watch", path: "#the-watch-helper" },
            { label: "ref", path: "#the-ref-helper" },
            { label: "bound", path: "#the-bound-helper" },
            { label: "method", path: "#the-method-helper" },
            { label: "component", path: "#the-component-helper" },
            { label: "debug", path: "#the-debug-helper" },
          ],
        },
      ],
    };
  },
};
