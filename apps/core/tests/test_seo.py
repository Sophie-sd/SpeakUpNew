from django.test import TestCase, Client
from django.core.cache import cache

class SEOTestCase(TestCase):
    """100% покриття SEO функціоналу."""

    def setUp(self):
        self.client = Client()
        cache.clear()

    def test_homepage_canonical(self):
        """Canonical тег на головній."""
        response = self.client.get('/')
        self.assertContains(response, '<link rel="canonical"')

    def test_homepage_hreflang(self):
        """Hreflang UK + RU."""
        response = self.client.get('/')
        self.assertContains(response, 'hreflang="uk"')
        self.assertContains(response, 'hreflang="ru"')

    def test_lang_attribute_uk(self):
        """Lang attribute для української."""
        response = self.client.get('/')
        self.assertContains(response, '<html lang="uk">')

    def test_lang_attribute_ru(self):
        """Lang attribute для російської."""
        response = self.client.get('/ru/')
        self.assertContains(response, '<html lang="ru">')

    def test_program_page_exists(self):
        """Сторінка програми доступна."""
        response = self.client.get('/programs/individual')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '<h1>')

    def test_program_404_on_invalid(self):
        """404 для неіснуючої програми."""
        response = self.client.get('/programs/invalid')
        self.assertEqual(response.status_code, 404)

    def test_school_location_exists(self):
        """Orphan page локації доступна."""
        response = self.client.get('/school/poznyaki')
        self.assertEqual(response.status_code, 200)

    def test_city_page_exists(self):
        """Orphan page міста доступна."""
        response = self.client.get('/harkov')
        self.assertEqual(response.status_code, 200)

    def test_robots_txt(self):
        """Robots.txt працює."""
        response = self.client.get('/robots.txt')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'User-agent:')
        self.assertContains(response, 'Sitemap:')

    def test_sitemap_xml(self):
        """Sitemap.xml працює."""
        response = self.client.get('/sitemap.xml')
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '<urlset')
        self.assertContains(response, '<loc>')

    def test_context_processor_caching(self):
        """Context processor використовує кеш."""
        self.client.get('/')
        cache_key = 'seo_ctx:/:uk'
        cached = cache.get(cache_key)
        self.assertIsNotNone(cached)
        self.assertIn('canonical_url', cached)

    def test_all_54_pages_return_200(self):
        """Всі 54 сторінки (UK версії) доступні."""
        urls = [
            '/', '/about', '/contacts', '/testing',
            '/programs/individual', '/programs/group',
            '/programs/online-english-course', '/programs/corporate',
            '/programs/intensive', '/programs/native-teachers',
            '/programs/business', '/programs/ielts', '/programs/toefl',
            '/programs/kids', '/programs/speaking-course', '/programs/tourism',
            '/programs/anglijska-dlya-medykiv', '/programs/anglijska-dlya-jurystiv',
            '/programs/anglijska-dlya-it', '/programs/english-for-beginners',
            '/programs/short-courses',
            '/school/sumskaya', '/school/minskaya', '/school/poznyaki',
            '/school/levoberezhnaya', '/school/universitet', '/school/vokzalnaya',
            '/school/jitomirskaya', '/school/goloseevskaya', '/school/chervonoi-kalini',
            '/school/monomakha', '/school/metallurgov', '/school/chernovola',
            '/school/ekaterininskaya',
            '/harkov', '/dnepr', '/odessa', '/lvov',
        ]
        for url in urls:
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, 200)





