class PlayScene:
    def __init__(self, game):
        self.game = game
        self.entities = []  # List to hold game entities

    def update(self):
        # Update game entities
        for entity in self.entities:
            entity.update()

    def render(self, screen):
        # Render game entities
        for entity in self.entities:
            entity.render(screen)

    def add_entity(self, entity):
        # Add an entity to the scene
        self.entities.append(entity)

    def remove_entity(self, entity):
        # Remove an entity from the scene
        if entity in self.entities:
            self.entities.remove(entity)