import React from 'react';

class ConfigPanel extends React.Component {
  static propTypes = {
    ind: React.PropTypes.object.isRequired,
    values: React.PropTypes.object.isRequired
  };

  _getOptionValue = (key) => {
    if (this.props.values[key] == null) {
      return this.props.ind.configuration[key].default;
    }

    return null;
  };

  _getOptionType = (option) => {
    let type = null;

    if (option.default) {
      type = typeof option.default;
    }

    if (option.allowed) {
      for (let i = 0; i < option.allowed.length; i++) {
        if (typeof option.allowed[i] !== type) {
          type = 'string';
          break;
        }
      }
    }

    return type;
  };

  renderConfigOption(key) {
    let option = this.props.ind.configuration[key];
    let type = this._getOptionType(option);

    return (
      <div className='config-option'>
        {type == 'boolean'
          ? <span><input type='checkbox' checked={!!this._getOptionValue(key)} />&nbsp;{option.text}</span>
          : null}
        {type == 'string'
          ? <span>{option.text}:&nbsp;{option.allowed ? <select value={this._getOptionValue(key)}>{option.allowed.map((v, i) => <option key={i}>{v}</option>)}</select> : <input type='text' value={this._getOptionValue(key)}/>}</span>
          : null}
        {type == 'number'
          ? <span>{option.text}:&nbsp;<input type='number' max={option.max} min={option.min} value={this._getOptionValue(key)} /></span>
          : null}
      </div>
    );
  }

  render() {
    const { ind } = this.props;

    return (
      <div className='config-panel'>
        {Object.keys(ind.configuration).map((key, index) => {
          return (
            <div key={key}>
              {this.renderConfigOption(key)}
            </div>
          );
        })}
      </div>
    );
  }
}

export default ConfigPanel;