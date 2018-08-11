import React from 'react';
import ReactDOM from 'react-dom';

import 'core-js/client/shim';

import appRouter from './Router';

class App extends React.Component {
  render() {
    return appRouter();
  }
}

ReactDOM.render(
  <App/>,
  document.getElementById('app')
);