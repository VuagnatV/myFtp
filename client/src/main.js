import { createConnection } from "net";
import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
});

let currentCommand = '';
let isAuthenticated = false;

const client = createConnection({ port: 4242 }, () => {
  console.log("client connected.");
});

client.on("data", (data) => {
  const message = data.toString();
  console.log("Message received:", message);

  const [status, ...args] = message.trim().split(" ");
  
  if (status == 230 && currentCommand === "USER") {
    isAuthenticated = true;
  }

  /*if (status == 220) {
    currentCommand = "USER";
    client.write("USER anonymous");
  };*/
});

rl.on("line", (input) => {
  console.log('Input:', input);
  const [command, ...args] = input.trim().split(" ");
  /*switch(command) {
    case "USER":
      console.log("case user")
      client.write(input)
      break
    default:
      console.log("default")
  
  }*/
  client.write(input)
});