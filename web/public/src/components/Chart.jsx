
import React from "react";
const PropTypes = React.PropTypes;

import { format } from "d3-format";
import { timeFormat } from "d3-time-format";

import { ChartCanvas, Chart } from "react-stockcharts";
import {
	AreaSeries,
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
import { rsi, sma, ema, stochasticOscillator, bollingerBand } from "react-stockcharts/lib/indicator";
import { fitWidth } from "react-stockcharts/lib/helper";
import { last } from "react-stockcharts/lib/utils";

import { RSISeries } from "react-stockcharts/lib/series";
import { RSITooltip } from "react-stockcharts/lib/tooltip";

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
		const height = 450;
		const { type, data: initialData, width, ratio } = this.props;

		const margin = { left: 70, right: 70, top: 20, bottom: 30 };

		const gridHeight = height - margin.top - margin.bottom;
		const gridWidth = width - margin.left - margin.right;

		const showGrid = true;
		const yGrid = showGrid ? { innerTickSize: -1 * gridWidth, tickStrokeOpacity: 0.2 } : {};
		const xGrid = showGrid ? { innerTickSize: -1 * gridHeight, tickStrokeOpacity: 0.2 } : {};

		var ema20 = ema()
			.options({ windowSize: 20 })
			.merge((d, c) => {d.ema20 = c})
			.accessor(d => d.ema20)
			.stroke("#4682B4");

		var ema50 = ema()
			.options({ windowSize: 50 })
			.merge((d, c) => {d.ema50 = c})
			.accessor(d => d.ema50)
			.stroke("#4682B4");

		
		const smaVolume50 = sma()
			.id(3)
			.options({ windowSize: 50, sourcePath: "volume" })
			.merge((d, c) => {d.smaVolume50 = c;})
			.accessor(d => d.smaVolume50);
			
		// var rsiCalculator = rsi()
		// 	.options({ windowSize: 14 })
		// 	.merge((d, c) => {d.rsi = c})
		// 	.accessor(d => d.rsi);

		const calculatedData = ema50(ema20(smaVolume50(initialData)));
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
			<div className=''>
				<ChartCanvas
					height={height}
					width={width}
					ratio={ratio}
					margin={margin}
					type={type}
					data={data}
					calculator={[ema20, ema50]}
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

						<LineSeries yAccessor={ema20.accessor()} stroke={ema20.stroke()}/>
						<LineSeries yAccessor={ema50.accessor()} stroke={ema50.stroke()}/>

						<CandlestickSeries
							stroke={d => d.close > d.open ? "#00B250" : "#B21D10"}
							wickStroke={d => d.close > d.open ? "#00B250" : "#B21D10"}
							fill={d => d.close > d.open ? "#00B250" : "#B21D10"}/>
						{this.props.children}
						{this.props.renderFilters(data, { xScale, xAccessor })}
						<EdgeIndicator itemType="last" orient="right" edgeAt="right"
							displayFormat={format('.8f')}
							yAccessor={d => d.close} fill={d => d.close > d.open ? "#00B250" : "#B21D10"}/>

						<OHLCTooltip origin={[-40, -10]}/>
					</Chart>
					<Chart id={2} height={125}
						yExtents={[d => d.volume, smaVolume50.accessor()]}
						origin={(w, h) => [0, h - 400]}
					>
						<YAxis axisAt="left" orient="left" ticks={5} tickFormat={format(".2s")}/>

						<MouseCoordinateY
							at="left"
							orient="left"
							displayFormat={format(".4s")} />

						<BarSeries yAccessor={d => d.volume} fill={d => d.close > d.open ? "#6BA583" : "#FF0000"} />
						<AreaSeries yAccessor={smaVolume50.accessor()} stroke={smaVolume50.stroke()} fill={smaVolume50.fill()}/>
					</Chart>
					<CrossHairCursor stroke="#222222" />
				</ChartCanvas>
			</div>
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