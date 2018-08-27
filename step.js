class Step {
  constructor(opts={ requires: [], alertSettings: {}, isRealtime: true }) {
    this._opts = opts;
    
    if (this._opts.isRealtime == null) {
      this._opts.isRealtime = true;
    }
  }

  filter(data, filters) {
  }

  execute(data, filters) {
  }

  getAlertSetting(key) {
    if (this._opts.alertSettings) {
      if (this._opts.alertSettings[key]) {
        return this._opts.alertSettings[key].value || this._opts.alertSettings[key].default || null;
      }
    }

    return null;
  }

  alert(alertSettingKey, message) {
    if (typeof this._opts.onAlert === 'function') {
      this._opts.onAlert({
        timestamp: Date.now(),
        alertSettingKey,
        message 
      });
    }
  }

  get isRealtime() {
    return this._opts.isRealtime;
  }
}

module.exports = Step;