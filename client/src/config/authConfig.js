import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { IndexedDbDPoPStore } from 'oidc-client-ts'; 

const oidcConfig = {
    authority: 'https://localhost:9443/realms/zero-trust',
    client_id: 'react-client',
    redirect_uri: 'https://localhost:3000/callback',
    response_type: 'code',
    scope: 'openid profile email',
    post_logout_redirect_uri: 'https://localhost:3000/',
    dpop: {
        enabled: true,
        signingKeyAlgorithm: 'ES256',
        store: new IndexedDbDPoPStore()
    },
    userStore: new WebStorageStateStore({ store: window.localStorage }),
};

const userManager = new UserManager(oidcConfig);

export default userManager;