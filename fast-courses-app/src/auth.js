import { useEffect, useState } from 'react';
import qs from 'qs';

const fetchSelf = () => {
  return fetch(`${process.env.REACT_APP_ENDPOINT}self`, { credentials: 'include' })
    .then(r => r.json());
}

const authenticate = () => {
  window.location.href = `${process.env.REACT_APP_ENDPOINT}login?${qs.stringify({
    redirect: window.location.href
  })}`;
}

export const useAuth = ({ autoAuthenticate }) => {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchSelf()
      .then(data => {
        if (data.error) {
          setNeedsAuth(true);
        } else {
          setUser(data)
        }
      })
      .catch(err => {
        window.alert(err.message);
      });
  }, []);

  useEffect(() => {
    if (autoAuthenticate && needsAuth) {
      authenticate();
    }
  }, [needsAuth, autoAuthenticate]);

  return {
    needsAuth,
    user,
    authenticate
  };
};
