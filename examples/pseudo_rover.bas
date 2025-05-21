WHILE 1 < 2
    F_DEPTH = DEPTH("front")
    IF F_DEPTH > 1 OR F_DEPTH < -1 THEN
        TURN("right")
    ELSE
        MOVE("forward")
    END IF
WEND