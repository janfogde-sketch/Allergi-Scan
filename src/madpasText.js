// @ts-nocheck
// Madpas-tekster (oversættelser og sætningsbyggere). Ligger i en egen fil, så de
// store tabeller ikke ligger i startpakken: kun Madpas-skærmen og oplæsningen
// indlæser dem (to do a5dc1790, Hurtigere opstart).
import { ALLERGENS, DIETS, MADPAS_LANGUAGES } from "./constants.jsx";

export const ALLERGEN_EXAMPLES = {
  gluten: {
    products: { da:["Brød","Pasta","Øl","Sojasauce"], en:["Bread","Pasta","Beer","Soy sauce"], de:["Brot","Pasta","Bier","Sojasoße"], fr:["Pain","Pâtes","Bière","Sauce soja"], es:["Pan","Pasta","Cerveza","Salsa de soja"], it:["Pane","Pasta","Birra","Salsa di soia"], nl:["Brood","Pasta","Bier","Sojasaus"], pt:["Pão","Massa","Cerveja","Molho de soja"], pl:["Chleb","Makaron","Piwo","Sos sojowy"], sv:["Bröd","Pasta","Öl","Sojasås"], no:["Brød","Pasta","Øl","Soyasaus"], ja:["パン","パスタ","ビール","醤油"], zh:["面包","面食","啤酒","酱油"], ar:["خبز","معكرونة","بيرة","صلصة الصويا"], tr:["Ekmek","Makarna","Bira","Soya sosu"], th:["ขนมปัง","พาสต้า","เบียร์","ซีอิ้ว"], el:["Ψωμί","Ζυμαρικά","Μπύρα","Σάλτσα σόγιας"] },
    ingredients: { da:["Hvede","Rug","Byg","Havre","Spelt"], en:["Wheat","Rye","Barley","Oats","Spelt"], de:["Weizen","Roggen","Gerste","Hafer","Dinkel"], fr:["Blé","Seigle","Orge","Avoine","Épeautre"], es:["Trigo","Centeno","Cebada","Avena","Espelta"], it:["Frumento","Segale","Orzo","Avena","Farro"], nl:["Tarwe","Rogge","Gerst","Haver","Spelt"], pt:["Trigo","Centeio","Cevada","Aveia","Espelta"], pl:["Pszenica","Żyto","Jęczmień","Owies","Orkisz"], sv:["Vete","Råg","Korn","Havre","Dinkel"], no:["Hvete","Rug","Bygg","Havre","Spelt"], ja:["小麦","ライ麦","大麦","燕麦","スペルト"], zh:["小麦","黑麦","大麦","燕麦","斯佩尔特"], ar:["قمح","جاودار","شعير","شوفان","كاموت"], tr:["Buğday","Çavdar","Arpa","Yulaf","Kavılca"], th:["ข้าวสาลี","ข้าวไรย์","ข้าวบาร์เลย์","ข้าวโอ๊ต"], el:["Σιτάρι","Σίκαλη","Κριθάρι","Βρώμη","Ζέα"] },
  },
  // "hvede" og "maelkeallergi" manglede oprindeligt her, samme hul som
  // ALLERGEN_T (26. sept. 2026, Madpas-redesign — se madpasAllergenLabel()
  // i useMadpas.js for den anden halvdel af samme fund).
  hvede: {
    products: { da:["Brød","Pasta","Pizzadej","Kager"], en:["Bread","Pasta","Pizza dough","Cakes"], de:["Brot","Pasta","Pizzateig","Kuchen"], fr:["Pain","Pâtes","Pâte à pizza","Gâteaux"], es:["Pan","Pasta","Masa de pizza","Pasteles"], it:["Pane","Pasta","Impasto per pizza","Torte"], nl:["Brood","Pasta","Pizzadeeg","Taart"], pt:["Pão","Massa","Massa de pizza","Bolos"], pl:["Chleb","Makaron","Ciasto na pizzę","Ciasta"], sv:["Bröd","Pasta","Pizzadeg","Kakor"], no:["Brød","Pasta","Pizzadeig","Kaker"], ja:["パン","パスタ","ピザ生地","ケーキ"], zh:["面包","面食","披萨面团","蛋糕"], ar:["خبز","معكرونة","عجينة بيتزا","كعك"], tr:["Ekmek","Makarna","Pizza hamuru","Kekler"], th:["ขนมปัง","พาสต้า","แป้งพิซซ่า","เค้ก"], el:["Ψωμί","Ζυμαρικά","Ζύμη πίτσας","Κέικ"] },
    ingredients: { da:["Rasp","Nogle saucer"], en:["Breadcrumbs","Some sauces"], de:["Paniermehl","Manche Soßen"], fr:["Chapelure","Certaines sauces"], es:["Pan rallado","Algunas salsas"], it:["Pangrattato","Alcune salse"], nl:["Paneermeel","Sommige sauzen"], pt:["Farinha de rosca","Alguns molhos"], pl:["Bułka tarta","Niektóre sosy"], sv:["Ströbröd","Vissa såser"], no:["Brødsmuler","Enkelte sauser"], ja:["パン粉","一部のソース"], zh:["面包糠","部分酱汁"], ar:["فتات الخبز","بعض الصلصات"], tr:["Galeta unu","Bazı soslar"], th:["เกล็ดขนมปัง","ซอสบางชนิด"], el:["Τριμμένη φρυγανιά","Ορισμένες σάλτσες"] },
  },
  maelkeallergi: {
    products: { da:["Mælk","Fløde","Smør","Ost"], en:["Milk","Cream","Butter","Cheese"], de:["Milch","Sahne","Butter","Käse"], fr:["Lait","Crème","Beurre","Fromage"], es:["Leche","Nata","Mantequilla","Queso"], it:["Latte","Panna","Burro","Formaggio"], nl:["Melk","Room","Boter","Kaas"], pt:["Leite","Natas","Manteiga","Queijo"], pl:["Mleko","Śmietana","Masło","Ser"], sv:["Mjölk","Grädde","Smör","Ost"], no:["Melk","Fløte","Smør","Ost"], ja:["牛乳","クリーム","バター","チーズ"], zh:["牛奶","奶油","黄油","奶酪"], ar:["حليب","كريمة","زبدة","جبن"], tr:["Süt","Krema","Tereyağı","Peynir"], th:["นม","ครีม","เนย","ชีส"], el:["Γάλα","Κρέμα γάλακτος","Βούτυρο","Τυρί"] },
    // "Valle"/"Whey" tilføjet FØRST her (27. sept. 2026, Madpas-finpolish,
    // krav 6) — products alene fylder allerede de 4 pladser
    // madpasAllergenExamples() viste tidligere, så Whey kom aldrig frem;
    // slice-grænsen er samtidig hævet fra 4 til 5 i useMadpas.js.
    ingredients: { da:["Valle","Chokolade","Nogle bagværk"], en:["Whey","Chocolate","Some baked goods"], de:["Molke","Schokolade","Manche Backwaren"], fr:["Lactosérum","Chocolat","Certaines pâtisseries"], es:["Suero","Chocolate","Algunos productos horneados"], it:["Siero","Cioccolato","Alcuni prodotti da forno"], nl:["Wei","Chocolade","Sommige gebakken producten"], pt:["Soro","Chocolate","Alguns produtos de padaria"], pl:["Serwatka","Czekolada","Niektóre wypieki"], sv:["Vassle","Choklad","Vissa bakverk"], no:["Myse","Sjokolade","Enkelte bakevarer"], ja:["乳清","チョコレート","一部の焼き菓子"], zh:["乳清","巧克力","部分烘焙食品"], ar:["مصل اللبن","شوكولاتة","بعض المخبوزات"], tr:["Peynir altı suyu","Çikolata","Bazı fırın ürünleri"], th:["เวย์","ช็อกโกแลต","ขนมอบบางชนิด"], el:["Ορός γάλακτος","Σοκολάτα","Ορισμένα αρτοσκευάσματα"] },
  },
  laktose: {
    products: { da:["Mælk","Ost","Smør","Is","Yoghurt"], en:["Milk","Cheese","Butter","Ice cream","Yoghurt"], de:["Milch","Käse","Butter","Eis","Joghurt"], fr:["Lait","Fromage","Beurre","Glace","Yaourt"], es:["Leche","Queso","Mantequilla","Helado","Yogur"], it:["Latte","Formaggio","Burro","Gelato","Yogurt"], nl:["Melk","Kaas","Boter","Ijs","Yoghurt"], pt:["Leite","Queijo","Manteiga","Gelado","Iogurte"], pl:["Mleko","Ser","Masło","Lody","Jogurt"], sv:["Mjölk","Ost","Smör","Glass","Yoghurt"], no:["Melk","Ost","Smør","Is","Yoghurt"], ja:["牛乳","チーズ","バター","アイスクリーム","ヨーグルト"], zh:["牛奶","奶酪","黄油","冰淇淋","酸奶"], ar:["حليب","جبن","زبدة","آيس كريم","زبادي"], tr:["Süt","Peynir","Tereyağı","Dondurma","Yoğurt"], th:["นม","ชีส","เนย","ไอศกรีม","โยเกิร์ต"], el:["Γάλα","Τυρί","Βούτυρο","Παγωτό","Γιαούρτι"] },
    ingredients: { da:["Laktose","Valle","Kasein","Fløde","Skummetmælk"], en:["Lactose","Whey","Casein","Cream","Skimmed milk"], de:["Laktose","Molke","Kasein","Sahne","Magermilch"], fr:["Lactose","Lactosérum","Caséine","Crème","Lait écrémé"], es:["Lactosa","Suero","Caseína","Nata","Leche desnatada"], it:["Lattosio","Siero","Caseina","Panna","Latte scremato"], nl:["Lactose","Wei","Caseïne","Room","Magere melk"], pt:["Lactose","Soro","Caseína","Natas","Leite desnatado"], pl:["Laktoza","Serwatka","Kazeina","Śmietana","Mleko odtłuszczone"], sv:["Laktos","Vassle","Kasein","Grädde","Skummjölk"], no:["Laktose","Myse","Kasein","Fløte","Skummet melk"], ja:["乳糖","乳清","カゼイン","クリーム","脱脂乳"], zh:["乳糖","乳清","酪蛋白","奶油","脱脂奶"], ar:["لاكتوز","مصل اللبن","كازين","كريمة","حليب خالي الدسم"], tr:["Laktoz","Peynir altı suyu","Kazein","Krema","Yağsız süt"], th:["แลคโตส","เวย์","เคซีน","ครีม","นมพร่องมันเนย"], el:["Λακτόζη","Ορός γάλακτος","Καζεΐνη","Κρέμα","Αποβουτυρωμένο γάλα"] },
  },
  aeg: {
    products: { da:["Mayonnaise","Pasta","Kage","Aioli","Vafler"], en:["Mayonnaise","Pasta","Cake","Aioli","Waffles"], de:["Mayonnaise","Pasta","Kuchen","Aioli","Waffeln"], fr:["Mayonnaise","Pâtes","Gâteau","Aïoli","Gaufres"], es:["Mayonesa","Pasta","Tarta","Alioli","Gofres"], it:["Maionese","Pasta","Torta","Aioli","Cialde"], nl:["Mayonaise","Pasta","Cake","Aioli","Wafels"], pt:["Maionese","Massa","Bolo","Aioli","Waffles"], pl:["Majonez","Makaron","Ciasto","Aioli","Gofry"], sv:["Majonnäs","Pasta","Kaka","Aioli","Våfflor"], no:["Majones","Pasta","Kake","Aioli","Vafler"], ja:["マヨネーズ","パスタ","ケーキ","アイオリ","ワッフル"], zh:["蛋黄酱","面食","蛋糕","蒜泥蛋黄酱","华夫饼"], ar:["مايونيز","معكرونة","كعكة","أيولي","وافل"], tr:["Mayonez","Makarna","Kek","Aioli","Waffle"], th:["มายองเนส","พาสต้า","เค้ก","ไอโอลี่","วาฟเฟิล"], el:["Μαγιονέζα","Ζυμαρικά","Κέικ","Αϊολί","Βάφλες"] },
    ingredients: { da:["Æg","Æggehvide","Æggeblomme","Tørret æg"], en:["Egg","Egg white","Egg yolk","Dried egg"], de:["Ei","Eiweiß","Eigelb","Trockenei"], fr:["Œuf","Blanc d'œuf","Jaune d'œuf","Œuf en poudre"], es:["Huevo","Clara de huevo","Yema","Huevo en polvo"], it:["Uovo","Albume","Tuorlo","Uovo essiccato"], nl:["Ei","Eiwit","Eigeel","Gedroogd ei"], pt:["Ovo","Clara","Gema","Ovo em pó"], pl:["Jajo","Białko jaja","Żółtko","Jajo suszone"], sv:["Ägg","Äggvita","Äggula","Torkat ägg"], no:["Egg","Eggehvite","Eggeplomme","Tørket egg"], ja:["卵","卵白","卵黄","乾燥卵"], zh:["鸡蛋","蛋清","蛋黄","干燥蛋"], ar:["بيض","بياض البيض","صفار البيض","بيض مجفف"], tr:["Yumurta","Yumurta beyazı","Yumurta sarısı","Kurutulmuş yumurta"], th:["ไข่","ไข่ขาว","ไข่แดง","ไข่แห้ง"], el:["Αυγό","Ασπράδι","Κρόκος","Αποξηραμένο αυγό"] },
  },
  noedder: {
    products: { da:["Pesto","Chokolade","Muesli","Nougat","Marcipan"], en:["Pesto","Chocolate","Muesli","Nougat","Marzipan"], de:["Pesto","Schokolade","Müsli","Nougat","Marzipan"], fr:["Pesto","Chocolat","Muesli","Nougat","Massepain"], es:["Pesto","Chocolate","Muesli","Turrón","Mazapán"], it:["Pesto","Cioccolato","Muesli","Torrone","Marzapane"], nl:["Pesto","Chocolade","Muesli","Nougat","Marsepein"], pt:["Pesto","Chocolate","Muesli","Nougat","Maçapão"], pl:["Pesto","Czekolada","Muesli","Nugat","Marcepan"], sv:["Pesto","Choklad","Müsli","Nougat","Marsipan"], no:["Pesto","Sjokolade","Müsli","Nougat","Marsipan"], ja:["ペスト","チョコレート","ミューズリー","ヌガー","マジパン"], zh:["香蒜酱","巧克力","麦片","牛轧糖","杏仁膏"], ar:["بيستو","شوكولاتة","موسلي","نوغا","لوز الحلوى"], tr:["Pesto","Çikolata","Müsli","Nuga","Badem ezmesi"], th:["เพสโต้","ช็อกโกแลต","มูสลี่","นูกัต","มาร์ซิปัน"], el:["Πέστο","Σοκολάτα","Μούσλι","Νουγκά","Μαρτσιπάνι"] },
    ingredients: { da:["Mandler","Hasselnødder","Valnødder","Cashew","Pistacienødder"], en:["Almonds","Hazelnuts","Walnuts","Cashews","Pistachios"], de:["Mandeln","Haselnüsse","Walnüsse","Cashews","Pistazien"], fr:["Amandes","Noisettes","Noix","Noix de cajou","Pistaches"], es:["Almendras","Avellanas","Nueces","Anacardos","Pistachos"], it:["Mandorle","Nocciole","Noci","Anacardi","Pistacchi"], nl:["Amandelen","Hazelnoten","Walnoten","Cashewnoten","Pistachenoten"], pt:["Amêndoas","Avelãs","Nozes","Cajus","Pistáchios"], pl:["Migdały","Orzechy laskowe","Orzechy włoskie","Nerkowce","Pistacje"], sv:["Mandlar","Hasselnötter","Valnötter","Cashewnötter","Pistaschnötter"], no:["Mandler","Hasselnøtter","Valnøtter","Cashewnøtter","Pistasjnøtter"], ja:["アーモンド","ヘーゼルナッツ","クルミ","カシューナッツ","ピスタチオ"], zh:["杏仁","榛子","核桃","腰果","开心果"], ar:["لوز","بندق","جوز","كاجو","فستق"], tr:["Badem","Fındık","Ceviz","Kaju","Antep fıstığı"], th:["อัลมอนด์","เฮเซลนัท","วอลนัท","มะม่วงหิมพานต์","พิสตาชิโอ"], el:["Αμύγδαλα","Φουντούκια","Καρύδια","Κάσιους","Φιστίκια"] },
  },
  jordnoedder: {
    products: { da:["Jordnøddesmør","Satay sauce","Snacks","Cookies"], en:["Peanut butter","Satay sauce","Snacks","Cookies"], de:["Erdnussbutter","Satay-Sauce","Snacks","Kekse"], fr:["Beurre de cacahuète","Sauce satay","Snacks","Cookies"], es:["Mantequilla de cacahuete","Salsa satay","Snacks","Galletas"], it:["Burro di arachidi","Salsa satay","Snack","Biscotti"], nl:["Pindakaas","Satésaus","Snacks","Koekjes"], pt:["Manteiga de amendoim","Molho satay","Snacks","Bolachas"], pl:["Masło orzechowe","Sos satay","Przekąski","Ciastka"], sv:["Jordnötssmör","Sataysås","Snacks","Kakor"], no:["Peanøttsmør","Sataysaus","Snacks","Kjeks"], ja:["ピーナッツバター","サテソース","スナック","クッキー"], zh:["花生酱","沙爹酱","零食","饼干"], ar:["زبدة الفول السوداني","صلصة الساتيه","وجبات خفيفة","بسكويت"], tr:["Fıstık ezmesi","Satay sosu","Atıştırmalık","Kurabiye"], th:["เนยถั่ว","ซอสสะเต๊ะ","ขนมขบเคี้ยว","คุกกี้"], el:["Βούτυρο φιστικιών","Σάλτσα σατέ","Σνακ","Μπισκότα"] },
    ingredients: { da:["Jordnødder","Peanuts","Arachis hypogaea"], en:["Peanuts","Groundnuts","Arachis hypogaea"], de:["Erdnüsse","Erdnuss","Arachis hypogaea"], fr:["Arachides","Cacahuètes","Arachis hypogaea"], es:["Cacahuetes","Maníes","Arachis hypogaea"], it:["Arachidi","Noccioline","Arachis hypogaea"], nl:["Pinda's","Grondnoten","Arachis hypogaea"], pt:["Amendoins","Arachis hypogaea"], pl:["Orzeszki ziemne","Orzeszki arachidowe"], sv:["Jordnötter","Arachis hypogaea"], no:["Peanøtter","Jordnøtter","Arachis hypogaea"], ja:["ピーナッツ","落花生","アラキス"], zh:["花生","落花生"], ar:["الفول السوداني","فول سوداني"], tr:["Yerfıstığı","Fıstık"], th:["ถั่วลิสง"], el:["Φιστίκια Αμερικής","Αράπικα φιστίκια"] },
  },
  soja: {
    products: { da:["Tofu","Soja sauce","Miso","Edamame","Tempeh"], en:["Tofu","Soy sauce","Miso","Edamame","Tempeh"], de:["Tofu","Sojasoße","Miso","Edamame","Tempeh"], fr:["Tofu","Sauce soja","Miso","Edamame","Tempeh"], es:["Tofu","Salsa de soja","Miso","Edamame","Tempeh"], it:["Tofu","Salsa di soia","Miso","Edamame","Tempeh"], nl:["Tofu","Sojasaus","Miso","Edamame","Tempeh"], pt:["Tofu","Molho de soja","Miso","Edamame","Tempeh"], pl:["Tofu","Sos sojowy","Miso","Edamame","Tempeh"], sv:["Tofu","Sojasås","Miso","Edamame","Tempeh"], no:["Tofu","Soyasaus","Miso","Edamame","Tempeh"], ja:["豆腐","醤油","味噌","枝豆","テンペ"], zh:["豆腐","酱油","味噌","毛豆","天贝"], ar:["توفو","صلصة الصويا","ميسو","إيدامامي","تيمبيه"], tr:["Tofu","Soya sosu","Miso","Edamame","Tempeh"], th:["เต้าหู้","ซีอิ้ว","มิโซะ","เอดาแมม","เทมเป้"], el:["Τόφου","Σάλτσα σόγιας","Μίσο","Εντάμαμε","Τέμπε"] },
    ingredients: { da:["Soja","Sojabønner","Sojalecitin","Sojaprotein","E322"], en:["Soy","Soybeans","Soy lecithin","Soy protein","E322"], de:["Soja","Sojabohnen","Sojalecithin","Sojaprotein","E322"], fr:["Soja","Haricots de soja","Lécithine de soja","Protéine de soja","E322"], es:["Soja","Habas de soja","Lecitina de soja","Proteína de soja","E322"], it:["Soia","Semi di soia","Lecitina di soia","Proteina di soia","E322"], nl:["Soja","Sojabone","Sojalecithine","Sojaprotein","E322"], pt:["Soja","Feijão de soja","Lecitina de soja","Proteína de soja","E322"], pl:["Soja","Sojowe","Lecytyna sojowa","Białko sojowe","E322"], sv:["Soja","Sojabönor","Sojalecithin","Sojaprotein","E322"], no:["Soya","Soyabønner","Sojalesitin","Sojaprotein","E322"], ja:["大豆","大豆レシチン","大豆タンパク","E322"], zh:["大豆","大豆卵磷脂","大豆蛋白","E322"], ar:["الصويا","فول الصويا","ليسيثين الصويا","E322"], tr:["Soya","Soya fasulyesi","Soya lesitini","E322"], th:["ถั่วเหลือง","เลซิตินถั่วเหลือง","E322"], el:["Σόγια","Σογιόλεκιθίνη","E322"] },
  },
  fisk: {
    products: { da:["Fiskesauce","Worcestershire","Caesar dressing","Ansjosdip"], en:["Fish sauce","Worcestershire sauce","Caesar dressing","Anchovy paste"], de:["Fischsauce","Worcestershiresauce","Caesar-Dressing","Sardellenpaste"], fr:["Sauce de poisson","Sauce Worcestershire","Vinaigrette César","Pâte d'anchois"], es:["Salsa de pescado","Salsa Worcestershire","Aderezo César","Pasta de anchoa"], it:["Salsa di pesce","Salsa Worcestershire","Condimento Caesar","Pasta di acciughe"], nl:["Vissaus","Worcestershiresaus","Caesar dressing","Ansjovispasta"], pt:["Molho de peixe","Molho Worcestershire","Molho César","Pasta de anchova"], pl:["Sos rybny","Sos worcestershire","Sos cezar","Pasta z anchois"], sv:["Fisksås","Worcestershiresås","Caesardressing","Ansjovisröra"], no:["Fiskesaus","Worcestershiresaus","Caesardressing","Ansjosvispasta"], ja:["ナンプラー","ウスターソース","シーザードレッシング","アンチョビ"], zh:["鱼露","伍斯特酱","凯撒沙拉酱","凤尾鱼酱"], ar:["صلصة السمك","صلصة وورشيسترشير","تتبيلة سيزر","معجون الأنشوجة"], tr:["Balık sosu","Worcestershire sosu","Sezar sosu","Hamsi ezmesi"], th:["น้ำปลา","ซอสวูสเตอร์","ซีซาร์เดรสซิ่ง","แอนโชวี่เพสต์"], el:["Σάλτσα ψαριού","Σάλτσα Worcestershire","Σάλτσα Καίσαρα","Πάστα αντζούγιας"] },
    ingredients: { da:["Ansjos","Laks","Tun","Makrel","Sardiner"], en:["Anchovy","Salmon","Tuna","Mackerel","Sardines"], de:["Sardellen","Lachs","Thunfisch","Makrele","Sardinen"], fr:["Anchois","Saumon","Thon","Maquereau","Sardines"], es:["Anchoas","Salmón","Atún","Caballa","Sardinas"], it:["Acciughe","Salmone","Tonno","Sgombro","Sardine"], nl:["Ansjovis","Zalm","Tonijn","Makreel","Sardines"], pt:["Anchova","Salmão","Atum","Cavala","Sardinha"], pl:["Anchois","Łosoś","Tuńczyk","Makrela","Sardynki"], sv:["Ansjovis","Lax","Tonfisk","Makrill","Sardiner"], no:["Ansjos","Laks","Tunfisk","Makrell","Sardiner"], ja:["アンチョビ","鮭","マグロ","サバ","イワシ"], zh:["凤尾鱼","三文鱼","金枪鱼","鲭鱼","沙丁鱼"], ar:["أنشوجة","سلمون","تونة","ماكريل","سردين"], tr:["Hamsi","Somon","Ton balığı","Uskumru","Sardalya"], th:["แอนโชวี่","แซลมอน","ทูน่า","ปลาแมคเคอเรล","ปลาซาร์ดีน"], el:["Αντζούγιες","Σολομός","Τόνος","Σκουμπρί","Σαρδέλες"] },
  },
  skaldyr: {
    products: { da:["Paella","Bisque","Sushi","Fiskesuppe","Bouillabaisse"], en:["Paella","Bisque","Sushi","Fish soup","Bouillabaisse"], de:["Paella","Bisque","Sushi","Fischsuppe","Bouillabaisse"], fr:["Paella","Bisque","Sushi","Soupe de poisson","Bouillabaisse"], es:["Paella","Bisque","Sushi","Sopa de pescado","Bouillabaisse"], it:["Paella","Bisque","Sushi","Zuppa di pesce","Bouillabaisse"], nl:["Paella","Bisque","Sushi","Vissoep","Bouillabaisse"], pt:["Paella","Bisque","Sushi","Sopa de peixe","Bouillabaisse"], pl:["Paella","Bisque","Sushi","Zupa rybna","Bouillabaisse"], sv:["Paella","Bisque","Sushi","Fisksoppa","Bouillabaisse"], no:["Paella","Bisque","Sushi","Fiskesuppe","Bouillabaisse"], ja:["パエリア","ビスク","寿司","魚スープ","ブイヤベース"], zh:["海鲜饭","浓汤","寿司","鱼汤","马赛鱼汤"], ar:["باييلا","شوربة كريمة","سوشي","شوربة سمك","بويابيس"], tr:["Paella","Bisque","Sushi","Balık çorbası","Bouillabaisse"], th:["ปาเอย่า","บิสก์","ซูชิ","ซุปปลา","บูยาแบส"], el:["Παέλα","Μπισκ","Σούσι","Ψαρόσουπα","Μπουγιαμπέσα"] },
    ingredients: { da:["Rejer","Krabbe","Hummer","Muslinger","Østers"], en:["Shrimp","Crab","Lobster","Mussels","Oysters"], de:["Garnelen","Krabbe","Hummer","Muscheln","Austern"], fr:["Crevettes","Crabe","Homard","Moules","Huîtres"], es:["Gambas","Cangrejo","Langosta","Mejillones","Ostras"], it:["Gamberi","Granchio","Aragosta","Cozze","Ostriche"], nl:["Garnalen","Krab","Kreeft","Mosselen","Oesters"], pt:["Camarão","Caranguejo","Lagosta","Mexilhões","Ostras"], pl:["Krewetki","Krab","Homar","Małże","Ostrygi"], sv:["Räkor","Krabba","Hummer","Musslor","Ostron"], no:["Reker","Krabbe","Hummer","Muslinger","Østers"], ja:["エビ","カニ","ロブスター","ムール貝","カキ"], zh:["虾","蟹","龙虾","贻贝","牡蛎"], ar:["روبيان","سرطان البحر","جراد البحر","بلح البحر","محار"], tr:["Karides","Yengeç","Istakoz","Midye","İstiridye"], th:["กุ้ง","ปู","กุ้งมังกร","หอยแมลงภู่","หอยนางรม"], el:["Γαρίδες","Καβούρι","Αστακός","Μύδια","Στρείδια"] },
  },
  selleri: {
    products: { da:["Bouillon","Suppe","Krydderisalt","Salat","Remoulade"], en:["Stock","Soup","Seasoning salt","Salad","Remoulade"], de:["Brühe","Suppe","Würzsalz","Salat","Remoulade"], fr:["Bouillon","Soupe","Sel aromatisé","Salade","Rémoulade"], es:["Caldo","Sopa","Sal condimentada","Ensalada","Rémoulade"], it:["Brodo","Zuppa","Sale aromatizzato","Insalata","Remoulade"], nl:["Bouillon","Soep","Kruidenzout","Salade","Remoulade"], pt:["Caldo","Sopa","Sal temperado","Salada","Remoulade"], pl:["Bulion","Zupa","Sól przyprawowa","Sałatka","Remoulada"], sv:["Buljong","Soppa","Kryddsalt","Sallad","Remoulade"], no:["Buljong","Suppe","Kryddersalt","Salat","Remoulade"], ja:["ブイヨン","スープ","シーズニングソルト","サラダ","レムラード"], zh:["高汤","汤","调味盐","沙拉","雷穆拉达酱"], ar:["مرق","شوربة","ملح متبل","سلطة","ريمولاد"], tr:["Et suyu","Çorba","Baharlı tuz","Salata","Remulad"], th:["น้ำซุป","ซุป","เกลือปรุงรส","สลัด","เรมูลาด"], el:["Ζωμός","Σούπα","Αλάτι με μπαχαρικά","Σαλάτα","Ρεμουλάντ"] },
    ingredients: { da:["Selleri","Sellerisalt","Sellerifnug","Sellerifrø"], en:["Celery","Celery salt","Celery flakes","Celery seeds"], de:["Sellerie","Selleriesalz","Selerieflocken","Selleriesamen"], fr:["Céleri","Sel de céleri","Flocons de céleri","Graines de céleri"], es:["Apio","Sal de apio","Copos de apio","Semillas de apio"], it:["Sedano","Sale di sedano","Fiocchi di sedano","Semi di sedano"], nl:["Selderij","Selderijzout","Selderijvlokken","Selderijzaad"], pt:["Aipo","Sal de aipo","Flocos de aipo","Sementes de aipo"], pl:["Seler","Sól selerowa","Płatki selera","Nasiona selera"], sv:["Selleri","Sellerisalt","Selleriflingor","Selleriefrön"], no:["Selleri","Sellerisalt","Sellerifnugg","Sellerifrø"], ja:["セロリ","セロリソルト","セロリフレーク","セロリシード"], zh:["芹菜","芹菜盐","芹菜片","芹菜籽"], ar:["كرفس","ملح الكرفس","رقائق الكرفس","بذور الكرفس"], tr:["Kereviz","Kereviz tuzu","Kereviz pul","Kereviz tohumu"], th:["คื่นฉ่าย","เกลือคื่นฉ่าย","คื่นฉ่ายแห้ง","เมล็ดคื่นฉ่าย"], el:["Σέλινο","Αλάτι σέλινου","Νιφάδες σέλινου","Σπόροι σέλινου"] },
  },
  sennep: {
    products: { da:["Sennep","Dressing","Marinade","Curry","Pickles"], en:["Mustard","Dressing","Marinade","Curry","Pickles"], de:["Senf","Dressing","Marinade","Curry","Gewürzgurken"], fr:["Moutarde","Vinaigrette","Marinade","Curry","Cornichons"], es:["Mostaza","Aderezo","Marinada","Curry","Pepinillos"], it:["Senape","Condimento","Marinata","Curry","Sottaceti"], nl:["Mosterd","Dressing","Marinade","Curry","Augurken"], pt:["Mostarda","Molho","Marinada","Caril","Pickles"], pl:["Musztarda","Dressing","Marynata","Curry","Ogórki konserwowe"], sv:["Senap","Dressing","Marinad","Curry","Pickles"], no:["Sennep","Dressing","Marinade","Karri","Pickles"], ja:["マスタード","ドレッシング","マリネ","カレー","ピクルス"], zh:["芥末","沙拉酱","腌料","咖喱","泡菜"], ar:["خردل","صلصة السلطة","تتبيلة","كاري","مخللات"], tr:["Hardal","Sos","Turşu sosu","Köri","Turşu"], th:["มัสตาร์ด","น้ำสลัด","น้ำหมัก","แกงกะหรี่","ดองผัก"], el:["Μουστάρδα","Σαλτσάκι","Μαρινάδα","Κάρυ","Πίκλες"] },
    ingredients: { da:["Sennepsfrø","Sennepsmel","Sennepsolie","Sennepspulver"], en:["Mustard seeds","Mustard flour","Mustard oil","Mustard powder"], de:["Senfkörner","Senfmehl","Senföl","Senfpulver"], fr:["Graines de moutarde","Farine de moutarde","Huile de moutarde","Poudre de moutarde"], es:["Semillas de mostaza","Harina de mostaza","Aceite de mostaza","Polvo de mostaza"], it:["Semi di senape","Farina di senape","Olio di senape","Polvere di senape"], nl:["Mosterdzaad","Mosterdmeel","Mosterdie","Mosterdpoeder"], pt:["Sementes de mostarda","Farinha de mostarda","Óleo de mostarda","Pó de mostarda"], pl:["Nasiona gorczycy","Mąka gorczycowa","Olej gorczycowy","Proszek gorczycowy"], sv:["Senapsfrön","Senapsmjöl","Senapsolja","Senapspulver"], no:["Sennepsfrø","Sennepsmel","Sennepsolje","Sennepspulver"], ja:["マスタードシード","マスタードフラワー","マスタードオイル","マスタードパウダー"], zh:["芥末籽","芥末粉","芥末油","芥末粉末"], ar:["بذور الخردل","دقيق الخردل","زيت الخردل","مسحوق الخردل"], tr:["Hardal tohumu","Hardal unu","Hardal yağı","Hardal tozu"], th:["เมล็ดมัสตาร์ด","แป้งมัสตาร์ด","น้ำมันมัสตาร์ด","ผงมัสตาร์ด"], el:["Σπόροι μουστάρδας","Αλεύρι μουστάρδας","Λάδι μουστάρδας","Σκόνη μουστάρδας"] },
  },
  sesam: {
    products: { da:["Hummus","Tahini","Bagels","Sushi","Halvah"], en:["Hummus","Tahini","Bagels","Sushi","Halvah"], de:["Hummus","Tahini","Bagels","Sushi","Halva"], fr:["Houmous","Tahiné","Bagels","Sushi","Halva"], es:["Hummus","Tahini","Bagels","Sushi","Halva"], it:["Hummus","Tahini","Bagel","Sushi","Halva"], nl:["Hummus","Tahini","Bagels","Sushi","Halva"], pt:["Hummus","Tahini","Bagels","Sushi","Halva"], pl:["Hummus","Tahini","Bagele","Sushi","Chałwa"], sv:["Hummus","Tahini","Bagels","Sushi","Halva"], no:["Hummus","Tahini","Bagels","Sushi","Halva"], ja:["フムス","タヒニ","ベーグル","寿司","ハルヴァ"], zh:["鹰嘴豆泥","芝麻酱","百吉饼","寿司","哈尔瓦"], ar:["حمص","طحينة","بيغل","سوشي","حلاوة طحينية"], tr:["Humus","Tahin","Bagel","Sushi","Helva"], th:["ฮัมมัส","ทาฮีนี","เบเกิล","ซูชิ","ฮาลวา"], el:["Χούμους","Ταχίνι","Μπέιγκελ","Σούσι","Χαλβάς"] },
    ingredients: { da:["Sesam","Sesamfrø","Tahini","Sesamolie","Sesammel"], en:["Sesame","Sesame seeds","Tahini","Sesame oil","Sesame flour"], de:["Sesam","Sesamsamen","Tahini","Sesamöl","Sesammehl"], fr:["Sésame","Graines de sésame","Tahiné","Huile de sésame","Farine de sésame"], es:["Sésamo","Semillas de sésamo","Tahini","Aceite de sésamo","Harina de sésamo"], it:["Sesamo","Semi di sesamo","Tahini","Olio di sesamo","Farina di sesamo"], nl:["Sesam","Sesamzaad","Tahini","Sesamolie","Sesambloem"], pt:["Sésamo","Sementes de sésamo","Tahini","Óleo de sésamo","Farinha de sésamo"], pl:["Sezam","Ziarna sezamu","Tahini","Olej sezamowy","Mąka sezamowa"], sv:["Sesam","Sesamfrön","Tahini","Sesamolja","Sesammjöl"], no:["Sesam","Sesamfrø","Tahini","Sesamolje","Sesammel"], ja:["ゴマ","ゴマの種","タヒニ","ゴマ油","ゴマ粉"], zh:["芝麻","芝麻籽","芝麻酱","芝麻油","芝麻粉"], ar:["سمسم","بذور السمسم","طحينة","زيت السمسم","دقيق السمسم"], tr:["Susam","Susam tohumu","Tahin","Susam yağı","Susam unu"], th:["งา","เมล็ดงา","ทาฮีนี","น้ำมันงา","แป้งงา"], el:["Σουσάμι","Σπόροι σουσαμιού","Ταχίνι","Λάδι σουσαμιού","Αλεύρι σουσαμιού"] },
  },
  svovl: {
    products: { da:["Vin","Tørrede frugter","Konserves","Eddike","Syltetøj"], en:["Wine","Dried fruits","Preserves","Vinegar","Jam"], de:["Wein","Trockenfrüchte","Konserven","Essig","Marmelade"], fr:["Vin","Fruits secs","Conserves","Vinaigre","Confiture"], es:["Vino","Frutas secas","Conservas","Vinagre","Mermelada"], it:["Vino","Frutta secca","Conserve","Aceto","Marmellata"], nl:["Wijn","Gedroogd fruit","Conserven","Azijn","Jam"], pt:["Vinho","Frutas secas","Conservas","Vinagre","Compota"], pl:["Wino","Suszone owoce","Przetwory","Ocet","Dżem"], sv:["Vin","Torkad frukt","Konserver","Vinäger","Sylt"], no:["Vin","Tørket frukt","Hermetikk","Eddik","Syltetøy"], ja:["ワイン","ドライフルーツ","保存食","酢","ジャム"], zh:["葡萄酒","干果","罐头","醋","果酱"], ar:["نبيذ","فاكهة مجففة","معلبات","خل","مربى"], tr:["Şarap","Kurutulmuş meyve","Konserveler","Sirke","Reçel"], th:["ไวน์","ผลไม้แห้ง","อาหารกระป๋อง","น้ำส้มสายชู","แยม"], el:["Κρασί","Αποξηραμένα φρούτα","Κονσέρβες","Ξύδι","Μαρμελάδα"] },
    ingredients: { da:["E220","E221","E222","Sulfitter","SO₂","Svovldioxid"], en:["E220","E221","E222","Sulphites","SO₂","Sulphur dioxide"], de:["E220","E221","E222","Sulfite","SO₂","Schwefeldioxid"], fr:["E220","E221","E222","Sulfites","SO₂","Dioxyde de soufre"], es:["E220","E221","E222","Sulfitos","SO₂","Dióxido de azufre"], it:["E220","E221","E222","Solfiti","SO₂","Anidride solforosa"], nl:["E220","E221","E222","Sulfieten","SO₂","Zwaveldioxide"], pt:["E220","E221","E222","Sulfitos","SO₂","Dióxido de enxofre"], pl:["E220","E221","E222","Siarczyny","SO₂","Dwutlenek siarki"], sv:["E220","E221","E222","Sulfiter","SO₂","Svaveldioxid"], no:["E220","E221","E222","Sulfitter","SO₂","Svoveldioksid"], ja:["E220","E221","E222","亜硫酸塩","SO₂","二酸化硫黄"], zh:["E220","E221","E222","亚硫酸盐","SO₂","二氧化硫"], ar:["E220","E221","E222","كبريتيت","SO₂","ثاني أكسيد الكبريت"], tr:["E220","E221","E222","Sülfit","SO₂","Kükürt dioksit"], th:["E220","E221","E222","ซัลไฟต์","SO₂","ซัลเฟอร์ไดออกไซด์"], el:["E220","E221","E222","Θειώδη","SO₂","Διοξείδιο του θείου"] },
  },
  lupin: {
    products: { da:["Glutenfri mel","Pasta","Brød","Snacks","Panering"], en:["Gluten-free flour","Pasta","Bread","Snacks","Breading"], de:["Glutenfreies Mehl","Pasta","Brot","Snacks","Panade"], fr:["Farine sans gluten","Pâtes","Pain","Snacks","Chapelure"], es:["Harina sin gluten","Pasta","Pan","Snacks","Rebozado"], it:["Farina senza glutine","Pasta","Pane","Snack","Panatura"], nl:["Glutenvrij meel","Pasta","Brood","Snacks","Paneermeel"], pt:["Farinha sem glúten","Massa","Pão","Snacks","Panado"], pl:["Mąka bezglutenowa","Makaron","Chleb","Przekąski","Panierka"], sv:["Glutenfritt mjöl","Pasta","Bröd","Snacks","Panering"], no:["Glutenfritt mel","Pasta","Brød","Snacks","Panering"], ja:["グルテンフリー小麦粉","パスタ","パン","スナック","パン粉"], zh:["无麸质面粉","面食","面包","零食","面包屑"], ar:["دقيق خالي من الغلوتين","معكرونة","خبز","وجبات خفيفة","فتات الخبز"], tr:["Glutensiz un","Makarna","Ekmek","Atıştırmalık","Ekmek kırıntısı"], th:["แป้งไม่มีกลูเตน","พาสต้า","ขนมปัง","ขนมขบเคี้ยว","เกล็ดขนมปัง"], el:["Αλεύρι χωρίς γλουτένη","Ζυμαρικά","Ψωμί","Σνακ","Πανάδα"] },
    ingredients: { da:["Lupinmel","Lupinfrø","Lupinprotein","Lupinfiber"], en:["Lupin flour","Lupin seeds","Lupin protein","Lupin fibre"], de:["Lupinenmehl","Lupinensamen","Lupinenprotein","Lupinenfaser"], fr:["Farine de lupin","Graines de lupin","Protéine de lupin","Fibre de lupin"], es:["Harina de altramuz","Semillas de altramuz","Proteína de altramuz","Fibra de altramuz"], it:["Farina di lupino","Semi di lupino","Proteina di lupino","Fibra di lupino"], nl:["Lupinebloem","Lupinezaad","Lupineprotein","Lupinevezel"], pt:["Farinha de tremoço","Sementes de tremoço","Proteína de tremoço","Fibra de tremoço"], pl:["Mąka łubinowa","Nasiona łubinu","Białko łubinu","Błonnik łubinu"], sv:["Lupinmjöl","Lupinfrön","Lupinprotein","Lupinfibrer"], no:["Lupinmel","Lupinfrø","Lupinprotein","Lupinfiber"], ja:["ルピナス粉","ルピナス種子","ルピナスタンパク","ルピナス繊維"], zh:["羽扇豆粉","羽扇豆种子","羽扇豆蛋白","羽扇豆纤维"], ar:["دقيق الترمس","بذور الترمس","بروتين الترمس","ألياف الترمس"], tr:["Lupin unu","Lupin tohumu","Lupin proteini","Lupin lifi"], th:["แป้งลูพิน","เมล็ดลูพิน","โปรตีนลูพิน","ไฟเบอร์ลูพิน"], el:["Αλεύρι λούπινων","Σπόροι λούπινων","Πρωτεΐνη λούπινων","Ίνες λούπινων"] },
  },
  bloeddyr: {
    products: { da:["Paella","Pasta frutti di mare","Sushi","Risotto"], en:["Paella","Seafood pasta","Sushi","Risotto"], de:["Paella","Meeresfrüchtepasta","Sushi","Risotto"], fr:["Paella","Pâtes aux fruits de mer","Sushi","Risotto"], es:["Paella","Pasta con mariscos","Sushi","Risotto"], it:["Paella","Pasta ai frutti di mare","Sushi","Risotto"], nl:["Paella","Zeevruchtenpasta","Sushi","Risotto"], pt:["Paella","Massa com mariscos","Sushi","Risoto"], pl:["Paella","Makaron z owocami morza","Sushi","Risotto"], sv:["Paella","Skaldjurspasta","Sushi","Risotto"], no:["Paella","Sjømatpasta","Sushi","Risotto"], ja:["パエリア","シーフードパスタ","寿司","リゾット"], zh:["海鲜饭","海鲜面食","寿司","意大利烩饭"], ar:["باييلا","معكرونة بحرية","سوشي","ريزوتو"], tr:["Paella","Deniz ürünleri makarnası","Sushi","Risotto"], th:["ปาเอย่า","พาสต้าซีฟู้ด","ซูชิ","ริซอตโต้"], el:["Παέλα","Ζυμαρικά θαλασσινών","Σούσι","Ριζότο"] },
    ingredients: { da:["Blæksprutte","Østers","Muslinger","Snegle","Kammusling"], en:["Squid","Oysters","Mussels","Snails","Scallops"], de:["Tintenfisch","Austern","Muscheln","Schnecken","Jakobsmuscheln"], fr:["Calamar","Huîtres","Moules","Escargots","Coquilles Saint-Jacques"], es:["Calamar","Ostras","Mejillones","Caracoles","Vieiras"], it:["Calamaro","Ostriche","Cozze","Lumache","Capesante"], nl:["Inktvis","Oesters","Mosselen","Slakken","Sint-jakobsschelpen"], pt:["Lula","Ostras","Mexilhões","Caracóis","Vieiras"], pl:["Kałamarnica","Ostrygi","Małże","Ślimaki","Przegrzebki"], sv:["Bläckfisk","Ostron","Musslor","Sniglar","Pilgrimsmusslor"], no:["Blekksprut","Østers","Muslinger","Snegler","Kamskjell"], ja:["イカ","カキ","ムール貝","カタツムリ","ホタテ"], zh:["鱿鱼","牡蛎","贻贝","蜗牛","扇贝"], ar:["حبار","محار","بلح البحر","حلزون","إسقلوب"], tr:["Kalamar","İstiridye","Midye","Salyangoz","Deniz tarağı"], th:["ปลาหมึก","หอยนางรม","หอยแมลงภู่","หอยทาก","หอยเชลล์"], el:["Καλαμάρι","Στρείδια","Μύδια","Σαλιγκάρια","Χτένια"] },
  },
};

