WHILE (GET_BLOCK("front", 0) = "почва" AND DEPTH("front") < 2)
    MOVE("forward")
END WHILE