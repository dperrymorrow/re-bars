import Utils from "./utils.js";

export default {
  trigger(...args) {
    const [appId, cId, methodName, ...params] = args;
    const scope = Utils.getStorage(appId, cId).scope;
    const method = scope.methods[methodName];
    if (!method) throw new Error(`component:${scope.name} ${methodName} is not a defined method`);
    method(...params);
  },

  bound(appId, cId, event, path) {
    const scope = Utils.getStorage(appId, cId).scope;
    Utils.setKey(scope.data, path, event.target.value);
  },
};