// Kostpræference-navne pr. sprog — til Madpas (26. sept. 2026, Madpas-
// redesign: "Når brugeren vælger et andet sprog, skal hele madpasset
// oversættes, inklusive navnene på ... diæter". DIETS.label ovenfor er kun
// dansk; dansk selv læses direkte derfra (samme mønster som ALLERGEN_T,
// der heller ikke har en separat "da"-nøgle), resten af sprogene her.
export const DIET_T = {
  vegan:        { en:"Vegan", de:"Vegan", fr:"Végane", es:"Vegano", it:"Vegano", nl:"Veganistisch", pt:"Vegano", pl:"Wegański", sv:"Vegansk", no:"Vegansk", ja:"ヴィーガン", zh:"纯素", ar:"نباتي صرف", tr:"Vegan", th:"วีแกน", el:"Βίγκαν" },
  vegetarian:   { en:"Vegetarian", de:"Vegetarisch", fr:"Végétarien", es:"Vegetariano", it:"Vegetariano", nl:"Vegetarisch", pt:"Vegetariano", pl:"Wegetariański", sv:"Vegetarisk", no:"Vegetarisk", ja:"ベジタリアン", zh:"素食", ar:"نباتي", tr:"Vejetaryen", th:"มังสวิรัติ", el:"Χορτοφάγος" },
  pescetarian:  { en:"Pescatarian", de:"Pescetarisch", fr:"Pescétarien", es:"Pescetariano", it:"Pescetariano", nl:"Pescotarisch", pt:"Pescetariano", pl:"Pescetariański", sv:"Pescetarian", no:"Pescetarianer", ja:"ペスカタリアン", zh:"鱼素者", ar:"نباتي يأكل السمك", tr:"Pesketaryen", th:"กินมังสวิรัติแบบทานปลาได้", el:"Πεσκεταριανός" },
  "gluten-free":{ en:"Gluten-free", de:"Glutenfrei", fr:"Sans gluten", es:"Sin gluten", it:"Senza glutine", nl:"Glutenvrij", pt:"Sem glúten", pl:"Bezglutenowy", sv:"Glutenfri", no:"Glutenfri", ja:"グルテンフリー", zh:"无麸质", ar:"خالٍ من الغلوتين", tr:"Glutensiz", th:"ปราศจากกลูเตน", el:"Χωρίς γλουτένη" },
  keto:         { en:"Keto", de:"Keto", fr:"Kéto", es:"Keto", it:"Cheto", nl:"Keto", pt:"Keto", pl:"Keto", sv:"Keto", no:"Keto", ja:"ケト", zh:"生酮", ar:"كيتو", tr:"Keto", th:"คีโต", el:"Κέτο" },
};

