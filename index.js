import { default as Bolt } from "@slack/bolt";
import { configureData } from "./data/index.js";
import { configureAcmeServiceApi } from "./acme-service/index.js";
import { registerFindParkStep } from "./find-park-step/index.js";

// Initializes your app with your bot token and signing secret
const app = new Bolt.App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

// This step requires an oauth flow and data layer
const data = configureData(app);
data.on("error", (err) => app.logger.error("Connection Error", err));

registerFindParkStep(app, data);

// Attach our Acme Service API to the same express app Bolt is using
configureAcmeServiceApi(app.receiver.app);

app.error((error) => {
  // Check the details of the error to handle cases where you should retry sending a message or stop the app
  console.error(error, JSON.stringify(error && error.data));
});

app.receiver.app.get("/", (req, res) => res.send({ ok: true }));

(async () => {
  // Start your app
  const port = process.env.PORT || 3000;
  await app.start(port);

  console.log(`⚡️ Bolt app is running on port ${port}!`);
})();
