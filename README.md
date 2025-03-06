# robot-routing

Автоматизированная система интерактивного обучения программированию

Дипломная работа

## Синтаксис

```basic
MOVE <direction> <delay> 'Передвинуть робота на один блок по указанному направлению
    direction: forward / backward / left / right
    delay: int

TURN <direction> 'Повернуть робота в указанную сторону
    direction: left/right

HEAL 'Воостановить здоровье робота на 10 единиц

GET_ROBOT_COORDINATES 'Получить координаты робота

GET_ROBOT_LOCATION 'Получить тип блока, на котором находится робот: почва/песок/кислотная поверхность
```