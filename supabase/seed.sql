-- ============================================================
-- Product Seed Data - Türkçe / Deutsch
-- ============================================================

INSERT INTO public.products (name_tr, name_de, category, emoji, search_terms) VALUES

-- ============================================================
-- 🥦 SEBZE / GEMÜSE
-- ============================================================
('Domates', 'Tomate', 'sebze', '🍅', 'tomato'),
('Salatalık', 'Gurke', 'sebze', '🥒', 'cucumber'),
('Kırmızı Biber', 'Rote Paprika', 'sebze', '🫑', 'paprika pepper'),
('Sarı Biber', 'Gelbe Paprika', 'sebze', '🫑', 'paprika pepper'),
('Yeşil Biber', 'Grüne Paprika', 'sebze', '🫑', 'paprika pepper'),
('Havuç', 'Karotte', 'sebze', '🥕', 'carrot möhre'),
('Brokoli', 'Brokkoli', 'sebze', '🥦', 'broccoli'),
('Karnabahar', 'Blumenkohl', 'sebze', '🥦', 'cauliflower'),
('Marul', 'Salat / Kopfsalat', 'sebze', '🥬', 'lettuce'),
('Roka', 'Rucola', 'sebze', '🥬', 'rocket arugula'),
('Ispanak', 'Spinat', 'sebze', '🥬', 'spinach'),
('Soğan', 'Zwiebel', 'sebze', '🧅', 'onion'),
('Kırmızı Soğan', 'Rote Zwiebel', 'sebze', '🧅', 'red onion'),
('Sarımsak', 'Knoblauch', 'sebze', '🧄', 'garlic'),
('Patates', 'Kartoffel', 'sebze', '🥔', 'potato'),
('Tatlı Patates', 'Süßkartoffel', 'sebze', '🍠', 'sweet potato'),
('Kabak', 'Zucchini', 'sebze', '🥒', 'zucchini'),
('Patlıcan', 'Aubergine', 'sebze', '🍆', 'eggplant'),
('Pırasa', 'Lauch / Porree', 'sebze', '🥬', 'leek'),
('Kereviz', 'Sellerie', 'sebze', '🌿', 'celery'),
('Mantar', 'Champignons', 'sebze', '🍄', 'mushroom pilz'),
('Mısır', 'Mais', 'sebze', '🌽', 'corn'),
('Bezelye', 'Erbsen', 'sebze', '🫛', 'peas'),
('Fasulye', 'Grüne Bohnen', 'sebze', '🫘', 'green beans'),
('Kırmızı Lahana', 'Rotkohl', 'sebze', '🥬', 'red cabbage'),
('Beyaz Lahana', 'Weißkohl', 'sebze', '🥬', 'white cabbage'),
('Turp', 'Radieschen', 'sebze', '🌱', 'radish'),
('Enginar', 'Artischocke', 'sebze', '🥦', 'artichoke'),
('Kuşkonmaz', 'Spargel', 'sebze', '🌱', 'asparagus'),
('Taze Soğan', 'Frühlingszwiebeln', 'sebze', '🧅', 'spring onion schnittlauch'),