// Sektionsoverskrifter til Madpas' strukturerede tjener-visning (26. sept.
// 2026) — grupperer efter type (allergi/intolerance/kost) i stedet for én
// generisk "kan ikke spise"-liste, se CLAUDE.md. E-numre er bevidst IKKE
// en sektion her længere (26. sept. 2026, opfølgende polish-runde: en
// tjener har ikke brug for at se E-nummer-koder, og QR/link-delingen der
// tidligere gjorde E-numre relevante at vise separat er fjernet helt).
export const MADPAS_SECTIONS_T = {
  allergies:    { da:"Fødevareallergier", en:"Food allergies", de:"Lebensmittelallergien", fr:"Allergies alimentaires", es:"Alergias alimentarias", it:"Allergie alimentari", nl:"Voedselallergieën", pt:"Alergias alimentares", pl:"Alergie pokarmowe", sv:"Matallergier", no:"Matallergier", ja:"食物アレルギー", zh:"食物过敏", ar:"حساسية الطعام", tr:"Gıda alerjileri", th:"การแพ้อาหาร", el:"Τροφικές αλλεργίες" },
  intolerances: { da:"Intolerancer",       en:"Intolerances", de:"Unverträglichkeiten", fr:"Intolérances", es:"Intolerancias", it:"Intolleranze", nl:"Intoleranties", pt:"Intolerâncias", pl:"Nietolerancje", sv:"Intoleranser", no:"Intoleranser", ja:"不耐症", zh:"不耐受", ar:"عدم التحمل", tr:"İntoleranslar", th:"การแพ้/ไม่ทนอาหาร", el:"Δυσανεξίες" },
  // "Dietary requirements" i stedet for blot "Diet" (27. sept. 2026,
  // Madpas-finpolish, krav 3) — mere præcist for personalet, som ellers
  // kan læse "Diet" som en slankekur i stedet for et fødevarehensyn.
  diet:         { da:"Kosthensyn", en:"Dietary requirements", de:"Ernährungsanforderungen", fr:"Exigences alimentaires", es:"Requisitos dietéticos", it:"Requisiti dietetici", nl:"Dieetvereisten", pt:"Requisitos alimentares", pl:"Wymagania żywieniowe", sv:"Kostkrav", no:"Kostkrav", ja:"食事の要件", zh:"饮食要求", ar:"المتطلبات الغذائية", tr:"Beslenme gereksinimleri", th:"ข้อกำหนดด้านอาหาร", el:"Διατροφικές απαιτήσεις" },
};

