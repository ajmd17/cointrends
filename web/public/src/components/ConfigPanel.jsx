import React from 'react';

class ConfigPanel extends React.Component {
  static propTypes = {
    ind: React.PropTypes.object.isRequired,
    values: React.PropTypes.object.isRequired
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

  renderConfigOption(option, value) {
    let type = this._getOptionType(option);

    return (
      <div className='config-option'>
        {type == 'boolean'
          ? <span><input type='checkbox' checked={value != null ? !!value : !!option.default} />&nbsp;{option.text}</span>
          : null}
        {type == 'string'
          ? <span>{option.text}:&nbsp;{option.allowed ? <select value={value}>{option.allowed.map((v, i) => <option key={i}>{v}</option>)}</select> : <input type='text' value={value}/>}</span>
          : null}
        {type == 'number'
          ? <span>{option.text}:&nbsp;<input type='number' max={option.max} min={option.min} value={value} /></span>
          : null}
      </div>
    );
  }

  render() {
    const { ind } = this.props;

    return (
      <div className='config-panel'>
        <hr/>
        {Object.keys(ind.configuration).map((key, index) => {
          return (
            <div key={key}>
              {this.renderConfigOption(ind.configuration[key], this.props.values[key])}
            </div>
          );
        })}
      </div>
    );
  }
}

export default ConfigPanel;