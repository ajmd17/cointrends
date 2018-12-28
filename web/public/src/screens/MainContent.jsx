import * as React from 'react';
import * as GridLayout from 'react-grid-layout';
import axios from 'axios';

import Navbar from '../components/Navbar';
import ContentPanel from '../components/ContentPanel';
import LoginModal from '../components/LoginModal';
import Sidebar from '../components/Sidebar';

const defaultContentPanel = {
  timespan: DURATIONS.indexOf('4h') !== -1 ? '4h' : DURATIONS[0],
  dateRange: [Date.now() - (60000 * 60 * 24 * 7 * 4) /* 4 weeks */, null],
  openedAccordions: { chart: true, indicators: true },
  enabledFilters: { },//'support_resistance': true },
  indicatorConfiguration: {}
};

class MainContent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      contentPanels: [],
      loginModalShowing: false
    };
    this._lastAlert = null;
    this._prices = {};
  }

  componentDidMount() {
    let contentPanels = [{
      ...defaultContentPanel,
      selectedExchange: 'binance',
      selectedSymbol: 'BTCUSDT'
    }];

    if (window.location.hash != null && window.location.hash != '') {
      let hash = window.location.hash;
      if (hash.indexOf('#') == 0) {
        hash = hash.substr(1);
      }

      // try to decode
      try {
        let jsonString = atob(hash);
        let obj = JSON.parse(jsonString);

        if ('length' in obj) {
          contentPanels = obj.map((item) => ({ ...defaultContentPanel, ...item }));
        }
      } catch (err) {
        console.error('Failed to decode location hash: ', err);
      }
    }

    this.setState({ contentPanels });
  }

  encodeContentPanels = () => {
    return btoa(JSON.stringify(this.state.contentPanels));
  };

  handlePriceChange = (index, value) => {
    this._prices[index] = value;

    document.title = this.state.contentPanels.reduce((accum, el, idx) => {
      let str = accum;

      if (str != '') {
        str += ' | ';
      }

      if (el.selectedSymbol != null && idx in this._prices) {
        str += `${el.selectedSymbol}: ${this._prices[idx]}`;
      }

      return str;
    }, '');
  };

  handleContentPanelUpdate = (index, state) => {
    return new Promise((resolve, reject) => {
      this.setState({
        contentPanels: [
          ...this.state.contentPanels.slice(0, index),
          { ...this.state.contentPanels[index], ...state },
          ...this.state.contentPanels.slice(index + 1)
        ]
      }, () => {
        window.location.hash = this.encodeContentPanels();
        resolve(this.state.contentPanels[index]);
      });
    });
  };

  handleContentPanelDelete = (index, state) => {
    return new Promise((resolve, reject) => {
      delete this._prices[index];

      this.setState({
        contentPanels: [
          ...this.state.contentPanels.slice(0, index),
          ...this.state.contentPanels.slice(index + 1)
        ]
      }, () => {
        window.location.hash = this.encodeContentPanels();
        resolve(this.state.contentPanels[index]);
      });
    });
  };

  handleAlert = (index, message) => {
    if (this._lastAlert == message) {
      return;
    }
    const contentPanel = this.state.contentPanels[index];
    this.props.onAlert({ message });
    this._lastAlert = message;
  };

  addContentPanel = () => {
    this.setState({
      contentPanels: this.state.contentPanels.concat([{ ...defaultContentPanel }])
    }, () => {
      window.location.hash = this.encodeContentPanels();
    });
  };

  render() {
    /*var layout = [
      {i: 'a', x: 0, y: 0, w: 1, h: 2, static: true},
      {i: 'b', x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4},
      {i: 'c', x: 4, y: 0, w: 1, h: 2}
    ];*/

    const layout = this.state.contentPanels.map((panel, i) => ({
      i: i.toString(),
      x: i,
      y: 0,
      w: 1,
      h: 2
    }));

    // @TODO: multiple configurable panels
    // each could have their own exchange 

    // @TODO: significant trade tool?
    return (
      <main className='main-content'>
        <Navbar onLoginClick={() => {
          this.setState({ loginModalShowing: true });
        }}/>

        <Sidebar>
        </Sidebar>

        <div className='content'>
          {this.state.loginModalShowing
            ? <LoginModal onModalClose={() => { this.setState({ loginModalShowing: false }); }} />
            : null}

          {/* @TODO: chart with configurable tools */}
          {/* <GridLayout className="layout" layout={layout} cols={12} rowHeight={30} width={1200}> */}
            {this.state.contentPanels.map((panel, i) => {
              return (
                <ContentPanel {...panel}
                  onUpdate={this.handleContentPanelUpdate.bind(this, i)}
                  onPriceChange={this.handlePriceChange.bind(this, i)}
                  onDelete={this.handleContentPanelDelete.bind(this, i)}
                  onAlert={this.handleAlert.bind(this, i)}
                  key={i}
                />
              );
            })}
          {/* </GridLayout> */}

          <div className='add-content-panel' onClick={this.addContentPanel}>
            <i className='fa fa-plus'></i>
            <span>Create Panel</span>
          </div>

        </div>
        
      </main>
    );
  }
}

MainContent.propTypes = {
  onAlert: React.PropTypes.func.isRequired
};

export default MainContent;