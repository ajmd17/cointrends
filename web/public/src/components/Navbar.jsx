import * as React from 'react';

class Navbar extends React.Component {
  static propTypes = {
    onLoginClick: React.PropTypes.func.isRequired
  };

  render() {
    return (
      <nav className='navbar'>
        <div className='nav-content'>
          <h1>CoinTrends</h1>
          <span style={{ float: 'right' }}>
            <button className='btn primary' onClick={this.props.onLoginClick}>
              <i className={`fa fa-user`}></i>
              &nbsp;
              Login
            </button>
          </span>
        </div>
      </nav>
    );
  }
}

export default Navbar;