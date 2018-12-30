import React from 'react';

import StraightLine from 'react-stockcharts/lib/interactive/components/StraightLine';

function hashCode(str) { // java String#hashCode
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
     hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
} 

function intToRGB(i){
  var c = (i & 0x00FFFFFF)
      .toString(16)
      .toUpperCase();

  return "00000".substring(0, 6 - c.length) + c;
}

import { nest } from 'd3-collection';
import GenericChartComponent from 'react-stockcharts/lib/GenericChartComponent';
import { getAxisCanvas } from "react-stockcharts/lib/GenericComponent";
import {
	hexToRGBA, isDefined, functor, plotDataLengthBarWidth, head, last
} from "react-stockcharts/lib/utils";

class TrendlineText extends React.Component {
  static propTypes = {
    direction: React.PropTypes.oneOf(['up', 'down']),
    text: React.PropTypes.string.isRequired
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

          const text = this.props.text;

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

class Triangles extends React.Component {
  static propTypes = {
    swingTrends: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
  };

  render() {
    /* @TODO */
    const { xAccessor, xScale } = this.props;

    const getData = (timestamp) => {
      return this.props.data.find(x => x.timestamp == timestamp);
    };

    return (
      <div>
        {this.props.swingTrends.map((line, i) => {
          const { point1, point2, patterns, angle, obj1, obj2, meanScore } = line;

          if (obj1 == null || obj2 == null) {
            return null;
          }

          // temp
          if (patterns.length == 0) {
            return null;
          }

          let timestamps = obj1.timestamp + '_' + obj2.timestamp;
          let color = `#${intToRGB(hashCode(timestamps))}`;

          let patternText = String(patterns.map((pattern) => pattern.class).join(', '));
          patternText += '     ' + angle;

          return (
            <div data-meanScore={meanScore} key={i}>
              {patternText.length != 0
                ? <TrendlineText object={obj2} text={patternText} direction='down' />
                : null}
              {/* <TrendlineText object={obj2} text={String(angle2)} direction='down' /> */}
              <StraightLine stroke={color}
                type={'LINE'}
                x1Value={xScale(xAccessor(getData(obj1.timestamp)))}
                x2Value={xScale(xAccessor(getData(obj2.timestamp)))}
                y1Value={point1.class.endsWith('H') ? obj1.high : obj1.low}
                y2Value={point2.class.endsWith('H') ? obj2.high : obj2.low}
                strokeWidth={1}
                strokeOpacity={1}
              />
              
            </div>
          );
        })}
      </div>
    );
  }
}

export default Triangles;