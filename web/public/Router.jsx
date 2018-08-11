import * as React from 'react';
import {
  Router,
  Route,
  IndexRoute,
  Redirect,
  browserHistory
} from 'react-router';
import AsyncProps from 'async-props';

import MainContent from './src/screens/MainContent';

// import AppContainer from './components/AppContainer';
// import ProductLanding from './product-landing';
// import Login from './login';
// import Register from './register';
// import Trade from './trade';
// import TradeView from './trade/components/TradeView';

function isBrowser() {
  return typeof window !== 'undefined' && window.document && window.document.createElement;
}

function resetScrollPosition(prevState, nextState) {
  if (typeof window === 'object' && nextState.location.action !== 'POP') {
    window.scrollTo(0, 0);
  }
}

const notFound = () => {
  return (
    <div>
      <h1>
        The page could not be found (404)
      </h1>
    </div>
  );
};

const appRouter = () => {
  console.log('here')
  return (
    <Router history={browserHistory}>
      <Route path='/' component={MainContent}>
      </Route>
    </Router>
  );
};

export default appRouter;