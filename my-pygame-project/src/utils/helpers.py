def load_image(file_path):
    """Load an image from the specified file path."""
    import pygame
    try:
        image = pygame.image.load(file_path)
        return image
    except pygame.error as e:
        print(f"Unable to load image at {file_path}: {e}")
        return None

def load_sound(file_path):
    """Load a sound from the specified file path."""
    import pygame
    try:
        sound = pygame.mixer.Sound(file_path)
        return sound
    except pygame.error as e:
        print(f"Unable to load sound at {file_path}: {e}")
        return None

def check_collision(rect1, rect2):
    """Check for collision between two rectangles."""
    return rect1.colliderect(rect2)

def reset_game_state():
    """Reset the game state to its initial conditions."""
    # This function can be expanded to reset specific game variables
    pass