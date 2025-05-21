class ExpertSystem
{
    constructor() {
        this.visited_coordinates = []
        this.moves_without_new_coordinates = 0
    }

    process_new_coord(new_coord) {
        console.log(this.moves_without_new_coordinates)

        const alreadyVisited = this.visited_coordinates.findIndex(coord =>
            coord.x === new_coord.x && coord.y === new_coord.y
        );

        if (alreadyVisited === -1)
        {
            this.visited_coordinates.push(new_coord)
            this.moves_without_new_coordinates = 0;
        }
        else
        {
            this.moves_without_new_coordinates++;
        }
    }

    get_moves_without_new_coordinates()
    {
        return this.moves_without_new_coordinates;
    }
}

module.exports = ExpertSystem;