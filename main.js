const net = require("net");
const fs = require("fs");
const zlib = require("zlib");
console.log("Logs from your program will appear here!");

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const method  = data.toString().split(" ")[0];
    const path = data.toString().split(" ")[1];
    const headers = data.toString().split(" ")[4];
    const requestLines = data.toString().split("\r\n");
    let acceptEncoding = "";
    for(const line of requestLines){
      if(line.startsWith("Accept-Encoding:")){
        acceptEncoding = line.substring("Accept-Encoding:".length).trim();
        break;
      }
    }
    if (path == "/") {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } 
    
    else if (path.includes("/echo/")) {
      const content = path.split("/echo/")[1];
      const acceptEncodings = acceptEncoding.split(",").map(encoding => encoding.trim());
      if(acceptEncodings.includes("gzip")){
        zlib.gzip(content , (err , compressed) => {
          if(err){
            console.log(err);
          }
          console.log(compressed.length)
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: ${compressed.length}\r\n\r\n`);
        socket.write(compressed);
          
        })
      }else{
        socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${content.length}\r\n\r\n${content}`
      );
      }
      
    } 
    else if (path.includes("/user-agent")) {
      const header = headers.split("\r\n")[0];
      console.log(header);
      const len = header.length;
      socket.write(
        `HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: ${len}\r\n\r\n${header}`
      );
    }
    else if(path.includes("/files/") && method === "GET"){
        const fileName = path.split("/files/")[1];
        const directory = process.argv[3];
    if(fs.existsSync(`${directory}/${fileName}`)){
        const content = fs.readFileSync(`${directory}/${fileName}` , 'utf8');
        const size = content.length;
        socket.write(`HTTP/1.1 200 OK\r\nContent-Type: application/octet-stream\r\nContent-Length: ${size}\r\n\r\n${content}`)
    }
    else{
        socket.write(`HTTP/1.1 404 Not Found\r\n\r\n`)
    }


    }
    else if(path.includes("/files/") && method === "POST"){
        const fileName = path.split("/files/")[1];
        const content = data.toString().split("\r\n\r\n")[1];
        const directory = process.argv[3];
        fs.writeFileSync(`${directory}/${fileName}` , content);
        socket.write(`HTTP/1.1 201 Created\r\n\r\n`)
    }

    
    else {
      socket.write(`HTTP/1.1 404 Not Found\r\n\r\n`);
    }
  });
});
//
server.listen(4221, () => {
  console.log("server started");
});

// "GET /user-agent HTTP/1.1\r\nHost: localhost:4221\r\nUser-Agent: grape/grape\r\n\r\n"
     
// "grape/grape\r\n\r\n"

// "POST /files/orange_banana_pear_strawberry HTTP/1.1\r\nHost: localhost:4221\r\nContent-Length: 63\r\nContent-Type: application/octet-stream\r\n\r\napple raspberry strawberry mango pineapple apple pear pineapple"
// "GET /echo/apple HTTP/1.1\r\nHost: localhost:4221\r\nAccept-Encoding: gzip\r\n\r\n"