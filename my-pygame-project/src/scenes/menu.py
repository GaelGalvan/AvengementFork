class MenuScene:
    def __init__(self, screen):
        self.screen = screen
        self.font = None  # Placeholder for font
        self.options = ["Start Game", "Options", "Quit"]
        self.selected_option = 0

    def display_menu(self):
        self.screen.fill((0, 0, 0))  # Clear the screen with black
        for index, option in enumerate(self.options):
            if index == self.selected_option:
                # Highlight the selected option
                text_color = (255, 255, 0)  # Yellow for selected
            else:
                text_color = (255, 255, 255)  # White for unselected
            # Render the text (font rendering code would go here)
            # Example: text_surface = self.font.render(option, True, text_color)
            # self.screen.blit(text_surface, (100, 100 + index * 30))

    def handle_input(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_UP:
                self.selected_option = (self.selected_option - 1) % len(self.options)
            elif event.key == pygame.K_DOWN:
                self.selected_option = (self.selected_option + 1) % len(self.options)
            elif event.key == pygame.K_RETURN:
                self.select_option()

    def select_option(self):
        if self.selected_option == 0:
            print("Starting game...")
            # Code to start the game would go here
        elif self.selected_option == 1:
            print("Opening options...")
            # Code to open options would go here
        elif self.selected_option == 2:
            print("Quitting game...")
            # Code to quit the game would go here