class Player:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = 50
        self.height = 60
        self.speed = 5

    def move(self, dx, dy):
        self.x += dx * self.speed
        self.y += dy * self.speed

    def get_position(self):
        return self.x, self.y

    def get_size(self):
        return self.width, self.height

    def draw(self, surface):
        # Placeholder for drawing the player on the given surface
        pass