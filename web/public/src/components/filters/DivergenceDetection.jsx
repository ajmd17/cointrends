import React from 'react';

import { nest } from 'd3-collection';
import GenericChartComponent from 'react-stockcharts/lib/GenericChartComponent';
import { getAxisCanvas } from "react-stockcharts/lib/GenericComponent";
import {
	hexToRGBA, isDefined, functor, plotDataLengthBarWidth, head, last
} from "react-stockcharts/lib/utils";
import StraightLine from 'react-stockcharts/lib/interactive/components/StraightLine';

class Divergence extends React.Component {
  static propTypes = {
    divClass: React.PropTypes.string.isRequired,
    x: React.PropTypes.number.isRequired
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
          let swing = this.props.divClass.endsWith('R')
            ? 'high'
            : 'low';

          const x = xScale(xAccessor(d));
          const y = swing == 'high'
            ? yScale(d.high)
            : yScale(d.low);

          ctx.font = '12px Arial';
          const textValues = {
            'BR': 'BearDiv',
            'HBR': 'HiddenBearDiv',
            'BL': 'BullDiv',
            'HBL': 'HiddenBullDiv'
          };
          const text = textValues[this.props.divClass];

          const width = 10;
          const height = 5;
          ctx.beginPath();

          if (swing == 'high') {
            ctx.fillStyle = '#FF494A';
            // ctx.moveTo(x - (width / 2), y - height);
            // ctx.lineTo(x + (width / 2), y - height);
            // ctx.lineTo(x, y);
            ctx.fillText(text, x - (ctx.measureText(text).width / 2), y - 15);
          } else if (swing == 'low') {
            ctx.fillStyle = '#00B250';
            // ctx.moveTo(x - (width / 2), y + height);
            // ctx.lineTo(x + (width / 2), y + height);
            // ctx.lineTo(x, y);
            ctx.fillText(text, x - (ctx.measureText(text).width / 2), y + 15);
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

class DivergenceDetection extends React.Component {
  static propTypes = {
    divs: React.PropTypes.arrayOf(React.PropTypes.shape({
      divClass: React.PropTypes.string.isRequired,
      obj1: React.PropTypes.object.isRequired,
      obj2: React.PropTypes.object.isRequired
    })).isRequired
  };

  render() {
    const { xAccessor, xScale } = this.props;

    const getData = (timestamp) => {
      return this.props.data.find(x => x.timestamp == timestamp);
    };

    return (
      <div>
        {this.props.divs.map(({ divClass, obj1, obj2 }, index) => {
          return (
            <div key={`${obj1.timestamp}${obj2.timestamp}`}>
              <Divergence divClass={divClass} object={obj1} x={(obj2.timestamp + obj1.timestamp) / 2} />
              {/* draw trendline from a to b */}
              {/* <StraightLine stroke={divClass.endsWith('R') ? '#CC0000' : '#00CC00'}
                type='LINE'
                x1Value={xScale(xAccessor(getData(obj2.timestamp)))}
                x2Value={xScale(xAccessor(getData(obj1.timestamp)))}
                y1Value={obj2.close}//divClass.endsWith('R') ? obj2.high : obj2.low}
                y2Value={obj1.close}//divClass.endsWith('R') ? obj1.high : obj1.low}
                strokeWidth={1}
                strokeOpacity={1}
              /> */}
            </div>
          );
        })}
      </div>
    );
  }
}

export default DivergenceDetection;