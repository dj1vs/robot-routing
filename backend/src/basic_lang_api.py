import asyncio
from functools import partial
from basic.pybasic import global_table

class Station:
    def __init__(self, socket, clients, localMap, currentState, url):
        self.socket = socket 
        self.clients = clients
        self.localMap = localMap
        self.currentState = currentState
        self.url = url

stations = {}
going_circles = asyncio.Event()

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
    return await send_to_socket(url, 'currentLocation', 'test')

async def get_robot_coordinates(url):
    return await send_to_socket(url, 'coordinates', 'test')

async def get_block(url, pos, eyelevel):
    return await send_to_socket(url, 'block', {"pos": pos, "eyelevel": eyelevel})

async def depth(url, pos):
    return await send_to_socket(url, 'depth', {'pos': pos})

def reflect_basic_funcs(url):
    global_table.reflect('MOVE', partial(move_basic, url))
    global_table.reflect('TURN', partial(turn_basic, url))
    global_table.reflect('HEAL', partial(heal_basic, url))
    global_table.reflect('GET_ROBOT_LOCATION', partial(get_robot_location, url))
    global_table.reflect('GET_ROBOT_COORDINATES', partial(get_robot_coordinates, url))
    global_table.reflect('GET_BLOCK', partial(get_block, url))
    global_table.reflect('DEPTH', partial(depth, url))