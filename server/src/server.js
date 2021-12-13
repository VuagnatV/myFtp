import { createServer, createConnection } from "net";
import users from './users.json'
import * as fs from 'fs';

let usersString = JSON.stringify(users);

const sockets = {}

export function launch(port) {
  const server = createServer((socket) => {
    socket.id = Math.floor(Math.random() * 10000)
    sockets[socket.id] = { username: null, dataSocket: null }

    let lastCommand = null
    let userIndex = null
    let authentified = false

    console.log("new connection.");

    socket.on("data", (data) => {

      const message = data.toString();
      const [command, ...args] = message.trim().split(" ");

      if(sockets[socket.id].dataSocket != null){
        sockets[socket.id].dataSocket.on("data", (data) => {
          const message = data.toString()
          const [name, ...text] = message.trim().split(" ")
          fs.writeFile(name, text.join(" "), err => {
            if (err) throw err
          })
        }) 
      }

      switch(command) {
        case "USER":
          if(usersString.includes(args[0])) {
            userIndex = users.findIndex(item => item.username === args[0])
            socket.write("331 User name okay, need password.\r\n");
          }
          else {
            socket.write("530 Not logged in.\r\n")
          }
          break
        case "PASS":
          if(lastCommand ==='USER'){
            if(users[userIndex].password === args[0]) {
              socket.write("230 User logged in, proceed.\r\n")
              authentified = true
            }
            else {
              socket.write("530 Not logged in.\r\n")
            }
          }
          else{
            socket.write("503 Bad sequence of commands.\r\n")
          }
          break
        case "LIST": 
          if(authentified){
            fs.readdir(args[0] || process.cwd(), (err, files) => {
              if(err) socket.write(" 450 Requested file action not taken.\r\n")
              else socket.write("250 Requested file action okay, completed.\r\n" + files.join("\r\n") + "\r\n") // structure de la rÃ©ponse
            })
          }
          else {
            socket.write("530 Not logged in.\r\n")
          }
          break
        case "PORT":
          if(authentified){
            sockets[socket.id].dataSocket = createConnection({ port: args[1], host: args[0] }, () => {
              console.log("connected to data server.\r\n")
              socket.write("200 Command okay.\r\n")
            })
          }
          else {
            socket.write("530 Not logged in.\r\n")
          }
          break
        case "CWD":
          if(authentified){
            try{
              process.chdir(args[0])
              socket.write("250 Requested file action okay, completed.\r\n")
            } catch(err){
              socket.write("550 No such file or directory.\r\n")
            }
          }
          else {
            socket.write("530 Not logged in.\r\n")
          }
          break
        case "RETR":
          if(authentified){
            if(sockets[socket.id].dataSocket != null){
              if(fs.existsSync(args[0])){
                sockets[socket.id].dataSocket.write("RETR " + args[0] + " " + fs.readFileSync(args[0], 'utf-8'))
                socket.write("250 Requested file action okay, completed.\r\n")
              }
              else socket.write("450 File unavailable.\r\n")
            }
            else socket.write("425 Can't open data connection.\r\n")
          }
          else socket.write("530 Not logged in.\r\n")
          break
        case "STOR":
          if(authentified){
            if(sockets[socket.id].dataSocket != null){
              sockets[socket.id].dataSocket.write("STOR " + args[0])
            }
            else socket.write("425 Can't open data connection.")
          }
          else {
            socket.write("530 Not logged in.\r\n")
          }
          break
        case "PWD":
          if(authentified){
            socket.write(`257 ${process.cwd()}`)
          }
          else {
            socket.write("530 Not logged in.\r\n")
          }
          break
        case "HELP": 
          socket.write(fs.readFileSync("src/help.txt", "utf-8") + "\r\n")
          break
        case "SYST":
          socket.write("215 \r\n")
          break
        case "FEAT":
          socket.write("211 \r\n")
          break
        case "TYPE":
          socket.write("200 \r\n")
          break
        case "QUIT":
          if(sockets[socket.id].dataSocket != null) {
            socket.write("221 Service closing control connection.\r\n")
            sockets[socket.id].dataSocket.write("QUIT")
            socket.destroy()
          }
          else{
            socket.write("221 Service closing control connection.\r\n")
            socket.destroy()
          }
          break
        default:
          console.log("500 command not supported:", command, args)
      }
      lastCommand = command
    })
    socket.write("220 Hello World \r\n")
  })

  server.listen(port, () => {
    console.log(`server started at localhost:${port}`)
  })
}