// Kort, tydelig besked til personalet PR. DIÆT (27. sept. 2026, Madpas-
// finpolish, krav 1-2) — diæter må ikke kun vises som badges, de skal have
// samme type "kan/kan ikke spise"-besked som allergier. Naturligt
// oversat (ikke ord-for-ord), IKKE en sikkerheds-sætning i samme forstand
// som allergener (fx keto er en præference, ikke en risiko), så ordlyden
// er bevidst blødere for keto ("limit"/"begræns") end for de øvrige
// ("does not contain"/"indeholder ikke").
export const MADPAS_DIET_MESSAGE_T = {
  vegan: {
    da:"Jeg spiser vegansk. Sørg venligst for, at min mad ikke indeholder kød, fisk, mejeriprodukter, æg eller andre animalske ingredienser.",
    en:"I follow a vegan diet. Please make sure my food does not contain meat, fish, dairy, eggs or other animal-derived ingredients.",
    de:"Ich ernähre mich vegan. Bitte stellen Sie sicher, dass mein Essen kein Fleisch, keinen Fisch, keine Milchprodukte, keine Eier oder andere tierische Zutaten enthält.",
    fr:"Je suis végane. Veuillez vous assurer que mon repas ne contient ni viande, ni poisson, ni produits laitiers, ni œufs, ni aucun autre ingrédient d'origine animale.",
    es:"Sigo una dieta vegana. Por favor, asegúrese de que mi comida no contenga carne, pescado, lácteos, huevos ni ningún otro ingrediente de origen animal.",
    it:"Seguo una dieta vegana. Assicuratevi che il mio pasto non contenga carne, pesce, latticini, uova o altri ingredienti di origine animale.",
    nl:"Ik eet veganistisch. Zorg ervoor dat mijn maaltijd geen vlees, vis, zuivel, eieren of andere dierlijke ingrediënten bevat.",
    pt:"Sigo uma dieta vegana. Por favor, certifique-se de que a minha refeição não contém carne, peixe, laticínios, ovos ou outros ingredientes de origem animal.",
    pl:"Stosuję dietę wegańską. Proszę dopilnować, aby moje jedzenie nie zawierało mięsa, ryb, nabiału, jaj ani innych składników pochodzenia zwierzęcego.",
    sv:"Jag äter veganskt. Se till att min måltid inte innehåller kött, fisk, mejeriprodukter, ägg eller andra animaliska ingredienser.",
    no:"Jeg spiser vegansk. Sørg for at maten min ikke inneholder kjøtt, fisk, meieriprodukter, egg eller andre animalske ingredienser.",
    ja:"私はヴィーガンです。肉、魚、乳製品、卵、その他の動物由来の原材料が含まれていない料理をお願いします。",
    zh:"我遵循纯素饮食。请确保我的食物不含肉类、鱼类、乳制品、鸡蛋或其他动物源成分。",
    ar:"أتبع نظاماً نباتياً صرفاً. يرجى التأكد من أن طعامي لا يحتوي على اللحوم أو الأسماك أو منتجات الألبان أو البيض أو أي مكونات أخرى مشتقة من الحيوانات.",
    tr:"Vegan besleniyorum. Lütfen yemeğimde et, balık, süt ürünleri, yumurta veya başka hayvansal kaynaklı malzemeler bulunmadığından emin olun.",
    th:"ฉันกินอาหารวีแกน กรุณาตรวจสอบให้แน่ใจว่าอาหารของฉันไม่มีเนื้อสัตว์ ปลา ผลิตภัณฑ์นม ไข่ หรือส่วนผสมอื่นที่มาจากสัตว์",
    el:"Ακολουθώ vegan διατροφή. Παρακαλώ φροντίστε το φαγητό μου να μην περιέχει κρέας, ψάρι, γαλακτοκομικά, αυγά ή άλλα συστατικά ζωικής προέλευσης.",
  },
  vegetarian: {
    da:"Jeg spiser vegetarisk. Sørg venligst for, at min mad ikke indeholder kød eller fisk.",
    en:"I follow a vegetarian diet. Please make sure my food does not contain meat or fish.",
    de:"Ich ernähre mich vegetarisch. Bitte stellen Sie sicher, dass mein Essen kein Fleisch und keinen Fisch enthält.",
    fr:"Je suis végétarien(ne). Veuillez vous assurer que mon repas ne contient ni viande ni poisson.",
    es:"Sigo una dieta vegetariana. Por favor, asegúrese de que mi comida no contenga carne ni pescado.",
    it:"Seguo una dieta vegetariana. Assicuratevi che il mio pasto non contenga carne né pesce.",
    nl:"Ik eet vegetarisch. Zorg ervoor dat mijn maaltijd geen vlees of vis bevat.",
    pt:"Sigo uma dieta vegetariana. Por favor, certifique-se de que a minha refeição não contém carne nem peixe.",
    pl:"Stosuję dietę wegetariańską. Proszę dopilnować, aby moje jedzenie nie zawierało mięsa ani ryb.",
    sv:"Jag äter vegetariskt. Se till att min måltid inte innehåller kött eller fisk.",
    no:"Jeg spiser vegetarisk. Sørg for at maten min ikke inneholder kjøtt eller fisk.",
    ja:"私はベジタリアンです。肉や魚が含まれていない料理をお願いします。",
    zh:"我遵循素食饮食。请确保我的食物不含肉类或鱼类。",
    ar:"أتبع نظاماً نباتياً. يرجى التأكد من أن طعامي لا يحتوي على اللحوم أو الأسماك.",
    tr:"Vejetaryen besleniyorum. Lütfen yemeğimde et veya balık bulunmadığından emin olun.",
    th:"ฉันกินมังสวิรัติ กรุณาตรวจสอบให้แน่ใจว่าอาหารของฉันไม่มีเนื้อสัตว์หรือปลา",
    el:"Ακολουθώ χορτοφαγική διατροφή. Παρακαλώ φροντίστε το φαγητό μου να μην περιέχει κρέας ή ψάρι.",
  },
  pescetarian: {
    da:"Jeg spiser pescetarisk. Sørg venligst for, at min mad ikke indeholder kød — fisk og skaldyr er okay.",
    en:"I follow a pescetarian diet. Please make sure my food does not contain meat — fish and seafood are fine.",
    de:"Ich ernähre mich pescetarisch. Bitte stellen Sie sicher, dass mein Essen kein Fleisch enthält — Fisch und Meeresfrüchte sind in Ordnung.",
    fr:"Je suis pescétarien(ne). Veuillez vous assurer que mon repas ne contient pas de viande — le poisson et les fruits de mer conviennent.",
    es:"Sigo una dieta pescetariana. Por favor, asegúrese de que mi comida no contenga carne — el pescado y el marisco están bien.",
    it:"Seguo una dieta pescetariana. Assicuratevi che il mio pasto non contenga carne — pesce e frutti di mare vanno bene.",
    nl:"Ik eet pescotarisch. Zorg ervoor dat mijn maaltijd geen vlees bevat — vis en zeevruchten zijn prima.",
    pt:"Sigo uma dieta pescetariana. Por favor, certifique-se de que a minha refeição não contém carne — peixe e marisco não são problema.",
    pl:"Stosuję dietę pescowegetariańską. Proszę dopilnować, aby moje jedzenie nie zawierało mięsa — ryby i owoce morza są w porządku.",
    sv:"Jag äter pescetariskt. Se till att min måltid inte innehåller kött — fisk och skaldjur är okej.",
    no:"Jeg spiser pescetarisk. Sørg for at maten min ikke inneholder kjøtt — fisk og sjømat er greit.",
    ja:"私はペスクタリアンです。肉が含まれていない料理をお願いします（魚介類は問題ありません）。",
    zh:"我遵循鱼素饮食。请确保我的食物不含肉类——鱼类和海鲜没问题。",
    ar:"أتبع نظاماً غذائياً يعتمد على الأسماك. يرجى التأكد من أن طعامي لا يحتوي على اللحوم — الأسماك والمأكولات البحرية مقبولة.",
    tr:"Pesketaryen besleniyorum. Lütfen yemeğimde et bulunmadığından emin olun — balık ve deniz ürünleri sorun değil.",
    th:"ฉันกินอาหารเพสคาทาเรียน กรุณาตรวจสอบให้แน่ใจว่าอาหารของฉันไม่มีเนื้อสัตว์ — ปลาและอาหารทะเลรับประทานได้",
    el:"Ακολουθώ πεσκετεριανή διατροφή. Παρακαλώ φροντίστε το φαγητό μου να μην περιέχει κρέας — τα ψάρια και τα θαλασσινά είναι εντάξει.",
  },
  "gluten-free": {
    da:"Jeg spiser glutenfrit. Sørg venligst for, at min mad ikke indeholder hvede, rug, byg eller andre glutenkilder.",
    en:"I follow a gluten-free diet. Please make sure my food does not contain wheat, rye, barley or other sources of gluten.",
    de:"Ich ernähre mich glutenfrei. Bitte stellen Sie sicher, dass mein Essen keinen Weizen, Roggen, Gerste oder andere glutenhaltige Zutaten enthält.",
    fr:"Je suis un régime sans gluten. Veuillez vous assurer que mon repas ne contient ni blé, ni seigle, ni orge, ni aucune autre source de gluten.",
    es:"Sigo una dieta sin gluten. Por favor, asegúrese de que mi comida no contenga trigo, centeno, cebada ni ninguna otra fuente de gluten.",
    it:"Seguo una dieta senza glutine. Assicuratevi che il mio pasto non contenga frumento, segale, orzo o altre fonti di glutine.",
    nl:"Ik eet glutenvrij. Zorg ervoor dat mijn maaltijd geen tarwe, rogge, gerst of andere glutenbronnen bevat.",
    pt:"Sigo uma dieta sem glúten. Por favor, certifique-se de que a minha refeição não contém trigo, centeio, cevada ou outras fontes de glúten.",
    pl:"Stosuję dietę bezglutenową. Proszę dopilnować, aby moje jedzenie nie zawierało pszenicy, żyta, jęczmienia ani innych źródeł glutenu.",
    sv:"Jag äter glutenfritt. Se till att min måltid inte innehåller vete, råg, korn eller andra glutenkällor.",
    no:"Jeg spiser glutenfritt. Sørg for at maten min ikke inneholder hvete, rug, bygg eller andre glutenkilder.",
    ja:"私はグルテンフリーの食事をしています。小麦、ライ麦、大麦、その他グルテンを含む原材料が入っていない料理をお願いします。",
    zh:"我遵循无麸质饮食。请确保我的食物不含小麦、黑麦、大麦或其他麸质来源。",
    ar:"أتبع نظاماً خالياً من الغلوتين. يرجى التأكد من أن طعامي لا يحتوي على القمح أو الجاودار أو الشعير أو أي مصدر آخر للغلوتين.",
    tr:"Glutensiz besleniyorum. Lütfen yemeğimde buğday, çavdar, arpa veya başka gluten kaynakları bulunmadığından emin olun.",
    th:"ฉันกินอาหารปลอดกลูเตน กรุณาตรวจสอบให้แน่ใจว่าอาหารของฉันไม่มีข้าวสาลี ข้าวไรย์ ข้าวบาร์เลย์ หรือแหล่งกลูเตนอื่นๆ",
    el:"Ακολουθώ διατροφή χωρίς γλουτένη. Παρακαλώ φροντίστε το φαγητό μου να μην περιέχει σιτάρι, σίκαλη, κριθάρι ή άλλες πηγές γλουτένης.",
  },
  keto: {
    da:"Jeg spiser lavkulhydrat (keto). Begræns venligst kulhydratrige ingredienser som sukker, brød, pasta og ris i min mad.",
    en:"I follow a low-carb (keto) diet. Please limit high-carbohydrate ingredients such as sugar, bread, pasta and rice in my food.",
    de:"Ich ernähre mich kohlenhydratarm (Keto). Bitte begrenzen Sie kohlenhydratreiche Zutaten wie Zucker, Brot, Nudeln und Reis in meinem Essen.",
    fr:"Je suis un régime pauvre en glucides (cétogène). Veuillez limiter les ingrédients riches en glucides comme le sucre, le pain, les pâtes et le riz dans mon repas.",
    es:"Sigo una dieta baja en carbohidratos (keto). Por favor, limite los ingredientes ricos en carbohidratos como azúcar, pan, pasta y arroz en mi comida.",
    it:"Seguo una dieta a basso contenuto di carboidrati (cheto). Vi prego di limitare ingredienti ricchi di carboidrati come zucchero, pane, pasta e riso nel mio pasto.",
    nl:"Ik eet koolhydraatarm (keto). Beperk alstublieft koolhydraatrijke ingrediënten zoals suiker, brood, pasta en rijst in mijn maaltijd.",
    pt:"Sigo uma dieta baixa em hidratos de carbono (keto). Por favor, limite ingredientes ricos em hidratos de carbono como açúcar, pão, massa e arroz na minha refeição.",
    pl:"Stosuję dietę niskowęglowodanową (keto). Proszę ograniczyć składniki bogate w węglowodany, takie jak cukier, chleb, makaron i ryż, w moim posiłku.",
    sv:"Jag äter lågkolhydratkost (keto). Begränsa gärna kolhydratrika ingredienser som socker, bröd, pasta och ris i min måltid.",
    no:"Jeg spiser lavkarbo (keto). Vennligst begrens karbohydratrike ingredienser som sukker, brød, pasta og ris i maten min.",
    ja:"私は低炭水化物（ケトジェニック）食を実践しています。砂糖、パン、パスタ、米などの炭水化物の多い食材はできるだけ控えてください。",
    zh:"我遵循低碳水化合物（生酮）饮食。请尽量减少我食物中的糖、面包、面食和米饭等高碳水化合物成分。",
    ar:"أتبع نظاماً غذائياً منخفض الكربوهيدرات (كيتو). يرجى تقليل المكونات الغنية بالكربوهيدرات مثل السكر والخبز والمعكرونة والأرز في طعامي.",
    tr:"Düşük karbonhidratlı (keto) besleniyorum. Lütfen yemeğimde şeker, ekmek, makarna ve pirinç gibi yüksek karbonhidratlı malzemeleri sınırlandırın.",
    th:"ฉันกินอาหารคาร์บต่ำ (คีโต) กรุณาจำกัดส่วนผสมที่มีคาร์โบไฮเดรตสูง เช่น น้ำตาล ขนมปัง พาสต้า และข้าว ในอาหารของฉัน",
    el:"Ακολουθώ διατροφή χαμηλή σε υδατάνθρακες (κέτο). Παρακαλώ περιορίστε συστατικά πλούσια σε υδατάνθρακες όπως ζάχαρη, ψωμί, ζυμαρικά και ρύζι στο φαγητό μου.",
  },
};

