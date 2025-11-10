import unittest
from src.game import Game

class TestGame(unittest.TestCase):
    def setUp(self):
        self.game = Game()

    def test_initialization(self):
        self.assertIsNotNone(self.game)
        self.assertEqual(self.game.state, 'menu')

    def test_start_game(self):
        self.game.start()
        self.assertEqual(self.game.state, 'play')

    def test_update_game(self):
        self.game.start()
        initial_state = self.game.state
        self.game.update()
        self.assertNotEqual(initial_state, self.game.state)

    def test_draw_game(self):
        self.game.start()
        self.game.draw()
        # Assuming draw method updates a screen or surface, we can check if it runs without error
        self.assertTrue(True)  # Placeholder for actual draw test

if __name__ == '__main__':
    unittest.main()