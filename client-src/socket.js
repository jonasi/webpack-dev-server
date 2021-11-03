/* global __webpack_dev_server_client__ */

import WebSocketClient from "./clients/WebSocketClient.js";
import { log } from "./utils/log.js";

// this WebsocketClient is here as a default fallback, in case the client is not injected
/* eslint-disable camelcase */
const Client =
  // eslint-disable-next-line camelcase, no-nested-ternary
  typeof __webpack_dev_server_client__ !== "undefined"
    ? // eslint-disable-next-line camelcase
      typeof __webpack_dev_server_client__.default !== "undefined"
      ? __webpack_dev_server_client__.default
      : __webpack_dev_server_client__
    : WebSocketClient;
/* eslint-enable camelcase */

const initSocket = function initSocket(url, handlers, reconnect) {
  let retries = 0;
  const maxRetries = reconnect;

  function socket() {
    const client = new Client(url);

    client.onClose(() => {
      if (retries === 0) {
        handlers.close();
      }

      // After maxRetries, stop trying in order to prevent logspam.
      if (retries < maxRetries) {
        // Exponentially increase timeout to reconnect.
        // Respectfully copied from the package `got`.
        // eslint-disable-next-line no-mixed-operators, no-restricted-properties
        const retryInMs = 1000 * Math.pow(2, retries) + Math.random() * 100;

        retries += 1;

        log.info("Trying to reconnect...");

        setTimeout(() => {
          socket();
        }, retryInMs);
      }
    });

    client.onMessage((data) => {
      const message = JSON.parse(data);

      if (handlers[message.type]) {
        handlers[message.type](message.data);
      }
    });
  }

  socket();
};

export default initSocket;
