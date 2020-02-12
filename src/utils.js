export default {
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