-- ============================================================
-- 🍎 MEYVE / OBST
-- ============================================================
('Elma', 'Apfel', 'meyve', '🍎', 'apple'),
('Muz', 'Banane', 'meyve', '🍌', 'banana'),
('Portakal', 'Orange', 'meyve', '🍊', 'orange'),
('Limon', 'Zitrone', 'meyve', '🍋', 'lemon'),
('Mandalina', 'Mandarine', 'meyve', '🍊', 'mandarin clementine'),
('Çilek', 'Erdbeere', 'meyve', '🍓', 'strawberry'),
('Üzüm', 'Traube / Weintrauben', 'meyve', '🍇', 'grape'),
('Karpuz', 'Wassermelone', 'meyve', '🍉', 'watermelon'),
('Kavun', 'Melone / Honigmelone', 'meyve', '🍈', 'melon'),
('Şeftali', 'Pfirsich', 'meyve', '🍑', 'peach'),
('Kiraz', 'Kirsche', 'meyve', '🍒', 'cherry'),
('Armut', 'Birne', 'meyve', '🍐', 'pear'),
('Mango', 'Mango', 'meyve', '🥭', 'mango'),
('Ananas', 'Ananas', 'meyve', '🍍', 'pineapple'),
('Kivi', 'Kiwi', 'meyve', '🥝', 'kiwi'),
('Avokado', 'Avocado', 'meyve', '🥑', 'avocado'),
('Greyfurt', 'Grapefruit', 'meyve', '🍊', 'grapefruit'),
('Ahududu', 'Himbeere', 'meyve', '🫐', 'raspberry'),
('Yaban Mersini', 'Blaubeere / Heidelbeere', 'meyve', '🫐', 'blueberry'),
('Erik', 'Pflaume / Zwetschge', 'meyve', '🫐', 'plum'),
('İncir', 'Feige', 'meyve', '🍑', 'fig feige'),
('Nektarin', 'Nektarine', 'meyve', '🍑', 'nectarine'),
('Kayısı', 'Aprikose', 'meyve', '🍑', 'apricot'),

-- ============================================================
-- 🥛 SÜT ÜRÜNLERİ / MILCHPRODUKTE
-- ============================================================
('Süt', 'Milch', 'sut', '🥛', 'milk vollmilch'),
('Yağsız Süt', 'Fettarme Milch', 'sut', '🥛', 'skimmed milk'),
('Bitkisel Süt (Yulaf)', 'Hafermilch', 'sut', '🥛', 'oat milk'),
('Bitkisel Süt (Soya)', 'Sojamilch', 'sut', '🥛', 'soy milk'),
('Bitkisel Süt (Badem)', 'Mandelmilch', 'sut', '🥛', 'almond milk'),
('Tereyağı', 'Butter', 'sut', '🧈', 'butter'),
('Kaşar Peyniri', 'Gouda', 'sut', '🧀', 'cheese käse'),
('Beyaz Peynir', 'Feta / Weißkäse', 'sut', '🧀', 'feta white cheese'),
('Mozzarella', 'Mozzarella', 'sut', '🧀', 'mozzarella'),
('Krem Peynir', 'Frischkäse', 'sut', '🧀', 'cream cheese'),
('Parmesan', 'Parmesan', 'sut', '🧀', 'parmesan'),
('Yoğurt (Sade)', 'Naturjoghurt', 'sut', '🥛', 'yogurt jogurt'),
('Meyveli Yoğurt', 'Fruchtjoghurt', 'sut', '🥛', 'fruit yogurt'),
('Süzme Yoğurt', 'Griechischer Joghurt', 'sut', '🥛', 'greek yogurt'),
('Krema', 'Sahne', 'sut', '🥛', 'cream'),
('Quark', 'Quark', 'sut', '🥛', 'quark çökelek'),
('Ayran', 'Ayran', 'sut', '🥛', 'ayran'),

-- ============================================================
-- 🥚 YUMURTA / EIER
-- ============================================================
('Yumurta (10lu)', 'Eier (10er)', 'yumurta', '🥚', 'eggs'),
('Yumurta (6lı)', 'Eier (6er)', 'yumurta', '🥚', 'eggs'),

