import { fetch } from "@inrupt/universal-fetch";
import type from "@inrupt/universal-fetch";
import { buildAuthenticatedFetch, createDpopHeader, generateDpopKeyPair } from '@inrupt/solid-client-authn-core';

export const DEFAULT_POD_PW = 'pw123'

export class SolidServer {
  url: String

	constructor(url: string){
  	this.url = url
	}

  async doesPodExists (podname: string) : Promise<boolean>   {
    try {
      const response = await fetch(`${this.url}/${podname}/`);      
      if (response.status === 200) {
        return true;
      } else {
        // TODO check specific code if pod doesn't exist ( shoudl be 404 )
        return false;
      }
    } catch (error) {
			throw new Error("Error checking if pod exist" + error)
    }
  }

  async createHiddenPodForGithubUser (username: string, email: string ) : Promise<any>  {
    try {      const response = await fetch(`${this.url}/idp/register/`);
      // TODO change default password
      const new_account = { email: email, 
      											password: DEFAULT_POD_PW, 
      											confirmPassword: DEFAULT_POD_PW,
      											podName: username, 
      											createWebId: true, 
      											register: true, 
      											createPod: true, 
      											rootPod: false, 
      										}
      const resp = await fetch(this.url + '/idp/register/', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(new_account),
        });
      
      if (response.status === 200) {
        return true;
      } else {
  			throw new Error("Couldn't create a pod. " + response.statusText)
      }
    } catch (error) {
			throw new Error("Error while trying to create a pod. " + error)
    }

  }

  async createAuthFetch (email: string, password: string): Promise<any> {
    try {
      const { id, secret } = await this.authGenerateToken(email, password) // TODO: should be done only once ? possible to store id and secret ?
      const { accessToken, dpopKey } = await this.authGetAccessToken({id, secret})
      // The DPoP key needs to be the same key as the one used in the previous step.
      // The Access token is the one generated in the previous step.
      const authFetch = await buildAuthenticatedFetch(fetch, accessToken, { dpopKey });
      return authFetch
    } catch(error) {
			throw new Error("Error trying to create an authenticated fetch function. " + error)
    }
  }

	async authGenerateToken (email: string, password: string) : Promise<any> {
  	try {
      const response = await fetch(this.url + '/idp/credentials/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // The email/password fields are those of your account.
        // The name field will be used when generating the ID of your token.
        body: JSON.stringify({ email: email, password: password, name: 'my-token' }),
      });
      if (response.status != 200 ) {
  			throw new Error("Failled to generate token. " + response.statusText)

      }

      // These are the identifier and secret of your token.
      // Store the secret somewhere safe as there is no way to request it again from the server!
      const {id, secret } = await response.json();

      console.log("CSS token generation response:")
      console.log( {id, secret } )
      return { id, secret }
  	} catch(error) {
			throw new Error("Error while generating token. " + error)
  	}

  }

	async authGetAccessToken ({id, secret}: { id: string, secret: string }) : Promise<any> {
  	try {
        // A key pair is needed for encryption.
        // This function from `solid-client-authn` generates such a pair for you.
        const dpopKey = await generateDpopKeyPair();

        // These are the ID and secret generated in the previous step.
        // Both the ID and the secret need to be form-encoded.
        const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
        // This URL can be found by looking at the "token_endpoint" field at
        // http://localhost:3000/.well-known/openid-configuration
        // if your server is hosted at http://localhost:3000/.

        const tokenUrl = this.url + '/.oidc/token';

        const response = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            // The header needs to be in base64 encoding.
            authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
            'content-type': 'application/x-www-form-urlencoded',
            dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
          },
          body: 'grant_type=client_credentials&scope=webid',
        });

        if ( response.status != 200 ) {
    			throw new Error("Failled to get access token. " + response.statusText)
        }

        // This is the Access token that will be used to do an authenticated request to the server.
        // The JSON also contains an "expires_in" field in seconds,
        // which you can use to know when you need request a new Access token.
        const resp = await response.json();
        const { access_token: accessToken } = resp;
        return { accessToken, dpopKey } 
      }
   catch(error) {
  	throw new Error("Error getting token. " + error)
  }
}


  }

