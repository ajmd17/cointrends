import React from 'react';

class AlertOptions extends React.Component {
  render() {
    // for each numeric key-value of a candle, add a "crossing" "less than" "greater than" etc alert option.
    // so, when EMA/MA/etc are stored on candles, we can have an option like this: "[x] EMA12: Crossing up"

    // each separate filter (the "filters" property returned from a query)
    // will likely require its own alert options that are sent via the api.
  }
}

export default AlertOptions;