// Sikkerheds-sætning under hvert enkelt allergen-/fritekst-emne i
// FØDEVAREALLERGIER (IKKE intolerancer/kost) — genereres nu ALTID pr.
// enkelt hensyn, ikke som én kombineret sætning for flere (27. sept.
// 2026, Madpas-finpolish, krav 4: "Ændr ... til en mere præcis
// formulering" + "genereres dynamisk for den konkrete allergi"), fordi
// hvert hensyn nu vises som sin egen tydelige informationsblok (krav 6).
// {name} kan forekomme flere gange i skabelonen — se madpasSafetyNote()
// i useMadpas.js, som erstatter ALLE forekomster, ikke kun den første.
export const MADPAS_SAFETY_NOTE_T = {
  da:"Sørg venligst for, at min mad ikke indeholder {name} eller ingredienser fremstillet af {name}.",
  en:"Please make sure my food does not contain {name} or any ingredients made from {name}.",
  de:"Bitte stellen Sie sicher, dass mein Essen Folgendes nicht enthält: {name}, oder Zutaten, die daraus hergestellt wurden.",
  fr:"Veuillez vous assurer que mon repas ne contient pas ce qui suit : {name}, ni aucun ingrédient qui en est dérivé.",
  es:"Por favor, asegúrese de que mi comida no contenga lo siguiente: {name}, ni ingredientes derivados de ello.",
  it:"Assicuratevi che il mio pasto non contenga quanto segue: {name}, né ingredienti derivati da esso.",
  nl:"Zorg ervoor dat mijn maaltijd geen {name} bevat, en ook geen ingrediënten die daarvan gemaakt zijn.",
  pt:"Por favor, certifique-se de que a minha refeição não contém o seguinte: {name}, nem ingredientes derivados dele.",
  pl:"Proszę dopilnować, aby moje jedzenie nie zawierało następującego składnika: {name}, ani produktów z niego wytworzonych.",
  sv:"Se till att min måltid inte innehåller {name} eller ingredienser gjorda av {name}.",
  no:"Sørg for at måltidet mitt ikke inneholder {name} eller ingredienser laget av {name}.",
  ja:"私の食事に{name}、または{name}由来の原材料が含まれていないことを確認してください。",
  zh:"请确保我的食物不含{name}，也不含由{name}制成的成分。",
  ar:"يرجى التأكد من أن طعامي لا يحتوي على: {name}، أو أي مكونات مصنوعة منه.",
  tr:"Lütfen yemeğimde {name} veya {name} içeren malzemeler bulunmadığından emin olun.",
  th:"กรุณาตรวจสอบให้แน่ใจว่าอาหารของฉันไม่มี {name} หรือส่วนผสมที่ทำจาก {name}",
  el:"Παρακαλώ φροντίστε το φαγητό μου να μην περιέχει το ακόλουθο: {name}, ή οποιοδήποτε συστατικό που παράγεται από αυτό.",
};

// Oplæsningens hilsen, "kan ikke spise" og afslutning (flyttet fra useMadpas.js 6. okt. 2026,
// F5-1/F5-14), så de er med i sprogtjekket. Alle 17 sprog skal være her (test i useMadpas.test.js);
// før manglede thai, så en thai-stemme læste engelsk op.
export const MADPAS_SPEECH_INTRO_T = {
  da:"Hej! Jeg har nogle fødevareallergier og ønsker gerne din hjælp til at finde noget, jeg kan spise trygt.",
  en:"Hi! I have some food allergies and would love your help finding something safe for me to eat.",
  de:"Hallo! Ich habe einige Lebensmittelallergien und würde mich über Ihre Hilfe freuen.",
  fr:"Bonjour ! J'ai des allergies alimentaires et j'aurais besoin de votre aide.",
  es:"¡Hola! Tengo algunas alergias alimentarias y agradecería su ayuda.",
  it:"Ciao! Ho alcune allergie alimentari e apprezzerei il suo aiuto.",
  nl:"Hallo! Ik heb wat voedselallergieën en zou graag uw hulp willen.",
  pt:"Olá! Tenho algumas alergias alimentares e gostaria da sua ajuda.",
  pl:"Cześć! Mam kilka alergii pokarmowych i chciałbym prosić o pomoc.",
  sv:"Hej! Jag har några matallergier och skulle uppskatta din hjälp.",
  no:"Hei! Jeg har noen matallergier og ønsker gjerne din hjelp.",
  ja:"こんにちは！食物アレルギーがあります。安全な食事を見つけるお手伝いをお願いできますか。",
  zh:"您好！我有食物过敏，希望您能帮助我找到安全的食物。",
  ar:"مرحباً! لدي بعض الحساسية الغذائية وأود مساعدتك في إيجاد شيء آمن لي.",
  tr:"Merhaba! Gıda alerjilerim var ve güvenli bir şey bulmam için yardımınıza ihtiyacım var.",
  th:"สวัสดี! ฉันแพ้อาหารบางอย่าง และอยากขอให้ช่วยหาอาหารที่ฉันกินได้อย่างปลอดภัย",
  el:"Γεια σας! Έχω κάποιες αλλεργίες τροφίμων και θα εκτιμούσα τη βοήθειά σας.",
};
export const MADPAS_SPEECH_CANNOT_T = {
  da:"Jeg kan ikke spise", en:"I cannot eat", de:"Ich kann nicht essen",
  fr:"Je ne peux pas manger", es:"No puedo comer", it:"Non posso mangiare",
  nl:"Ik kan niet eten", pt:"Não posso comer", pl:"Nie mogę jeść",
  sv:"Jag kan inte äta", no:"Jeg kan ikke spise", ja:"食べられません",
  zh:"我不能吃", ar:"لا أستطيع تناول", tr:"Yiyemiyorum", th:"ฉันกินสิ่งเหล่านี้ไม่ได้", el:"Δεν μπορώ να φάω",
};
export const MADPAS_SPEECH_OUTRO_T = {
  da:"Tak for din hjælp — det betyder rigtig meget for mig.",
  en:"Thank you so much for your help — it means a lot to me.",
  de:"Vielen Dank für Ihre Hilfe — das bedeutet mir sehr viel.",
  fr:"Merci beaucoup pour votre aide — cela compte beaucoup pour moi.",
  es:"Muchas gracias por su ayuda — significa mucho para mí.",
  it:"Grazie mille per il suo aiuto — significa molto per me.",
  nl:"Heel erg bedankt voor uw hulp — dat betekent veel voor mij.",
  pt:"Muito obrigado pela sua ajuda — significa muito para mim.",
  pl:"Bardzo dziękuję za pomoc — wiele dla mnie znaczy.",
  sv:"Tack så mycket för din hjälp — det betyder mycket för mig.",
  no:"Tusen takk for hjelpen — det betyr mye for meg.",
  ja:"ご協力ありがとうございます。本当に助かります。",
  zh:"非常感谢您的帮助，对我来说意义重大。",
  ar:"شكراً جزيلاً على مساعدتك — هذا يعني لي الكثير.",
  tr:"Yardımınız için çok teşekkür ederim — bu benim için çok şey ifade ediyor.",
  th:"ขอบคุณมากสำหรับความช่วยเหลือ มีความหมายกับฉันมาก",
  el:"Σας ευχαριστώ πολύ για τη βοήθειά σας — σημαίνει πολλά για μένα.",
};

// Madpas-specifikke eksempler (1. okt. 2026): mælk viser ikke "Mælk" som
// eksempel på sig selv, men "Fløde · Smør · Ost · Valle · Mælkepulver".
// Går forud for ALLERGEN_EXAMPLES i madpasAllergenExamples().
export const MADPAS_EXAMPLES_OVERRIDE = {
  maelkeallergi: {
    da:["Fløde","Smør","Ost","Valle","Mælkepulver"], en:["Cream","Butter","Cheese","Whey","Milk powder"],
    de:["Sahne","Butter","Käse","Molke","Milchpulver"], fr:["Crème","Beurre","Fromage","Lactosérum","Lait en poudre"],
    es:["Nata","Mantequilla","Queso","Suero","Leche en polvo"], it:["Panna","Burro","Formaggio","Siero","Latte in polvere"],
    nl:["Room","Boter","Kaas","Wei","Melkpoeder"], pt:["Natas","Manteiga","Queijo","Soro","Leite em pó"],
    pl:["Śmietana","Masło","Ser","Serwatka","Mleko w proszku"], sv:["Grädde","Smör","Ost","Vassle","Mjölkpulver"],
    no:["Fløte","Smør","Ost","Myse","Melkepulver"], ja:["クリーム","バター","チーズ","乳清","粉乳"],
    zh:["奶油","黄油","奶酪","乳清","奶粉"], ar:["كريمة","زبدة","جبن","مصل اللبن","حليب مجفف"],
    tr:["Krema","Tereyağı","Peynir","Peynir altı suyu","Süt tozu"], th:["ครีม","เนย","ชีส","เวย์","นมผง"],
    el:["Κρέμα γάλακτος","Βούτυρο","Τυρί","Ορός γάλακτος","Γάλα σε σκόνη"],
  },
};

