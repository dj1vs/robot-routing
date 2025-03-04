const _ = require("lodash");
const { Server } = require("socket.io");

/*
map = [
  {
      coordinates: [Number, Number, Number],
      location: str
  }
]

currentState = {
  coordinates: [86, 100, 128]
  direction: "север"
  location: "почва"
  temperature: 20
  health: 10000
}

station = {
  "url": {
      "socket": socket,
      "clients": [socket],
      "localMap": map,
      "currentState": currentState
  }
}
*/
const stations = {};

module.exports = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  /** подключение к клиента к ЦУП */
  io.on("connection", (clientSocket) => {
    console.log("a user connected");

    /** запрос клиента на подключение к станции по url */
    clientSocket.on("connectToStation", (url) => {
      console.log("a user connecting to station");

      /** если пользователь уже подключен к станции, сбрасываем подключение */
      Object.values(stations).forEach((station) => {
        station.clients = station.clients.filter(
          (client) => client !== clientSocket
        );
        if (station.clients.length === 0) {
          station.socket.disconnect();
          delete stations[station.socket.io.uri];
        }
      });

      if (!stations[url]) {
        /** если станция не подключена, то подключаемся к ней */
        const stationSocket = require("./socket-client")(url);
        stations[url] = {
          socket: stationSocket,
          clients: [clientSocket],
          localMap: [],
          currentState: {},
        };

        /** если не удалось подключиться к станции, то удаляем ее из списка */
        stationSocket.on("connect_error", () => {
          delete stations[url];
          clientSocket.emit("message", `failed to connect to station ${url}`);
          stationSocket.disconnect();
        });

        /** если удалось подключиться к станции, то добавляем ее в список */
        stationSocket.on("connect", () => {
          clientSocket.emit(
            "message",
            `successfully connected to station ${url}`
          );
        });

        /** обработка сообщений от станции */
        stationSocket.on("state", (state) => {
          const station = stations[url];
          state.nearLocations.map((nearLocation) => {
            const index = station.localMap.findIndex((location) =>
              _.isEqual(location, nearLocation)
            );
            if (index === -1) {
              station.localMap.push(nearLocation);
            }
          });

          /** изменение положение персонажа */
          if (
            !_.isEqual(state.coordinates, station.currentState.coordinates) ||
            state.direction !== station.currentState.direction ||
            state.location !== station.currentState.location
          ) {
            station.currentState.coordinates = state.coordinates;
            station.currentState.direction = state.direction;
            station.currentState.location = state.location;
            Object.values(stations[url].clients).forEach((client) => {
              client.emit("state", {
                coordinates: state.coordinates,
                direction: state.direction,
                location: state.location,
                health: state.health,
                nearLocations: station.localMap,
              });
            });
          }

          /** изменение состояния персонажа */
          if (state.health !== station.currentState.health || station.currentState.health === undefined) {
            station.currentState.health = state.health;
            Object.values(stations[url].clients).forEach((client) => {
              client.emit("health", state.health);
            });
          }

          /** изменение температуры */
          if (state.temperature !== station.currentState.temperature) {
            station.currentState.temperature = state.temperature;
            Object.values(stations[url].clients).forEach((client) => {
              client.emit("temperature", state.temperature);
            });
          }

          /** изменение режима */
          if (state.mode !== station.currentState.mode) {
            station.currentState.mode = state.mode;
            Object.values(stations[url].clients).forEach((client) => {
              client.emit("mode", state.mode);
            });
          }
        });

        /** обработка критических ошибок */
        stationSocket.on("criticalError", () => {
          Object.values(stations[url].clients).forEach((client) => {
            client.emit("criticalError");
          });
        });

        /** обработка смерти */
        stationSocket.on("fixCriticalError", () => {
          Object.values(stations[url].clients).forEach((client) => {
            client.emit("fixCriticalError");
          });
        });

        stationSocket.on("died", () => {
          Object.values(stations[url].clients).forEach((client) => {
            client.emit("died");
            client.emit("action", "Death");
          });
        });
      } else {
        /** если станция уже подключена, то добавляем клиента в список */
        clientSocket.emit(
          "message",
          `successfully connected to station ${url}`
        );
        stations[url].clients.push(clientSocket);
      }

      /** отправка всей информации на клиент */
      const station = stations[url];
      const info = {
        ...station.currentState,
        nearLocations: station.localMap,
      };
      console.log("allInfo", info);
      clientSocket.emit("allInfo", info);
    });

    /** шаг вперед */
    clientSocket.on("moveForward", () => {
      console.log("moveForward");
      Object.values(stations).forEach((station) => {
        if (station.clients.includes(clientSocket)) {
          station.socket.emit("moveForward");
        }
      });
    });

    /** шаг назад */
    clientSocket.on("moveBackward", () => {
      console.log("moveBackward");
      Object.values(stations).forEach((station) => {
        if (station.clients.includes(clientSocket)) {
          station.socket.emit("moveBackward");
        }
      });
    });

    /** шаг влево */
    clientSocket.on("moveLeft", () => {
      console.log("moveLeft");
      Object.values(stations).forEach((station) => {
        if (station.clients.includes(clientSocket)) {
          station.socket.emit("moveLeft");
        }
      });
    });

    /** шаг вправо */
    clientSocket.on("moveRight", () => {
      console.log("moveRight");
      Object.values(stations).forEach((station) => {
        if (station.clients.includes(clientSocket)) {
          station.socket.emit("moveRight");
        }
      });
    });

    /** поворот налево */
    clientSocket.on("turnLeft", () => {
      console.log("turnLeft");
      Object.values(stations).forEach((station) => {
        if (station.clients.includes(clientSocket)) {
          station.socket.emit("turnLeft");
        }
      });
    });

    /** поворот направо */
    clientSocket.on("turnRight", () => {
      console.log("turnRight");
      Object.values(stations).forEach((station) => {
        if (station.clients.includes(clientSocket)) {
          station.socket.emit("turnRight");
        }
      });
    });

    /** изменение режима */
    clientSocket.on("changeMode", () => {
      console.log("changeMode");
      Object.values(stations).forEach((station) => {
        if (station.clients.includes(clientSocket)) {
          station.socket.emit("changeMode");
        }
      });
    });

    /** устранение критической ошибки */
    clientSocket.on("fixCriticalError", () => {
      console.log("fixCriticalError");
      Object.values(stations).forEach((station) => {
        if (station.clients.includes(clientSocket)) {
          station.socket.emit("fixCriticalError");
        }
      });
    });

    /** перезапуск */
    clientSocket.on("restart", () => {
      console.log("restart");
      Object.values(stations).forEach((station) => {
        if (station.clients.includes(clientSocket)) {
          station.socket.emit("restart");
        }
      });
    });

    /** лечение */
    clientSocket.on("heal", () => {
      console.log("heal");
      Object.values(stations).forEach((station) => {
        if (station.clients.includes(clientSocket)) {
          station.socket.emit("heal");
        }
      });
    });

    /** эмоции */
    clientSocket.on("emotes", (emote) => {
      console.log("emotes", emote);
      Object.values(stations).forEach((station) => {
        if (station.clients.includes(clientSocket)) {
          station.clients.forEach((client) => {
            client.emit("action", emote);
          });
        }
      });
    });

    /** обработка отключение клиента */
    clientSocket.on("disconnectFromStation", () => {
      console.log("a user disconnected from station");
      Object.values(stations).forEach((station) => {
        station.clients = station.clients.filter(
          (client) => client !== clientSocket
        );
        if (station.clients.length === 0) {
          station.socket.disconnect();
          delete stations[station.socket.io.uri];
        }
      });
      clientSocket.emit("message", `successfully disconnected from station`);
    });

    clientSocket.on("disconnect", () => {
      console.log("user disconnected");
      Object.values(stations).forEach((station) => {
        station.clients = station.clients.filter(
          (client) => client !== clientSocket
        );
        if (station.clients.length === 0) {
          station.socket.disconnect();
          delete stations[station.socket.io.uri];
        }
      });
    });
  });

  return io;
};
