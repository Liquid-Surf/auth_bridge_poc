import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import cors from 'cors';
// import fetch from 'node-fetch'
import { fetch } from "@inrupt/universal-fetch";

import { URLSearchParams } from 'url';
import {DEFAULT_POD_PW,  SolidServer} from './SolidServer'
import { CLIENT_ID, Github } from './Github'
import path from 'path'


const CSS_URL = 'http://localhost:3055'
const CSS_INSTANCE = new SolidServer(CSS_URL)
const SESSION_SECRET = 'session_secret'

const REDIRECT_URI = 'http://localhost:5002/callback';

interface TodoSession extends session.SessionData {
  userInfo?: any;
  userEmail?: string;
  gh_accessToken?: string;
  // authFetch?: any; cannot store function in sessin :'(
}

function debug(text: string, obj: any = null){
  console.log("[DEBUG] " + text)
  if(obj)
    console.log(obj)

}

export const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) =>  {
  if(req.session){
    const session = req.session as TodoSession
    console.log(session.userInfo)
    if (session.userInfo) {
      // console.log(session.userInfo)
      const username = session.userInfo.login;
      res.send(`Hello, ${username} <a href="/logout">logout</a><br/><a href="/view/">view file</a> <a href="/view/${username}/private/secret">view your secret</a>`);
    } else {
      res.send('Hello nobody <a href="/login">login with github</a>');
    }
  }
});

app.get('/login', (req, res) =>  {
  res.redirect(Github.authUrl(REDIRECT_URI));
});

app.get('/logout', (req, res) =>  {
  req.session?.destroy(() => {});
  res.redirect('/');
});

app.get('/callback', async (req, res) =>  {
  console.log("CALLBACK")
  const code = req.query.code as string;
  const gh_accessToken = await Github.getAccessToken(code );
  const userInfo = await Github.getUserInfo(gh_accessToken);
	const email = await Github.getUserEmail(gh_accessToken);
	debug('email', email)
  const authFetch = await CSS_INSTANCE.createAuthFetch(email, DEFAULT_POD_PW)
  const session = req.session as TodoSession

  session.userInfo = userInfo;
  session.userEmail = email;
  session.gh_accessToken = gh_accessToken
  console.log("session:")
  console.log(session)
  res.redirect('/');
});

app.get('/secret/', async (req, res) =>  {
  const session = req.session as TodoSession
	if(session.userInfo){
  	const username = session.userInfo.login
  	const email = session.userEmail;
  	if (! await CSS_INSTANCE.doesPodExists(username)){
    	console.log(`no pod exist for ${username}`)
    	const success = await CSS_INSTANCE.createHiddenPodForGithubUser(username, email);
    	if (success){
      	const authFetch = await CSS_INSTANCE.createAuthFetch(email, 'pw123')
      	const resp = await authFetch(`${CSS_URL}/${username}/private/secret`)
      	res.send(await resp.text())
    	}else{
      	res.send('couldnt create a pod')
    	}
  	}else{
      	console.log(`pod already exist for ${username}`)
      	const authFetch = await CSS_INSTANCE.createAuthFetch(email, 'pw123')
      	const resp = await authFetch(`${CSS_URL}/${username}/private/secret`)
      	const resp_text = await resp.text()
      	console.log(`fetched resource and got ${resp_text}`)
      	res.send(resp_text)
  	}

	}else{
  	res.send('no session found')
	}

})


app.get('/view/*', async (req, res) => {
    const session = req.session as TodoSession;
    const path = req.params[0]
    debug("path", `${path}`)

    try {
      if (session.userInfo) {

          const email = session.userEmail;
          const authFetch = await CSS_INSTANCE.createAuthFetch(email, DEFAULT_POD_PW);
          const url = `${CSS_URL}/${path}`
          console.log(`Fetching with auth.  ${url}`)
          const resp = await authFetch(url);
          const resp_text = await resp.text();
      res.render('view', {userInfo: session.userInfo, content: resp_text})
      } else {
          const url = `${CSS_URL}/${path}`
          console.log(`Fetching without auth. ${url}`)
          const resp = await fetch(url);
          const resp_text = await resp.text();
          res.render('view', {userInfo: null, content: resp_text})
      }
    } catch (error) {
      throw new Error(`/view/ Couldn't fetch ${path} : ${error}`)
    }
});







