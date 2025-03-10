import socketio
import asyncio
import uvicorn
from basic.pybasic import pybasic
from functools import partial
from basic.pybasic import global_table

sio = socketio.AsyncServer(cors_allowed_origins='*', async_mode='asgi')

static_files = {
    "/atlas.png": "./public/atlas.png",
    "/mud.png": "./public/mud.png",
    "/poison.png": "./public/poison.png",
    "/RobotExpressive.glb": "./public/RobotExpressive.glb"
}

app = socketio.ASGIApp(sio, static_files=static_files)

class Station:
    def __init__(self, socket, clients, localMap, currentState, url):
        self.socket = socket 
        self.clients = clients
        self.localMap = localMap
        self.currentState = currentState
        self.url = url

stations = {}

async def send_to_socket(url, cmd, *args):
    global stations

    if url not in stations:
        return

    station = stations[url]

    future = asyncio.get_event_loop().create_future()

    async def callback(x):
        future.set_result(x) 

    if (len(args) == 0):
        await station.socket.emit(cmd, "test", callback=callback)
    else:
        await station.socket.emit(cmd, *args, callback=callback)

    return await future

async def move_basic(url, dir):
    cmd = ''
    if (dir == 'forward'):
        cmd = "moveForward"
    elif (dir == 'backward'):
        cmd = "moveBackward"
    elif (dir == 'right'):
        cmd = "moveRight"
    elif (dir == 'left'):
        cmd = 'moveLeft'
    else:
        return
    
    await send_to_socket(url, cmd, dir)    

async def turn_basic(url, dir):
    cmd = ''
    if (dir == 'right'):
        cmd = "turnRight"
    elif dir == 'left':
        cmd = 'turnLeft'
    else:
        return

    await send_to_socket(url, cmd, dir)

async def heal_basic(url):
    await send_to_socket(url, "heal")

async def get_robot_location(url):
    global stations

    if url not in stations:
        return

    station = stations[url]

    future = asyncio.get_event_loop().create_future()

    async def callback(x):
        future.set_result(x) 

    await station.socket.emit("currentLocation", "test", callback=callback)
    return await future

async def get_robot_coordinates(url):
    global stations

    if url not in stations:
        return

    station = stations[url]

    future = asyncio.get_event_loop().create_future()

    async def callback(x):
        future.set_result(x)
    
    await station.socket.emit("coordinates", "test", callback=callback)
    return await future

async def get_block(url, pos, eyelevel):
    global stations

    if url not in stations:
        return
    
    station = stations[url]

    future = asyncio.get_event_loop().create_future()

    async def callback(x):
        future.set_result(x)
    
    await station.socket.emit("block", {"pos": pos, "eyelevel": eyelevel}, callback=callback)

    result = await future

    return result

def reflect_basic_funcs(url):
    global_table.reflect('MOVE', partial(move_basic, url))
    global_table.reflect('TURN', partial(turn_basic, url))
    global_table.reflect('HEAL', partial(heal_basic, url))
    global_table.reflect('GET_ROBOT_LOCATION', partial(get_robot_location, url))
    global_table.reflect('GET_ROBOT_COORDINATES', partial(get_robot_coordinates, url))
    global_table.reflect('GET_BLOCK', partial(get_block, url))

@sio.event
async def connect(sid, environ, auth):
    print(f'NEW USER!!! {sid} {environ} {auth}')
    return True

