import React from 'react';

class Accordion extends React.Component {
  static propTypes = {
    title: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.element
    ]),
    onClick: React.PropTypes.func,
    isOpened: React.PropTypes.bool
  };

  static defaultProps = {
    isOpened: false
  };
  
  constructor(props) {
    super(props);
    this.state = {
      showingContent: this.props.isOpened
    };
  }

  componentWillReceiveProps(newProps) {
  }
  
  toggleContent = () => {
    if (typeof this.props.onClick === 'function') {
      this.props.onClick(!this.state.showingContent);
    } //else {
      
    this.setState({
      showingContent: !this.state.showingContent
    });
    //}
  };

  componentWillReceiveProps(newProps) {
    if (newProps.isOpened != this.state.showingContent) {
      this.setState({
        showingContent: newProps.isOpened
      });
    }
  }

  render() {
    return (
      <div className={`accordion${this.state.showingContent ? ' opened' : ''}`}>
        <a className={this.state.showingContent ? 'checked' : 'unchecked'} onClick={this.toggleContent}>
          <i className={`fa fa-caret-${this.state.showingContent ? 'down' : 'right'} fa-fw`}/>
          {typeof this.props.title === 'string' || this.props.title instanceof String
            ? <span>
                {this.props.title}
              </span>
            : this.props.title}
        </a>
        <div className='content'>
          {this.props.children}
        </div>
      </div>
    );
  }
}

export default Accordion;