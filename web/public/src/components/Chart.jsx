
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

const bbAppearance = {
	stroke: {
		top: "#964B00",
		middle: "#FF6600",
		bottom: "#964B00",
	},
	fill: "#4682B4"
};
const stoAppearance = {
	stroke: Object.assign({},
		StochasticSeries.defaultProps.stroke,
		{ top: "#37a600", middle: "#b8ab00", bottom: "#37a600" })
};

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

		const ema20 = ema()
			.id(0)
			.options({ windowSize: 20 })
			.merge((d, c) => {d.ema20 = c;})
			.accessor(d => d.ema20);

		const ema50 = ema()
			.id(2)
			.options({ windowSize: 50 })
			.merge((d, c) => {d.ema50 = c;})
			.accessor(d => d.ema50);

		const slowSTO = stochasticOscillator()
			.options({ windowSize: 14, kWindowSize: 3 })
			.merge((d, c) => {d.slowSTO = c;})
			.accessor(d => d.slowSTO);
		const fastSTO = stochasticOscillator()
			.options({ windowSize: 14, kWindowSize: 1 })
			.merge((d, c) => {d.fastSTO = c;})
			.accessor(d => d.fastSTO);
		const fullSTO = stochasticOscillator()
			.options({ windowSize: 14, kWindowSize: 3, dWindowSize: 4 })
			.merge((d, c) => {d.fullSTO = c;})
			.accessor(d => d.fullSTO);

		const bb = bollingerBand()
			.merge((d, c) => {d.bb = c;})
			.accessor(d => d.bb);


		const calculatedData = bb(ema20(ema50(slowSTO(fastSTO(fullSTO(initialData))))));
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
					yExtents={[d => [d.high, d.low], bb.accessor(), ema20.accessor(), ema50.accessor()]}
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
          <EdgeIndicator itemType="last" orient="right" edgeAt="right"
            displayFormat={format('.8f')}
						yAccessor={d => d.close} fill={d => d.close > d.open ? "#00C288" : "#FC1B51"}/>

					<OHLCTooltip origin={[-40, -10]}/>
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
};

CandleStickChartWithDarkTheme.defaultProps = {
	type: "svg",
};
CandleStickChartWithDarkTheme = fitWidth(CandleStickChartWithDarkTheme);

export default CandleStickChartWithDarkTheme;