import platform
import math
import os
import asyncio
from .utils import BasicError, Stack

class SymbolTable:
    def __init__(self, parent=None):
        self._table = {}
        self.parent = parent

    def get(self, id):
        id = id.upper()
        if id in self._table:
            return self._table[id]
        if id not in global_table._table:
            raise BasicError('переменная не определена: "%s"' % id)
        else:
            return global_table.get(id)

    def set(self, id, value):
        id = id.upper()
        if id in self._table or id not in global_table._table:
            self._table[id] = value
            return True
        global_table._table[id] = value
        return True

    def register(self, id):
        def decorator(func):
            self.set(id, func)
            return func
        return decorator
    
    def reflect(self, id, func=None):
        if func is not None:
            async def new_func(n):
                return await func(*(await asyncio.gather(*(x.run() for x in n))))
            self.set(id, new_func)
        else:
            def decorator(func):
                async def new_func(n):
                    return await func(*(await asyncio.gather(*(x.run() for x in n))))
                self.set(id, new_func)
                return new_func
            return decorator

# Global symbol table
global_table = SymbolTable()
table_stack = Stack([global_table])

# Constants
global_table.set('Nothing', None)
global_table.set('True', True)
global_table.set('False', False)
global_table.set('Pi', 3.14159265)
