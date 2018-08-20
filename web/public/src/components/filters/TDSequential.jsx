import React from 'react';

import { nest } from 'd3-collection';
import GenericChartComponent from 'react-stockcharts/lib/GenericChartComponent';
import { getAxisCanvas } from "react-stockcharts/lib/GenericComponent";
import {
	hexToRGBA, isDefined, functor, plotDataLengthBarWidth, head, last
} from "react-stockcharts/lib/utils";

class Arrow extends React.Component {
  static propTypes = {
    direction: React.PropTypes.oneOf(['up', 'down'])
  };

  drawOnCanvas(ctx, moreProps) {
    const data = [this.props.object];
		const { xScale, chartConfig: { yScale }, plotData, xAccessor } = moreProps;
    const candleNest = nest()
		.key(d => d.stroke)
		.key(d => d.fill)
		.entries([this.props.object]);


    candleNest.forEach(outer => {
      const { key: strokeKey, values: strokeValues } = outer;
      strokeValues.forEach(inner => {
        const { key, values } = inner;

        values.forEach(d => {
          const x = xScale(xAccessor(d));
          const y = this.props.direction == 'down'
            ? yScale(d.high) - 5
            : yScale(d.low) + 5;

          const width = 10;
          const height = 5;
          ctx.beginPath();

          if (this.props.direction == 'down') {
            ctx.fillStyle = '#FC1B51';
            ctx.moveTo(x - (width / 2), y - height);
            ctx.lineTo(x + (width / 2), y - height);
            ctx.lineTo(x, y);
          } else if (this.props.direction == 'up') {
            ctx.fillStyle = '#00C288';
            ctx.moveTo(x - (width / 2), y + height);
            ctx.lineTo(x + (width / 2), y + height);
            ctx.lineTo(x, y);
          }
          ctx.fill();
        });
      });
    });
	}
	renderSVG(moreProps) {
		const { xScale, chartConfig: { yScale }, plotData, xAccessor } = moreProps;
    const x = xScale(xAccessor(this.props.object));
    const y = yScale(this.props.object.close);
    return (
      <rect x={x} y={y} width={50} height={50} />
    );
	}
  render() {
    return (
      <GenericChartComponent
        clip={true}
        svgDraw={this.renderSVG}

        canvasToDraw={getAxisCanvas}
        canvasDraw={this.drawOnCanvas.bind(this)}

        drawOn={["pan"]}
      />
    );
  }
}

class TDSequential extends React.Component {
  static propTypes = {
  };

  render() {
    return (
      <div>
        {this.props.tdSequential.buyCounts.map(({ obj, count }, index) => {
          return (
            <Arrow direction='up' object={obj} key={index} />
          );
        })}
      </div>
    );
  }
}

export default TDSequential;