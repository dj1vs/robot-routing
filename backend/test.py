
from basic.pybasic import pybasic

pybasic.execute_text(
    """
USE COMMANDS

LET turbo2 = 1
LET scroll2 = 1

SUB STATE_102()  'Check if VJ is aleady being pumped
    IF turbo2=1 AND scroll2=1 THEN
        SET_STATE 130
    ELSE
        SET_STATE 111
    END IF
END SUB

STATE_102()
""")

pybasic.execute_text(
    """
USE COMMANDS
LET turbo2 = 20
PRINT "HEKKI" + turbo2
""")