import axios from "axios";
import get from "lodash.get";
import { registerOAuthCallback } from "./oauth.js";
import {
  STEP_CALLBACK_ID,
  VIEW_CALLBACK_ID,
  BLOCK_PARK_USER,
  ELEMENT_PARK_USER,
  ACTION_DISCONNECT,
} from "./constants.js";
import {
  parseStateFromView,
  renderConnectAccountView,
  renderStepFormView,
} from "./view.js";

const HOST = process.env.HOST;

export const registerFindParkStep = function (app, data) {
  // This adds an http route to receive the oauth callback and store the token
  // as well as update the block-kit view to reflect that
  registerOAuthCallback(app, data);

  // Register step config action
  // This will either render a connect account view, or step form view
  app.action(
    {
      type: "workflow_step_edit",
      callback_id: STEP_CALLBACK_ID,
    },
    async ({ body, ack, context }) => {
      ack();

      // Let's grab the properties we need from the payload
      const { workflow_step, user, team } = body;
      const {
        inputs = {},
        workflow_id: workflowId,
        step_id: stepId,
      } = workflow_step;

      const currentUserId = user.id;
      const currentTeamId = team.id;

      // First, let's see if this step has a credential configured, or if the current user has one previously stored
      let credentialId =
        get(inputs, "credential_id.value") ||
        data.getCredentialId({ userId: currentUserId, teamId: currentTeamId });

      // Let's try and load the associated token
      const userTokenExists = !!(await data.get(credentialId));

      // If we don't have a corresponding token (or there's no credential configured) we'll render the connect account view
      if (!userTokenExists) {
        const view = renderConnectAccountView({
          userId: currentUserId,
          teamId: currentTeamId,
          workflowId,
          stepId,
        });

        app.logger.info("Opening connect account view");
        await app.client.views.open({
          token: context.botToken,
          trigger_id: body.trigger_id,
          view,
        });
      }

      // At this point, we have a valid credential configured, so we can render the main step form

      // Grab the configured user or current user
      let authUserId = get(inputs, "auth_user_id.value") || currentUserId;

      // Lookup the user's info so we can display their name and profile image
      const userInfo = await app.client.users.info({
        token: context.botToken,
        user: authUserId,
      });

      const view = renderStepFormView({
        workflowId,
        stepId,
        authUserId,
        credentialId,
        userName: userInfo.user.real_name,
        userImage: userInfo.user.profile.image_192,
        parkUserId: get(inputs, "park_user_id.value"),
      });

      app.logger.info("Opening step form view");
      await app.client.views.open({
        token: context.botToken,
        trigger_id: body.trigger_id,
        view,
      });
    }
  );

  // Nothing to do here, it's a link button, but need to ack it
  app.action("connect_account_button", async ({ ack }) => ack());

  // Delete the credential and transition to the connect account view
  app.action(ACTION_DISCONNECT, async ({ ack, body, context }) => {
    ack();

    const { view, user, team } = body;
    const currentUserId = user.id;
    const currentTeamId = team.id;
    const externalViewId = view.external_id;

    const updatedView = renderConnectAccountView({
      userId: currentUserId,
      teamId: currentTeamId,
      // Set it to the same external view id of the current view so we update it
      externalViewId,
    });

    await app.client.views.update({
      token: context.botToken,
      view_id: view.id,
      view: updatedView,
    });
  });

  // Handle saving of step config
  app.view(VIEW_CALLBACK_ID, async ({ ack, view, body, context }) => {
    // Pull out any values from our view's state that we need that aren't part of the view submission
    const { authUserId, credentialId } = parseStateFromView(view);
    const workflowStepEditId = get(body, `workflow_step.workflow_step_edit_id`);

    const parkUserId = get(
      view,
      `state.values.${BLOCK_PARK_USER}.${ELEMENT_PARK_USER}.selected_user`
    );

    const inputs = {
      auth_user_id: {
        value: authUserId,
      },
      credential_id: {
        value: credentialId,
      },
      park_user_id: {
        value: parkUserId,
      },
    };

    const errors = {};
    if (!inputs.auth_user_id.value || !inputs.credential_id.value) {
      errors[BLOCK_PARK_USER] = "Account was not configured correctly.";
    }

    if (!inputs.park_user_id.value) {
      errors[BLOCK_PARK_USER] = "Please select someone to find a park for.";
    }

    if (Object.values(errors).length > 0) {
      return ack({
        response_action: "errors",
        errors,
      });
    }

    // We can now safely ack the view
    ack();

    try {
      app.logger.info("Updating step");
      // Call the api to save our step config
      await app.client.apiCall("workflows.updateStep", {
        token: context.botToken,
        workflow_step_edit_id: workflowStepEditId,
        inputs,
        outputs: [
          {
            type: "user",
            name: "park_user",
            label: `User we found a park for`,
          },
          {
            type: "text",
            name: "park_name",
            label: `Park name`,
          },
          {
            type: "text",
            name: "park_state",
            label: `Park state`,
          },
        ],
      });
    } catch (e) {
      app.logger.error("Error updating step: ", e.message);
    }
  });

  // Handle running the step
  app.event("workflow_step_execute", async ({ event, context }) => {
    const { callback_id, workflow_step = {} } = event;
    // We have to ensure this is the step we're interested in here in case we have multiple steps in our app
    if (callback_id !== STEP_CALLBACK_ID) {
      return;
    }

    const { inputs = {}, workflow_step_execute_id } = workflow_step;
    const { park_user_id, credential_id } = inputs;

    try {
      const parkUserId = park_user_id.value || "";

      // Lookup user info
      const userInfo = await app.client.users.info({
        token: context.botToken,
        user: parkUserId,
      });

      // Get the credential for the acme api call
      const userToken = await data.get(credential_id.value);
      const response = await axios({
        method: "GET",
        url: `${HOST}/api/park?name=${userInfo.user.real_name}&token=${userToken}`,
      });

      const { park_name, park_state } = response.data || {};

      // Report back that the step completed
      await app.client.apiCall("workflows.stepCompleted", {
        token: context.botToken,
        workflow_step_execute_id,
        outputs: {
          park_user: parkUserId,
          park_name,
          park_state,
        },
      });

      app.logger.info("step completed");
    } catch (e) {
      app.logger.error("Error completing step", e.message);
      await app.client.apiCall("workflows.stepFailed", {
        token: context.botToken,
        workflow_step_execute_id,
        error: e.message,
      });
    }
  });
};
