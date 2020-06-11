import bodyParser from "body-parser";
import { findClientById } from "./constants.js";

//
// This file's intent is to provide an example of a consumable api for the workflow step to interface with
//
export const registerOAuthHandlers = (expressApp) => {
  // This endpoint represents an oauth handler for the acme service api
  // It's purely meant to facilitate a derived flow for a workflow step and an external service
  // and does not comply with the OAuth specification in any form :smile:
  expressApp.get("/oauth/authorize", (req, res) => {
    const { client_id, redirect_uri, state } = req.query;

    const client = findClientById(client_id);
    if (!client) {
      return res.status(401).send("Invalid client");
    }

    res.status(200).send(`
      <html>
        <div style='max-width: 500px;margin: 200px auto;'>
          <h1>Acme Park Finder Serivce</h1>
          <p>Please acknowledge if you'd like to grant permission for the following application to use the Acme Park Finder Serivce on behalf of you</p>
          <h2>${client.name}</h2>
          <form action='/oauth/authorize' method='POST'>
            <input type='hidden' name='client_id' value='${client_id}' />
            <input type='hidden' name='state' value='${state}' />
            <input type='hidden' name='redirect_uri' value='${redirect_uri}' />
            <button type='submit'>Approve</button>
          </form>
        </div>
      </html>
    `);
  });

  expressApp.post(
    "/oauth/authorize",
    bodyParser.urlencoded({ extended: true }),
    (req, res) => {
      const { client_id, redirect_uri, state } = req.body;

      const client = findClientById(client_id);
      if (!client) {
        return res.status(401).send("Invalid client");
      }

      res.redirect(
        `${redirect_uri}?state=${state}&code=${client.exchange_code}`
      );
    }
  );

  expressApp.post("/oauth/access", bodyParser.json(), (req, res) => {
    const { code, client_id, client_secret } = req.body;

    const client = findClientById(client_id);
    if (
      !client ||
      client.secret !== client_secret ||
      client.exchange_code !== code
    ) {
      return res.status(401).send("Invalid client");
    }

    res.status(200).json({
      access_token: client.access_token,
    });
  });
};