-- ============================================================
-- 🥩 ET / FLEISCH
-- ============================================================
('Tavuk Göğsü', 'Hähnchenbrustfilet', 'et', '🍗', 'chicken breast'),
('Tavuk Bütün', 'Ganzes Hähnchen', 'et', '🍗', 'whole chicken'),
('Tavuk But', 'Hähnchenschenkel', 'et', '🍗', 'chicken thigh'),
('Dana Kıyma', 'Rinderhackfleisch', 'et', '🥩', 'minced beef'),
('Dana Biftek', 'Rindersteak', 'et', '🥩', 'beef steak'),
('Kuzu Kıyma', 'Lammhackfleisch', 'et', '🥩', 'minced lamb'),
('Kuzu Pirzola', 'Lammkotelett', 'et', '🥩', 'lamb chop'),
('Sosis (Dana)', 'Rinderbratwurst', 'et', '🌭', 'sausage wurst'),
('Frankfurt Sosisi', 'Frankfurter', 'et', '🌭', 'frankfurter hot dog'),
('Salam', 'Salami', 'et', '🍖', 'salami'),
('Jambon', 'Kochschinken', 'et', '🍖', 'ham'),
('Sucuk', 'Sucuk / Türkische Wurst', 'et', '🌭', 'sucuk'),
('Pastırma', 'Pastirma', 'et', '🥓', 'pastirma'),

-- ============================================================
-- 🐟 BALIK / FISCH
-- ============================================================
('Somon Fileto', 'Lachsfilet', 'balik', '🐟', 'salmon lachs'),
('Ton Balığı (Konserve)', 'Thunfisch (Dose)', 'balik', '🐟', 'tuna'),
('Karides', 'Garnelen', 'balik', '🦐', 'shrimp prawns'),
('Alabalık', 'Forelle', 'balik', '🐟', 'trout'),
('Morina', 'Kabeljau', 'balik', '🐟', 'cod'),
('Balık Parmak', 'Fischstäbchen', 'balik', '🐟', 'fish fingers'),

-- ============================================================
-- 🍞 EKMEK & FIRINCILIK / BACKWAREN
-- ============================================================
('Ekmek (Tam Buğday)', 'Vollkornbrot', 'ekmek', '🍞', 'bread wholegrain'),
('Beyaz Ekmek', 'Weißbrot / Toastbrot', 'ekmek', '🍞', 'white bread toast'),
('Sandviç Ekmeği', 'Brötchen / Semmel', 'ekmek', '🥖', 'rolls bun'),
('Baget', 'Baguette', 'ekmek', '🥖', 'baguette'),
('Kruvasan', 'Croissant', 'ekmek', '🥐', 'croissant'),
('Pide', 'Fladenbrot', 'ekmek', '🫓', 'flatbread'),
('Lavaş', 'Wrap / Tortilla', 'ekmek', '🫓', 'wrap tortilla lavash'),

-- ============================================================
-- 🥤 İÇECEKLER / GETRÄNKE
-- ============================================================
('Su (1.5L)', 'Mineralwasser (1.5L)', 'icecek', '💧', 'water'),
('Maden Suyu', 'Sprudelwasser', 'icecek', '💧', 'sparkling water soda'),
('Portakal Suyu', 'Orangensaft', 'icecek', '🍊', 'orange juice'),
('Elma Suyu', 'Apfelsaft', 'icecek', '🍎', 'apple juice'),
('Çay (Demlik)', 'Schwarztee', 'icecek', '🍵', 'black tea'),
('Çay (Poşet)', 'Teebeutel', 'icecek', '🍵', 'tea bag'),
('Çay (Yeşil)', 'Grüntee', 'icecek', '🍵', 'green tea'),
('Kahve (Filtre)', 'Filterkaffee', 'icecek', '☕', 'filter coffee'),
('Kahve (Neskafe)', 'Instantkaffee', 'icecek', '☕', 'instant coffee nescafe'),
('Kahve (Çekirdek)', 'Kaffeebohnen', 'icecek', '☕', 'coffee beans'),
('Kola', 'Cola', 'icecek', '🥤', 'cola coke'),
('Soda', 'Limonade', 'icecek', '🥤', 'lemonade soda'),
('Enerji İçeceği', 'Energydrink', 'icecek', '🥤', 'energy drink red bull'),
('Bira', 'Bier', 'icecek', '🍺', 'beer'),
('Şarap (Kırmızı)', 'Rotwein', 'icecek', '🍷', 'red wine'),
('Şarap (Beyaz)', 'Weißwein', 'icecek', '🍾', 'white wine'),
('Limonata', 'Limonade / Zitronenlimonade', 'icecek', '🍋', 'lemonade'),

