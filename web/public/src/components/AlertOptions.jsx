import React from 'react';

import _ from 'lodash';

class AlertOptions extends React.Component {
  static propTypes = {
    data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
  };

  renderAlertTypes() {
    return (
      <select>
        {Object.keys(ALERT_TYPES).map((key, index) => {
          return (
            <option value={key} key={index}>
              {_.startCase(_.camelCase(key))}
            </option>
          );
        })}
      </select>
    );
  }

  render() {
    // for each numeric key-value of a candle, add a "crossing" "less than" "greater than" etc alert option.
    // so, when EMA/MA/etc are stored on candles, we can have an option like this: "[x] EMA12: Crossing up"

    // each separate filter (the "filters" property returned from a query)
    // will likely require its own alert options that are sent via the api.
    return (
      <div className='alert-options'>
        <h3>Standard</h3>
        {this.props.data == null || this.props.data.length == 0
          ? <span>No properties to show (no data loaded)</span>
          : <div>
              {Object.keys(this.props.data[0]).map((key, index) => {
                return (
                  <div className='field' key={index}>
                    <input type='checkbox' checked={true/* todo*/} />
                    <strong>{key}</strong>&nbsp;{this.renderAlertTypes()}
                  </div>
                );
              })}
            </div>}
      </div>
    );
  }
}

export default AlertOptions;