import * as React from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import * as moment from 'moment';
import {
  StraightLine
} from "react-stockcharts/lib/series";

import Chart from './Chart';
import Accordion from './Accordion';
import AlertOptions from './AlertOptions';
import LoadingMessage from './LoadingMessage';
import WilliamsFractals from './filters/WilliamsFractals';
import SupportResistance from './filters/SupportResistance';
import TDSequential from './filters/TDSequential';

const filters = {
  'support_resistance': (levels, data) => <SupportResistance levels={levels} />,
  //'fractals': (fractals, data) => <WilliamsFractals fractals={{ up: fractals.up.map(({ timestamp }) => data.find(x => x.timestamp == timestamp)), down: fractals.down.map(({ timestamp }) => data.find(x => x.timestamp == timestamp)) }} />,
  'td_sequential': (tdSequential, data) => <TDSequential tdSequential={{ buyCounts: tdSequential.buyCounts.map(({ timestamp, count }) => ({ obj: data.find(x => x.timestamp == timestamp), count })), sellCounts: tdSequential.sellCounts.map(({ timestamp, count }) => ({ obj: data.find(x => x.timestamp == timestamp), count })) }} />
};

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
      filters: {},
      symbolList: [],
      selectedSymbol: null,
      selectedExchange: null,
      intervalValue: 3500,

      tickerColor: '#000',

      stream: null
    };
  }

  componentDidMount() {
   this.handlePropsUpdate(this.props);
   
  }

  componentWillReceiveProps(newProps) {
    if (this.dataFetchTimeout != null) {
      clearTimeout(this.dataFetchTimeout);
      this.dataFetchTimeout = null;
    }

    this.handlePropsUpdate(newProps);
  }

  handlePropsUpdate = (props) => {
    console.log('handlePropsUpdate');
    //this.loadData(props);

    if (this.dataFetchTimeout == null) {
      this.loadData(props);
    }

    if (props.selectedExchange  && ((props.selectedExchange != this.props.selectedExchange) || (this.props.symbolList == null || this.props.symbolList.length == 0))) {
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
      //endDate.setSeconds(0, 0);

      console.log({ startDate, endDate });

      // rather than just pushing into data, we should find a way to detect which items need to be overwritten
      
      // if (this.state.stream != null) {
      //   return axios.get('/api/stream/' + encodeURIComponent(this.state.stream.key)).then(({ data }) => {
      //     if (data.stream && data.stream.ready) {
      //       console.log('Stream ' + data.stream.key + ' ready');
      //       this.setState({ stream: null });
      //     }
      //   }).catch((err) => {
      //     console.error('Error checking stream status: ', err);
      //   });
      // }

      return axios.get('/api/' + this.props.selectedExchange + '/' + props.selectedSymbol + '?interval=' + props.timespan + '&start=' + startDate.valueOf() + '&end=' + endDate.valueOf())
        .then(({ data }) => {
          if (data.stream) {
            console.log('Still loading');
            this.setState({ stream: data.stream });
            return;
          }
          
          if (data.results) {
            let results = data.results.filter((el) => el != null && el.date != null);

            if (results.length == 0) {
              return;
            }

            // fix dates
            results = results.map((el) => {
              return {
                ...el,
                date: new Date(el.date)
              };
            });

            let currentData = this.state.data || [];

            // find last item where the date fits into our new data's first item date range
            const firstDateRange = results[0].date;

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

            if (lastPrice != null && lastPrice != results[results.length - 1].close) {
              tickerColor = lastPrice < results[results.length - 1].close
                ? '#00C288'
                : '#FC1B51';
            }

            // this.props.onAlert(`${this.props.selectedSymbol}:${this.props.selectedExchange} @ ${this.formatPrice(lastPrice)}`);

            const prevLength = currentData.length;

            if (chopIndex != -1) {
              currentData = currentData.slice(0, chopIndex);
            }

            currentData = currentData.concat(results);

            const newLength = currentData.length;
            const lengthDiff = newLength - prevLength;

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
              filters: data.filters
            });
          }
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
        filters: {},
        tickerColor: '#000'
      };

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
    axios.get('/api/' + selectedExchange + '/symbols').then(({ data }) => {
      this.setState({ symbolList: data });
    }).catch((err) => console.error('Could not load symbols', err));
  };

  currentPrice = () => this.state.data == null || this.state.data.length == 0
    ? NaN
    : this.state.data[this.state.data.length - 1].close;

  formatPrice = (price) => String(this.props.selectedSymbol).toUpperCase().indexOf('USD') != -1
    ? `$${Number(price).toFixed(2)}`
    : Number(price).toFixed(8);

  
  renderTimespanSelection() {
    let durationsGrouped = [];

    DURATIONS.forEach((duration) => {
      let index = durationsGrouped.findIndex((ary) => ary.length != 0 && ary[0][ary[0].length - 1] == duration[duration.length - 1]);
      if (index == -1) {
        durationsGrouped.push([]);
        index = durationsGrouped.length - 1;
      }

      durationsGrouped[index].push(duration);
    });

    return (
      <div className='timespan-selection'>
        {durationsGrouped.map((timespanGroup, i) => {
          return (
            <span className='timespan-group' key={i}>
              {timespanGroup.map((timespan, j) => {
                return (
                  <span className={`timespan${timespan == this.props.timespan ? ' selected' : ''}`} key={j} onClick={() => {
                    this.clearData().then(() => {
                      this.props.onUpdate({ timespan });
                    });
                  }}>
                    {timespan}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>
    );
  }

  renderControls() {
    return (
      <div className='controls'>
        <div className='main-dropdowns'>
          <div className='block'>
            <span>Exchange: </span>
            <select
              value={this.props.selectedExchange}
              onChange={(event) => {
                this.clearData();
                this.props.onUpdate({
                  selectedSymbol: null,
                  selectedExchange: event.target.value
                }).then(() => {
                  this.loadSymbols(event.target.value);
                });
              }}
            >
              <option>Select an exchange</option>
              <option value='binance'>Binance</option>
            </select>
          </div>
          <div className='block'>
            <span>Symbol: </span>
            <select
              value={this.props.selectedSymbol}
              onChange={(event) => {
                const selectedSymbol = event.target.value
                this.clearData().then(() => {
                  this.props.onUpdate({ selectedSymbol }).then((newProps) => {
                    this.loadData(newProps);
                  });
                });
              }}
              disabled={this.props.selectedExchange == null || this.state.symbolList.length == 0}
            >
              <option>Select a symbol</option>
              {this.state.symbolList != null
                ? this.state.symbolList.map((symbol, i) => {
                    return (
                      <option value={symbol} key={i}>
                        {symbol}
                      </option>
                    );
                  })
                : null}
            </select>
          </div>

          <div className='time-options'>
            <div className='date-selection'>
              <span className='field'>
                <label>From:</label>
                {/* <input type='text'/> */}
                <div className='block'>
                  {/* <DatePicker selected={moment(this.props.dateRange[0])} onChange={(value) => { this.props.onUpdate({ dateRange: [value.valueOf(), this.props.dateRange[1]] }); }} /> */}
                </div>
              </span>
              <span className='field'>
                <label>To:</label>
                
                <div className='block'>
                  {/* <DatePicker selected={moment(this.props.dateRange[1] || Date.now())} onChange={(value) => { this.props.onUpdate({ dateRange: [this.props.dateRange[0], value.valueOf()] }); }} /> */}
                  <span className='cb'>
                    <input type='checkbox' checked={this.props.dateRange[1] == null} onChange={(event) => { this.props.onUpdate({ dateRange: [this.props.dateRange[0], event.target.value ? null : Date.now()] }); }} />
                    <label>Now</label>
                  </span>
                </div>
              </span>
            </div>
            {this.renderTimespanSelection()}
          </div>
          
        </div>

        <div>
          <span>Update interval: </span>
          <input type='number' value={this.state.intervalValue} onChange={(event) => this.setState({ intervalValue: Math.min(Math.max(500, event.target.value), 15000) })} />
        </div>

      </div>
    );
  }

  render() {
    return (
      <div className='content-panel'>
        <div className='close-panel'>
          <i className='fa fa-close close-panel' title='Close' onClick={this.props.onDelete}></i>
        </div>
        
        {this.renderControls()}

        <Accordion title='Chart' isOpened={this.props.showingChart} onClick={(showingChart) => this.props.onUpdate({ showingChart })}>
          {this.state.data == null
            ? <LoadingMessage />
            : <Chart type='hybrid' data={this.state.data} renderFilters={(data) => {
                if (this.state.filters == null || data.length == 0) return null;

                const keys = Object.keys(this.state.filters);

                if (keys.length == 0) return null;

                return (
                  <div>
                    {keys.map((key, index) => {
                      if (filters[key] == null) return null;
                      return (
                        filters[key](this.state.filters[key], data)
                      );
                    })}
                  </div>
                );
              }}>

              </Chart>}
        </Accordion>
        
        <Accordion title='Alerts'>
          <AlertOptions data={this.state.data} />
        </Accordion>
      </div>
    );
  }
}

export default ContentPanel;