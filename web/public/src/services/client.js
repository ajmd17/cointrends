import axios from 'axios';

import auth from './auth';

const client = {
  auth,

  account: {
    register(data) {
      return axios.post('/api/register', data).then(({ data }) => data);
    }
  }
};

export default client;