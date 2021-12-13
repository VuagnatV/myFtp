import { createServer, createConnection } from "net";
import { createInterface } from "readline";
import * as fs from 'fs';

const portData = "4243"

const rl = createInterface({
  input: process.stdin,
});

function dataServer(port){
  const server = createServer((socket) => {
    socket.on("data", (data) => {
      const message = data.toString()
      const [command, ...args] = message.trim().split(" ");
      switch(command) {
        case "RETR":
          const [name, ...text] = args
          fs.writeFile(name, text.join(" "), err => {
            if (err) throw err
          })
          break
        case "STOR":
          socket.write(args[0] + " " + fs.readFileSync(args[0], 'utf-8'))
          break
        case "QUIT":
          socket.destroy()
          server.close()
        default:
          console.log("500 command not supported:", command, args);
      }
    })
  })

  server.listen(port, () => {
    console.log(`server started at localhost:${port}`)
  })
}

dataServer(portData)

const client = createConnection({ port: process.argv[3] || 4242}, () => {
  console.log("client connected.")
});

client.on("data", (data) => {
  const message = data.toString()
  console.log("Message received:", message)
})

rl.on("line", (input) => {
  client.write(input)
  if(input === "QUIT"){
    rl.close()
  }
})

