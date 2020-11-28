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
    fillColor: React.PropTypes.string.isRequired
  };

  drawOnCanvas(ctx, moreProps) {
		const { xScale, chartConfig: { yScale }, plotData, xAccessor } = moreProps;

    const x = xScale(this.props.x);
    const y = yScale(this.props.y);

    const w = this.props.width;
    const h = this.props.height;

    //console.log({x,y,w,h})
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = this.props.fillColor;

    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.stroke();
    ctx.fill();
    ctx.globalAlpha = 1.0;
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


class VolumeNodes extends React.Component {
  static propTypes = {
    data: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    volumeNodes: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
  };

  render() {
    const { xAccessor, xScale, yScale } = this.props;

    const getData = (timestamp) => {
      return this.props.data.find(x => x.timestamp == timestamp);
    };

    return (
      <div>
        {this.props.volumeNodes.map((node, i) => {
          const bar = getData(node.timestamp),
                size = 5 * node.weight;

          if (bar == null) {
            return null;
          }

          return (
            <div key={i}>
              <Rectangle
                x={xAccessor(bar)}
                y={(bar.open > bar.close) ? bar.high : bar.low}
                width={size}
                height={size}
                fillColor={(bar.open > bar.close) ? '#FC1B51' : '#00C288'}
              />
              
            </div>
          );
        })}
      </div>
    );
  }
}

export default VolumeNodes;