// Direkte første sætning pr. fødevareallergi i Madpas (1. okt. 2026, Bjørn:
// "I have a food allergy to milk."), før sikkerhedssætningen ovenfor.
export const MADPAS_ALLERGY_STATEMENT_T = {
  da:"Jeg har fødevareallergi over for {name}.",
  en:"I have a food allergy to {name}.",
  de:"Ich habe eine Lebensmittelallergie gegen {name}.",
  fr:"J'ai une allergie alimentaire : {name}.",
  es:"Tengo una alergia alimentaria: {name}.",
  it:"Ho un'allergia alimentare: {name}.",
  nl:"Ik heb een voedselallergie voor {name}.",
  pt:"Tenho uma alergia alimentar: {name}.",
  pl:"Mam alergię pokarmową: {name}.",
  sv:"Jag har matallergi mot {name}.",
  no:"Jeg har matallergi mot {name}.",
  ja:"私は{name}の食物アレルギーがあります。",
  zh:"我对{name}有食物过敏。",
  ar:"لدي حساسية غذائية من: {name}.",
  tr:"Gıda alerjim var: {name}.",
  th:"ฉันแพ้อาหาร: {name}",
  el:"Έχω τροφική αλλεργία: {name}.",
};
// Cøliaki i Madpas (2. okt. 2026): sygdom, ikke allergi, så egne tekster i stedet for
// {name}-skabelonerne ovenfor. n = navn, statement = første sætning, safety = strengt
// glutenfrit, også spor (gælder uanset krydskontaminerings-toggle). Gennemlæses af Bjørn.
export const MADPAS_COELIAC_T = {
  da:{ n:"Cøliaki", statement:"Jeg har cøliaki.", safety:"Min mad skal være strengt glutenfri. Selv spor af gluten, fx fra delt køkkenudstyr eller flader, kan gøre mig syg." },
  en:{ n:"Coeliac disease", statement:"I have coeliac disease.", safety:"My food must be strictly gluten-free. Even traces of gluten, for example from shared utensils or surfaces, can make me ill." },
  de:{ n:"Zöliakie", statement:"Ich habe Zöliakie.", safety:"Mein Essen muss streng glutenfrei sein. Schon Spuren von Gluten, z. B. von gemeinsam genutzten Utensilien oder Oberflächen, können mich krank machen." },
  fr:{ n:"Maladie cœliaque", statement:"J'ai la maladie cœliaque.", safety:"Mon repas doit être strictement sans gluten. Même des traces de gluten, par exemple via des ustensiles ou des surfaces partagés, peuvent me rendre malade." },
  es:{ n:"Celiaquía", statement:"Tengo celiaquía.", safety:"Mi comida debe ser estrictamente sin gluten. Incluso las trazas de gluten, por ejemplo de utensilios o superficies compartidos, pueden enfermarme." },
  it:{ n:"Celiachia", statement:"Ho la celiachia.", safety:"Il mio cibo deve essere rigorosamente senza glutine. Anche tracce di glutine, ad esempio da utensili o superfici condivisi, possono farmi stare male." },
  nl:{ n:"Coeliakie", statement:"Ik heb coeliakie.", safety:"Mijn eten moet strikt glutenvrij zijn. Zelfs sporen van gluten, bijvoorbeeld van gedeeld keukengerei of werkbladen, kunnen mij ziek maken." },
  pt:{ n:"Doença celíaca", statement:"Tenho doença celíaca.", safety:"A minha comida tem de ser estritamente sem glúten. Até vestígios de glúten, por exemplo de utensílios ou superfícies partilhados, podem deixar-me doente." },
  pl:{ n:"Celiakia", statement:"Mam celiakię.", safety:"Moje jedzenie musi być ściśle bezglutenowe. Nawet śladowe ilości glutenu, np. ze wspólnych przyborów lub powierzchni, mogą mnie rozchorować." },
  sv:{ n:"Celiaki", statement:"Jag har celiaki.", safety:"Min mat måste vara strikt glutenfri. Även spår av gluten, till exempel från delade redskap eller ytor, kan göra mig sjuk." },
  no:{ n:"Cøliaki", statement:"Jeg har cøliaki.", safety:"Maten min må være strengt glutenfri. Selv spor av gluten, for eksempel fra delt kjøkkenutstyr eller flater, kan gjøre meg syk." },
  ja:{ n:"セリアック病", statement:"私はセリアック病です。", safety:"食事は厳密にグルテンフリーでなければなりません。共用の調理器具や調理台などからのごく微量のグルテンでも、体調を崩します。" },
  zh:{ n:"乳糜泻", statement:"我患有乳糜泻。", safety:"我的食物必须严格无麸质。即使是来自共用器具或台面的微量麸质，也会让我生病。" },
  ar:{ n:"داء السيلياك", statement:"أعاني من داء السيلياك.", safety:"يجب أن يكون طعامي خالياً تماماً من الغلوتين. حتى آثار الغلوتين، مثلاً من أدوات أو أسطح مشتركة، قد تسبب لي المرض." },
  tr:{ n:"Çölyak hastalığı", statement:"Çölyak hastasıyım.", safety:"Yemeğim kesinlikle glutensiz olmalı. Ortak mutfak gereçlerinden veya yüzeylerden bulaşan eser miktarda gluten bile beni hasta edebilir." },
  th:{ n:"โรคซีลิแอค", statement:"ฉันเป็นโรคซีลิแอค", safety:"อาหารของฉันต้องปราศจากกลูเตนอย่างเคร่งครัด แม้เพียงร่องรอยของกลูเตน เช่น จากอุปกรณ์หรือพื้นผิวที่ใช้ร่วมกัน ก็ทำให้ฉันป่วยได้" },
  el:{ n:"Κοιλιοκάκη", statement:"Έχω κοιλιοκάκη.", safety:"Το φαγητό μου πρέπει να είναι αυστηρά χωρίς γλουτένη. Ακόμη και ίχνη γλουτένης, π.χ. από κοινά σκεύη ή επιφάνειες, μπορούν να με αρρωστήσουν." },
};
// Engelsk "milk-derived"-form pr. allergen (1. okt. 2026). Bruges kun på
// engelsk og kun for de faste allergener — fritekst falder tilbage til
// "ingredients made from {name}".
export const MADPAS_EN_DERIVED = {
  maelkeallergi:"milk", aeg:"egg", jordnoedder:"peanut", noedder:"nut", hvede:"wheat",
  gluten:"gluten", coeliaki:"gluten", soja:"soy", fisk:"fish", skaldyr:"shellfish", bloeddyr:"mollusc",
  selleri:"celery", sennep:"mustard", sesam:"sesame", lupin:"lupin", svovl:"sulphite",
};

// Krydskontaminerings-besked (27. sept. 2026, Madpas-finpolish, krav 7) —
// KUN vist/oplæst hvis brugeren selv har slået den til i Madpas-
// indstillingerne (default FRA, se madpasCrossContact i App.jsx). Én
// kombineret sætning for HELE fødevareallergi-sektionen (ikke pr. emne,
// modsat MADPAS_SAFETY_NOTE_T ovenfor) — SINGULAR ved kun ét hensyn,
// PLURAL ("disse allergener"/"these allergens") ved flere, se
// madpasCrossContactNote() i useMadpas.js.
export const MADPAS_CROSS_CONTACT_SINGULAR_T = {
  da:"Undgå venligst krydskontaminering med {name} under tilberedningen.",
  en:"Please avoid cross-contact with {name} during preparation.",
  de:"Bitte vermeiden Sie Kreuzkontamination mit {name} bei der Zubereitung.",
  fr:"Veuillez éviter tout contact croisé avec {name} lors de la préparation.",
  es:"Por favor, evite el contacto cruzado con {name} durante la preparación.",
  it:"Si prega di evitare la contaminazione crociata con {name} durante la preparazione.",
  nl:"Vermijd kruisbesmetting met {name} tijdens de bereiding.",
  pt:"Por favor, evite contacto cruzado com {name} durante a preparação.",
  pl:"Proszę unikać kontaktu krzyżowego z {name} podczas przygotowywania.",
  sv:"Undvik vänligen korskontaminering med {name} under tillagningen.",
  no:"Unngå vennligst krysskontaminering med {name} under tilberedningen.",
  ja:"調理の際は{name}との接触汚染を避けてください。",
  zh:"请在准备过程中避免与{name}交叉接触。",
  ar:"يرجى تجنب التلوث المتبادل مع {name} أثناء التحضير.",
  tr:"Lütfen hazırlık sırasında {name} ile çapraz bulaşmadan kaçının.",
  th:"กรุณาหลีกเลี่ยงการปนเปื้อนข้ามกับ {name} ระหว่างการเตรียมอาหาร",
  el:"Παρακαλώ αποφύγετε την διασταυρούμενη επιμόλυνση με {name} κατά την προετοιμασία.",
};
export const MADPAS_CROSS_CONTACT_PLURAL_T = {
  da:"Undgå venligst krydskontaminering med disse allergener under tilberedningen.",
  en:"Please avoid cross-contact with these allergens during preparation.",
  de:"Bitte vermeiden Sie Kreuzkontamination mit diesen Allergenen bei der Zubereitung.",
  fr:"Veuillez éviter tout contact croisé avec ces allergènes lors de la préparation.",
  es:"Por favor, evite el contacto cruzado con estos alérgenos durante la preparación.",
  it:"Si prega di evitare la contaminazione crociata con questi allergeni durante la preparazione.",
  nl:"Vermijd kruisbesmetting met deze allergenen tijdens de bereiding.",
  pt:"Por favor, evite contacto cruzado com estes alergénios durante a preparação.",
  pl:"Proszę unikać kontaktu krzyżowego z tymi alergenami podczas przygotowywania.",
  sv:"Undvik vänligen korskontaminering med dessa allergener under tillagningen.",
  no:"Unngå vennligst krysskontaminering med disse allergenene under tilberedningen.",
  ja:"調理の際はこれらのアレルゲンとの接触汚染を避けてください。",
  zh:"请在准备过程中避免与这些过敏原交叉接触。",
  ar:"يرجى تجنب التلوث المتبادل مع هذه المواد المسببة للحساسية أثناء التحضير.",
  tr:"Lütfen hazırlık sırasında bu alerjenlerle çapraz bulaşmadan kaçının.",
  th:"กรุณาหลีกเลี่ยงการปนเปื้อนข้ามกับสารก่อภูมิแพ้เหล่านี้ระหว่างการเตรียมอาหาร",
  el:"Παρακαλώ αποφύγετε την διασταυρούμενη επιμόλυνση με αυτά τα αλλεργιογόνα κατά την προετοιμασία.",
};

// "Jeg tåler ikke:" — kort overskrift over chip-listen i intolerance-sektionen.
export const MADPAS_INTOLERANCE_HEADLINE_T = {
  da:"Jeg tåler ikke:", en:"I am intolerant to:", de:"Ich vertrage nicht:",
  fr:"Je ne tolère pas :", es:"No tolero:", it:"Non tollero:",
  nl:"Ik verdraag niet:", pt:"Não tolero:", pl:"Nie toleruję:",
  sv:"Jag tål inte:", no:"Jeg tåler ikke:", ja:"不耐性があります：",
  zh:"我不耐受：", ar:"لا أتحمل:", tr:"Şuna karşı hassasiyetim var:",
  th:"ฉันไม่สามารถทานได้:", el:"Δεν ανέχομαι:",
};

// Kort, tydeligt mærket "eksempel"-label foran de korte fødevare-eksempler
// under hvert allergen i Madpas' tjener-visning (26. sept. 2026, Madpas-
// redesign, afsnit 8-10; ordlyden opdateret til "May be found in"-stil (tidligere "Common examples") i
// den opfølgende polish-runde samme dag) — bevidst generisk i stedet for
// en sætningsskabelon pr. allergen ("Common foods containing X:"), så det
// forbliver kompakt og ensartet uanset om brugeren har ét eller flere
// allergener, og aldrig kan forveksles med en komplet/garanteret liste.
// "May be found in:" (1. okt. 2026, Bjørn): eksemplerne indeholder ikke nødvendigvis allergenet,
// så "Common examples" (almindelige eksempler) lovede for meget. Gælder alle 17 sprog.
export const MADPAS_EXAMPLES_LABEL_T = {
  da:"Kan findes i:", en:"May be found in:", de:"Kann vorkommen in:", fr:"Peut se trouver dans :", es:"Puede encontrarse en:",
  it:"Può essere presente in:", nl:"Kan voorkomen in:", pt:"Pode encontrar-se em:", pl:"Może występować w:",
  sv:"Kan finnas i:", no:"Kan finnes i:", ja:"含まれている可能性のある食品：", zh:"可能存在于：", ar:"قد يوجد في:",
  tr:"Şunlarda bulunabilir:", th:"อาจพบได้ใน:", el:"Μπορεί να βρεθεί σε:",
};

