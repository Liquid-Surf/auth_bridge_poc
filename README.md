# Github OAuth - Solid-OIDC bridge POC

This application sets up a Solid server and a Github OAuth - Solid-OIDC bridge to interact with your Solid pod. The bridge acts as a proxy to access your data on the Solid server while authenticated with github.

## Setup

1. **Create a GitHub OAuth App:**

    - Go to your GitHub settings.
    - Select Developer settings from the left panel.
    - Click on OAuth Apps.
    - Click on New OAuth App.
    - Fill in the Application name, Homepage URL (`localhost:5002`),  and Authorization callback URL fields. The Authorization callback URL should match the redirect URI you used in your code (`localhost:5000/callback`).
    - Click Register application.
    - After you register, you'll see a new page with your Client ID and a Client Secret. Put them in the `.secret` file.

2. **Install Dependencies:** Navigate to the `solid_server` and `bridge` folders and run `npm install` in both directories.

3. **Start the Application:** Run `npm run start` in both the `solid_server` and `bridge` folders.

## Usage

### Auto-Generated Pod

1. Open your browser and go to `localhost:5002`.
2. Log in with your GitHub account. This action will create a Solid pod with your GitHub username, containing private and public folders. The private folder will contain a secret that only you can access.
3. Click on "view my secret", and you should see it. If you log out and then return to the secret page and refresh, an error should appear.

### Custom Pod

1. Register a pod at `localhost:3055/idp/register/` using the same email as your GitHub account, your GitHub username as the pod name, and `pw123` as the password.
2. Place text files in the public and private folders located in the `solid_server/data` directory.
3. Access the files via the bridge at `localhost:5002/view/your_username/private/your_file` or `localhost:5002/view/your_username/public/your_file`. Test the access while logged in and not logged in, and also by logging in with another GitHub account.

## Notes

- For testing, you can create text files in the `public` and `private` folders of your `solid_server/data` directory and try accessing them via the bridge.

