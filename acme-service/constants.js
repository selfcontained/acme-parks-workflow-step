// Some static values to facilitate a fake token exchange when connecting an account
const VALID_CLIENTS = [
  {
    id: "ACME_WORKFLOW_CLIENT",
    secret: "VHKu2JDOacQVGcOWmAZr",
    name: "Acme Slack App",
    exchange_code: "fnqQPmlaFX",
    access_token: "TdiBYirkhu",
  },
];

export const findClientById = (clientId) => {
  return VALID_CLIENTS.find((client) => client.id === clientId);
};

export const findClientByToken = (token) => {
  return VALID_CLIENTS.find((client) => client.access_token === token);
};
