import React from 'react';

class LoadingMessage extends React.Component {
  static propTypes = {
    text: React.PropTypes.string.isRequired
  };

  render() {
    return (
      <div className='loading-message'>
        {this.props.text}
      </div>
    );
  }
}

export default LoadingMessage;