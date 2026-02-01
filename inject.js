(function () {
  console.log('[TemuAutoCollection] edit attachShadow');
  const original = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (...args) {
    return original.call(this, { mode: 'open' });
  };
})();