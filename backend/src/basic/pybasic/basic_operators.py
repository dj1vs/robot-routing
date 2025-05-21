from .symbol_table import global_table, table_stack
from .utils import BasicError


@global_table.register('<PLUS>')
async def basic_plus(n):
    a, b = await n[0].run(), await n[1].run()
    if isinstance(a, str) or isinstance(b, str):
        a, b = str(a), str(b)
    return a + b

async def minus(n):
    a = await n[0].run()
    b = await n[1].run()
    return a - b
async def times(n):
    a = await n[0].run()
    b = await n[1].run()
    return a * b
async def divide(n):
    a = await n[0].run()
    b = await n[1].run()
    return a / b
async def exactdiv(n):
    a = await n[0].run()
    b = await n[1].run()
    return a // b
async def mod(n):
    a = await n[0].run()
    b = await n[1].run()
    return a % b
async def exp(n):
    a = await n[0].run()
    b = await n[1].run()
    return await a ** b
async def assign(n):
    n_1 = await n[1].run()
    table_stack.top().set(n[0], n_1)
async def uminus(n):
    a = await n[0].run()
    return -a
async def member(n):
    a = await n[1].run()
    return a.get(n[1])
async def greater_than(n):
    a = await n[0].run()
    b = await n[1].run()
    return a > b
async def less_than(n):
    a = await n[0].run()
    b = await n[1].run()
    return a < b
async def equal_greater_than(n):
    a = await n[0].run()
    b = await n[1].run()
    return a >= b
async def equal_less_than(n):
    a = await n[0].run()
    b = await n[1].run()
    return a <= b
async def not_equal(n):
    a = await n[0].run()
    b = await n[1].run()
    return a != b
async def equal(n):
    a = await n[0].run()
    b = await n[1].run()
    return a == b
async def And(n):
    a = await n[0].run()
    b = await n[1].run()
    return a and b
async def Or(n):
    a = await n[0].run()
    b = await n[1].run()
    return a or b
async def Not(n):
    a = await n[0].run()
    return not a
async def As(n):
    a = await n[0].run()
    b = await n[0].run()
    return a(b)

global_table.set('<MINUS>', minus)
global_table.set('<TIMES>', times)
global_table.set('<DIVIDE>', divide)
global_table.set('<EXACTDIV>', exactdiv)
global_table.set('<MOD>', mod)
global_table.set('<EXP>', exp)
global_table.set('<ASSIGN>', assign)
global_table.set('<MEMBER>', member)
global_table.set('<GREATER_THAN>', greater_than)
global_table.set('<LESS_THAN>', less_than)
global_table.set('<EQUAL_GREATER_THAN>', equal_greater_than)
global_table.set('<EQUAL_LESS_THAN>', equal_less_than)
global_table.set('<NOT_EQUAL>', not_equal)
global_table.set('<EQUAL>', equal)
global_table.set('<AND>', And)
global_table.set('<OR>', Or)
global_table.set('<NOT>', Not)
global_table.set('<AS>', As)


@global_table.register('<DIM_ARRAY>')
def basic_dim_array(n):
    id_name, type_name, size = n[0], n[1], n[2].run()
    py_type = global_table.get(type_name)
    array = [py_type() for _ in range(size + 1)]
    global_table.set(id_name, array)

@global_table.register('<ASSIGN_ARRAY>')
def basic_assign_array(n):
    id_name, basic_count, exp = n[0], n[1].run(), n[2].run()
    py_list = global_table.get(id_name)
    py_count = basic_count # - 1
    try:
        py_list[py_count] = exp
    except IndexError:
        raise BasicError('Index %d is out of range (maximum %d)' % (py_count, len(py_list)))

@global_table.register('<ASSIGN_MEMBER>')
def basic_assign_member(n):
    master, field, exp = n[0].run(), n[1], n[2].run()
    master.member[field] = exp