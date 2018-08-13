import axios from 'axios';
import Cookie from 'react-cookie';

const auth = {
  AuthState: {
    NotSignedIn: 0,
    SignedIn: 1
  },

  state: 0,
  user: {
    id: null,
    name: null,
    email: null
  },

  _accessToken: null,

  get isLoggedIn() {
    return this.accessToken != null;
  },

  logIn(email, password) {
    return axios.post('/api/login', { email, password }).then((res) => {
      this.accessToken = res.data.token;
      return res.data;
    });
  },

  logOut() {
    // delete cookie
    this.accessToken = null;
    return this.reloadProfileData();
  },

  get accessToken() {
    if (!auth._accessToken) {
      const accessToken = Cookie.load('accessToken');

      if (accessToken) {
        auth._accessToken = accessToken;
      }
    }

    return auth._accessToken;
  },

  set accessToken(accessToken) {
    console.log(Cookie)
    if (!accessToken) {
      Cookie.remove('accessToken', {
        path: '/'
      });
    } else {
      let expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 1 week
      Cookie.save('accessToken', accessToken, {
        path: '/',
        expires: expiryDate
      });
    }
    
    auth._accessToken = accessToken;
  },

  /**
   * Used when event such as first going on the page, login, logout etc happens.
   * Emits an event to all listeners to update based on logged in or not.
   * Use with care.
   */
  reloadProfileData() {
    const accessToken = auth.accessToken;
    
    if (accessToken) {
      return Client.Account.fetchProfileData().then((res) => {
        auth.state = auth.AuthState.SignedIn;
        auth.user.id = res.uid;
        auth.user.name = res.name;
        auth.user.email = res.email;

        //Client.events.getEmitter().emit(Client.events.UPDATE_NAV_AUTH, auth);

        return auth;
      }).catch(err => Client.logger.error('Failed to load profile data.', err));
    } else {
      auth.state = auth.AuthState.NotSignedIn;
      auth.user.id = null;
      auth.user.name = null;
      auth.user.email = null;
      auth.user.zone = null;

      //Client.events.getEmitter().emit(Client.events.UPDATE_NAV_AUTH, auth);

      return Promise.resolve(auth);
    }
  }
};

export default auth;