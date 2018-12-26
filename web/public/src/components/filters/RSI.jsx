import React from 'react';
import { format } from "d3-format";

import { Chart } from "react-stockcharts";
import { RSISeries } from "react-stockcharts/lib/series";
import { RSITooltip } from "react-stockcharts/lib/tooltip";
import { MouseCoordinateX, MouseCoordinateY, CurrentCoordinate } from "react-stockcharts/lib/coordinates";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import { rsi } from "react-stockcharts/lib/indicator";

class RSI extends React.Component {
  static propTypes = {
    rsi: React.PropTypes.arrayOf(React.PropTypes.shape({
      timestamp: React.PropTypes.number.isRequired,
      rsi: React.PropTypes.number.isRequired
    })).isRequired
  };

  render() {
    return (<div></div>);
		var rsiCalculator = rsi()
      .windowSize(14)
      .merge((d, c) => {d.rsi = c})
      .accessor(d => d.rsi);

    return (
      <Chart
          yExtents={rsiCalculator.domain()}
          height={125} origin={(w, h) => [0, h - 250]} >
        <XAxis axisAt="bottom" orient="bottom" showTicks={false} outerTickSize={0} />
        <YAxis axisAt="right" orient="right" ticks={2} tickValues={rsiCalculator.tickValues()}/>
        <MouseCoordinateY
          at="right"
          orient="right"
          displayFormat={format(".2f")} />

        <RSISeries calculator={rsiCalculator} />

        <RSITooltip origin={[-38, 15]} calculator={rsiCalculator}/>
      </Chart>
    );
  }
}

export default RSI;