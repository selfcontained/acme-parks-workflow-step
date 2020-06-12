import axios from "axios";
import { renderStepFormView } from "./view.js";

const HOST = process.env.HOST;
// This is derived to facilitate an example authentication flow
const ACME_CLIENT_ID = process.env.ACME_CLIENT_ID;
const ACME_CLIENT_SECRET = process.env.ACME_CLIENT_SECRET;
const OAUTH_CALLBACK_URL = `/auth/callback`;

export const registerOAuthCallback = (app, data) => {
  const expressApp = app.receiver.app;

  // Attach a handler to our express server for receiving the oauth callback
  // Here we can exchange out token, and update the corresponding Block-Kit view w/ a connected account
  expressApp.get(OAUTH_CALLBACK_URL, async (req, res) => {
    let code = req.query.code;

    let state = {};
    try {
      state = JSON.parse(req.query.state);
    } catch (e) {
      app.logger.error(e);
      return res
        .status(500)
        .send("There was a problem connecting your account");
    }

    try {
      // Make a request to exchange our code for our access token
      const result = await axios({
        method: "POST",
        url: `${HOST}/oauth/access`,
        data: {
          code,
          client_id: ACME_CLIENT_ID,
          client_secret: ACME_CLIENT_SECRET,
        },
      });

      const { access_token } = result.data;
      const { userId, teamId, externalViewId } = state;

      // Store the credential id
      const credentialId = data.getCredentialId({ userId, teamId });
      await data.set(credentialId, access_token);

      // Get user info
      const userInfo = await app.client.users.info({
        token: process.env.SLACK_BOT_TOKEN,
        user: userId,
      });

      // Update the current block-kit view with the step form
      await app.client.views.update({
        token: process.env.SLACK_BOT_TOKEN,
        external_id: externalViewId,
        view: renderStepFormView({
          externalViewId,
          authUserId: userId,
          credentialId,
          userName: userInfo.user.real_name,
          userImage: userInfo.user.profile.image_192,
          parkUserId: "",
        }),
      });

      res
        .status(200)
        .send(
          "Account connected, you can now close this window and return to <a href='slack://'>Slack</a>."
        );
    } catch (err) {
      app.logger.error(err);

      res.status(500).send("There was a problem connecting your account");
    }
  });
};

// Endpoint hosted by our Slack App to handle receiving the oauth callback and exchanging our code for token
export const buildOAuthRedirectURL = () => {
  return `${HOST}${OAUTH_CALLBACK_URL}`;
};

export const buildOAuthURL = (state) => {
  const redirectURI = buildOAuthRedirectURL();
  const oauthState = encodeURIComponent(JSON.stringify(state));

  // Since we're also hosting our sample Acme service and it's "OAuth" endpoints, we'll point to that here
  return `${HOST}/oauth/authorize?client_id=${ACME_CLIENT_ID}&redirect_uri=${redirectURI}&state=${oauthState}`;
};
