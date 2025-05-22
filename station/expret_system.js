class ExpertSystem
{
    constructor() {
        this.visited_coordinates = []
        this.moves_without_new_coordinates = 0
    }

    process_new_coord(new_coord) {
        const alreadyVisited = this.visited_coordinates.findIndex(coord =>
            coord[0] === new_coord[0] && coord[1] === new_coord[1] && coord[2] === new_coord[2]
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