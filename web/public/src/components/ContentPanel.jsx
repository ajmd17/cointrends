import * as React from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import * as moment from 'moment';
import {
  StraightLine
} from "react-stockcharts/lib/series";

import Chart from '../components/Chart';
import SupportAndResistance from '../components/SupportAndResistance';
import WilliamsFractals from '../components/WilliamsFractals';
import Accordion from '../../components/Accordion';

import SMA from '../services/sma';
import williamsFractals from '../services/williamsFractals';

class ContentPanel extends React.Component {
  static propTypes = {
    onUpdate: React.PropTypes.func.isRequired,
    onPriceChange: React.PropTypes.func.isRequired,
    onDelete: React.PropTypes.func.isRequired,
    onAlert: React.PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      data: null,
      fractals: null,
      symbolList: [],
      selectedSymbol: null,
      selectedExchange: null,
      intervalValue: 3500,

      movingAverages: [],
      tickerColor: '#000',

      supportsAndResistances: [],

      stream: null
    };

    this._movingAverages = [9, 12, 20, 50, 100, 150, 200].map(x => new SMA(x));
  }

  componentDidMount() {
   // this.handlePropsUpdate(this.props);
  }

  componentWillReceiveProps(newProps) {
    // if (this.dataFetchTimeout != null) {
    //   clearTimeout(this.dataFetchTimeout);
    //   this.dataFetchTimeout = null;
    // }

   // this.handlePropsUpdate(newProps);
  }

  handlePropsUpdate = (props) => {
    console.log('handlePropsUpdate');
    //this.loadData(props);

    if (this.dataFetchTimeout == null) {
      this.loadData(props);
    }

    if (props.selectedExchange) {
      this.loadSymbols(props.selectedExchange);
    }
  };

  loadData = (props) => {
    if (props.selectedExchange == null || props.selectedSymbol == null || props.timespan == null) {
      return;
    }

    // @TODO : load by dates.
    const reloadData = () => {
      console.log('dateRange: ', this.props.dateRange);
      let endDate = new Date(this.props.dateRange[1] != null ? this.props.dateRange[1] : Date.now()); // end at current time.
      // if (props.selectedExchange == 'bitmex') {
      //   endDate.setMinutes(endDate.getMinutes() + 100);
      // }

      let startDate;
      
      if (this.state.data && this.state.data.length) {
        startDate = this.state.data[this.state.data.length - 1].date;
      } else {
        startDate = new Date(this.props.dateRange[0]);//endDate);
        //startDate.setHours(startDate.getHours() - (24 * 7 * 4)); // 8 wk?
      }

      startDate.setSeconds(0, 0);
      endDate.setSeconds(0, 0);

      console.log({ startDate, endDate });

      // rather than just pushing into data, we should find a way to detect which items need to be overwritten
      
      if (this.state.stream != null) {
        return axios.get('/api/stream/' + encodeURIComponent(this.state.stream.key)).then(({ data }) => {
          if (data.stream && data.stream.ready) {
            console.log('Stream ' + data.stream.key + ' ready');
            this.setState({ stream: null });
          }
        }).catch((err) => {
          console.error('Error checking stream status: ', err);
        });
      }

      return axios.get('/api/exchangeData?exchange=' + this.props.selectedExchange + '&symbol=' + props.selectedSymbol + '&interval=' + props.timespan + '&startTime=' + startDate.valueOf() + '&endTime=' + endDate.valueOf())
        .then(({ data }) => {
          if (data.stream) {
            console.log('Still loading');
            this.setState({ stream: data.stream });
            return;
          }


          data = data.filter((el) => el != null && el.date != null);

          if (data.length == 0) {
            return;
          }

          // fix dates
          data = data.map((el) => {
            return {
              ...el,
              date: new Date(el.date)
            };
          });

          let currentData = this.state.data || [];

          // find last item where the date fits into our new data's first item date range
          const firstDateRange = data[0].date;

          // where to slice the current data to concat new data
          let chopIndex = -1;

          if (currentData.length != 0) {
            const interval = currentData.length > 1 // calculate existing interval
              ? currentData[1].date - currentData[0].date
              : null;

            for (let i = currentData.length - 1; i >= 0; i--) {
              let start = currentData[i].date;
              let end = i != currentData.length - 1
                ? currentData[i + 1].date
                : null;

              if (firstDateRange.valueOf() <= start.valueOf() || (interval != null && end != null && (firstDateRange.valueOf() + interval < end.valueOf()))) {
                chopIndex = i;
              } else {
                break;
              }
            }
          }

          let lastPrice = currentData.length != 0
            ? currentData[currentData.length - 1].close
            : null;

          let { tickerColor } = this.state;

          if (lastPrice != null && lastPrice != data[data.length - 1].close) {
            tickerColor = lastPrice < data[data.length - 1].close
              ? '#00C288'
              : '#FC1B51';
          }

          // this.props.onAlert(`${this.props.selectedSymbol}:${this.props.selectedExchange} @ ${this.formatPrice(lastPrice)}`);

          const prevLength = currentData.length;

          if (chopIndex != -1) {
            currentData = currentData.slice(0, chopIndex);
          }

          console.log('data = ', data);
          console.log('chopIndex = ', chopIndex);

          currentData = currentData.concat(data);

          const newLength = currentData.length;
          const lengthDiff = newLength - prevLength;

          for (let i = 0; i < lengthDiff; i++) {
            this._movingAverages.forEach(ma => ma.update(data[i].close));
          }

          if (currentData.length != 0) {
            this.props.onPriceChange(this.formatPrice(currentData[currentData.length - 1].close));
          }

          if (this.state.data != null) {
            console.log('before: ', this.state.data[this.state.data.length - 1]);
            console.log('after: ', currentData[currentData.length - 1]);
          }
          this.setState({
            tickerColor,
            data: currentData,
            fractals: williamsFractals(currentData),
            movingAverages: this._movingAverages.map((ma) => {
              return {
                // @TODO timeframes for MAs
                period: ma.period,
                value: ma.result
              };
            })
          });
        }).catch((err) => console.error('API error: ', err));
    };

    reloadData().then(() => {
      let value = setTimeout(() => {
        if (this.dataFetchTimeout != value) return;
        console.log('RELOAD');
        this.loadData(props);
      }, this.state.intervalValue);
      this.dataFetchTimeout = value;
    });
  };

  clearData = (updateState=true) => {
    return new Promise((resolve, reject) => {
      clearTimeout(this.dataFetchTimeout);
      this.dataFetchTimeout = null;

      let newState = {
        data: null,
        fractals: null,
        movingAverages: [],
        supportsAndResistances: [],
        tickerColor: '#000'
      };

      this._movingAverages.forEach((ma) => ma.reset());

      if (updateState) {
        this.setState(newState, () => {
          resolve(newState);
        });
      } else {
        resolve(newState);
      }
    });
  };

  loadSymbols = (selectedExchange) => {
    axios.get('/api/symbols?exchange=' + selectedExchange).then(({ data }) => {
      this.setState({ symbolList: data });
    }).catch((err) => console.error('Could not load symbols', err));
  };

  currentPrice = () => this.state.data == null || this.state.data.length == 0
    ? NaN
    : this.state.data[this.state.data.length - 1].close;

  formatPrice = (price) => String(this.props.selectedSymbol).toUpperCase().indexOf('USD') != -1
    ? `$${Number(price).toFixed(2)}`
    : Number(price).toFixed(8);

  render() {
    return (
      <div className='content-panel'>
        <div className='close-panel'>
          <i className='fa fa-close close-panel' title='Close' onClick={this.props.onDelete}></i>
        </div>
        
      </div>
    );
  }
}

export default ContentPanel;