-- ============================================================
-- 🌾 KURU GIDA / TROCKENWAREN
-- ============================================================
('Pirinç', 'Reis', 'kurugida', '🍚', 'rice'),
('Bulgur', 'Bulgur', 'kurugida', '🌾', 'bulgur'),
('Makarna (Spagetti)', 'Spaghetti', 'kurugida', '🍝', 'pasta spaghetti'),
('Makarna (Penne)', 'Penne', 'kurugida', '🍝', 'pasta penne'),
('Makarna (Fusilli)', 'Fusilli', 'kurugida', '🍝', 'pasta fusilli'),
('Un', 'Mehl', 'kurugida', '🌾', 'flour'),
('Şeker', 'Zucker', 'kurugida', '🍬', 'sugar'),
('Toz Şeker', 'Puderzucker', 'kurugida', '🍬', 'powdered sugar'),
('Tuz', 'Salz', 'kurugida', '🧂', 'salt'),
('Kırmızı Mercimek', 'Rote Linsen', 'kurugida', '🫘', 'red lentils linsen'),
('Yeşil Mercimek', 'Grüne Linsen', 'kurugida', '🫘', 'green lentils'),
('Nohut (Kuru)', 'Kichererbsen (trocken)', 'kurugida', '🫘', 'chickpeas'),
('Kuru Fasulye', 'Weiße Bohnen', 'kurugida', '🫘', 'white beans'),
('Zeytinyağı', 'Olivenöl', 'kurugida', '🫒', 'olive oil'),
('Ayçiçek Yağı', 'Sonnenblumenöl', 'kurugida', '🌻', 'sunflower oil'),
('Yulaf Ezmesi', 'Haferflocken', 'kurugida', '🌾', 'oats'),
('Müsli', 'Müsli', 'kurugida', '🌾', 'muesli'),
('Cornflakes', 'Cornflakes', 'kurugida', '🌾', 'cornflakes cereals'),

-- ============================================================
-- 🥫 KONSERVE / KONSERVEN
-- ============================================================
('Salça (Domates)', 'Tomatenmark', 'konserve', '🍅', 'tomato paste'),
('Konserve Domates', 'Dosentomaten', 'konserve', '🥫', 'canned tomatoes'),
('Konserve Mısır', 'Dosenmais', 'konserve', '🥫', 'canned corn'),
('Konserve Fasulye', 'Dosenbohnen', 'konserve', '🥫', 'canned beans'),
('Konserve Nohut', 'Kichererbsen (Dose)', 'konserve', '🥫', 'canned chickpeas'),
('Ketçap', 'Ketchup', 'konserve', '🍅', 'ketchup'),
('Mayonez', 'Mayonnaise', 'konserve', '🫙', 'mayonnaise mayo'),
('Hardal', 'Senf', 'konserve', '🫙', 'mustard'),
('Sirke', 'Essig', 'konserve', '🫙', 'vinegar'),
('Soya Sosu', 'Sojasoße', 'konserve', '🫙', 'soy sauce'),
('Zeytinyağı Zeytin', 'Oliven', 'konserve', '🫒', 'olives'),
('Turşu', 'Gewürzgurken', 'konserve', '🥒', 'pickles gherkins'),