@sio.event
async def connectToStation(sid, url):
    print('A user is connecting to a station')

    for station in stations.values():
        station.clients = [client for client in station.clients if client != sid]
        if len(station.clients) == 0:
            await station.socket.disconnect()
            stations.pop(station.url, None)

    if url not in stations:
        station_socket = socketio.AsyncClient()
        stations[url] = Station(station_socket, [sid], [], {}, url)

        async def connect():
            await sio.emit("message", f"Successfully connected to station {url}", to=sid)
        station_socket.on("connect", connect)

        async def connect_error():
            stations.pop(url, None)
            await sio.emit("message", f"Failed to connect to station {url}", to=sid)
            await sio.disconnect(sid)
        station_socket.on("connect_error", connect_error)

        async def state(state):
            if url not in stations:
                return
            station = stations[url]

            # Update local map
            for near_location in state["nearLocations"]:
                if near_location not in station.localMap:
                    station.localMap.append(near_location)

            # Update player position and notify clients
            if (
                "coordinates" not in station.currentState or
                station.currentState["coordinates"] != state["coordinates"] or
                station.currentState["direction"] != state["direction"] or
                station.currentState["location"] != state["location"]
            ):
                station.currentState.update({
                    "coordinates": state["coordinates"],
                    "direction": state["direction"],
                    "location": state["location"]
                })
                state_obj = {
                    **station.currentState,
                    "health": state["health"],
                    "nearLocations": station.localMap
                }
                for client in station.clients:
                    await sio.emit("state", state_obj, to=client)

            # Update health status
            if station.currentState.get("health") != state["health"]:
                station.currentState["health"] = state["health"]
                for client in station.clients:
                    await sio.emit("health", state["health"], to=client)

            # Update temperature
            if station.currentState.get("temperature") != state["temperature"]:
                station.currentState["temperature"] = state["temperature"]
                for client in station.clients:
                    await sio.emit("temperature", state["temperature"], to=client)

            # Update mode
            if station.currentState.get("mode") != state["mode"]:
                station.currentState["mode"] = state["mode"]
                for client in station.clients:
                    await sio.emit("mode", state["mode"], to=client)
        station_socket.on("state", state)

        async def temperature(temp):
            # Update temperature
            if station.currentState.get("temperature") != temp:
                station.currentState["temperature"] = temp
                for client in station.clients:
                    await sio.emit("temperature", temp, to=client)
        station_socket.on("temperature", temperature)

        async def health(hp):
            if station.currentState.get("health") != hp:
                    station.currentState["health"] = hp
                    for client in station.clients:
                        await sio.emit("health", hp, to=client)
        station_socket.on("health", health)

        async def died():
            for client in stations[url].clients:
                await sio.emit("died", to=client)
                await sio.emit("action", "Death", to=client)
        station_socket.on("died", died)

        asyncio.create_task(station_socket.connect(url=url, transports=["polling"], namespaces=["/"]))

    else:
        await sio.emit("message", f"Successfully connected to station {url}", to=sid)
        stations[url].clients.append(sid)

    if url in stations:
        station = stations[url]
        info = {**station.currentState, "nearLocations": station.localMap}
        print("Sending allInfo:", info)
        await sio.emit("allInfo", info, to=sid)

@sio.event
async def exec(sid, text):
    for station in stations.values():
        reflect_basic_funcs(station.url)
        if sid in station.clients:
            await pybasic.execute_text(text)
import asyncio

@sio.event
async def move(sid, dir):
    for station in stations.values():
        reflect_basic_funcs(station.url)
        if sid in station.clients:
            await pybasic.execute_text(f"MOVE \"{dir}\"")


@sio.event
async def turn(sid, dir):
    for station in stations.values():
        reflect_basic_funcs(station.url)
        if sid in station.clients:
            await pybasic.execute_text(f"TURN \"{dir}\"")

@sio.event
async def changeMode(sid):
    for station in stations.values():
        if sid in station.clients:
            await station.socket.emit("changeMode")

@sio.event
async def restart(sid):
    for station in stations.values():
        if sid in station.clients:
            await station.socket.emit("restart")

@sio.event
async def heal(sid):
    for station in stations.values():
        reflect_basic_funcs(station.url)
        if sid in station.clients:
            await pybasic.execute_text('HEAL')

@sio.event
async def emotes(sid, emote):
    for station in stations.values():
        if sid in station.clients:
            for client in station.clients:
                await sio.emit("action", emote, to=client)

@sio.event
async def disconnectFromStation(sid):
    print("A user disconnected from station")
    for station in stations.values():
        station.clients = [client for client in station.clients if client != sid]
        if not station.clients:
            await station.socket.disconnect()
            stations.pop(station.url, None)
    await sio.emit("message", "Successfully disconnected from station", to=sid)

@sio.event
async def disconnect(sid):
    print(f"User disconnected: {sid}")
    for station in stations.values():
        station.clients = [client for client in station.clients if client != sid]
        if not station.clients:
            await station.socket.disconnect()
            stations.pop(station.url, None)

if __name__ == '__main__':
    
    uvicorn.run(app, host="0.0.0.0", port=3010)
