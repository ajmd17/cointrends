import React from 'react';

class WilliamsFractals extends React.Component {
  static propTypes = {
    fractals: React.PropTypes.arrayOf(React.propTypes.shape({
      timestamp: React.PropTypes.number,
      index: React.PropTypes.number
    })).isRequired,
    data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
  };

  render() {
    /* @TODO */
    return null;
  }
}

export default WilliamsFractals;