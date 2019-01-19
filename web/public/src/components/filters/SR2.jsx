import React from 'react';

import StraightLine from 'react-stockcharts/lib/interactive/components/StraightLine';

import { nest } from 'd3-collection';
import GenericChartComponent from 'react-stockcharts/lib/GenericChartComponent';
import { getAxisCanvas } from "react-stockcharts/lib/GenericComponent";
import {
	hexToRGBA, isDefined, functor, plotDataLengthBarWidth, head, last
} from "react-stockcharts/lib/utils";

class Rectangle extends React.Component {
  static propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    objects: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
  };

  drawOnCanvas(ctx, moreProps) {
		const { xScale, chartConfig: { yScale }, plotData, xAccessor } = moreProps;

    const x = xScale(this.props.x);
    const y = yScale(this.props.y);

    const w = 50;
    const h = 50;

    console.log(xAccessor);

    //console.log({x,y,w,h})
    ctx.fillStyle = '#FC1B51';

    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.stroke();
    ctx.fill();
	}
	renderSVG(moreProps) {
		return null;
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


class SR2 extends React.Component {
  static propTypes = {
    data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    levels: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
  };

  render() {
    const { xAccessor, xScale } = this.props;

    const getData = (timestamp) => {
      return this.props.data.find(x => x.timestamp == timestamp);
    };

    return (
      <div>
        {this.props.levels.map((level, i) => {
          // let meanValue = 0;

          // for (let j = 0; j < level.length; j++) {
          //   meanValue += level[j].value;
          // }

          // meanValue /= level.length;

          let first = level[0];
          let last = level[level.length - 1];

          let meanValue = first.value;//(first.value + last.value) / 2;

          return (
            <div key={i}>
              <StraightLine stroke={'#000000'}
                type={'LINE'}
                x1Value={xScale(xAccessor(getData(first.data.timestamp)))}
                x2Value={xScale(xAccessor(getData(last.data.timestamp)))}
                y1Value={meanValue}
                y2Value={meanValue}
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

export default SR2;