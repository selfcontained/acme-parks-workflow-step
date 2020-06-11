import {
  VIEW_CALLBACK_ID,
  BLOCK_PARK_USER,
  ELEMENT_PARK_USER,
  BLOCK_ACCOUNT,
  ACTION_DISCONNECT,
} from "./constants.js";

export const renderWorkflowStep = function (state = {}, blocks) {
  return {
    type: "workflow_step",
    // View identifier
    callback_id: VIEW_CALLBACK_ID,
    blocks,
    // Push the state into metadata to have access on view_submission (being kinda lazy and putting more than needed in here)
    private_metadata: JSON.stringify(state),
  };
};

export const renderConnectAccount = ({ oauthURL }) => {
  const blocks = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `In order to run this step on behalf of you, we'd like to request some permissions from you.`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          action_id: "connect_account_button",
          type: "button",
          style: "primary",
          text: {
            type: "plain_text",
            text: "Request Permissions",
          },
          url: oauthURL,
        },
      ],
    },
  ];

  return blocks;
};

export const getConnectAccountViewId = ({ userId, workflowId, stepId }) => {
  return `connect_${workflowId}_${stepId}_${userId}_${Date.now()}`;
};

// return blocks for the main form
export const renderUpdateStatusForm = function ({
  userName,
  userImage,
  parkUser,
}) {
  const blocks = [
    {
      type: "section",
      block_id: BLOCK_ACCOUNT,
      text: {
        type: "mrkdwn",
        text: `When this step runs, it will find a matching park for the user specified.`,
      },
      accessory: {
        type: "overflow",
        action_id: ACTION_DISCONNECT,
        confirm: {
          title: {
            type: "plain_text",
            text: "Disconnect Account",
          },
          text: {
            type: "mrkdwn",
            text:
              "Are you sure you want to disconnect this account from this step?  You will need to connect a new account afterwards.",
          },
          confirm: {
            type: "plain_text",
            text: "Disconnect",
          },
          deny: {
            type: "plain_text",
            text: "Cancel",
          },
          style: "danger",
        },
        options: [
          {
            text: {
              type: "plain_text",
              text: "Disconnect",
            },
            value: "disconnect",
          },
        ],
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "image",
          image_url: userImage,
          alt_text: userName,
        },
        {
          type: "mrkdwn",
          text: userName,
        },
      ],
    },
    {
      type: "divider",
    },
    {
      type: "input",
      optional: false,
      block_id: BLOCK_PARK_USER,
      element: {
        type: "users_select",
        action_id: ELEMENT_PARK_USER,
        initial_user: parkUser || undefined,
      },
      label: {
        type: "plain_text",
        text: "Who should we find a park for?",
      },
    },
  ];

  return blocks;
};

export const serializeStateForView = (state = {}) => {
  return JSON.stringify(state);
};

export const parseStateFromView = (view) => {
  let state = {};

  try {
    state = JSON.parse(view.private_metadata);
  } catch (e) {
    console.log(e);
  }

  return state;
};
