import { findClientByToken } from "./constants.js";
import { registerOAuthHandlers } from "./oauth.js";
import { findParkMatchByName } from "./parks.js";

//
// This file's intent is to provide an example of a consumable api for the workflow step to interface with
//

export const configureAcmeServiceApi = (expressApp) => {
  registerOAuthHandlers(expressApp);

  expressApp.get("/api/park", (req, res) => {
    const { name, token } = req.query;

    const client = findClientByToken(token);
    if (!client) {
      return res.status(401).send("Invalid auth");
    }

    if (!name) {
      return res.status(400).send("Missing name");
    }

    const park = findParkMatchByName(name);

    res.status(200).json({
      park_name: park.name,
      park_state: park.state,
    });
  });
};
