import React from 'react';

import { StraightLine } from "react-stockcharts/lib/series";
import { EdgeIndicator } from 'react-stockcharts/lib/coordinates';

class SupportResistance extends React.Component {
  static propTypes = {
    levels: React.PropTypes.arrayOf(React.PropTypes.number).isRequired
  };

  render() {
    return (
      <div>
        {this.props.levels.map((value, index) => {
          const color = /*value <= this.currentPrice() ? "#00C288" :*/ "#197CFE";

          return (
            <div key={index}>
              <StraightLine stroke={color} yValue={value} strokeWidth={2}/>
              {index != this.props.levels.length - 1
                ? <div>
                    {/* <StraightLine stroke='#888888' strokeDasharray='Dash' yValue={(((value + this.props.levels[index + 1]) / 2) + this.props.levels[index + 1]) / 2}/> */}
                    <StraightLine stroke='#333333' strokeWidth={1} strokeDasharray='Dash' yValue={(value + this.props.levels[index + 1]) / 2}/>
                    {/* <StraightLine stroke='#888888' strokeDasharray='Dash' yValue={(((value + this.props.levels[index + 1]) / 2) + value) / 2}/> */}
                    
                  </div>
                : null}
              <EdgeIndicator itemType="last" orient="left"
                yAccessor={d => value} fill={d => color}
              />
            </div>
          );
        })}
      </div>
    );
  }
}

export default SupportResistance;