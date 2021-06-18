import React, {useState, useCallback, useMemo} from 'react';
import {Alert} from 'react-native';
import {
  authorize,
  refresh,
  revoke,
  prefetchConfiguration,
} from 'react-native-app-auth';
import {
  Page,
  Button,
  ButtonContainer,
  Form,
  FormLabel,
  FormValue,
  Heading,
} from './components';

const configs = {
  custom: {
    issuer: 'http://localhost:8001',
    clientId: 'wOzvSUDj4oWKOVJbiapZsZSEj6eqWjwhRFAtTBm1',
    // The syntax for this is: <Android redirect url>:/<actual URL redirect path>
    // redirect uri is from our mobile consumer tutorial
    // ref: https://django-oauth-toolkit.readthedocs.io/en/latest/tutorial/tutorial_01.html#create-an-oauth2-client-application
    redirectUrl: 'com.oauthlogin.auth://custom/login/callback/',
    additionalParameters: {},
    scopes: [
      'openid' /* The additional scopes you set in the provider: 'profile', 'email'*/,
    ],
    // You can find these endpoints in oauth2_provider.urls
    serviceConfiguration: {
      authorizationEndpoint: 'http://localhost:8001/o/authorize/',
      tokenEndpoint: 'http://localhost:8001/o/token/',
      revocationEndpoint: 'http://localhost:8001/o/revoke_token/',
    },
  },
};

const defaultAuthState = {
  hasLoggedInOnce: false,
  provider: '',
  accessToken: '',
  accessTokenExpirationDate: '',
  // Refresh tokens don't expire for OAuth providers
  // since we don't save username password here
  refreshToken: '',
  // These tokens are for your actual backend/consumer, not the provider's
  appAccessToken: '',
  appRefreshToken: '',
};

const App = () => {
  const [authState, setAuthState] = useState(defaultAuthState);
  React.useEffect(() => {
    // noinspection JSIgnoredPromiseFromCall
    prefetchConfiguration({
      warmAndPrefetchChrome: true,
      ...configs.custom,
    });
  }, []);

  const handleAuthorize = useCallback(async provider => {
    try {
      const config = configs[provider];
      const newAuthState = await authorize(config);

      fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: newAuthState.accessToken,
          refresh_token: newAuthState.refreshToken,
        }),
      })
        .then(response => {
          console.log(response);
          return response.json();
        })
        .then(json => {
          setAuthState({
            hasLoggedInOnce: true,
            provider: provider,
            appAccessToken: json.access_token,
            appRefreshToken: json.refresh_token,
            ...newAuthState,
          });
        })
        .catch(error => console.error(error));
    } catch (error) {
      Alert.alert('Failed to log in', error.message);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      const config = configs[authState.provider];
      const newAuthState = await refresh(config, {
        refreshToken: authState.refreshToken,
      });

      setAuthState(current => ({
        ...current,
        ...newAuthState,
        refreshToken: newAuthState.refreshToken || current.refreshToken,
      }));
    } catch (error) {
      Alert.alert('Failed to refresh token', error.message);
    }
  }, [authState]);

  const handleRevoke = useCallback(async () => {
    try {
      const config = configs[authState.provider];
      await revoke(config, {
        tokenToRevoke: authState.accessToken,
        sendClientId: true,
      });

      setAuthState({
        provider: '',
        accessToken: '',
        accessTokenExpirationDate: '',
        refreshToken: '',
      });
    } catch (error) {
      Alert.alert('Failed to revoke token', error.message);
    }
  }, [authState]);

  const showRevoke = useMemo(() => {
    if (authState.accessToken) {
      const config = configs[authState.provider];
      if (config.issuer || config.serviceConfiguration.revocationEndpoint) {
        return true;
      }
    }
    return false;
  }, [authState]);

  return (
    <Page>
      {authState.accessToken ? (
        <Form>
          <FormLabel>Provider Access Token</FormLabel>
          <FormValue>{authState.accessToken}</FormValue>
          <FormLabel>accessTokenExpirationDate</FormLabel>
          <FormValue>{authState.accessTokenExpirationDate}</FormValue>
          <FormLabel>Provider Refresh Token</FormLabel>
          <FormValue>{authState.refreshToken}</FormValue>
          <FormLabel>Consumer Access Token</FormLabel>
          <FormValue>{authState.appAccessToken}</FormValue>
          <FormLabel>Consumer Refresh Token</FormLabel>
          <FormValue>{authState.appRefreshToken}</FormValue>
          <FormLabel>scopes</FormLabel>
          <FormValue>{authState.scopes.join(', ')}</FormValue>
        </Form>
      ) : (
        <Heading>
          {authState.hasLoggedInOnce ? 'Goodbye.' : 'Hello, stranger.'}
        </Heading>
      )}

      <ButtonContainer>
        {!authState.accessToken ? (
          <>
            {/* If you copy this Button tag, you can add more OAuth apps */}
            <Button
              onPress={() => handleAuthorize('custom')}
              text="Authorize Custom OAuth"
              color="#DA2536"
            />
          </>
        ) : null}
        {authState.refreshToken ? (
          <Button onPress={handleRefresh} text="Refresh" color="#24C2CB" />
        ) : null}
        {showRevoke ? (
          <Button onPress={handleRevoke} text="Revoke" color="#EF525B" />
        ) : null}
      </ButtonContainer>
    </Page>
  );
};

export default App;
