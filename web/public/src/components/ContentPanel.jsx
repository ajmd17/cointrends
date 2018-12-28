import * as React from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import * as moment from 'moment';
import {
  LineSeries,
  BarSeries
} from "react-stockcharts/lib/series";

import Chart from './Chart';
import Accordion from './Accordion';
import AlertOptions from './AlertOptions';
import LoadingMessage from './LoadingMessage';
import WilliamsFractals from './filters/WilliamsFractals';
import SupportResistance from './filters/SupportResistance';
import Trendlines from './filters/Trendlines';
import TDSequential from './filters/TDSequential';
import RSI from './filters/RSI';
import SwingPoints from './filters/SwingPoints';

const filters = {
  'support_resistance': {
    type: 'overlay',
    render: (levels, data) => <SupportResistance levels={levels} />
  },
  'fractals': {
    type: 'overlay',
    render: (fractals, data) => <WilliamsFractals fractals={{ up: fractals.up.map(({ timestamp }) => data.find(x => x.timestamp == timestamp)), down: fractals.down.map(({ timestamp }) => data.find(x => x.timestamp == timestamp)) }} />
  },
  'trendlines': {
    type: 'overlay',
    disabled: true,
    render: (trendlines, data, moreProps) => <Trendlines trendlines={trendlines} data={data} {...moreProps} />
  },
  
  'swing_points': {
    type: 'overlay',
    render: (swingPoints, data) => <SwingPoints swingPoints={swingPoints.map((obj) => ({ swingClass: obj.class, obj1: data.find(x => x.timestamp == obj.t1), obj2: data.find(x => x.timestamp == obj.t2) }))} />
  },
  'rsi': {
    type: 'panel',
    get: (rsi, data) => {
      let accessor = d => rsi[d.timestamp];

      return {
        accessor,
        render: () => <LineSeries yAccessor={accessor} stroke='#8E1599' />
      };
    }
  },
  'volume': {
    type: 'panel',
    accessor: d => d.volume,
    render: () => <BarSeries yAccessor={d => d.volume} fill={d => d.close > d.open ? "#555555" : "#000000"} />
  },
  'td_sequential': {
    type: 'overlay',
    render: (tdSequential, data) => <TDSequential  tdSequential={tdSequential.map((seq) => ({ ...seq, obj: data.find(x => x.timestamp == seq.timestamp) }))} />  //<TDSequential tdSequential={{ buyCounts: tdSequential.buyCounts.map(({ timestamp, count }) => ({ obj: data.find(x => x.timestamp == timestamp), count })), sellCounts: tdSequential.sellCounts.map(({ timestamp, count }) => ({ obj: data.find(x => x.timestamp == timestamp), count })) }} />
  }
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
      filterData: {},
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

    const reloadData = () => {
      let endDate = new Date(this.props.dateRange[1] != null ? this.props.dateRange[1] : Date.now()); // end at current time.
      let startDate;
      
      if (this.state.data && this.state.data.length) {
        startDate = this.state.data[this.state.data.length - 1].date;
      } else {
        startDate = new Date(this.props.dateRange[0]);
      }

      startDate.setSeconds(0, 0);
      //endDate.setSeconds(0, 0);

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

          this.setState({
            tickerColor,
            data: currentData,
            filterData: data.filters
          });
        }
      }).catch((err) => console.error('Error caught while fetching API data: ', err));
    };

    reloadData().then(() => {
      let value = setTimeout(() => {
        if (this.dataFetchTimeout != value) return;
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
        filterData: {},
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

  _filterEnabled = (fKey) => {
    return !!this.props.enabledFilters[fKey] && filters[fKey] && !filters[fKey].disabled;
  };

  _getFilters = (type) => {
    const keys = Object.keys(filters).filter((f) => this._filterEnabled(f) && filters[f].type == type);

    return keys.map((key, index) => {
      try {
        let filterObj = filters[key];

        if (typeof filterObj.get === 'function') { // 'get' function, used to return a filter object for stateful data.
          filterObj = filterObj.get(this.state.filterData[key], this.state.data);
        }

        return [key, filterObj];
      } catch (err) {
        alert('Error in indicator "' + key + '"\n\n' + err.toString());
      }
    });
  };

  
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

  renderFilters(type, data, moreProps) {
    let filters = this._getFilters(type);

    return (
      <div>
        {filters.map(([key, { render }], index) => {
          return render(this.state.filterData[key], data, moreProps);
        })}
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

        <Accordion title='Chart' isOpened={this.props.openedAccordions['chart']} onClick={(v) => this.props.onUpdate({ openedAccordions: { ...this.props.openedAccordions, chart: v } })}>
          {this.state.data == null
            ? <LoadingMessage />
            : <Chart type='hybrid' data={this.state.data}
                renderOverlayFilters={(data, moreProps) => this.renderFilters('overlay', data, moreProps)}
                panels={this._getFilters('panel')}
              >

              </Chart>}
        </Accordion>
        <Accordion title='Indicators' isOpened={this.props.openedAccordions['indicators']} onClick={(v) => this.props.onUpdate({ openedAccordions: { ...this.props.openedAccordions, indicators: v } })}>
          {Object.keys(filters).map((fKey, index) => {
            return (
              <div key={fKey}>
                <input type='checkbox' disabled={!!filters[fKey].disabled} checked={this._filterEnabled(fKey)} onChange={(event) => { this.props.onUpdate({ enabledFilters: { ...this.props.enabledFilters, [fKey]: event.target.checked } }); }} />
                <span>{fKey}</span>
              </div>
            );
          })}
        </Accordion>
        
        <Accordion title='Alerts' isOpened={this.props.openedAccordions['alerts']} onClick={(v) => this.props.onUpdate({ openedAccordions: { ...this.props.openedAccordions, alerts: v } })}>
          <AlertOptions data={this.state.data} />
        </Accordion>
      </div>
    );
  }
}

export default ContentPanel;