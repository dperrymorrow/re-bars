const { ReBars } = window;

export default {
  template: ReBars.load("./templates/app.hbs"),
  partials: {
    Child: ReBars.load("./templates/child.hbs"),
    GrandChild: ReBars.load("./templates/grandchild.hbs"),
  },
};
