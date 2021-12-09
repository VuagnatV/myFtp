import { createServer } from "net";
import users from './users.json'
import * as fs from 'fs';

let usersString = JSON.stringify(users);

export function launch(port) {
  const server = createServer((socket) => {
    console.log("new connection.");
    socket.on("data", (data) => {
      const message = data.toString();

      const [command, ...args] = message.trim().split(" ");
      console.log(command, args);

      switch(command) {
        case "USER":
          //if(usersString.includes(`"username": ${args[0]}`)){
          if(usersString.includes(args[0])) {
            socket.write("331 User name okay, need password.\r\n");
          }
          else {
            socket.write("530 Not logged in.\r\n")
          }
          //socket.write("230 User logged in, proceed.\r\n");
          break;
        case "PASS":
          if(usersString.includes(args[0])) {
            socket.write("230 User logged in, proceed.\r\n");
          }
          else {
            socket.write("530 Not logged in.\r\n")
          }
          break
        case "LIST": // voir ftp, maybe ajouter le choix de position
          fs.readdir(process.cwd(), (err, files) => {
            socket.write(files.join(", ")) // structure de la réponse
          })
          break
        case "CWD":
          process.chdir(args[0])
          break
        case "PWD": // voir ftp, maybe ajouter le choix de position
          socket.write(`257 ${process.cwd()}`)
          break
        case "SYST":
          socket.write("215 \r\n");
          break;
        case "FEAT":
          socket.write("211 \r\n");
          break;
        case "PWD":
          socket.write("257 /users/dylan\r\n");
          break;
        case "TYPE":
          socket.write("200 \r\n");
          break;
        default:
          console.log("command not supported:", command, args);
      }
    });

    socket.write("220 Hello World \r\n");
  });

  server.listen(port, () => {
    console.log(`server started at localhost:${port}`);
  });
}
