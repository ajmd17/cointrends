class Step {
  constructor(opts={ requires: [], alertSettings: {}, configuration: {}, isRealtime: true }) {
    this._opts = opts;

    if (this._opts.configuration == null) {
      this._opts.configuration = {};
    }
    
    if (this._opts.isRealtime == null) {
      this._opts.isRealtime = true;
    }
  }

  filter(data, filters) {
  }

  execute(data, filters) {
  }

  getConfigurationOption(key) {
    if (this._opts.configuration[key]) {
      return this._opts.configuration[key].value || this._opts.configuration[key].default || null;
    }

    return null;
  }

  get isRealtime() {
    return this._opts.isRealtime;
  }
}

module.exports = Step;