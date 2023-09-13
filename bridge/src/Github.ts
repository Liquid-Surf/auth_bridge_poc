import { fetch } from "@inrupt/universal-fetch";
import type from "@inrupt/universal-fetch";
import dotenv from 'dotenv'

dotenv.config({ path: '.secret' });

export const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
console.log("CLIENT_ID " + CLIENT_ID)

export class Github {

  static authUrl(redirectUrl: string) {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: redirectUrl,
      scope: 'user:email',
      // prompt: 'consent'
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  static async getAccessToken (code: string) : Promise<string>   {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code
      })
    });
    const data = await response.json();
    return data.access_token;
  };

  static async getUserInfo (accessToken: string) : Promise<any>   {
      const response = await fetch('https://api.github.com/user', {
          headers: {
              Authorization: `token ${accessToken}`,
              Accept: 'application/json'
          }
      });


      if (!response.ok) {
  				throw new Error("Error fetching github's user info" + response.statusText)
      } 
      const userInfo = await response.json();
      return userInfo;  
  };

  static async getUserEmail (accessToken: string) : Promise<string | null>    {
      const response = await fetch('https://api.github.com/user/emails', {
          headers: {
              Authorization: `token ${accessToken}`,
              Accept: 'application/json'
          }
      });

      if (!response.ok) {
  				throw new Error("Error fetching github's user email" + response.statusText)
      } 
      const emailList = await response.json();
      for (let emailObj of emailList) {
          if (emailObj.primary) {  // If this is the user's primary email
              return emailObj.email;  // Return the email
          }
      }
			throw new Error("No email found in github account" + response.statusText)
  }


}
