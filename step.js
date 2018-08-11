class Step {
  constructor(opts={ requires: [] }) {
    this._opts = opts;
  }

  filter(data, filters) {
  }

  execute(data, filters) {
  }

  alert(message) {
    if (typeof this._opts.onAlert === 'function') {
      this._opts.onAlert({
        timestamp: Date.now(),
        message 
      });
    }
  }
}

module.exports = Step;