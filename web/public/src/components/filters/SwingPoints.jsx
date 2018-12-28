import React from 'react';

import { nest } from 'd3-collection';
import GenericChartComponent from 'react-stockcharts/lib/GenericChartComponent';
import { getAxisCanvas } from "react-stockcharts/lib/GenericComponent";
import {
	hexToRGBA, isDefined, functor, plotDataLengthBarWidth, head, last
} from "react-stockcharts/lib/utils";

class SwingPoint extends React.Component {
  static propTypes = {
    direction: React.PropTypes.oneOf(['up', 'down']),
    swingClass: React.PropTypes.string.isRequired
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

          ctx.font = '12px Arial';
          const text = this.props.swingClass.toString();

          const width = 10;
          const height = 5;
          ctx.beginPath();

          if (this.props.direction == 'down') {
            ctx.fillStyle = '#00B250';
            ctx.moveTo(x - (width / 2), y - height);
            ctx.lineTo(x + (width / 2), y - height);
            ctx.lineTo(x, y);
            ctx.fillText(text, x - (ctx.measureText(text).width / 2), y - height - 15);
          } else if (this.props.direction == 'up') {
            ctx.fillStyle = '#FF494A';
            ctx.moveTo(x - (width / 2), y + height);
            ctx.lineTo(x + (width / 2), y + height);
            ctx.lineTo(x, y);
            ctx.fillText(text, x - (ctx.measureText(text).width / 2), y + height + 15);
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

class SwingPoints extends React.Component {
  static propTypes = {
    swingPoints: React.PropTypes.arrayOf(React.PropTypes.shape({
      swingClass: React.PropTypes.string.isRequired,
      obj1: React.PropTypes.object.isRequired,
      obj2: React.PropTypes.object.isRequired
    })).isRequired
  };

  render() {
    return (
      <div>
        {this.props.swingPoints.map(({ swingClass, obj1, obj2 }, index) => {
          return (
            <div key={obj1.timestamp}>
              <SwingPoint swingClass={swingClass} direction={swingClass[1] == 'H' ? 'down' : 'up'} object={obj1} />
            </div>
          );
        })}
      </div>
    );
  }
}

export default SwingPoints;