-- ============================================================
-- 🫙 BAHARAT / GEWÜRZE
-- ============================================================
('Karabiber', 'Schwarzer Pfeffer', 'baharat', '🌶', 'black pepper'),
('Kırmızı Biber Tozu', 'Paprikapulver', 'baharat', '🌶', 'paprika powder'),
('Acı Biber Tozu', 'Cayennepfeffer', 'baharat', '🌶', 'cayenne'),
('Kimyon', 'Kreuzkümmel', 'baharat', '🌿', 'cumin'),
('Tarçın', 'Zimt', 'baharat', '🌿', 'cinnamon'),
('Zerdeçal', 'Kurkuma', 'baharat', '🌿', 'turmeric'),
('Kekik', 'Oregano / Thymian', 'baharat', '🌿', 'oregano thyme'),
('Fesleğen', 'Basilikum', 'baharat', '🌿', 'basil'),
('Biberiye', 'Rosmarin', 'baharat', '🌿', 'rosemary'),
('Defne Yaprağı', 'Lorbeerblatt', 'baharat', '🌿', 'bay leaf'),
('Zencefil (Toz)', 'Ingwer (gemahlen)', 'baharat', '🌿', 'ginger'),
('Muskat', 'Muskatnuss', 'baharat', '🌿', 'nutmeg'),
('Sumak', 'Sumach', 'baharat', '🌿', 'sumac'),
('Nane', 'Minze', 'baharat', '🌿', 'mint'),
('Maydanoz', 'Petersilie', 'baharat', '🌿', 'parsley'),
('Dereotu', 'Dill', 'baharat', '🌿', 'dill'),

-- ============================================================
-- 🍫 TATLI & ATISTIRMALIK / SÜSSIGKEITEN
-- ============================================================
('Çikolata (Sütlü)', 'Milchschokolade', 'tatli', '🍫', 'milk chocolate'),
('Çikolata (Bitter)', 'Zartbitterschokolade', 'tatli', '🍫', 'dark chocolate'),
('Bisküvi', 'Kekse / Butterkekse', 'tatli', '🍪', 'cookies biscuits'),
('Gummy Ayıcık', 'Gummibärchen', 'tatli', '🐻', 'gummy bears haribo'),
('Cips', 'Chips', 'tatli', '🥔', 'chips crisps'),
('Patlamış Mısır', 'Popcorn', 'tatli', '🍿', 'popcorn'),
('Bal', 'Honig', 'tatli', '🍯', 'honey'),
('Reçel (Çilek)', 'Erdbeermarmelade', 'tatli', '🍓', 'strawberry jam marmelade'),
('Reçel (Kayısı)', 'Aprikosenmarmelade', 'tatli', '🍑', 'apricot jam'),
('Nutella', 'Nutella', 'tatli', '🍫', 'nutella'),
('Fıstık Ezmesi', 'Erdnussbutter', 'tatli', '🥜', 'peanut butter'),
('Kuruyemiş Karışık', 'Nussmischung', 'tatli', '🥜', 'nuts mixed'),
('Fıstık', 'Erdnüsse', 'tatli', '🥜', 'peanuts'),
('Badem', 'Mandeln', 'tatli', '🌰', 'almonds'),
('Ceviz', 'Walnüsse', 'tatli', '🌰', 'walnuts'),
('Dondurma', 'Eis / Eiscreme', 'tatli', '🍦', 'ice cream'),
('Kuru Üzüm', 'Rosinen', 'tatli', '🍇', 'raisins'),

-- ============================================================
-- 🧹 TEMİZLİK / REINIGUNG
-- ============================================================
('Bulaşık Deterjanı', 'Spülmittel', 'temizlik', '🧴', 'dish soap'),
('Bulaşık Makinesi Tableti', 'Spülmaschinentabs', 'temizlik', '🧼', 'dishwasher tablets'),
('Çamaşır Deterjanı', 'Waschmittel', 'temizlik', '🧺', 'laundry detergent'),
('Çamaşır Yumuşatıcı', 'Weichspüler', 'temizlik', '🧺', 'fabric softener'),
('Çok Amaçlı Temizleyici', 'Allzweckreiniger', 'temizlik', '🧹', 'all purpose cleaner'),
('Tuvalet Temizleyici', 'WC-Reiniger', 'temizlik', '🚽', 'toilet cleaner'),
('Cam Temizleyici', 'Glasreiniger', 'temizlik', '🪟', 'glass cleaner'),
('Sünger', 'Schwamm', 'temizlik', '🧽', 'sponge'),
('Çöp Torbası', 'Müllbeutel', 'temizlik', '🗑️', 'garbage bags trash'),
('Tuvalet Kağıdı', 'Toilettenpapier', 'temizlik', '🧻', 'toilet paper'),
('Kağıt Havlu', 'Küchenrolle', 'temizlik', '🧻', 'paper towel'),
('Kağıt Mendil', 'Papiertaschentücher', 'temizlik', '🤧', 'tissues'),

