
import React from "react";
const PropTypes = React.PropTypes;

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart } from "react-stockcharts";
import {
	BarSeries,
	BollingerSeries,
	CandlestickSeries,
	LineSeries,
	StochasticSeries
} from "react-stockcharts/lib/series";
import { Brush } from "react-stockcharts/lib/interactive";
import { XAxis, YAxis } from "react-stockcharts/lib/axes";
import {
	CrossHairCursor,
	EdgeIndicator,
	CurrentCoordinate,
	MouseCoordinateX,
	MouseCoordinateY,
} from "react-stockcharts/lib/coordinates";

import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";
import {
	OHLCTooltip,
	MovingAverageTooltip,
	BollingerBandTooltip,
	StochasticTooltip,
	GroupTooltip,
} from "react-stockcharts/lib/tooltip";
import { ema, stochasticOscillator, bollingerBand } from "react-stockcharts/lib/indicator";
import { fitWidth } from "react-stockcharts/lib/helper";
import { last } from "react-stockcharts/lib/utils";

class CandleStickChartWithDarkTheme extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			brushEnabled: true
		};
	}

	handleBrush1(brushCoords, moreProps) {
		const { start, end } = brushCoords;
		const left = Math.min(start.xValue, end.xValue);
		const right = Math.max(start.xValue, end.xValue);

		const low = Math.min(start.yValue, end.yValue);
		const high = Math.max(start.yValue, end.yValue);

		// uncomment the line below to make the brush to zoom
		this.setState({
			xExtents: [left, right],
			yExtents1: [low, high],
			brushEnabled: false,
		});
	}

	render() {
		const height = 350;
		const { type, data: initialData, width, ratio } = this.props;

		const margin = { left: 70, right: 70, top: 20, bottom: 30 };

		const gridHeight = height - margin.top - margin.bottom;
		const gridWidth = width - margin.left - margin.right;

		const showGrid = true;
		const yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.2 } : {};
		const xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.2 } : {};


		const calculatedData = initialData;
		const xScaleProvider = discontinuousTimeScaleProvider
			.inputDateAccessor(d => d.date);
		const {
			data,
			xScale,
			xAccessor,
			displayXAccessor,
    } = xScaleProvider(calculatedData);

		const start = xAccessor(last(data));
		const end = xAccessor(data[Math.max(0, data.length - 150)]);
		const xExtents = [start, end];

		return (
			<ChartCanvas
				height={height}
				width={width}
				ratio={ratio}
				margin={margin}
				type={type}
				data={data}
				xScale={xScale}
				xAccessor={xAccessor}
				displayXAccessor={displayXAccessor}
			>
				<Chart id={1} height={325}
					yExtents={[d => [d.high, d.low]]}
					padding={{ top: 0, bottom: 0 }}
				>
					<YAxis axisAt="right" orient="right" ticks={8} showTicks={false} {...yGrid} inverted={true}
						tickStroke="#555" />
					<XAxis axisAt="bottom" orient="bottom" showTicks={true} outerTickSize={1}
						stroke="#555" opacity={0.5} />

					<MouseCoordinateY
						at="right"
						orient="right"
						displayFormat={format('.8f')} />

					<CandlestickSeries
						stroke={d => d.close > d.open ? "#00C288" : "#FC1B51"}
						wickStroke={d => d.close > d.open ? "#00C288" : "#FC1B51"}
						fill={d => d.close > d.open ? "#00C288" : "#FC1B51"} />
					{this.props.children}
					{this.props.renderFilters(data)}
          <EdgeIndicator itemType="last" orient="right" edgeAt="right"
            displayFormat={format('.8f')}
						yAccessor={d => d.close} fill={d => d.close > d.open ? "#00C288" : "#FC1B51"}/>

					<OHLCTooltip origin={[-40, -10]}/>
				</Chart>
				<Chart id={2}
					yExtents={d => d.volume}
					height={100} origin={(w, h) => [0, h - 100]}
				> *
					<YAxis axisAt="left" orient="left" ticks={5} tickFormat={format(".2s")} tickStroke="#555555" />
					<BarSeries
						yAccessor={d => d.volume}
						opacity={0.5}
						fill={d => d.close > d.open ? "#8cd9c2" : "#e6b3be"} />
        </Chart>
				<CrossHairCursor stroke="#222222" />
			</ChartCanvas>
		);
	}
}
CandleStickChartWithDarkTheme.propTypes = {
	data: PropTypes.array.isRequired,
	width: PropTypes.number.isRequired,
	ratio: PropTypes.number.isRequired,
	type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
	renderFilters: React.PropTypes.func.isRequired
};

CandleStickChartWithDarkTheme.defaultProps = {
	type: "svg",
};
CandleStickChartWithDarkTheme = fitWidth(CandleStickChartWithDarkTheme);

export default CandleStickChartWithDarkTheme;