// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from "react";

// ─── EATSAFE LOGO KOMPONENT ──────────────────────────────────────────────────
function EatSafeLogo({ size = 32, variant = "light" }) {
  const isDark = variant === "dark";
  const bg = isDark ? "#1F2733" : "#FAFAF7";
  const barColor = isDark ? "#3A4452" : "#1F2733";
  const uid = "es-" + size + "-" + variant + "-" + Math.random().toString(36).slice(2,6);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="EatSafe">
      <defs>
        <clipPath id={"sq-"+uid}>
          <path d="M 50 0 C 85 0, 100 15, 100 50 C 100 85, 85 100, 50 100 C 15 100, 0 85, 0 50 C 0 15, 15 0, 50 0 Z" />
        </clipPath>
        <filter id={"glow-"+uid} x="-30%" y="-50%" width="160%" height="200%">
          <feGaussianBlur stdDeviation={isDark ? 2.4 : 1.6} result="blur" />
          <feMerge>
            {isDark && <feMergeNode in="blur" />}
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={"gline-"+uid} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <g clipPath={"url(#sq-"+uid+")"}>
        <rect width="100" height="100" fill={bg} />
        <g fill={barColor}>
          <rect x="18.00" y="16" width="8.31" height="68" rx="1.49" />
          <rect x="29.05" y="22" width="4.15" height="56" rx="0.75" />
          <rect x="35.94" y="16" width="5.54" height="68" rx="1.00" />
          <rect x="44.21" y="22" width="2.77" height="56" rx="0.50" />
          <rect x="49.71" y="16" width="3.32" height="68" rx="0.60" />
          <rect x="55.76" y="22" width="6.92" height="56" rx="1.25" />
          <rect x="65.41" y="16" width="4.43" height="68" rx="0.80" />
          <rect x="72.57" y="22" width="5.54" height="56" rx="1.00" />
          <rect x="80.84" y="16" width="3.88" height="68" rx="0.70" />
        </g>
        <g filter={"url(#glow-"+uid+")"}>
          <path
            d="M 20 58 L 70 58 L 76 64 L 86 50"
            fill="none"
            stroke={isDark ? "#4ADE80" : "url(#gline-"+uid+")"}
            strokeWidth="4.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
    </svg>
  );
}


// ─── KONFIGURATION ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://jegrpcflyguadyxialkm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZ3JwY2ZseWd1YWR5eGlhbGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjY5NjQsImV4cCI6MjA5NDc0Mjk2NH0.QErfbw2xmsdYjTZCS1WUOUwQHv6G2PKQRldyj8rdGq8";

// ─── KONSTANTER ──────────────────────────────────────────────────────────────
const ALLERGENS = [
  { id:"gluten",      label:"Gluten",         emoji:"🌾" },
  { id:"laktose",     label:"Laktose / Mælk", emoji:"🥛" },
  { id:"aeg",         label:"Æg",             emoji:"🥚" },
  { id:"noedder",     label:"Nødder",         emoji:"🌰" },
  { id:"jordnoedder", label:"Jordnødder",     emoji:"🥜" },
  { id:"soja",        label:"Soja",           emoji:"🫘" },
  { id:"fisk",        label:"Fisk",           emoji:"🐟" },
  { id:"skaldyr",     label:"Skaldyr",        emoji:"🦐" },
  { id:"selleri",     label:"Selleri",        emoji:"🥬" },
  { id:"sennep",      label:"Sennep",         emoji:"🌶️" },
  { id:"sesam",       label:"Sesam",          emoji:"🌿" },
  { id:"svovl",       label:"Sulfitter",      emoji:"🍷" },
  { id:"lupin",       label:"Lupin",          emoji:"🌸" },
  { id:"bloeddyr",    label:"Bløddyr",        emoji:"🦑" },
];

const DEMO_CODES = [
  { code:"3017620422003", label:"Nutella" },
  { code:"5449000054227", label:"Coca-Cola" },
  { code:"7394376616566", label:"Oatly" },
  { code:"5701029015306", label:"Lurpak" },
];

const SCREENS = {
  WELCOME:"welcome", LOGIN:"login", ONBOARD:"onboard",
  HOME:"home", SCAN:"scan", SEARCH:"search",
  LIST:"list", PROFILE:"profile", FAMILY:"family",
  RESULT:"result", HISTORY:"history",
  NOTFOUND:"notfound", SUBMITTED:"submitted",
  ADMIN:"admin", FAVORITES:"favorites",
  MADPAS:"madpas", RECIPES:"recipes", EDITPROFILE:"editprofile",
};

const PAGE_IDS = {
  welcome:"SCR-01", login:"SCR-02", onboard:"SCR-03",
  home:"SCR-04", scan:"SCR-05", search:"SCR-06",
  list:"SCR-07", profile:"SCR-08", family:"SCR-09",
  result:"SCR-10", history:"SCR-11", notfound:"SCR-12",
  submitted:"SCR-13", admin:"SCR-14", favorites:"SCR-15",
  madpas:"SCR-16", recipes:"SCR-17", editprofile:"SCR-18",
};

const DUMMY_PRODUCT = {
  code: "3017620422003",
  ean: "3017620422003",
  name: "Nutella",
  brand: "Ferrero",
  image_url: "https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.820.400.jpg",
  category: "Chokolade",
  status: "danger",
  headline: "Indeholder allergen! 🚫",
  summary: "Produktet indeholder Laktose, Nødder.",
  source: "open_food_facts",
  verified_status: "unverified",
  hasUnknown: false,
  matchedDanger: ["laktose", "noedder"],
  matchedWarning: ["soja"],
  familyImpact: [],
  allergen_flags: {
    gluten: "no", laktose: "yes", aeg: "no",
    noedder: "yes", jordnoedder: "no", soja: "traces",
    fisk: "no", skaldyr: "no", selleri: "no",
    sennep: "no", sesam: "no", svovl: "no",
    lupin: "no", bloeddyr: "no",
  },
  ingredients: "Sucre, huile de palme, NOISETTES 13%, cacao maigre 7,4%, LAIT écrémé en poudre 6,6%, LACTOSERUM en poudre, émulsifiants: lécithines (SOJA), vanilline.",
  flags: [
    { type:"bad", text:"Indeholder Laktose" },
    { type:"bad", text:"Indeholder Nødder" },
    { type:"maybe", text:"Kan indeholde spor af Soja" },
  ],
  timestamp: Date.now(),
};


