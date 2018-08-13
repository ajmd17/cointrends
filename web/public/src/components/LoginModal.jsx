import React from 'react';

import Modal from './Modal';

class LoginModal extends React.Component {
  static propTypes = {
    onLogin: React.PropTypes.func.isRequired,
    onModalClose: React.PropTypes.func.isRequired
  };

  render() {
    return (
      <Modal title='Login' onModalClose={this.props.onModalClose}>
      </Modal>
    );
  }
}

export default LoginModal;