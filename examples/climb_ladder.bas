WHILE (GET_BLOCK("front", False) = "почва" AND DEPTH("front") < 2)
    MOVE("forward")
END WHILE