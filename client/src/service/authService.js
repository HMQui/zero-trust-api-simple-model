import * as jose from 'jose';

async function getDpopKeyPair() {
    let keyPair = await getKeyPairFromStorage();
    if (!keyPair) {
        keyPair = await jose.generateJarmKeyAlgorithm('ES256');
        localStorage.setItem('dpop_public_key', JSON.stringify(await jose.exportJWK(keyPair.publicKey)));
        localStorage.setItem('dpop_private_key', JSON.stringify(await jose.exportJWK(keyPair.privateKey)));
    }
    return keyPair;
}

async function getKeyPairFromStorage() {
    const pubJwk = localStorage.getItem('dpop_public_key');
    const privJwk = localStorage.getItem('dpop_private_key');
    if (!pubJwk || !privJwk) return null;

    const publicKey = await jose.importJWK(JSON.parse(pubJwk), 'ES256');
    const privateKey = await jose.importJWK(JSON.parse(privJwk), 'ES256');
    return { publicKey, privateKey };
}

async function createDpopHeader(url, method) {
    const { privateKey, publicKey } = await getDpopKeyPair();
    const jwk = await jose.exportJWK(publicKey);

    const dpopHeader = await new jose.SignJWT({
        htu: url,
        htm: method,
        jti: crypto.randomUUID(),
    })
        .setProtectedHeader({
            alg: 'ES256',
            typ: 'dpop+jwt',
            jwk: jwk,
        })
        .setIssuedAt()
        .setIssuer('react-client')
        .sign(privateKey);

    return dpopHeader;
}