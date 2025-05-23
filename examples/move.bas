MOVE_RESULT = MOVE("forward")
IF MOVE_RESULT = 1 THEN
    TURN("left")
ELSE:
    TURN("right")
END IF