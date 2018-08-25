import React from 'react';

class Sidebar extends React.Component {
  static propTypes = {
    right: React.PropTypes.bool
  };

  render() {
    let className = 'sidebar';

    if (this.props.right) {
      className += ' right';
    }

    return (
      <div className={className}>
        {this.props.children}
      </div>
    );
  }
}

export default Sidebar;