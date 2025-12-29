"""
Mapping старих URL на нові для 301 редиректів.
"""

REDIRECTS = {
    # WooCommerce продукти → програми
    '/pidgotovka-do-ispitu-ielts': '/programs/ielts',
    '/pidgotovka-do-zno-z-anglijskoi-movi': '/programs/pidgotovka-zno',
    '/pidgotovka-do-ispitu-toefl': '/programs/toefl',
    '/anglijska-dlya-ditej-kids-30': '/programs/kids',
    '/product/misyacz-bezlimitu/': '/programs/bezlimitnij-onlajn-kurs-anglijskoyi-movi',

    # Старі WordPress сторінки
    '/contact/': '/contacts',
    '/faqs/': '/faq',
    '/blog/': '/news/',

    # URL з trailing slash на без слеша
    '/about/': '/about',
    '/programs/toefl/': '/programs/toefl',

    # Інші можливі редиректи
    '/2-rivni-anglijskoji-movi': '/programs/english-for-beginners',
    '/4-rivni-anglijskoji-movi-10-12-misyacziv-navchannya': '/programs/group',
    '/2-rivni-6-misyacziv-navchannya': '/programs/group',
    '/3-rivni-anglijskoji-movi_prodovzhennya': '/programs/group',
    '/5-rivni-anglijskoji-movi-prodovgennya': '/programs/group',
}

