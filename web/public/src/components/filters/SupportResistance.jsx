import React from 'react';

import { StraightLine } from "react-stockcharts/lib/series";
import { EdgeIndicator } from 'react-stockcharts/lib/coordinates';

class SupportResistance extends React.Component {
  static propTypes = {
    levels: React.PropTypes.arrayOf(React.PropTypes.number).isRequired
  };

  render() {
    /* @TODO */
    return (
      <div>
        {this.props.levels.map((value, index) => {
          const color = /*value <= this.currentPrice() ? "#00C288" :*/ "#FC1B51";

          return (
            <div key={index}>
              <StraightLine stroke={color} yValue={value} strokeWidth={1}/>
            </div>
          );
        })}
      </div>
    );
  }
}

export default SupportResistance;