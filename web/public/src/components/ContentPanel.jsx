import * as React from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import * as moment from 'moment';
import {
  LineSeries,
  BarSeries
} from "react-stockcharts/lib/series";

import Chart from './Chart';
import ConfigPanel from './ConfigPanel';
import Accordion from './Accordion';
import AlertOptions from './AlertOptions';
import LoadingMessage from './LoadingMessage';
import WilliamsFractals from './filters/WilliamsFractals';
import SupportResistance from './filters/SupportResistance';
import SR2 from './filters/SR2';
import Trendlines from './filters/Trendlines';
import TDSequential from './filters/TDSequential';
import SwingPoints from './filters/SwingPoints';
import Triangles from './filters/Triangles';
import DivergenceDetection from './filters/DivergenceDetection';
import VolumeNodes from './filters/VolumeNodes';

const filters = {
  'support_resistance': {
    type: 'overlay',
    render: (levels, data) => <SupportResistance levels={levels} />
  },
  'support_resistance_2': {
    type: 'overlay',
    render: (levels, data, moreProps) => <SR2 levels={levels} data={data} {...moreProps} />
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
  'swing_trends': {
    type: 'overlay',
    render: ({ trendlines, patterns }, data, moreProps) => <Triangles triangles={patterns} swingTrends={trendlines.map((obj, index) => ({ ...obj, patterns: patterns.filter(p => p.point1 == index), obj1: data.find(x => x.timestamp == obj.point1.t1), obj2: data.find(x => x.timestamp == obj.point2.t1) }))} data={data} {...moreProps} />
  },
  'divergence_detection': {
    type: 'overlay',
    render: (divs, data, moreProps) => <DivergenceDetection divs={divs.map((obj) => ({ divClass: obj.class, obj1: data.find(x => x.timestamp == obj.t1), obj2: data.find(x => x.timestamp == obj.t2) }))} data={data} {...moreProps} />
  },
  'rsi': {
    type: 'panel',
    get: (rsi, data) => {
      let accessor = d => rsi[d.timestamp] || null;

      return {
        accessor,
        render: () => <LineSeries yAccessor={accessor} stroke='#8E1599' />
      };
    }
  },
  'atr': {
    type: 'panel',
    get: (atr, data) => {
      let accessor = d => atr[d.timestamp] || null;
      
      return {
        accessor,
        render: () => <LineSeries yAccessor={accessor} stroke='#8E1599' />
      };
    }
  },
  'volume': {
    type: 'panel',
    get: (volume, data) => {
      let accessor = d => volume[d.timestamp];

      return {
        accessor,
        render: () => volume == null ? null : <BarSeries yAccessor={accessor} fill={d => d.close > d.open ? "#555555" : "#000000"} />
      };
    }
  },
  'volume_sma': {
    type: 'panel',
    get: (volume_sma, data) => {
      let accessor = d => volume_sma[d.timestamp] || null;

      return {
        accessor,
        render: () => <LineSeries yAccessor={accessor} stroke='#000000' />
      };
    }
  },
  'volume_nodes': {
    type: 'overlay',
    render: (volumeNodes, data, moreProps) => <VolumeNodes volumeNodes={volumeNodes} data={data} {...moreProps} />
  },
  'td_sequential': {
    type: 'overlay',
    render: (tdSequential, data) => <TDSequential tdSequential={tdSequential.map((seq) => ({ ...seq, obj: data.find(x => x.timestamp == seq.timestamp) }))} />  //<TDSequential tdSequential={{ buyCounts: tdSequential.buyCounts.map(({ timestamp, count }) => ({ obj: data.find(x => x.timestamp == timestamp), count })), sellCounts: tdSequential.sellCounts.map(({ timestamp, count }) => ({ obj: data.find(x => x.timestamp == timestamp), count })) }} />
  }
};

class ContentPanel extends React.Component {
  static propTypes = {
    onUpdate: React.PropTypes.func.isRequired,
    onPriceChange: React.PropTypes.func.isRequired,
    onDelete: React.PropTypes.func.isRequired,
    onAlert: React.PropTypes.func.isRequired
  };

  static defaultProps = {
    indicatorConfiguration: {}
  };

  constructor(props) {
    super(props);
    this.state = {
      data: null,
      indicators: {},
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
    
    axios.get('/api/indicators').then(({ data }) => {
      this.setState({ indicators: data.indicators });
    }).catch((err) => {
      console.error('Failed to load indicators', err);
    });
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

    if (props.selectedExchange && ((props.selectedExchange != this.props.selectedExchange) || (this.props.symbolList == null || this.props.symbolList.length == 0))) {
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

      return axios.get('/api/exchange/' + this.props.selectedExchange + '/' + props.selectedSymbol + '?interval=' + props.timespan + '&start=' + startDate.valueOf() + '&end=' + endDate.valueOf())
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
    axios.get('/api/exchange/' + selectedExchange + '/symbols').then(({ data }) => {
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
      if (this.state.filterData[key] == null) {
        console.error(`[${key}]: no filter data returned`);
        return null;
      }

      try {
        let filterObj = filters[key];

        if (typeof filterObj.get === 'function') { // 'get' function, used to return a filter object for stateful data.
          if (this.state.filterData[key] == null) {
            console.error(`[${key}]: no filter data returned`);
            return null;
          }

          filterObj = filterObj.get(this.state.filterData[key], this.state.data);
        }

        return [key, filterObj];
      } catch (err) {
        alert('Error in indicator "' + key + '"\n\n' + err.toString());
      }
    });
  };

  _serializePipeline = (interval=this.props.timespan) => {
    return {
      indicators: Object.keys(this.props.enabledFilters).filter(this._filterEnabled).map((name) => {
        return {
          name,
          config: {}  // @TODO send options over
        };
      }),
      exchange: this.props.selectedExchange,
      pair: this.props.selectedSymbol,
      interval
    };
  };

  _serializeChart = () => {
    let pipelines = {};

    DURATIONS.forEach((duration) => {
      pipelines[duration] = this._serializePipeline(duration);
    });

    return {
      exchange: this.props.selectedExchange,
      pair: this.props.selectedSymbol,
      interval: this.props.timespan,
      pipelines
    };
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

        {this.renderTimespanSelection()}
        <div className='main-dropdowns'>
          <div className='block'>
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

          


          <div className='time-options' style={{ display: 'none' } }>
            <div className='date-selection' style={{ display: 'none' }}>
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
            {/* {this.renderTimespanSelection()} */}
          </div>
          
        </div>

      </div>
    );
  }

  renderFilters(type, data, moreProps) {
    let filters = this._getFilters(type);

    return (
      <div>
        {filters.map(([key, { render }], index) => {
          if (this.state.filterData[key] == null) {
            return null;
          }

          return render(this.state.filterData[key], data, moreProps);
        })}
      </div>
    );
  }

  render() {
    return (
      <div className='content-panel'>
        {/* <div className='close-panel'>
          <i className='fa fa-close close-panel' title='Close' onClick={this.props.onDelete}></i>
        </div> */}

        <div className='close-panel block'>
          <button className='btn primary small' onClick={() => {
            axios.post('/api/chart/create', this._serializeChart()).then((res) => {
              // @TODO message
            }).catch((err) => {
              alert('Failed to save chart: ' + err.toString());
            });
          }}>
            <i className='fa fa-upload' aria-hidden='true'></i>
            &nbsp;&nbsp;Save Chart
          </button>

          <button className='btn dark small' onClick={this.props.onDelete}>
            <i className='fa fa-close' aria-hidden='true'></i>
            &nbsp;&nbsp;Close Chart
          </button>
        
        </div>
        
        {this.renderControls()}

        <Accordion title='Chart' isOpened={this.props.openedAccordions['chart']} onClick={(v) => this.props.onUpdate({ openedAccordions: { ...this.props.openedAccordions, chart: v } })}>
          {this.state.data == null
            ? <LoadingMessage text='Loading chart data...' />
            : <Chart type='hybrid' data={this.state.data}
                renderOverlayFilters={(data, moreProps) => this.renderFilters('overlay', data, moreProps)}
                panels={this._getFilters('panel')}
              >

              </Chart>}
        </Accordion>
        <Accordion title='Indicators' isOpened={this.props.openedAccordions['indicators']} onClick={(v) => this.props.onUpdate({ openedAccordions: { ...this.props.openedAccordions, indicators: v } })}>
          {this.state.indicators != null
            ? Object.keys(this.state.indicators).map((fKey, index) => {
                let ind = this.state.indicators[fKey];

                return (
                  <div className='config-container' key={fKey}>
                    <div className={`config-body${this._filterEnabled(fKey) ? ' enabled' : ''}`}>
                      <input type='checkbox' disabled={!filters[fKey] || filters[fKey].disabled} checked={this._filterEnabled(fKey)} onChange={(event) => { this.props.onUpdate({ enabledFilters: { ...this.props.enabledFilters, [fKey]: event.target.checked } }); }} />
                      <span className='title'>{ind.name}</span>

                      {ind.configuration && Object.keys(ind.configuration).length != 0
                        ? <ConfigPanel ind={ind} values={{}} />
                        : null}
                      {ind.alerts && Object.keys(ind.alerts).length != 0
                        ? <span>&nbsp;&nbsp;<a href='#'><i className='fa fa-bell'></i></a></span>
                        : null}
                    </div>
                  </div>
                );
              })
            : 'Loading indicators...'
          }
        </Accordion>
      </div>
    );
  }
}

export default ContentPanel;
