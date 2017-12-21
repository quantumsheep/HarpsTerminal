import * as express from 'express';
import { Express } from 'express-serve-static-core';
import * as httpserv from 'http';
import { Server } from 'http';
import * as socketio from 'socket.io';
import * as path from 'path';
import Terminal from './terminal/Terminal';
import { TerminalCommand, TerminalConfig } from './terminal/interfaces/TerminalInterface';

const app: Express = express(),
    http: Server = new httpserv.Server(app),
    io: SocketIO.Server = socketio(http);

app.use(express.static('assets'));

app.get('/', (req, res, next) => {
    res.sendFile(path.resolve(`views/index.html`));
});

let terminal: Terminal = new Terminal();

terminal.commands = {
    "help": {
        doc: "Get a list of all availables commands you can do",
        action: (parameters, socket, io) => {
            let answer: string = "";

            if(parameters[0]) {
                if(terminal.commands[parameters[0]].usage) {
                    answer += `${terminal.commands[parameters[0]].usage}`;
                    
                    socket.emit('terminal command', `Usage of '${parameters[0]}' : <br>${answer}<br>`);
                } else {
                    socket.emit('terminal command', `Sorry, there is no usage documented for this command '${parameters[0]}'`);
                }
            } else {
                Object.keys(terminal.commands).forEach((index) => {
                    answer += `<li>${index} - ${terminal.commands[index].doc}`;
                });

                socket.emit('terminal command', `Here is a list of availables commands you can do : [<ul>${answer}</ul>]<br>`);
            }
        }
    },
    "say": {
        "doc": "Say something to the others",
        "action": (parameters, socket, io, fullparams, fullcmd) => {
            let message = ``;

            parameters.forEach((param) => {
                message += `${param} `;
            });

            io.emit('terminal command', `${socket.client.id} say: ${message}`);
        }
    },
    "cowsay": {
        "doc": "Tell what the cow say",
        "action": (parameters, socket, io, fullparams, fullcmd) => {
            let message = ``;

            parameters.forEach((param) => {
                message += `${param} `;
            });

            io.emit('terminal command', ` _________________\n` +
                `< ${message} >\n` +
                ` -----------------\n` +
                `          \\   ^__^\n` +
                `           \\  (♥♥)\\_______\n` +
                `               (__)\\              )\\/\\\n` +
                `                  ||---------w   |\n` +
                `                  ||                 ||\n`);
        }
    },
    "calc": {
        "doc": "Calculate some numbers",
        "usage": "calc [n1][[+|-|*|/|^][n2]...]",
        "action": (parameters, socket, io, fullparams, fullcmd) => {
            let calc: number = parseInt(parameters[0]);
            for (let i = 1; i < parameters.length; i++) {
                if (parameters[i + 1] && parameters[i]) {
                    switch(parameters[i]) {
                        case "+":
                            calc += parseInt(parameters[i + 1]);
                            break;
                        case "-":
                            calc -= parseInt(parameters[i + 1]);
                            break;
                        case "*":
                            calc *= parseInt(parameters[i + 1]);
                            break;
                        case "/":
                            calc /= parseInt(parameters[i + 1]);
                            break;
                        case "^":
                            calc = Math.pow(calc, parseInt(parameters[i + 1]));
                            break;
                    }
                }

                i++;
            }

            socket.emit('terminal command', (calc != null ? calc : `Syntaxe incorrecte '${fullcmd}'`));
        }
    }
};

io.on('connection', (socket) => {
    terminal.useSocket(socket, io);
    socket.on('terminal command', (cmd) => {
        terminal.handleCommand(cmd);
    });
});

http.listen(2000);