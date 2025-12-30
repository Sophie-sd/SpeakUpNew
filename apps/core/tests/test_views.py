from django.test import TestCase, Client
from django.urls import reverse


class IndexViewTestCase(TestCase):
    """Test cases for index view."""

    def setUp(self):
        self.client = Client()

    def test_index_view(self):
        """Test that index view returns 200."""
        response = self.client.get(reverse('core:index'))
        self.assertEqual(response.status_code, 200)





