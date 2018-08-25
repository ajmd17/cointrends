import React from 'react';

import { nest } from 'd3-collection';
import GenericChartComponent from 'react-stockcharts/lib/GenericChartComponent';
import { getAxisCanvas } from "react-stockcharts/lib/GenericComponent";
import {
	hexToRGBA, isDefined, functor, plotDataLengthBarWidth, head, last
} from "react-stockcharts/lib/utils";

class CountArrow extends React.Component {
  static propTypes = {
    direction: React.PropTypes.oneOf(['up', 'down']),
    count: React.PropTypes.number.isRequired
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

          ctx.font = '15px Arial';
          const text = this.props.count.toString();

          const width = 10;
          const height = 5;
          ctx.beginPath();

          if (this.props.direction == 'down') {
            ctx.fillStyle = '#AA0000';
            ctx.moveTo(x - (width / 2), y - height);
            ctx.lineTo(x + (width / 2), y - height);
            ctx.lineTo(x, y);
            ctx.fillText(text, x - (ctx.measureText(text).width / 2), y - height - 15);
          } else if (this.props.direction == 'up') {
            ctx.fillStyle = '#00AA00';
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

class TDSequential extends React.Component {
  static propTypes = {
    //tdSequential: React.PropTypes.array.isRequired
  };

  render() {
    return (
      <div>
        {/* {this.props.tdSequential.map((obj, index) => {
          if (obj.buySetup) {
            
            return (
              <CountArrow direction='up' object={obj.obj} count={0} key={index} />
            );
          } else if (obj.sellSetup) {

            return (
              <CountArrow direction='down' object={obj.obj} count={0} key={index} />
            );
          }
        })} */}
        {this.props.tdSequential.map((obj, index) => {
          return (
            <div key={index}>
              {obj.sellCountdown && obj.sellCountdown < 10
                ? <CountArrow direction='up' object={obj.obj} count={obj.sellCountdown} />
                : null}
              {obj.buyCountdown && obj.buyCountdown < 10
                ? <CountArrow direction='down' object={obj.obj} count={obj.buyCountdown} />
                : null}
            </div>
          );
        })}
        {/* {this.props.tdSequential.buyCounts.map(({ obj, count }, index) => {
          return (
            <CountArrow direction='up' object={obj} count={count} key={index} />
          );
        })}
        {this.props.tdSequential.sellCounts.map(({ obj, count }, index) => {
          return (
            <CountArrow direction='down' object={obj} count={count} key={index} />
          );
        })} */}
      </div>
    );
  }
}

export default TDSequential;