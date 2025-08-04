import { WebSocketServer, WebSocket } from 'ws'
import { networkInterfaces } from 'os';
const wss = new WebSocketServer({ port: 8080 });

const clients = [];

const interfaces = networkInterfaces()
let ip = null;

for (const name in interfaces) {
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      ip = iface.address
    }
  }
}
console.log(ip);
  


wss.on('connection', (ws) => {
  clients.push(ws);
  console.log('подключился новый клиент');
  
  ws.on('message', message => {
    let str = message.toString()
    let json = JSON.parse(str)
    console.log('Получено: ', json);

    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN && message.type !== 'offer') {
        client.send(message)
        console.log('сообщение отправлено', message);
			}
    })
  })

  ws.on('close', () => {
    clients.splice(clients.indexOf(ws), 1)
    console.log('Клиент отключился');
  })
})