const ALLERGEN_EXAMPLES = {
  gluten: {
    products: { da:["Brød","Pasta","Øl","Sojasauce"], en:["Bread","Pasta","Beer","Soy sauce"], de:["Brot","Pasta","Bier","Sojasoße"], fr:["Pain","Pâtes","Bière","Sauce soja"], es:["Pan","Pasta","Cerveza","Salsa de soja"], it:["Pane","Pasta","Birra","Salsa di soia"], nl:["Brood","Pasta","Bier","Sojasaus"], pt:["Pão","Massa","Cerveja","Molho de soja"], pl:["Chleb","Makaron","Piwo","Sos sojowy"], sv:["Bröd","Pasta","Öl","Sojasås"], no:["Brød","Pasta","Øl","Soyasaus"], ja:["パン","パスタ","ビール","醤油"], zh:["面包","面食","啤酒","酱油"], ar:["خبز","معكرونة","بيرة","صلصة الصويا"], tr:["Ekmek","Makarna","Bira","Soya sosu"], th:["ขนมปัง","พาสต้า","เบียร์","ซีอิ้ว"], el:["Ψωμί","Ζυμαρικά","Μπύρα","Σάλτσα σόγιας"] },
    ingredients: { da:["Hvede","Rug","Byg","Havre","Spelt"], en:["Wheat","Rye","Barley","Oats","Spelt"], de:["Weizen","Roggen","Gerste","Hafer","Dinkel"], fr:["Blé","Seigle","Orge","Avoine","Épeautre"], es:["Trigo","Centeno","Cebada","Avena","Espelta"], it:["Frumento","Segale","Orzo","Avena","Farro"], nl:["Tarwe","Rogge","Gerst","Haver","Spelt"], pt:["Trigo","Centeio","Cevada","Aveia","Espelta"], pl:["Pszenica","Żyto","Jęczmień","Owies","Orkisz"], sv:["Vete","Råg","Korn","Havre","Dinkel"], no:["Hvete","Rug","Bygg","Havre","Spelt"], ja:["小麦","ライ麦","大麦","燕麦","スペルト"], zh:["小麦","黑麦","大麦","燕麦","斯佩尔特"], ar:["قمح","جاودار","شعير","شوفان","كاموت"], tr:["Buğday","Çavdar","Arpa","Yulaf","Kavılca"], th:["ข้าวสาลี","ข้าวไรย์","ข้าวบาร์เลย์","ข้าวโอ๊ต"], el:["Σιτάρι","Σίκαλη","Κριθάρι","Βρώμη","Ζέα"] },
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
    ingredients: { da:["Jordnødder","Peanuts","Arachis hypogaea"], en:["Peanuts","Groundnuts","Arachis hypogaea"], de:["Erdnüsse","Erdnuss","Arachis hypogaea"], fr:["Arachides","Cacahuètes","Arachis hypogaea"], es:["Cacahuetes","Maníes","Arachis hypogaea"], it:["Arachidi","Noccioline","Arachis hypogaea"], nl:["Pinda's","Grondnoten","Arachis hypogaea"], pt:["Amendoins","Arachis hypogaea"], pl:["Orzeszki ziemne","Orzeszki arachidowe"], sv:["Jordnötter","Arachis hypogaea"], no:["Peanøtter","Jordnøtter","Arachis hypogaea"], ja:["ピーナッツ","落花生","アラキス"], zh:["花生","落花生"], ar:["الفول السوداني","فول سوداني"], tr:["Yerfıstığı","Fıstık"], th:["ถั่วลิสง"], el:["Φιστίκια Αμερικής","Αραχίδες"] },
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

const AVATAR_COLORS = ["#52b788","#74c69d","#40916c","#b7e4c7","#2d6a4f","#95d5b2","#f4a261","#e76f51"];

const HOME_TIPS = [
  { icon:"🌾", title:"Gluten er overalt", text:"Gluten findes ikke kun i brød — det gemmer sig i saucer, supper og krydderier. Scan altid." },
  { icon:"📋", title:"Læs altid etiketten", text:"Opskrifter ændres uden varsel. Et produkt du har spist trygt før, kan have nye ingredienser." },
  { icon:"👨‍👩‍👧", title:"Tilføj din familie", text:"Opret profiler for hele familien — så ser du på én gang hvem der kan spise hvad." },
  { icon:"🤝", title:"Hjælp fællesskabet", text:"Scan du et ukendt produkt? Indsend det! Databasen vokser med hjælp fra brugere som dig." },
  { icon:"⚠️", title:"Spor af allergener", text:"'Kan indeholde spor af' er ikke uskadeligt. For stærkt allergiske kan selv spormængder være farlige." },
  { icon:"🛒", title:"Planlæg din indkøbsliste", text:"Brug indkøbslisten til at tjekke produkter inden du handler — spar tid i butikken." },
  { icon:"🔎", title:"Søg inden du handler", text:"Søg på produkter inden du tager i butikken — så ved du hvad du kan købe trygt." },
  { icon:"📱", title:"Tilføj til hjemskærm", text:"Tilføj EatSafe til din telefons hjemskærm for hurtig adgang — det føles som en rigtig app." },
];

// ─── HJÆLPEFUNKTIONER ────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,9);

// Pæn ingrediensliste — fremhæver allergener med STORE BOGSTAVER
function IngredientsList({ text, allergenFlags = {} }) {
  if (!text) return null;

  // Rens teksten — fjern linjeskift og ekstra mellemrum
  const cleaned = text
    .replace(/[\n\r]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Split på komma men bevar indhold i parenteser
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of cleaned) {
    if (ch === "(" || ch === "[") { depth++; current += ch; }
    else if (ch === ")" || ch === "]") { depth--; current += ch; }
    else if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());

  // Find allergener der skal fremhæves
  const allergenLabels = {
    gluten: ["gluten","hvede","rug","byg","havre","spelt","kamut","einkorn","emmer","khorasanhvede"],
    laktose: ["mælk","laktose","fløde","smør","ost","valle","kasein","laktalbumin"],
    aeg: ["æg","æggehvide","æggeblomme"],
    noedder: ["nødder","mandler","hasselnødder","valnødder","cashew","pekannødder","pistacienødder","macadamia"],
    jordnoedder: ["jordnødder","peanut"],
    soja: ["soja","sojabønner"],
    fisk: ["fisk","ansjos","sardiner","laks","tun","makrel"],
    skaldyr: ["skaldyr","rejer","krabbe","hummer","muslinger"],
    selleri: ["selleri"],
    sennep: ["sennep","sennepsfrø"],
    sesam: ["sesam","sesamfrø"],
    svovl: ["sulfitter","svovldioxid","svovl"],
    lupin: ["lupin","lupinmel","lupinfrø"],
    bloeddyr: ["bløddyr","blæksprutte","østers","muslinger"],
  };

  const isAllergenWord = (word) => {
    const w = word.toLowerCase().replace(/[^a-zæøå]/g, "");
    return Object.entries(allergenLabels).some(([key, terms]) =>
      terms.some(t => w.includes(t) || t.includes(w)) && allergenFlags[key] !== "no"
    );
  };

  const isHighlighted = (part) => {
    // STORE BOGSTAVER = allergen markeret af producent
    const hasUppercase = part !== part.toLowerCase() && part === part.toUpperCase() && part.length > 2;
    // Eller indeholder et allergen-ord
    const words = part.toLowerCase().replace(/[()[\]]/g, "").split(/\s+/);
    const hasAllergenWord = words.some(w => isAllergenWord(w));
    return hasUppercase || hasAllergenWord;
  };

  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"4px 2px", lineHeight:1.6 }}>
      {parts.map((part, i) => {
        const highlighted = isHighlighted(part);
        return (
          <span key={i} style={{ display:"inline-flex", alignItems:"baseline" }}>
            <span style={{
              fontSize: 12,
              fontWeight: highlighted ? 700 : 400,
              color: highlighted ? "var(--red)" : "var(--muted2)",
              background: highlighted ? "var(--red-lt)" : "transparent",
              borderRadius: highlighted ? 4 : 0,
              padding: highlighted ? "1px 4px" : "0",
            }}>
              {part}
            </span>
            {i < parts.length - 1 && (
              <span style={{ color:"var(--border2)", fontSize:12, marginRight:2 }}>,</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// Viser profilbadges (bruger + familie) baseret på allergen flags
function ProfileBadges({ allergenFlags, allergens, customAllerg, family, activeProfiles, size = 22 }) {
  if (!allergenFlags) return null;
  const profiles = [
    ...((!activeProfiles || activeProfiles.includes("me")) ? [{ id:"me", name:"Mig", allergens: allergens || [] }] : []),
    ...(family || []).filter(m => !activeProfiles || activeProfiles.includes(m.id)),
  ];
  return (
    <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
      {profiles.map(p => {
        const hasDanger = p.allergens.some(a => allergenFlags[a] === "yes");
        const hasWarning = p.allergens.some(a => allergenFlags[a] === "traces");
        const color = hasDanger ? "#E63946" : hasWarning ? "#D97706" : "#22C55E";
        const bg = hasDanger ? "rgba(230,57,70,.12)" : hasWarning ? "rgba(217,119,6,.1)" : "rgba(34,197,94,.12)";
        return (
          <div key={p.id} title={p.id==="me"?"Din profil":p.name} style={{
            width:size, height:size, borderRadius:"50%",
            background:bg, border:`1.5px solid ${color}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:size*0.38, fontWeight:800, color, flexShrink:0,
            letterSpacing:"-.5px",
          }}>
            {initials(p.id==="me"?"Mig":p.name).slice(0,2)}
          </div>
        );
      })}
    </div>
  );
}

function PageID({ screen }) {
  const id = PAGE_IDS[screen] || "SCR-??";
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(id).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div
      onClick={copy}
      title="Klik for at kopiere side-ID"
      style={{
        position:"fixed", top:8, left:"50%", transform:"translateX(-50%)",
        zIndex:9999,
        fontSize:10, fontWeight:800,
        color: copied ? "#fff" : "#1F2733",
        background: copied ? "#22C55E" : "rgba(255,255,255,0.95)",
        border: copied ? "1.5px solid #22C55E" : "1.5px solid #D0D0C8",
        borderRadius:20, padding:"3px 12px", cursor:"pointer",
        letterSpacing:"1px", fontFamily:"monospace",
        boxShadow:"0 2px 10px rgba(0,0,0,0.15)",
        transition:"all .15s",
        userSelect:"none",
        whiteSpace:"nowrap",
      }}
    >
      {copied ? "✓ kopieret" : id}
    </div>
  );
}

// Kategori-ikoner når produktbillede mangler
function getProductIcon(product) {
  if (!product) return "🛒";
  const name = (product.name || "").toLowerCase();
  const cat = (product.category || "").toLowerCase();
  const combined = name + " " + cat;
  if (/mælk|fløde|smør|ost|yoghurt|skyr/.test(combined)) return "🥛";
  if (/brød|bolle|rugbrød|toast/.test(combined)) return "🍞";
  if (/chokolade|nutella|kakao/.test(combined)) return "🍫";
  if (/juice|saft|vand|cola|øl|vin/.test(combined)) return "🥤";
  if (/kylling|oksekød|svinekød|kød/.test(combined)) return "🥩";
  if (/laks|fisk|tun|rejer/.test(combined)) return "🐟";
  if (/pasta|spaghetti|makaroni/.test(combined)) return "🍝";
  if (/ris|grød|havre/.test(combined)) return "🍚";
  if (/chips|snack|popcorn/.test(combined)) return "🍿";
  if (/is|flødeis/.test(combined)) return "🍦";
  if (/æble|banan|appelsin|frugt/.test(combined)) return "🍎";
  if (/tomat|gulerod|grøntsag/.test(combined)) return "🥦";
  if (/olie|margarine/.test(combined)) return "🫒";
  if (/nødder|mandler|cashew/.test(combined)) return "🥜";
  if (/morgenmad|cornflakes|müsli/.test(combined)) return "🥣";
  return "🛒";
}

function ProductImage({ product, size = 64 }) {
  if (product?.image_url) {
    return (
      <>
        <img
          src={product.image_url}
          alt={product.name}
          style={{ width:size, height:size, objectFit:"contain", borderRadius:8 }}
          onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }}
        />
        <div style={{ width:size, height:size, background:"var(--paper2)", borderRadius:8, display:"none", alignItems:"center", justifyContent:"center", fontSize:size*0.5 }}>
          {getProductIcon(product)}
        </div>
      </>
    );
  }
  return (
    <div style={{ width:size, height:size, background:"var(--paper2)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.5 }}>
      {getProductIcon(product)}
    </div>
  );
}
const initials = n => (n||"").split(" ").filter(Boolean).map(w=>w[0]).join("").toUpperCase().slice(0,2)||"?";
const timeAgo = ts => { const d=Date.now()-new Date(ts).getTime(); if(d<60000)return"Lige nu"; if(d<3600000)return`${Math.floor(d/60000)} min siden`; if(d<86400000)return`${Math.floor(d/3600000)} t siden`; return`${Math.floor(d/86400000)} d siden`; };
const getAllergenLabels = (ids,custom=[]) => [...ids.map(id=>ALLERGENS.find(a=>a.id===id)).filter(Boolean).map(a=>`${a.emoji} ${a.label}`),...custom.map(c=>`✏️ ${c}`)];
const verifiedBadge = (v, source) => {
  if (v==="verified"||v===true) return {label:"✓ Verificeret",bg:"rgba(34,197,94,.1)",color:"#16a34a"};
  if (v==="partial") return {label:"⚡ Delvist verificeret",bg:"rgba(217,119,6,.08)",color:"#d97706"};
  if (source==="open_food_facts") return {label:"✓ Open Food Facts",bg:"rgba(37,99,235,.08)",color:"#2563eb"};
  return {label:"⚠️ Mangler data",bg:"rgba(230,57,70,.08)",color:"#e63946"};
};

// ─── SUPABASE API-HJÆLPER ────────────────────────────────────────────────────
function makeHeaders(token) {
  return {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY,
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
}

async function apiCall(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error_description || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

// ─── ALLERGEN SAMMENLIGNING ──────────────────────────────────────────────────
function compareAllergens(flags, activeAllergenIds) {
  if (!flags || activeAllergenIds.length === 0) return { status:"safe", matchedDanger:[], matchedWarning:[], hasUnknown:false };
  const matchedDanger = [];
  const matchedWarning = [];
  let hasUnknown = false;
  for (const id of activeAllergenIds) {
    const val = flags[id];
    if (val === "yes") matchedDanger.push(id);
    else if (val === "traces") matchedWarning.push(id);
    else if (val === "unknown") hasUnknown = true;
  }
  let status = "safe";
  if (matchedDanger.length > 0) status = "danger";
  else if (matchedWarning.length > 0) status = "warn";
  return { status, matchedDanger, matchedWarning, hasUnknown };
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

// ─── MADPAS — BUNDLED OVERSÆTTELSER ─────────────────────────────────────────
const MADPAS_LANGUAGES = [
  { code:"da", flag:"🇩🇰", name:"Dansk",      bcp:"da-DK" },
  { code:"en", flag:"🇬🇧", name:"English",    bcp:"en-GB" },
  { code:"de", flag:"🇩🇪", name:"Deutsch",    bcp:"de-DE" },
  { code:"fr", flag:"🇫🇷", name:"Français",   bcp:"fr-FR" },
  { code:"es", flag:"🇪🇸", name:"Español",    bcp:"es-ES" },
  { code:"it", flag:"🇮🇹", name:"Italiano",   bcp:"it-IT" },
  { code:"nl", flag:"🇳🇱", name:"Nederlands", bcp:"nl-NL" },
  { code:"pt", flag:"🇵🇹", name:"Português",  bcp:"pt-PT" },
  { code:"pl", flag:"🇵🇱", name:"Polski",     bcp:"pl-PL" },
  { code:"sv", flag:"🇸🇪", name:"Svenska",    bcp:"sv-SE" },
  { code:"no", flag:"🇳🇴", name:"Norsk",      bcp:"nb-NO" },
  { code:"ja", flag:"🇯🇵", name:"日本語",      bcp:"ja-JP" },
  { code:"zh", flag:"🇨🇳", name:"中文",        bcp:"zh-CN" },
  { code:"ar", flag:"🇸🇦", name:"العربية",    bcp:"ar-SA", rtl:true },
  { code:"tr", flag:"🇹🇷", name:"Türkçe",     bcp:"tr-TR" },
  { code:"th", flag:"🇹🇭", name:"ภาษาไทย",    bcp:"th-TH" },
  { code:"el", flag:"🇬🇷", name:"Ελληνικά",   bcp:"el-GR" },
];

const ALLERGEN_T = {
  gluten:      { en:{n:"Gluten",d:"Contains gluten (wheat, rye, barley, oats, spelt)"},de:{n:"Gluten",d:"Enthält Gluten (Weizen, Roggen, Gerste, Hafer, Dinkel)"},fr:{n:"Gluten",d:"Contient du gluten (blé, seigle, orge, avoine, épeautre)"},es:{n:"Gluten",d:"Contiene gluten (trigo, centeno, cebada, avena, espelta)"},it:{n:"Glutine",d:"Contiene glutine (frumento, segale, orzo, avena, farro)"},nl:{n:"Gluten",d:"Bevat gluten (tarwe, rogge, gerst, haver, spelt)"},pt:{n:"Glúten",d:"Contém glúten (trigo, centeio, cevada, aveia, espelta)"},pl:{n:"Gluten",d:"Zawiera gluten (pszenica, żyto, jęczmień, owies, orkisz)"},sv:{n:"Gluten",d:"Innehåller gluten (vete, råg, korn, havre, dinkel)"},no:{n:"Gluten",d:"Inneholder gluten (hvete, rug, bygg, havre, spelt)"},ja:{n:"グルテン",d:"グルテン含有（小麦・ライ麦・大麦・燕麦・スペルト小麦）"},zh:{n:"麸质",d:"含麸质（小麦、黑麦、大麦、燕麦、斯佩尔特小麦）"},ar:{n:"الغلوتين",d:"يحتوي على الغلوتين (قمح، جاودار، شعير، شوفان)"},tr:{n:"Gluten",d:"Gluten içerir (buğday, çavdar, arpa, yulaf, kavılca)"},th:{n:"กลูเตน",d:"มีกลูเตน (ข้าวสาลี, ข้าวไรย์, ข้าวบาร์เลย์, ข้าวโอ๊ต)"},el:{n:"Γλουτένη",d:"Περιέχει γλουτένη (σιτάρι, σίκαλη, κριθάρι, βρώμη, ζέα)"} },
  laktose:     { en:{n:"Lactose / Dairy",d:"Contains milk and dairy products (lactose)"},de:{n:"Laktose / Milch",d:"Enthält Milch und Milchprodukte (Laktose)"},fr:{n:"Lactose / Lait",d:"Contient du lait et des produits laitiers (lactose)"},es:{n:"Lactosa / Lácteos",d:"Contiene leche y productos lácteos (lactosa)"},it:{n:"Lattosio / Latte",d:"Contiene latte e latticini (lattosio)"},nl:{n:"Lactose / Melk",d:"Bevat melk en zuivelproducten (lactose)"},pt:{n:"Lactose / Leite",d:"Contém leite e produtos lácteos (lactose)"},pl:{n:"Laktoza / Mleko",d:"Zawiera mleko i produkty mleczne (laktoza)"},sv:{n:"Laktos / Mjölk",d:"Innehåller mjölk och mjölkprodukter (laktos)"},no:{n:"Laktose / Melk",d:"Inneholder melk og meieriprodukter (laktose)"},ja:{n:"乳糖 / 乳製品",d:"牛乳および乳製品を含む（ラクトース）"},zh:{n:"乳糖 / 乳制品",d:"含有牛奶和乳制品（乳糖）"},ar:{n:"اللاكتوز / الألبان",d:"يحتوي على الحليب ومنتجات الألبان"},tr:{n:"Laktoz / Süt",d:"Süt ve süt ürünleri içerir (laktoz)"},th:{n:"แลคโตส / นม",d:"มีนมและผลิตภัณฑ์จากนม (แลคโตส)"},el:{n:"Λακτόζη / Γάλα",d:"Περιέχει γάλα και γαλακτοκομικά (λακτόζη)"} },
  aeg:         { en:{n:"Eggs",d:"Contains eggs and egg products"},de:{n:"Ei",d:"Enthält Eier und Eiprodukte"},fr:{n:"Œufs",d:"Contient des œufs et ovoproduits"},es:{n:"Huevos",d:"Contiene huevos y ovoproductos"},it:{n:"Uova",d:"Contiene uova e ovoprodotti"},nl:{n:"Eieren",d:"Bevat eieren en eiproducten"},pt:{n:"Ovos",d:"Contém ovos e produtos à base de ovos"},pl:{n:"Jaja",d:"Zawiera jaja i produkty na bazie jaj"},sv:{n:"Ägg",d:"Innehåller ägg och äggprodukter"},no:{n:"Egg",d:"Inneholder egg og eggprodukter"},ja:{n:"卵",d:"卵および卵製品を含む"},zh:{n:"鸡蛋",d:"含有鸡蛋和蛋制品"},ar:{n:"البيض",d:"يحتوي على البيض ومنتجاته"},tr:{n:"Yumurta",d:"Yumurta ve yumurta ürünleri içerir"},th:{n:"ไข่",d:"มีไข่และผลิตภัณฑ์จากไข่"},el:{n:"Αυγά",d:"Περιέχει αυγά και προϊόντα αυγών"} },
  noedder:     { en:{n:"Tree Nuts",d:"Contains nuts (almonds, hazelnuts, walnuts, cashews, pistachios etc.)"},de:{n:"Schalenfrüchte",d:"Enthält Nüsse (Mandeln, Haselnüsse, Walnüsse, Cashews, Pistazien usw.)"},fr:{n:"Fruits à coque",d:"Contient des fruits à coque (amandes, noisettes, noix, cajou, pistaches, etc.)"},es:{n:"Frutos secos",d:"Contiene frutos secos (almendras, avellanas, nueces, anacardos, pistachos, etc.)"},it:{n:"Frutta a guscio",d:"Contiene frutta a guscio (mandorle, nocciole, noci, anacardi, pistacchi ecc.)"},nl:{n:"Noten",d:"Bevat noten (amandelen, hazelnoten, walnoten, cashewnoten, pistachenoten, etc.)"},pt:{n:"Frutos de casca rija",d:"Contém frutos de casca rija (amêndoas, avelãs, nozes, cajus, pistáchios, etc.)"},pl:{n:"Orzechy",d:"Zawiera orzechy (migdały, orzechy laskowe, włoskie, nerkowce, pistacje itp.)"},sv:{n:"Nötter",d:"Innehåller nötter (mandlar, hasselnötter, valnötter, cashewnötter, pistaschnötter m.fl.)"},no:{n:"Nøtter",d:"Inneholder nøtter (mandler, hasselnøtter, valnøtter, cashewnøtter, pistasjnøtter m.fl.)"},ja:{n:"ナッツ類",d:"ナッツ類含有（アーモンド・ヘーゼルナッツ・クルミ・カシューナッツ・ピスタチオ等）"},zh:{n:"坚果",d:"含有坚果（杏仁、榛子、核桃、腰果、开心果等）"},ar:{n:"المكسرات",d:"يحتوي على المكسرات (اللوز، البندق، الجوز، الكاجو، الفستق)"},tr:{n:"Kabuklu Yemişler",d:"Kabuklu yemiş içerir (badem, fındık, ceviz, kaju, antep fıstığı vb.)"},th:{n:"ถั่วต้นไม้",d:"มีถั่ว (อัลมอนด์, เฮเซลนัท, วอลนัท, มะม่วงหิมพานต์, พิสตาชิโอ)"},el:{n:"Ξηροί καρποί",d:"Περιέχει ξηρούς καρπούς (αμύγδαλα, φουντούκια, καρύδια, κάσιους, φιστίκια)"} },
  jordnoedder: { en:{n:"Peanuts",d:"Contains peanuts and peanut products"},de:{n:"Erdnüsse",d:"Enthält Erdnüsse und Erdnussprodukte"},fr:{n:"Arachides",d:"Contient des arachides (cacahuètes) et produits"},es:{n:"Cacahuetes",d:"Contiene cacahuetes y productos a base de cacahuetes"},it:{n:"Arachidi",d:"Contiene arachidi e prodotti a base di arachidi"},nl:{n:"Pinda's",d:"Bevat pinda's en pindaproducten"},pt:{n:"Amendoins",d:"Contém amendoins e produtos à base de amendoins"},pl:{n:"Orzeszki ziemne",d:"Zawiera orzeszki ziemne i produkty z orzeszków ziemnych"},sv:{n:"Jordnötter",d:"Innehåller jordnötter och jordnötsprodukter"},no:{n:"Peanøtter",d:"Inneholder peanøtter og peanøttprodukter"},ja:{n:"ピーナッツ",d:"ピーナッツおよびピーナッツ製品を含む"},zh:{n:"花生",d:"含有花生和花生制品"},ar:{n:"الفول السوداني",d:"يحتوي على الفول السوداني ومنتجاته"},tr:{n:"Yerfıstığı",d:"Yerfıstığı ve yerfıstığı ürünleri içerir"},th:{n:"ถั่วลิสง",d:"มีถั่วลิสงและผลิตภัณฑ์จากถั่วลิสง"},el:{n:"Φιστίκια",d:"Περιέχει φιστίκια και προϊόντα φιστικιών"} },
  soja:        { en:{n:"Soy / Soya",d:"Contains soy and soy-based products"},de:{n:"Soja",d:"Enthält Soja und sojahaltige Produkte"},fr:{n:"Soja",d:"Contient du soja et des produits à base de soja"},es:{n:"Soja",d:"Contiene soja y productos a base de soja"},it:{n:"Soia",d:"Contiene soia e prodotti a base di soia"},nl:{n:"Soja",d:"Bevat soja en sojaproducten"},pt:{n:"Soja",d:"Contém soja e produtos à base de soja"},pl:{n:"Soja",d:"Zawiera soję i produkty sojowe"},sv:{n:"Soja",d:"Innehåller soja och sojabaserade produkter"},no:{n:"Soya",d:"Inneholder soya og soyabaserte produkter"},ja:{n:"大豆",d:"大豆および大豆製品を含む"},zh:{n:"大豆",d:"含有大豆和大豆制品"},ar:{n:"الصويا",d:"يحتوي على الصويا ومنتجاتها"},tr:{n:"Soya",d:"Soya ve soya ürünleri içerir"},th:{n:"ถั่วเหลือง",d:"มีถั่วเหลืองและผลิตภัณฑ์จากถั่วเหลือง"},el:{n:"Σόγια",d:"Περιέχει σόγια και προϊόντα σόγιας"} },
  fisk:        { en:{n:"Fish",d:"Contains fish and fish products"},de:{n:"Fisch",d:"Enthält Fisch und Fischprodukte"},fr:{n:"Poisson",d:"Contient du poisson et des produits à base de poisson"},es:{n:"Pescado",d:"Contiene pescado y productos a base de pescado"},it:{n:"Pesce",d:"Contiene pesce e prodotti ittici"},nl:{n:"Vis",d:"Bevat vis en visproducten"},pt:{n:"Peixe",d:"Contém peixe e produtos à base de peixe"},pl:{n:"Ryby",d:"Zawiera ryby i produkty rybne"},sv:{n:"Fisk",d:"Innehåller fisk och fiskprodukter"},no:{n:"Fisk",d:"Inneholder fisk og fiskeprodukter"},ja:{n:"魚",d:"魚および魚製品を含む"},zh:{n:"鱼类",d:"含有鱼和鱼制品"},ar:{n:"السمك",d:"يحتوي على السمك ومنتجاته"},tr:{n:"Balık",d:"Balık ve balık ürünleri içerir"},th:{n:"ปลา",d:"มีปลาและผลิตภัณฑ์จากปลา"},el:{n:"Ψάρι",d:"Περιέχει ψάρι και προϊόντα ψαριού"} },
  skaldyr:     { en:{n:"Shellfish / Crustaceans",d:"Contains crustaceans and shellfish (shrimp, crab, lobster, mussels etc.)"},de:{n:"Krebstiere / Schalentiere",d:"Enthält Krebstiere und Schalentiere (Garnelen, Krabben, Hummer, Muscheln)"},fr:{n:"Crustacés / Mollusques",d:"Contient des crustacés et mollusques (crevettes, crabe, homard, moules)"},es:{n:"Crustáceos / Mariscos",d:"Contiene crustáceos y mariscos (gambas, cangrejo, langosta, mejillones)"},it:{n:"Crostacei / Molluschi",d:"Contiene crostacei e molluschi (gamberi, granchio, aragosta, cozze)"},nl:{n:"Schaaldieren",d:"Bevat schaaldieren (garnalen, krab, kreeft, mosselen)"},pt:{n:"Crustáceos / Moluscos",d:"Contém crustáceos e moluscos (camarão, caranguejo, lagosta, mexilhões)"},pl:{n:"Skorupiaki",d:"Zawiera skorupiaki (krewetki, kraby, homary, małże)"},sv:{n:"Skaldjur",d:"Innehåller skaldjur (räkor, krabba, hummer, musslor)"},no:{n:"Skalldyr",d:"Inneholder skalldyr (reker, krabbe, hummer, muslinger)"},ja:{n:"甲殻類・貝類",d:"甲殻類・貝類含有（エビ・カニ・ロブスター・ムール貝等）"},zh:{n:"甲壳类 / 贝类",d:"含有甲壳类和贝类（虾、蟹、龙虾、贻贝等）"},ar:{n:"القشريات والمحار",d:"يحتوي على القشريات والمحار"},tr:{n:"Kabuklu Deniz Ürünleri",d:"Kabuklu deniz ürünleri içerir (karides, yengeç, ıstakoz, midye)"},th:{n:"สัตว์มีเปลือก",d:"มีสัตว์มีเปลือก (กุ้ง, ปู, กุ้งมังกร, หอย)"},el:{n:"Οστρακοειδή",d:"Περιέχει οστρακοειδή (γαρίδες, καβούρι, αστακός, μύδια)"} },
  selleri:     { en:{n:"Celery",d:"Contains celery and celery products"},de:{n:"Sellerie",d:"Enthält Sellerie und Sellerieprodukte"},fr:{n:"Céleri",d:"Contient du céleri et produits à base de céleri"},es:{n:"Apio",d:"Contiene apio y productos a base de apio"},it:{n:"Sedano",d:"Contiene sedano e prodotti a base di sedano"},nl:{n:"Selderij",d:"Bevat selderij en selderijproducten"},pt:{n:"Aipo",d:"Contém aipo e produtos à base de aipo"},pl:{n:"Seler",d:"Zawiera seler i produkty na bazie selera"},sv:{n:"Selleri",d:"Innehåller selleri och selleriprodukter"},no:{n:"Selleri",d:"Inneholder selleri og selleriprodukter"},ja:{n:"セロリ",d:"セロリおよびセロリ製品を含む"},zh:{n:"芹菜",d:"含有芹菜和芹菜制品"},ar:{n:"الكرفس",d:"يحتوي على الكرفس ومنتجاته"},tr:{n:"Kereviz",d:"Kereviz ve kereviz ürünleri içerir"},th:{n:"คื่นฉ่าย",d:"มีคื่นฉ่ายและผลิตภัณฑ์จากคื่นฉ่าย"},el:{n:"Σέλινο",d:"Περιέχει σέλινο και προϊόντα σέλινου"} },
  sennep:      { en:{n:"Mustard",d:"Contains mustard and mustard products"},de:{n:"Senf",d:"Enthält Senf und Senfprodukte"},fr:{n:"Moutarde",d:"Contient de la moutarde et produits à base de moutarde"},es:{n:"Mostaza",d:"Contiene mostaza y productos a base de mostaza"},it:{n:"Senape",d:"Contiene senape e prodotti a base di senape"},nl:{n:"Mosterd",d:"Bevat mosterd en mosterdbevattende producten"},pt:{n:"Mostarda",d:"Contém mostarda e produtos à base de mostarda"},pl:{n:"Gorczyca",d:"Zawiera gorczycę i produkty na bazie gorczycy"},sv:{n:"Senap",d:"Innehåller senap och senapsprodukter"},no:{n:"Sennep",d:"Inneholder sennep og sennepsprodukter"},ja:{n:"マスタード",d:"マスタードおよびマスタード製品を含む"},zh:{n:"芥末",d:"含有芥末和芥末制品"},ar:{n:"الخردل",d:"يحتوي على الخردل ومنتجاته"},tr:{n:"Hardal",d:"Hardal ve hardal ürünleri içerir"},th:{n:"มัสตาร์ด",d:"มีมัสตาร์ดและผลิตภัณฑ์จากมัสตาร์ด"},el:{n:"Μουστάρδα",d:"Περιέχει μουστάρδα και προϊόντα μουστάρδας"} },
  sesam:       { en:{n:"Sesame",d:"Contains sesame seeds and sesame products"},de:{n:"Sesam",d:"Enthält Sesamsamen und Sesamprodukte"},fr:{n:"Sésame",d:"Contient des graines de sésame et produits à base de sésame"},es:{n:"Sésamo",d:"Contiene semillas de sésamo y productos a base de sésamo"},it:{n:"Sesamo",d:"Contiene semi di sesamo e prodotti a base di sesamo"},nl:{n:"Sesam",d:"Bevat sesamzaad en sesamproducten"},pt:{n:"Sésamo",d:"Contém sementes de sésamo e produtos à base de sésamo"},pl:{n:"Sezam",d:"Zawiera ziarna sezamu i produkty sezamowe"},sv:{n:"Sesam",d:"Innehåller sesamfrön och sesamprodukter"},no:{n:"Sesam",d:"Inneholder sesamfrø og sesamprodukter"},ja:{n:"ゴマ",d:"ゴマおよびゴマ製品を含む"},zh:{n:"芝麻",d:"含有芝麻和芝麻制品"},ar:{n:"السمسم",d:"يحتوي على بذور السمسم ومنتجاته"},tr:{n:"Susam",d:"Susam tohumu ve susam ürünleri içerir"},th:{n:"งา",d:"มีเมล็ดงาและผลิตภัณฑ์จากงา"},el:{n:"Σουσάμι",d:"Περιέχει σουσάμι και προϊόντα σουσαμιού"} },
  svovl:       { en:{n:"Sulphites / Sulfites",d:"Contains sulphites/sulphur dioxide (preservative)"},de:{n:"Sulfite / SO₂",d:"Enthält Sulfite/Schwefeldioxid (Konservierungsmittel)"},fr:{n:"Sulfites / SO₂",d:"Contient des sulfites/dioxyde de soufre (conservateur)"},es:{n:"Sulfitos / SO₂",d:"Contiene sulfitos/dióxido de azufre (conservante)"},it:{n:"Solfiti / SO₂",d:"Contiene solfiti/anidride solforosa (conservante)"},nl:{n:"Sulfieten / SO₂",d:"Bevat sulfieten/zwaveldioxide (conserveermiddel)"},pt:{n:"Sulfitos / SO₂",d:"Contém sulfitos/dióxido de enxofre (conservante)"},pl:{n:"Siarczyny / SO₂",d:"Zawiera siarczyny/dwutlenek siarki (konserwant)"},sv:{n:"Sulfiter / SO₂",d:"Innehåller sulfiter/svaveldioxid (konserveringsmedel)"},no:{n:"Sulfitter / SO₂",d:"Inneholder sulfitter/svoveldioksid (konserveringsmiddel)"},ja:{n:"亜硫酸塩 / SO₂",d:"亜硫酸塩/二酸化硫黄を含む（保存料）"},zh:{n:"亚硫酸盐 / SO₂",d:"含有亚硫酸盐/二氧化硫（防腐剂）"},ar:{n:"الكبريتيت / SO₂",d:"يحتوي على الكبريتيت (مادة حافظة)"},tr:{n:"Sülfit / SO₂",d:"Sülfit/kükürt dioksit içerir (koruyucu)"},th:{n:"ซัลไฟต์ / SO₂",d:"มีซัลไฟต์/ซัลเฟอร์ไดออกไซด์ (สารกันบูด)"},el:{n:"Θειώδη / SO₂",d:"Περιέχει θειώδη/διοξείδιο του θείου (συντηρητικό)"} },
  lupin:       { en:{n:"Lupin",d:"Contains lupin and lupin-based products"},de:{n:"Lupinen",d:"Enthält Lupinen und Lupinenprodukte"},fr:{n:"Lupin",d:"Contient du lupin et des produits à base de lupin"},es:{n:"Altramuz",d:"Contiene altramuz y productos a base de altramuz"},it:{n:"Lupini",d:"Contiene lupini e prodotti a base di lupini"},nl:{n:"Lupine",d:"Bevat lupine en lupineproducten"},pt:{n:"Tremoço",d:"Contém tremoço e produtos à base de tremoço"},pl:{n:"Łubin",d:"Zawiera łubin i produkty z łubinu"},sv:{n:"Lupin",d:"Innehåller lupin och lupinbaserade produkter"},no:{n:"Lupin",d:"Inneholder lupin og lupinbaserte produkter"},ja:{n:"ルピナス",d:"ルピナスおよびルピナス製品を含む"},zh:{n:"羽扇豆",d:"含有羽扇豆和羽扇豆制品"},ar:{n:"الترمس",d:"يحتوي على الترمس ومنتجاته"},tr:{n:"Lupin",d:"Lupin ve lupin ürünleri içerir"},th:{n:"ลูพิน",d:"มีลูพินและผลิตภัณฑ์จากลูพิน"},el:{n:"Λούπινα",d:"Περιέχει λούπινα και προϊόντα λούπινων"} },
  bloeddyr:    { en:{n:"Molluscs",d:"Contains molluscs (squid, oysters, mussels, snails etc.)"},de:{n:"Weichtiere",d:"Enthält Weichtiere (Tintenfisch, Austern, Muscheln, Schnecken)"},fr:{n:"Mollusques",d:"Contient des mollusques (calamar, huîtres, moules, escargots)"},es:{n:"Moluscos",d:"Contiene moluscos (calamar, ostras, mejillones, caracoles)"},it:{n:"Molluschi",d:"Contiene molluschi (calamari, ostriche, cozze, lumache)"},nl:{n:"Weekdieren",d:"Bevat weekdieren (inktvis, oesters, mosselen, slakken)"},pt:{n:"Moluscos",d:"Contém moluscos (lulas, ostras, mexilhões, caracóis)"},pl:{n:"Mięczaki",d:"Zawiera mięczaki (kałamarnica, ostrygi, małże, ślimaki)"},sv:{n:"Blötdjur",d:"Innehåller blötdjur (bläckfisk, ostron, musslor, sniglar)"},no:{n:"Bløtdyr",d:"Inneholder bløtdyr (blekksprut, østers, muslinger, snegler)"},ja:{n:"軟体動物",d:"軟体動物含有（イカ・カキ・ムール貝・カタツムリ等）"},zh:{n:"软体动物",d:"含有软体动物（鱿鱼、牡蛎、贻贝、蜗牛等）"},ar:{n:"الرخويات",d:"يحتوي على الرخويات (الحبار، المحار، بلح البحر)"},tr:{n:"Yumuşakçalar",d:"Yumuşakça içerir (kalamar, istiridye, midye, salyangoz)"},th:{n:"หอย / ปลาหมึก",d:"มีสัตว์จำพวกหอย (ปลาหมึก, หอยนางรม, หอยแมลงภู่)"},el:{n:"Μαλάκια",d:"Περιέχει μαλάκια (καλαμάρι, στρείδια, μύδια, σαλιγκάρια)"} },
};

const MADPAS_INTRO = {
  da:"Jeg har følgende fødevareallergier og intoleranser. Vær venlig at sikre, at min mad ikke indeholder nogen af disse.",
  en:"I have the following food allergies and intolerances. Please ensure my meal does not contain any of these.",
  de:"Ich habe folgende Lebensmittelallergien und Unverträglichkeiten. Bitte stellen Sie sicher, dass mein Essen keines davon enthält.",
  fr:"J'ai les allergies alimentaires et intolérances suivantes. Veuillez vous assurer que mon repas n'en contient aucune.",
  es:"Tengo las siguientes alergias alimentarias e intolerancias. Por favor, asegúrese de que mi comida no contenga ninguno de estos.",
  it:"Ho le seguenti allergie alimentari e intolleranze. Si prega di assicurarsi che il mio pasto non contenga nessuno di questi.",
  nl:"Ik heb de volgende voedselallergieën en intoleranties. Zorg er alstublieft voor dat mijn maaltijd geen van deze bevat.",
  pt:"Tenho as seguintes alergias alimentares e intolerâncias. Por favor, certifique-se de que a minha refeição não contém nenhum destes.",
  pl:"Mam następujące alergie pokarmowe i nietolerancje. Proszę upewnić się, że moje jedzenie nie zawiera żadnego z tych składników.",
  sv:"Jag har följande matallergier och intoleranser. Vänligen se till att min måltid inte innehåller något av dessa.",
  no:"Jeg har følgende matallergier og intoleranser. Vennligst sørg for at mitt måltid ikke inneholder noen av disse.",
  ja:"私は以下の食物アレルギーと不耐症があります。私の食事にこれらが含まれないようにしてください。",
  zh:"我有以下食物过敏和不耐受。请确保我的餐食不含以下任何成分。",
  ar:"لدي الحساسية الغذائية والتعصبات التالية. يرجى التأكد من أن وجبتي لا تحتوي على أي من هذه العناصر.",
  tr:"Aşağıdaki gıda alerjilerim ve intoleranslarım var. Lütfen yemeğimin bunlardan hiçbirini içermediğinden emin olun.",
  th:"ฉันมีการแพ้อาหารและการแพ้ต่อไปนี้ กรุณาตรวจสอบให้แน่ใจว่าอาหารของฉันไม่มีสิ่งเหล่านี้",
  el:"Έχω τις ακόλουθες αλλεργίες και δυσανεξίες. Παρακαλώ βεβαιωθείτε ότι το γεύμα μου δεν περιέχει κανένα από αυτά.",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700;1,800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  /* Logo-afledte farver */
  --ink:#1F2733;        /* logoets stregkode-farve */
  --ink2:#2d3a48;       /* lidt lysere ink */
  --ink3:#3d4e5e;       /* endnu lysere */
  --paper:#FAFAF7;      /* logoets baggrund */
  --paper2:#F2F2EE;     /* lidt mørkere paper */
  --green:#22C55E;      /* signalgrøn fra logoet */
  --green-glow:#4ADE80; /* glow-grøn fra logoet */
  --green-lt:rgba(34,197,94,.1);
  --green-mid:rgba(34,197,94,.18);
  --border:#E4E4DF;     /* diskret paper-farvet border */
  --border2:#D0D0C8;    /* lidt tydeligere */
  --red:#E63946;--red-lt:rgba(230,57,70,.08);--red-md:rgba(230,57,70,.15);
  --amber:#D97706;--amber-lt:rgba(217,119,6,.08);--amber-md:rgba(217,119,6,.14);
  --blue:#2563EB;--blue-lt:rgba(37,99,235,.08);
  --muted:#8A9099;      /* grå-blå neutral */
  --muted2:#6B7280;
  --r:12px;
  --f:'Inter',system-ui,sans-serif;
  --sh:0 1px 3px rgba(31,39,51,.06),0 2px 8px rgba(31,39,51,.05);
  --sh2:0 4px 16px rgba(31,39,51,.12);
  --sh3:0 8px 32px rgba(31,39,51,.16);
}
body{background:var(--paper);color:var(--ink);font-family:var(--f);-webkit-font-smoothing:antialiased;}
.app{max-width:390px;margin:0 auto;min-height:100vh;display:flex;flex-direction:column;background:var(--paper);width:100%;position:relative;overflow-x:hidden;}

/* ── TOPBAR ── */
.topbar{background:var(--paper);border-bottom:1px solid var(--border);padding:12px 18px 10px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:60;backdrop-filter:blur(8px);}
.topbar-logo{display:flex;align-items:center;gap:8px;}
.topbar-shield{width:32px;height:32px;background:none;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;}
.topbar-name{font-size:17px;font-weight:800;color:var(--ink);letter-spacing:-.5px;font-family:var(--f);}
.topbar-name span{color:var(--green);font-style:italic;font-weight:800;}
.topbar-avatar{width:32px;height:32px;background:var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--paper);cursor:pointer;transition:all .15s;letter-spacing:.5px;}
.topbar-avatar:hover{background:var(--ink2);}

/* ── LAYOUT ── */
.screen{flex:1;padding:0 16px 110px;}
.bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:390px;background:var(--paper);border-top:1px solid var(--border);display:flex;padding:6px 4px 16px;z-index:100;box-shadow:0 -1px 0 var(--border),0 -4px 16px rgba(31,39,51,.06);}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;opacity:.3;transition:all .15s;}
.nav-item.active{opacity:1;}
.nav-icon{width:42px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:8px;transition:background .15s;}
.nav-item.active .nav-icon{background:var(--green-lt);}
.nav-lbl{font-size:9.5px;font-weight:700;color:var(--ink);letter-spacing:.2px;}
.nav-item.active .nav-lbl{color:var(--green);}

/* ── CARDS & COMPONENTS ── */
.card{background:#fff;border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:10px;box-shadow:var(--sh);}
.card-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin-bottom:10px;}
.card-title{font-size:15px;font-weight:800;color:var(--ink);margin-bottom:4px;letter-spacing:-.2px;}
.field{width:100%;background:var(--paper2);border:1.5px solid var(--border2);border-radius:10px;padding:11px 14px;color:var(--ink);font-family:var(--f);font-size:15px;outline:none;transition:border-color .15s,background .15s;}
.field:focus{border-color:var(--green);background:#fff;box-shadow:0 0 0 3px var(--green-lt);}
.field-lbl{font-size:11.5px;font-weight:700;color:var(--ink2);margin-bottom:5px;display:block;letter-spacing:.1px;}
.input-row{display:flex;gap:8px;}

/* ── BUTTONS ── */
.btn{padding:12px 20px;border-radius:10px;border:none;font-family:var(--f);font-size:14px;font-weight:700;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;justify-content:center;gap:6px;letter-spacing:-.1px;}
.btn-full{width:100%;}
.btn-primary{background:var(--ink);color:var(--paper);box-shadow:0 2px 8px rgba(31,39,51,.2);}
.btn-primary:hover{background:var(--ink2);transform:translateY(-1px);box-shadow:var(--sh2);}
.btn-green{background:var(--green);color:#fff;box-shadow:0 2px 8px rgba(34,197,94,.25);}
.btn-green:hover{background:var(--green-glow);transform:translateY(-1px);}
.btn-outline{background:transparent;color:var(--ink);border:1.5px solid var(--border2);}
.btn-outline:hover{border-color:var(--ink);background:var(--paper2);}
.btn-danger{background:transparent;color:var(--red);border:1.5px solid rgba(230,57,70,.3);}
.btn-danger:hover{background:var(--red-lt);}
.btn-sm{padding:7px 13px;font-size:12.5px;border-radius:8px;}
.btn-ghost{background:var(--paper2);color:var(--ink2);border:1px solid var(--border);}
.btn-ghost:hover{background:var(--border);color:var(--ink);}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important;}

/* ── CHIPS & TAGS ── */
.chip-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.chip{display:flex;align-items:center;gap:8px;padding:9px 11px;border-radius:10px;border:1.5px solid var(--border2);background:#fff;cursor:pointer;transition:all .15s;font-size:12.5px;font-weight:600;color:var(--muted2);user-select:none;}
.chip:hover{border-color:var(--ink3);color:var(--ink);}
.chip.on{border-color:var(--green);background:var(--green-lt);color:var(--ink);font-weight:700;}
.chip-check{margin-left:auto;width:16px;height:16px;background:var(--green);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;color:#fff;flex-shrink:0;}
.tags{display:flex;flex-wrap:wrap;gap:5px;}
.tag{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:var(--green-lt);border:1px solid var(--green-mid);border-radius:100px;font-size:12px;color:var(--ink);font-weight:600;}
.tag-x{cursor:pointer;opacity:.4;font-size:13px;margin-left:1px;}.tag-x:hover{opacity:.8;}

/* ── BADGES ── */
.badge{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:6px;white-space:nowrap;letter-spacing:.2px;}
.badge.safe{background:var(--green-lt);color:var(--green);border:1px solid var(--green-mid);}
.badge.danger{background:var(--red-lt);color:var(--red);border:1px solid var(--red-md);}
.badge.warn{background:var(--amber-lt);color:var(--amber);border:1px solid var(--amber-md);}

.divider{display:flex;align-items:center;gap:10px;margin:12px 0;color:var(--muted);font-size:11.5px;font-weight:600;letter-spacing:.3px;}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border);}

/* ── WELCOME ── */
.welcome-screen{min-height:100vh;background:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 28px;text-align:center;}
.welcome-logo-wrap{display:flex;flex-direction:column;align-items:center;margin-bottom:40px;}
.welcome-wordmark{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:20px;}
.welcome-wordmark-text{font-family:var(--f);font-size:32px;font-weight:800;color:var(--ink);letter-spacing:-.8px;line-height:1;}
.welcome-wordmark-text span{color:var(--green);font-style:italic;font-weight:800;}
.welcome-tagline{font-size:15px;color:var(--muted);margin-top:10px;letter-spacing:.2px;font-weight:400;}
.welcome-divider{width:40px;height:2px;background:var(--border2);border-radius:2px;margin:32px auto;}
.welcome-features{display:flex;flex-direction:column;gap:14px;margin-bottom:44px;width:100%;}
.welcome-feat{display:flex;align-items:center;gap:14px;text-align:left;padding:12px 14px;background:#fff;border:1px solid var(--border);border-radius:12px;}
.welcome-feat-icon{width:38px;height:38px;background:var(--green-lt);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
.welcome-feat-text{font-size:13px;color:var(--muted2);font-weight:500;line-height:1.45;}
.welcome-feat-text strong{color:var(--ink);font-weight:700;display:block;margin-bottom:2px;}
.welcome-btn{background:var(--ink);color:var(--paper);border:none;border-radius:12px;padding:15px 32px;font-family:var(--f);font-size:15px;font-weight:700;cursor:pointer;width:100%;transition:all .18s;margin-bottom:10px;letter-spacing:-.1px;box-shadow:0 2px 10px rgba(31,39,51,.15);}
.welcome-btn:hover{background:var(--ink2);transform:translateY(-1px);}
.welcome-btn-ghost{background:transparent;color:var(--ink2);border:1.5px solid var(--border2);border-radius:12px;padding:13px 32px;font-family:var(--f);font-size:14px;font-weight:600;cursor:pointer;width:100%;transition:all .18s;}
.welcome-btn-ghost:hover{background:var(--paper2);}

/* ── LOGIN ── */
.login-wrap{min-height:100vh;background:var(--paper);display:flex;flex-direction:column;padding:48px 20px 32px;}
.login-header{text-align:center;margin-bottom:28px;}
.login-shield{width:64px;height:64px;background:none;border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;overflow:hidden;}
.login-title{font-size:24px;font-weight:800;color:var(--ink);letter-spacing:-.5px;}
.login-sub{font-size:13px;color:var(--muted);margin-top:4px;}

/* ── ONBOARDING ── */
.onboard-wrap{padding:20px 16px 100px;}
.step-seg{height:3px;flex:1;border-radius:2px;background:var(--border2);transition:background .3s;}
.step-seg.done{background:var(--green);}
.step-num{font-size:11px;font-weight:700;color:var(--muted);white-space:nowrap;}
.step-title{font-size:17px;font-weight:800;margin-bottom:5px;color:var(--ink);letter-spacing:-.3px;}
.step-sub{font-size:13px;color:var(--muted2);margin-bottom:16px;line-height:1.55;}
.onboard-skip{font-size:12px;color:var(--muted);text-align:center;margin-top:8px;}

/* ── HOME ── */
.greeting{padding:20px 0 14px;}
.greeting-main{font-size:21px;font-weight:800;color:var(--ink);letter-spacing:-.4px;}
.greeting-sub{font-size:13px;color:var(--muted2);margin-top:3px;font-weight:500;}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.stat-card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px;box-shadow:var(--sh);}
.stat-num{font-size:26px;font-weight:800;color:var(--ink);line-height:1;letter-spacing:-.5px;}
.stat-lbl{font-size:11px;color:var(--muted);margin-top:4px;font-weight:600;letter-spacing:.2px;}
.scan-hero{background:var(--ink);border-radius:16px;padding:20px 18px;margin-bottom:10px;display:flex;align-items:center;gap:16px;cursor:pointer;transition:all .18s;box-shadow:var(--sh2);position:relative;overflow:hidden;}
.scan-hero::after{content:'';position:absolute;right:-10px;bottom:-10px;width:80px;height:80px;background:radial-gradient(circle,rgba(34,197,94,.15) 0%,transparent 70%);pointer-events:none;}
.scan-hero:hover{transform:translateY(-2px);box-shadow:var(--sh3);}
.scan-hero-icon{font-size:36px;flex-shrink:0;filter:grayscale(1) brightness(3);}
.scan-hero-title{font-size:18px;font-weight:800;color:var(--paper);letter-spacing:-.4px;}
.scan-hero-sub{font-size:12px;color:rgba(250,250,247,.45);margin-top:3px;font-weight:500;}
.scan-hero-arrow{font-size:18px;color:var(--green);margin-left:auto;flex-shrink:0;}
.quick-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.quick-btn{background:#fff;border:1px solid var(--border);border-radius:12px;padding:14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .15s;box-shadow:var(--sh);}
.quick-btn:hover{border-color:var(--green-mid);background:var(--green-lt);}
.quick-icon{font-size:20px;flex-shrink:0;}
.quick-label{font-size:13px;font-weight:700;color:var(--ink);letter-spacing:-.1px;}

/* ── SCAN ── */
.scan-box{background:var(--ink);border-radius:16px;overflow:hidden;margin-bottom:12px;position:relative;}
.scan-viewfinder{height:220px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;position:relative;cursor:pointer;}
.scan-corner{position:absolute;width:28px;height:28px;border-color:rgba(250,250,247,.5);border-style:solid;border-width:0;}
.scan-corner.tl{top:18px;left:18px;border-top-width:2.5px;border-left-width:2.5px;border-radius:3px 0 0 0;}
.scan-corner.tr{top:18px;right:18px;border-top-width:2.5px;border-right-width:2.5px;border-radius:0 3px 0 0;}
.scan-corner.bl{bottom:18px;left:18px;border-bottom-width:2.5px;border-left-width:2.5px;border-radius:0 0 0 3px;}
.scan-corner.br{bottom:18px;right:18px;border-bottom-width:2.5px;border-right-width:2.5px;border-radius:0 0 3px 0;}
.scan-laser{position:absolute;left:22px;right:22px;height:2px;background:linear-gradient(90deg,transparent,var(--green),var(--green-glow),var(--green),transparent);animation:laserMove 2s ease-in-out infinite;filter:drop-shadow(0 0 4px var(--green));}
@keyframes laserMove{0%,100%{top:20px;opacity:.4;}50%{top:calc(100% - 20px);opacity:1;}}
.scan-camera-text{color:rgba(250,250,247,.45);font-size:12.5px;font-weight:600;position:relative;z-index:1;letter-spacing:.1px;}
.scan-camera-icon{font-size:40px;position:relative;z-index:1;filter:grayscale(1) brightness(3) opacity(.6);}
.scan-bar{background:rgba(0,0,0,.25);padding:11px 16px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(250,250,247,.06);}
.scan-bar-txt{color:rgba(250,250,247,.5);font-size:11.5px;font-weight:600;}

/* ── RESULT ── */
.result-banner{border-radius:12px;padding:16px 18px;margin-bottom:10px;display:flex;align-items:center;gap:14px;}
.result-banner.safe{background:var(--green-lt);border:1px solid var(--green-mid);}
.result-banner.danger{background:var(--red-lt);border:1px solid var(--red-md);}
.result-banner.warn{background:var(--amber-lt);border:1px solid var(--amber-md);}
.result-banner.unknown{background:var(--paper2);border:1px solid var(--border2);}
.rb-icon{font-size:34px;flex-shrink:0;}
.rb-title{font-size:18px;font-weight:800;letter-spacing:-.3px;}
.rb-title.safe{color:var(--green);}.rb-title.danger{color:var(--red);}.rb-title.warn{color:var(--amber);}.rb-title.unknown{color:var(--muted2);}
.rb-sub{font-size:11.5px;color:var(--muted);margin-top:3px;font-weight:500;}
.flag{display:flex;align-items:center;gap:8px;padding:8px 11px;border-radius:8px;font-size:12.5px;font-weight:600;margin-bottom:6px;}
.flag.bad{background:var(--red-lt);color:var(--red);}
.flag.maybe{background:var(--amber-lt);color:var(--amber);}
.flag.good{background:var(--green-lt);color:var(--green);}
.ing-toggle{display:flex;align-items:center;justify-content:space-between;padding:10px 0;cursor:pointer;font-size:12.5px;font-weight:700;color:var(--muted2);border-top:1px solid var(--border);margin-top:10px;}
.ing-toggle:hover{color:var(--ink);}
.ing-text{font-size:11.5px;color:var(--muted2);line-height:1.75;padding:8px 0;max-height:100px;overflow-y:auto;}

/* ── SEARCH ── */
.filter-chip{padding:5px 12px;border-radius:100px;border:1.5px solid var(--border2);background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted2);}
.filter-chip:hover{border-color:var(--ink3);color:var(--ink);}
.filter-chip.active{border-color:var(--green);background:var(--green-lt);color:var(--ink);}
.product-card{background:#fff;border:1px solid var(--border);border-radius:12px;padding:13px;margin-bottom:8px;box-shadow:var(--sh);display:flex;align-items:center;gap:11px;}
.product-card:hover{border-color:var(--border2);box-shadow:var(--sh2);}
.product-emoji{width:44px;height:44px;background:var(--paper2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;border:1px solid var(--border);}
.product-name{font-size:13.5px;font-weight:700;letter-spacing:-.1px;}
.product-brand{font-size:11.5px;color:var(--muted);margin-top:2px;}
.verified-pill{display:inline-flex;align-items:center;padding:2px 7px;border-radius:5px;font-size:10px;font-weight:700;margin-top:4px;letter-spacing:.2px;}

/* ── LIST ── */
.list-item{display:flex;align-items:center;gap:11px;padding:11px 13px;background:#fff;border:1px solid var(--border);border-radius:11px;margin-bottom:7px;box-shadow:var(--sh);}
.list-item.done{opacity:.4;}
.list-check{width:20px;height:20px;border-radius:6px;border:2px solid var(--border2);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .18s;font-size:11px;color:#fff;}
.list-check.checked{background:var(--green);border-color:var(--green);}
.list-name{font-size:14px;font-weight:600;flex:1;letter-spacing:-.1px;}
.list-name.done{text-decoration:line-through;color:var(--muted);}
.list-del{font-size:15px;cursor:pointer;opacity:.2;padding:4px;transition:opacity .15s;}.list-del:hover{opacity:.6;}
.list-section{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin:14px 0 7px;}

/* ── PROFILE ── */
.profile-hero{background:var(--ink);border-radius:16px;padding:20px 18px;margin:16px 0 12px;display:flex;align-items:center;gap:14px;}
.pa-lg{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:var(--ink);background:var(--paper);flex-shrink:0;}
.profile-hero-name{font-size:18px;font-weight:800;color:var(--paper);letter-spacing:-.4px;}
.profile-hero-sub{font-size:11.5px;color:rgba(250,250,247,.45);margin-top:3px;font-weight:500;}
.profile-edit-btn{margin-left:auto;background:rgba(250,250,247,.08);border:1px solid rgba(250,250,247,.12);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;color:var(--paper);cursor:pointer;font-family:var(--f);transition:all .15s;}
.profile-edit-btn:hover{background:rgba(250,250,247,.14);}
.stat3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;text-align:center;}
.stat3-item{background:var(--paper2);border-radius:10px;padding:12px 8px;border:1px solid var(--border);}
.stat3-num{font-size:20px;font-weight:800;letter-spacing:-.3px;}
.stat3-lbl{font-size:10.5px;color:var(--muted);font-weight:600;margin-top:3px;letter-spacing:.2px;}

/* ── FAMILY ── */
.family-member{background:#fff;border:1px solid var(--border);border-radius:12px;padding:13px 15px;margin-bottom:9px;box-shadow:var(--sh);}
.fm-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0;}
.ap-chip{display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:100px;border:1.5px solid var(--border2);background:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:all .15s;color:var(--muted2);}
.ap-chip:hover{border-color:var(--ink3);color:var(--ink);}
.ap-chip.on{border-color:var(--green);background:var(--green-lt);color:var(--ink);}

/* ── HISTORY ── */
.hist-row{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer;transition:opacity .1s;}
.hist-row:hover{opacity:.75;}
.hist-row:last-child{border-bottom:none;}
.hist-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.hist-dot.safe{background:var(--green);}.hist-dot.danger{background:var(--red);}.hist-dot.warn,.hist-dot.warning{background:var(--amber);}.hist-dot.not_found{background:var(--muted);}
.hist-info{flex:1;min-width:0;}
.hist-name{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.1px;}
.hist-time{font-size:11px;color:var(--muted);margin-top:1px;font-weight:500;}

/* ── UTILS ── */
.loader{display:flex;flex-direction:column;align-items:center;gap:10px;padding:28px;background:#fff;border-radius:12px;box-shadow:var(--sh);margin-bottom:10px;}
.spinner{width:32px;height:32px;border:2.5px solid var(--border2);border-top-color:var(--green);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.loader-txt{font-size:13.5px;font-weight:700;color:var(--ink);letter-spacing:-.1px;}
.loader-sub{font-size:11.5px;color:var(--muted);}
.error-box{background:var(--red-lt);border:1px solid var(--red-md);border-radius:10px;padding:11px 14px;font-size:12.5px;color:var(--red);font-weight:600;margin-bottom:10px;display:flex;align-items:flex-start;gap:8px;}
.info-box{background:var(--blue-lt);border:1px solid rgba(37,99,235,.2);border-radius:10px;padding:11px 14px;font-size:12.5px;color:var(--blue);font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
.warn-box{background:var(--amber-lt);border:1px solid var(--amber-md);border-radius:10px;padding:11px 14px;font-size:12.5px;color:var(--amber);font-weight:600;margin-bottom:10px;display:flex;align-items:center;gap:8px;}
.share-bar{display:flex;gap:8px;padding:11px 13px;background:var(--blue-lt);border-radius:10px;margin-bottom:10px;align-items:center;border:1px solid rgba(37,99,235,.12);}
.share-txt{flex:1;font-size:12.5px;color:var(--blue);font-weight:600;}
.empty-state{text-align:center;padding:52px 20px;color:var(--muted);}
.empty-icon{font-size:40px;margin-bottom:12px;display:block;filter:grayscale(1);opacity:.4;}
.empty-txt{font-size:15px;font-weight:700;color:var(--ink2);letter-spacing:-.2px;}
.empty-sub{font-size:13px;margin-top:5px;color:var(--muted);font-weight:500;}
.demo-code{padding:4px 10px;background:#fff;border:1px solid var(--border2);border-radius:7px;font-size:12px;font-weight:700;color:var(--ink2);cursor:pointer;transition:all .15s;display:inline-block;margin:3px;font-family:monospace;}
.demo-code:hover{border-color:var(--green);color:var(--green);background:var(--green-lt);}
.screen-title{font-size:21px;font-weight:800;color:var(--ink);margin:20px 0 3px;letter-spacing:-.4px;}
.screen-sub{font-size:13px;color:var(--muted2);margin-bottom:16px;line-height:1.5;font-weight:500;}
.tab-row{display:flex;gap:3px;background:var(--paper2);border-radius:10px;padding:3px;margin-bottom:14px;border:1px solid var(--border);}
.tab{flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;color:var(--muted2);transition:all .15s;}
.tab.active{background:#fff;color:var(--ink);box-shadow:var(--sh);}
#qr-reader{width:100%!important;border:none!important;min-height:200px;}
#qr-reader video{width:100%!important;height:auto!important;border-radius:8px!important;display:block!important;}
#qr-reader__dashboard{display:none!important;}
#qr-reader__scan_region{width:100%!important;}
#qr-reader img{display:none!important;}
/* ── PRODUKT HERO ── */
.product-hero{background:#fff;border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:10px;box-shadow:var(--sh);}
.product-hero-img{width:100%;height:180px;object-fit:contain;background:var(--paper2);display:block;}
.product-hero-img-placeholder{width:100%;height:180px;background:var(--paper2);display:flex;align-items:center;justify-content:center;font-size:72px;}
.product-hero-body{padding:14px 16px;}
.product-hero-name{font-size:19px;font-weight:800;color:var(--ink);letter-spacing:-.4px;line-height:1.2;margin-bottom:3px;}
.product-hero-brand{font-size:13px;color:var(--muted);font-weight:500;margin-bottom:10px;}
.product-hero-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
.product-hero-source{font-size:10px;font-weight:700;padding:2px 8px;border-radius:5px;letterSpacing:.3px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.fade-in{animation:fadeUp .18s ease both;}

/* ── MADPAS ── */
.mp-page{background:var(--paper);display:flex;flex-direction:column;flex:1;}
.mp-scroll{flex:1;overflow-y:auto;padding:0 16px 120px;}
.mp-head{padding:20px 16px 0;}
.mp-title{font-size:26px;font-weight:900;color:var(--ink);letter-spacing:-.5px;margin-bottom:5px;}
.mp-subtitle{font-size:13px;color:var(--muted2);font-weight:500;line-height:1.5;margin-bottom:20px;}
.mp-section-lbl{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:var(--muted);margin:0 0 8px;}
.mp-lang-dropdown{width:100%;background:#fff;border:1.5px solid var(--border2);border-radius:13px;padding:13px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .15s;margin-bottom:16px;}
.mp-lang-dropdown:hover{border-color:var(--green);}
.mp-lang-flag{font-size:22px;flex-shrink:0;}
.mp-lang-name{flex:1;font-size:15px;font-weight:700;color:var(--ink);}
.mp-lang-arrow{font-size:14px;color:var(--muted);}
.mp-lang-list{background:#fff;border:1.5px solid var(--border2);border-radius:13px;overflow:hidden;margin-bottom:16px;max-height:320px;overflow-y:auto;}
.mp-lang-opt{display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;transition:background .1s;border-bottom:1px solid var(--border);}
.mp-lang-opt:last-child{border-bottom:none;}
.mp-lang-opt:hover{background:var(--paper2);}
.mp-lang-opt.on{background:var(--green-lt);}
.mp-card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:18px 16px;margin-bottom:14px;box-shadow:var(--sh);}
.mp-allergen-pill{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;background:var(--red-lt);border:1px solid var(--red-md);border-radius:100px;font-weight:800;color:var(--red);margin:3px;}
.mp-allergen-pill.custom{background:var(--paper2);border-color:var(--border2);color:var(--ink2);}
.mp-big-btn{width:100%;background:var(--ink);color:var(--paper);border:none;border-radius:14px;padding:16px;font-family:var(--f);font-size:16px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:10px;box-shadow:0 3px 12px rgba(31,39,51,.18);}
.mp-big-btn:hover{background:var(--ink2);}
.mp-speak-btn{background:var(--green);color:#fff;border:none;border-radius:10px;padding:8px 14px;font-family:var(--f);font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;flex:1;}
.mp-speak-btn.speaking{background:var(--amber);}
.mp-aa{background:var(--paper2);color:var(--muted2);border:1.5px solid var(--border2);border-radius:9px;padding:7px 11px;font-family:var(--f);font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;}
.mp-aa.on{background:var(--green-lt);border-color:var(--green);color:var(--green);}
.mp-family-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:7px 0;border-bottom:1px solid var(--border);}
.mp-family-row:last-child{border-bottom:none;}
`;

// ─── HOVED KOMPONENT ─────────────────────────────────────────────────────────
export default function EatSafe() {
  // Auth state
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("as_token") || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("as_refresh") || null);
  const [userId, setUserId] = useState(() => localStorage.getItem("as_user_id") || null);

  // UI state
  const [screen, setScreen] = useState(accessToken ? SCREENS.HOME : SCREENS.WELCOME);
  const [onboardStep, setOnboardStep] = useState(1);
  const [editMode, setEditMode] = useState(false);

  // User data
  const [user, setUser] = useState({ name:"", age:"", email:"", phone:"", password:"", role:"" });
  const [allergens, setAllergens] = useState([]);
  const [customAllerg, setCustomAllerg] = useState([]);
  const [family, setFamily] = useState([]);
  const [activeProfiles, setActiveProfiles] = useState(["me"]);

  // Scan state
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [showIng, setShowIng] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const qrRef = useRef(null);
  const html5QrRef = useRef(null);

  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Admin
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [openSubmission, setOpenSubmission] = useState(null);
  const [submissionFilter, setSubmissionFilter] = useState("pending");
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [cleaningOcr, setCleaningOcr] = useState(false);
  const [cleanedOcrText, setCleanedOcrText] = useState(null);

  // Shopping list
  const [shoppingList, setShoppingList] = useState([]);
  const [shoppingListId, setShoppingListId] = useState(null);
  const [newItemName, setNewItemName] = useState("");

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
    const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem("as_favorites") || "[]"); } catch { return []; }
  });
  const [madpasLang, setMadpasLang] = useState(() => localStorage.getItem("as_madpas_lang") || "en");
  const [madpasSpeaking, setMadpasSpeaking] = useState(false);
  const [madpasBig, setMadpasBig] = useState(false);
  const [madpasWaiterView, setMadpasWaiterView] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [showSafeOnly, setShowSafeOnly] = useState(false);

  // Family form
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberAllerg, setNewMemberAllerg] = useState([]);
  const [customInput, setCustomInput] = useState("");

  // Auth form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authTab, setAuthTab] = useState("signup"); // signup | login

  // NOT FOUND flow
  const [notFoundEan, setNotFoundEan] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [proposedFlags, setProposedFlags] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [proposedName, setProposedName] = useState("");
  const [productImageBase64, setProductImageBase64] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [ocrImageBase64, setOcrImageBase64] = useState(null);
  const [ocrImagePreview, setOcrImagePreview] = useState(null);

  // ── TOKEN HELPERS ──────────────────────────────────────────────────────────
  const saveTokens = useCallback((access, refresh, uid) => {
    setAccessToken(access);
    setRefreshToken(refresh);
    setUserId(uid);
    localStorage.setItem("as_token", access);
    localStorage.setItem("as_refresh", refresh);
    localStorage.setItem("as_user_id", uid);
  }, []);

  const clearAuth = useCallback(() => {
    setAccessToken(null); setRefreshToken(null); setUserId(null);
    localStorage.removeItem("as_token");
    localStorage.removeItem("as_refresh");
    localStorage.removeItem("as_user_id");
    setUser({ name:"", age:"", email:"", phone:"", password:"", role:"" });
    setAllergens([]); setCustomAllerg([]); setFamily([]); setHistory([]); setShoppingList([]);
    setScreen(SCREENS.WELCOME);
  }, []);

  // Auto-refresh token every 45 minutes
  useEffect(() => {
    if (!refreshToken) return;
    const refresh = async () => {
      try {
        const data = await apiCall(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
          method: "POST",
          headers: makeHeaders(null),
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (data.access_token) saveTokens(data.access_token, data.refresh_token, data.user?.id);
      } catch { /* silent */ }
    };
    const interval = setInterval(refresh, 45 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshToken, saveTokens]);

  // ── LOAD USER DATA PÅ LOGIN ────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !userId) return;
    loadUserProfile();
    loadAllergens();
    loadFamily();
    loadHistory();
    loadShoppingList();
  }, [accessToken, userId]);

  const loadUserProfile = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`, {
        headers: { ...makeHeaders(accessToken), "Accept": "application/json" },
      });
      if (data[0]) setUser(u => ({ ...u, ...data[0] }));
    } catch { /* silent */ }
  };

  const loadAllergens = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}&select=*`, {
        headers: { ...makeHeaders(accessToken), "Accept": "application/json" },
      });
      const standard = data.filter(a => a.type === "allergen").map(a => a.allergen);
      const custom = data.filter(a => a.type === "custom").map(a => a.allergen);
      setAllergens(standard);
      setCustomAllerg(custom);
    } catch { /* silent */ }
  };

  const loadFamily = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/family?user_id=${userId}`, {
        headers: makeHeaders(accessToken),
      });
      if (data.success && data.families) {
        const members = data.families.flatMap(f =>
          (f.managed_members || []).map(m => ({
            id: m.id,
            name: m.name,
            color: m.color || AVATAR_COLORS[0],
            allergens: m.allergens || [],
            custom: m.custom_allergens || [],
          }))
        );
        setFamily(members);
      }
    } catch { /* silent */ }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/history?user_id=${userId}&limit=50&offset=0`, {
        headers: makeHeaders(accessToken),
      });
      if (data.success && data.scans) setHistory(data.scans);
    } catch { /* silent */ }
    finally { setHistoryLoading(false); }
  };

  const loadShoppingList = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/shopping?user_id=${userId}`, {
        headers: makeHeaders(accessToken),
      });
      if (data.success && data.lists && data.lists.length > 0) {
        const list = data.lists[0];
        setShoppingListId(list.id);
        setShoppingList(list.items || []);
      } else {
        // Opret en standardliste
        const newList = await apiCall(`${SUPABASE_URL}/functions/v1/shopping`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ owner_id: userId, name: "Min indkøbsliste", type: "personal" }),
        });
        if (newList.success) { setShoppingListId(newList.list?.id); setShoppingList([]); }
      }
    } catch { /* silent */ }
  };

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  const loadSubmissions = async () => {
    setSubmissionsLoading(true);
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/submissions?status=pending`, {
        headers: makeHeaders(accessToken),
      });
      if (data.success) setSubmissions(data.submissions || []);
    } catch { /* silent */ }
    setSubmissionsLoading(false);
  };

  const loadAdminStats = async () => {
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/admin/stats`, {
        headers: makeHeaders(accessToken),
      });
      if (data.success) setAdminStats(data.stats);
    } catch { /* silent */ }
  };

  const cleanOcrWithAI = async (rawText) => {
    if (!rawText) return;
    setCleaningOcr(true);
    setCleanedOcrText(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Du er en assistent der renskriver ingredienslister fra OCR-scanning.

REGLER (MEGET VIGTIGT):
- Du må ALDRIG tilføje ingredienser der ikke er i originalteksten
- Du må ALDRIG fjerne ingredienser fra originalteksten
- Du må ALDRIG ændre mængdeangivelser (%, g, mg etc.)
- Du må kun rette åbenlyse OCR-fejl (fx "Hvedek|ad" → "Hvedeklid")
- Du må fjerne tekst der åbenlyst IKKE er ingredienser (fx "Opbevares køligt", "Bedst før", adresser, telefonnumre)
- Behold parenteser og underingredienser
- Formater som en kommasepareret liste

Renskiv denne ingrediensliste:
${rawText}

Svar KUN med den renskrevne ingrediensliste — ingen forklaring, ingen kommentar.`
          }]
        })
      });
      const data = await res.json();
      const cleaned = data.content?.[0]?.text?.trim();
      if (cleaned) setCleanedOcrText(cleaned);
    } catch (e) {
      alert("AI fejl: " + e.message);
    }
    setCleaningOcr(false);
  };

  const updateSubmissionAndApprove = async (submission, edits) => {
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions/${submission.id}`, {
        method: "PATCH",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          status: "approved",
          reviewed_by: userId,
          name: edits.name || submission.ai_parsed_data?.name || "Ukendt produkt",
          brand: edits.brand || submission.ai_parsed_data?.brand || null,
          ingredients_text: submission.ocr_raw_text || null,
          allergen_flags: edits.allergen_flags || submission.ai_parsed_data || null,
        }),
      });
      setSubmissions(s => s.filter(x => x.id !== submission.id));
      setOpenSubmission(null);
      setEditingSubmission(null);
    } catch (e) {
      alert("Fejl ved godkendelse: " + e.message);
    }
  };

  const approveSubmission = async (submission) => {
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions/${submission.id}`, {
        method: "PATCH",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          status: "approved",
          reviewed_by: userId,
          name: submission.ai_parsed_data?.name || "Ukendt produkt",
          brand: submission.ai_parsed_data?.brand || null,
          ingredients_text: submission.ocr_raw_text || null,
          allergen_flags: submission.ai_parsed_data || null,
        }),
      });
      setSubmissions(s => s.filter(x => x.id !== submission.id));
    } catch (e) {
      alert("Fejl ved godkendelse: " + e.message);
    }
  };

  const rejectSubmission = async (id) => {
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions/${id}`, {
        method: "PATCH",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          status: "rejected",
          reviewed_by: userId,
          review_note: "Afvist af admin",
        }),
      });
      setSubmissions(s => s.filter(x => x.id !== id));
    } catch (e) {
      alert("Fejl ved afvisning: " + e.message);
    }
  };

  // ── FAVORITTER ────────────────────────────────────────────────────────────
  const toggleFavorite = (product) => {
    setFavorites(prev => {
      const exists = prev.find(f => f.ean === product.ean || f.code === product.code);
      const updated = exists
        ? prev.filter(f => f.ean !== product.ean && f.code !== product.code)
        : [...prev, { ...product, savedAt: Date.now() }];
      localStorage.setItem("as_favorites", JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (ean) => favorites.some(f => f.ean === ean || f.code === ean);

  // ── AUTH ───────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) return;
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const text = await res.text();
      // Tjek for allowlist-fejl (returneres som plain text, ikke JSON)
      if (text === "Host not in allowlist") {
        setAuthError("⚙️ Supabase er ikke konfigureret til dette domæne. Jan skal tilføje denne sides URL i Supabase → Authentication → URL Configuration → Allowed Origins.");
        setAuthLoading(false); return;
      }
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error_description || data.message || "Login fejlede");
      saveTokens(data.access_token, data.refresh_token, data.user.id);
      setScreen(SCREENS.HOME);
    } catch (e) {
      if (e.message?.includes("allowlist") || e.message?.includes("Host")) {
        setAuthError("⚙️ Supabase er ikke konfigureret til dette domæne. Jan skal tilføje URL'en i Supabase → Authentication → URL Configuration.");
      } else {
        setAuthError("Forkert email eller kodeord. Prøv igen. (" + (e.message||"") + ")");
      }
    }
    setAuthLoading(false);
  };

  const handleSignup = async () => {
    if (!loginEmail || !loginPassword) return;
    setAuthLoading(true); setAuthError("");
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const text = await res.text();
      if (text === "Host not in allowlist") {
        setAuthError("⚙️ Supabase er ikke konfigureret til dette domæne. Jan skal tilføje denne sides URL i Supabase → Authentication → URL Configuration → Allowed Origins.");
        setAuthLoading(false); return;
      }
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error_description || data.message || "Oprettelse fejlede");
      if (data.access_token) {
        saveTokens(data.access_token, data.refresh_token, data.user.id);
        setUser(u => ({ ...u, email: loginEmail }));
        setScreen(SCREENS.ONBOARD);
        setOnboardStep(1);
      } else {
        setAuthError("Tjek din email for bekræftelse — eller prøv at logge ind.");
      }
    } catch (e) {
      setAuthError(e.message || "Oprettelse fejlede. Prøv igen.");
    }
    setAuthLoading(false);
  };

  // ── ONBOARDING GEM ─────────────────────────────────────────────────────────
  const saveProfileStep1 = async () => {
    if (!(user.name || "").trim()) return;
    try {
      await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: "PATCH",
        headers: { ...makeHeaders(accessToken), "Prefer": "return=representation" },
        body: JSON.stringify({ name: user.name, phone: user.phone || null, age: user.age ? parseInt(user.age) : null }),
      });
    } catch { /* silent */ }
    setOnboardStep(4);
  };

  const saveAllergensStep2 = async () => {
    try {
      // Slet alle eksisterende, gem nye
      await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}`, {
        method: "DELETE",
        headers: makeHeaders(accessToken),
      });
      for (const a of allergens) {
        await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ user_id: userId, allergen: a, type: "allergen" }),
        });
      }
      for (const c of customAllerg) {
        await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ user_id: userId, allergen: c, type: "custom" }),
        });
      }
    } catch { /* silent */ }
    setOnboardStep(5);
  };

  const finishOnboard = () => { setScreen(SCREENS.HOME); setEditMode(false); };

  // ── SCANNING ───────────────────────────────────────────────────────────────
  const allActive = useCallback(() => {
    const ids = new Set(activeProfiles.includes("me") ? allergens : []);
    family.filter(m => activeProfiles.includes(m.id)).forEach(m => m.allergens.forEach(a => ids.add(a)));
    return { ids: [...ids], custom: [...customAllerg] };
  }, [allergens, customAllerg, family, activeProfiles]);

  const startCamera = async () => {
    if (cameraActive) return;
    setScanError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      // Brug qr-reader-home hvis vi er på hjem, ellers qr-reader
      const homeEl = document.getElementById("qr-reader-home");
      const scanEl = document.getElementById("qr-reader");
      const readerId = homeEl ? "qr-reader-home" : "qr-reader";
      const readerEl = homeEl || scanEl;
      if (!readerEl) {
        setScanError("Kamera-element ikke fundet. Prøv igen.");
        return;
      }
      html5QrRef.current = new Html5Qrcode(readerId);
      await html5QrRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (code) => {
          stopCamera();
          lookupProduct(code);
        },
        () => {}
      );
      setCameraActive(true);
    } catch (e) {
      if (e.name === "NotAllowedError") {
        setScanError("Kamera-adgang nægtet. Tillad kamera i din browsers indstillinger og prøv igen.");
      } else if (e.name === "NotFoundError") {
        setScanError("Intet kamera fundet på denne enhed.");
      } else {
        setScanError("Kamera ikke tilgængeligt. Brug manuel stregkode nedenfor.");
      }
    }
  };

  const stopCamera = () => {
    if (html5QrRef.current) {
      html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (screen !== SCREENS.SCAN) stopCamera();
  }, [screen]);

  const { ids: activeIds } = allActive();

  const lookupProduct = useCallback(async (ean) => {
    if (!ean?.trim()) return;
    setLoading(true); setScanResult(null); setScanError(""); setShowIng(false);
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/products/${ean.trim()}`, {
        headers: makeHeaders(accessToken),
      });

      if (!data.found) {
        // Produkt ikke fundet
        setNotFoundEan(ean.trim());
        await saveHistoryEntry(ean.trim(), null, "not_found", {});
        setLoading(false);
        setScreen(SCREENS.NOTFOUND);
        return;
      }

      const product = data.product;
      const flags = data.allergen_flags || {};
      const { status, matchedDanger, matchedWarning, hasUnknown } = compareAllergens(flags, activeIds);

      const flagList = [
        ...matchedDanger.map(id => ({ type:"bad", text:`Indeholder ${ALLERGENS.find(a=>a.id===id)?.label||id}` })),
        ...matchedWarning.map(id => ({ type:"maybe", text:`Kan indeholde spor af ${ALLERGENS.find(a=>a.id===id)?.label||id}` })),
        ...(hasUnknown ? [{ type:"maybe", text:"Visse allergener er ukendte — tjek altid pakken" }] : []),
        ...(matchedDanger.length===0 && matchedWarning.length===0 && !hasUnknown ? [{ type:"good", text:"Ingen af dine allergener fundet" }] : []),
      ];

      const headlines = { safe:"Sikkert produkt ✅", danger:"Indeholder allergen! 🚫", warn:"Mulige spor ⚠️" };
      const summaries = {
        safe:"Ingen af dine registrerede allergener er fundet i dette produkt.",
        danger:`Produktet indeholder ${matchedDanger.map(id=>ALLERGENS.find(a=>a.id===id)?.label||id).join(", ")}.`,
        warn:`Produktet kan indeholde spor af ${matchedWarning.map(id=>ALLERGENS.find(a=>a.id===id)?.label||id).join(", ")}.`,
      };

      // Beregn per-familiemedlem påvirkning
      const familyImpact = [];
      if (family.length > 0) {
        for (const member of family.filter(m => activeProfiles.includes(m.id))) {
          const memberResult = compareAllergens(flags, member.allergens || []);
          if (memberResult.matchedDanger.length > 0 || memberResult.matchedWarning.length > 0) {
            familyImpact.push({
              name: member.name,
              color: member.color,
              danger: memberResult.matchedDanger,
              warning: memberResult.matchedWarning,
            });
          }
        }
      }

      const result = {
        code: ean.trim(),
        name: product.name || "Ukendt produkt",
        brand: product.brand || "",
        image_url: product.image_url || null,
        category: product.category || null,
        ingredients: data.ingredients?.raw_text || product.ingredients?.raw_text || "",
        verified_status: product.verified_status || "unverified",
        status,
        headline: headlines[status],
        summary: summaries[status],
        flags: flagList,
        allergen_flags: flags,
        matchedDanger,
        matchedWarning,
        familyImpact,
        source: data.source,
        hasUnknown,
        timestamp: Date.now(),
      };

      setScanResult(result);
      setHistory(h => [result, ...h].slice(0, 50));
      await saveHistoryEntry(ean.trim(), product.id, status, flags);
      setScreen(SCREENS.RESULT);
    } catch (e) {
      setScanError("Der opstod en fejl. Tjek din forbindelse og prøv igen.");
    }
    setLoading(false);
  }, [accessToken, activeIds]);

  const saveHistoryEntry = async (ean, productId, result, flags) => {
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/history`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          user_id: userId,
          ean_scanned: ean,
          product_id: productId || null,
          result,
          flags_triggered: flags,
          active_profiles: activeProfiles,
        }),
      });
    } catch { /* silent */ }
  };

  // ── OCR FLOW ───────────────────────────────────────────────────────────────
  // Forsøg at udtrække produktnavn fra OCR tekst
  const extractProductName = (text) => {
    if (!text) return "";
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 2 && l.length < 50);
    // Find linjer der ligner et produktnavn (ikke tal, ikke for korte)
    const candidates = lines.filter(l => 
      !/^[0-9\s\.,gkJ%]+$/.test(l) &&
      !/^(ingredienser|næringsindhold|opbevaring|bedst|energi|fedt|protein|salt|kulhydrat)/i.test(l) &&
      l.length > 3
    );
    return candidates[0] || "";
  };

  const handleProductImageCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    setProductImageBase64(base64);
    setProductImagePreview(URL.createObjectURL(file));
  };

  const handleImageCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const ocrData = await apiCall(`${SUPABASE_URL}/functions/v1/ocr`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ image_base64: base64 }),
      });
      if (ocrData.success) {
        setOcrText(ocrData.text);
        setProposedName(extractProductName(ocrData.text));
        // Kør allergenanalyse
        const allergenData = await apiCall(`${SUPABASE_URL}/functions/v1/allergens`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ text: ocrData.text }),
        });
        if (allergenData.success) setProposedFlags(allergenData.allergen_flags);
      }
    } catch { setScanError("Billedet kunne ikke analyseres. Prøv igen."); }
    setOcrLoading(false);
  };

  const submitProduct = async () => {
    setSubmitting(true);
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/submissions`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({
          ean: notFoundEan,
          submitted_by: userId,
          ocr_raw_text: ocrText,
          raw_label_image: ocrImageBase64 || null,
          ai_parsed_data: { ...proposedFlags, name: proposedName, product_image_base64: productImageBase64 },
          user_confirmed: true,
        }),
      });
      setScreen(SCREENS.SUBMITTED);
    } catch { setScanError("Indsendelse fejlede. Prøv igen."); }
    setSubmitting(false);
  };

  // ── INDKØBSLISTE ───────────────────────────────────────────────────────────
  const addToList = async (name) => {
    if (!name?.trim()) return;
    const tempId = uid();
    const newItem = { id: tempId, name: name.trim(), checked: false };
    setShoppingList(l => [...l, newItem]);
    setNewItemName("");
    try {
      if (shoppingListId) {
        const data = await apiCall(`${SUPABASE_URL}/functions/v1/shopping/${shoppingListId}/items`, {
          method: "POST",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ name: name.trim(), quantity: 1, added_by: userId }),
        });
        if (data.item?.id) setShoppingList(l => l.map(i => i.id === tempId ? { ...i, id: data.item.id } : i));
      }
    } catch { /* silent — keep optimistic update */ }
  };

  const toggleItem = async (id) => {
    const item = shoppingList.find(i => i.id === id);
    setShoppingList(l => l.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    try {
      if (shoppingListId) {
        await apiCall(`${SUPABASE_URL}/functions/v1/shopping/${shoppingListId}/items/${id}`, {
          method: "PATCH",
          headers: makeHeaders(accessToken),
          body: JSON.stringify({ checked: !item?.checked }),
        });
      }
    } catch { /* silent */ }
  };

  const removeItem = async (id) => {
    setShoppingList(l => l.filter(i => i.id !== id));
    try {
      if (shoppingListId) {
        await apiCall(`${SUPABASE_URL}/functions/v1/shopping/${shoppingListId}/items/${id}`, {
          method: "DELETE",
          headers: makeHeaders(accessToken),
        });
      }
    } catch { /* silent */ }
  };

  const clearDone = () => shoppingList.filter(i => i.checked).forEach(i => removeItem(i.id));

  // ── FAMILIE ────────────────────────────────────────────────────────────────
  const addMember = async () => {
    if (!newMemberName.trim()) return;
    const color = AVATAR_COLORS[family.length % AVATAR_COLORS.length];
    const tempMember = { id: uid(), name: newMemberName.trim(), allergens: newMemberAllerg, custom: [], color };
    setFamily(f => [...f, tempMember]);
    setNewMemberName(""); setNewMemberAllerg([]);
    try {
      const data = await apiCall(`${SUPABASE_URL}/functions/v1/family/members`, {
        method: "POST",
        headers: makeHeaders(accessToken),
        body: JSON.stringify({ user_id: userId, name: tempMember.name, color }),
      });
      if (data.member?.id) setFamily(f => f.map(m => m.id === tempMember.id ? { ...m, id: data.member.id } : m));
    } catch { /* silent */ }
  };

  const removeMember = async (id) => {
    setFamily(f => f.filter(m => m.id !== id));
    setActiveProfiles(a => a.filter(x => x !== id));
    try {
      await apiCall(`${SUPABASE_URL}/functions/v1/family/members/${id}`, {
        method: "DELETE",
        headers: makeHeaders(accessToken),
      });
    } catch { /* silent */ }
  };

  // ── SØGNING via Edge Function ───────────────────────────────────────────────

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchResults([]);
      const q = searchQuery.trim();

      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/search?q=${encodeURIComponent(q)}`,
          { headers: { "apikey": SUPABASE_ANON_KEY, ...(accessToken ? { "Authorization": `Bearer ${accessToken}` } : {}) } }
        );
        const data = await res.json();
        if (data.success) {
          setSearchResults((data.products || []).map(p => ({ ...p, source:"local", verified:p.verified_status, conflicts:[] })));
        }
      } catch {
        // silent
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, accessToken]);

    // ── HJÆLPEKOMPONENTER ──────────────────────────────────────────────────────

  // ── MADPAS SPEAK ────────────────────────────────────────────────────────────
  const madpasSpeak = () => {
    if (!window.speechSynthesis) return;
    if (madpasSpeaking) { window.speechSynthesis.cancel(); setMadpasSpeaking(false); return; }
    const lang = MADPAS_LANGUAGES.find(l => l.code === madpasLang) || MADPAS_LANGUAGES[0];
    const parts = [];
    parts.push(MADPAS_INTRO[madpasLang] || MADPAS_INTRO.en);
    allergens.forEach(id => {
      const t = ALLERGEN_T[id]?.[madpasLang] || ALLERGEN_T[id]?.en;
      if (t) parts.push(t.n + ". " + t.d);
    });
    if (customAllerg.length > 0) parts.push(customAllerg.join(", "));
    const utter = new SpeechSynthesisUtterance(parts.join(". "));
    utter.lang = lang.bcp;
    utter.rate = 0.9;
    utter.onstart = () => setMadpasSpeaking(true);
    utter.onend = () => setMadpasSpeaking(false);
    utter.onerror = () => setMadpasSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const isOnboard = screen === SCREENS.WELCOME || screen === SCREENS.LOGIN || screen === SCREENS.ONBOARD || editMode;

  const FamilyChips = () => {
    const allIds = ["me", ...family.map(m => m.id)];
    const isAll = allIds.every(id => activeProfiles.includes(id));
    const toggleAll = () => setActiveProfiles(isAll ? ["me"] : allIds);
    const toggleOne = (id) => {
      if (isAll) { setActiveProfiles([id]); return; }
      const next = activeProfiles.includes(id) ? activeProfiles.filter(x => x !== id) : [...activeProfiles, id];
      setActiveProfiles(next.length === 0 ? [id] : next);
    };
    return (
      <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
        <div className={`ap-chip${isAll?" on":""}`} onClick={toggleAll}>👨‍👩‍👧 Hele familien</div>
        <div className={`ap-chip${!isAll&&activeProfiles.includes("me")?" on":""}`} onClick={() => toggleOne("me")}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"var(--green)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(user.name||"Mig")}</div>
          {(user.name||"Mig").split(" ")[0]}
        </div>
        {family.map(m => (
          <div key={m.id} className={`ap-chip${!isAll&&activeProfiles.includes(m.id)?" on":""}`} onClick={() => toggleOne(m.id)}>
            <div style={{width:20,height:20,borderRadius:"50%",background:m.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(m.name)}</div>
            {m.name.split(" ")[0]}
          </div>
        ))}
      </div>
    );
  };

  const StepBar = ({ total, current }) => (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:22 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`step-seg${i <= current-1 ? " done" : ""}`} />
      ))}
      <span className="step-num">{current}/{total}</span>
    </div>
  );

  const hour = new Date().getHours();
  const greeting = hour<5?"God nat":hour<10?"God morgen":hour<12?"God formiddag":hour<17?"God dag":hour<22?"God aften":"God nat";

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* ══ VELKOMST ══ */}
        {screen === SCREENS.WELCOME && (
          <div className="welcome-screen fade-in">
            {/* Logo + wordmark som splash */}
            <div className="welcome-logo-wrap">
              <EatSafeLogo size={96} variant="light" />
              <div className="welcome-wordmark">
                <span className="welcome-wordmark-text">Eat<span>Safe</span></span>
              </div>
              <div className="welcome-tagline">Scan. Tjek. Spis trygt.</div>
            </div>

            <div className="welcome-divider" />

            {/* Features */}
            <div className="welcome-features">
              {[
                ["📷","Skan på sekunder","Hold kameraet over stregkoden og få svar med det samme"],
                ["👨‍👩‍👧","Hele familien","Administrér allergiprofiler for alle i familien på ét sted"],
                ["🛒","Smarte indkøbslister","Delte lister med allergencheck for hele familien"],
              ].map(([icon,title,text]) => (
                <div key={title} className="welcome-feat">
                  <div className="welcome-feat-icon">{icon}</div>
                  <div className="welcome-feat-text"><strong>{title}</strong>{text}</div>
                </div>
              ))}
            </div>

            <button className="welcome-btn" onClick={() => { setAuthTab("signup"); setScreen(SCREENS.LOGIN); }}>Opret gratis konto →</button>
            <button className="welcome-btn-ghost" onClick={() => { setAuthTab("login"); setScreen(SCREENS.LOGIN); }}>Jeg har allerede en konto</button>
          </div>
        )}

        {/* ══ LOGIN / REGISTRERING ══ */}
        {screen === SCREENS.LOGIN && (
          <div className="login-wrap fade-in">

            {/* Logo */}
            <div className="login-header">
              <div className="login-shield" style={{background:"none",padding:0,width:56,height:56}}><EatSafeLogo size={56} variant="light" /></div>
              <div className="login-title">Eat<span style={{color:"#22C55E",fontStyle:"italic"}}>Safe</span></div>
            </div>

            {/* Tab vælger */}
            <div className="tab-row">
              <div className={`tab${authTab==="signup"?" active":""}`} onClick={() => { setAuthTab("signup"); setAuthError(""); }}>Ny bruger</div>
              <div className={`tab${authTab==="login"?" active":""}`} onClick={() => { setAuthTab("login"); setAuthError(""); }}>Log ind</div>
            </div>

            {/* SIGNUP flow */}
            {authTab === "signup" && (
              <div className="fade-in">
                <div style={{ textAlign:"center", marginBottom:16 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"var(--ink)" }}>Opret din gratis konto</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>Du opsætter dine allergier i næste trin</div>
                </div>
                <div className="card">
                  <label className="field-lbl">Email</label>
                  <input className="field" type="email" placeholder="din@email.dk" value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)} style={{ marginBottom:12 }}
                    onKeyDown={e => e.key==="Enter" && handleSignup()} />
                  <label className="field-lbl">Vælg kodeord</label>
                  <input className="field" type="password" placeholder="Minimum 8 tegn" value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && handleSignup()} />
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:8, lineHeight:1.5 }}>
                    Ved at oprette en konto accepterer du vores vilkår og bekræfter at du er over 13 år.
                  </div>
                </div>
                {authError && (
                  <div className="error-box" style={{ flexDirection:"column", alignItems:"flex-start", gap:4 }}>
                    <span style={{ fontWeight:800 }}>⚠️ Fejl</span>
                    <span style={{ fontWeight:500, fontSize:12, lineHeight:1.5 }}>{authError}</span>
                  </div>
                )}
                <button className="btn btn-primary btn-full" onClick={handleSignup} disabled={authLoading}>
                  {authLoading ? "Opretter konto…" : "Opret konto og fortsæt →"}
                </button>
                <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:"var(--muted)" }}>
                  Har du allerede en konto?{" "}
                  <span style={{ color:"var(--green)", fontWeight:700, cursor:"pointer" }} onClick={() => { setAuthTab("login"); setAuthError(""); }}>
                    Log ind her
                  </span>
                </div>
              </div>
            )}

            {/* LOGIN flow */}
            {authTab === "login" && (
              <div className="fade-in">
                <div style={{ textAlign:"center", marginBottom:16 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:"var(--ink)" }}>Velkommen tilbage</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>Log ind med din email og kodeord</div>
                </div>
                <div className="card">
                  <label className="field-lbl">Email</label>
                  <input className="field" type="email" placeholder="din@email.dk" value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)} style={{ marginBottom:12 }}
                    onKeyDown={e => e.key==="Enter" && handleLogin()} />
                  <label className="field-lbl">Kodeord</label>
                  <input className="field" type="password" placeholder="Dit kodeord" value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && handleLogin()} />
                </div>
                {authError && (
                  <div className="error-box" style={{ flexDirection:"column", alignItems:"flex-start", gap:4 }}>
                    <span style={{ fontWeight:800 }}>⚠️ Fejl</span>
                    <span style={{ fontWeight:500, fontSize:12, lineHeight:1.5 }}>{authError}</span>
                  </div>
                )}
                <button className="btn btn-primary btn-full" onClick={handleLogin} disabled={authLoading}>
                  {authLoading ? "Logger ind…" : "Log ind →"}
                </button>
                <div style={{ textAlign:"center", marginTop:12, fontSize:12, color:"var(--muted)" }}>
                  Har du ikke en konto?{" "}
                  <span style={{ color:"var(--green)", fontWeight:700, cursor:"pointer" }} onClick={() => { setAuthTab("signup"); setAuthError(""); }}>
                    Opret en her
                  </span>
                </div>
              </div>
            )}
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"14px 0 4px" }}>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
              <span style={{ fontSize:12, color:"var(--muted)", fontWeight:600 }}>eller</span>
              <div style={{ flex:1, height:1, background:"var(--border)" }} />
            </div>
            <button className="btn btn-ghost btn-full" onClick={() => {
              setUser({ name:"Bjørn", age:"", email:"bjorn@preview.dk", phone:"" });
              setAllergens(["gluten"]);
              setFamily([{id:"f1",name:"Frederikke",allergens:["laktose"],custom:[],color:"#74c69d"},{id:"f2",name:"Tage",allergens:["jordnoedder"],custom:[],color:"#40916c"}]);
              setHistory([
                {code:"3017620422003",name:"Nutella",brand:"Ferrero",status:"danger",result:"danger",headline:"Indeholder nødder!",summary:"Produktet indeholder hasselnødder.",flags:[{type:"bad",text:"Indeholder hasselnødder"}],timestamp:Date.now()-180000,scanned_at:new Date(Date.now()-180000).toISOString()},
                {code:"5449000054227",name:"Coca-Cola",brand:"Coca-Cola",status:"safe",result:"safe",headline:"Sikkert produkt",summary:"Ingen allergener fundet.",flags:[{type:"good",text:"Ingen kendte allergener"}],timestamp:Date.now()-7200000,scanned_at:new Date(Date.now()-7200000).toISOString()},
              ]);
              setShoppingList([{id:"s1",name:"Glutenfri pasta",checked:false},{id:"s2",name:"Havremælk",checked:true}]);
              setScreen(SCREENS.HOME);
            }}>
              🔓 Prøv app uden login (preview)
            </button>
            <button className="btn btn-ghost btn-full" style={{ marginTop:8 }} onClick={() => setScreen(SCREENS.WELCOME)}>← Tilbage</button>
          </div>
        )}

        {/* ══ ONBOARDING ══ */}
        {(screen === SCREENS.ONBOARD || editMode) && (
          <div className="onboard-wrap fade-in">
            {!editMode && (
              <div style={{ textAlign:"center", padding:"4px 0 20px" }}>
                <div style={{ marginBottom:6 }}><EatSafeLogo size={40} variant="light" /></div>
                <div style={{ fontSize:20, fontWeight:800, color:"var(--text)" }}>Opsæt din profil</div>
                <div style={{ fontSize:13, color:"var(--muted)", marginTop:4 }}>Tager under 2 minutter</div>
              </div>
            )}
            {editMode && <div style={{ height:4 }} />}
            <StepBar total={7} current={onboardStep} />

            {/* ── TRIN 1: Hvad er EatSafe ── */}
            {onboardStep === 1 && (
              <div className="fade-in">
                <div className="card" style={{ textAlign:"center", padding:"24px 20px 16px" }}>
                  <div style={{ fontSize:52, marginBottom:10 }}>🛒</div>
                  <div style={{ fontSize:19, fontWeight:900, color:"var(--ink)", marginBottom:8 }}>Velkommen til EatSafe</div>
                  <div style={{ fontSize:13, color:"var(--muted2)", lineHeight:1.6 }}>Din personlige allergiguide — til dig og hele familien.</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    ["📷","Skan stregkoder","Hold kameraet over en stregkode og få øjeblikkeligt svar."],
                    ["🔎","Søg produkter","Find allergenvenlinge produkter inden du handler."],
                    ["👨‍👩‍👧","Hele familien","Profiler for alle — se hvem der kan spise hvad."],
                    ["🛒","Indkøbsliste","Byg lister med allergencheck."],
                    ["🤝","Fælles database","Bidrag til databasen og hjælp andre."],
                  ].map(([icon, title, text]) => (
                    <div key={title} style={{ display:"flex", gap:12, alignItems:"center", background:"#fff", border:"1px solid var(--border)", borderRadius:12, padding:"10px 14px" }}>
                      <div style={{ fontSize:22, flexShrink:0 }}>{icon}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:"var(--ink)" }}>{title}</div>
                        <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.4 }}>{text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary btn-full" style={{ marginTop:14 }} onClick={() => setOnboardStep(2)}>Fortsæt →</button>
              </div>
            )}

            {/* ── TRIN 2: Datakvalitet og ansvar ── */}
            {onboardStep === 2 && (
              <div className="fade-in">
                <div className="card" style={{ textAlign:"center", padding:"20px 20px 14px" }}>
                  <div style={{ fontSize:44, marginBottom:8 }}>🔬</div>
                  <div style={{ fontSize:17, fontWeight:900, color:"var(--ink)", marginBottom:6 }}>Forstå vores data</div>
                  <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.6 }}>Vi arbejder hårdt for at give dig pålidelig information — men det er vigtigt du forstår kilden.</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    ["✅","Verificerede produkter","Gennemgået og godkendt af vores team.","var(--green-lt)","var(--green)"],
                    ["⚡","Open Food Facts","Global frivillig database. Ikke garanteret korrekt.","var(--amber-lt)","var(--amber)"],
                    ["⚠️","Bruger-indsendte","Afventer godkendelse. Brug med forsigtighed.","var(--red-lt)","var(--red)"],
                  ].map(([icon, title, text, bg, color]) => (
                    <div key={title} style={{ background:bg, border:`1px solid ${color}`, borderRadius:12, padding:"10px 14px", display:"flex", gap:10, alignItems:"flex-start" }}>
                      <div style={{ fontSize:18, flexShrink:0 }}>{icon}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color, marginBottom:2 }}>{title}</div>
                        <div style={{ fontSize:11, color:"var(--muted2)", lineHeight:1.4 }}>{text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:12, padding:"12px", marginTop:8 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:4 }}>⚠️ Vigtigt</div>
                  <div style={{ fontSize:11, color:"var(--muted2)", lineHeight:1.6 }}>EatSafe <strong>erstatter ikke lægehjælp</strong>. Tjek altid den originale emballage ved alvorlige allergier. <strong>Brug på eget ansvar.</strong></div>
                </div>
                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(1)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setOnboardStep(3)}>Jeg forstår →</button>
                </div>
              </div>
            )}

            {/* ── TRIN 3: Din profil ── */}
            {onboardStep === 3 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">👤 Din profil</div>
                  <div className="step-sub">Fortæl os lidt om dig.</div>
                  {[["Dit fulde navn *","text","Fx. Anna Hansen","name"],["Telefon","tel","+45 12 34 56 78","phone"],["Alder","number","Fx. 32","age"]].map(([lbl,type,ph,key]) => (
                    <div key={key} style={{ marginBottom:10 }}>
                      <label className="field-lbl">{lbl}</label>
                      <input className="field" type={type} placeholder={ph} value={user[key]||""} onChange={e => setUser(u => ({ ...u, [key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary btn-full" onClick={saveProfileStep1}>Fortsæt →</button>
                {!(user.name||"").trim() && <div style={{ fontSize:12,color:"var(--muted)",textAlign:"center",marginTop:6 }}>Navn er påkrævet</div>}
                <div style={{ display:"flex", justifyContent:"center", marginTop:8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(2)}>← Tilbage</button>
                </div>
              </div>
            )}

            {/* ── TRIN 4: Dine allergier ── */}
            {onboardStep === 4 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">🌾 Dine allergier</div>
                  <div className="step-sub">Vælg dine allergener. Kan ændres senere.</div>
                  <div className="chip-grid">
                    {ALLERGENS.map(a => { const on = allergens.includes(a.id); return (
                      <div key={a.id} className={`chip${on?" on":""}`} onClick={() => setAllergens(p => on ? p.filter(x => x !== a.id) : [...p, a.id])}>
                        <span>{a.emoji}</span><span style={{ flex:1 }}>{a.label}</span>{on && <div className="chip-check">✓</div>}
                      </div>
                    );})}
                  </div>
                </div>
                <div className="card">
                  <div className="card-lbl">Andre intoleranser</div>
                  <div className="input-row" style={{ marginBottom: customAllerg.length ? 10 : 0 }}>
                    <input className="field" placeholder="Fx. Fructose…" value={customInput} onChange={e => setCustomInput(e.target.value)}
                      onKeyDown={e => { if (e.key==="Enter"&&customInput.trim()) { setCustomAllerg(c => [...c, customInput.trim()]); setCustomInput(""); }}} />
                    <button className="btn btn-outline btn-sm" onClick={() => { if (customInput.trim()) { setCustomAllerg(c => [...c, customInput.trim()]); setCustomInput(""); }}}>+</button>
                  </div>
                  {customAllerg.length > 0 && <div className="tags">{customAllerg.map((a, i) => <div key={i} className="tag">✏️ {a}<span className="tag-x" onClick={() => setCustomAllerg(c => c.filter((_, j) => j !== i))}>×</span></div>)}</div>}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(3)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={saveAllergensStep2}>Fortsæt →</button>
                </div>
                <div className="onboard-skip">Kan springes over</div>
              </div>
            )}

            {/* ── TRIN 5: Familie ── */}
            {onboardStep === 5 && (
              <div className="fade-in">
                <div className="card">
                  <div className="step-title">👨‍👩‍👧 Familiemedlemmer</div>
                  <div className="step-sub">Tilføj familiemedlemmer med egne allergier. Valgfrit.</div>
                  {family.map(m => (
                    <div key={m.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border)" }}>
                      <div className="fm-avatar" style={{ background:m.color, color:"#fff" }}>{initials(m.name)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:14 }}>{m.name}</div>
                        <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{m.allergens.map(id => ALLERGENS.find(a => a.id === id)?.emoji).join(" ")||"Ingen allergier"}</div>
                      </div>
                      <span style={{ cursor:"pointer", opacity:.4, fontSize:18 }} onClick={() => removeMember(m.id)}>🗑</span>
                    </div>
                  ))}
                  <div className="divider">Tilføj nyt medlem</div>
                  <label className="field-lbl">Navn</label>
                  <input className="field" placeholder="Fx. Mia (8 år)" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} style={{ marginBottom:10 }} />
                  <div className="card-lbl" style={{ marginBottom:8 }}>Allergier</div>
                  <div className="chip-grid" style={{ marginBottom:12 }}>
                    {ALLERGENS.map(a => { const on = newMemberAllerg.includes(a.id); return (
                      <div key={a.id} className={`chip${on?" on":""}`} onClick={() => setNewMemberAllerg(p => on ? p.filter(x => x !== a.id) : [...p, a.id])}>
                        <span>{a.emoji}</span><span style={{ flex:1 }}>{a.label}</span>{on && <div className="chip-check">✓</div>}
                      </div>
                    );})}
                  </div>
                  <button className="btn btn-outline btn-full btn-sm" onClick={addMember}>+ Tilføj {newMemberName||"familiemedlem"}</button>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(4)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setOnboardStep(6)}>Fortsæt →</button>
                </div>
                <div className="onboard-skip">Kan springes over</div>
              </div>
            )}

            {/* ── TRIN 6: Fællesskabet ── */}
            {onboardStep === 6 && (
              <div className="fade-in">
                <div className="card" style={{ textAlign:"center", padding:"20px 20px 14px" }}>
                  <div style={{ fontSize:44, marginBottom:8 }}>🤝</div>
                  <div style={{ fontSize:17, fontWeight:900, color:"var(--ink)", marginBottom:6 }}>Hjælp fællesskabet</div>
                  <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.6 }}>Når du scanner et ukendt produkt kan du indsende det og hjælpe andre.</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    ["1️⃣","Skan stregkoden","Hold kameraet over stregkoden på produktet."],
                    ["2️⃣","Fotografér ingredienslisten","Tag et billede af bagsiden af pakken."],
                    ["3️⃣","AI analyserer","Vi finder allergener automatisk — du kan tjekke inden du sender."],
                    ["4️⃣","Admin godkender","En administrator gennemgår produktet."],
                    ["5️⃣","Alle får glæde af det","Produktet er nu tilgængeligt for alle brugere."],
                  ].map(([num, title, text]) => (
                    <div key={title} style={{ display:"flex", gap:10, alignItems:"flex-start", background:"#fff", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px" }}>
                      <div style={{ fontSize:18, flexShrink:0 }}>{num}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13, color:"var(--ink)", marginBottom:2 }}>{title}</div>
                        <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.4 }}>{text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8, marginTop:14 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(5)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setOnboardStep(7)}>Fortsæt →</button>
                </div>
              </div>
            )}

            {/* ── TRIN 7: Klar! ── */}
            {onboardStep === 7 && (
              <div className="fade-in">
                <div className="card" style={{ textAlign:"center", padding:"32px 20px" }}>
                  <div style={{ fontSize:56, marginBottom:16 }}>🎉</div>
                  <div style={{ fontSize:22, fontWeight:900, color:"var(--text)", marginBottom:8 }}>Du er klar!</div>
                  <div style={{ fontSize:14, color:"var(--muted)", lineHeight:1.6, marginBottom:20 }}>
                    Profil oprettet med {allergens.length+customAllerg.length} allergi{allergens.length+customAllerg.length!==1?"er":""} og {family.length} familiemedlem{family.length!==1?"mer":""}.
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {allergens.length>0&&<div className="tag" style={{justifyContent:"center"}}>🌾 {allergens.length} allergi{allergens.length!==1?"er":""} valgt</div>}
                    {family.length>0&&<div className="tag" style={{justifyContent:"center"}}>👨‍👩‍👧 {family.length} familiemedlem{family.length!==1?"mer":""}</div>}
                    {allergens.length===0&&family.length===0&&<div style={{fontSize:13,color:"var(--muted)"}}>Du kan tilføje allergier og familiemedlemmer i din profil.</div>}
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setOnboardStep(6)}>← Tilbage</button>
                  <button className="btn btn-primary" style={{ flex:1 }} onClick={finishOnboard}>
                    {editMode ? "Gem ændringer ✓" : "Gå til appen →"}
                  </button>
                </div>
                {editMode && <button className="btn btn-outline btn-full" style={{ marginTop:8 }} onClick={() => { setEditMode(false); setScreen(SCREENS.PROFILE); }}>Annuller</button>}
              </div>
            )}

                    </div>
        )}

        {/* TOPBAR */}
        {!isOnboard && (
          <header className="topbar">
            <div className="topbar-logo">
              <div className="topbar-shield" style={{background:"none",padding:0}}><EatSafeLogo size={34} variant="light" /></div>
              <div className="topbar-name">Eat<span>Safe</span></div>
            </div>
            <div className="topbar-avatar" onClick={() => setScreen(SCREENS.PROFILE)}>{initials(user.name||"?")}</div>
          </header>
        )}

        {/* ══ HJEM ══ */}
        {screen === SCREENS.HOME && (
          <div className="screen fade-in">

            {/* Hilsen */}
            <div style={{ padding:"16px 2px 14px" }}>
              <div style={{ fontSize:20, fontWeight:900, color:"var(--ink)", letterSpacing:"-.3px" }}>
                {greeting}, {user.name?.split(" ")[0] || "der"} 👋
              </div>
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:3 }}>
                {allergens.length + customAllerg.length > 0
                  ? `Tjekker for ${allergens.length + customAllerg.length} allergen${allergens.length + customAllerg.length !== 1 ? "er" : ""}`
                  : "Ingen allergier sat — gå til profil"}
              </div>
            </div>

            {/* Stor scan-knap — starter kamera direkte */}
            <div style={{
              background:"var(--ink)", borderRadius:20, marginBottom:10,
              cursor:"pointer", overflow:"hidden", position:"relative",
              boxShadow:"0 4px 20px rgba(31,39,51,.18)",
              transition:"transform .15s, box-shadow .15s",
            }} onClick={() => { setCameraActive(true); setTimeout(startCamera, 50); setScreen(SCREENS.SCAN); }}>
              {/* Laser animation baggrund */}
              <div style={{ padding:"28px 24px", display:"flex", flexDirection:"column", alignItems:"center", gap:16, position:"relative" }}>
                {/* Stregkode-animation */}
                <div style={{ position:"relative", width:180, height:90 }}>
                  {/* Stregkode streger */}
                  <svg viewBox="0 0 180 90" width="180" height="90">
                    <g fill="rgba(255,255,255,0.15)">
                      <rect x="10" y="0" width="7" height="90" rx="1"/>
                      <rect x="22" y="0" width="3" height="90" rx="1"/>
                      <rect x="29" y="0" width="5" height="90" rx="1"/>
                      <rect x="38" y="0" width="2" height="90" rx="1"/>
                      <rect x="44" y="0" width="8" height="90" rx="1"/>
                      <rect x="56" y="0" width="3" height="90" rx="1"/>
                      <rect x="63" y="0" width="6" height="90" rx="1"/>
                      <rect x="73" y="0" width="2" height="90" rx="1"/>
                      <rect x="79" y="0" width="4" height="90" rx="1"/>
                      <rect x="87" y="0" width="7" height="90" rx="1"/>
                      <rect x="98" y="0" width="3" height="90" rx="1"/>
                      <rect x="105" y="0" width="5" height="90" rx="1"/>
                      <rect x="114" y="0" width="2" height="90" rx="1"/>
                      <rect x="120" y="0" width="6" height="90" rx="1"/>
                      <rect x="130" y="0" width="3" height="90" rx="1"/>
                      <rect x="137" y="0" width="8" height="90" rx="1"/>
                      <rect x="149" y="0" width="4" height="90" rx="1"/>
                      <rect x="157" y="0" width="2" height="90" rx="1"/>
                      <rect x="163" y="0" width="7" height="90" rx="1"/>
                    </g>
                  </svg>
                  {/* Laser linje */}
                  <div style={{
                    position:"absolute", left:0, right:0, height:2,
                    background:"linear-gradient(90deg, transparent, #22C55E, #4ADE80, #22C55E, transparent)",
                    animation:"laserMove 2s ease-in-out infinite",
                    filter:"drop-shadow(0 0 6px #22C55E)",
                    boxShadow:"0 0 8px #22C55E",
                  }}/>
                  {/* Hjørnemarkører */}
                  {[["0","0","top","left"],["0","0","top","right"],["0","0","bottom","left"],["0","0","bottom","right"]].map((_,i) => {
                    const pos = [{top:8,left:8},{top:8,right:8},{bottom:8,left:8},{bottom:8,right:8}][i];
                    const borders = [
                      {borderTop:"2px solid rgba(255,255,255,.6)",borderLeft:"2px solid rgba(255,255,255,.6)"},
                      {borderTop:"2px solid rgba(255,255,255,.6)",borderRight:"2px solid rgba(255,255,255,.6)"},
                      {borderBottom:"2px solid rgba(255,255,255,.6)",borderLeft:"2px solid rgba(255,255,255,.6)"},
                      {borderBottom:"2px solid rgba(255,255,255,.6)",borderRight:"2px solid rgba(255,255,255,.6)"},
                    ][i];
                    return <div key={i} style={{ position:"absolute", width:16, height:16, ...pos, ...borders, borderRadius:2 }}/>;
                  })}
                </div>
                {/* Tekst */}
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:20, fontWeight:900, color:"#fff", letterSpacing:"-.4px" }}>Skan produkt</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.5)", marginTop:4 }}>Tryk for at starte kamera</div>
                </div>
              </div>
            </div>

            {/* Søg — fremhævet på forsiden */}
            <div className="card" style={{ padding:"12px 14px", cursor:"pointer", marginBottom:10 }}
              onClick={() => setScreen(SCREENS.SEARCH)}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:40, height:40, background:"var(--paper2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>🔎</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>Søg produkter</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>Find varer der er sikre for dig</div>
                </div>
                <div style={{ fontSize:18, color:"var(--muted)" }}>›</div>
              </div>
            </div>

            {/* Indkøbsliste — kun hvis der er varer */}
            {shoppingList.filter(i => !i.checked).length > 0 && (
              <div className="card" style={{ padding:"12px 14px", cursor:"pointer", marginBottom:10 }}
                onClick={() => setScreen(SCREENS.LIST)}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:40, height:40, background:"var(--green-lt)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>🛒</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700 }}>Indkøbsliste</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>
                      {shoppingList.filter(i => !i.checked).length} vare{shoppingList.filter(i => !i.checked).length !== 1 ? "r" : ""} mangler
                    </div>
                  </div>
                  <div style={{ fontSize:18, color:"var(--muted)" }}>›</div>
                </div>
              </div>
            )}

            {/* Vidste du at — let, i bunden */}
            {(() => {
              const tip = HOME_TIPS[new Date().getDay() % HOME_TIPS.length];
              return (
                <div style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"10px 0", borderTop:"1px solid var(--border)", marginTop:4 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:9, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:3 }}>Vidste du at</div>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--ink)", marginBottom:2 }}>{tip.title}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.5 }}>{tip.text}</div>
                  </div>
                  <div style={{ fontSize:18, flexShrink:0, opacity:.6 }}>{tip.icon}</div>
                </div>
              );
            })()}

          </div>
        )}

        {/* ══ SKAN ══ */}
        {screen === SCREENS.SCAN && (
          <div className="screen fade-in">
            <div className="screen-title">📷 Skan produkt</div>

            {/* Familie-profilvælger */}
            {family.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>Scanner for</div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {[{ id:"me", name: user.name||"Mig" }, ...family].map(m => {
                    const isActive = activeProfiles.includes(m.id);
                    return (
                      <div key={m.id}
                        onClick={() => setActiveProfiles(p => p.includes(m.id) ? p.filter(x => x !== m.id).length === 0 ? [m.id] : p.filter(x => x !== m.id) : [...p, m.id])}
                        style={{
                          display:"flex", alignItems:"center", gap:6,
                          background: isActive ? "var(--green-lt)" : "var(--paper2)",
                          border: `1.5px solid ${isActive ? "var(--green)" : "var(--border)"}`,
                          borderRadius:20, padding:"5px 10px 5px 7px",
                          cursor:"pointer", transition:"all .15s",
                        }}>
                        <div style={{
                          width:20, height:20, borderRadius:"50%",
                          background: isActive ? "var(--green)" : "var(--border2)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:9, fontWeight:800, color: isActive ? "#fff" : "var(--muted)",
                        }}>
                          {initials(m.name).slice(0,2)}
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color: isActive ? "var(--green)" : "var(--muted)" }}>
                          {m.name.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="scan-box">
              {/* qr-reader skal ALTID være i DOM — html5-qrcode kræver det */}
              <div id="qr-reader" style={{ width:"100%", display: cameraActive ? "block" : "none" }} />
              {cameraActive ? (
                <div className="scan-bar">
                  <span className="scan-bar-txt">📷 Kamera aktivt — hold stregkoden ind i rammen</span>
                  <button className="btn btn-sm" style={{ background:"rgba(255,255,255,.2)",color:"#fff",border:"none",fontSize:12 }} onClick={stopCamera}>Stop</button>
                </div>
              ) : (
                <div>
                  <div className="scan-viewfinder" onClick={startCamera}>
                    <div className="scan-corner tl" /><div className="scan-corner tr" />
                    <div className="scan-corner bl" /><div className="scan-corner br" />
                    <div className="scan-laser" />
                    <div className="scan-camera-icon">📷</div>
                    <div className="scan-camera-text">Tryk for at åbne kamera</div>
                  </div>
                  <div className="scan-bar"><span className="scan-bar-txt">📱 Tryk for at starte kamera-scanning</span></div>
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-lbl">Manuel stregkode</div>
              <div className="input-row" style={{ marginBottom:10 }}>
                <input className="field" placeholder="Indtast EAN-kode…" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={e => e.key==="Enter" && lookupProduct(barcodeInput)} />
                <button className="btn btn-primary btn-sm" style={{ whiteSpace:"nowrap" }} onClick={() => lookupProduct(barcodeInput)} disabled={loading}>Søg</button>
              </div>
              <div className="card-lbl">Prøv en demo-kode</div>
              <div style={{ display:"flex", flexWrap:"wrap" }}>
                {DEMO_CODES.map(d => <span key={d.code} className="demo-code" onClick={() => { setBarcodeInput(d.code); lookupProduct(d.code); }}>{d.label}</span>)}
              </div>
            </div>
            {loading && <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Analyserer produkt…</div><div className="loader-sub">Slår op i databasen</div></div>}
            {scanError && !loading && <div className="error-box">⚠️ {scanError}</div>}
            {history.length>0&&!loading&&(
              <div className="card">
                <div className="card-lbl">Seneste scanninger</div>
                {history.slice(0,4).map((h,i) => {
                  const s = h.result||h.status; const name = h.products?.name||h.name||h.ean_scanned||"Ukendt";
                  return (
                    <div key={i} className="hist-row" onClick={() => { setScanResult({...h,code:h.ean_scanned||h.code,name,brand:h.products?.brand||h.brand||"",headline:s==="safe"?"Sikkert produkt":s==="danger"?"Indeholder allergen!":"Mulige spor",flags:[],summary:""}); setScreen(SCREENS.RESULT); }}>
                      <div className={`hist-dot ${s}`} />
                      <div className="hist-info"><div className="hist-name">{name}</div><div className="hist-time">{timeAgo(h.scanned_at||h.timestamp)}</div></div>
                      <div className={`badge ${s==="safe"?"safe":s==="danger"?"danger":"warn"}`}>{s==="safe"?"Sikker":s==="danger"?"Farlig":s==="not_found"?"Ikke fundet":"Advarsel"}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ RESULTAT ══ */}
        {screen === SCREENS.RESULT && scanResult && (
          <div className="screen fade-in">
            <button className="btn btn-ghost btn-sm" style={{ marginTop:16, marginBottom:12 }} onClick={() => setScreen(SCREENS.SCAN)}>← Tilbage til scan</button>

            {/* Produkt hero header */}
            <div className="product-hero">
              {scanResult.image_url
                ? <img src={scanResult.image_url} alt={scanResult.name} className="product-hero-img" onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
                : null
              }
              <div className="product-hero-img-placeholder" style={{ display: scanResult.image_url ? "none" : "flex" }}>
                {getProductIcon(scanResult)}
              </div>
              <div className="product-hero-body">
                <div className="product-hero-name">{scanResult.name}</div>
                {scanResult.brand && <div className="product-hero-brand">{scanResult.brand}</div>}
                <div className="product-hero-meta">
                  <span style={{ fontSize:10, color:"var(--muted)", fontWeight:500 }}>EAN: {scanResult.code}</span>
                  {scanResult.source && (() => {
                    const vb = verifiedBadge(scanResult.verified_status, scanResult.source);
                    return <span className="product-hero-source" style={{ background:vb.bg, color:vb.color, fontSize:9, opacity:0.75 }}>{vb.label}</span>;
                  })()}
                </div>
              </div>
            </div>

            {/* Allergen resultat banner */}
            <div className={`result-banner ${scanResult.status}`} style={{ marginBottom:10 }}>
              <div className="rb-icon">{scanResult.status==="safe"?"✅":scanResult.status==="danger"?"🚫":"⚠️"}</div>
              <div style={{ flex:1 }}>
                <div className={`rb-title ${scanResult.status}`}>{scanResult.headline}</div>
                <div className="rb-sub">{scanResult.summary}</div>
              </div>
            </div>

            {/* ── PROFIL-KORT: én samlet visning per person ── */}
            <div className="card">
              <div className="card-lbl">Din sikkerhed</div>
              {(() => {
                const flags = scanResult.allergen_flags || {};
                const profiles = [
                  { id:"me", name: user.name||"Dig", allergens, color:"var(--green)" },
                  ...family.filter(m => activeProfiles.includes(m.id)),
                ];
                return profiles.map(p => {
                  const danger = p.allergens.filter(a => flags[a] === "yes");
                  const warning = p.allergens.filter(a => flags[a] === "traces");
                  const safe = danger.length === 0 && warning.length === 0;
                  const color = danger.length > 0 ? "var(--red)" : warning.length > 0 ? "var(--amber)" : "var(--green)";
                  const bg = danger.length > 0 ? "var(--red-lt)" : warning.length > 0 ? "var(--amber-lt)" : "var(--green-lt)";
                  const border = danger.length > 0 ? "var(--red-md)" : warning.length > 0 ? "var(--amber-md)" : "var(--green-mid)";
                  return (
                    <div key={p.id} style={{ background:bg, border:`1px solid ${border}`, borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom: safe ? 0 : 8 }}>
                        <div style={{ width:32, height:32, borderRadius:"50%", background:color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:"#fff", flexShrink:0 }}>
                          {initials(p.id==="me" ? (user.name||"Mig") : p.name).slice(0,2)}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:800, color:"var(--ink)" }}>{p.id==="me" ? (user.name||"Dig") : p.name}</div>
                          <div style={{ fontSize:11, fontWeight:700, color }}>{danger.length > 0 ? "🚫 Indeholder dine allergener" : warning.length > 0 ? "⚠️ Mulige spor af dine allergener" : "✅ Sikkert for dig"}</div>
                        </div>
                      </div>
                      {danger.length > 0 && (
                        <div className="tags">
                          {danger.map(id => { const a=ALLERGENS.find(x=>x.id===id); return a ? <div key={id} className="tag" style={{ fontSize:11, background:"rgba(230,57,70,.12)", color:"var(--red)", borderColor:"var(--red-md)" }}>{a.emoji} {a.label}</div> : null; })}
                        </div>
                      )}
                      {warning.length > 0 && (
                        <div className="tags" style={{ marginTop: danger.length > 0 ? 4 : 0 }}>
                          {warning.map(id => { const a=ALLERGENS.find(x=>x.id===id); return a ? <div key={id} className="tag" style={{ fontSize:11, background:"rgba(217,119,6,.1)", color:"var(--amber)", borderColor:"var(--amber-md)" }}>spor: {a.emoji} {a.label}</div> : null; })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* ── PRODUKTETS ØVRIGE ALLERGENER (kollapsibel) ── */}
            {scanResult.allergen_flags && (() => {
              const flags = scanResult.allergen_flags;
              const present = Object.entries(flags).filter(([k,v]) => v==="yes" && ALLERGENS.find(a=>a.id===k));
              const traces = Object.entries(flags).filter(([k,v]) => v==="traces" && ALLERGENS.find(a=>a.id===k));
              const myAllergens = new Set([...scanResult.matchedDanger||[], ...scanResult.matchedWarning||[]]);
              const otherPresent = present.filter(([k]) => !myAllergens.has(k));
              const otherTraces = traces.filter(([k]) => !myAllergens.has(k));
              if (otherPresent.length === 0 && otherTraces.length === 0) return null;
              return (
                <div className="card">
                  <div className="card-lbl">Andre allergener i produktet</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10 }}>Disse allergener er i produktet, men er ikke registreret på dine profiler.</div>
                  {otherPresent.length > 0 && (
                    <div style={{ marginBottom:8 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:5 }}>Indeholder</div>
                      <div className="tags">
                        {otherPresent.map(([k]) => { const a=ALLERGENS.find(x=>x.id===k); return a ? <div key={k} className="tag" style={{ background:"var(--paper2)", color:"var(--ink2)", borderColor:"var(--border2)" }}>{a.emoji} {a.label}</div> : null; })}
                      </div>
                    </div>
                  )}
                  {otherTraces.length > 0 && (
                    <div>
                      <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:5 }}>Kan indeholde spor af</div>
                      <div className="tags">
                        {otherTraces.map(([k]) => { const a=ALLERGENS.find(x=>x.id===k); return a ? <div key={k} className="tag" style={{ background:"var(--paper2)", color:"var(--ink2)", borderColor:"var(--border2)" }}>{a.emoji} {a.label}</div> : null; })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Ingrediensliste */}
            {scanResult.ingredients && (
              <div className="card">
                <div className="ing-toggle" onClick={() => setShowIng(v => !v)}>
                  <span>📋 Ingrediensliste</span>
                  <span>{showIng?"▲":"▼"}</span>
                </div>
                {showIng && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ padding:"10px", background:"var(--paper2)", borderRadius:8, marginBottom:8 }}>
                      <IngredientsList text={scanResult.ingredients} allergenFlags={scanResult.allergen_flags||{}} />
                    </div>
                    <div style={{ fontSize:10, color:"var(--muted)", fontStyle:"italic", marginBottom:6 }}>
                      🔴 Fremhævet = kendt allergen
                    </div>
                    <div style={{ fontSize:10, color:"var(--muted)", padding:"6px 8px", background:"var(--paper2)", borderRadius:6, lineHeight:1.4 }}>
                      ⚠️ Ingredienslisten vises som den fremgår på emballagen og kan være på et andet sprog. Resultater er vejledende — tjek altid selv.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Ansvarsfraskrivelse */}
            <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 14px", background:"var(--amber-lt)", border:"1px solid var(--amber-md)", borderRadius:10, marginBottom:10 }}>
              <span style={{ fontSize:14, flexShrink:0 }}>⚠️</span>
              <div style={{ fontSize:11, color:"var(--amber)", lineHeight:1.5, fontWeight:600 }}>
                Resultater er vejledende og kan indeholde fejl. Tjek altid selv ved alvorlige allergier.
              </div>
            </div>

            {/* Ansvarsfraskrivelse */}
            <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 14px", background:"var(--amber-lt)", border:"1px solid var(--amber-md)", borderRadius:10, marginBottom:10 }}>
              <span style={{ fontSize:14, flexShrink:0 }}>⚠️</span>
              <div style={{ fontSize:11, color:"var(--amber)", lineHeight:1.5, fontWeight:600 }}>
                Resultater er vejledende og kan indeholde fejl. Tjek altid selv ved alvorlige allergier.
              </div>
            </div>

            {/* Handlinger */}
            <div className="card">
              <div className="card-lbl">Handlinger</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <button
                  className="btn btn-sm"
                  style={{ flex:1, background: isFavorite(scanResult.code) ? "var(--amber-lt)" : "var(--paper2)", color: isFavorite(scanResult.code) ? "var(--amber)" : "var(--ink2)", border:"1px solid var(--border)" }}
                  onClick={() => toggleFavorite(scanResult)}
                >
                  {isFavorite(scanResult.code) ? "★ Fjern favorit" : "☆ Gem favorit"}
                </button>
                <button className="btn btn-outline btn-sm" style={{ flex:1 }} onClick={() => { addToList(scanResult.name); setScreen(SCREENS.LIST); }}>🛒 Til liste</button>
                <button className="btn btn-ghost btn-sm" style={{ flex:1 }} onClick={() => { if(navigator.share) navigator.share({title:scanResult.name, text:scanResult.headline}); else alert("Del ikke tilgængeligt"); }}>📤 Del</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ PRODUKT IKKE FUNDET ══ */}
        {screen === SCREENS.NOTFOUND && (
          <div className="screen fade-in">
            <button className="btn btn-ghost btn-sm" style={{ marginTop:16, marginBottom:12 }} onClick={() => setScreen(SCREENS.SCAN)}>← Tilbage til scan</button>

            {/* Hero — motiverende besked */}
            <div style={{ background:"var(--ink)", borderRadius:16, padding:"24px 20px", marginBottom:12, textAlign:"center" }}>
              <div style={{ fontSize:44, marginBottom:10 }}>🤝</div>
              <div style={{ fontSize:18, fontWeight:900, color:"#fff", marginBottom:8 }}>Produktet kendes ikke endnu</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.65)", lineHeight:1.6 }}>
                Du er den første der scanner dette produkt! Hjælp andre med allergier ved at indsende det — det tager under 1 minut.
              </div>
            </div>

            {/* EAN */}
            <div style={{ display:"flex", alignItems:"center", gap:10, background:"#fff", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", marginBottom:12 }}>
              <div style={{ fontSize:20 }}>🏷️</div>
              <div>
                <div style={{ fontSize:11, color:"var(--muted)", fontWeight:600 }}>Stregkode</div>
                <div style={{ fontSize:14, fontWeight:700, fontFamily:"monospace" }}>{notFoundEan}</div>
              </div>
            </div>

            {ocrLoading && <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Analyserer billede…</div><div className="loader-sub">OCR og allergendetektering</div></div>}
            {!ocrText && !ocrLoading && (
              <div>
                {/* Trin-guide */}
                <div className="card" style={{ marginBottom:12 }}>
                  <div className="card-lbl">Sådan gør du — 3 nemme trin</div>
                  {[
                    ["📸","Tag billede af ingredienslisten","Vend pakken om og fotografér bagsiden med ingredienserne. Hold kameraet stille for bedste resultat."],
                    ["🤖","Vi analyserer automatisk","Vores AI læser teksten og finder allergener. Du kan tjekke og rette inden du sender."],
                    ["✅","Hjælp alle andre","Når admin har godkendt, kan alle EatSafe-brugere se produktet. Du gør en forskel!"],
                  ].map(([icon, title, text], i) => (
                    <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom: i < 2 ? 14 : 0, paddingBottom: i < 2 ? 14 : 0, borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:"var(--green-lt)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)", marginBottom:3 }}>{title}</div>
                        <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.5 }}>{text}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <label className="btn btn-primary btn-full" style={{ cursor:"pointer", fontSize:15 }}>
                  📸 Start — fotografér ingredienslisten
                  <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleImageCapture} />
                </label>
                <div style={{ textAlign:"center", marginTop:10, fontSize:12, color:"var(--muted)" }}>
                  Har du ikke pakken ved hånden? <span style={{ color:"var(--green)", fontWeight:700, cursor:"pointer" }} onClick={() => setScreen(SCREENS.SCAN)}>Spring over</span>
                </div>
              </div>
            )}
            {ocrText && !ocrLoading && (
              <div className="fade-in">
                {/* Produktnavn */}
                <div className="card">
                  <div className="card-lbl">Produktnavn</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>Vi har forsøgt at gætte navnet fra billedet — ret det hvis det er forkert.</div>
                  <input
                    className="field"
                    placeholder="Indtast produktnavn…"
                    value={proposedName}
                    onChange={e => setProposedName(e.target.value)}
                  />
                </div>

                {/* Produktbillede */}
                <div className="card">
                  <div className="card-lbl">Produktbillede (valgfrit)</div>
                  <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>Tag et billede af produktets forside.</div>
                  {productImagePreview && (
                    <div style={{ marginBottom:10, textAlign:"center" }}>
                      <img src={productImagePreview} alt="Produkt" style={{ maxWidth:"100%", maxHeight:150, borderRadius:8, objectFit:"contain" }} />
                    </div>
                  )}
                  <label className="btn btn-ghost btn-full btn-sm" style={{ cursor:"pointer" }}>
                    📷 {productImagePreview ? "Skift billede" : "Tag produktbillede"}
                    <input type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleProductImageCapture} />
                  </label>
                </div>

                {/* OCR tekst */}
                <div className="card">
                  <div className="card-lbl">Ingredienser fra billedet</div>
                  <div style={{ fontSize:12, color:"var(--muted)", lineHeight:1.7, maxHeight:100, overflowY:"auto" }}>{ocrText}</div>
                </div>

                {/* Allergener */}
                {proposedFlags && (
                  <div className="card">
                    <div className="card-lbl">Foreslåede allergener</div>
                    <div className="tags">
                      {Object.entries(proposedFlags).filter(([,v]) => v==="yes"||v==="traces").map(([k,v]) => {
                        const a = ALLERGENS.find(x=>x.id===k);
                        return a ? <div key={k} className="tag" style={v==="traces"?{background:"var(--amber-lt)",color:"var(--amber)"}:{}}>{a.emoji} {a.label}{v==="traces"?" (spor)":""}</div> : null;
                      })}
                      {Object.entries(proposedFlags).filter(([,v]) => v==="yes"||v==="traces").length===0 && (
                        <div style={{ fontSize:13, color:"var(--muted)" }}>Ingen allergener detekteret</div>
                      )}
                    </div>
                    {scanError && <div className="error-box" style={{ marginTop:8 }}>⚠️ {scanError}</div>}
                    <button className="btn btn-primary btn-full" style={{ marginTop:12 }} onClick={submitProduct} disabled={submitting}>
                      {submitting ? "Sender…" : "✓ Bekræft og indsend"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ INDSENDELSE BEKRÆFTET ══ */}
        {screen === SCREENS.SUBMITTED && (
          <div className="screen fade-in">
            <div className="card" style={{ textAlign:"center", padding:"40px 24px", marginTop:32 }}>
              <div style={{ fontSize:56, marginBottom:16 }}>🙏</div>
              <div style={{ fontSize:22, fontWeight:900, color:"var(--text)", marginBottom:8 }}>Tak for dit bidrag!</div>
              <div style={{ fontSize:14, color:"var(--muted)", lineHeight:1.7, marginBottom:20 }}>
                Din indsendelse er modtaget og afventer godkendelse af vores team. Når produktet er godkendt, vil det være tilgængeligt for alle brugere.
              </div>
              <div className="info-box" style={{ textAlign:"left" }}>ℹ️ Midlertidigt allergenresultat er baseret på OCR-analysen og er ikke verificeret endnu.</div>
              {proposedFlags && (
                <div style={{ textAlign:"left", marginBottom:16 }}>
                  <div className="card-lbl">Analyserede allergener</div>
                  <div className="tags">
                    {Object.entries(proposedFlags).filter(([,v]) => v==="yes"||v==="traces").map(([k,v]) => {
                      const a = ALLERGENS.find(x=>x.id===k);
                      return a ? <div key={k} className="tag">{a.emoji} {a.label}</div> : null;
                    })}
                    {Object.entries(proposedFlags).filter(([,v]) => v==="yes"||v==="traces").length===0 && <div style={{fontSize:13,color:"var(--muted)"}}>Ingen allergener detekteret</div>}
                  </div>
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-full" onClick={() => { setOcrText(""); setProposedFlags(null); setScreen(SCREENS.HOME); }}>← Tilbage til hjem</button>
          </div>
        )}

        {/* ══ SØG ══ */}
        {screen === SCREENS.SEARCH && (
          <div className="screen fade-in">
            <div className="screen-title">🔎 Søg varer</div>
            <div className="screen-sub">Find produkter der er sikre for dig og familien.</div>
            <div style={{ display:"flex", gap:8, marginBottom:10 }}>
              <input
                className="field"
                placeholder="Søg på produkt eller mærke…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { setSearchResults([]); }}}
                style={{ flex:1, marginBottom:0 }}
                autoFocus
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ whiteSpace:"nowrap", padding:"0 16px" }}
                onClick={() => { setSearchResults([]); }}
                disabled={!searchQuery.trim()}
              >
                Søg
              </button>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <div className={`filter-chip${showSafeOnly?" active":""}`} onClick={() => setShowSafeOnly(v => !v)}>
                {showSafeOnly ? "✅ Kun sikre" : "Vis kun sikre"}
              </div>
              <div style={{ fontSize:12, color:"var(--muted)" }}>{searchResults.length} resultat{searchResults.length!==1?"er":""}</div>
            </div>
            {searchLoading && <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Søger…</div></div>}
            {searchLoading && searchResults.length===0 && (
              <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Søger…</div></div>
            )}
            {false && (
              <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", padding:"8px", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <div className="spinner" style={{ width:14, height:14, borderWidth:2 }} />
                Søger i Open Food Facts…
              </div>
            )}
            {!searchLoading && searchQuery && searchResults.length===0 && (
              <div className="empty-state"><span className="empty-icon">🔍</span><div className="empty-txt">Ingen resultater</div><div className="empty-sub">Prøv et andet søgeord</div></div>
            )}
            {!searchQuery && (
              <div className="empty-state"><span className="empty-icon">🔎</span><div className="empty-txt">Søg efter et produkt</div><div className="empty-sub">Skriv et produktnavn eller mærke</div></div>
            )}
            {searchResults.filter(p => !showSafeOnly || p.conflicts?.length === 0).map(p => {
              const vb = verifiedBadge(p.verified||p.verified_status, p.source);
              return (
                <div key={p.id} className="product-card" style={{ cursor:"pointer" }} onClick={() => lookupProduct(p.ean||p.id)}>
                  <ProductImage product={p} size={44} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="product-name">{p.name}</div>
                    <div className="product-brand">{p.brand}{p.category?` · ${p.category}`:""}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:4, flexWrap:"wrap" }}>
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 6px", borderRadius:4, background:vb.bg, color:vb.color }}>{vb.label}</span>
                      <ProfileBadges allergenFlags={p.allergen_flags||{}} allergens={allergens} customAllerg={customAllerg} family={family} activeProfiles={activeProfiles} size={20} />
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, flexShrink:0 }}>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize:11, padding:"5px 9px" }} onClick={e => { e.stopPropagation(); addToList(p.name); }}>+ Liste</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ INDKØBSLISTE ══ */}
        {screen === SCREENS.LIST && (
          <div className="screen fade-in">
            <div className="screen-title">🛒 Indkøbsliste</div>
            <div className="share-bar">
              <span style={{ fontSize:18 }}>🔗</span>
              <span className="share-txt">Del listen med familie via link</span>
              <button className="btn btn-ghost btn-sm" style={{ fontSize:12 }} onClick={() => { navigator.clipboard?.writeText(window.location.href); alert("Link kopieret! 📋"); }}>Kopiér</button>
            </div>
            <div className="card" style={{ padding:"13px 14px", marginBottom:14 }}>
              <div className="card-lbl">Tilføj vare</div>
              <div className="input-row">
                <input className="field" placeholder="Fx. Glutenfri pasta…" value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => e.key==="Enter" && addToList(newItemName)} />
                <button className="btn btn-primary btn-sm" style={{ whiteSpace:"nowrap" }} onClick={() => addToList(newItemName)}>Tilføj</button>
              </div>
            </div>
            {shoppingList.length===0 && <div className="empty-state"><span className="empty-icon">🛒</span><div className="empty-txt">Listen er tom</div><div className="empty-sub">Tilføj din første vare</div></div>}
            {shoppingList.filter(i => !i.checked).length>0 && (
              <><div className="list-section">Mangler ({shoppingList.filter(i=>!i.checked).length})</div>
              {shoppingList.filter(i => !i.checked).map(item => (
                <div key={item.id} className="list-item">
                  <div className="list-check" onClick={() => toggleItem(item.id)} />
                  <div className="list-name">{item.name}</div>
                  <div className="list-del" onClick={() => removeItem(item.id)}>🗑</div>
                </div>
              ))}</>
            )}
            {shoppingList.filter(i => i.checked).length>0 && (
              <><div className="list-section" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span>Købt ({shoppingList.filter(i=>i.checked).length})</span>
                <span style={{ cursor:"pointer", color:"var(--red)", fontWeight:700, fontSize:12 }} onClick={clearDone}>Ryd</span>
              </div>
              {shoppingList.filter(i => i.checked).map(item => (
                <div key={item.id} className="list-item done">
                  <div className="list-check checked" onClick={() => toggleItem(item.id)}>✓</div>
                  <div className="list-name done">{item.name}</div>
                  <div className="list-del" onClick={() => removeItem(item.id)}>🗑</div>
                </div>
              ))}</>
            )}
          </div>
        )}

        {/* ══ HISTORIK ══ */}
        {screen === SCREENS.HISTORY && (
          <div className="screen fade-in">
            <div className="screen-title">📋 Scanningshistorik</div>
            <div className="screen-sub">Alle dine tidligere scanninger.</div>
            <button className="btn btn-ghost btn-sm" style={{ marginBottom:14 }} onClick={() => { loadHistory(); }}>🔄 Opdater</button>
            {historyLoading && <div className="loader fade-in"><div className="spinner" /><div className="loader-txt">Henter historik…</div></div>}
            {!historyLoading && history.length===0 && (
              <div className="empty-state"><span className="empty-icon">📋</span><div className="empty-txt">Ingen scanninger endnu</div><div className="empty-sub">Skan dit første produkt</div></div>
            )}
            {history.map((h,i) => {
              const s = h.result||h.status;
              const name = h.products?.name||h.name||h.ean_scanned||"Ukendt";
              return (
                <div key={i} className="hist-row" style={{ padding:"12px 0" }} onClick={() => {
                  setScanResult({ code:h.ean_scanned||h.code, name, brand:h.products?.brand||h.brand||"", status:s, headline:s==="safe"?"Sikkert produkt":s==="danger"?"Indeholder allergen!":"Mulige spor", flags:[], summary:"", timestamp:new Date(h.scanned_at||h.timestamp).getTime() });
                  setScreen(SCREENS.RESULT);
                }}>
                  <div className={`hist-dot ${s}`} />
                  <div className="hist-info"><div className="hist-name">{name}</div><div className="hist-time">{timeAgo(h.scanned_at||h.timestamp)}</div></div>
                  <div className={`badge ${s==="safe"?"safe":s==="danger"?"danger":s==="not_found"?"":"warn"}`}>{s==="safe"?"Sikker":s==="danger"?"Farlig":s==="not_found"?"Ikke fundet":"Advarsel"}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══ PROFIL ══ */}
        {screen === SCREENS.PROFILE && (
          <div className="screen fade-in">

            {/* Hero */}
            <div className="profile-hero">
              <div className="pa-lg">{initials(user.name||"?")}</div>
              <div style={{ flex:1 }}>
                <div className="profile-hero-name">{user.name||"Din profil"}</div>
                <div className="profile-hero-sub">{allergens.length+customAllerg.length} allergi{allergens.length+customAllerg.length!==1?"er":""} · {family.length} familiemedlem{family.length!==1?"mer":""}</div>
              </div>
              <button className="profile-edit-btn" onClick={() => setScreen(SCREENS.EDITPROFILE)}>Rediger</button>
            </div>

            {/* Mine allergier */}
            <div className="card">
              <div className="card-lbl" style={{ display:"flex", justifyContent:"space-between" }}>
                <span>Mine allergier</span>
                <span style={{ cursor:"pointer", color:"var(--green)", fontWeight:700, fontSize:11 }} onClick={() => setScreen(SCREENS.EDITPROFILE)}>Rediger</span>
              </div>
              {allergens.length+customAllerg.length===0
                ? <div style={{ fontSize:13, color:"var(--muted)" }}>Ingen registreret — tryk Rediger</div>
                : <div className="tags">{getAllergenLabels(allergens,customAllerg).map((a,i) => <div key={i} className="tag">{a}</div>)}</div>}
            </div>

            {/* Alt det andet — samlet menu */}
            <div className="card" style={{ padding:"6px 0" }}>
              {[
                ["★", "Favoritter & historik", () => setScreen(SCREENS.FAVORITES)],
                ["👨‍👩‍👧", "Familie", () => setScreen(SCREENS.FAMILY)],
                ["🌍", "Madpas", () => setScreen(SCREENS.MADPAS)],
                ["🍽️", "Opskrifter", () => setScreen(SCREENS.RECIPES)],
                ...(user.role === "admin" ? [["⚙️", "Admin", () => { loadSubmissions(); loadAdminStats(); setScreen(SCREENS.ADMIN); }]] : []),
              ].map(([icon, lbl, fn], i, arr) => (
                <div key={lbl} onClick={fn} style={{
                  display:"flex", alignItems:"center", gap:12,
                  padding:"13px 16px",
                  borderBottom: i < arr.length-1 ? "1px solid var(--border)" : "none",
                  cursor:"pointer",
                }}>
                  <div style={{ width:36, height:36, background:"var(--paper2)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
                  <div style={{ flex:1, fontSize:14, fontWeight:600, color:"var(--ink)" }}>{lbl}</div>
                  <div style={{ fontSize:18, color:"var(--muted)" }}>›</div>
                </div>
              ))}
            </div>

            {/* Konto */}
            <div className="card">
              <div className="card-lbl">Konto</div>
              <div style={{ fontSize:13, color:"var(--muted)", marginBottom:4 }}>Email</div>
              <div style={{ fontSize:14, fontWeight:600, color:"var(--ink)", marginBottom:12 }}>{user.email||loginEmail||"—"}</div>
              <button className="btn btn-danger btn-full btn-sm" style={{ marginBottom:8 }} onClick={() => { if(window.confirm("Er du sikker på at du vil slette din konto? Dette kan ikke fortrydes.")) alert("Kontakt support for at slette konto."); }}>Slet konto</button>
              <button className="btn btn-ghost btn-full btn-sm" onClick={clearAuth}>Log ud</button>
            </div>

          </div>
        )}

        {/* ══ FAMILIE ══ */}
        {screen === SCREENS.FAMILY && (
          <div className="screen fade-in">
            <div className="screen-title">👨‍👩‍👧 Familie</div>
            <div className="screen-sub">Administrér familiemedlemmers allergiprofiler.</div>
            <div className="card" style={{ padding:"12px 14px" }}>
              <div className="card-lbl">Aktive profiler ved scanning</div>
              <FamilyChips />
            </div>
            {family.length===0 && <div className="empty-state"><span className="empty-icon">👨‍👩‍👧</span><div className="empty-txt">Ingen familiemedlemmer endnu</div><div className="empty-sub">Tilføj nedenfor</div></div>}
            {family.map(m => (
              <div key={m.id} className="family-member">
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:m.allergens.length?10:0 }}>
                  <div className="fm-avatar" style={{ background:m.color, color:"#fff" }}>{initials(m.name)}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:15 }}>{m.name}</div>
                    <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{m.allergens.length} allergi{m.allergens.length!==1?"er":""}</div>
                  </div>
                  <span style={{ cursor:"pointer", opacity:.35, fontSize:18, padding:4 }} onClick={() => removeMember(m.id)}>🗑</span>
                </div>
                {m.allergens.length>0 && <div className="tags">{getAllergenLabels(m.allergens,m.custom||[]).map((a,j) => <div key={j} className="tag" style={{ fontSize:11 }}>{a}</div>)}</div>}
              </div>
            ))}
            <div className="card">
              <div className="card-title">+ Tilføj familiemedlem</div>
              <label className="field-lbl" style={{ marginTop:8 }}>Navn</label>
              <input className="field" placeholder="Fx. Peter (12 år)" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} style={{ marginBottom:12 }} />
              <div className="card-lbl">Allergier</div>
              <div className="chip-grid" style={{ marginBottom:12 }}>
                {ALLERGENS.map(a => { const on = newMemberAllerg.includes(a.id); return (
                  <div key={a.id} className={`chip${on?" on":""}`} onClick={() => setNewMemberAllerg(p => on ? p.filter(x => x !== a.id) : [...p, a.id])}>
                    <span>{a.emoji}</span><span style={{ flex:1 }}>{a.label}</span>{on && <div className="chip-check">✓</div>}
                  </div>
                );})}
              </div>
              <button className="btn btn-primary btn-full" onClick={addMember}>+ Tilføj {newMemberName||"familiemedlem"}</button>
            </div>
          </div>
        )}

        {/* ══ ADMIN ══ */}
        {screen === SCREENS.ADMIN && !openSubmission && (
          <div className="screen fade-in">
            <div className="screen-title">⚙️ Admin</div>

            {/* Statistik */}
            {adminStats && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                {[
                  [adminStats.total_users,"👥","Brugere"],
                  [adminStats.total_products,"📦","Produkter"],
                  [adminStats.total_scans,"📷","Scanninger"],
                  [adminStats.pending_submissions,"⏳","Afventer"],
                  [adminStats.total_families,"👨‍👩‍👧","Familier"],
                ].map(([n,ic,lbl]) => (
                  <div key={lbl} style={{ background:"#fff", border:"1px solid var(--border)", borderRadius:12, padding:"10px 6px", textAlign:"center", boxShadow:"var(--sh)" }}>
                    <div style={{ fontSize:18 }}>{ic}</div>
                    <div style={{ fontWeight:900, fontSize:20, color:"var(--ink)" }}>{n ?? "—"}</div>
                    <div style={{ fontSize:10, color:"var(--muted)", fontWeight:600, textTransform:"uppercase", letterSpacing:".4px" }}>{lbl}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filter tabs */}
            <div style={{ display:"flex", gap:6, marginBottom:12 }}>
              {[["pending","⏳ Afventer"],["approved","✅ Godkendt"],["rejected","❌ Afvist"]].map(([val,lbl]) => (
                <button key={val} className="btn btn-sm" onClick={() => { setSubmissionFilter(val); loadSubmissions(); }}
                  style={{ flex:1, fontSize:11, fontWeight:700,
                    background: submissionFilter===val ? "var(--ink)" : "var(--paper2)",
                    color: submissionFilter===val ? "#fff" : "var(--muted)",
                    border:"1px solid var(--border)" }}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* Indsendelser liste */}
            <div className="card">
              <div className="card-lbl" style={{ display:"flex", justifyContent:"space-between" }}>
                <span>Indsendelser ({submissions.length})</span>
                <span style={{ cursor:"pointer", color:"var(--green)", fontWeight:700, fontSize:12 }} onClick={() => { loadSubmissions(); loadAdminStats(); }}>🔄</span>
              </div>
              {submissionsLoading && <div className="loader"><div className="spinner"/><div className="loader-txt">Henter…</div></div>}
              {!submissionsLoading && submissions.length === 0 && (
                <div className="empty-state" style={{ padding:"20px 0" }}>
                  <div className="empty-txt">Ingen indsendelser</div>
                </div>
              )}
              {submissions.map(s => {
                const allergens = s.ai_parsed_data ? Object.entries(s.ai_parsed_data).filter(([k,v]) => (v==="yes"||v==="traces") && ALLERGENS.find(a=>a.id===k)) : [];
                return (
                  <div key={s.id} style={{ borderTop:"1px solid var(--border)", paddingTop:12, marginTop:12, cursor:"pointer" }}
                    onClick={() => { setOpenSubmission(s); setEditingSubmission({ name: s.ai_parsed_data?.name || "", brand: s.ai_parsed_data?.brand || "", allergen_flags: s.ai_parsed_data || {} }); }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:14 }}>{s.ai_parsed_data?.name || "Ukendt produkt"}</div>
                        <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>EAN: {s.ean} · {new Date(s.created_at).toLocaleDateString("da-DK")}</div>
                        {s.user_confirmed && <div style={{ fontSize:11, color:"var(--green)", fontWeight:600, marginTop:2 }}>✓ Bruger bekræftet</div>}
                      </div>
                      <div style={{ fontSize:18, color:"var(--muted)", marginLeft:8 }}>›</div>
                    </div>
                    {allergens.length > 0 && (
                      <div className="tags" style={{ marginTop:6 }}>
                        {allergens.slice(0,4).map(([k,v]) => {
                          const a = ALLERGENS.find(x=>x.id===k);
                          return a ? <div key={k} className="tag" style={{ fontSize:10, background:v==="yes"?"var(--red-lt)":"var(--amber-lt)", color:v==="yes"?"var(--red)":"var(--amber)", borderColor:v==="yes"?"var(--red-md)":"var(--amber-md)" }}>{a.emoji} {a.label}</div> : null;
                        })}
                        {allergens.length > 4 && <div className="tag" style={{ fontSize:10 }}>+{allergens.length-4} mere</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ ADMIN — ÅBEN SUBMISSION ══ */}
        {screen === SCREENS.ADMIN && openSubmission && editingSubmission && (
          <div className="screen fade-in">
            <button className="btn btn-ghost btn-sm" style={{ marginTop:16, marginBottom:12 }} onClick={() => { setOpenSubmission(null); setEditingSubmission(null); }}>← Tilbage</button>

            {/* Produkt hero */}
            <div className="product-hero">
              {openSubmission.ai_parsed_data?.product_image_base64
                ? <img src={`data:image/jpeg;base64,${openSubmission.ai_parsed_data.product_image_base64}`} className="product-hero-img" alt="Produkt" />
                : <div className="product-hero-img-placeholder">{getProductIcon({ name: editingSubmission.name })}</div>
              }
              <div className="product-hero-body">
                <div style={{ fontSize:10, fontWeight:700, color:"var(--amber)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>⏳ Afventer godkendelse</div>
                <div style={{ fontSize:11, color:"var(--muted)", marginBottom:4 }}>EAN: {openSubmission.ean}</div>
                <div style={{ fontSize:11, color:"var(--muted)" }}>Indsendt: {new Date(openSubmission.created_at).toLocaleDateString("da-DK")}</div>
              </div>
            </div>

            {/* OCR billede hvis tilgængeligt */}
            {openSubmission.raw_label_image && (
              <div className="card">
                <div className="card-lbl">📸 Foto af ingrediensliste</div>
                <img
                  src={`data:image/jpeg;base64,${openSubmission.raw_label_image}`}
                  alt="Ingrediensliste"
                  style={{ width:"100%", borderRadius:8, objectFit:"contain", maxHeight:220 }}
                />
              </div>
            )}

            {/* Redigérbart produktnavn og brand */}
            <div className="card">
              <div className="card-lbl">Produktinfo — kan redigeres</div>
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:11, color:"var(--muted)", marginBottom:4, fontWeight:600 }}>Produktnavn</div>
                <input className="field" placeholder="Produktnavn…" value={editingSubmission.name}
                  onChange={e => setEditingSubmission(s => ({ ...s, name: e.target.value }))} />
              </div>
              <div>
                <div style={{ fontSize:11, color:"var(--muted)", marginBottom:4, fontWeight:600 }}>Brand</div>
                <input className="field" placeholder="Brand / Mærke…" value={editingSubmission.brand}
                  onChange={e => setEditingSubmission(s => ({ ...s, brand: e.target.value }))} />
              </div>
            </div>

            {/* Ingredienser fra OCR */}
            {openSubmission.ocr_raw_text && (
              <div className="card">
                <div className="card-lbl" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span>Ingredienser fra OCR</span>
                  <button
                    className="btn btn-sm"
                    style={{ fontSize:11, background:"var(--green-lt)", color:"var(--green)", border:"1px solid var(--green-mid)" }}
                    onClick={() => cleanOcrWithAI(openSubmission.ocr_raw_text)}
                    disabled={cleaningOcr}
                  >
                    {cleaningOcr ? "🤖 Renskriver…" : "🤖 Renskiv med AI"}
                  </button>
                </div>

                {/* Rå OCR tekst */}
                <div style={{ marginBottom: cleanedOcrText ? 12 : 0 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:4 }}>Rå OCR tekst</div>
                  <div style={{ fontSize:12, color:"var(--muted2)", lineHeight:1.7, background:"var(--paper2)", borderRadius:8, padding:"10px", maxHeight:120, overflowY:"auto" }}>
                    {openSubmission.ocr_raw_text}
                  </div>
                </div>

                {/* AI renskrivet tekst */}
                {cleanedOcrText && (
                  <div style={{ borderTop:"1px solid var(--border)", paddingTop:12 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:"var(--green)", textTransform:"uppercase", letterSpacing:".5px", marginBottom:4 }}>🤖 AI renskrivet — tjek at intet er fjernet eller tilføjet</div>
                    <div style={{ background:"var(--green-lt)", borderRadius:8, padding:"10px", marginBottom:8 }}>
                      <IngredientsList text={cleanedOcrText} allergenFlags={editingSubmission.allergen_flags} />
                    </div>
                    <button
                      className="btn btn-sm"
                      style={{ fontSize:11, width:"100%", background:"var(--green)", color:"#fff", border:"none" }}
                      onClick={() => setEditingSubmission(s => ({ ...s, ingredients_text: cleanedOcrText }))}
                    >
                      ✓ Brug denne version
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Allergenflags — redigérbare */}
            <div className="card">
              <div className="card-lbl">Allergener — klik for at ændre</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {ALLERGENS.map(a => {
                  const val = editingSubmission.allergen_flags[a.id] || "no";
                  const next = val==="no" ? "yes" : val==="yes" ? "traces" : "no";
                  const style = val==="yes"
                    ? { background:"var(--red-lt)", color:"var(--red)", border:"1.5px solid var(--red-md)", fontWeight:700 }
                    : val==="traces"
                    ? { background:"var(--amber-lt)", color:"var(--amber)", border:"1.5px solid var(--amber-md)", fontWeight:700 }
                    : { background:"var(--paper2)", color:"var(--muted)", border:"1px solid var(--border)" };
                  return (
                    <button key={a.id} onClick={() => setEditingSubmission(s => ({ ...s, allergen_flags: { ...s.allergen_flags, [a.id]: next } }))}
                      style={{ ...style, borderRadius:8, padding:"8px 10px", fontSize:12, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:6 }}>
                      <span>{a.emoji}</span>
                      <span style={{ flex:1 }}>{a.label}</span>
                      <span style={{ fontSize:10, opacity:.7 }}>{val==="yes"?"✓ Ja":val==="traces"?"~ Spor":"✗ Nej"}</span>
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize:11, color:"var(--muted)", marginTop:8, fontStyle:"italic" }}>Klik én gang = Ja, igen = Spor, igen = Nej</div>
            </div>

            {/* Ansvarsfraskrivelse */}
            <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"10px 14px", background:"var(--amber-lt)", border:"1px solid var(--amber-md)", borderRadius:10, marginBottom:10 }}>
              <span style={{ fontSize:14, flexShrink:0 }}>⚠️</span>
              <div style={{ fontSize:11, color:"var(--amber)", lineHeight:1.5, fontWeight:600 }}>
                Resultater er vejledende og kan indeholde fejl. Tjek altid selv ved alvorlige allergier.
              </div>
            </div>

            {/* Handlinger */}
            <div className="card">
              <div className="card-lbl">Handlinger</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <button className="btn btn-primary btn-full" onClick={() => updateSubmissionAndApprove(openSubmission, editingSubmission)}>
                  ✅ Godkend og opret produkt
                </button>
                <button className="btn btn-outline btn-full" style={{ color:"var(--red)", borderColor:"var(--red)" }}
                  onClick={() => { rejectSubmission(openSubmission.id); setOpenSubmission(null); setEditingSubmission(null); }}>
                  ❌ Afvis indsendelse
                </button>
                <button className="btn btn-ghost btn-full btn-sm" onClick={() => { setOpenSubmission(null); setEditingSubmission(null); }}>
                  Annullér
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SIDE ID — vises på alle sider */}
        <PageID screen={screen} />

        {/* ══ FAVORITTER ══ */}
        {screen === SCREENS.FAVORITES && (
          <div className="screen fade-in">
            <div className="screen-title">★ Favoritter</div>

            {/* Seneste scanninger */}
            {history.filter(h => h.result !== "not_found" && (h.products?.name || h.name)).length > 0 && (
              <div className="card" style={{ marginBottom:10 }}>
                <div className="card-lbl" style={{ display:"flex", justifyContent:"space-between" }}>
                  <span>Senest scannet</span>
                  <span style={{ cursor:"pointer", color:"var(--green)", fontWeight:700, fontSize:11 }} onClick={() => { loadHistory(); setScreen(SCREENS.HISTORY); }}>Se alle</span>
                </div>
                {history.filter(h => h.result !== "not_found").slice(0,3).map((h,i) => {
                  const s = h.result || h.status;
                  const name = h.products?.name || h.name || h.ean_scanned || "Ukendt";
                  const prod = { name, brand: h.products?.brand||h.brand||"", image_url: h.products?.image_url||null };
                  const color = s==="safe" ? "var(--green)" : s==="danger" ? "var(--red)" : "var(--amber)";
                  const bg = s==="safe" ? "var(--green-lt)" : s==="danger" ? "var(--red-lt)" : "var(--amber-lt)";
                  return (
                    <div key={i} className="hist-row" style={{ cursor:"pointer" }} onClick={() => {
                      setScanResult({...h, code:h.ean_scanned||h.code, name, brand:h.products?.brand||h.brand||"",
                        image_url:h.products?.image_url||null,
                        headline:s==="safe"?"Sikkert produkt":s==="danger"?"Indeholder allergen!":"Mulige spor",
                        flags:[], summary:"", allergen_flags:h.flags_triggered||{} });
                      setScreen(SCREENS.RESULT);
                    }}>
                      <ProductImage product={prod} size={36} />
                      <div className="hist-info" style={{ marginLeft:8 }}>
                        <div className="hist-name">{name}</div>
                        <div className="hist-time">{timeAgo(h.scanned_at||h.timestamp)}</div>
                      </div>
                      <div style={{ fontSize:11, fontWeight:700, color, background:bg, border:`1px solid ${color}`, borderRadius:20, padding:"3px 10px", flexShrink:0 }}>
                        {s==="safe"?"Sikker":s==="danger"?"Farlig":"Advarsel"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Gemte favoritter */}
            {favorites.length > 0 && <div className="card-lbl" style={{ marginBottom:6 }}>Gemte produkter</div>}
            {favorites.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">★</span>
                <div className="empty-txt">Ingen favoritter endnu</div>
                <div className="empty-sub">Tryk ★ på et produkt for at gemme det her</div>
              </div>
            )}
            {favorites.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon">★</span>
                <div className="empty-txt">Ingen favoritter endnu</div>
                <div className="empty-sub">Tryk ★ på et produkt for at gemme det her</div>
              </div>
            )}
            {favorites.map((f,i) => (
              <div key={i} className="card" style={{ padding:"12px 14px", cursor:"pointer", marginBottom:8 }}
                onClick={() => {
                  // Byg altid et komplet scanResult fra gemt favorit-data
                  const flags = f.allergen_flags || {};
                  const { status, matchedDanger, matchedWarning, hasUnknown } = compareAllergens(flags, activeIds);
                  setScanResult({
                    ...f,
                    code: f.ean || f.code,
                    status: f.status || status,
                    headline: status==="danger"?"Indeholder allergen! 🚫":status==="warning"?"Mulige spor ⚠️":"Sikkert produkt ✅",
                    summary: "",
                    flags: [],
                    allergen_flags: flags,
                    matchedDanger: matchedDanger,
                    matchedWarning: matchedWarning,
                    hasUnknown,
                  });
                  setScreen(SCREENS.RESULT);
                }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <ProductImage product={f} size={48} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{f.name || "Ukendt"}</div>
                    {f.brand && <div style={{ fontSize:12, color:"var(--muted)", marginTop:1 }}>{f.brand}</div>}
                    <div style={{ marginTop:6 }}>
                      <ProfileBadges allergenFlags={f.allergen_flags||{}} allergens={allergens} customAllerg={customAllerg} family={family} activeProfiles={activeProfiles} size={22} />
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize:12, flexShrink:0 }}
                    onClick={e => { e.stopPropagation(); toggleFavorite(f); }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ MADPAS ══ */}
        {screen === SCREENS.MADPAS && (
          <div className="mp-page fade-in">

            {/* TJENER-VISNING — fullscreen overlay, identisk med madpas */}
            {madpasWaiterView && (() => {
              const lang = madpasLang;
              const rtl = MADPAS_LANGUAGES.find(l => l.code === lang)?.rtl;
              const helloText = { en:"I have food allergies.", de:"Ich habe Lebensmittelallergien.", fr:"J'ai des allergies alimentaires.", es:"Tengo alergias alimentarias.", it:"Ho allergie alimentari.", nl:"Ik heb voedselallergieën.", pt:"Tenho alergias alimentares.", pl:"Mam alergie pokarmowe.", ja:"食物アレルギーがあります。", zh:"我有食物过敏。", ar:"لدي حساسية غذائية.", tr:"Gıda alerjilerim var.", sv:"Jag har matallergier.", no:"Jeg har matallergier.", th:"ฉันมีอาการแพ้อาหาร", el:"Έχω αλλεργίες τροφίμων.", da:"Jeg har fødevareallergier." };
              const cannotLabel = { en:"I cannot eat:", de:"Ich kann nicht essen:", fr:"Je ne peux pas manger :", es:"No puedo comer:", it:"Non posso mangiare:", nl:"Ik kan niet eten:", pt:"Não posso comer:", pl:"Nie mogę jeść:", ja:"食べられません：", zh:"我不能吃：", ar:"لا أستطيع تناول:", tr:"Yiyemiyorum:", sv:"Jag kan inte äta:", no:"Jeg kan ikke spise:", th:"ฉันไม่สามารถกิน:", el:"Δεν μπορώ να φάω:", da:"Jeg kan ikke spise:" };
              const helpText = { en:"Can you help me find something safe?", de:"Können Sie mir helfen?", fr:"Pouvez-vous m'aider ?", es:"¿Puede ayudarme?", it:"Può aiutarmi?", nl:"Kunt u mij helpen?", pt:"Pode ajudar-me?", pl:"Czy może mi pomóc?", ja:"手伝っていただけますか？", zh:"您能帮助我吗？", ar:"هل يمكنك مساعدتي؟", tr:"Yardım edebilir misiniz?", sv:"Kan du hjälpa mig?", no:"Kan du hjelpe meg?", th:"คุณช่วยฉันได้ไหม?", el:"Μπορείτε να με βοηθήσετε;", da:"Kan du hjælpe mig?" };
              const productLabel = { da:"Fx i", en:"E.g. in", de:"Z.B. in", fr:"Ex. dans", es:"Ej. en", it:"Es. in", nl:"Bijv. in", pt:"Ex. em", pl:"Np. w", sv:"T.ex. i", no:"F.eks. i", ja:"例えば", zh:"例如", ar:"مثلاً في", tr:"Örn.", th:"เช่นใน", el:"Π.χ." };
              const ingredientLabel = { da:"Se efter", en:"Look for", de:"Achten auf", fr:"Chercher", es:"Buscar", it:"Cercare", nl:"Let op", pt:"Procurar", pl:"Szukaj", sv:"Se efter", no:"Se etter", ja:"確認を", zh:"注意", ar:"ابحث عن", tr:"Ara", th:"ดูหา", el:"Ψάξτε" };
              const langInfo = MADPAS_LANGUAGES.find(l => l.code === lang);
              return (
                <div style={{ position:"fixed", inset:0, zIndex:9999, background:"var(--paper)", display:"flex", flexDirection:"column" }} dir={rtl ? "rtl" : "ltr"}>

                  {/* Header */}
                  <div style={{ padding:"14px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:20 }}>{langInfo?.flag}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:"var(--muted)" }}>{langInfo?.name}</span>
                    </div>
                    <button onClick={() => { setMadpasWaiterView(false); if(madpasSpeaking){ window.speechSynthesis?.cancel(); setMadpasSpeaking(false); } }} style={{ background:"var(--paper2)", border:"1px solid var(--border2)", borderRadius:8, padding:"6px 12px", fontSize:13, fontWeight:700, color:"var(--ink2)", cursor:"pointer", fontFamily:"var(--f)" }}>← Tilbage</button>
                  </div>

                  {/* Indhold — scrollbart, identisk med madpas */}
                  <div style={{ flex:1, overflowY:"auto", padding:"24px 20px" }}>
                    <div style={{ fontSize:20, color:"var(--ink)", fontWeight:500, marginBottom:20, lineHeight:1.5 }}>
                      {helloText[lang] || helloText.en}
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:16 }}>
                      {cannotLabel[lang] || cannotLabel.en}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column" }}>
                      {[...allergens, ...customAllerg.map(c => ({ custom:true, label:c }))].map((item, i, arr) => {
                        const isLast = i === arr.length - 1;
                        if (typeof item === "string") {
                          const a = ALLERGENS.find(x => x.id === item);
                          if (!a) return null;
                          const t = ALLERGEN_T[item]?.[lang] || ALLERGEN_T[item]?.en;
                          const ex = ALLERGEN_EXAMPLES[item];
                          const exProducts = ex?.products?.[lang] || ex?.products?.en || [];
                          const exIngredients = ex?.ingredients?.[lang] || ex?.ingredients?.en || [];
                          return (
                            <div key={i} style={{ padding:"16px 0", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                              <div style={{ fontSize:22, fontWeight:800, color:"var(--ink)", marginBottom: ex ? 10 : 0 }}>
                                {t?.n || a.label}
                              </div>
                              {ex && (
                                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                  <div style={{ fontSize:12, color:"var(--muted)" }}>
                                    {productLabel[lang] || productLabel.en}: <span style={{ color:"var(--ink2)", fontWeight:600 }}>{exProducts.slice(0,3).join(", ")}</span>
                                  </div>
                                  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                                    <span style={{ fontSize:12, color:"var(--muted)" }}>{ingredientLabel[lang] || ingredientLabel.en}:</span>
                                    {exIngredients.slice(0,4).map((ing, j) => (
                                      <span key={j} style={{ fontSize:11, fontWeight:700, padding:"3px 9px", background:"var(--paper2)", color:"var(--ink2)", border:"1px solid var(--border2)", borderRadius:100 }}>{ing}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div key={i} style={{ fontSize:22, fontWeight:800, color:"var(--ink)", padding:"16px 0", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                            {item.label}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize:16, color:"var(--muted2)", margin:"20px 0 8px", lineHeight:1.6 }}>
                      {helpText[lang] || helpText.en}
                    </div>
                  </div>

                  {/* Footer med stor oplæs-knap */}
                  <div style={{ padding:"16px 20px 32px", borderTop:"1px solid var(--border)", flexShrink:0 }}>
                    {window.speechSynthesis && (
                      <button onClick={madpasSpeak} style={{
                        width:"100%", background: madpasSpeaking ? "var(--amber)" : "var(--green)",
                        border:"none", borderRadius:14, padding:"18px", fontSize:20, fontWeight:800,
                        color:"#fff", cursor:"pointer", fontFamily:"var(--f)",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:12,
                        boxShadow: madpasSpeaking ? "0 4px 16px rgba(217,119,6,.35)" : "0 4px 16px rgba(34,197,94,.35)",
                        marginBottom:10,
                      }}>
                        <span style={{ fontSize:24 }}>{madpasSpeaking ? "⏹" : "🔊"}</span>
                        {madpasSpeaking ? "Stop oplæsning" : "Oplæs højt"}
                      </button>
                    )}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      <EatSafeLogo size={14} variant="light" />
                      <span style={{ fontSize:11, color:"var(--muted)", fontWeight:600 }}>EatSafe</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="mp-scroll">

              {/* HEADER */}
              <div className="mp-head">
                <div className="mp-title">Madpas</div>
                <div className="mp-subtitle">Vis dette kort til restaurantpersonale for at forklare dine allergier på deres sprog</div>

                {/* Sprog-dropdown */}
                <div className="mp-section-lbl">VÆLG SPROG</div>
                {!langOpen ? (
                  <div className="mp-lang-dropdown" onClick={() => setLangOpen(true)}>
                    <span className="mp-lang-flag">{MADPAS_LANGUAGES.find(l=>l.code===madpasLang)?.flag||"🌍"}</span>
                    <span className="mp-lang-name">{MADPAS_LANGUAGES.find(l=>l.code===madpasLang)?.name||"English"}</span>
                    <span className="mp-lang-arrow">▾</span>
                  </div>
                ) : (
                  <div className="mp-lang-list">
                    {MADPAS_LANGUAGES.map(l => (
                      <div key={l.code} className={`mp-lang-opt${madpasLang===l.code?" on":""}`}
                        onClick={() => { setMadpasLang(l.code); localStorage.setItem("as_madpas_lang", l.code); setLangOpen(false); if (madpasSpeaking) { window.speechSynthesis.cancel(); setMadpasSpeaking(false); }}}>
                        <span style={{ fontSize:20 }}>{l.flag}</span>
                        <span style={{ fontSize:14, fontWeight:madpasLang===l.code?800:600, color:madpasLang===l.code?"var(--green)":"var(--ink)" }}>{l.name}</span>
                        {madpasLang===l.code && <span style={{ marginLeft:"auto", color:"var(--green)" }}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tom state */}
              {allergens.length === 0 && customAllerg.length === 0 && (
                <div className="empty-state" style={{ paddingTop:32 }}>
                  <span className="empty-icon">🌾</span>
                  <div className="empty-txt">Ingen allergier registreret</div>
                  <div className="empty-sub">Tilføj dine allergier under Profil → Mine allergier</div>
                </div>
              )}

              {/* ALLERGEN LISTE */}
              {(allergens.length > 0 || customAllerg.length > 0) && (() => {
                const lang = madpasLang;
                const rtl = MADPAS_LANGUAGES.find(l => l.code === lang)?.rtl;
                const helloText = { en:"I have food allergies.", de:"Ich habe Lebensmittelallergien.", fr:"J'ai des allergies alimentaires.", es:"Tengo alergias alimentarias.", it:"Ho allergie alimentari.", nl:"Ik heb voedselallergieën.", pt:"Tenho alergias alimentares.", pl:"Mam alergie pokarmowe.", ja:"食物アレルギーがあります。", zh:"我有食物过敏。", ar:"لدي حساسية غذائية.", tr:"Gıda alerjilerim var.", sv:"Jag har matallergier.", no:"Jeg har matallergier.", th:"ฉันมีอาการแพ้อาหาร", el:"Έχω αλλεργίες τροφίμων.", da:"Jeg har fødevareallergier." };
                const cannotLabel = { en:"I cannot eat:", de:"Ich kann nicht essen:", fr:"Je ne peux pas manger :", es:"No puedo comer:", it:"Non posso mangiare:", nl:"Ik kan niet eten:", pt:"Não posso comer:", pl:"Nie mogę jeść:", ja:"食べられません：", zh:"我不能吃：", ar:"لا أستطيع تناول:", tr:"Yiyemiyorum:", sv:"Jag kan inte äta:", no:"Jeg kan ikke spise:", th:"ฉันไม่สามารถกิน:", el:"Δεν μπορώ να φάω:", da:"Jeg kan ikke spise:" };
                const helpText = { en:"Can you help me find something safe?", de:"Können Sie mir helfen?", fr:"Pouvez-vous m'aider ?", es:"¿Puede ayudarme?", it:"Può aiutarmi?", nl:"Kunt u mij helpen?", pt:"Pode ajudar-me?", pl:"Czy może mi pomóc?", ja:"手伝っていただけますか？", zh:"您能帮助我吗？", ar:"هل يمكنك مساعدتي؟", tr:"Yardım edebilir misiniz?", sv:"Kan du hjälpa mig?", no:"Kan du hjelpe meg?", th:"คุณช่วยฉันได้ไหม?", el:"Μπορείτε να με βοηθήσετε;", da:"Kan du hjælpe mig?" };
                return (
                  <div style={{ paddingBottom:8 }} dir={rtl ? "rtl" : "ltr"}>

                    {/* Intro */}
                    <div style={{ fontSize:20, color:"var(--ink)", fontWeight:500, marginBottom:20, lineHeight:1.5 }}>
                      {helloText[lang] || helloText.en}
                    </div>

                    {/* Label */}
                    <div style={{ fontSize:12, fontWeight:700, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:16 }}>
                      {cannotLabel[lang] || cannotLabel.en}
                    </div>

                    {/* Allergen liste */}
                    <div style={{ display:"flex", flexDirection:"column" }}>
                      {[...allergens, ...customAllerg.map(c => ({ custom:true, label:c }))].map((item, i, arr) => {
                        const isLast = i === arr.length - 1;
                        if (typeof item === "string") {
                          const a = ALLERGENS.find(x => x.id === item);
                          if (!a) return null;
                          const t = ALLERGEN_T[item]?.[lang] || ALLERGEN_T[item]?.en;
                          const ex = ALLERGEN_EXAMPLES[item];
                          const exProducts = ex?.products?.[lang] || ex?.products?.en || [];
                          const exIngredients = ex?.ingredients?.[lang] || ex?.ingredients?.en || [];
                          const productLabel = { da:"Fx i", en:"E.g. in", de:"Z.B. in", fr:"Ex. dans", es:"Ej. en", it:"Es. in", nl:"Bijv. in", pt:"Ex. em", pl:"Np. w", sv:"T.ex. i", no:"F.eks. i", ja:"例えば", zh:"例如在", ar:"مثلاً في", tr:"Örn.", th:"เช่นใน", el:"Π.χ. σε" };
                          const ingredientLabel = { da:"Se efter", en:"Look for", de:"Achten auf", fr:"Chercher", es:"Buscar", it:"Cercare", nl:"Let op", pt:"Procurar", pl:"Szukaj", sv:"Se efter", no:"Se etter", ja:"確認を", zh:"注意", ar:"ابحث عن", tr:"Ara", th:"ดูหา", el:"Ψάξτε" };
                          return (
                            <div key={i} style={{ padding:"16px 0", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                              <div style={{ fontSize:22, fontWeight:800, color:"var(--ink)", marginBottom: ex ? 10 : 0 }}>
                                {t?.n || a.label}
                              </div>
                              {ex && (
                                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                  <div style={{ fontSize:12, color:"var(--muted)" }}>
                                    {productLabel[lang] || productLabel.en}: <span style={{ color:"var(--ink2)", fontWeight:600 }}>{exProducts.slice(0,3).join(", ")}</span>
                                  </div>
                                  <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                                    <span style={{ fontSize:12, color:"var(--muted)" }}>{ingredientLabel[lang] || ingredientLabel.en}:</span>
                                    {exIngredients.slice(0,4).map((ing, j) => (
                                      <span key={j} style={{ fontSize:11, fontWeight:700, padding:"3px 9px", background:"var(--paper2)", color:"var(--ink2)", border:"1px solid var(--border2)", borderRadius:100 }}>{ing}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <div key={i} style={{ fontSize:22, fontWeight:800, color:"var(--ink)", padding:"16px 0", borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
                            {item.label}
                          </div>
                        );
                      })}
                    </div>

                    {/* Hjælpetekst */}
                    <div style={{ fontSize:16, color:"var(--muted2)", margin:"20px 0 24px", lineHeight:1.6 }}>
                      {helpText[lang] || helpText.en}
                    </div>

                    {/* VIS TIL TJENER */}
                    <button className="mp-big-btn" onClick={() => setMadpasWaiterView(true)}>
                      <span style={{ fontSize:18 }}>⤢</span>
                      Vis til tjener
                    </button>

                    <div style={{ textAlign:"center", fontSize:11, color:"var(--muted)", marginTop:10 }}>
                      🇩🇰 EatSafe · {new Date().toLocaleDateString("da-DK")}
                    </div>
                  </div>
                );
              })()}

            </div>
          </div>
        )}
        {/* ══ OPSKRIFTER ══ */}
        {screen === SCREENS.RECIPES && (
          <div className="screen fade-in">
            <div style={{ textAlign:"center", padding:"60px 24px 32px" }}>
              <div style={{ fontSize:64, marginBottom:20 }}>🍽️</div>
              <div style={{ fontSize:22, fontWeight:900, color:"var(--ink)", letterSpacing:"-.4px", marginBottom:10 }}>Opskrifter</div>
              <div style={{ fontSize:14, color:"var(--muted2)", lineHeight:1.6, marginBottom:32 }}>
                Snart kan du finde og filtrere opskrifter baseret på dine allergier og familiens behov.
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  ["🔎","Filtrer på dine allergener","Find opskrifter der er sikre for hele familien"],
                  ["👨‍👩‍👧","Tilpasset til familien","Se hvem der kan spise hvad på én gang"],
                  ["🛒","Direkte til indkøbslisten","Tilføj ingredienser med ét tryk"],
                ].map(([icon, title, text]) => (
                  <div key={title} style={{ display:"flex", gap:14, alignItems:"center", background:"#fff", border:"1px solid var(--border)", borderRadius:12, padding:"12px 14px", textAlign:"left" }}>
                    <div style={{ width:40, height:40, background:"var(--paper2)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"var(--ink)" }}>{title}</div>
                      <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>{text}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:28, background:"var(--green-lt)", border:"1px solid var(--green-mid)", borderRadius:12, padding:"12px 16px" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--green)" }}>🚧 Under udvikling</div>
                <div style={{ fontSize:11, color:"var(--muted2)", marginTop:4 }}>Opskriftsfunktionen er på vej. Følg med!</div>
              </div>
            </div>
          </div>
        )}

        {/* ══ REDIGER PROFIL ══ */}
        {screen === SCREENS.EDITPROFILE && (
          <div className="screen fade-in">
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"16px 0 20px" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setScreen(SCREENS.PROFILE)}>← Tilbage</button>
              <div style={{ fontSize:18, fontWeight:800, color:"var(--ink)" }}>Rediger profil</div>
            </div>

            {/* Navn og kontakt */}
            <div className="card" style={{ marginBottom:10 }}>
              <div className="card-lbl">Personlige oplysninger</div>
              {[["Dit navn","text","Fx. Anna Hansen","name"],["Telefon","tel","+45 12 34 56 78","phone"],["Alder","number","Fx. 32","age"]].map(([lbl,type,ph,key]) => (
                <div key={key} style={{ marginBottom:10 }}>
                  <label className="field-lbl">{lbl}</label>
                  <input className="field" type={type} placeholder={ph} value={user[key]||""} onChange={e => setUser(u => ({ ...u, [key]: e.target.value }))} />
                </div>
              ))}
              <button className="btn btn-primary btn-full" onClick={async () => {
                try {
                  await apiCall(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
                    method:"PATCH",
                    headers:{ ...makeHeaders(accessToken), "Prefer":"return=representation" },
                    body:JSON.stringify({ name:user.name, phone:user.phone||null, age:user.age?parseInt(user.age):null }),
                  });
                } catch {}
              }}>Gem oplysninger</button>
            </div>

            {/* Allergier */}
            <div className="card" style={{ marginBottom:10 }}>
              <div className="card-lbl">Mine allergier</div>
              <div className="chip-grid" style={{ marginBottom:10 }}>
                {ALLERGENS.map(a => { const on = allergens.includes(a.id); return (
                  <div key={a.id} className={`chip${on?" on":""}`} onClick={() => setAllergens(p => on ? p.filter(x => x !== a.id) : [...p, a.id])}>
                    <span>{a.emoji}</span><span style={{ flex:1 }}>{a.label}</span>{on && <div className="chip-check">✓</div>}
                  </div>
                );})}
              </div>
              <div className="card-lbl">Andre intoleranser</div>
              <div className="input-row" style={{ marginBottom: customAllerg.length ? 8 : 0 }}>
                <input className="field" placeholder="Fx. Fructose…" value={customInput} onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => { if(e.key==="Enter"&&customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}} />
                <button className="btn btn-outline btn-sm" onClick={() => { if(customInput.trim()){ setCustomAllerg(c=>[...c,customInput.trim()]); setCustomInput(""); }}}>+</button>
              </div>
              {customAllerg.length > 0 && <div className="tags">{customAllerg.map((a,i) => <div key={i} className="tag">✏️ {a}<span className="tag-x" onClick={() => setCustomAllerg(c=>c.filter((_,j)=>j!==i))}>×</span></div>)}</div>}
              <button className="btn btn-primary btn-full" style={{ marginTop:10 }} onClick={async () => {
                try {
                  await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens?user_id=eq.${userId}`, { method:"DELETE", headers:makeHeaders(accessToken) });
                  for(const a of allergens) await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, { method:"POST", headers:makeHeaders(accessToken), body:JSON.stringify({user_id:userId,allergen:a,type:"allergen"}) });
                  for(const c of customAllerg) await apiCall(`${SUPABASE_URL}/rest/v1/user_allergens`, { method:"POST", headers:makeHeaders(accessToken), body:JSON.stringify({user_id:userId,allergen:c,type:"custom"}) });
                  alert("Allergier gemt!");
                } catch {}
              }}>Gem allergier</button>
            </div>

            <button className="btn btn-ghost btn-full" style={{ marginBottom:16 }} onClick={() => setScreen(SCREENS.PROFILE)}>Færdig</button>
          </div>
        )}

        {/* BUNDNAVIGATION */}
        {!isOnboard && !madpasWaiterView && (
          <nav className="bottom-nav">
            {[
              [SCREENS.HOME,    "🏠", "Hjem"],
              [SCREENS.RECIPES, "🍽️", "Opskrifter"],
              [SCREENS.LIST,    "🛒", "Liste"],
              [SCREENS.PROFILE, "👤", "Profil"],
            ].map(([s,icon,lbl]) => (
              <div key={s} className={`nav-item${(
                screen===s ||
                (screen===SCREENS.RESULT && s===SCREENS.HOME) ||
                (screen===SCREENS.NOTFOUND && s===SCREENS.HOME) ||
                (screen===SCREENS.SUBMITTED && s===SCREENS.HOME) ||
                (screen===SCREENS.SCAN && s===SCREENS.HOME) ||
                (screen===SCREENS.SEARCH && s===SCREENS.HOME) ||
                (screen===SCREENS.HISTORY && s===SCREENS.PROFILE) ||
                (screen===SCREENS.FAVORITES && s===SCREENS.PROFILE) ||
                (screen===SCREENS.MADPAS && s===SCREENS.PROFILE) ||
                (screen===SCREENS.FAMILY && s===SCREENS.PROFILE) ||
                (screen===SCREENS.ADMIN && s===SCREENS.PROFILE)
              )?" active":""}`} onClick={() => {
                setScreen(s);
              }}>
                <div className="nav-icon">{icon}</div>
                <div className="nav-lbl">{lbl}</div>
              </div>
            ))}
          </nav>
        )}
      </div>
    </>
  );
}