-- ============================================================
-- 🧴 KİŞİSEL BAKIM / KÖRPERPFLEGE
-- ============================================================
('Şampuan', 'Shampoo', 'bakim', '🧴', 'shampoo'),
('Saç Kremi', 'Conditioner / Spülung', 'bakim', '🧴', 'conditioner'),
('Duş Jeli', 'Duschgel', 'bakim', '🚿', 'shower gel'),
('Sabun', 'Seife', 'bakim', '🧼', 'soap'),
('Diş Macunu', 'Zahnpasta', 'bakim', '🪥', 'toothpaste'),
('Diş Fırçası', 'Zahnbürste', 'bakim', '🪥', 'toothbrush'),
('Deodorant', 'Deodorant', 'bakim', '🧴', 'deodorant'),
('Tıraş Jeli', 'Rasiergel', 'bakim', '🪒', 'shaving gel'),
('Tıraş Makinesi (Tek Kullanım)', 'Einwegrasierer', 'bakim', '🪒', 'razor'),
('El Kremi', 'Handcreme', 'bakim', '🧴', 'hand cream lotion'),
('Güneş Kremi', 'Sonnencreme', 'bakim', '🧴', 'sunscreen'),
('Bebek Bezi', 'Windeln', 'bakim', '👶', 'diapers nappies'),
('Islak Mendil', 'Feuchttücher', 'bakim', '🤧', 'wet wipes'),

-- ============================================================
-- ❄️ DONDURULMUŞ / TIEFKÜHL
-- ============================================================
('Dondurulmuş Pizza', 'Tiefkühlpizza', 'dondurulmus', '🍕', 'frozen pizza'),
('Dondurulmuş Sebze', 'Tiefkühlgemüse', 'dondurulmus', '🥦', 'frozen vegetables'),
('Dondurulmuş Bezelye', 'Tiefkühlerbsen', 'dondurulmus', '🫛', 'frozen peas'),
('Dondurulmuş Patates Kızartması', 'Pommes Frites (TK)', 'dondurulmus', '🍟', 'frozen fries'),
('Dondurulmuş Tavuk Nugget', 'Chicken Nuggets (TK)', 'dondurulmus', '🍗', 'frozen nuggets'),

-- ============================================================
-- 🥘 HAZIR GIDA / FERTIGGERICHTE
-- ============================================================
('Hazır Çorba', 'Fertigsuppe / Tütensuppe', 'hazir', '🍜', 'instant soup'),
('Konserve Fasulye Yemeği', 'Bohneneintopf (Dose)', 'hazir', '🥫', 'canned stew'),
('Köfte (Hazır)', 'Fertigköfte', 'hazir', '🥩', 'ready meatballs'),

-- ============================================================
-- 🏠 DİĞER / SONSTIGES
-- ============================================================
('Alüminyum Folyo', 'Alufolie', 'diger', '🔧', 'aluminum foil'),
('Streç Film', 'Frischhaltefolie', 'diger', '🔧', 'cling film wrap'),
('Yağlı Kağıt', 'Backpapier', 'diger', '🔧', 'baking paper'),
('Buzdolabı Torbası', 'Gefrierbeutel', 'diger', '🛍️', 'freezer bags'),
('Market Torbası', 'Einkaufstasche', 'diger', '🛍️', 'shopping bag'),
('Pil (AA)', 'Batterien (AA)', 'diger', '🔋', 'batteries'),
('Ampul', 'Glühbirne / LED', 'diger', '💡', 'light bulb');
