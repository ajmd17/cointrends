import React from 'react';

class Modal extends React.Component {
  static propTypes = {
    onModalClose: React.PropTypes.func.isRequired
  };

  componentDidMount() {
    // hide body's scrollbar on mount
    document.body.style.overflow = 'hidden';
  }

  componentWillUnmount() {
    // re-show body's scrollbar
    document.body.style.overflow = 'auto';
  }

  render() {
    let className = 'modal-window';

    return (
      <div className='modal-background' onClick={this.props.onModalClose}>
        <div className={className} onClick={e => e.stopPropagation()}>
          <div className='modal-header'>
            <h3>{this.props.title}</h3>
            <div className='x-btn'>
              <a onClick={this.props.onModalClose}>
                <img src='/images/close-button.png'/>
              </a>
            </div>
          </div>
          <div className='content'>
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

export default Modal;