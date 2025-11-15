(function () {
  console.log('[TemuAutoCollection] edit attachShadow');
  const original = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (...args) {
    console.log('[TemuAutoCollection] attachShadow called', args);
    return original.call(this, { mode: 'open' });
  };
})();