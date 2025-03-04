from time import sleep

from basic.pybasic import global_table

@global_table.reflect('SET_STATE')
def print_morning(a):
    print('Set state: %s' % a)

@global_table.reflect('SLEEP')
def print_morning(a):
    sleep(a)