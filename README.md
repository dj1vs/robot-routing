# robot-routing

Автоматизированная система интерактивного обучения программированию

Дипломная работа

## Синтаксис

```basic
MOVE <direction> 'Передвинуть робота на один блок по указанному направлению
    direction: forward / backward / left / right

TURN <direction> 'Повернуть робота в указанную сторону
    direction: left/right

HEAL 'Воостановить здоровье робота на 10 единиц

HEALTH 'Получает текущий уровень здоровья робота

GET_ROBOT_COORDINATES 'Получить координаты робота

GET_ROBOT_LOCATION 'Получить тип блока, на котором находится робот: почва/песок/кислотная поверхность

GET_BLOCK <pos> <eyelevel> 'Получить тип блока рядом с роботом
    pos: front / back / right / left
    eyelevel: True/ False 'Получить блок на уровне глаз робота

DEPTH <pos> 'Получить глубину падения до ближайшего блока
    pos: front / back / right / left
```