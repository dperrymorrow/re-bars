export default {
  template: /*html*/ `
    <ul class="main-nav">
      {{#watch "currentHash" }}
        {{#each pages as |page| }}
          <li>
            <a class="{{ active page.path }}" href="{{ page.path }}">
              {{ page.label }}
            </a>
            {{#if page.pages }}
              <ul>
                {{#each page.pages as |subPage| }}
                  <li>
                    <a class="{{ active subPage.path }}" href="{{ subPage.path }}">
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
    active(val, { data }) {
      const page = window.location.pathname.split("/docs/")[1];
      const hash = window.location.hash;
      return [page, `${page}${hash}`].includes(val.replace(data.root.prefix, "")) ? "active" : "";
    },
  },

  hooks: {
    created() {
      this.prefix = Array(
        window.location.pathname.split("/").filter(seg => seg.length && seg !== "docs" && !seg.endsWith(".html")).length
      )
        .fill("../")
        .join("");

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
      prefix: "",
      currentHash: "application",
      pages() {
        return [
          {
            label: "ReBars Introduction",
            path: `${this.prefix}`,
          },

          {
            label: "Examples",
            path: `${this.prefix}examples/`,
            pages: [
              { label: "Simple", path: `${this.prefix}examples/index.html` },
              { label: "Advanced", path: `${this.prefix}examples/advanced/index.html` },
            ],
          },

          {
            label: "A ReBars Application",
            path: `${this.prefix}application.html`,
          },
          {
            label: "A ReBars Component",
            path: `${this.prefix}component.html`,
            pages: [
              { label: "Template", path: `${this.prefix}component.html#template` },
              { label: "Name", path: `${this.prefix}component.html#name` },
              { label: "Date", path: `${this.prefix}component.html#data` },
              { label: "Methods", path: `${this.prefix}component.html#methods` },
            ],
          },
          {
            label: "ReBars Helpers",
            path: `${this.prefix}helpers.html`,
            pages: [
              { label: "watch", path: `${this.prefix}helpers.html#the-watch-helper` },
              { label: "ref", path: `${this.prefix}helpers.html#the-ref-helper` },
              { label: "bound", path: `${this.prefix}helpers.html#the-bound-helper` },
              { label: "method", path: `${this.prefix}helpers.html#the-method-helper` },
              { label: "component", path: `${this.prefix}helpers.html#the-component-helper` },
              { label: "debug", path: `${this.prefix}helpers.html#the-debug-helper` },
            ],
          },
        ];
      },
    };
  },
};
