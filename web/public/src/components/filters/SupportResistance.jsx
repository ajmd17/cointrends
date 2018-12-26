import React from 'react';
import { format } from "d3-format";

import rsi from "react-stockcharts/lib/indicator/rsi";
import { CandlestickSeries, BarSeries, LineSeries, AreaSeries, RSISeries } from "react-stockcharts/lib/series";

class SupportResistance extends React.Component {
  static propTypes = {
    levels: React.PropTypes.arrayOf(React.PropTypes.number).isRequired
  };

  render() {
    
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
          displayFormat={d3.format(".2f")} />

        <RSISeries calculator={rsiCalculator} />

        <RSITooltip origin={[-38, 15]} calculator={rsiCalculator}/>
      </Chart>
    );
  }
}

export default SupportResistance;