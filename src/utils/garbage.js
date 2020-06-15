import Dom from "./dom.js";
import Config from "../config.js";

const { watch, method } = Config.attrs;

export default function($app, { renders }) {
  const observer = new MutationObserver(mutationList => {
    Object.entries(renders).forEach(([id, render]) => {
      if (!$app.contains(render.$el)) delete renders[id];
    });

    // mutationList.forEach(({ addedNodes, removedNodes }) => {
    //   removedNodes.forEach(cleanup);
    //   // addedNodes.forEach(register);
    // });

    // Object.entries(store.renders).forEach(([id, render]) => {
    //   if (render.$el && !$app.contains(render.$el)) delete store.renders[id];
    // });

    console.log(Object.keys(renders).length);
  });

  observer.observe($app, {
    childList: true,
    attributes: true,
    subtree: true,
  });
}