export const ALLERGEN_T = {
  gluten:      { en:{n:"Gluten",d:"Contains gluten (wheat, rye, barley, oats, spelt)"},de:{n:"Gluten",d:"Enthält Gluten (Weizen, Roggen, Gerste, Hafer, Dinkel)"},fr:{n:"Gluten",d:"Contient du gluten (blé, seigle, orge, avoine, épeautre)"},es:{n:"Gluten",d:"Contiene gluten (trigo, centeno, cebada, avena, espelta)"},it:{n:"Glutine",d:"Contiene glutine (frumento, segale, orzo, avena, farro)"},nl:{n:"Gluten",d:"Bevat gluten (tarwe, rogge, gerst, haver, spelt)"},pt:{n:"Glúten",d:"Contém glúten (trigo, centeio, cevada, aveia, espelta)"},pl:{n:"Gluten",d:"Zawiera gluten (pszenica, żyto, jęczmień, owies, orkisz)"},sv:{n:"Gluten",d:"Innehåller gluten (vete, råg, korn, havre, dinkel)"},no:{n:"Gluten",d:"Inneholder gluten (hvete, rug, bygg, havre, spelt)"},ja:{n:"グルテン",d:"グルテン含有（小麦・ライ麦・大麦・燕麦・スペルト小麦）"},zh:{n:"麸质",d:"含麸质（小麦、黑麦、大麦、燕麦、斯佩尔特小麦）"},ar:{n:"الغلوتين",d:"يحتوي على الغلوتين (قمح، جاودار، شعير، شوفان)"},tr:{n:"Gluten",d:"Gluten içerir (buğday, çavdar, arpa, yulaf, kavılca)"},th:{n:"กลูเตน",d:"มีกลูเตน (ข้าวสาลี, ข้าวไรย์, ข้าวบาร์เลย์, ข้าวโอ๊ต)"},el:{n:"Γλουτένη",d:"Περιέχει γλουτένη (σιτάρι, σίκαλη, κριθάρι, βρώμη, ζέα)"} },
  // "hvede" og "maelkeallergi" manglede oprindeligt her (26. sept. 2026,
  // Madpas-redesign — fundet og rettet: uden en "en" osv.-nøgle faldt
  // koden tilbage til ALLERGENS' danske a.label, så et madpas på fx
  // engelsk viste "Hvede" i stedet for "Wheat", mens resten af UI'et var
  // korrekt oversat. Se madpasAllergenLabel() i useMadpas.js).
  // Cøliaki hentes fra MADPAS_COELIAC_T (navn + to-sætnings-budskab, 17 sprog).
  coeliaki:    Object.fromEntries(Object.entries(MADPAS_COELIAC_T).map(([l,v]) => [l,{n:v.n,d:v.statement}])),
  hvede:       { en:{n:"Wheat",d:"Contains wheat and wheat products"},de:{n:"Weizen",d:"Enthält Weizen und Weizenprodukte"},fr:{n:"Blé",d:"Contient du blé et des produits à base de blé"},es:{n:"Trigo",d:"Contiene trigo y productos a base de trigo"},it:{n:"Grano",d:"Contiene grano e prodotti a base di grano"},nl:{n:"Tarwe",d:"Bevat tarwe en tarweproducten"},pt:{n:"Trigo",d:"Contém trigo e produtos à base de trigo"},pl:{n:"Pszenica",d:"Zawiera pszenicę i produkty pszenne"},sv:{n:"Vete",d:"Innehåller vete och veteprodukter"},no:{n:"Hvete",d:"Inneholder hvete og hveteprodukter"},ja:{n:"小麦",d:"小麦および小麦製品を含む"},zh:{n:"小麦",d:"含有小麦和小麦制品"},ar:{n:"القمح",d:"يحتوي على القمح ومنتجاته"},tr:{n:"Buğday",d:"Buğday ve buğday ürünleri içerir"},th:{n:"ข้าวสาลี",d:"มีข้าวสาลีและผลิตภัณฑ์จากข้าวสาลี"},el:{n:"Σιτάρι",d:"Περιέχει σιτάρι και προϊόντα σιταριού"} },
  maelkeallergi: { en:{n:"Milk",d:"Contains milk and milk products"},de:{n:"Milch",d:"Enthält Milch und Milchprodukte"},fr:{n:"Lait",d:"Contient du lait et des produits laitiers"},es:{n:"Leche",d:"Contiene leche y productos lácteos"},it:{n:"Latte",d:"Contiene latte e latticini"},nl:{n:"Melk",d:"Bevat melk en zuivelproducten"},pt:{n:"Leite",d:"Contém leite e laticínios"},pl:{n:"Mleko",d:"Zawiera mleko i produkty mleczne"},sv:{n:"Mjölk",d:"Innehåller mjölk och mjölkprodukter"},no:{n:"Melk",d:"Inneholder melk og melkeprodukter"},ja:{n:"牛乳",d:"牛乳および乳製品を含む"},zh:{n:"牛奶",d:"含有牛奶和乳制品"},ar:{n:"الحليب",d:"يحتوي على الحليب ومنتجاته"},tr:{n:"Süt",d:"Süt ve süt ürünleri içerir"},th:{n:"นม",d:"มีนมและผลิตภัณฑ์จากนม"},el:{n:"Γάλα",d:"Περιέχει γάλα και γαλακτοκομικά προϊόντα"} },
  laktose:     { en:{n:"Lactose / Dairy",d:"Contains milk and dairy products (lactose)"},de:{n:"Laktose / Milch",d:"Enthält Milch und Milchprodukte (Laktose)"},fr:{n:"Lactose / Lait",d:"Contient du lait et des produits laitiers (lactose)"},es:{n:"Lactosa / Lácteos",d:"Contiene leche y productos lácteos (lactosa)"},it:{n:"Lattosio / Latte",d:"Contiene latte e latticini (lattosio)"},nl:{n:"Lactose / Melk",d:"Bevat melk en zuivelproducten (lactose)"},pt:{n:"Lactose / Leite",d:"Contém leite e produtos lácteos (lactose)"},pl:{n:"Laktoza / Mleko",d:"Zawiera mleko i produkty mleczne (laktoza)"},sv:{n:"Laktos / Mjölk",d:"Innehåller mjölk och mjölkprodukter (laktos)"},no:{n:"Laktose / Melk",d:"Inneholder melk og meieriprodukter (laktose)"},ja:{n:"乳糖 / 乳製品",d:"牛乳および乳製品を含む（ラクトース）"},zh:{n:"乳糖 / 乳制品",d:"含有牛奶和乳制品（乳糖）"},ar:{n:"اللاكتوز / الألبان",d:"يحتوي على الحليب ومنتجات الألبان"},tr:{n:"Laktoz / Süt",d:"Süt ve süt ürünleri içerir (laktoz)"},th:{n:"แลคโตส / นม",d:"มีนมและผลิตภัณฑ์จากนม (แลคโตส)"},el:{n:"Λακτόζη / Γάλα",d:"Περιέχει γάλα και γαλακτοκομικά (λακτόζη)"} },
  aeg:         { en:{n:"Eggs",d:"Contains eggs and egg products"},de:{n:"Ei",d:"Enthält Eier und Eiprodukte"},fr:{n:"Œufs",d:"Contient des œufs et ovoproduits"},es:{n:"Huevos",d:"Contiene huevos y ovoproductos"},it:{n:"Uova",d:"Contiene uova e ovoprodotti"},nl:{n:"Eieren",d:"Bevat eieren en eiproducten"},pt:{n:"Ovos",d:"Contém ovos e produtos à base de ovos"},pl:{n:"Jaja",d:"Zawiera jaja i produkty na bazie jaj"},sv:{n:"Ägg",d:"Innehåller ägg och äggprodukter"},no:{n:"Egg",d:"Inneholder egg og eggprodukter"},ja:{n:"卵",d:"卵および卵製品を含む"},zh:{n:"鸡蛋",d:"含有鸡蛋和蛋制品"},ar:{n:"البيض",d:"يحتوي على البيض ومنتجاته"},tr:{n:"Yumurta",d:"Yumurta ve yumurta ürünleri içerir"},th:{n:"ไข่",d:"มีไข่และผลิตภัณฑ์จากไข่"},el:{n:"Αυγά",d:"Περιέχει αυγά και προϊόντα αυγών"} },
  noedder:     { en:{n:"Tree Nuts",d:"Contains nuts (almonds, hazelnuts, walnuts, cashews, pistachios etc.)"},de:{n:"Schalenfrüchte",d:"Enthält Nüsse (Mandeln, Haselnüsse, Walnüsse, Cashews, Pistazien usw.)"},fr:{n:"Fruits à coque",d:"Contient des fruits à coque (amandes, noisettes, noix, cajou, pistaches, etc.)"},es:{n:"Frutos secos",d:"Contiene frutos secos (almendras, avellanas, nueces, anacardos, pistachos, etc.)"},it:{n:"Frutta a guscio",d:"Contiene frutta a guscio (mandorle, nocciole, noci, anacardi, pistacchi ecc.)"},nl:{n:"Noten",d:"Bevat noten (amandelen, hazelnoten, walnoten, cashewnoten, pistachenoten, etc.)"},pt:{n:"Frutos de casca rija",d:"Contém frutos de casca rija (amêndoas, avelãs, nozes, cajus, pistáchios, etc.)"},pl:{n:"Orzechy",d:"Zawiera orzechy (migdały, orzechy laskowe, włoskie, nerkowce, pistacje itp.)"},sv:{n:"Nötter",d:"Innehåller nötter (mandlar, hasselnötter, valnötter, cashewnötter, pistaschnötter m.fl.)"},no:{n:"Nøtter",d:"Inneholder nøtter (mandler, hasselnøtter, valnøtter, cashewnøtter, pistasjnøtter m.fl.)"},ja:{n:"ナッツ類",d:"ナッツ類含有（アーモンド・ヘーゼルナッツ・クルミ・カシューナッツ・ピスタチオ等）"},zh:{n:"坚果",d:"含有坚果（杏仁、榛子、核桃、腰果、开心果等）"},ar:{n:"المكسرات",d:"يحتوي على المكسرات (اللوز، البندق، الجوز، الكاجو، الفستق)"},tr:{n:"Kabuklu Yemişler",d:"Kabuklu yemiş içerir (badem, fındık, ceviz, kaju, antep fıstığı vb.)"},th:{n:"ถั่วต้นไม้",d:"มีถั่ว (อัลมอนด์, เฮเซลนัท, วอลนัท, มะม่วงหิมพานต์, พิสตาชิโอ)"},el:{n:"Ξηροί καρποί",d:"Περιέχει ξηρούς καρπούς (αμύγδαλα, φουντούκια, καρύδια, κάσιους, φιστίκια)"} },
  jordnoedder: { en:{n:"Peanuts",d:"Contains peanuts and peanut products"},de:{n:"Erdnüsse",d:"Enthält Erdnüsse und Erdnussprodukte"},fr:{n:"Arachides",d:"Contient des arachides (cacahuètes) et produits"},es:{n:"Cacahuetes",d:"Contiene cacahuetes y productos a base de cacahuetes"},it:{n:"Arachidi",d:"Contiene arachidi e prodotti a base di arachidi"},nl:{n:"Pinda's",d:"Bevat pinda's en pindaproducten"},pt:{n:"Amendoins",d:"Contém amendoins e produtos à base de amendoins"},pl:{n:"Orzeszki ziemne",d:"Zawiera orzeszki ziemne i produkty z orzeszków ziemnych"},sv:{n:"Jordnötter",d:"Innehåller jordnötter och jordnötsprodukter"},no:{n:"Peanøtter",d:"Inneholder peanøtter og peanøttprodukter"},ja:{n:"ピーナッツ",d:"ピーナッツおよびピーナッツ製品を含む"},zh:{n:"花生",d:"含有花生和花生制品"},ar:{n:"الفول السوداني",d:"يحتوي على الفول السوداني ومنتجاته"},tr:{n:"Yerfıstığı",d:"Yerfıstığı ve yerfıstığı ürünleri içerir"},th:{n:"ถั่วลิสง",d:"มีถั่วลิสงและผลิตภัณฑ์จากถั่วลิสง"},el:{n:"Αραχίδες",d:"Περιέχει αραχίδες (φιστίκια Αμερικής) και προϊόντα τους"} },
  // "Soya" (IKKE "Soy / Soya") — det korrekte lokale navn for MADPAS_LANGUAGES'
  // "en"-variant, som er britisk engelsk (🇬🇧, bcp en-GB, se MADPAS_LANGUAGES) —
  // to varianter samtidig var forvirrende for personalet (27. sept. 2026,
  // Madpas-finpolish, krav 4).
  soja:        { en:{n:"Soya",d:"Contains soya and soya-based products"},de:{n:"Soja",d:"Enthält Soja und sojahaltige Produkte"},fr:{n:"Soja",d:"Contient du soja et des produits à base de soja"},es:{n:"Soja",d:"Contiene soja y productos a base de soja"},it:{n:"Soia",d:"Contiene soia e prodotti a base di soia"},nl:{n:"Soja",d:"Bevat soja en sojaproducten"},pt:{n:"Soja",d:"Contém soja e produtos à base de soja"},pl:{n:"Soja",d:"Zawiera soję i produkty sojowe"},sv:{n:"Soja",d:"Innehåller soja och sojabaserade produkter"},no:{n:"Soya",d:"Inneholder soya og soyabaserte produkter"},ja:{n:"大豆",d:"大豆および大豆製品を含む"},zh:{n:"大豆",d:"含有大豆和大豆制品"},ar:{n:"الصويا",d:"يحتوي على الصويا ومنتجاتها"},tr:{n:"Soya",d:"Soya ve soya ürünleri içerir"},th:{n:"ถั่วเหลือง",d:"มีถั่วเหลืองและผลิตภัณฑ์จากถั่วเหลือง"},el:{n:"Σόγια",d:"Περιέχει σόγια και προϊόντα σόγιας"} },
  fisk:        { en:{n:"Fish",d:"Contains fish and fish products"},de:{n:"Fisch",d:"Enthält Fisch und Fischprodukte"},fr:{n:"Poisson",d:"Contient du poisson et des produits à base de poisson"},es:{n:"Pescado",d:"Contiene pescado y productos a base de pescado"},it:{n:"Pesce",d:"Contiene pesce e prodotti ittici"},nl:{n:"Vis",d:"Bevat vis en visproducten"},pt:{n:"Peixe",d:"Contém peixe e produtos à base de peixe"},pl:{n:"Ryby",d:"Zawiera ryby i produkty rybne"},sv:{n:"Fisk",d:"Innehåller fisk och fiskprodukter"},no:{n:"Fisk",d:"Inneholder fisk og fiskeprodukter"},ja:{n:"魚",d:"魚および魚製品を含む"},zh:{n:"鱼类",d:"含有鱼和鱼制品"},ar:{n:"السمك",d:"يحتوي على السمك ومنتجاته"},tr:{n:"Balık",d:"Balık ve balık ürünleri içerir"},th:{n:"ปลา",d:"มีปลาและผลิตภัณฑ์จากปลา"},el:{n:"Ψάρι",d:"Περιέχει ψάρι και προϊόντα ψαριού"} },
  skaldyr:     { en:{n:"Shellfish / Crustaceans",d:"Contains crustaceans and shellfish (shrimp, crab, lobster, mussels etc.)"},de:{n:"Krebstiere / Schalentiere",d:"Enthält Krebstiere und Schalentiere (Garnelen, Krabben, Hummer, Muscheln)"},fr:{n:"Crustacés / Mollusques",d:"Contient des crustacés et mollusques (crevettes, crabe, homard, moules)"},es:{n:"Crustáceos / Mariscos",d:"Contiene crustáceos y mariscos (gambas, cangrejo, langosta, mejillones)"},it:{n:"Crostacei / Molluschi",d:"Contiene crostacei e molluschi (gamberi, granchio, aragosta, cozze)"},nl:{n:"Schaaldieren",d:"Bevat schaaldieren (garnalen, krab, kreeft, mosselen)"},pt:{n:"Crustáceos / Moluscos",d:"Contém crustáceos e moluscos (camarão, caranguejo, lagosta, mexilhões)"},pl:{n:"Skorupiaki",d:"Zawiera skorupiaki (krewetki, kraby, homary, małże)"},sv:{n:"Skaldjur",d:"Innehåller skaldjur (räkor, krabba, hummer, musslor)"},no:{n:"Skalldyr",d:"Inneholder skalldyr (reker, krabbe, hummer, muslinger)"},ja:{n:"甲殻類・貝類",d:"甲殻類・貝類含有（エビ・カニ・ロブスター・ムール貝等）"},zh:{n:"甲壳类 / 贝类",d:"含有甲壳类和贝类（虾、蟹、龙虾、贻贝等）"},ar:{n:"القشريات والمحار",d:"يحتوي على القشريات والمحار"},tr:{n:"Kabuklu Deniz Ürünleri",d:"Kabuklu deniz ürünleri içerir (karides, yengeç, ıstakoz, midye)"},th:{n:"สัตว์มีเปลือก",d:"มีสัตว์มีเปลือก (กุ้ง, ปู, กุ้งมังกร, หอย)"},el:{n:"Οστρακοειδή",d:"Περιέχει οστρακοειδή (γαρίδες, καβούρι, αστακός, μύδια)"} },
  selleri:     { en:{n:"Celery",d:"Contains celery and celery products"},de:{n:"Sellerie",d:"Enthält Sellerie und Sellerieprodukte"},fr:{n:"Céleri",d:"Contient du céleri et produits à base de céleri"},es:{n:"Apio",d:"Contiene apio y productos a base de apio"},it:{n:"Sedano",d:"Contiene sedano e prodotti a base di sedano"},nl:{n:"Selderij",d:"Bevat selderij en selderijproducten"},pt:{n:"Aipo",d:"Contém aipo e produtos à base de aipo"},pl:{n:"Seler",d:"Zawiera seler i produkty na bazie selera"},sv:{n:"Selleri",d:"Innehåller selleri och selleriprodukter"},no:{n:"Selleri",d:"Inneholder selleri og selleriprodukter"},ja:{n:"セロリ",d:"セロリおよびセロリ製品を含む"},zh:{n:"芹菜",d:"含有芹菜和芹菜制品"},ar:{n:"الكرفس",d:"يحتوي على الكرفس ومنتجاته"},tr:{n:"Kereviz",d:"Kereviz ve kereviz ürünleri içerir"},th:{n:"คื่นฉ่าย",d:"มีคื่นฉ่ายและผลิตภัณฑ์จากคื่นฉ่าย"},el:{n:"Σέλινο",d:"Περιέχει σέλινο και προϊόντα σέλινου"} },
  sennep:      { en:{n:"Mustard",d:"Contains mustard and mustard products"},de:{n:"Senf",d:"Enthält Senf und Senfprodukte"},fr:{n:"Moutarde",d:"Contient de la moutarde et produits à base de moutarde"},es:{n:"Mostaza",d:"Contiene mostaza y productos a base de mostaza"},it:{n:"Senape",d:"Contiene senape e prodotti a base di senape"},nl:{n:"Mosterd",d:"Bevat mosterd en mosterdbevattende producten"},pt:{n:"Mostarda",d:"Contém mostarda e produtos à base de mostarda"},pl:{n:"Gorczyca",d:"Zawiera gorczycę i produkty na bazie gorczycy"},sv:{n:"Senap",d:"Innehåller senap och senapsprodukter"},no:{n:"Sennep",d:"Inneholder sennep og sennepsprodukter"},ja:{n:"マスタード",d:"マスタードおよびマスタード製品を含む"},zh:{n:"芥末",d:"含有芥末和芥末制品"},ar:{n:"الخردل",d:"يحتوي على الخردل ومنتجاته"},tr:{n:"Hardal",d:"Hardal ve hardal ürünleri içerir"},th:{n:"มัสตาร์ด",d:"มีมัสตาร์ดและผลิตภัณฑ์จากมัสตาร์ด"},el:{n:"Μουστάρδα",d:"Περιέχει μουστάρδα και προϊόντα μουστάρδας"} },
  sesam:       { en:{n:"Sesame",d:"Contains sesame seeds and sesame products"},de:{n:"Sesam",d:"Enthält Sesamsamen und Sesamprodukte"},fr:{n:"Sésame",d:"Contient des graines de sésame et produits à base de sésame"},es:{n:"Sésamo",d:"Contiene semillas de sésamo y productos a base de sésamo"},it:{n:"Sesamo",d:"Contiene semi di sesamo e prodotti a base di sesamo"},nl:{n:"Sesam",d:"Bevat sesamzaad en sesamproducten"},pt:{n:"Sésamo",d:"Contém sementes de sésamo e produtos à base de sésamo"},pl:{n:"Sezam",d:"Zawiera ziarna sezamu i produkty sezamowe"},sv:{n:"Sesam",d:"Innehåller sesamfrön och sesamprodukter"},no:{n:"Sesam",d:"Inneholder sesamfrø og sesamprodukter"},ja:{n:"ゴマ",d:"ゴマおよびゴマ製品を含む"},zh:{n:"芝麻",d:"含有芝麻和芝麻制品"},ar:{n:"السمسم",d:"يحتوي على بذور السمسم ومنتجاته"},tr:{n:"Susam",d:"Susam tohumu ve susam ürünleri içerir"},th:{n:"งา",d:"มีเมล็ดงาและผลิตภัณฑ์จากงา"},el:{n:"Σουσάμι",d:"Περιέχει σουσάμι και προϊόντα σουσαμιού"} },
  svovl:       { en:{n:"Sulphites / Sulfites",d:"Contains sulphites/sulphur dioxide (preservative)"},de:{n:"Sulfite / SO₂",d:"Enthält Sulfite/Schwefeldioxid (Konservierungsmittel)"},fr:{n:"Sulfites / SO₂",d:"Contient des sulfites/dioxyde de soufre (conservateur)"},es:{n:"Sulfitos / SO₂",d:"Contiene sulfitos/dióxido de azufre (conservante)"},it:{n:"Solfiti / SO₂",d:"Contiene solfiti/anidride solforosa (conservante)"},nl:{n:"Sulfieten / SO₂",d:"Bevat sulfieten/zwaveldioxide (conserveermiddel)"},pt:{n:"Sulfitos / SO₂",d:"Contém sulfitos/dióxido de enxofre (conservante)"},pl:{n:"Siarczyny / SO₂",d:"Zawiera siarczyny/dwutlenek siarki (konserwant)"},sv:{n:"Sulfiter / SO₂",d:"Innehåller sulfiter/svaveldioxid (konserveringsmedel)"},no:{n:"Sulfitter / SO₂",d:"Inneholder sulfitter/svoveldioksid (konserveringsmiddel)"},ja:{n:"亜硫酸塩 / SO₂",d:"亜硫酸塩/二酸化硫黄を含む（保存料）"},zh:{n:"亚硫酸盐 / SO₂",d:"含有亚硫酸盐/二氧化硫（防腐剂）"},ar:{n:"الكبريتيت / SO₂",d:"يحتوي على الكبريتيت (مادة حافظة)"},tr:{n:"Sülfit / SO₂",d:"Sülfit/kükürt dioksit içerir (koruyucu)"},th:{n:"ซัลไฟต์ / SO₂",d:"มีซัลไฟต์/ซัลเฟอร์ไดออกไซด์ (สารกันบูด)"},el:{n:"Θειώδη / SO₂",d:"Περιέχει θειώδη/διοξείδιο του θείου (συντηρητικό)"} },
  lupin:       { en:{n:"Lupin",d:"Contains lupin and lupin-based products"},de:{n:"Lupinen",d:"Enthält Lupinen und Lupinenprodukte"},fr:{n:"Lupin",d:"Contient du lupin et des produits à base de lupin"},es:{n:"Altramuz",d:"Contiene altramuz y productos a base de altramuz"},it:{n:"Lupini",d:"Contiene lupini e prodotti a base di lupini"},nl:{n:"Lupine",d:"Bevat lupine en lupineproducten"},pt:{n:"Tremoço",d:"Contém tremoço e produtos à base de tremoço"},pl:{n:"Łubin",d:"Zawiera łubin i produkty z łubinu"},sv:{n:"Lupin",d:"Innehåller lupin och lupinbaserade produkter"},no:{n:"Lupin",d:"Inneholder lupin og lupinbaserte produkter"},ja:{n:"ルピナス",d:"ルピナスおよびルピナス製品を含む"},zh:{n:"羽扇豆",d:"含有羽扇豆和羽扇豆制品"},ar:{n:"الترمس",d:"يحتوي على الترمس ومنتجاته"},tr:{n:"Lupin",d:"Lupin ve lupin ürünleri içerir"},th:{n:"ลูพิน",d:"มีลูพินและผลิตภัณฑ์จากลูพิน"},el:{n:"Λούπινα",d:"Περιέχει λούπινα και προϊόντα λούπινων"} },
  bloeddyr:    { en:{n:"Molluscs",d:"Contains molluscs (squid, oysters, mussels, snails etc.)"},de:{n:"Weichtiere",d:"Enthält Weichtiere (Tintenfisch, Austern, Muscheln, Schnecken)"},fr:{n:"Mollusques",d:"Contient des mollusques (calamar, huîtres, moules, escargots)"},es:{n:"Moluscos",d:"Contiene moluscos (calamar, ostras, mejillones, caracoles)"},it:{n:"Molluschi",d:"Contiene molluschi (calamari, ostriche, cozze, lumache)"},nl:{n:"Weekdieren",d:"Bevat weekdieren (inktvis, oesters, mosselen, slakken)"},pt:{n:"Moluscos",d:"Contém moluscos (lulas, ostras, mexilhões, caracóis)"},pl:{n:"Mięczaki",d:"Zawiera mięczaki (kałamarnica, ostrygi, małże, ślimaki)"},sv:{n:"Blötdjur",d:"Innehåller blötdjur (bläckfisk, ostron, musslor, sniglar)"},no:{n:"Bløtdyr",d:"Inneholder bløtdyr (blekksprut, østers, muslinger, snegler)"},ja:{n:"軟体動物",d:"軟体動物含有（イカ・カキ・ムール貝・カタツムリ等）"},zh:{n:"软体动物",d:"含有软体动物（鱿鱼、牡蛎、贻贝、蜗牛等）"},ar:{n:"الرخويات",d:"يحتوي على الرخويات (الحبار، المحار، بلح البحر)"},tr:{n:"Yumuşakçalar",d:"Yumuşakça içerir (kalamar, istiridye, midye, salyangoz)"},th:{n:"หอย / ปลาหมึก",d:"มีสัตว์จำพวกหอย (ปลาหมึก, หอยนางรม, หอยแมลงภู่)"},el:{n:"Μαλάκια",d:"Περιέχει μαλάκια (καλαμάρι, στρείδια, μύδια, σαλιγκάρια)"} },
};

