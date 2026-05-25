function hookFunction(target, functionName, callback, options = {}) {
  const {
    before = false,
    preventDoublePatch = true,
    patchFlag = "__patched",
  } = options;

  function tryPatch() {
    const original = target?.[functionName];

    if (typeof original !== "function") {
      setTimeout(tryPatch, 500);
      return;
    }

    if (preventDoublePatch && original[patchFlag]) {
      return;
    }

    const wrapped = function (...args) {
      if (before) {
        callback.apply(this, args);
      }

      const result = original.apply(this, args);

      if (!before) {
        callback.apply(this, args);
      }

      return result;
    };

    wrapped[patchFlag] = true;
    wrapped.__original = original;

    target[functionName] = wrapped;

    console.log(`${functionName} patched`);
  }

  tryPatch();
}
