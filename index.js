const app = require("./app/app");
const http = require("http");
const { PORT } = require("./app/utils/config");
const log = require("./app/utils/logging");

const server = http.createServer(app);

app.once("ready", () => {
  server.listen(PORT, () => log.i(`Server running... [PORT: ${PORT}]`));
});
