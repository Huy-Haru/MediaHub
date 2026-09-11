import {app} from './app.js';
const server=app.listen(Number(process.env.PORT??5000),()=>console.info(`MediaHub API listening on ${process.env.PORT??5000}`));
process.on('SIGTERM',()=>server.close());
