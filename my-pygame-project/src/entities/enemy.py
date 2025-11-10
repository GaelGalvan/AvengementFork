class Enemy:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.health = 100
        self.speed = 2

    def move(self):
        # Logic for enemy movement
        self.x -= self.speed

    def take_damage(self, amount):
        self.health -= amount
        if self.health <= 0:
            self.die()

    def die(self):
        # Logic for enemy death
        pass

    def update(self):
        self.move()
        # Additional update logic (e.g., checking for collisions) can go here

    def draw(self, surface):
        # Logic to draw the enemy on the given surface
        pass