// ALLERGEN_T har ingen "da"-nøgle (dansk er allerede ALLERGENS' eget
// a.label, se konstantens egen kommentar) — uden dette faldt et valgt
// "Dansk" madpas fejlagtigt tilbage til den ENGELSKE allergen-tekst, mens
// resten af UI'et var dansk (26. sept. 2026, Madpas-redesign, fundet og
// rettet: "det må aldrig forekomme at UI'et er oversat til ét sprog, mens
// allergennavnet bliver stående på [et andet]"). Samme hjælpefunktion
// bruges i MadpasScreen.jsx.
export function madpasAllergenLabel(a, lang) {
  if (!a) return null;
  if (lang === "da") return a.label;
  return ALLERGEN_T[a.id]?.[lang]?.n || ALLERGEN_T[a.id]?.en?.n || a.label;
}
export function madpasDietLabel(dietId, lang) {
  const d = DIETS.find(x => x.id === dietId);
  if (!d) return null;
  if (lang === "da") return d.label;
  return DIET_T[dietId]?.[lang] || DIET_T[dietId]?.en || d.label;
}
// Kort, tydelig besked til personalet pr. diæt (27. sept. 2026, Madpas-
// finpolish, krav 1-2) — diæter skal have samme type besked som allergier,
// ikke kun vises som badges. Se MADPAS_DIET_MESSAGE_T i constants.jsx.
export function madpasDietMessage(dietId, lang) {
  const messages = MADPAS_DIET_MESSAGE_T[dietId];
  if (!messages) return "";
  return messages[lang] || messages.en || "";
}
// Korte, oversatte fødevare-eksempler til Madpas' tjener-visning/PDF/
// offentlige side (26. sept. 2026, Madpas-redesign, afsnit 8-10) — "Fx:
// Bread, Pasta, Cakes" under selve allergenet, IKKE en fuld/garanteret
// liste. Kombinerer products+ingredients (samme datasæt som allerede
// findes i ALLERGEN_EXAMPLES) og begrænser til 4 stk., så det forbliver
// kompakt selv med flere allergener.
export function madpasAllergenExamples(allergenId, lang) {
  const override = MADPAS_EXAMPLES_OVERRIDE[allergenId];
  if (override) return override[lang] || override.en;
  const ex = ALLERGEN_EXAMPLES[allergenId === "coeliaki" ? "gluten" : allergenId];
  if (!ex) return [];
  const products = ex.products?.[lang] || ex.products?.en || [];
  const ingredients = ex.ingredients?.[lang] || ex.ingredients?.en || [];
  // Hævet fra 4 til 5 (27. sept. 2026, Madpas-finpolish, krav 6) — behøvedes
  // for at "Valle"/"Whey" (mælkeallergiens 5. eksempel) reelt kommer frem,
  // da de 4 products alene allerede fyldte den tidligere grænse.
  return [...products, ...ingredients].slice(0, 5);
}
// Sikkerheds-sætning PR. ENKELT allergen/fritekst-emne i FØDEVARE-
// ALLERGIER (27. sept. 2026, Madpas-finpolish, krav 4 — "genereres
// dynamisk for den konkrete allergi"). `name` er det allerede-oversatte
// label (IKKE selve id'et) — indsættes overalt hvor skabelonen har
// {name} (kan forekomme flere gange, se MADPAS_SAFETY_NOTE_T).
// Navnet sænkes til små bogstaver midt i sætningen ("ikke indeholder
// jordnødder") — undtagen på tysk, hvor navneord altid skrives med stort
// ("kein Erdnüsse", ikke "erdnüsse").
function inlineName(name, lang) {
  return lang === "de" ? name : name.toLowerCase();
}
export function madpasSafetyNote(name, lang, allergenId) {
  if (!name) return "";
  if (allergenId === "coeliaki") return (MADPAS_COELIAC_T[lang] || MADPAS_COELIAC_T.en).safety;
  // Engelsk, fast allergen: "does not contain milk or any milk-derived ingredients".
  const derived = (lang === "en" || !MADPAS_SAFETY_NOTE_T[lang]) && allergenId && MADPAS_EN_DERIVED[allergenId];
  if (derived) return `Please make sure my food does not contain ${inlineName(name, "en")} or any ${derived}\u2011derived ingredients.`; // ikke-brydende bindestreg
  const template = MADPAS_SAFETY_NOTE_T[lang] || MADPAS_SAFETY_NOTE_T.en;
  return template.split("{name}").join(inlineName(name, lang));
}
// "I have a food allergy to milk." — første, direkte sætning pr. allergi.
export function madpasAllergyStatement(name, lang, allergenId) {
  if (!name) return "";
  if (allergenId === "coeliaki") return (MADPAS_COELIAC_T[lang] || MADPAS_COELIAC_T.en).statement;
  const template = MADPAS_ALLERGY_STATEMENT_T[lang] || MADPAS_ALLERGY_STATEMENT_T.en;
  return template.split("{name}").join(inlineName(name, lang));
}
// Krydskontaminerings-sætning (krav 7) — ÉN kombineret sætning for hele
// fødevareallergi-sektionen, singular ved ét hensyn ("with milk"), plural
// ("with these allergens") ved flere. `names` er de allerede-oversatte
// labels for alt i allergi-sektionen (rigtige allergener + fritekst).
// Kun kaldt når brugeren selv har aktiveret indstillingen — se
// madpasCrossContact i App.jsx.
export function madpasCrossContactNote(names, lang) {
  if (!names || names.length === 0) return "";
  if (names.length === 1) {
    const template = MADPAS_CROSS_CONTACT_SINGULAR_T[lang] || MADPAS_CROSS_CONTACT_SINGULAR_T.en;
    return template.replace("{name}", inlineName(names[0], lang));
  }
  return MADPAS_CROSS_CONTACT_PLURAL_T[lang] || MADPAS_CROSS_CONTACT_PLURAL_T.en;
}

// Hele oplæsningsteksten til "Læs højt" (samme sætninger som på skærmen).
export function madpasSpeechText({ lang, speakAllergens, speakCustom, speakDiets, crossContact }) {
  const parts = [];
    parts.push(MADPAS_SPEECH_INTRO_T[lang] || MADPAS_SPEECH_INTRO_T.en);

    // Ægte allergener (type "allergi") + fritekst får hver deres egen
    // fulde sikkerheds-sætning (samme tekst som vises på skærmen, se
    // madpasSafetyNote()) — intolerancer nævnes samlet uden den sætning,
    // matcher den visuelle opdeling (INTOLERANCES har ingen sikkerheds-
    // tekst, kun FOOD ALLERGIES). "May be found in" oplæses bevidst
    // IKKE (27. sept. 2026, krav 8: "behøver ikke nødvendigvis læses op,
    // hvis det gør beskeden unødigt lang").
    const allergyEntries = [];
    const intoleranceNames = [];
    speakAllergens.filter(id => typeof id === "string").forEach(id => {
      const a = ALLERGENS.find(x => x.id === id);
      if (!a) return;
      const label = madpasAllergenLabel(a, lang);
      if (a.type === "allergi" || id === "coeliaki") allergyEntries.push({ name: label, id });
      else intoleranceNames.push(label);
    });
    speakCustom.filter(c => typeof c === "string" && !speakAllergens.includes(c)).forEach(c => allergyEntries.push({ name: c }));
    // Cøliaki-budskabet dækker allerede spor, så den indgår ikke i krydskontaminerings-sætningen.
    const allergyNames = allergyEntries.filter(e => e.id !== "coeliaki").map(e => e.name);

    // Samme to sætninger som på skærmen: "I have a food allergy to milk."
    // + "Please make sure my food contains no milk or milk-derived ingredients."
    allergyEntries.forEach(e => parts.push(madpasAllergyStatement(e.name, lang, e.id) + " " + madpasSafetyNote(e.name, lang, e.id)));
    // Krydskontaminering oplæses KUN hvis brugeren selv har aktiveret den
    // (krav 7 — må aldrig vises/oplæses automatisk for alle).
    if (crossContact && allergyNames.length > 0) {
      parts.push(madpasCrossContactNote(allergyNames, lang));
    }
    if (intoleranceNames.length > 0) {
      parts.push((MADPAS_SPEECH_CANNOT_T[lang] || MADPAS_SPEECH_CANNOT_T.en) + ": " + intoleranceNames.join(", "));
    }

    if (speakDiets.length > 0) {
      const dietNames = speakDiets.map(d => madpasDietLabel(d, lang)).filter(Boolean).join(", ");
      parts.push(dietNames);
    }
    parts.push(MADPAS_SPEECH_OUTRO_T[lang] || MADPAS_SPEECH_OUTRO_T.en);
  return parts.join(". ");
}
